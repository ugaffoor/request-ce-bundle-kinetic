import { eventChannel } from 'redux-saga';
import { call, cancelled, put, take, takeEvery } from 'redux-saga/effects';
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
} from 'firebase/firestore';
import { types, actions } from '../modules/conversations';
import { getConversationStore } from '../../lib/firebase';
import { describeAuthState } from '../../lib/firebaseAuth';
import {
  announcementThreadId,
  announcementThreadName,
  conversationId,
  broadcastConversationId,
  SEND_KINDS,
  CONVERSATIONS_COLLECTION,
  CONVERSATION_FIELDS,
  MESSAGES_SUBCOLLECTION,
  MESSAGE_FIELDS,
  normaliseConversation,
  normaliseMessage,
} from '../../lib/conversationSchema';

/**
 * Conversations involving one participant, addressed by the id Firestore
 * uses -- a raw Kinetic member id for a student, or staff_{space}_{username}
 * for a staff member. Passing no id listens to every conversation the rules
 * allow, which is what the inbox and conversation list want.
 */
export const conversationsQuery = (store, participantId) => {
  const conversations = collection(store, CONVERSATIONS_COLLECTION);

  // Matches useConversations() in the mobile app exactly, including the
  // orderBy: that is the shape firestore.indexes.json declares an index for
  // (participantIds CONTAINS + updatedAt DESC), and the shape these rules
  // were written against.
  return participantId
    ? query(
        conversations,
        where(
          CONVERSATION_FIELDS.participantIds,
          'array-contains',
          participantId,
        ),
        orderBy(CONVERSATION_FIELDS.updatedAt, 'desc'),
      )
    : query(conversations);
};

/**
 * Messages within one conversation, oldest first so the thread reads top to
 * bottom without the UI having to re-sort.
 */
export const messagesQuery = (store, conversationDocId) =>
  query(
    collection(
      store,
      CONVERSATIONS_COLLECTION,
      conversationDocId,
      MESSAGES_SUBCOLLECTION,
    ),
    orderBy(MESSAGE_FIELDS.createdAt, 'asc'),
  );

/**
 * Wraps a Firestore onSnapshot listener in a saga event channel, following
 * the same shape as sagas/discussions.js -- the snapshot callback plays the
 * role of socket.onmessage, and unsubscribe() the role of socket.close().
 *
 * Because this is a live listener rather than a fetch, a message sent from
 * a student's phone reaches the portal without a refresh.
 */
export function registerSnapshotChannel(firestoreQuery, mapSnapshot) {
  return eventChannel(emit => {
    const unsubscribe = onSnapshot(
      firestoreQuery,
      snapshot => emit({ data: mapSnapshot(snapshot) }),
      error => emit({ error }),
    );

    return unsubscribe;
  });
}

export function* watchConversationSnapshots({ payload } = {}) {
  const store = getConversationStore();

  if (!store) {
    yield put(
      actions.setConversationsError(
        'Firebase is not configured for this space.',
      ),
    );
    return;
  }

  const viewerId = payload && payload.participantId;
  const channel = yield call(
    registerSnapshotChannel,
    conversationsQuery(store, viewerId),
    snapshot =>
      snapshot.docs.map(doc =>
        normaliseConversation(doc.id, doc.data(), viewerId),
      ),
  );

  try {
    while (true) {
      const event = yield take(channel);
      if (event.error) {
        const detail = yield call(describeAuthState);
        yield put(
          actions.setConversationsError(`${event.error.message} (${detail})`),
        );
      } else {
        yield put(actions.setConversations(event.data));
      }
    }
  } finally {
    if (yield cancelled()) {
      channel.close();
    }
  }
}

/**
 * The school's single announcement thread.
 *
 * Followed by id rather than by query: it deliberately carries no
 * participantIds, and the conversation query matches on participation, so no
 * query can ever return it. Without this listener the thread is written and
 * protected correctly but never appears anywhere.
 *
 * Failures are deliberately swallowed. A school that has never posted an
 * announcement has no such document, and rules that do not yet permit reading
 * one are a deployment state rather than a bug -- neither should take the rest
 * of the conversation list down with it.
 */
export function* watchAnnouncementThread({ payload } = {}) {
  const store = getConversationStore();
  const spaceSlug = payload && payload.spaceSlug;
  const domain = payload && payload.domain;
  const viewerId = payload && payload.participantId;

  if (!store || !spaceSlug || !domain) {
    return;
  }

  const channel = yield call(
    registerSnapshotChannel,
    doc(
      store,
      CONVERSATIONS_COLLECTION,
      announcementThreadId(spaceSlug, domain),
    ),
    snapshot =>
      snapshot.exists()
        ? normaliseConversation(snapshot.id, snapshot.data(), viewerId)
        : null,
  );

  try {
    while (true) {
      const event = yield take(channel);
      if (event.error) {
        console.warn(
          '[conversations] announcement thread unavailable',
          event.error,
        );
        yield put(actions.setAnnouncementThread(null));
      } else {
        yield put(actions.setAnnouncementThread(event.data));
      }
    }
  } finally {
    if (yield cancelled()) {
      channel.close();
    }
  }
}

export function* watchMessageSnapshots({ payload } = {}) {
  const store = getConversationStore();

  if (!store || !payload || !payload.conversationId) {
    return;
  }

  const channel = yield call(
    registerSnapshotChannel,
    messagesQuery(store, payload.conversationId),
    snapshot => snapshot.docs.map(doc => normaliseMessage(doc.id, doc.data())),
  );

  try {
    while (true) {
      const event = yield take(channel);
      yield put(
        event.error
          ? actions.setMessagesError(event.error.message)
          : actions.setMessages(event.data),
      );
    }
  } finally {
    if (yield cancelled()) {
      channel.close();
    }
  }
}

/**
 * Sends one message from a staff member to a student.
 *
 * The conversation document is written first, because firestore.rules decides
 * whether a message may be created by reading that document's participantIds
 * -- writing a message into a conversation that does not exist yet is
 * rejected. Merging rather than overwriting means a second message lands in
 * the same thread, and deriving the id from the pair (conversationId) means
 * the thread is the same one the mobile app uses.
 *
 * staffChat marks the thread as opened by staff, which waives the friends-only
 * rule so the student can reply without first being a friend. Only staff may
 * set it, which is exactly who sends from this portal.
 *
 * lastMessage, unreadCount, monitorable and hasJunior are deliberately NOT
 * written here: onChatMessageCreated owns them through the Admin SDK, and the
 * rules explicitly forbid a client asserting monitorable.
 */
/**
 * Writes one message into one conversation. Shared by the single and
 * multi-recipient paths.
 */
function* deliverTo({
  store,
  memberId,
  staffId,
  spaceSlug,
  text,
  existingConversationId,
  broadcast,
}) {
  // A broadcast MUST NOT resolve to the 1:1 pair id: that is the same
  // document as the member's ordinary conversation, and the merge below would
  // rewrite their existing chat into a broadcast.
  const id =
    existingConversationId ||
    (broadcast
      ? broadcastConversationId(memberId, staffId)
      : conversationId(memberId, staffId));

  // Only when starting a thread. Replying into an existing one must not
  // touch the conversation document: merging staffChat/participantIds onto
  // a thread the app created (a broadcast, say) would quietly rewrite what
  // that thread is.
  if (!existingConversationId) {
    // Firestore rejects undefined field values, so only send what we have.
    const conversation = {
      [CONVERSATION_FIELDS.participantIds]: [memberId, staffId],
      staffChat: true,
    };
    if (spaceSlug) {
      conversation.spaceSlug = spaceSlug;
    }
    if (broadcast) {
      // One-way: broadcastWritable() in firestore.rules permits a write only
      // from broadcastSender, so a recipient can read the thread but not
      // reply into it. That rule is the ONLY thing enforcing this -- the
      // portal hiding its reply box is a convenience, not a control.
      //
      // The BJJ Members app reads staffBroadcast: it hides these threads from
      // the recipient's Messages list and surfaces them as a broadcast
      // notification, readable in BroadcastInboxScreen. The app can post
      // broadcasts too, via the Repliable toggle on its Announcements screen.
      //
      // Named staffBroadcast because `broadcast` on a MESSAGE means something
      // else entirely -- a fanned-out announcement delivery.
      conversation.staffBroadcast = true;
      conversation.broadcastSender = staffId;
    }

    yield call(setDoc, doc(store, CONVERSATIONS_COLLECTION, id), conversation, {
      merge: true,
    });
  }

  yield call(
    addDoc,
    collection(store, CONVERSATIONS_COLLECTION, id, MESSAGES_SUBCOLLECTION),
    {
      [MESSAGE_FIELDS.body]: text,
      [MESSAGE_FIELDS.senderId]: staffId,
      // Server time, so ordering does not depend on the sender's clock.
      [MESSAGE_FIELDS.createdAt]: serverTimestamp(),
    },
  );
}

/**
 * Posts to the school's single announcement thread.
 *
 * Unlike a chat this has NO participantIds -- firestore.rules decides who may
 * read it from spaceSlug instead, which is what lets one thread serve a gym of
 * any size. The rules pin the document id, require announcement: true, and
 * reject the write outright if participantIds is present, so all three have to
 * be exactly right.
 */
function* deliverAnnouncement({ store, staffId, spaceSlug, domain, text }) {
  const id = announcementThreadId(spaceSlug, domain);

  yield call(
    setDoc,
    doc(store, CONVERSATIONS_COLLECTION, id),
    {
      announcement: true,
      spaceSlug,
      domain,
      name: announcementThreadName(spaceSlug),
      monitorable: false,
    },
    { merge: true },
  );

  yield call(
    addDoc,
    collection(store, CONVERSATIONS_COLLECTION, id, MESSAGES_SUBCOLLECTION),
    {
      [MESSAGE_FIELDS.body]: text,
      [MESSAGE_FIELDS.senderId]: staffId,
      [MESSAGE_FIELDS.createdAt]: serverTimestamp(),
    },
  );
}

/**
 * Creates a group chat and posts the first message into it.
 *
 * The id is auto-generated rather than derived: the sorted-pair scheme only
 * makes sense for a fixed two, and two groups can legitimately have the same
 * members. The creator must be among participantIds -- firestore.rules
 * requires it, and mayMessageIn() then passes on isGroup rather than needing
 * the friends-only waiver.
 */
function* deliverGroup({ store, staffId, memberIds, spaceSlug, name, text }) {
  const participantIds = [staffId].concat(
    memberIds.filter(id => id !== staffId),
  );

  const conversation = {
    [CONVERSATION_FIELDS.participantIds]: participantIds,
    name: (name || '').trim(),
    isGroup: true,
    createdBy: staffId,
    [CONVERSATION_FIELDS.updatedAt]: serverTimestamp(),
  };
  if (spaceSlug) {
    conversation.spaceSlug = spaceSlug;
  }

  const created = yield call(
    addDoc,
    collection(store, CONVERSATIONS_COLLECTION),
    conversation,
  );

  yield call(
    addDoc,
    collection(
      store,
      CONVERSATIONS_COLLECTION,
      created.id,
      MESSAGES_SUBCOLLECTION,
    ),
    {
      [MESSAGE_FIELDS.body]: text,
      [MESSAGE_FIELDS.senderId]: staffId,
      [MESSAGE_FIELDS.createdAt]: serverTimestamp(),
    },
  );
}

export function* sendMessage({ payload } = {}) {
  const store = getConversationStore();
  const {
    memberId,
    memberIds,
    staffId,
    spaceSlug,
    text,
    // 'conversation' (default), 'broadcast', or 'announcement'.
    kind,
    domain,
    groupName,
    // Set when replying into a thread that is already open. Deriving an id
    // instead would be wrong: a member who has been broadcast to shares the
    // same deterministic 1:1 id, so a derived write can land in a broadcast
    // thread rather than the conversation on screen.
    conversationId: existingConversationId,
  } =
    payload || {};

  // One recipient, several, or a reply into an open thread.
  const recipients = (memberIds && memberIds.length
    ? memberIds
    : [memberId]
  ).filter(Boolean);

  const isAnnouncement = kind === SEND_KINDS.ANNOUNCEMENT;

  if (
    !store ||
    !text ||
    !staffId ||
    // An announcement is addressed to the whole school, so it needs no
    // recipients -- but it does need to know which school.
    (isAnnouncement && (!spaceSlug || !domain)) ||
    (!isAnnouncement && !existingConversationId && recipients.length < 1)
  ) {
    yield put(
      actions.setSendError('Cannot send: the conversation is not ready.'),
    );
    return;
  }

  yield put(actions.setSending(true));

  try {
    if (kind === SEND_KINDS.ANNOUNCEMENT) {
      yield call(deliverAnnouncement, {
        store,
        staffId,
        spaceSlug,
        domain,
        text,
      });
      yield put(actions.messageSent(Date.now()));
      return;
    }

    if (kind === SEND_KINDS.GROUP) {
      yield call(deliverGroup, {
        store,
        staffId,
        memberIds: recipients,
        spaceSlug,
        name: groupName,
        text,
      });
      yield put(actions.messageSent(Date.now()));
      return;
    }

    if (existingConversationId) {
      yield call(deliverTo, {
        store,
        staffId,
        spaceSlug,
        text,
        existingConversationId,
      });
    } else {
      // Each recipient gets their own 1:1 thread -- nobody learns who else
      // received it. Failures are collected rather than abandoning the rest,
      // so one bad recipient does not silently cancel everyone after them.
      const failures = [];
      for (let i = 0; i < recipients.length; i++) {
        try {
          yield call(deliverTo, {
            store,
            memberId: recipients[i],
            staffId,
            spaceSlug,
            text,
            broadcast: kind === SEND_KINDS.BROADCAST,
          });
        } catch (e) {
          failures.push(`${recipients[i]}: ${e.message || String(e)}`);
        }
      }

      if (failures.length) {
        const summary =
          `Sent to ${recipients.length - failures.length} of ` +
          `${recipients.length}. Failed: ${failures.join('; ')}`;

        // Report BEFORE running diagnostics. setSendError is what clears
        // `sending`, and describeAuthState() does a Firestore read that can
        // hang after a permission failure -- reporting afterwards leaves the
        // Send button disabled with no way back.
        yield put(actions.setSendError(summary));
        const detail = yield call(describeAuthState);
        yield put(actions.setSendError(`${summary} (${detail})`));
        return;
      }
    }

    yield put(actions.messageSent(Date.now()));
  } catch (e) {
    // Naming the kind matters: the four send paths write very different
    // documents, and a rules rejection on one says nothing about the others.
    const base = `${kind || SEND_KINDS.CONVERSATION}: ${e.message ||
      String(e)}`;

    // Report BEFORE running diagnostics. setSendError is what clears
    // `sending`, and describeAuthState() does a Firestore read that can hang
    // after a permission failure -- reporting afterwards leaves the Send
    // button disabled for the rest of the session with no way back.
    yield put(actions.setSendError(base));

    // permission-denied covers three different situations that look
    // identical: no session, a session whose token has lost the staff claim,
    // and a genuine rules rejection. Name which one, or this points everyone
    // at the rules regardless of cause.
    const detail = yield call(describeAuthState);
    yield put(actions.setSendError(`${base} (${detail})`));
  }
}

export function* watchConversations() {
  yield takeEvery(types.SUBSCRIBE_CONVERSATIONS, watchConversationSnapshots);
  // Same action, second listener: the announcement thread is fetched by id
  // because no participant query can reach it.
  yield takeEvery(types.SUBSCRIBE_CONVERSATIONS, watchAnnouncementThread);
  yield takeEvery(types.SUBSCRIBE_MESSAGES, watchMessageSnapshots);
  yield takeEvery(types.SEND_MESSAGE, sendMessage);
}

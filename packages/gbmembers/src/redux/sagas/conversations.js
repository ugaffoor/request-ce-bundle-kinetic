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
import { getSignedInUid } from '../../lib/firebaseAuth';
import {
  conversationId,
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

  return participantId
    ? query(
        conversations,
        where(
          CONVERSATION_FIELDS.participantIds,
          'array-contains',
          participantId,
        ),
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
      yield put(
        event.error
          ? actions.setConversationsError(event.error.message)
          : actions.setConversations(event.data),
      );
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
export function* sendMessage({ payload } = {}) {
  const store = getConversationStore();
  const { memberId, staffId, spaceSlug, text } = payload || {};

  if (!store || !memberId || !staffId || !text) {
    yield put(
      actions.setSendError('Cannot send: the conversation is not ready.'),
    );
    return;
  }

  yield put(actions.setSending(true));

  try {
    const id = conversationId(memberId, staffId);

    // Firestore rejects undefined field values, so only send what we have.
    const conversation = {
      [CONVERSATION_FIELDS.participantIds]: [memberId, staffId],
      staffChat: true,
    };
    if (spaceSlug) {
      conversation.spaceSlug = spaceSlug;
    }

    yield call(setDoc, doc(store, CONVERSATIONS_COLLECTION, id), conversation, {
      merge: true,
    });

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

    yield put(actions.messageSent(Date.now()));
  } catch (e) {
    // permission-denied is returned both when the rules refuse the write and
    // when there is no Firebase session at all. Say which, so this points at
    // the actual problem instead of sending everyone to the rules.
    const uid = getSignedInUid();
    const detail = uid
      ? `signed in to Firebase as ${uid}`
      : 'not signed in to Firebase - sign out of GB Members and sign in ' +
        'again to reconnect';
    yield put(actions.setSendError(`${e.message || String(e)} (${detail})`));
  }
}

export function* watchConversations() {
  yield takeEvery(types.SUBSCRIBE_CONVERSATIONS, watchConversationSnapshots);
  yield takeEvery(types.SUBSCRIBE_MESSAGES, watchMessageSnapshots);
  yield takeEvery(types.SEND_MESSAGE, sendMessage);
}

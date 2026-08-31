import { eventChannel } from 'redux-saga';
import { call, cancelled, put, take, takeEvery } from 'redux-saga/effects';
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { types, actions } from '../modules/conversations';
import { getConversationStore } from '../../lib/firebase';
import {
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

export function* watchConversations() {
  yield takeEvery(types.SUBSCRIBE_CONVERSATIONS, watchConversationSnapshots);
  yield takeEvery(types.SUBSCRIBE_MESSAGES, watchMessageSnapshots);
}

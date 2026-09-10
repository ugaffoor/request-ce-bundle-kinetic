import { List, Record } from 'immutable';
import { namespace, withPayload, noPayload } from '../../utils';

export const types = {
  // Live listener over the conversation list.
  SUBSCRIBE_CONVERSATIONS: namespace(
    'conversations',
    'SUBSCRIBE_CONVERSATIONS',
  ),
  UNSUBSCRIBE_CONVERSATIONS: namespace(
    'conversations',
    'UNSUBSCRIBE_CONVERSATIONS',
  ),
  SET_CONVERSATIONS: namespace('conversations', 'SET_CONVERSATIONS'),
  SET_CONVERSATIONS_ERROR: namespace(
    'conversations',
    'SET_CONVERSATIONS_ERROR',
  ),
  // The school's single announcement thread, which arrives on its own
  // listener: it carries no participantIds, so the conversation query -- which
  // matches on participation -- can never return it.
  SET_ANNOUNCEMENT_THREAD: namespace(
    'conversations',
    'SET_ANNOUNCEMENT_THREAD',
  ),
  // Live listener over the messages inside one conversation.
  SUBSCRIBE_MESSAGES: namespace('conversations', 'SUBSCRIBE_MESSAGES'),
  SET_MESSAGES: namespace('conversations', 'SET_MESSAGES'),
  SET_MESSAGES_ERROR: namespace('conversations', 'SET_MESSAGES_ERROR'),
  // Sending one message from the portal.
  SEND_MESSAGE: namespace('conversations', 'SEND_MESSAGE'),
  SET_SENDING: namespace('conversations', 'SET_SENDING'),
  SET_SEND_ERROR: namespace('conversations', 'SET_SEND_ERROR'),
  MESSAGE_SENT: namespace('conversations', 'MESSAGE_SENT'),
  // Withdrawing a post that has already gone out.
  DELETE_MESSAGE: namespace('conversations', 'DELETE_MESSAGE'),
  SET_DELETING: namespace('conversations', 'SET_DELETING'),
  SET_DELETE_ERROR: namespace('conversations', 'SET_DELETE_ERROR'),
  // Removing a whole thread from this viewer's list.
  CLEAR_CONVERSATION: namespace('conversations', 'CLEAR_CONVERSATION'),
};

export const actions = {
  // Pass { participantId } to follow one person, or nothing for all.
  subscribeConversations: withPayload(types.SUBSCRIBE_CONVERSATIONS),
  unsubscribeConversations: noPayload(types.UNSUBSCRIBE_CONVERSATIONS),
  setConversations: withPayload(types.SET_CONVERSATIONS),
  setConversationsError: withPayload(types.SET_CONVERSATIONS_ERROR),
  // The announcement thread, or null when the school has none.
  setAnnouncementThread: withPayload(types.SET_ANNOUNCEMENT_THREAD),
  // Pass { conversationId }.
  subscribeMessages: withPayload(types.SUBSCRIBE_MESSAGES),
  setMessages: withPayload(types.SET_MESSAGES),
  setMessagesError: withPayload(types.SET_MESSAGES_ERROR),
  // Pass { memberId, staffId, spaceSlug, text }.
  sendMessage: withPayload(types.SEND_MESSAGE),
  setSending: withPayload(types.SET_SENDING),
  setSendError: withPayload(types.SET_SEND_ERROR),
  messageSent: withPayload(types.MESSAGE_SENT),
  // Pass { conversationId, messageId }.
  deleteMessage: withPayload(types.DELETE_MESSAGE),
  setDeleting: withPayload(types.SET_DELETING),
  setDeleteError: withPayload(types.SET_DELETE_ERROR),
  // Pass { conversationId, viewerId }.
  clearConversation: withPayload(types.CLEAR_CONVERSATION),
};

export const State = Record({
  loading: true,
  error: null,
  // What every screen reads. Built from the two sources below.
  data: List(),
  // Kept apart so either listener can update without discarding the other's
  // result: they arrive independently and at different times.
  participantConversations: List(),
  announcementThread: null,
  messagesLoading: true,
  messagesError: null,
  messages: List(),
  sending: false,
  sendError: null,
  // Bumped on each successful send so the composer knows to clear itself.
  lastSentAt: null,
  // The message currently being withdrawn, so only its own row shows a
  // pending state rather than the whole thread locking up.
  deletingId: null,
  deleteError: null,
});

/**
 * Rebuilds `data` from its two sources.
 *
 * The school's announcement thread cannot come back from the conversation
 * query -- that query matches on participantIds and the thread deliberately
 * has none -- so it is listened to separately and stitched in here. Screens
 * then filter and sort `data` as before, with no knowledge of the split.
 */
const withMergedData = state => {
  const participant = state.get('participantConversations');
  const announcement = state.get('announcementThread');
  return state.set(
    'data',
    announcement ? participant.push(announcement) : participant,
  );
};

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SUBSCRIBE_CONVERSATIONS:
      return state.set('loading', true).set('error', null);
    case types.SET_CONVERSATIONS:
      return withMergedData(
        state
          .set('loading', false)
          .set('error', null)
          .set('participantConversations', List(payload)),
      );
    case types.SET_ANNOUNCEMENT_THREAD:
      return withMergedData(state.set('announcementThread', payload || null));
    case types.SET_CONVERSATIONS_ERROR:
      return state.set('loading', false).set('error', payload);
    case types.UNSUBSCRIBE_CONVERSATIONS:
      return state.set('loading', false);
    case types.SUBSCRIBE_MESSAGES:
      return state.set('messagesLoading', true).set('messagesError', null);
    case types.SET_MESSAGES:
      return state
        .set('messagesLoading', false)
        .set('messagesError', null)
        .set('messages', List(payload));
    case types.SET_MESSAGES_ERROR:
      return state.set('messagesLoading', false).set('messagesError', payload);
    case types.SET_SENDING:
      return state.set('sending', payload).set('sendError', null);
    case types.SET_SEND_ERROR:
      return state.set('sending', false).set('sendError', payload);
    case types.MESSAGE_SENT:
      return state
        .set('sending', false)
        .set('sendError', null)
        .set('lastSentAt', payload);
    case types.SET_DELETING:
      return state.set('deletingId', payload).set('deleteError', null);
    case types.SET_DELETE_ERROR:
      return state.set('deletingId', null).set('deleteError', payload);
    default:
      return state;
  }
};

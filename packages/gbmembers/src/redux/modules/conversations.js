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
  // Live listener over the messages inside one conversation.
  SUBSCRIBE_MESSAGES: namespace('conversations', 'SUBSCRIBE_MESSAGES'),
  SET_MESSAGES: namespace('conversations', 'SET_MESSAGES'),
  SET_MESSAGES_ERROR: namespace('conversations', 'SET_MESSAGES_ERROR'),
};

export const actions = {
  // Pass { participantId } to follow one person, or nothing for all.
  subscribeConversations: withPayload(types.SUBSCRIBE_CONVERSATIONS),
  unsubscribeConversations: noPayload(types.UNSUBSCRIBE_CONVERSATIONS),
  setConversations: withPayload(types.SET_CONVERSATIONS),
  setConversationsError: withPayload(types.SET_CONVERSATIONS_ERROR),
  // Pass { conversationId }.
  subscribeMessages: withPayload(types.SUBSCRIBE_MESSAGES),
  setMessages: withPayload(types.SET_MESSAGES),
  setMessagesError: withPayload(types.SET_MESSAGES_ERROR),
};

export const State = Record({
  loading: true,
  error: null,
  data: List(),
  messagesLoading: true,
  messagesError: null,
  messages: List(),
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SUBSCRIBE_CONVERSATIONS:
      return state.set('loading', true).set('error', null);
    case types.SET_CONVERSATIONS:
      return state
        .set('loading', false)
        .set('error', null)
        .set('data', List(payload));
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
    default:
      return state;
  }
};

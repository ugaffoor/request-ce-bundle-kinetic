import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompose';
import { List } from 'immutable';
import { Inbox } from './Inbox';

/**
 * Reads the live conversation list the gbmembers conversations saga keeps up
 * to date, so the header reflects messages arriving from the app without a
 * refresh. Conversations are shown newest first.
 */
export const mapStateToProps = state => {
  const conversations =
    state.member && state.member.conversations
      ? state.member.conversations.data
      : List();

  return {
    messages: List(
      conversations
        .toArray()
        .slice()
        .sort(
          (a, b) =>
            (b.updatedAt ? b.updatedAt.getTime() : 0) -
            (a.updatedAt ? a.updatedAt.getTime() : 0),
        )
        .map(conversation => ({
          id: conversation.id,
          from: conversation.otherParticipantId,
          subject: conversation.lastMessage
            ? conversation.lastMessage.text
            : '',
          body: '',
          createdAt: conversation.updatedAt
            ? conversation.updatedAt.toLocaleString()
            : '',
        })),
    ),
  };
};

export const InboxContainer = compose(
  connect(mapStateToProps),
  withState('isOpen', 'setIsOpen', false),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
)(Inbox);

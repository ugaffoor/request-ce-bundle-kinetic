import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { actions as memberActions } from '../../redux/modules/members';
import { initialiseFirebase } from '../../lib/firebase';
import { ensureFirebaseSignIn } from '../../lib/firebaseAuth';
import {
  staffParticipantId,
  isStaffParticipant,
  STAFF_ID_PREFIX,
} from '../../lib/conversationSchema';

const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  messages: state.member.conversations.messages,
  messagesLoading: state.member.conversations.messagesLoading,
  messagesError: state.member.conversations.messagesError,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  profile: state.member.app.profile,
  spaceSlug: state.member.app.spaceSlug,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  fetchMembers: memberActions.fetchMembers,
};

/**
 * Participant ids are either a raw Kinetic member id or a staff composite.
 * Resolve both to something a human recognises, falling back to the raw id
 * so an unresolvable participant is still visible rather than blank.
 */
const participantName = (participantId, membersById) => {
  if (!participantId) {
    return 'Unknown';
  }

  if (isStaffParticipant(participantId)) {
    const username = participantId
      .slice(STAFF_ID_PREFIX.length)
      .split('_')
      .slice(1)
      .join('_');
    return username || participantId;
  }

  const member = membersById[participantId];
  if (!member) {
    return participantId;
  }

  return (
    (
      (member.values['Last Name'] || '') +
      ' ' +
      (member.values['First Name'] || '')
    ).trim() || participantId
  );
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

export class Conversations extends Component {
  constructor(props) {
    super(props);
    this.state = { selectedId: null };
  }

  getMembersById() {
    return this.props.allMembers.reduce((map, member) => {
      map[member.id] = member;
      return map;
    }, {});
  }

  selectConversation = conversation => {
    this.setState({ selectedId: conversation.id });
    this.props.subscribeMessages({ conversationId: conversation.id });
  };

  renderList(membersById) {
    const { conversations, loading, error } = this.props;

    if (loading) {
      return <ReactSpinner />;
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load conversations.</strong>
          <div>{error}</div>
        </div>
      );
    }

    if (conversations.size < 1) {
      return <p>No conversations yet.</p>;
    }

    const sorted = conversations
      .toArray()
      .sort(
        (a, b) =>
          (b.updatedAt ? b.updatedAt.getTime() : 0) -
          (a.updatedAt ? a.updatedAt.getTime() : 0),
      );

    return (
      <ul className="list-group">
        {sorted.map(conversation => (
          <li
            key={conversation.id}
            className={
              'list-group-item' +
              (conversation.id === this.state.selectedId ? ' active' : '')
            }
            role="button"
            tabIndex="0"
            onClick={() => this.selectConversation(conversation)}
            onKeyPress={() => this.selectConversation(conversation)}
          >
            <div>
              <strong>
                {participantName(conversation.otherParticipantId, membersById)}
              </strong>
            </div>
            {conversation.lastMessage && (
              <div>
                <small>{conversation.lastMessage.text}</small>
              </div>
            )}
            <small>{when(conversation.updatedAt)}</small>
          </li>
        ))}
      </ul>
    );
  }

  renderThread(membersById) {
    const { messages, messagesLoading, messagesError } = this.props;

    if (!this.state.selectedId) {
      return <p>Select a conversation to read it.</p>;
    }

    if (messagesLoading) {
      return <ReactSpinner />;
    }

    if (messagesError) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load messages.</strong>
          <div>{messagesError}</div>
        </div>
      );
    }

    if (messages.size < 1) {
      return <p>No messages in this conversation.</p>;
    }

    return (
      <ul className="list-unstyled">
        {messages.toArray().map(message => (
          <li key={message.id} className="mb-3">
            <div>
              <strong>{participantName(message.senderId, membersById)}</strong>{' '}
              <small>{when(message.createdAt)}</small>
            </div>
            <div>{message.text}</div>
          </li>
        ))}
      </ul>
    );
  }

  render() {
    const membersById = this.getMembersById();

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">Conversations</h4>
            <div className="row">
              <div className="col-md-4">{this.renderList(membersById)}</div>
              <div className="col-md-8">{this.renderThread(membersById)}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const ConversationsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      if (this.props.allMembers.length === 0 && !this.props.membersLoading) {
        this.props.fetchMembers({ memberInitialLoadComplete: false });
      }

      // Every path out of here has to settle `loading`, which starts true:
      // returning quietly leaves the list spinning forever with nothing on
      // screen to say why.
      const app = initialiseFirebase(this.props.space);
      if (!app) {
        this.props.setConversationsError(
          'Firebase is not configured for this space.',
        );
        return;
      }

      const username = this.props.profile && this.props.profile.username;
      if (!username || !this.props.spaceSlug) {
        this.props.setConversationsError(
          'Could not determine the signed-in user or space.',
        );
        return;
      }

      // Firestore gates every read on request.auth, so the listener can only
      // attach once the Firebase sign-in started at login has completed.
      // Subscribing before that just earns a permission-denied, which reads
      // as an empty inbox rather than as the auth problem it is.
      ensureFirebaseSignIn(app)
        .then(uid => {
          if (!uid) {
            this.props.setConversationsError(
              'Not signed in to Firebase — sign out and sign in again to load conversations.',
            );
            return;
          }

          this.props.subscribeConversations({
            participantId: staffParticipantId(this.props.spaceSlug, username),
          });
        })
        .catch(e => {
          this.props.setConversationsError(
            `Firebase sign-in failed: ${e && e.message ? e.message : e}`,
          );
        });
    },
  }),
)(Conversations);

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
  indexMembersById,
  participantName,
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
  sending: state.member.conversations.sending,
  sendError: state.member.conversations.sendError,
  lastSentAt: state.member.conversations.lastSentAt,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  sendMessage: conversationActions.sendMessage,
  fetchMembers: memberActions.fetchMembers,
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

const routeConversationId = props =>
  (props.match && props.match.params && props.match.params.conversationId) ||
  null;

export class Conversations extends Component {
  constructor(props) {
    super(props);
    // Arriving from a Send tab link opens that thread straight away rather
    // than dropping the user on "select a conversation".
    this.state = {
      selectedId: routeConversationId(props),
      reply: '',
      // Sends the server rejected. Kept locally because a failed write never
      // reaches Firestore, so the snapshot listener will never return it --
      // without this the message would just vanish on failure.
      failed: [],
    };
  }

  componentDidMount() {
    if (this.state.selectedId) {
      this.props.subscribeMessages({ conversationId: this.state.selectedId });
    }
  }

  componentDidUpdate(prevProps) {
    // Following a second link while already on this page changes the route
    // param without remounting, so the thread has to be re-opened here.
    const id = routeConversationId(this.props);
    if (id && id !== routeConversationId(prevProps)) {
      this.openConversation(id);
    }

    // Only once a send has actually landed.
    if (
      this.props.lastSentAt &&
      this.props.lastSentAt !== prevProps.lastSentAt
    ) {
      this.setState({ reply: '' });
    }

    // A send that finished with an error: show the attempt in the thread
    // marked as failed, rather than leaving no trace that it was tried.
    if (prevProps.sending && !this.props.sending && this.props.sendError) {
      const text = this.pendingText;
      this.pendingText = null;
      if (text) {
        this.setState(state => ({
          reply: '',
          failed: state.failed.concat({
            id: `failed-${Date.now()}`,
            text,
            createdAt: new Date(),
          }),
        }));
      }
    }
  }

  openConversation(conversationId) {
    // Drop any half-typed reply when moving to a different thread, so it
    // cannot be sent to the wrong person. Failed sends are cleared too --
    // they belong to the thread that was open when they failed.
    this.setState({ selectedId: conversationId, reply: '', failed: [] });
    this.props.subscribeMessages({ conversationId });
  }

  getSelectedConversation() {
    return this.props.conversations
      .toArray()
      .find(conversation => conversation.id === this.state.selectedId);
  }

  sendReply = () => {
    const conversation = this.getSelectedConversation();
    const username = this.props.profile && this.props.profile.username;
    const text = this.state.reply.trim();

    if (!conversation || !username || !this.props.spaceSlug || !text) {
      return;
    }

    // Held so the failure handler can show what was attempted.
    this.pendingText = text;

    this.props.sendMessage({
      // The student side of this thread -- normaliseConversation resolved it
      // by excluding the signed-in staff member.
      memberId: conversation.otherParticipantId,
      staffId: staffParticipantId(this.props.spaceSlug, username),
      spaceSlug: this.props.spaceSlug,
      text,
    });
  };

  renderComposer() {
    const conversation = this.getSelectedConversation();
    if (!conversation) {
      return null;
    }

    const canSend = !this.props.sending && this.state.reply.trim() !== '';

    return (
      <div className="form-group mt-3">
        <label htmlFor="conversation-reply">Reply</label>
        <textarea
          id="conversation-reply"
          className="form-control"
          rows="3"
          value={this.state.reply}
          disabled={this.props.sending}
          onChange={e => this.setState({ reply: e.target.value })}
        />
        {this.props.sendError && (
          <div className="alert alert-danger mt-2">
            <strong>Message not sent.</strong>
            <div>{this.props.sendError}</div>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary mt-2"
          disabled={!canSend}
          onClick={this.sendReply}
        >
          {this.props.sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    );
  }

  getMembersById() {
    return indexMembersById(this.props.allMembers);
  }

  selectConversation = conversation => {
    this.openConversation(conversation.id);
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
              {conversation.isAnnouncement && (
                <span className="badge badge-info ml-2">Announcement</span>
              )}
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

    if (messages.size < 1 && this.state.failed.length < 1) {
      return <p>No messages in this conversation.</p>;
    }

    const username = this.props.profile && this.props.profile.username;
    const senderName =
      username && this.props.spaceSlug
        ? participantName(
            staffParticipantId(this.props.spaceSlug, username),
            membersById,
          )
        : 'You';

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

        {/*
          Sends the server rejected, shown after the delivered messages so the
          attempt is visible rather than silently lost.
        */}
        {this.state.failed.map(failure => (
          <li key={failure.id} className="mb-3">
            <div>
              <strong>{senderName}</strong>{' '}
              <small>{when(failure.createdAt)}</small>
            </div>
            <div className="text-muted">{failure.text}</div>
            <small className="text-danger">Message failed to send</small>
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
              <div className="col-md-8">
                {this.renderThread(membersById)}
                {this.state.selectedId && this.renderComposer()}
              </div>
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

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { StatusMessagesContainer } from '../StatusMessages';
import { confirm } from '../helpers/Confirmation';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { actions as memberActions } from '../../redux/modules/members';
import { canUseConversations } from '../../lib/conversationAccess';
import { initialiseFirebase } from '../../lib/firebase';
import {
  ensureFirebaseSignIn,
  getSignedInUid,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import {
  staffParticipantId,
  indexMembersById,
  participantName,
  conversationTitle,
  lastMessageSenderLabel,
  isConversationCleared,
  DELETED_MESSAGE_TEXT,
  matchesConversationKind,
  CONVERSATION_KINDS,
  CONVERSATION_KIND_LABELS,
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
  deletingId: state.member.conversations.deletingId,
  deleteError: state.member.conversations.deleteError,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  sendMessage: conversationActions.sendMessage,
  deleteMessage: conversationActions.deleteMessage,
  clearConversation: conversationActions.clearConversation,
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
      kind: CONVERSATION_KINDS.ALL,
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

    // isBroadcast is also checked in renderComposer, which is what actually
    // hides the box. Repeated here so the send path is safe on its own
    // rather than relying on the UI never offering it.
    if (
      !conversation ||
      conversation.isBroadcast ||
      !username ||
      !this.props.spaceSlug ||
      !text
    ) {
      return;
    }

    // Held so the failure handler can show what was attempted.
    this.pendingText = text;

    this.props.sendMessage({
      // Send into the thread that is actually open. Without this the saga
      // derives an id from the pair, which for a member who has been
      // broadcast to resolves to their broadcast thread instead.
      conversationId: conversation.id,
      // The student side of this thread -- normaliseConversation resolved it
      // by excluding the signed-in staff member.
      memberId: conversation.otherParticipantId,
      // firestore.rules requires senderId == request.auth.uid, so this must
      // be the signed-in uid rather than a derived staff id.
      staffId: getSignedInUid(),
      spaceSlug: this.props.spaceSlug,
      text,
    });
  };

  renderComposer() {
    const conversation = this.getSelectedConversation();
    if (!conversation) {
      return null;
    }

    // A broadcast is one-way by design: the same message sent to several
    // members in separate threads, so no recipient learns who else received
    // it. firestore.rules enforces that -- broadcastWritable() permits a write
    // only from broadcastSender.
    //
    // The recipient does see it as a broadcast: the BJJ Members app hides
    // staffBroadcast threads from Messages (MessagesScreen) and surfaces them
    // as a "New broadcast" notification and in BroadcastInboxScreen instead.
    //
    // Announcements are the other feature and are NOT restricted here: a
    // student can reply to one and staff can answer back.
    if (conversation.isBroadcast) {
      return (
        <p className="text-muted mt-3">
          <small>
            This is a broadcast &mdash; a one-way message, so it cannot be
            replied to. Start a new conversation to message this person
            directly.
          </small>
        </p>
      );
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

  /**
   * This staff member's own participant id, for telling their own messages
   * apart from a student's. Null until the profile and space have loaded.
   */
  viewerParticipantId() {
    const username = this.props.profile && this.props.profile.username;
    return username && this.props.spaceSlug
      ? staffParticipantId(this.props.spaceSlug, username)
      : null;
  }

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
      // Threads this viewer removed stay hidden until something newer
      // arrives, matching how the app treats them.
      .filter(conversation => !isConversationCleared(conversation))
      .filter(conversation =>
        matchesConversationKind(conversation, this.state.kind),
      )
      .sort(
        (a, b) =>
          (b.updatedAt ? b.updatedAt.getTime() : 0) -
          (a.updatedAt ? a.updatedAt.getTime() : 0),
      );

    if (sorted.length < 1) {
      return (
        <React.Fragment>
          {this.renderKindFilter()}
          <p>Nothing matches this filter.</p>
        </React.Fragment>
      );
    }

    const viewerId = this.viewerParticipantId();

    return (
      <React.Fragment>
        {this.renderKindFilter()}
        <ul className="list-group">
          {sorted.map(conversation => {
            // Groups are named after the group, so the sender of the latest
            // message would otherwise be invisible in this list.
            const senderLabel = lastMessageSenderLabel(
              conversation,
              membersById,
              viewerId,
            );

            return (
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
                    {conversationTitle(conversation, membersById)}
                  </strong>
                  {conversation.isGroup && (
                    <span className="badge badge-secondary ml-2">
                      Group · {(conversation.participantIds || []).length}
                    </span>
                  )}
                  {conversation.isBroadcast && (
                    <span className="badge badge-warning ml-2">Broadcast</span>
                  )}
                  {conversation.isAnnouncement && (
                    <span className="badge badge-info ml-2">Announcement</span>
                  )}
                </div>
                {conversation.lastMessage && (
                  <div>
                    <small>
                      {senderLabel && <strong>{senderLabel}: </strong>}
                      {conversation.lastMessage.text}
                    </small>
                  </div>
                )}
                <small>{when(conversation.updatedAt)}</small>
              </li>
            );
          })}
        </ul>
      </React.Fragment>
    );
  }

  renderKindFilter() {
    return (
      <ul className="nav nav-tabs mb-2" role="tablist">
        {Object.keys(CONVERSATION_KIND_LABELS).map(kind => (
          <li className="nav-item" key={kind}>
            <button
              type="button"
              role="tab"
              aria-selected={this.state.kind === kind}
              className={
                'nav-link btn btn-link' +
                (this.state.kind === kind ? ' active' : '')
              }
              onClick={() => this.setState({ kind })}
            >
              {CONVERSATION_KIND_LABELS[kind]}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  /**
   * A group's name and its participants, above the messages, so it is clear
   * who can see the thread. Nothing for a 1:1 -- the list already names the
   * one other person.
   */
  renderGroupHeader(membersById) {
    const conversation = this.getSelectedConversation();
    if (!conversation || !conversation.isGroup) {
      return null;
    }

    const participantIds = conversation.participantIds || [];

    return (
      <div className="mb-3">
        <h5 className="mb-1">{conversationTitle(conversation, membersById)}</h5>
        <div className="mb-1">
          <small className="text-muted">
            {participantIds.length}{' '}
            {participantIds.length === 1 ? 'participant' : 'participants'}
          </small>
        </div>
        <ul className="list-inline mb-0">
          {participantIds.map(participantId => (
            <li key={participantId} className="list-inline-item">
              <span className="badge badge-light">
                {participantName(participantId, membersById)}
              </span>
            </li>
          ))}
        </ul>
        <hr />
      </div>
    );
  }

  /**
   * Withdrawing applies to announcements and broadcasts only: those are
   * published outward, and a mistake in one is worth taking back. An ordinary
   * chat message is half of a two-way conversation the student has already
   * read and may have answered -- removing it would leave a gap in something
   * they can still see.
   */
  canRemove(conversation, message) {
    if (!conversation || !message || message.deleted) {
      return false;
    }
    // Only your own messages. The rules decide this too, but offering a
    // control that always fails is worse than not offering it.
    return message.senderId === getSignedInUid();
  }

  /**
   * Sits above the thread rather than in the group header, which only renders
   * for groups -- a 1:1 chat needs removing just as much.
   */
  renderThreadActions() {
    if (!this.getSelectedConversation()) {
      return null;
    }
    return (
      <div className="text-right mb-2">
        <button
          type="button"
          className="btn btn-link btn-sm p-0"
          onClick={this.removeConversation}
        >
          <small>Remove from my list</small>
        </button>
      </div>
    );
  }

  removeConversation = async () => {
    const conversation = this.getSelectedConversation();
    const viewerId = getSignedInUid();
    if (!conversation || !viewerId) {
      return;
    }

    const confirmed = await confirm(
      <span>
        <span>
          This removes the thread from <strong>your</strong> list only &mdash;
          the other person keeps it and sees no change. It comes back if they
          send something new.
        </span>
      </span>,
      'Remove from my list',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.clearConversation({
      conversationId: conversation.id,
      viewerId,
    });
    this.setState({ selectedId: null, reply: '', failed: [] });
  };

  removeMessage = async message => {
    const conversation = this.getSelectedConversation();
    // Only the school's OWN thread may be hard-deleted -- that is what
    // triggers the fan-out cleanup. A delivered copy is not
    // `announcement: true`, so the same delete is refused; it gets a
    // tombstone like any other message.
    const announcement = !!(conversation && conversation.isAnnouncementThread);

    const confirmed = await confirm(
      <span>
        <span>
          {announcement
            ? 'This announcement will be withdrawn from everyone who received it.'
            : `This replaces it with “${DELETED_MESSAGE_TEXT}” for everyone in the chat. If they have already read it, or seen the notification, you cannot undo that.`}
        </span>
      </span>,
      announcement ? 'Withdraw announcement' : 'Delete for everyone',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.deleteMessage({
      conversationId: this.state.selectedId,
      messageId: message.id,
      // Announcements are deleted outright so the fan-out copies go too;
      // everything else leaves a tombstone.
      announcement,
    });
  };

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
      return (
        <React.Fragment>
          {this.renderGroupHeader(membersById)}
          <p>No messages in this conversation.</p>
        </React.Fragment>
      );
    }

    const selectedConversation = this.getSelectedConversation();
    const username = this.props.profile && this.props.profile.username;
    const senderName =
      username && this.props.spaceSlug
        ? participantName(
            staffParticipantId(this.props.spaceSlug, username),
            membersById,
          )
        : 'You';

    return (
      <React.Fragment>
        {this.renderGroupHeader(membersById)}
        {this.props.deleteError && (
          <div className="alert alert-danger">
            <strong>Could not remove that.</strong>
            <div>{this.props.deleteError}</div>
          </div>
        )}
        <ul className="list-unstyled">
          {messages.toArray().map(message => (
            <li key={message.id} className="mb-3">
              <div>
                <strong>
                  {participantName(message.senderId, membersById)}
                </strong>{' '}
                <small>{when(message.createdAt)}</small>
                {this.canRemove(selectedConversation, message) && (
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 ml-2"
                    disabled={this.props.deletingId === message.id}
                    onClick={() => this.removeMessage(message)}
                  >
                    <small>
                      {this.props.deletingId === message.id
                        ? 'Deleting...'
                        : 'Delete for everyone'}
                    </small>
                  </button>
                )}
              </div>
              <div>
                {message.deleted ? (
                  <em className="text-muted">{DELETED_MESSAGE_TEXT}</em>
                ) : (
                  message.text
                )}
              </div>
            </li>
          ))}

          {/*
            Sends the server rejected, shown after the delivered messages so
            the attempt is visible rather than silently lost.
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
      </React.Fragment>
    );
  }

  renderNoAccess() {
    return (
      <div className="container-fluid leads">
        <div className="leadContents">
          <div className="options">
            <h4 className="title">Conversations</h4>
            <p>
              You do not have access to conversations. Ask a space admin to add
              you to the Program Managers role.
            </p>
          </div>
        </div>
      </div>
    );
  }

  render() {
    // Routes are reachable by URL, so the page guards itself rather than
    // relying on the Send tab having hidden the link.
    if (!canUseConversations(this.props.profile)) {
      return this.renderNoAccess();
    }

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
                {this.state.selectedId && this.renderThreadActions()}
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
      ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username))
        .then(uid => {
          if (!uid) {
            this.props.setConversationsError(
              'Not signed in to Firebase — sign out and sign in again to load conversations.',
            );
            return;
          }

          // Query on the uid Firebase actually signed us in as, NOT a
          // derived staff_{space}_{user} string. mintFirebaseToken keys staff
          // WITH a member record to their member GUID, and only staff without
          // one to the staff_ composite -- so deriving it is wrong for anyone
          // who has a member record. The rules compare against
          // request.auth.uid, so filtering on anything else returns documents
          // the rule then refuses, surfacing as permission-denied.
          // spaceSlug and domain let the saga also follow the school's
          // announcement thread, which no participant query can return.
          this.props.subscribeConversations({
            participantId: uid,
            spaceSlug: this.props.spaceSlug,
            domain: FRANCHISE_DOMAIN,
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

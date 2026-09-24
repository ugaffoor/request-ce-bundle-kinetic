import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { KappNavLink as NavLink } from 'common';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { initialiseFirebase } from '../../lib/firebase';
import {
  ensureFirebaseSignIn,
  getSignedInUid,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import {
  conversationParticipants,
  indexMembersById,
  groupConversationsByParticipant,
  matchesConversationKind,
  needsReply,
  isUnread,
  previewSenderLabel,
  CONVERSATION_KINDS,
  CONVERSATION_KIND_LABELS,
} from '../../lib/conversationSchema';

/**
 * The existing conversation threads, shown on the Send tab beside the email
 * and SMS campaign lists so staff can see what is already running before
 * starting something new.
 *
 * Self-contained: it attaches its own snapshot listener rather than relying on
 * the Conversations page having been visited first, because the Send tab is
 * usually where someone lands.
 */
const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  allMembers: state.member.members.allMembers,
  profile: state.member.app.profile,
  spaceSlug: state.member.app.spaceSlug,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  unsubscribeConversations: conversationActions.unsubscribeConversations,
  setConversationsError: conversationActions.setConversationsError,
};

// The Send tab is a launch pad, not the place to read everything: it shows
// the most recent few and hands off to the Conversations page for the rest.
const PREVIEW_ROWS = 5;

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

export class ConversationsList extends Component {
  constructor(props) {
    super(props);
    // Which grouped rows are open, keyed by participant id. Collapsed by
    // default so the list stays one line per person.
    this.state = { expanded: {}, kind: CONVERSATION_KINDS.ALL };
  }

  toggle = participantId => {
    this.setState(state => ({
      expanded: {
        ...state.expanded,
        [participantId]: !state.expanded[participantId],
      },
    }));
  };

  /**
   * Opens the thread from a click anywhere on its row, not just on the text.
   * A row is one thread, so the whole line should be the target -- the link
   * alone leaves most of the row dead to the pointer.
   *
   * The row's own link is what navigates. Activating it rather than pushing
   * a route keeps ctrl-click, middle-click and the browser's own link
   * handling working, and leaves building the URL to the one component that
   * knows how.
   */
  openRow = event => {
    // A control inside the row speaks for itself: the link already goes
    // there, and the expander means something else entirely.
    if (event.target.closest('a, button')) {
      return;
    }
    const link = event.currentTarget.querySelector('a');
    if (link) {
      link.click();
    }
  };

  /**
   * A grouped row holds several threads rather than one, so clicking it
   * opens the group -- the same thing its caret does.
   */
  toggleRow = (participantId, event) => {
    if (event.target.closest('a, button')) {
      return;
    }
    this.toggle(participantId);
  };

  /**
   * The last message with its sender in front: "You: see you Saturday" or
   * "Alex: can I move to 6pm?". Falls back to "Open" for a thread that has
   * no cached preview yet.
   */
  renderPreview(conversation, membersById, viewerId) {
    const text =
      conversation.lastMessage && conversation.lastMessage.text
        ? conversation.lastMessage.text
        : null;
    if (!text) {
      return 'Open';
    }
    const sender = previewSenderLabel(conversation, membersById, viewerId);
    return (
      <React.Fragment>
        {sender && <strong>{sender}: </strong>}
        {text}
      </React.Fragment>
    );
  }

  renderGroup(group, membersById) {
    const isExpanded = !!this.state.expanded[group.participantId];
    const viewerId = getSignedInUid();
    const threadCount = group.conversations.length;

    // Someone is waiting on you: the badge says so until you answer.
    const waiting = group.conversations.some(conversation =>
      needsReply(conversation, viewerId),
    );
    const needsReplyBadge = (
      <span className="badge badge-danger ml-2">Needs reply</span>
    );

    // Bold is the unread mark, as in a mail list, and lifts once the thread
    // is opened. A group's row carries the sum over its threads, so a person
    // with two threads reads "3" rather than a 2 and a 1 hidden inside.
    const unread = group.conversations.reduce(
      (sum, conversation) => sum + (conversation.unreadCount || 0),
      0,
    );
    const rowClass = unread > 0 ? 'font-weight-bold' : '';
    const unreadBadge = count =>
      count > 0 && (
        <span
          className="badge badge-primary badge-pill ml-2"
          title={`${count} unread`}
        >
          {count}
        </span>
      );

    // One thread is the normal case -- no expander, just a link.
    if (threadCount < 2) {
      return (
        <tr
          key={group.participantId}
          className={`conversation-row ${rowClass}`}
          onClick={this.openRow}
        >
          <td>
            <NavLink to={`/Conversations/${group.latest.id}`}>
              {this.renderPreview(group.latest, membersById, viewerId)}
            </NavLink>
            {unreadBadge(unread)}
            {waiting && needsReplyBadge}
          </td>
          <td>
            {group.name}
            {group.isBroadcast && (
              <span className="badge badge-warning ml-2">Broadcast</span>
            )}
            {group.isAnnouncement && (
              <span className="badge badge-info ml-2">Announcement</span>
            )}
          </td>
          <td>{when(group.latest.updatedAt)}</td>
        </tr>
      );
    }

    return (
      <React.Fragment key={group.participantId}>
        <tr
          className={`conversation-row ${rowClass}`}
          onClick={event => this.toggleRow(group.participantId, event)}
        >
          <td>
            {group.latest.lastMessage
              ? this.renderPreview(group.latest, membersById, viewerId)
              : ''}
            {unreadBadge(unread)}
            {waiting && needsReplyBadge}
          </td>
          <td>
            <button
              type="button"
              className="btn btn-link p-0"
              onClick={() => this.toggle(group.participantId)}
              aria-expanded={isExpanded}
            >
              <i
                className={`fa fa-fw ${
                  isExpanded ? 'fa-caret-down' : 'fa-caret-right'
                }`}
              />
              {group.name}{' '}
              <span className="badge badge-secondary">{threadCount}</span>
              {group.isBroadcast && (
                <span className="badge badge-warning ml-2">Broadcast</span>
              )}
              {group.isAnnouncement && (
                <span className="badge badge-info ml-2">Announcement</span>
              )}
            </button>
          </td>
          <td>{when(group.latest.updatedAt)}</td>
        </tr>

        {isExpanded &&
          group.conversations.map(conversation => (
            <tr
              key={conversation.id}
              className={
                'conversation-thread conversation-row' +
                (isUnread(conversation) ? ' font-weight-bold' : '')
              }
              onClick={this.openRow}
            >
              <td style={{ paddingLeft: '2.5rem' }}>
                <NavLink to={`/Conversations/${conversation.id}`}>
                  <small>
                    {this.renderPreview(conversation, membersById, viewerId)}
                  </small>
                </NavLink>
                {unreadBadge(conversation.unreadCount)}
                {needsReply(conversation, viewerId) && needsReplyBadge}
              </td>
              <td>
                <small>
                  {conversationParticipants(
                    conversation,
                    membersById,
                    viewerId,
                  )}
                  {conversation.isBroadcast && (
                    <span className="badge badge-warning ml-2">Broadcast</span>
                  )}
                  {conversation.isAnnouncement && (
                    <span className="badge badge-info ml-2">Announcement</span>
                  )}
                </small>
              </td>
              <td>
                <small>{when(conversation.updatedAt)}</small>
              </td>
            </tr>
          ))}
      </React.Fragment>
    );
  }

  render() {
    const { conversations, loading, error } = this.props;
    const membersById = indexMembersById(this.props.allMembers);

    // Several threads with the same person collapse into one row, so the list
    // reads as one line per person rather than implying repeated contact.
    const groups = groupConversationsByParticipant(
      conversations
        .toArray()
        .filter(conversation =>
          matchesConversationKind(
            conversation,
            this.state.kind,
            getSignedInUid(),
          ),
        ),
      membersById,
    );

    // Anything waiting on a reply floats to the top, newest first within
    // each half. With only a few rows shown here, the ones that need doing
    // must not be pushed out of view by a chat that merely happened later.
    const viewerId = getSignedInUid();
    const waiting = group =>
      group.conversations.some(conversation =>
        needsReply(conversation, viewerId),
      );
    groups.sort((a, b) => Number(waiting(b)) - Number(waiting(a)));

    return (
      <div className="options">
        <h4 className="title">
          Conversations
          <NavLink to="/NewConversation" className="btn btn-primary pull-right">
            New Conversation
          </NavLink>
          <NavLink
            to="/Announcements"
            className="btn btn-secondary pull-right mr-2"
          >
            Announcements &amp; broadcasts
          </NavLink>
        </h4>

        <div className="form-group">
          <label htmlFor="conversations-list-kind">Show</label>
          <select
            id="conversations-list-kind"
            className="form-control"
            value={this.state.kind}
            onChange={e => this.setState({ kind: e.target.value })}
          >
            {Object.keys(CONVERSATION_KIND_LABELS).map(kind => (
              <option key={kind} value={kind}>
                {CONVERSATION_KIND_LABELS[kind]}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <ReactSpinner />
        ) : error ? (
          // Still offer the way in: not being able to LIST conversations does
          // not mean one cannot be started, and this is the branch a
          // permissions or sign-in problem lands on.
          <React.Fragment>
            <div className="alert alert-danger">
              <strong>Could not load conversations.</strong>
              <div>{error}</div>
            </div>
            <NavLink to="/NewConversation" className="btn btn-primary">
              Create conversation
            </NavLink>
          </React.Fragment>
        ) : groups.length < 1 ? (
          // An empty list is where someone is most likely to want to start
          // something, and the header button is easy to miss up beside the
          // title -- so the way in sits with the message that says there is
          // nothing here.
          <div className="text-center py-3">
            <p className="text-muted">
              {this.state.kind === CONVERSATION_KINDS.ALL
                ? 'No conversations yet.'
                : this.state.kind === CONVERSATION_KINDS.NEEDS_REPLY
                  ? 'Nothing is waiting on a reply.'
                  : 'Nothing matches this filter.'}
            </p>
            <NavLink to="/NewConversation" className="btn btn-primary">
              Create conversation
            </NavLink>
            <div className="mt-2">
              <small className="text-muted">
                Or open a member&rsquo;s profile and press Message to talk to
                them directly.
              </small>
            </div>
          </div>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Last message</th>
                <th>Participants</th>
                <th>Date and time</th>
              </tr>
            </thead>
            <tbody>
              {groups
                .slice(0, PREVIEW_ROWS)
                .map(group => this.renderGroup(group, membersById))}
            </tbody>
          </table>
        )}
        {groups.length > PREVIEW_ROWS && (
          <p className="mb-0">
            <NavLink to="/Conversations">
              View all {groups.length} conversations
            </NavLink>
          </p>
        )}
      </div>
    );
  }
}

export const ConversationsListContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      // Mirrors the Conversations page: every exit has to settle `loading`,
      // which starts true, or this renders a spinner forever with nothing to
      // say why.
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
      ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username))
        .then(uid => {
          if (!uid) {
            this.props.setConversationsError(
              'Not signed in to Firebase — sign out and sign in again to load conversations.',
            );
            return;
          }

          if (this.unmounted) {
            // Signing in is asynchronous: by the time it finishes the page
            // may already be gone, and a listener started now would have
            // nobody to stop it.
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

    // This list only ever followed the conversations; the thread listener
    // belongs to whichever page opened one.
    componentWillUnmount() {
      this.unmounted = true;
      this.props.unsubscribeConversations();
    },
  }),
)(ConversationsList);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { KappNavLink as NavLink } from 'common';
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
  announcementThreadId,
  indexMembersById,
  participantName,
} from '../../lib/conversationSchema';

const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  messages: state.member.conversations.messages,
  messagesLoading: state.member.conversations.messagesLoading,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  profile: state.member.app.profile,
  spaceSlug: state.member.app.spaceSlug,
  space: state.member.app.space,
  deletingId: state.member.conversations.deletingId,
  deleteError: state.member.conversations.deleteError,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  deleteMessage: conversationActions.deleteMessage,
  deleteBroadcast: conversationActions.deleteBroadcast,
  fetchMembers: memberActions.fetchMembers,
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

/**
 * Everything this school has broadcast outward, in one place, so a program
 * manager can review what went out and withdraw any of it.
 *
 * The two halves are shaped differently and cannot be listed together:
 *
 *   ANNOUNCEMENTS are posts inside one shared thread, so each row is a
 *   MESSAGE in that thread. Deleting one triggers onAnnouncementDeleted,
 *   which withdraws every delivered copy -- that is what makes it a full
 *   removal rather than a local tidy-up.
 *
 *   BROADCASTS are one thread per recipient, so each row is a CONVERSATION.
 *   Deleting its message removes it for that person outright; there is no
 *   fan-out to unwind because each delivery is its own thread.
 */
export class Announcements extends Component {
  componentDidMount() {
    // The announcement thread is fetched by id, so its posts only arrive once
    // this page asks for them.
    if (this.props.spaceSlug) {
      this.props.subscribeMessages({
        conversationId: announcementThreadId(
          this.props.spaceSlug,
          FRANCHISE_DOMAIN,
        ),
      });
    }
  }

  getBroadcasts() {
    const viewerId = getSignedInUid();
    return (
      this.props.conversations
        .toArray()
        .filter(conversation => conversation.isBroadcast)
        // Only what this staff member sent. Another coach's broadcast is not
        // theirs to withdraw, and the rules would refuse it anyway.
        .filter(
          conversation =>
            !viewerId || conversation.broadcastSender === viewerId,
        )
        .sort(
          (a, b) =>
            (b.updatedAt ? b.updatedAt.getTime() : 0) -
            (a.updatedAt ? a.updatedAt.getTime() : 0),
        )
    );
  }

  getAnnouncements() {
    const viewerId = getSignedInUid();
    return this.props.messages
      .toArray()
      .filter(message => !message.deleted)
      .filter(message => !viewerId || message.senderId === viewerId)
      .sort(
        (a, b) =>
          (b.createdAt ? b.createdAt.getTime() : 0) -
          (a.createdAt ? a.createdAt.getTime() : 0),
      );
  }

  removeAnnouncement = async message => {
    const confirmed = await confirm(
      <span>
        <span>
          This announcement will be withdrawn from everyone who received it,
          including the copy delivered to each member. It cannot be restored.
        </span>
      </span>,
      'Delete announcement',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.deleteMessage({
      conversationId: announcementThreadId(
        this.props.spaceSlug,
        FRANCHISE_DOMAIN,
      ),
      messageId: message.id,
      // Hard delete, so onAnnouncementDeleted removes the delivered copies.
      announcement: true,
    });
  };

  removeBroadcast = async (conversation, membersById) => {
    const to = participantName(conversation.otherParticipantId, membersById);
    const confirmed = await confirm(
      <span>
        <span>
          This broadcast to {to} will be removed entirely. They may already have
          read it, or seen the notification &mdash; that cannot be undone.
        </span>
      </span>,
      'Delete broadcast',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    // Every message in the thread goes: the cached lastMessage carries no id,
    // and a broadcast is the thread rather than one post within it.
    this.props.deleteBroadcast({ conversationId: conversation.id });
  };

  renderAnnouncements() {
    if (this.props.messagesLoading) {
      return <ReactSpinner />;
    }

    const announcements = this.getAnnouncements();
    if (announcements.length < 1) {
      return <p>You have not posted any announcements.</p>;
    }

    return (
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Announcement</th>
            <th>Posted</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {announcements.map(message => (
            <tr key={message.id}>
              <td>{message.text}</td>
              <td>{when(message.createdAt)}</td>
              <td className="text-right">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0"
                  disabled={this.props.deletingId === message.id}
                  onClick={() => this.removeAnnouncement(message)}
                >
                  <small>
                    {this.props.deletingId === message.id
                      ? 'Deleting...'
                      : 'Delete'}
                  </small>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  renderBroadcasts(membersById) {
    if (this.props.loading) {
      return <ReactSpinner />;
    }

    const broadcasts = this.getBroadcasts();
    if (broadcasts.length < 1) {
      return <p>You have not sent any broadcasts.</p>;
    }

    return (
      <table className="table table-sm">
        <thead>
          <tr>
            <th>To</th>
            <th>Message</th>
            <th>Sent</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {broadcasts.map(conversation => {
            const busy = this.props.deletingId === conversation.id;
            return (
              <tr key={conversation.id}>
                <td>
                  {participantName(
                    conversation.otherParticipantId,
                    membersById,
                  )}
                </td>
                <td>
                  {conversation.lastMessage
                    ? conversation.lastMessage.text
                    : ''}
                </td>
                <td>{when(conversation.updatedAt)}</td>
                <td className="text-right">
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    disabled={busy}
                    onClick={() =>
                      this.removeBroadcast(conversation, membersById)
                    }
                  >
                    <small>{busy ? 'Deleting...' : 'Delete'}</small>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    );
  }

  render() {
    // Routes are reachable by URL, so the page guards itself rather than
    // relying on the link having been hidden.
    if (!canUseConversations(this.props.profile)) {
      return (
        <div className="container-fluid leads">
          <div className="leadContents">
            <div className="options">
              <h4 className="title">Announcements and broadcasts</h4>
              <p>
                You do not have access to conversations. Ask a space admin to
                add you to the Program Managers role.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const membersById = indexMembersById(this.props.allMembers);

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">
              Announcements and broadcasts
              <NavLink
                to="/NewConversation"
                className="btn btn-primary pull-right"
              >
                New
              </NavLink>
            </h4>

            {this.props.error && (
              <div className="alert alert-danger">
                <strong>Could not load these.</strong>
                <div>{this.props.error}</div>
              </div>
            )}
            {this.props.deleteError && (
              <div className="alert alert-danger">
                <strong>Could not delete that.</strong>
                <div>{this.props.deleteError}</div>
              </div>
            )}

            <h5 className="mt-3">Announcements</h5>
            <p className="text-muted">
              <small>
                Posted to the whole school. Deleting one withdraws it from every
                member who received it.
              </small>
            </p>
            {this.renderAnnouncements()}

            <h5 className="mt-4">Broadcasts</h5>
            <p className="text-muted">
              <small>
                One-way messages, one thread per recipient. Deleting one removes
                it for that person.
              </small>
            </p>
            {this.renderBroadcasts(membersById)}
          </div>
        </div>
      </div>
    );
  }
}

export const AnnouncementsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      if (this.props.allMembers.length === 0 && !this.props.membersLoading) {
        this.props.fetchMembers({ memberInitialLoadComplete: false });
      }

      const app = initialiseFirebase(this.props.space);
      if (!app) {
        this.props.setConversationsError(
          'Messaging is not set up for this space.',
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

      ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username))
        .then(uid => {
          if (!uid) {
            this.props.setConversationsError(
              'Not signed in to Firebase — sign out and sign in again.',
            );
            return;
          }
          this.props.subscribeConversations({ participantId: uid });
        })
        .catch(e => {
          this.props.setConversationsError(
            `Firebase sign-in failed: ${e && e.message ? e.message : e}`,
          );
        });
    },
  }),
)(Announcements);

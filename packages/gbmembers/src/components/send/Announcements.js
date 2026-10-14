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
  describeAudience,
  indexMembersById,
  participantName,
} from '../../lib/conversationSchema';
import { subscribeProgramManagerIds } from '../../lib/programManagers';

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
  unsubscribeConversations: conversationActions.unsubscribeConversations,
  unsubscribeMessages: conversationActions.unsubscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  deleteMessage: conversationActions.deleteMessage,
  deleteConversation: conversationActions.deleteConversation,
  editMessage: conversationActions.editMessage,
  editBroadcast: conversationActions.editBroadcast,
  fetchMembers: memberActions.fetchMembers,
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

// Threads created by one Send land a few seconds apart, one per recipient.
// Anything with the same text inside this window is treated as the same
// broadcast. Generous enough for a slow send to a big list; short enough
// that resending the same notice next week shows as a separate broadcast.
const SAME_BROADCAST_WINDOW_MS = 10 * 60 * 1000;

/**
 * Collapses one-thread-per-recipient broadcasts back into the sends that
 * created them: same text, sent within the window of each other. Input is
 * newest first; output is too, each entry carrying every thread it covers.
 */
const groupBroadcasts = conversations => {
  const groups = [];
  conversations.forEach(conversation => {
    const text = conversation.lastMessage ? conversation.lastMessage.text : '';
    const time = conversation.updatedAt ? conversation.updatedAt.getTime() : 0;
    const group = groups.find(
      g => g.text === text && g.earliest - time <= SAME_BROADCAST_WINDOW_MS,
    );
    if (group) {
      group.conversations.push(conversation);
      group.earliest = Math.min(group.earliest, time);
    } else {
      groups.push({
        id: conversation.id,
        text,
        latest: conversation.updatedAt,
        earliest: time,
        conversations: [conversation],
      });
    }
  });
  return groups;
};

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
 *
 * Any program manager can edit or delete what any program manager sent --
 * the whole team's posts are listed, not only the viewer's own, so a
 * colleague who is away is not the only one who can correct or take back a
 * notice. Editing an announcement updates every member's delivered copy
 * (onMessageEdited); editing a broadcast updates it in every recipient's
 * thread (editBroadcast).
 */
export class Announcements extends Component {
  state = {
    // The school's program managers, whose broadcasts are listed here.
    programManagerIds: new Set(),
    // The row being edited: { id, text }.
    editing: null,
  };

  componentDidUpdate() {
    // Once Firebase has signed in (the list arriving says it has).
    if (
      !this.stopProgramManagers &&
      this.props.spaceSlug &&
      !this.props.loading
    ) {
      this.stopProgramManagers = subscribeProgramManagerIds(
        this.props.spaceSlug,
        ids => this.setState({ programManagerIds: ids }),
      );
    }
  }

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

  componentWillUnmount() {
    // The posts listener this page started. The conversations listener is
    // started by the container below, which stops it there.
    this.props.unsubscribeMessages();
    if (this.stopProgramManagers) {
      this.stopProgramManagers();
      this.stopProgramManagers = null;
    }
  }

  startEdit(id, text) {
    this.setState({ editing: { id, text: text || '' } });
  }

  cancelEdit = () => this.setState({ editing: null });

  saveAnnouncement(message) {
    const text = (this.state.editing && this.state.editing.text.trim()) || '';
    if (!text) {
      return;
    }
    this.props.editMessage({
      conversationId: announcementThreadId(
        this.props.spaceSlug,
        FRANCHISE_DOMAIN,
      ),
      messageId: message.id,
      text,
    });
    this.setState({ editing: null });
  }

  saveBroadcast(group) {
    const text = (this.state.editing && this.state.editing.text.trim()) || '';
    if (!text) {
      return;
    }
    this.props.editBroadcast({
      conversationIds: group.conversations.map(conversation => conversation.id),
      previousText: group.text,
      text,
    });
    this.setState({ editing: null });
  }

  /**
   * The words of a row, or the box to change them while it is being edited.
   */
  renderText(id, text, onSave) {
    const editing = this.state.editing;
    if (!editing || editing.id !== id) {
      return text;
    }
    return (
      <div>
        <textarea
          className="form-control form-control-sm"
          rows="3"
          value={editing.text}
          onChange={e =>
            this.setState({ editing: { id, text: e.target.value } })
          }
        />
        <div className="mt-1">
          <button
            type="button"
            className="btn btn-primary btn-sm mr-2"
            disabled={!editing.text.trim()}
            onClick={onSave}
          >
            Save
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={this.cancelEdit}
          >
            Cancel
          </button>
          <small className="text-muted ml-2">
            Changes it for everyone who received it.
          </small>
        </div>
      </div>
    );
  }

  getBroadcasts() {
    const viewerId = getSignedInUid();
    return (
      this.props.conversations
        .toArray()
        .filter(conversation => conversation.isBroadcast)
        // What this program manager sent, and what any other program manager
        // sent -- shared with the whole team, so any of them may change it.
        .filter(
          conversation =>
            !viewerId ||
            conversation.broadcastSender === viewerId ||
            this.state.programManagerIds.has(conversation.broadcastSender),
        )
        .sort(
          (a, b) =>
            (b.updatedAt ? b.updatedAt.getTime() : 0) -
            (a.updatedAt ? a.updatedAt.getTime() : 0),
        )
    );
  }

  // Every announcement the school has posted, whoever on the team posted it.
  getAnnouncements() {
    return this.props.messages
      .toArray()
      .filter(message => !message.deleted)
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

  removeBroadcast = async (group, membersById) => {
    const count = group.conversations.length;
    const to =
      count === 1
        ? participantName(
            group.conversations[0].otherParticipantId,
            membersById,
          )
        : `${count} members`;
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

    // One thread per recipient, so the whole send is every thread in the
    // group. The cached lastMessage carries no id, and a broadcast is the
    // thread rather than one post within it.
    group.conversations.forEach(conversation =>
      this.props.deleteConversation({ conversationId: conversation.id }),
    );
  };

  renderAnnouncements(membersById) {
    if (this.props.messagesLoading) {
      return <ReactSpinner />;
    }

    const announcements = this.getAnnouncements();
    if (announcements.length < 1) {
      return <p>No announcements have been posted.</p>;
    }

    return (
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Announcement</th>
            <th>Participants</th>
            <th>Sent by</th>
            <th>Date and time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {announcements.map(message => (
            <tr key={message.id}>
              <td>
                {this.renderText(message.id, message.text, () =>
                  this.saveAnnouncement(message),
                )}
                {message.editedAt && (
                  <small className="text-muted"> (edited)</small>
                )}
              </td>
              <td>{describeAudience(message, membersById)}</td>
              <td>{participantName(message.senderId, membersById)}</td>
              <td>{when(message.createdAt)}</td>
              <td className="text-right text-nowrap">
                <button
                  type="button"
                  className="btn btn-link btn-sm p-0 mr-3"
                  onClick={() => this.startEdit(message.id, message.text)}
                >
                  <small>Edit</small>
                </button>
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

    const broadcasts = groupBroadcasts(this.getBroadcasts());
    if (broadcasts.length < 1) {
      return <p>No broadcasts have been sent.</p>;
    }

    return (
      <table className="table table-sm">
        <thead>
          <tr>
            <th>Broadcast</th>
            <th>Participants</th>
            <th>Sent by</th>
            <th>Date and time</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {broadcasts.map(group => {
            const busy = group.conversations.some(
              conversation => this.props.deletingId === conversation.id,
            );
            const names = group.conversations.map(conversation =>
              participantName(conversation.otherParticipantId, membersById),
            );
            return (
              <tr key={group.id}>
                <td>
                  {this.renderText(group.id, group.text, () =>
                    this.saveBroadcast(group),
                  )}
                </td>
                <td>
                  {names.length > 1 && (
                    <span className="badge badge-secondary mr-2">
                      {names.length}
                    </span>
                  )}
                  {names.join(', ')}
                </td>
                <td>
                  {participantName(
                    group.conversations[0].broadcastSender,
                    membersById,
                  )}
                </td>
                <td>{when(group.latest)}</td>
                <td className="text-right text-nowrap">
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0 mr-3"
                    disabled={busy}
                    onClick={() => this.startEdit(group.id, group.text)}
                  >
                    <small>Edit</small>
                  </button>
                  <button
                    type="button"
                    className="btn btn-link btn-sm p-0"
                    disabled={busy}
                    onClick={() => this.removeBroadcast(group, membersById)}
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
                You do not have access to messages. Ask a space admin to add you
                to the Program Managers role.
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
                Posted to the whole school, by any program manager. Editing one
                changes it for every member who received it; deleting one
                withdraws it from all of them.
              </small>
            </p>
            {this.renderAnnouncements(membersById)}

            <h5 className="mt-4">Broadcasts</h5>
            <p className="text-muted">
              <small>
                One-way messages sent by any program manager. Editing one
                changes it for everyone it went to; deleting one removes it for
                all of them.
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
          if (this.unmounted) {
            // Signing in is asynchronous: by the time it finishes the page
            // may already be gone, and a listener started now would have
            // nobody to stop it.
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

    componentWillUnmount() {
      this.unmounted = true;
      this.props.unsubscribeConversations();
    },
  }),
)(Announcements);

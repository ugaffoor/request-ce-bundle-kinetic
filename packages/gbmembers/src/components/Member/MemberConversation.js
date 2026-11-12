import React, { Component } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { initialiseFirebase } from '../../lib/firebase';
import {
  ensureFirebaseSignIn,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import {
  conversationKind,
  conversationTitle,
  indexMembersById,
  previewSenderLabel,
  CONVERSATION_KINDS,
} from '../../lib/conversationSchema';

const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  spaceSlug: state.member.app.spaceSlug,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  unsubscribeConversations: conversationActions.unsubscribeConversations,
  setConversationsError: conversationActions.setConversationsError,
  push,
};

// What each kind of thread is called in the Type column.
const TYPE_LABELS = {
  [CONVERSATION_KINDS.CONVERSATION]: 'Message',
  [CONVERSATION_KINDS.GROUP]: 'Group',
  [CONVERSATION_KINDS.BROADCAST]: 'Broadcast',
  [CONVERSATION_KINDS.ANNOUNCEMENT]: 'Announcement',
};

/**
 * Whether a thread involves this member: they are in it, it is their reply to
 * (or delivery of) an announcement, or it is the school's announcement
 * thread, which goes to every member.
 */
const involves = (conversation, memberId) =>
  (conversation.participantIds || []).includes(memberId) ||
  conversation.otherParticipantId === memberId ||
  conversation.announcementMember === memberId ||
  !!conversation.isAnnouncementThread;

/**
 * The member's message history on their profile, between Requests and Emails
 * Sent: every thread involving them -- one-to-one messages, groups,
 * broadcasts and announcements -- newest first, with the latest message in
 * each. Read-only: no Send here. A row opens the thread on the Messages page.
 *
 * Only threads the signed-in staff member may read are listed. firestore.rules
 * lets staff read the threads they are in, plus their school's announcements
 * and replies to them; a member's private chats with other members are not
 * readable by staff at all, so they never appear here.
 */
export class MemberConversation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      // The signed-in Firebase uid: who "You" is in the list.
      viewerId: null,
    };
  }

  componentDidMount() {
    const app = initialiseFirebase(this.props.space);
    const username = this.props.profile && this.props.profile.username;
    if (!app || !username || !this.props.spaceSlug) {
      return;
    }

    ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username))
      .then(uid => {
        if (!uid) {
          this.props.setConversationsError(
            'Not signed in to Firebase — reload the page to try again.',
          );
          return;
        }
        if (this.unmounted) {
          // Signing in is asynchronous: by the time it finishes the profile
          // may already be gone, and a listener started now would have
          // nobody to stop it.
          return;
        }
        this.setState({ viewerId: uid });
        // The same list the Messages page shows, which also follows the
        // school's announcement thread.
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
  }

  componentWillUnmount() {
    // Started here, so stopped here -- a profile is opened and left far more
    // often than the Messages page is.
    this.unmounted = true;
    this.props.unsubscribeConversations();
  }

  openThread = conversation =>
    this.props.push(`/kapps/gbmembers/Conversations/${conversation.id}`);

  // A row opens its thread.
  rowProps = (state, rowInfo) =>
    rowInfo
      ? {
          onClick: () => this.openThread(rowInfo.original),
          style: { cursor: 'pointer' },
          title: 'Open this thread',
        }
      : {};

  getColumns(membersById) {
    return [
      {
        Header: 'Type',
        width: 130,
        Cell: row => (
          <span className="badge badge-secondary">
            {row.original.isAnnouncementReply
              ? 'Announcement reply'
              : TYPE_LABELS[conversationKind(row.original)] || 'Message'}
          </span>
        ),
      },
      {
        Header: 'Thread',
        width: 220,
        Cell: row => (
          <span className="nowrap">
            {/* The school's announcement thread has no members to name. */}
            {row.original.isAnnouncementThread
              ? 'Whole school'
              : conversationTitle(row.original, membersById)}
          </span>
        ),
      },
      {
        Header: 'Last message',
        className: 'text',
        Cell: row => {
          const last = row.original.lastMessage;
          if (!last || !last.text) {
            return <span className="text-muted">No messages yet</span>;
          }
          const sender = previewSenderLabel(
            row.original,
            membersById,
            this.state.viewerId,
          );
          return (
            <span className="nowrap">
              {sender && <strong>{sender}: </strong>}
              {last.text}
            </span>
          );
        },
      },
      {
        Header: 'Date and time',
        width: 200,
        className: 'date',
        Cell: row => (
          <span>
            {row.original.updatedAt
              ? moment(row.original.updatedAt).format(email_sent_date_format)
              : ''}
          </span>
        ),
      },
    ];
  }

  renderBody() {
    if (this.props.error) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load messages.</strong>
          <div>{this.props.error}</div>
        </div>
      );
    }

    if (!this.state.viewerId || this.props.loading) {
      return <ReactSpinner />;
    }

    const memberId = this.props.memberItem.id;
    const data = this.props.conversations
      .toArray()
      .filter(conversation => involves(conversation, memberId))
      .sort(
        (a, b) =>
          (b.updatedAt ? b.updatedAt.getTime() : 0) -
          (a.updatedAt ? a.updatedAt.getTime() : 0),
      );
    if (data.length < 1) {
      return <p className="text-muted">No messages yet.</p>;
    }

    return (
      <ReactTable
        columns={this.getColumns(indexMembersById(this.props.allMembers))}
        data={data}
        defaultPageSize={data.length}
        pageSize={data.length}
        showPagination={false}
        getTrProps={this.rowProps}
      />
    );
  }

  render() {
    return (
      <div className="row smsTable">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>Messages</h3>
            {this.renderBody()}
          </span>
        </div>
      </div>
    );
  }
}

export const MemberConversationContainer = connect(
  mapStateToProps,
  mapDispatchToProps,
)(MemberConversation);

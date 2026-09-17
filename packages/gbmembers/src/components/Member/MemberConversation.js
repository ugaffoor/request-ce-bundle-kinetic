import React, { Component } from 'react';
import { connect } from 'react-redux';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';
import { email_sent_date_format } from '../leads/LeadsUtils';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { initialiseFirebase } from '../../lib/firebase';
import {
  ensureFirebaseSignIn,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import {
  conversationId,
  isTinyChampion,
  billingOwnerIdOf,
  indexMembersById,
  participantName,
  DELETED_MESSAGE_TEXT,
  ANNOUNCEMENT_REMOVED_TEXT,
} from '../../lib/conversationSchema';

const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  messages: state.member.conversations.messages,
  messagesLoading: state.member.conversations.messagesLoading,
  messagesError: state.member.conversations.messagesError,
  spaceSlug: state.member.app.spaceSlug,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
};

/**
 * The 1:1 conversation with this member, on their profile beside the SMS
 * and email history -- read-only here, with a link through to the thread
 * for replying.
 *
 * Follows the same rule as everywhere else: a Tiny Champion is contacted
 * through their billing owner, so it is that person's thread that shows.
 */
export class MemberConversation extends Component {
  constructor(props) {
    super(props);
    this._columns = this.getColumns();
    this.state = {
      // The signed-in Firebase uid, which the thread id depends on.
      viewerId: null,
      // The thread this component last asked for messages from, so a new
      // list snapshot does not re-subscribe to the same thread.
      subscribedId: null,
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
            'Not signed in to Firebase — sign out and sign in again.',
          );
          return;
        }
        this.setState({ viewerId: uid });
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

  componentDidUpdate() {
    // Once the thread shows up in the list, follow its messages. Guarded on
    // subscribedId so each list snapshot does not start another listener.
    const conversation = this.getConversation();
    if (conversation && conversation.id !== this.state.subscribedId) {
      this.setState({ subscribedId: conversation.id });
      this.props.subscribeMessages({ conversationId: conversation.id });
    }
  }

  /**
   * Who the thread is with: the member, or their billing owner when the
   * member is a Tiny Champion. Null when a Tiny Champion has no owner on
   * record -- there is nobody to show a thread with.
   */
  getTarget() {
    const { memberItem, allMembers } = this.props;
    if (!isTinyChampion(memberItem)) {
      return memberItem;
    }
    const ownerId = billingOwnerIdOf(memberItem);
    const owner = ownerId ? allMembers.find(m => m.id === ownerId) : null;
    return owner && !isTinyChampion(owner) ? owner : null;
  }

  getConversation() {
    const target = this.getTarget();
    if (!target || !this.state.viewerId) {
      return null;
    }
    const id = conversationId(target.id, this.state.viewerId);
    return this.props.conversations
      .toArray()
      .find(conversation => conversation.id === id);
  }

  getColumns() {
    return [
      {
        Header: 'Direction',
        width: 150,
        className: 'direction',
        Cell: row => (
          <span>
            {row.original.senderId === this.state.viewerId
              ? 'Sent'
              : 'Received'}
          </span>
        ),
      },
      {
        Header: 'Date',
        width: 200,
        className: 'date',
        Cell: row => (
          <span>
            {row.original.createdAt
              ? moment(row.original.createdAt).format(email_sent_date_format)
              : ''}
          </span>
        ),
      },
      {
        Header: 'Message',
        className: 'text',
        Cell: row => (
          <span className="nowrap">
            {row.original.deleted ? (
              <em className="text-muted">
                {row.original.announcementRemoved
                  ? ANNOUNCEMENT_REMOVED_TEXT
                  : DELETED_MESSAGE_TEXT}
              </em>
            ) : (
              row.original.text
            )}
          </span>
        ),
      },
    ];
  }

  renderBody() {
    const { memberItem, allMembers } = this.props;
    const target = this.getTarget();

    if (!target) {
      return (
        <p className="text-muted">
          Tiny Champions cannot be messaged directly, and there is no billing
          owner on this record to contact instead.
        </p>
      );
    }

    if (this.props.error) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load the conversation.</strong>
          <div>{this.props.error}</div>
        </div>
      );
    }

    if (!this.state.viewerId || this.props.loading) {
      return <ReactSpinner />;
    }

    const conversation = this.getConversation();
    if (!conversation) {
      return <p className="text-muted">No conversation yet.</p>;
    }

    // The messages slice belongs to whichever thread was subscribed last;
    // only trust it once it is this one.
    if (
      this.state.subscribedId !== conversation.id ||
      this.props.messagesLoading
    ) {
      return <ReactSpinner />;
    }

    if (this.props.messagesError) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load messages.</strong>
          <div>{this.props.messagesError}</div>
        </div>
      );
    }

    const data = this.props.messages.toArray();
    if (data.length < 1) {
      return <p className="text-muted">No messages yet.</p>;
    }

    return (
      <React.Fragment>
        {target.id !== memberItem.id && (
          <p className="text-muted">
            <small>
              {participantName(memberItem.id, indexMembersById(allMembers))} is
              a Tiny Champion, so this is the conversation with the person who
              pays for them.
            </small>
          </p>
        )}
        <ReactTable
          columns={this._columns}
          data={data}
          defaultPageSize={data.length}
          pageSize={data.length}
          showPagination={false}
        />
      </React.Fragment>
    );
  }

  render() {
    return (
      <div className="row smsTable">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>
              Conversation
              <NavLink
                to={`/MemberConversation/${this.props.memberItem.id}`}
                className="btn btn-link btn-sm"
              >
                Open
              </NavLink>
            </h3>
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

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
  unsubscribeConversations: conversationActions.unsubscribeConversations,
  unsubscribeMessages: conversationActions.unsubscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
};

/**
 * The 1:1 conversation with this member, on their profile beside the SMS
 * and email history -- read-only here, with a link through to the thread
 * for replying.
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
        if (this.unmounted) {
          // Signing in is asynchronous: by the time it finishes the profile
          // may already be gone, and a listener started now would have
          // nobody to stop it.
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

  /**
   * Opens the full thread. Every row here leads to the same place -- this
   * panel is a read-only preview of one conversation, so a click anywhere
   * in it means "take me to it".
   *
   * The heading's own Open link is what navigates: KappNavLink builds the
   * URL with the kapp it belongs to, and activating that link keeps the
   * routing in one place rather than assembling a path here.
   */
  openThread = () => {
    const link = this.panel && this.panel.querySelector('.conversation-open');
    if (link) {
      link.click();
    }
  };

  /**
   * Makes each message row a target for that click. Header rows come
   * through with no rowInfo and are left alone.
   */
  messageRowProps = (state, rowInfo) =>
    rowInfo ? { onClick: this.openThread, style: { cursor: 'pointer' } } : {};

  componentWillUnmount() {
    // Both listeners were started here, so both end here -- a profile is
    // opened and left far more often than the conversations page is.
    this.unmounted = true;
    this.props.unsubscribeConversations();
    this.props.unsubscribeMessages();
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

  getConversation() {
    if (!this.state.viewerId) {
      return null;
    }
    const id = conversationId(this.props.memberItem.id, this.state.viewerId);
    return this.props.conversations
      .toArray()
      .find(conversation => conversation.id === id);
  }

  getColumns() {
    return [
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
      {
        Header: 'From',
        width: 200,
        className: 'direction',
        Cell: row => (
          <span>
            {row.original.senderId === this.state.viewerId
              ? 'You'
              : participantName(
                  row.original.senderId,
                  indexMembersById(this.props.allMembers),
                )}
          </span>
        ),
      },
      {
        Header: 'Date and time',
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
    ];
  }

  renderBody() {
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
      <ReactTable
        columns={this._columns}
        data={data}
        defaultPageSize={data.length}
        pageSize={data.length}
        showPagination={false}
        getTrProps={this.messageRowProps}
      />
    );
  }

  render() {
    return (
      <div className="row smsTable" ref={element => (this.panel = element)}>
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>
              Conversation
              <NavLink
                to={`/MemberConversation/${this.props.memberItem.id}`}
                className="btn btn-link btn-sm conversation-open"
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

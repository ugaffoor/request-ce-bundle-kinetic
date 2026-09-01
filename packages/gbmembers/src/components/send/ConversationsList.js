import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { KappNavLink as NavLink } from 'common';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { initialiseFirebase } from '../../lib/firebase';
import { ensureFirebaseSignIn } from '../../lib/firebaseAuth';
import {
  staffParticipantId,
  indexMembersById,
  groupConversationsByParticipant,
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
  setConversationsError: conversationActions.setConversationsError,
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

export class ConversationsList extends Component {
  constructor(props) {
    super(props);
    // Which grouped rows are open, keyed by participant id. Collapsed by
    // default so the list stays one line per person.
    this.state = { expanded: {} };
  }

  toggle = participantId => {
    this.setState(state => ({
      expanded: {
        ...state.expanded,
        [participantId]: !state.expanded[participantId],
      },
    }));
  };

  renderGroup(group) {
    const isExpanded = !!this.state.expanded[group.participantId];
    const threadCount = group.conversations.length;

    // One thread is the normal case -- no expander, just a link.
    if (threadCount < 2) {
      return (
        <tr key={group.participantId}>
          <td>
            <NavLink to="/Conversations">{group.name}</NavLink>
          </td>
          <td>
            {group.latest.lastMessage ? group.latest.lastMessage.text : ''}
          </td>
          <td>{when(group.latest.updatedAt)}</td>
        </tr>
      );
    }

    return (
      <React.Fragment key={group.participantId}>
        <tr>
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
            </button>
          </td>
          <td>
            {group.latest.lastMessage ? group.latest.lastMessage.text : ''}
          </td>
          <td>{when(group.latest.updatedAt)}</td>
        </tr>

        {isExpanded &&
          group.conversations.map(conversation => (
            <tr key={conversation.id} className="conversation-thread">
              <td style={{ paddingLeft: '2.5rem' }}>
                <NavLink to="/Conversations">
                  <small>Open thread</small>
                </NavLink>
              </td>
              <td>
                <small>
                  {conversation.lastMessage
                    ? conversation.lastMessage.text
                    : ''}
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
      conversations.toArray(),
      membersById,
    );

    return (
      <div className="options">
        <h4 className="title">
          Conversations
          <NavLink to="/NewConversation" className="btn btn-primary pull-right">
            New Conversation
          </NavLink>
        </h4>

        {loading ? (
          <ReactSpinner />
        ) : error ? (
          <div className="alert alert-danger">
            <strong>Could not load conversations.</strong>
            <div>{error}</div>
          </div>
        ) : groups.length < 1 ? (
          <p>No conversations yet.</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>With</th>
                <th>Last message</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>{groups.map(group => this.renderGroup(group))}</tbody>
          </table>
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
)(ConversationsList);

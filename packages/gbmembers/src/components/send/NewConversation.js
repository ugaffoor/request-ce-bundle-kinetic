import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { KappNavLink as NavLink } from 'common';
import Select from 'react-select';
import ReactSpinner from 'react16-spinjs';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as conversationActions } from '../../redux/modules/conversations';
import {
  ensureFirebaseSignIn,
  getSignedInUid,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import { SEND_KINDS } from '../../lib/conversationSchema';
import { removeExcludedMembers, matchesMemberFilter } from '../../utils/utils';
import { canUseConversations } from '../../lib/conversationAccess';
import { initialiseFirebase, getFirebaseConfig } from '../../lib/firebase';

const ACTIVE_MEMBERS = '__active_members__';
const INACTIVE_MEMBERS = '__inactive_members__';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  memberLists: state.member.app.memberLists,
  space: state.member.app.space,
  spaceSlug: state.member.app.spaceSlug,
  kappSlug: state.app.config.kappSlug,
  profile: state.member.app.profile,
  sending: state.member.conversations.sending,
  sendError: state.member.conversations.sendError,
  lastSentAt: state.member.conversations.lastSentAt,
});

const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
  sendMessage: conversationActions.sendMessage,
};

const memberName = member => {
  const name = (
    (member.values['Last Name'] || '') +
    ' ' +
    (member.values['First Name'] || '')
  ).trim();

  // Some member records carry no name fields. Falling back keeps them
  // findable rather than rendering a blank, unsearchable option.
  return name || member.values['Email'] || `Member ${member.id}`;
};

// Status is shown alongside the name so it is obvious when a conversation
// is being started with someone who is not currently active.
const memberLabel = member => {
  const status = member.values['Status'];
  const name = memberName(member);
  return status && status !== 'Active' ? `${name} (${status})` : name;
};

const byName = (a, b) => {
  const aName = memberName(a).toLowerCase();
  const bName = memberName(b).toLowerCase();
  if (aName < bName) return -1;
  if (aName > bName) return 1;
  return 0;
};

export class NewConversation extends Component {
  constructor(props) {
    super(props);
    this.state = {
      listOption: null,
      memberOptions: [],
      kind: SEND_KINDS.CONVERSATION,
      groupName: '',
      message: '',
    };
  }

  /**
   * The saved member lists from the profile, plus the two implicit lists the
   * campaign pages also offer. Each option carries the ids it resolves to,
   * so selecting one narrows the student picker below.
   */
  getListOptions() {
    const { allMembers, memberLists, space } = this.props;

    // Rebuilt only when its inputs actually change. This runs a filter pass
    // per saved list over every member, and render() is re-entered on each
    // keystroke in the message box and both pickers -- recomputing it there
    // stalls typing on a large roster.
    const cached = this.listOptionsCache;
    if (
      cached &&
      cached.allMembers === allMembers &&
      cached.memberLists === memberLists &&
      cached.space === space
    ) {
      return cached.value;
    }

    const options = [
      {
        value: ACTIVE_MEMBERS,
        label: 'Active Members',
        ids: allMembers
          .filter(member => member.values['Status'] !== 'Inactive')
          .map(member => member.id),
      },
      {
        value: INACTIVE_MEMBERS,
        label: 'Inactive Members',
        ids: allMembers
          .filter(member => member.values['Status'] === 'Inactive')
          .map(member => member.id),
      },
    ];

    if (memberLists) {
      memberLists.forEach(list => {
        const matched = removeExcludedMembers(
          matchesMemberFilter(space, allMembers, list.filters),
          list.excluded !== undefined ? list.excluded : [],
        );
        options.push({
          value: list.name,
          label: list.name,
          ids: matched.map(member => member.id),
        });
      });
    }

    const value = options.filter(option => option.ids.length > 0);
    this.listOptionsCache = { allMembers, memberLists, space, value };
    return value;
  }

  /**
   * Students available to message, narrowed by the selected list. With no
   * list chosen every member is offered -- unlike a bulk campaign, a one to
   * one conversation with a frozen or inactive member is legitimate.
   */
  getStudentOptions() {
    const { allMembers } = this.props;
    const { listOption } = this.state;

    // Same reasoning as getListOptions: this sorts the whole roster, and a
    // fresh array identity here also makes react-select rebuild its menu on
    // every keystroke.
    const cached = this.studentOptionsCache;
    if (
      cached &&
      cached.allMembers === allMembers &&
      cached.listOption === listOption
    ) {
      return cached.value;
    }

    const pool = listOption
      ? allMembers.filter(member => listOption.ids.includes(member.id))
      : allMembers;

    const value = pool
      .slice()
      .sort(byName)
      .map(member => ({
        value: member.id,
        label: memberLabel(member),
      }));
    this.studentOptionsCache = { allMembers, listOption, value };
    return value;
  }

  handleListChange = listOption => {
    // Drop any selected student who falls outside the new list, rather than
    // leaving a selection on screen that contradicts the filter.
    this.setState(state => ({
      listOption,
      memberOptions: listOption
        ? state.memberOptions.filter(option =>
            listOption.ids.includes(option.value),
          )
        : state.memberOptions,
    }));
  };

  /**
   * This portal's own participant id, matching what the mobile app expects
   * for staff. Null until the member app has loaded the profile and space,
   * which is why Send stays disabled until then.
   */
  senderId() {
    // The uid Firebase signed us in as. NOT derived from space + username:
    // mintFirebaseToken keys staff WITH a member record to their member GUID
    // and only staff without one to staff_{space}_{user}, and the rules
    // require senderId == request.auth.uid either way.
    return getSignedInUid();
  }

  isAnnouncement() {
    return this.state.kind === SEND_KINDS.ANNOUNCEMENT;
  }

  isGroup() {
    return this.state.kind === SEND_KINDS.GROUP;
  }

  handleSend = () => {
    const senderId = this.senderId();
    if (!senderId) {
      return;
    }

    // An announcement goes to the school's own thread, so it takes no
    // recipients at all -- picking students for one would be misleading.
    if (this.isAnnouncement()) {
      this.props.sendMessage({
        kind: SEND_KINDS.ANNOUNCEMENT,
        staffId: senderId,
        spaceSlug: this.props.spaceSlug,
        domain: FRANCHISE_DOMAIN,
        text: this.state.message.trim(),
      });
      return;
    }

    if (this.state.memberOptions.length < 1) {
      return;
    }

    this.props.sendMessage({
      // Each recipient gets their own 1:1 thread, so no one sees who else
      // was messaged. A broadcast additionally marks each thread one-way.
      kind: this.state.kind,
      groupName: this.state.groupName,
      memberIds: this.state.memberOptions.map(option => option.value),
      staffId: senderId,
      spaceSlug: this.props.spaceSlug,
      text: this.state.message.trim(),
    });
  };

  componentDidUpdate(prevProps) {
    // Only once a send has actually landed -- the text survives a failure so
    // it can be retried rather than being lost.
    if (
      this.props.lastSentAt &&
      this.props.lastSentAt !== prevProps.lastSentAt
    ) {
      this.setState({ message: '' });

      // Hand the user to the thread list, where the conversation they just
      // started appears alongside the existing ones, rather than leaving
      // them looking at an empty composer with no sign anything happened.
      if (this.props.history && this.props.kappSlug) {
        this.props.history.push(`/kapps/${this.props.kappSlug}/Conversations`);
      }
    }
  }

  renderConnectionStatus() {
    const config = getFirebaseConfig(this.props.space);
    if (!config) {
      return (
        <p style={{ color: '#97292c' }}>
          Not connected to Firebase &mdash; no configuration found for this
          space.
        </p>
      );
    }

    const app = initialiseFirebase(this.props.space);
    return app ? (
      <p style={{ color: '#1f6047' }}>
        Connected to Firebase project <strong>{config.projectId}</strong>.
      </p>
    ) : (
      <p style={{ color: '#97292c' }}>
        Firebase configuration found but the app failed to initialise.
      </p>
    );
  }

  render() {
    // Routes are reachable by URL, so the page guards itself rather than
    // relying on the Send tab having hidden the button.
    if (!canUseConversations(this.props.profile)) {
      return (
        <div className="container-fluid leads">
          <div className="leadContents">
            <div className="options">
              <h4 className="title">New Conversation</h4>
              <p>
                You do not have access to conversations. Ask a space admin to
                add you to the Program Managers or Kiosk role.
              </p>
            </div>
          </div>
        </div>
      );
    }

    const studentOptions = this.getStudentOptions();
    const canSend =
      (this.isAnnouncement() || this.state.memberOptions.length > 0) &&
      // A group without a name shows as a blank row in everyone's list.
      (!this.isGroup() || this.state.groupName.trim() !== '') &&
      this.state.message.trim() !== '' &&
      !this.props.sending &&
      !!this.senderId();

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">New Conversation</h4>
            {this.renderConnectionStatus()}
            {/*
              Only blank the form on the first load. AppContainer refetches
              members every 30 seconds, and keying this on membersLoading
              alone tore the composer down mid-refresh -- losing focus, the
              picker selection and the caret while someone was typing.
            */}
            {this.props.membersLoading && this.props.allMembers.length === 0 ? (
              <ReactSpinner />
            ) : (
              <div>
                <div className="form-group">
                  <label htmlFor="conversation-kind">Send as</label>
                  <select
                    id="conversation-kind"
                    className="form-control"
                    value={this.state.kind}
                    onChange={e => this.setState({ kind: e.target.value })}
                  >
                    <option value={SEND_KINDS.CONVERSATION}>
                      Conversation &mdash; each student can reply
                    </option>
                    <option value={SEND_KINDS.GROUP}>
                      Group &mdash; one shared thread, everyone sees everyone
                    </option>
                    <option value={SEND_KINDS.BROADCAST}>
                      Broadcast &mdash; one-way, students cannot reply
                    </option>
                    <option value={SEND_KINDS.ANNOUNCEMENT}>
                      Announcement &mdash; posted to the whole school
                    </option>
                  </select>
                  {this.isAnnouncement() && (
                    <small className="text-muted">
                      Goes to every member of {this.props.spaceSlug}, so there
                      is no one to pick.
                    </small>
                  )}
                </div>
                {!this.isAnnouncement() && (
                  <React.Fragment>
                    <div className="form-group">
                      <label htmlFor="conversation-list">
                        Filter by list <small>(optional)</small>
                      </label>
                      <Select
                        inputId="conversation-list"
                        value={this.state.listOption}
                        onChange={this.handleListChange}
                        options={this.getListOptions()}
                        placeholder="All members"
                        isClearable={true}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="conversation-student">
                        Students{' '}
                        <small>
                          ({this.state.memberOptions.length} selected of{' '}
                          {studentOptions.length} available)
                        </small>
                      </label>
                      <Select
                        inputId="conversation-student"
                        value={this.state.memberOptions}
                        onChange={memberOptions =>
                          this.setState({ memberOptions: memberOptions || [] })
                        }
                        options={studentOptions}
                        placeholder="Search for students by name"
                        isMulti={true}
                        isClearable={true}
                        closeMenuOnSelect={false}
                        noOptionsMessage={() => 'No matching students'}
                      />
                    </div>
                  </React.Fragment>
                )}
                {this.isGroup() && (
                  <div className="form-group">
                    <label htmlFor="conversation-group-name">Group name</label>
                    <input
                      id="conversation-group-name"
                      type="text"
                      className="form-control"
                      value={this.state.groupName}
                      onChange={e =>
                        this.setState({ groupName: e.target.value })
                      }
                      placeholder="e.g. Monday Advanced"
                    />
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="conversation-message">Message</label>
                  <textarea
                    id="conversation-message"
                    className="form-control"
                    rows="6"
                    value={this.state.message}
                    onChange={e => this.setState({ message: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  {this.props.sendError && (
                    <div className="alert alert-danger">
                      <strong>Message not sent.</strong>
                      <div>{this.props.sendError}</div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={this.handleSend}
                    disabled={!canSend}
                  >
                    {this.props.sending ? 'Sending...' : 'Send'}
                  </button>
                  <NavLink to="/Send" className="btn btn-link">
                    Cancel
                  </NavLink>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const NewConversationContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      if (this.props.allMembers.length === 0 && !this.props.membersLoading) {
        this.props.fetchMembers({ memberInitialLoadComplete: false });
      }

      // Firestore rules reject an unauthenticated write, so get the Firebase
      // sign-in out of the way while the composer is being filled in rather
      // than discovering it is missing on the first Send.
      const app = initialiseFirebase(this.props.space);
      const username = this.props.profile && this.props.profile.username;
      if (app) {
        ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username));
      }
    },
  }),
)(NewConversation);

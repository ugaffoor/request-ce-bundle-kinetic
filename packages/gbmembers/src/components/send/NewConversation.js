import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { KappNavLink as NavLink } from 'common';
import Select from 'react-select';
import ReactSpinner from 'react16-spinjs';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as memberActions } from '../../redux/modules/members';
import { removeExcludedMembers, matchesMemberFilter } from '../../utils/utils';
import { initialiseFirebase, getFirebaseConfig } from '../../lib/firebase';

const ACTIVE_MEMBERS = '__active_members__';
const INACTIVE_MEMBERS = '__inactive_members__';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  memberLists: state.member.app.memberLists,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
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
      memberOption: null,
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

    return options.filter(option => option.ids.length > 0);
  }

  /**
   * Students available to message, narrowed by the selected list. With no
   * list chosen every member is offered -- unlike a bulk campaign, a one to
   * one conversation with a frozen or inactive member is legitimate.
   */
  getStudentOptions() {
    const { allMembers } = this.props;
    const { listOption } = this.state;

    const pool = listOption
      ? allMembers.filter(member => listOption.ids.includes(member.id))
      : allMembers;

    return pool
      .slice()
      .sort(byName)
      .map(member => ({
        value: member.id,
        label: memberLabel(member),
      }));
  }

  handleListChange = listOption => {
    // Clear the selected student if they fall outside the new list.
    this.setState(state => {
      const stillValid =
        state.memberOption &&
        (!listOption || listOption.ids.includes(state.memberOption.value));
      return {
        listOption,
        memberOption: stillValid ? state.memberOption : null,
      };
    });
  };

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
    const studentOptions = this.getStudentOptions();
    const canSend =
      this.state.memberOption !== null && this.state.message.trim() !== '';

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">New Conversation</h4>
            {this.renderConnectionStatus()}
            {this.props.membersLoading ? (
              <ReactSpinner />
            ) : (
              <div>
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
                    Student <small>({studentOptions.length} available)</small>
                  </label>
                  <Select
                    inputId="conversation-student"
                    value={this.state.memberOption}
                    onChange={memberOption => this.setState({ memberOption })}
                    options={studentOptions}
                    placeholder="Search for a student by name"
                    isClearable={true}
                    noOptionsMessage={() => 'No matching students'}
                  />
                </div>
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
                  {/*
                    There is no conversations back end yet, so nothing is
                    dispatched here. Wire this up to the conversations action
                    once the Firestore schema is known.
                  */}
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!canSend}
                  >
                    Send
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
    },
  }),
)(NewConversation);

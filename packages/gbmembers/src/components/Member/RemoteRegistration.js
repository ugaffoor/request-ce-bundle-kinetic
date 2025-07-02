import React, { Component, Fragment } from 'react';
import { compose, withState, lifecycle, withProps } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { withHandlers } from 'recompose';
import { KappNavLink as NavLink, Loading } from 'common';
import 'react-day-picker/lib/style.css';
import { CoreForm } from 'react-kinetic-core';
import { Utils } from 'common';
import { actions as appActions } from '../../redux/modules/memberApp';

const globals = import('common/globals');

const mapStateToProps = state => {
  return {
    profile: state.member.app.profile,
    space: state.member.app.space,
    allMembers: state.member.members.allMembers,
    memberItem: state.member.members.currentMember,
    kapps: state.app.kapps,
  };
};
const mapDispatchToProps = dispatch => {
  console.log('mapDispatchToProps initialized');
  return {};
};
var migrationThis = undefined;

export const handleLoaded = props => form => {
  console.log('handleLoaded');
  $('#migrationFormLoading').hide();
};
export const handleUpdated = props => response => {
  K.reset();

  window.location =
    '/#/kapps/gbmembers/Member/' + response.submission.values['Member GUID'];
};
export const handleCreated = props => response => {
  console.log('handleCreated');
  K.reset();

  if (response.submission.id) {
    let idx = migrationThis.props.allMembers.findIndex(
      member => member.id === response.submission.values['Member GUID'],
    );
    migrationThis.props.allMembers[idx].remoteRegistrationForm =
      response.submission;
  }
  window.location = '/#/kapps/gbmembers/Member/' + migrationThis.props.memberID;
};
export const handleError = props => response => {
  console.log('handleError');
};

export class StartMemberMigration extends Component {
  constructor(props) {
    super(props);

    migrationThis = this;
    bundle.config.widgets.space = this.props.space;
    bundle.config.widgets.profile = this.props.profile;
    var initValues = {
      'Member GUID': this.props.memberID,
      'Registration Mode': 'Registration',
    };
    let url = this.props.kapps
      .find(elem => elem.slug === 'gbmembers')
      .attributes.find(elem => elem.name === 'Kinetic Messaging Server URL')
      .values[0];
    if (url !== undefined) {
      initValues['Messages URL'] = this.props.kapps
        .find(elem => elem.slug === 'gbmembers')
        .attributes.find(
          elem => elem.name === 'Kinetic Messaging Server URL',
        ).values[0];
    }

    this.state = {
      initValues: initValues,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div className="page2">
        <div id="migrationFormLoading">
          <Loading text="Loading ..." />
        </div>
        <Fragment>
          <CoreForm
            form={
              Utils.getAttributeValue(
                this.props.space,
                'Billing Company',
              ).toLowerCase() + '-remote-registration'
            }
            kapp="services"
            values={this.state.initValues}
            loaded={this.props.handleLoaded}
            created={this.props.handleCreated}
            error={this.props.handleError}
            globals={globals}
          />
        </Fragment>
        <span className="buttons">
          <NavLink
            to={`/Member/${this.props.memberID}`}
            className="btn btn-primary"
            activeClassName="active"
          >
            Cancel
          </NavLink>
        </span>
      </div>
    );
  }
}
export class EditMemberMigration extends Component {
  constructor(props) {
    super(props);

    migrationThis = this;
    bundle.config.widgets.space = this.props.space;
    bundle.config.widgets.profile = this.props.profile;
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div className="page2">
        <div id="migrationFormLoading">
          <Loading text="Loading ..." />
        </div>
        <Fragment>
          <CoreForm
            loaded={this.props.handleLoaded}
            updated={this.props.handleUpdated}
            submission={this.props.remoteRegistrationID}
            review={false}
            globals={globals}
            ref={el => (this.componentRef = el)}
          />
        </Fragment>
        <span className="buttons">
          <NavLink
            to={`/Member/${this.props.memberID}`}
            className="btn btn-primary"
            activeClassName="active"
          >
            Cancel
          </NavLink>
        </span>
      </div>
    );
  }
}

export const RemoteRegistration = ({
  space,
  profile,
  kapps,
  allMembers,
  memberID,
  remoteRegistrationID,
  handleLoaded,
  handleUpdated,
  handleCreated,
  handleError,
}) => (
  <span>
    {remoteRegistrationID === undefined && (
      <StartMemberMigration
        space={space}
        profile={profile}
        kapps={kapps}
        allMembers={allMembers}
        memberID={memberID}
        handleLoaded={handleLoaded}
        handleCreated={handleCreated}
        handleError={handleError}
      />
    )}
    {remoteRegistrationID !== undefined && (
      <EditMemberMigration
        space={space}
        profile={profile}
        kapps={kapps}
        allMembers={allMembers}
        memberID={memberID}
        remoteRegistrationID={remoteRegistrationID}
        handleLoaded={handleLoaded}
        handleUpdated={handleUpdated}
        handleError={handleError}
      />
    )}
  </span>
);

export const RemoteRegistrationContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('memberID', 'setMemberID', ''),
  withHandlers({
    handleCreated,
    handleError,
    handleLoaded,
    handleUpdated,
  }),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {},
    UNSAFE_componentWillMount() {
      let remoteRegistrationID;
      if (this.props.memberItem.remoteRegistrationForm !== undefined) {
        remoteRegistrationID = this.props.memberItem.remoteRegistrationForm.id;
      }
      this.setState({
        memberID: this.props.match.params.id,
        remoteRegistrationID: remoteRegistrationID,
      });
    },
  }),
)(RemoteRegistration);

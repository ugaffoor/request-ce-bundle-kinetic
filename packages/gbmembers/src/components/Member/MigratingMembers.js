import React, { Component, Fragment } from 'react';
import { compose, withState, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { withHandlers } from 'recompose';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import { actions as appActions } from '../../redux/modules/memberApp';
import {
  handleChange,
  handleNewChange,
  handleDateChange,
  handleProgramChange,
  getDateValue,
  getLocalePreference,
} from './MemberUtils';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { CoreForm } from 'react-kinetic-core';

const globals = import('common/globals');

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  beltSizes: state.member.app.beltSizes,
  profile: state.member.app.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
var migrationThis = undefined;

export const handleLoaded = props => form => {
  form.getFieldByName('Member GUID').value(migrationThis.props.memberItem.id);
};
export const handleUpdated = props => response => {};
export const handleError = props => response => {};

export class StartMemberMigration extends Component {
  constructor(props) {
    super(props);

    migrationThis = this;

    this.state = {
      memberItem: {
        values: this.props.memberItem.values,
      },
      editMemberDetails: true,
      submitMigrationForm: false,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div>
        {this.state.editMemberDetails && (
          <div className="page1">
            <div className="memberDetails">
              <h1>Migrating Member</h1>
              <hr />
              <h5>
                Name:{' '}
                {this.props.memberItem.values['First Name'] +
                  ' ' +
                  this.props.memberItem.values['Last Name']}
              </h5>
              <h5>Email: {this.props.memberItem.values['Email']}</h5>
              <span className="line">
                <div>
                  <label htmlFor="program">Program</label>
                  <select
                    name="program"
                    id="program"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.state.memberItem.values['Ranking Program']
                    }
                    onChange={e => {
                      this.state.memberItem.values['Ranking Program'] =
                        e.target.value;
                      this.state.memberItem.values['Ranking Belt'] = undefined;

                      this.setState({
                        dummy: true,
                      });
                    }}
                  >
                    <option value="" />
                    {this.props.programs.map(program => (
                      <option key={program.program} value={program.program}>
                        {program.program}
                      </option>
                    ))}
                  </select>
                  <div className="droparrow" />
                </div>
                <div>
                  <label htmlFor="belt">Belt</label>
                  <select
                    name="belt"
                    id="belt"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.state.memberItem.values['Ranking Belt']}
                    onChange={e => {
                      this.state.memberItem.values['Ranking Belt'] =
                        e.target.value;
                    }}
                  >
                    <option key="" value=""></option>
                    {this.props.belts.map(
                      belt =>
                        belt.program ===
                          this.state.memberItem.values['Ranking Program'] && (
                          <option key={belt.belt} value={belt.belt}>
                            {belt.belt}
                          </option>
                        ),
                    )}
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div className="field">
                  <label id="lastPromotion" htmlFor="lastPromotion">
                    Last Promotion
                  </label>
                  <DayPickerInput
                    name="lastPromotion"
                    id="lastPromotion"
                    placeholder={moment(new Date())
                      .locale(
                        getLocalePreference(
                          this.props.space,
                          this.props.profile,
                        ),
                      )
                      .localeData()
                      .longDateFormat('L')
                      .toLowerCase()}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    value={getDateValue(
                      this.props.memberItem.values['Last Promotion'],
                    )}
                    fieldName="Last Promotion"
                    memberItem={this.state.memberItem}
                    onDayPickerHide={handleDateChange}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="attendanceCount">Attendance Count</label>
                  <input
                    type="number"
                    name="attendanceCount"
                    id="attendanceCount"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.state.memberItem.values['Attendance Count']
                    }
                    onChange={e => {
                      this.state.memberItem.values['Attendance Count'] =
                        e.target.value;
                    }}
                  />
                </div>
              </span>
              <span className="line">
                <div className="field">
                  <label htmlFor="maxWeeklyClasses">Max Weekly Classes</label>
                  <input
                    type="number"
                    name="maxWeeklyClasses"
                    id="maxWeeklyClasses"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.state.memberItem.values['Max Weekly Classes']
                    }
                    onChange={e => {
                      this.state.memberItem.values['Max Weekly Classes'] =
                        e.target.value;
                    }}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="beltSize">Belt Size</label>
                  <select
                    name="beltSize"
                    id="beltSize"
                    ref={input => (this.input = input)}
                    value={this.state.memberItem.values['Belt Size']}
                    onChange={e => {
                      this.state.memberItem.values['Belt Size'] =
                        e.target.value;
                    }}
                  >
                    <option value="" />
                    {this.props.beltSizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
            </div>
            <span className="buttons">
              <button
                type="button"
                id="cancelButton"
                className="btn btn-primary"
                onClick={e => {
                  this.props.setStartMigration(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                id="continueButton"
                className="btn btn-primary"
                onClick={e => {
                  this.setState({
                    editMemberDetails: false,
                    submitMigrationForm: true,
                  });
                }}
              >
                Continue
              </button>
            </span>
          </div>
        )}
        {this.state.submitMigrationForm && (
          <div className="page2">
            <Fragment>
              <CoreForm
                form="bambora-member-migration"
                kapp="services"
                review={false}
                onLoaded={this.props.handleLoaded}
                updated={this.props.handleUpdated}
                error={this.props.handleError}
                globals={globals}
              />
              <CoreForm
                kapp={kappSlug}
                form={form.slug}
                globals={globals}
                loaded={handleLoaded}
                created={handleCreated}
                completed={handleCompleted}
                values={values}
                notFoundComponent={ErrorNotFound}
                unauthorizedComponent={ErrorUnauthorized}
                unexpectedErrorComponent={ErrorUnexpected}
              />
            </Fragment>
          </div>
        )}
      </div>
    );
  }
}

export class MigrationDetail extends Component {
  constructor(props) {
    super(props);

    this.setStartMigration = this.setStartMigration.bind(this);

    let percentageStyle = {
      width: '0%',
    };

    this.state = {
      status: undefined,
      statusMembers: [],
      totalMembers: 0,
      migratedCount: 0,
      percentageStyle: percentageStyle,
      startMemberMigration: false,
      migratingMember: undefined,
    };
  }
  setStartMigration(start) {
    this.setState({
      startMemberMigration: start,
    });
  }
  isMigrated(member) {
    return (
      member.values['Billing User'] === 'YES' &&
      member.values['Biller Migrated'] === 'YES'
    );
  }
  isNotStarted(member) {
    return (
      member.values['Biller Migrated'] !== 'YES' &&
      (member.values['Billing Parent Member'] === undefined ||
        member.values['Billing Parent Member'] === '' ||
        member.values['Billing Parent Member'] === null) &&
      (member.values['Billing Customer Reference'] === undefined ||
        member.values['Billing Customer Reference'] === '' ||
        member.values['Billing Customer Reference'] === null)
    );
  }
  startMigration(member) {
    this.setState({
      startMemberMigration: true,
      migratingMember: member,
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    let allActive = nextProps.allMembers.filter(
      member =>
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Billing Payment Type'] !== 'Cash',
    );
    let migrated = allActive.filter(member => {
      return this.isMigrated(member);
    });

    let percentageStyle = {
      width: (migrated.length / allActive.length) * 100 + '%',
    };
    this.setState({
      totalMembers: allActive.length,
      migratedCount: migrated.length,
      percentageStyle: percentageStyle,
    });
  }
  render() {
    return (
      <div className="migrationSection">
        {!this.state.startMemberMigration && (
          <span>
            <div className="classSection">
              <span className="line">
                <div className="grading">
                  <label htmlFor="program">Status</label>
                  <select
                    name="status"
                    id="status"
                    ref={input => (this.input = input)}
                    onChange={e => {
                      let status = e.target.value;
                      let statusMembers = this.props.allMembers
                        .filter(
                          member =>
                            member.values['Status'] === 'Active' &&
                            member.values['Non Paying'] !== 'YES' &&
                            member.values['Billing Payment Type'] !== 'Cash',
                        )
                        .filter(member => {
                          var apply = false;
                          if (status === 'All') {
                            apply = true;
                          } else if (
                            status === 'Migrated' &&
                            this.isMigrated(member)
                          ) {
                            apply = true;
                          } else if (
                            status === 'Not Started' &&
                            this.isNotStarted(member)
                          ) {
                            apply = true;
                          }
                          return apply;
                        });
                      this.setState({
                        status: e.target.value,
                        statusMembers: statusMembers,
                      });
                    }}
                  >
                    <option value=""></option>
                    <option value="All">All</option>
                    <option value="Not Started">Not Started</option>
                    <option value="Migration Form Sent">
                      Migration Form Sent
                    </option>
                    <option value="Migrated">Migrated</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div className="ProgressSection">
                  <h4>Migration Progress</h4>
                  <span>
                    {this.state.migratedCount}/{this.state.totalMembers}
                  </span>
                  <div className="bar">
                    <div
                      className="percent"
                      style={this.state.percentageStyle}
                    ></div>
                  </div>
                </div>
              </span>
            </div>
            <div className="membersSection">
              <div className="members">
                {this.state.statusMembers.map((member, index) => {
                  let status = 'migrated';
                  let labeltext = 'Migrated';
                  if (this.isNotStarted(member)) {
                    status = 'notMigrated';
                    labeltext = 'Not Started';
                  }
                  return (
                    <span className="memberRow" key={index}>
                      <h4 className="memberName">
                        <NavLink to={`/Member/${member.id}`}>
                          {member.values['First Name']}{' '}
                          {member.values['Last Name']}
                        </NavLink>
                      </h4>
                      <div className={status}>
                        <span className="circle"></span>
                      </div>
                      <h4 className="label">{labeltext}</h4>
                      <div className="action">
                        {this.isNotStarted(member) && (
                          <button
                            type="button"
                            active="false"
                            className="btn btn-primary report-btn-default"
                            onClick={e => this.startMigration(member)}
                          >
                            Start Migration
                          </button>
                        )}
                      </div>
                    </span>
                  );
                })}
              </div>
            </div>
          </span>
        )}
        {this.state.startMemberMigration && (
          <StartMemberMigration
            space={this.props.space}
            profile={this.props.profile}
            memberItem={this.state.migratingMember}
            programs={this.props.programs}
            belts={this.props.belts}
            beltSizes={this.props.beltSizes}
            setStartMigration={this.setStartMigration}
            handleLoaded={this.props.handleLoaded}
            handleUpdated={this.props.handleUpdated}
            handleError={this.props.handleError}
          />
        )}
      </div>
    );
  }
}

export const MigrationMembers = ({
  allMembers,
  space,
  profile,
  programs,
  belts,
  beltSizes,
  handleLoaded,
  handleUpdated,
  handleError,
}) => (
  <MigrationDetail
    allMembers={allMembers}
    space={space}
    profile={profile}
    programs={programs}
    belts={belts}
    beltSizes={beltSizes}
    handleLoaded={handleLoaded}
    handleUpdated={handleUpdated}
    handleError={handleError}
  />
);

export const MigratingMembersContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(MigrationMembers);

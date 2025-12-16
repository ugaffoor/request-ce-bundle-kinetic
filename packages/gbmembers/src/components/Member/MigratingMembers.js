import React, { Component, Fragment } from 'react';
import { compose, withState, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { withHandlers } from 'recompose';
import { KappNavLink as NavLink, Loading } from 'common';
import moment from 'moment';
import { actions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import { actions as servicesActions } from '../../redux/modules/services';
import {
  handleDateChange,
  getDateValue,
  getLocalePreference,
} from './MemberUtils';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { CoreForm } from '@kineticdata/react';
import { StatusMessagesContainer } from '../StatusMessages';
import { Utils } from 'common';

const globals = import('common/globals');

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  beltSizes: state.member.app.beltSizes,
  profile: state.member.app.profile,
  space: state.member.app.space,
  memberMigrations: state.member.services.memberMigrations,
  memberMigrationsLoading: state.member.services.memberMigrationsLoading,
  migrationsLastFetchTime: state.member.services.migrationsLastFetchTime,
});
const mapDispatchToProps = {
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  updateMember: actions.updateMember,
  fetchMemberMigrations: servicesActions.fetchMemberMigrations,
};
var migrationThis = undefined;

export const handleLoaded = props => form => {
  console.log('handleLoaded');
  $('#migrationFormLoading').hide();
  migrationThis.setState({
    migrationFormCancelEnabled: false,
  });
};
export const handleUpdated = props => response => {
  K.reset();
  if (response.submission.id) {
    let idx = migrationThis.props.allMembers.findIndex(
      member => member.id === response.submission.values['Member GUID'],
    );
    migrationThis.props.allMembers[idx].migrationForm = response.submission;
  }
  migrationThis.props.setEditMigration(false);
};
export const handleCreated = props => response => {
  console.log('handleCreated');
  K.reset();

  if (response.submission.id) {
    let idx = migrationThis.props.allMembers.findIndex(
      member => member.id === response.submission.values['Member GUID'],
    );
    migrationThis.props.memberMigrations[
      migrationThis.props.memberMigrations.length
    ] =
      response.submission;
    migrationThis.props.allMembers[idx].migrationForm = response.submission;
    migrationThis.props.allMembers[idx].values['Billing User'] = 'YES';
    migrationThis.props.allMembers[idx].values['Billing Parent Member'] =
      migrationThis.props.allMembers[idx].id;
  }
  migrationThis.props.setStartMigration(false, true);
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
      'Member GUID': this.props.memberItem.id,
      'Registration Mode': 'Migration',
    };
    var values = {
      'Ranking Program': this.props.memberItem.values['Ranking Program'],
      'Ranking Belt': this.props.memberItem.values['Ranking Belt'],
      'Last Promotion': this.props.memberItem.values['Last Promotion'],
      'Attendance Count': this.props.memberItem.values['Attendance Count'],
      'Max Weekly Classes': this.props.memberItem.values['Max Weekly Classes'],
      'Belt Size': this.props.memberItem.values['Belt Size'],
    };
    this.state = {
      memberItem: {
        id: this.props.memberItem.id,
        values: values,
      },
      initValues: initValues,
      editMemberDetails: true,
      submitMigrationForm: false,
      migrationFormCancelEnabled: true,
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
                    defaultValue={this.state.memberItem.values['Ranking Belt']}
                    onChange={e => {
                      this.state.memberItem.values['Ranking Belt'] =
                        e.target.value;
                    }}
                  >
                    <option key="" value="" />
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
                      this.state.memberItem.values['Last Promotion'],
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
                  try {
                    K.reset();
                  } catch (e) {}
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
                  let idx = this.props.allMembers.findIndex(
                    member => member.id === this.state.memberItem.id,
                  );

                  if (
                    idx !== -1 &&
                    (this.props.allMembers[idx].values['Ranking Program'] !==
                      this.state.memberItem.values['Ranking Program'] ||
                      this.props.allMembers[idx].values['Ranking Belt'] !==
                        this.state.memberItem.values['Ranking Belt'] ||
                      this.props.allMembers[idx].values['Last Promotion'] !==
                        this.state.memberItem.values['Last Promotion'] ||
                      this.props.allMembers[idx].values['Attendance Count'] !==
                        this.state.memberItem.values['Attendance Count'] ||
                      this.props.allMembers[idx].values[
                        'Max Weekly Classes'
                      ] !==
                        this.state.memberItem.values['Max Weekly Classes'] ||
                      this.props.allMembers[idx].values['Belt Size'] !==
                        this.state.memberItem.values['Belt Size'])
                  ) {
                    var values = {};

                    values['Ranking Program'] = this.state.memberItem.values[
                      'Ranking Program'
                    ];
                    values['Ranking Belt'] = this.state.memberItem.values[
                      'Ranking Belt'
                    ];
                    values['Last Promotion'] = this.state.memberItem.values[
                      'Last Promotion'
                    ];
                    values['Attendance Count'] = this.state.memberItem.values[
                      'Attendance Count'
                    ];
                    values['Max Weekly Classes'] = this.state.memberItem.values[
                      'Max Weekly Classes'
                    ];
                    values['Belt Size'] = this.state.memberItem.values[
                      'Belt Size'
                    ];

                    this.props.updateMember({
                      id: this.props.memberItem.id,
                      memberItem: this.props.memberItem,
                      values: values,
                    });
                    for (let i = 0; i < this.props.allMembers.length; i++) {
                      if (
                        this.props.allMembers[i].id === this.props.memberItem.id
                      ) {
                        this.props.allMembers[i].values[
                          'Ranking Program'
                        ] = this.state.memberItem.values['Ranking Program'];
                        this.props.allMembers[i].values[
                          'Ranking Belt'
                        ] = this.state.memberItem.values['Ranking Belt'];
                        this.props.allMembers[i].values[
                          'Last Promotion'
                        ] = this.state.memberItem.values['Last Promotion'];
                        this.props.allMembers[i].values[
                          'Attendance Count'
                        ] = this.state.memberItem.values['Attendance Count'];
                        this.props.allMembers[i].values[
                          'Max Weekly Classes'
                        ] = this.state.memberItem.values['Max Weekly Classes'];
                        this.props.allMembers[i].values[
                          'Belt Size'
                        ] = this.state.memberItem.values['Belt Size'];
                        break;
                      }
                    }
                  }
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
              <button
                type="button"
                id="cancelButton"
                className="btn btn-primary"
                disabled={this.state.migrationFormCancelEnabled}
                onClick={e => {
                  this.props.setStartMigration(false);
                }}
              >
                Cancel
              </button>
            </span>
          </div>
        )}
      </div>
    );
  }
}
export class EditMemberMigration extends Component {
  constructor(props) {
    super(props);

    migrationThis = this;

    this.state = {
      id: this.props.memberItem.migrationForm.id,
      editMemberDetails: true,
      submitMigrationForm: false,
      migrationFormCancelEnabled: true,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div>
        <div className="page2">
          <div id="migrationFormLoading">
            <Loading text="Loading ..." />
          </div>
          <Fragment>
            <CoreForm
              loaded={this.props.handleLoaded}
              updated={this.props.handleUpdated}
              submission={this.state.id}
              review={false}
              globals={globals}
              ref={el => (this.componentRef = el)}
            />
          </Fragment>
          <span className="buttons">
            <button
              type="button"
              id="cancelButton"
              className="btn btn-primary"
              disabled={this.state.migrationFormCancelEnabled}
              onClick={e => {
                try {
                  K.reset();
                } catch (e) {}
                this.props.setEditMigration(false);
              }}
            >
              Cancel / Close
            </button>
          </span>
        </div>
      </div>
    );
  }
}
export class ViewMemberMigration extends Component {
  constructor(props) {
    super(props);

    migrationThis = this;

    this.state = {
      id: this.props.memberItem.migrationForm.id,
      viewMemberDetails: true,
      submitMigrationForm: false,
      migrationFormCancelEnabled: true,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return (
      <div>
        <div className="page2">
          <div id="migrationFormLoading">
            <Loading text="Loading ..." />
          </div>
          <Fragment>
            <CoreForm
              loaded={this.props.handleLoaded}
              submission={this.state.id}
              review={true}
              globals={globals}
              ref={el => (this.componentRef = el)}
            />
          </Fragment>
          <span className="buttons">
            <button
              type="button"
              id="cancelButton"
              className="btn btn-primary"
              disabled={this.state.migrationFormCancelEnabled}
              onClick={e => {
                this.props.setViewMigration(false);
              }}
            >
              Close
            </button>
          </span>
        </div>
      </div>
    );
  }
}

export class MigrationDetail extends Component {
  constructor(props) {
    super(props);

    this.setStartMigration = this.setStartMigration.bind(this);
    this.setEditMigration = this.setEditMigration.bind(this);
    this.setViewMigration = this.setViewMigration.bind(this);
    this.displayStatus = this.displayStatus.bind(this);

    let allActive = this.props.allMembers.filter(
      member =>
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Billing Payment Type'] !== 'Cash' &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '' ||
          member.values['Billing Parent Member'] === null ||
          member.values['Billing Parent Member'] === member.id ||
          (member.values['Billing Parent Member'] !== undefined &&
            member.values['Billing Parent Member'] !== '' &&
            member.values['Billing Parent Member'] !== null &&
            member.values['Billing Parent Member'] !== member.id)),
    );
    let migrated = allActive.filter(member => {
      return this.isMigrated(member);
    });

    let percentageStyle = {
      width: (migrated.length / allActive.length) * 100 + '%',
    };

    this.state = {
      status: undefined,
      allActive: allActive,
      statusMembers: [],
      totalMembers: allActive.length,
      migratedCount: migrated.length,
      percentageStyle: percentageStyle,
      startMemberMigration: false,
      editMemberMigration: false,
      viewMemberMigration: false,
      migratingMember: undefined,
      memberSearchValue: '',
      listSort: 'date',
    };
  }
  setStartMigration(start, justCreated) {
    let allActive = this.props.allMembers.filter(
      member =>
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Billing Payment Type'] !== 'Cash' &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '' ||
          member.values['Billing Parent Member'] === null ||
          member.values['Billing Parent Member'] === member.id ||
          (member.values['Billing Parent Member'] !== undefined &&
            member.values['Billing Parent Member'] !== '' &&
            member.values['Billing Parent Member'] !== null &&
            member.values['Billing Parent Member'] !== member.id)),
    );

    this.setState({
      startMemberMigration: start,
      allActive: allActive,
    });
    this.displayStatus(
      justCreated ? 'In Progress' : this.state.status,
      this.state.listSort,
    );
  }
  setEditMigration(start) {
    let allActive = this.props.allMembers.filter(
      member =>
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Billing Payment Type'] !== 'Cash' &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '' ||
          member.values['Billing Parent Member'] === null ||
          member.values['Billing Parent Member'] === member.id ||
          (member.values['Billing Parent Member'] !== undefined &&
            member.values['Billing Parent Member'] !== '' &&
            member.values['Billing Parent Member'] !== null &&
            member.values['Billing Parent Member'] !== member.id)),
    );

    this.setState({
      editMemberMigration: start,
      allActive: allActive,
    });
    this.displayStatus(this.state.status, this.state.listSort);
  }
  setViewMigration(start) {
    this.setState({
      viewMemberMigration: start,
    });
  }
  isMigrated(member) {
    let isChild =
      member.values['Billing Parent Member'] !== undefined &&
      member.values['Billing Parent Member'] !== '' &&
      member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== member.id;

    let parentMigrated = false;
    if (isChild) {
      var idx = this.props.allMembers.findIndex(mem => {
        return mem.id === member.values['Billing Parent Member'];
      });
      if (idx !== -1) {
        parentMigrated =
          this.props.allMembers[idx].values['Billing User'] === 'YES' &&
          this.props.allMembers[idx].values['Biller Migrated'] === 'YES';
      }
    }

    return (
      (isChild && parentMigrated) ||
      (member.values['Billing User'] === 'YES' &&
        member.values['Biller Migrated'] === 'YES')
    );
  }
  isMigratedFormCompletedMain(member) {
    return (
      member.values['Billing User'] === 'YES' &&
      member.values['Biller Migrated'] === 'YES' &&
      member.migrationForm !== undefined
    );
  }
  isMigratedFormCompletedChild(member) {
    let isChild =
      member.values['Billing Parent Member'] !== undefined &&
      member.values['Billing Parent Member'] !== '' &&
      member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== member.id;

    if (isChild) {
      var idx = this.props.allMembers.findIndex(mem => {
        return mem.id === member.values['Billing Parent Member'];
      });
      if (idx !== -1) {
        return this.isMigrated(this.props.allMembers[idx]);
      }
    }
    return false;
  }
  getCompletedDate(member) {
    let isChild =
      member.values['Billing Parent Member'] !== undefined &&
      member.values['Billing Parent Member'] !== '' &&
      member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== member.id;

    if (isChild) {
      var idx = this.props.allMembers.findIndex(mem => {
        return mem.id === member.values['Billing Parent Member'];
      });
      if (idx !== -1) {
        return moment(this.props.allMembers[idx].migrationForm.submittedAt);
      }
    }

    return moment(member.migrationForm.submittedAt);
  }
  getSentDate(member) {
    return moment(member.migrationForm.values['Form Completion Sent']).format(
      'L HH:mm',
    );
  }
  getBillingDate(member) {
    return moment(
      member.migrationForm.values['The first instalment is due on'],
    ).format('L');
  }
  isNotStarted(member) {
    return (
      member.values['Biller Migrated'] !== 'YES' &&
      (member.values['Billing Parent Member'] === undefined ||
        member.values['Billing Parent Member'] === '' ||
        member.values['Billing Parent Member'] === null ||
        member.values['Billing Parent Member'] === member.id) &&
      member.migrationForm === undefined
    );
  }
  isStarted(member) {
    let isChild = false;
    var midx = -1;
    var idx = this.props.memberMigrations.findIndex(form => {
      return (
        form.values['Member GUID'] !== member.id &&
        form.values['membersJSON'] !== undefined &&
        form.values['membersJSON'].includes(member.id)
      );
    });

    if (idx != -1) {
      midx = this.props.allMembers.findIndex(mem => {
        return (
          mem.id === this.props.memberMigrations[idx].values['Member GUID']
        );
      });
      if (midx != -1) {
        isChild = true;
      }
    }

    let parentInProgress = false;
    if (isChild) {
      parentInProgress =
        this.props.allMembers[midx].values['Biller Migrated'] !== 'YES' &&
        this.props.allMembers[midx].migrationForm !== undefined &&
        moment(
          this.props.allMembers[midx].migrationForm.values[
            'The first instalment is due on'
          ],
        ).isAfter(moment());
    }

    return (
      (isChild && parentInProgress) ||
      (member.values['Biller Migrated'] !== 'YES' &&
        member.migrationForm !== undefined &&
        (moment(
          member.migrationForm.values['The first instalment is due on'],
        ).isAfter(moment()) ||
          member.migrationForm.coreState === 'Submitted'))
    );
  }
  isSubmitted(member) {
    return (
      member.migrationForm !== undefined &&
      member.migrationForm.coreState === 'Submitted'
    );
  }
  isStartedMain(member) {
    return (
      member.values['Biller Migrated'] !== 'YES' &&
      member.migrationForm !== undefined &&
      (moment(
        member.migrationForm.values['The first instalment is due on'],
      ).isAfter(moment()) ||
        member.migrationForm.coreState === 'Submitted')
    );
  }
  isStartedChild(member) {
    var idx = this.props.memberMigrations.findIndex(form => {
      return (
        form.values['Member GUID'] !== member.id &&
        form.values['membersJSON'] !== undefined &&
        form.values['membersJSON'].includes(member.id)
      );
    });

    if (idx != -1) {
      var midx = this.props.allMembers.findIndex(mem => {
        return (
          mem.id === this.props.memberMigrations[idx].values['Member GUID']
        );
      });
      if (midx != -1) {
        if (!this.isSubmitted(this.props.allMembers[midx])) {
          return true;
        }
      }
    }

    return false;
  }
  getParentName(member) {
    var idx = this.props.allMembers.findIndex(mem => {
      return mem.id === member.values['Billing Parent Member'];
    });
    if (idx !== -1) {
      return (
        this.props.allMembers[idx].values['Last Name'] +
        ' ' +
        this.props.allMembers[idx].values['First Name']
      );
    }

    var idx = this.props.memberMigrations.findIndex(form => {
      return (
        form.values['membersJSON'] !== undefined &&
        form.values['membersJSON'].includes(member.id)
      );
    });
    if (idx != -1) {
      return (
        this.props.memberMigrations[idx].values['Student Last Name'] +
        ' ' +
        this.props.memberMigrations[idx].values['Student First Name']
      );
    }
  }
  isExpired(member) {
    return (
      member.values['Biller Migrated'] !== 'YES' &&
      member.migrationForm !== undefined &&
      moment(
        member.migrationForm.values['The first instalment is due on'],
      ).isSameOrBefore(moment()) &&
      member.migrationForm.coreState !== 'Submitted'
    );
  }
  startMigration(member) {
    this.setState({
      startMemberMigration: true,
      migratingMember: member,
    });
  }
  editMigration(member) {
    this.setState({
      editMemberMigration: true,
      migratingMember: member,
    });
  }
  viewMigration(member) {
    this.setState({
      viewMemberMigration: true,
      migratingMember: member,
    });
  }
  displayStatus(status, sortOrder) {
    let statusMembers = this.state.allActive
      .filter(member => {
        var apply = false;
        if (status === 'All') {
          apply = true;
        } else if (status === 'Migrated' && this.isMigrated(member)) {
          apply = true;
        } else if (
          status === 'In Progress' &&
          (this.isStarted(member) || this.isStartedChild(member))
        ) {
          apply = true;
        } else if (status === 'Expired' && this.isExpired(member)) {
          apply = true;
        } else if (
          status === 'Not Started' &&
          this.isNotStarted(member) &&
          !this.isStartedChild(member)
        ) {
          apply = true;
        }
        return apply;
      })
      .sort((member1, member2) => {
        try {
          if (sortOrder === 'member') {
            if (
              (
                member1.values['Last Name'] + member1.values['First Name']
              ).toLowerCase() <
              (
                member2.values['Last Name'] + member2.values['First Name']
              ).toLowerCase()
            )
              return -1;
            if (
              (
                member1.values['Last Name'] + member1.values['First Name']
              ).toLowerCase() >
              (
                member2.values['Last Name'] + member2.values['First Name']
              ).toLowerCase()
            )
              return 1;
          } else {
            let date1 = moment();
            let date2 = moment();
            if (this.isMigrated(member1)) {
              date1 = this.getCompletedDate(member1);
            } else if (this.isStarted(member1)) {
              date1 = this.getSentDate(member1);
            } else if (this.isExpired(member1)) {
              date1 = this.getSentDate(member1);
            }
            if (this.isMigrated(member2)) {
              date2 = this.getCompletedDate(member2);
            } else if (this.isStarted(member2)) {
              date2 = this.getSentDate(member2);
            } else if (this.isExpired(member2)) {
              date2 = this.getSentDate(member2);
            }

            if (date1.isAfter(date2)) {
              return -1;
            } else if (date1.isBefore(date2)) {
              return 1;
            }
            return 0;
          }
        } catch (error) {
          return 0;
        }
        return 0;
      });
    this.setState({
      status: status,
      statusMembers: statusMembers,
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    let allActive = nextProps.allMembers.filter(
      member =>
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Billing Payment Type'] !== 'Cash' &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '' ||
          member.values['Billing Parent Member'] === null ||
          member.values['Billing Parent Member'] === member.id ||
          (member.values['Billing Parent Member'] !== undefined &&
            member.values['Billing Parent Member'] !== '' &&
            member.values['Billing Parent Member'] !== null &&
            member.values['Billing Parent Member'] !== member.id)),
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
      statusMembers: [],
      allActive: allActive,
    });
    this.displayStatus(this.state.status, this.state.listSort);
  }
  render() {
    return this.props.memberMigrationsLoading ? (
      <Loading text="Loading ..." />
    ) : (
      <div className="migrationSection">
        <StatusMessagesContainer />
        {!this.state.startMemberMigration &&
          !this.state.editMemberMigration &&
          !this.state.viewMemberMigration && (
            <span>
              <div className="classSection">
                <span className="line">
                  <div className="grading">
                    <label htmlFor="program">Status</label>
                    <select
                      name="status"
                      id="status"
                      value={this.state.status}
                      onChange={e => {
                        let status = e.target.value;
                        this.displayStatus(status, this.state.listSort);
                      }}
                    >
                      <option value="" />
                      <option value="All">All</option>
                      <option value="Not Started">Not Started</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Expired">Expired</option>
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
                      />
                    </div>
                  </div>
                </span>
                <span className="line">
                  <div className="memberFilter">
                    <input
                      type="text"
                      className="memberSearch"
                      id="memberSearch"
                      value={this.state.memberSearchValue}
                      placeholder="Member Search"
                      onChange={e => {
                        this.setState({ memberSearchValue: e.target.value });
                      }}
                    />
                  </div>
                </span>
                <span className="line">
                  <label htmlFor="migrationListSort">Sort by Member</label>
                  <div className="checkboxFilter">
                    <input
                      id="migrationListSort"
                      type="checkbox"
                      value="1"
                      onChange={e => {
                        this.displayStatus(
                          this.state.status,
                          this.state.listSort === 'member' ? 'date' : 'member',
                        );
                        this.setState({
                          listSort:
                            this.state.listSort === 'member'
                              ? 'date'
                              : 'member',
                        });
                      }}
                    />
                    <label htmlFor="migrationListSort" />
                  </div>
                </span>
              </div>
              <div className="membersSection">
                <div className="members">
                  <div className="count">{this.state.statusMembers.length}</div>
                  {this.state.statusMembers
                    .filter(member => {
                      let name =
                        member.values['First Name'].toUpperCase() +
                        ' ' +
                        member.values['Last Name'];
                      return name
                        .toUpperCase()
                        .includes(this.state.memberSearchValue.toUpperCase());
                    })
                    .map((member, index) => {
                      let status = 'migrated';
                      let labeltext = 'Migrated';
                      if (this.isStarted(member)) {
                        status = !this.isSubmitted(member)
                          ? 'inProgress'
                          : 'inProgressSubmitted';
                        labeltext = 'In Progress';
                        console.log(
                          member.values['Last Name'] +
                            ' ' +
                            member.values['First Name'],
                        );
                      } else if (this.isExpired(member)) {
                        status = 'expired';
                        labeltext = 'Expired';
                        console.log(
                          member.values['Last Name'] +
                            ' ' +
                            member.values['First Name'],
                        );
                      } else if (this.isNotStarted(member)) {
                        status = 'notMigrated';
                        labeltext = 'Not Started';
                        console.log(
                          member.values['Last Name'] +
                            ' ' +
                            member.values['First Name'],
                        );
                      } else {
                        console.log(
                          member.values['Last Name'] +
                            ' ' +
                            member.values['First Name'],
                        );
                      }
                      return (
                        <span className="memberRow" key={index}>
                          <h4 className="memberName">
                            <NavLink to={`/Member/${member.id}`}>
                              {member.values['Last Name']}{' '}
                              {member.values['First Name']}
                            </NavLink>
                          </h4>
                          <div className={status}>
                            <span className="circle" />
                          </div>
                          <h4 className="label">{labeltext}</h4>
                          <div className="action">
                            {this.isNotStarted(member) &&
                              !this.isStartedChild(member) && (
                                <button
                                  type="button"
                                  active="false"
                                  className="btn btn-primary report-btn-default"
                                  onClick={e => this.startMigration(member)}
                                >
                                  Start Migration
                                </button>
                              )}
                            {this.isStarted(member) &&
                              this.isStartedMain(member) &&
                              !this.isSubmitted(member) && (
                                <span className="buttonInfo">
                                  <button
                                    type="button"
                                    active="false"
                                    className="btn btn-primary report-btn-default"
                                    onClick={e => this.editMigration(member)}
                                  >
                                    Edit
                                  </button>
                                  <h5>
                                    Sent: {this.getSentDate(member)} Billing
                                    Date: {this.getBillingDate(member)}
                                  </h5>
                                </span>
                              )}
                            {this.isStarted(member) &&
                              this.isStartedMain(member) &&
                              this.isSubmitted(member) && (
                                <span className="buttonInfo">
                                  <button
                                    type="button"
                                    active="false"
                                    className="btn btn-primary report-btn-default"
                                    onClick={e => this.viewMigration(member)}
                                  >
                                    View
                                  </button>
                                  <h5>
                                    Completed:{' '}
                                    {this.getCompletedDate(member).format(
                                      'L HH:mm',
                                    )}
                                  </h5>
                                </span>
                              )}
                            {this.isStarted(member) &&
                              !this.isStartedMain(member) &&
                              this.isStartedChild(member) && (
                                <span className="buttonInfo">
                                  <h5>Parent: {this.getParentName(member)}</h5>
                                </span>
                              )}
                            {this.isExpired(member) && (
                              <span className="buttonInfo">
                                <button
                                  type="button"
                                  active="false"
                                  className="btn btn-primary report-btn-default"
                                  onClick={e => this.editMigration(member)}
                                >
                                  Edit
                                </button>
                                <h5>
                                  Sent: {this.getSentDate(member)} Billing Date:{' '}
                                  {this.getBillingDate(member)}
                                </h5>
                              </span>
                            )}
                            {this.isMigrated(member) &&
                              this.isMigratedFormCompletedMain(member) && (
                                <span className="buttonInfo">
                                  <button
                                    type="button"
                                    active="false"
                                    className="btn btn-primary report-btn-default"
                                    onClick={e => this.viewMigration(member)}
                                  >
                                    View
                                  </button>
                                  <h5>
                                    Completed:{' '}
                                    {this.getCompletedDate(member).format(
                                      'L HH:mm',
                                    )}
                                  </h5>
                                </span>
                              )}
                            {this.isMigratedFormCompletedChild(member) && (
                              <span className="buttonInfo">
                                <h5>Parent: {this.getParentName(member)}</h5>
                              </span>
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
            allMembers={this.props.allMembers}
            memberItem={this.state.migratingMember}
            programs={this.props.programs}
            belts={this.props.belts}
            beltSizes={this.props.beltSizes}
            setStartMigration={this.setStartMigration}
            memberMigrations={this.props.memberMigrations}
            handleLoaded={this.props.handleLoaded}
            handleCreated={this.props.handleCreated}
            handleError={this.props.handleError}
            updateMember={this.props.updateMember}
          />
        )}
        {this.state.editMemberMigration && (
          <EditMemberMigration
            space={this.props.space}
            profile={this.props.profile}
            allMembers={this.props.allMembers}
            memberItem={this.state.migratingMember}
            setEditMigration={this.setEditMigration}
            handleLoaded={this.props.handleLoaded}
            handleUpdated={this.props.handleUpdated}
            handleError={this.props.handleError}
            updateMember={this.props.updateMember}
          />
        )}
        {this.state.viewMemberMigration && (
          <ViewMemberMigration
            space={this.props.space}
            profile={this.props.profile}
            allMembers={this.props.allMembers}
            memberItem={this.state.migratingMember}
            setViewMigration={this.setViewMigration}
            handleLoaded={this.props.handleLoaded}
            handleCreated={this.props.handleCreated}
            handleError={this.props.handleError}
            updateMember={this.props.updateMember}
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
  handleCreated,
  handleError,
  updateMember,
  memberMigrations,
  memberMigrationsLoading,
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
    handleCreated={handleCreated}
    handleError={handleError}
    updateMember={updateMember}
    memberMigrations={memberMigrations}
    memberMigrationsLoading={memberMigrationsLoading}
  />
);

export const MigratingMembersContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleCreated,
    handleError,
    handleLoaded,
    handleUpdated,
  }),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (
        nextProps.allMembers.length !== 0 &&
        nextProps.memberMigrations.length !== 0
      ) {
        nextProps.memberMigrations.forEach(migration => {
          var idx = nextProps.allMembers.findIndex(member => {
            return member.id === migration.values['Member GUID'];
          });
          if (idx !== -1) {
            nextProps.allMembers[idx].migrationForm = migration;
          }
        });
        console.log('memberMigrations.size:' + nextProps.memberMigrations.size);
      }
    },
    componentDidMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      this.props.fetchMemberMigrations({
        billingSystem: Utils.getAttributeValue(
          this.props.space,
          'Billing Company',
        ).toLowerCase(),
        migrationsLastFetchTime: this.props.migrationsLastFetchTime,
      });

      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(MigrationMembers);

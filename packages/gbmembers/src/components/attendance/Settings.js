import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withState, withHandlers } from 'recompose';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as classActions } from '../../redux/modules/classes';
import checkoutLeftArrowIcon from '../../images/checkoutLeftArrow.png?raw';
import PinInput from 'w-react-pin-input';
import {
  getAttributeValue,
  setAttributeValue,
} from '../../lib/react-kinops-components/src/utils';
import { CoreAPI } from 'react-kinetic-core';
import { Map } from 'immutable';
import { StatusMessagesContainer } from '../StatusMessages';
import { ClassesCalendar } from './ClassesCalendar';
import { ManageBookings } from './ManageBookings';
import { RecurringBookings as ManageRecurringBookings } from './RecurringBookings';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { Utils } from 'common';
import ReactToPrint from 'react-to-print';
import Barcode from 'react-barcode';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
  classSchedules: state.member.classes.classSchedules,
  classBookings: state.member.classes.currentClassBookings,
  addedBooking: state.member.classes.addedBooking,
  fetchingClassBookings: state.member.classes.fetchingCurrentClassBookings,
  recurringBookings: state.member.classes.recurringBookings,
  addedRecurring: state.member.classes.addedRecurring,
  fetchingRecurringBookings: state.member.classes.fetchingRecurringBookings,
  fetchingClassSchedules: state.member.classes.fetchingClassSchedules,
});
const mapDispatchToProps = {
  fetchLeads: leadsActions.fetchLeads,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchClassBookings: classActions.fetchCurrentClassBookings,
  fetchRecurringBookings: classActions.fetchRecurringBookings,
  updateBooking: classActions.updateBooking,
  addBooking: classActions.addBooking,
  deleteBooking: classActions.deleteBooking,
  updateRecurring: classActions.updateRecurring,
  addRecurring: classActions.addRecurring,
  deleteRecurring: classActions.deleteRecurring,
  newClass: classActions.newClass,
  editClass: classActions.editClass,
  deleteClass: classActions.deleteClass,
  updateSpaceAttribute: dataStoreActions.updateSpaceAttribute,
  fetchClassSchedules: classActions.fetchClassSchedules,
};

var myThis;

class ComponentToPrint extends React.Component {
  constructor(props) {
    super(props);
    myThis = this;

    this.setState({
      filterName: '',
    });
  }
  render() {
    return (
      <div id="memberBarcodes">
        <div className="filterMemberName">
          <label htmlFor="filter">Member Name</label>
          <input
            id="filter"
            name="filter"
            type="text"
            ref={input => (this.input = input)}
            className="form-control form-control-sm"
            onChange={e => {
              myThis.setState({
                filterName: e.target.value,
              });
            }}
          />
        </div>
        <span>
          {this.props.allMembers
            .filter(member => {
              if (
                myThis.state !== undefined &&
                myThis.state !== null &&
                myThis.state.filterName !== ''
              ) {
                var name =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                if (
                  name
                    .toLocaleLowerCase()
                    .indexOf(myThis.state.filterName.toLocaleLowerCase()) !==
                    -1 &&
                  member.values['Status'] !== 'Inactive'
                ) {
                  return true;
                }
              } else if (member.values['Status'] !== 'Inactive') {
                return true;
              }
              return false;
            })
            .sort(function(a, b) {
              return a.values['Date Joined'] > b.values['Date Joined']
                ? -1
                : b.values['Date Joined'] > a.values['Date Joined']
                ? 1
                : 0;
            })
            .map((member, index) =>
              index !== 0 && index % 65 === 0 ? (
                <div className="barCode pageBreak" key={index}>
                  <Barcode
                    value={
                      member.values['Alternate Barcode'] === undefined ||
                      member.values['Alternate Barcode'] === '' ||
                      member.values['Alternate Barcode'] === null
                        ? member.id.split('-')[4].substring(6, 12)
                        : member.values['Alternate Barcode']
                    }
                    width={1.3}
                    height={36}
                    text={
                      member.values['First Name'].substring(0, 3) +
                      ' ' +
                      member.values['Last Name']
                    }
                    type={'CODE128'}
                    font={'monospace'}
                    textAlign={'center'}
                    textPosition={'bottom'}
                    textMargin={2}
                    fontSize={8}
                  />
                </div>
              ) : (
                <span className="barCode" key={index}>
                  <Barcode
                    value={member.id.split('-')[4].substring(6, 12)}
                    width={1.3}
                    height={36}
                    text={
                      member.values['First Name'].substring(0, 3) +
                      ' ' +
                      member.values['Last Name']
                    }
                    type={'CODE128'}
                    font={'monospace'}
                    textAlign={'center'}
                    textPosition={'bottom'}
                    textMargin={2}
                    fontSize={8}
                  />
                </span>
              ),
            )}
        </span>
      </div>
    );
  }
}

export class SelfCheckinSetPIN extends Component {
  updateProfileValues = async profile => {
    console.log('updateProfileValues');
    let profileCopy = {}; //_.cloneDeep(profile);
    profileCopy = {
      profileAttributes: profile.profileAttributes,
    };
    const { space, serverError } = await CoreAPI.updateProfile({
      profile: profileCopy,
      include: 'attributesMap',
    });
  };

  constructor(props) {
    super(props);

    this.state = {
      settingPin: false,
    };
  }
  render() {
    return (
      <div className="selfCheckSetPIN">
        {!this.state.settingPin && (
          <button
            type="button"
            id="setPIN"
            className="btn btn-primary btn-block"
            onClick={async e => {
              this.setState({
                settingPin: true,
              });
            }}
          >
            Set Self Checkin PIN
          </button>
        )}
        {this.state.settingPin && (
          <div className="pinEntry">
            <PinInput
              className="pinInput"
              length={4}
              initialValue={
                getAttributeValue(
                  { attributes: this.props.profile.profileAttributes },
                  'Kiosk PIN',
                ) !== undefined
                  ? getAttributeValue(
                      { attributes: this.props.profile.profileAttributes },
                      'Kiosk PIN',
                    )
                  : '0000'
              }
              onChange={(value, index) => {}}
              type="numeric"
              inputMode="number"
              style={{ padding: '10px' }}
              inputStyle={{ borderColor: 'red' }}
              inputFocusStyle={{ borderColor: 'blue' }}
              onComplete={(value, index) => {
                this.setState({
                  newCheckinPIN: value,
                });
              }}
              autoSelect={true}
              regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}
            />
            <div className="buttons">
              <button
                type="button"
                id="cancelPIN"
                className="btn btn-primary btn-block"
                onClick={async e => {
                  this.setState({
                    settingPin: false,
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                id="applyPIN"
                className="btn btn-primary btn-block"
                onClick={async e => {
                  setAttributeValue(
                    { attributes: this.props.profile.profileAttributes },
                    'Kiosk PIN',
                    this.state.newCheckinPIN,
                  );
                  var attributes = Map();
                  attributes = attributes.set('Kiosk PIN', [
                    this.state.newCheckinPIN,
                  ]);
                  this.updateProfileValues(this.props.profile);
                  this.setState({
                    settingPin: false,
                  });
                }}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

export class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {}

  render() {
    return (
      <div className="attendanceSettings">
        <StatusMessagesContainer />
        <span className="topRow">
          <div className="name">Settings/Attendance</div>
          <div
            className="continueAttendance"
            onClick={e => {
              this.props.setShowSettings(false);
              this.props.setShowAttendance(true);
            }}
          >
            <img src={checkoutLeftArrowIcon} alt="Continue Attendance" />
            <span className="returnAttendance">Return to Attendance</span>
          </div>
        </span>
        <span className="details">
          {Utils.isMemberOf(this.props.profile, 'Role::Program Managers') && (
            <div style={{ margin: '20px 0px 0px 10px' }} id="setSelfCheckinPin">
              <div className="row">
                <SelfCheckinSetPIN
                  profile={this.props.profile}
                  space={this.props.space}
                />
              </div>
            </div>
          )}
          {!Utils.isMemberOf(this.props.profile, 'Role::Program Managers') ||
          getAttributeValue(this.props.space, 'Franchisor') === 'YES' ? (
            <div />
          ) : (
            <div
              style={{ margin: '20px 0px 0px 10px' }}
              id="showCalendarButton"
            >
              <div className="row">
                <button
                  type="button"
                  id="classCalendar"
                  className={'btn btn-primary'}
                  onClick={e => {
                    this.props.setShowClassCalendar(
                      this.props.showClassCalendar ? false : true,
                    );
                  }}
                >
                  {this.props.showClassCalendar
                    ? 'Hide Class Calendar'
                    : 'Show Class Calendar'}
                </button>
              </div>
            </div>
          )}
          {this.props.showClassCalendar && (
            <ClassesCalendar
              classSchedules={this.props.classSchedules}
              programs={this.props.programs}
              additionalPrograms={this.props.additionalPrograms}
              newClass={this.props.newClass}
              editClass={this.props.editClass}
              deleteClass={this.props.deleteClass}
              space={this.props.space}
              profile={this.props.profile}
              updatingAttribute={this.props.updatingAttribute}
              updateSpaceAttribute={this.props.updateSpaceAttribute}
            ></ClassesCalendar>
          )}
          {!Utils.isMemberOf(this.props.profile, 'Role::Program Managers') ||
          getAttributeValue(this.props.space, 'Franchisor') === 'YES' ? (
            <div />
          ) : (
            <div
              style={{ margin: '20px 0px 0px 10px' }}
              id="showRecurringBookingButton"
            >
              <div className="row">
                <button
                  type="button"
                  id="recurringBookings"
                  className={'btn btn-primary'}
                  onClick={e => {
                    this.props.fetchRecurringBookings({
                      allMembers: this.props.allMembers,
                    });
                    this.props.setShowRecurringBookings(
                      this.props.showRecurringBookings ? false : true,
                    );
                  }}
                >
                  {this.props.showRecurringBookings
                    ? 'Hide Recurring Bookings'
                    : 'Show Recurring Bookings'}
                </button>
              </div>
            </div>
          )}
          {(this.props.fetchingRecurringBookings ||
            this.props.fetchingClassBookings) &&
          this.props.showRecurringBookings ? (
            <p>Loading Recurring Bookings ....</p>
          ) : !this.props.fetchingRecurringBookings &&
            this.props.showRecurringBookings ? (
            <ManageRecurringBookings
              recurringBookings={this.props.recurringBookings}
              allMembers={this.props.allMembers}
              programs={this.props.programs}
              additionalPrograms={this.props.additionalPrograms}
              updateRecurring={this.props.updateRecurring}
              addRecurring={this.props.addRecurring}
              addedRecurring={this.props.addedRecurring}
              deleteRecurring={this.props.deleteRecurring}
              space={this.props.space}
              classSchedules={this.props.classSchedules}
            ></ManageRecurringBookings>
          ) : (
            <div />
          )}
          {!Utils.isMemberOf(this.props.profile, 'Role::Program Managers') ||
          getAttributeValue(this.props.space, 'Franchisor') === 'YES' ? (
            <div />
          ) : (
            <div style={{ margin: '20px 0px 0px 10px' }} id="stock-report">
              <div className="row">
                <button
                  type="button"
                  id="classBookings"
                  className={'btn btn-primary'}
                  onClick={e => {
                    this.props.fetchClassBookings();
                    this.props.setShowClassBookings(
                      this.props.showClassBookings ? false : true,
                    );
                  }}
                >
                  {this.props.showClassBookings
                    ? 'Hide Class Bookings'
                    : 'Show Class Bookings'}
                </button>
              </div>
            </div>
          )}
          {this.props.fetchingClassBookings && this.props.showClassBookings ? (
            <p>Loading Class Bookings ....</p>
          ) : !this.props.fetchingClassBookings &&
            this.props.showClassBookings ? (
            <ManageBookings
              classBookings={this.props.classBookings}
              allMembers={this.props.allMembers}
              programs={this.props.programs}
              additionalPrograms={this.props.additionalPrograms}
              updateBooking={this.props.updateBooking}
              addBooking={this.props.addBooking}
              addedBooking={this.props.addedBooking}
              deleteBooking={this.props.deleteBooking}
              space={this.props.space}
              classSchedules={this.props.classSchedules}
            ></ManageBookings>
          ) : (
            <div />
          )}

          {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
            <div style={{ margin: '20px 0px 0px 10px' }} id="stock-report">
              <div className="row">
                <button
                  type="button"
                  id="printMemberbarcodes"
                  className={'btn btn-primary'}
                  onClick={e => {
                    this.props.printMemberBarcodes(
                      this.props.allMembers,
                      this.props.setPrintingBarcodes,
                    );
                    this.props.setShowBarcodes(
                      this.props.showBarcodes ? false : true,
                    );
                  }}
                >
                  {this.props.showBarcodes
                    ? 'Hide Member barcodes'
                    : 'Show Member barcodes'}
                </button>
              </div>
            </div>
          )}
          {!this.props.printingBarcodes || !this.props.showBarcodes ? (
            <div />
          ) : (
            <div id="memberBarcodesSection" className="col-xs-3">
              <ReactToPrint
                trigger={() => (
                  <span>
                    <button>Print Barcodes!</button>
                    <br></br>
                  </span>
                )}
                content={() => this.componentRef}
                copyStyles={true}
              />
              <ComponentToPrint
                ref={el => (this.componentRef = el)}
                allMembers={this.props.allMembers}
              />
            </div>
          )}
        </span>
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({
    printMemberBarcodes: () => (allMembers, setPrintingBarcodes) => {
      console.log('Printing:' + allMembers.length);
      setPrintingBarcodes(true);
    },
  }),
  withState('showClassCalendar', 'setShowClassCalendar', false),
  withState('showClassBookings', 'setShowClassBookings', false),
  withState('showRecurringBookings', 'setShowRecurringBookings', false),
  withState('showBarcodes', 'setShowBarcodes', false),
  withState('printingBarcodes', 'setPrintingBarcodes', false),
  lifecycle({
    UNSAFE_componentWillMount() {},
  }),
);
export const SettingsContainer = enhance(Settings);

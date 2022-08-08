import React, { Component } from 'react';
import { compose, lifecycle, withProps } from 'recompose';
import $ from 'jquery';
import BarcodeReader from 'react-barcode-reader';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as classActions } from '../../redux/modules/classes';
import { actions as appActions } from '../../redux/modules/memberApp';
import { actions as errorActions } from '../../redux/modules/errors';
import { connect } from 'react-redux';
import moment from 'moment';
import Datetime from 'react-datetime';
import barcodeIcon from '../../images/barcode.svg?raw';
import binIcon from '../../images/bin.svg?raw';
import tickIcon from '../../images/tick.svg?raw';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import Select from 'react-select';
import { withHandlers } from 'recompose';
import { GradingStatus } from './GradingStatus';
import {
  getCurrency,
  getProgramSVG,
  getBeltSVG,
  getLocalePreference,
  validOverdue,
  getLastBillingStartDate,
} from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { Utils } from 'common';
import { KappNavLink as NavLink } from 'common';
import { confirm } from '../helpers/Confirmation';
import PinInput from 'w-react-pin-input';
import Countdown from 'react-countdown';
import * as selectors from '../../lib/react-kinops-components/src/redux/kinopsSelectors';
import { FullScreen, useFullScreenHandle } from 'react-full-screen';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  classAttendances: state.member.attendance.classAttendances,
  fetchingClassAttendances: state.member.attendance.fetchingClassAttendances,
  attendanceAdded: state.member.attendance.attendanceAdded,
  classBookings: state.member.classes.classBookings,
  fetchingClassBookings: state.member.classes.fetchingClassBookings,
  classSchedules: state.member.classes.classSchedules,
  fetchingClassSchedules: state.member.classes.fetchingClassSchedules,
  belts: state.member.app.belts,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
  FAILEDpaymentHistory: state.member.members.FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading: state.member.members.FAILEDpaymentHistoryLoading,
  SUCCESSFULpaymentHistory: state.member.members.SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading:
    state.member.members.SUCCESSFULpaymentHistoryLoading,
  isKiosk: selectors.selectHasRoleKiosk(state),
});

const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
  fetchClassAttendances: attendanceActions.fetchClassAttendances,
  fetchClassBookings: classActions.fetchClassBookings,
  fetchClassSchedules: classActions.fetchClassSchedules,
  createAttendance: attendanceActions.createAttendance,
  deleteAttendance: attendanceActions.deleteAttendance,
  setClassAttendances: attendanceActions.setClassAttendances,
  setClassBookings: classActions.setClassBookings,
  updateBooking: classActions.updateBooking,
  updateMember: memberActions.updateMember,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  fetchPaymentHistory: memberActions.fetchPaymentHistory,
  setPaymentHistory: memberActions.setPaymentHistory,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

var attendanceThis = undefined;

export class SelfCheckinMode extends Component {
  constructor(props) {
    super(props);
    this.attendanceThis = this.props.attendanceThis;
    this.selectSelfCheckinMember = this.selectSelfCheckinMember.bind(this);
    this.doShowSelfCheckinAttendance = this.doShowSelfCheckinAttendance.bind(
      this,
    );
    this.selfCheckinHandleScan = this.selfCheckinHandleScan.bind(this);
    this.getClassAllowedMembers = this.getClassAllowedMembers.bind(this);
    this.renderer = this.renderer.bind(this);
    this.cancelCheckinUndo = this.cancelCheckinUndo.bind(this);

    this.tick = this.tick.bind(this);

    attendanceThis.props.fetchClassAttendances({
      classDate: moment().format('YYYY-MM-DD'),
    });
    var classScheduleDateDay = moment().day() === 0 ? 7 : moment().day();
    var schedules = attendanceThis.props.classSchedules.filter(schedule => {
      var scheduleDay =
        moment(schedule.start).day() === 0 ? 7 : moment(schedule.start).day();

      if (classScheduleDateDay === scheduleDay) {
        return (
          moment(schedule.start).isAfter(moment()) ||
          moment(schedule.end).isAfter(moment())
        );
      }
      return false;
    });
    var classTime =
      schedules.size > 0
        ? moment(schedules.get(0).start).format('HH:mm')
        : undefined;

    this.state = {
      currentClassScheduleId: schedules.size > 0 ? schedules.get(0).id : '',
      showingFullScreen: false,
      verifyPIN: false,
      memberItem: undefined,
      classDate: moment()
        .set({ hour: moment().get('hour'), minute: 0, second: 0 })
        .format('L hh:mm A'),
      classScheduleDateDay: classScheduleDateDay,
      classTime: classTime,
      className: schedules.size > 0 ? schedules.get(0).program : '',
      allowedPrograms:
        schedules.size > 0 ? JSON.parse(schedules.get(0).allowedPrograms) : [],
      currentSchedules: schedules,
      attendanceAdded: undefined,
      checkinClassMember: false,
    };
  }
  renderer = ({ hours, minutes, seconds, completed }) => {
    if (completed) {
      // Render a completed state
      this.setState({
        attendanceAdded: undefined,
        checkinClassMember: false,
      });

      return <div />;
    } else {
      // Render a countdown
      return (
        <span className="countdown">
          <div className="details">
            <div className="name">
              {attendanceThis.props.attendanceAdded.name}
            </div>
            <div className="className">
              {attendanceThis.props.attendanceAdded.class}
            </div>
          </div>
          <div className="time">{seconds}</div>
          <button
            type="button"
            id="undoChecking"
            className="btn btn-primary btn-block"
            onClick={async e => {
              this.cancelCheckinUndo();
            }}
          >
            Undo Checkin
          </button>
        </span>
      );
    }
  };

  cancelCheckinUndo() {
    attendanceThis.props.deleteAttendance({
      attendance: this.state.attendanceAdded,
      additionalPrograms: attendanceThis.props.additionalPrograms,
      classAttendances: attendanceThis.props.classAttendances,
      updateMember: attendanceThis.props.updateMember,
      allMembers: attendanceThis.props.allMembers,
      classDate: attendanceThis.state.classDate,
    });
    this.setState({
      attendanceAdded: undefined,
      checkinClassMember: false,
    });
  }
  tick() {
    console.log('Self Checkin Ticking ...' + this);
    var classDate = moment(this.state.classDate, 'L hh:mm A');
    classDate
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    var today = moment();
    today
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);

    if (classDate.isBefore(today)) {
      var schedules = attendanceThis.props.classSchedules.filter(schedule => {
        return (
          moment(schedule.start).isAfter(moment()) ||
          moment(schedule.end).isAfter(moment())
        );
      });
      var classTime =
        schedules.size > 0
          ? moment(schedules.get(0).start).format('HH:mm')
          : undefined;

      this.setState({
        classScheduleDateDay: moment().day() === 0 ? 7 : moment().day(),
        classDate: moment()
          .set({ hour: moment().get('hour'), minute: 0, second: 0 })
          .format('L hh:mm A'),
        classTime: classTime,
        currentClassScheduleId: schedules.size > 0 ? schedules.get(0).id : '',
      });
    } else if (classDate.isSame(today)) {
      var classScheduleDateDay = moment().day() === 0 ? 7 : moment().day();
      schedules = attendanceThis.props.classSchedules.filter(schedule => {
        var scheduleDay =
          moment(schedule.start).day() === 0 ? 7 : moment(schedule.start).day();

        if (classScheduleDateDay === scheduleDay) {
          return (
            moment(schedule.start).isAfter(moment()) ||
            moment(schedule.end).isAfter(moment())
          );
        }
        return false;
      });
      classTime =
        schedules.size > 0
          ? moment(schedules.get(0).start).format('HH:mm')
          : undefined;

      if (this.state.currentSchedules.size !== schedules.size) {
        attendanceThis.props.fetchClassBookings({
          classDate: moment(this.state.classDate, 'L hh:mm A').format(
            'YYYY-MM-DD',
          ),
          classTime: classTime,
          program: schedules.size > 0 ? schedules.get(0).program : '',
          status: 'Booked',
          allMembers: attendanceThis.props.allMembers,
        });
        this.setState({
          classTime: classTime,
          currentClassScheduleId: schedules.size > 0 ? schedules.get(0).id : '',
          allowedPrograms:
            schedules.size > 0
              ? JSON.parse(schedules.get(0).allowedPrograms)
              : [],
          currentSchedules: schedules,
        });
      }
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      nextProps.attendanceAdded.id !== undefined &&
      this.state.attendanceAdded === undefined &&
      this.state.checkinClassMember
    ) {
      this.setState({
        attendanceAdded: nextProps.attendanceAdded,
      });
    }
  }
  UNSAFE_componentWillMount() {
    let timer = setInterval(this.tick, 60 * 1000 * 1, this); // refresh every 15 minutes
    this.setState({ timer: timer });
  }
  componentWillUnmount() {
    clearInterval(this.state.timer);
  }

  getClassAllowedMembers() {
    let membersVals = [];
    membersVals.push({
      label: '',
      value: '',
    });
    attendanceThis.props.allMembers.forEach(member => {
      if (
        member.values['Status'] !== 'Inactive' &&
        member.values['Status'] !== 'Frozen' &&
        this.state.allowedPrograms.findIndex(
          program => program.value === member.values['Ranking Program'],
        ) !== -1
      ) {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals;
  }

  doShowSelfCheckinAttendance(attendanceThis, classDate, scheduleID) {
    var scheduleIdx = attendanceThis.props.classSchedules.findIndex(
      schedule => schedule.id === scheduleID,
    );
    var classTime = moment(
      attendanceThis.props.classSchedules.get(scheduleIdx).start,
    ).format('HH:mm');
    attendanceThis.props.fetchClassBookings({
      classDate: moment(classDate, 'L hh:mm A').format('YYYY-MM-DD'),
      classTime: classTime,
      program: attendanceThis.props.classSchedules.get(scheduleIdx).program,
      status: 'Booked',
      allMembers: attendanceThis.props.allMembers,
    });

    this.setState({
      currentClassScheduleId: attendanceThis.props.classSchedules.get(
        scheduleIdx,
      ).id,
      memberItem: undefined,
      memberAlreadyCheckedIn: false,
      classTime: classTime,
      className: attendanceThis.props.classSchedules.get(scheduleIdx).program,
      allowedPrograms: JSON.parse(
        attendanceThis.props.classSchedules.get(scheduleIdx).allowedPrograms,
      ),
      attendanceAdded: undefined,
      checkinClassMember: false,
    });
  }

  selectSelfCheckinMember(e) {
    let id = e.value;
    this.setState({
      memberItem: undefined,
      memberAlreadyCheckedIn: false,
      noProgramSet: false,
      overdueMember: false,
      attendanceStatus: 'Full Class',
      attendanceAdded: undefined,
      checkinClassMember: false,
    });

    if (id !== '') {
      let memberItem;
      for (let i = 0; i < attendanceThis.props.allMembers.length; i++) {
        if (attendanceThis.props.allMembers[i].id === id) {
          memberItem = attendanceThis.props.allMembers[i];
          this.setState({ memberItem: attendanceThis.props.allMembers[i] });
          if (
            attendanceThis.props.allMembers[i].values['Ranking Program'] ===
              undefined ||
            attendanceThis.props.allMembers[i].values['Ranking Belt'] ===
              undefined
          ) {
            this.setState({ noProgramSet: true });
          }
          break;
        }
      }
      for (let i = 0; i < attendanceThis.props.classAttendances.length; i++) {
        if (
          attendanceThis.props.classAttendances[i].values['Member ID'] ===
            memberItem.values['Member ID'] &&
          attendanceThis.props.classAttendances[i].values['Class Time'] ===
            this.state.classTime &&
          attendanceThis.props.classAttendances[i].values['Class'] ===
            this.state.className
        ) {
          this.setState({ memberAlreadyCheckedIn: true });
          attendanceThis.props.classAttendances[
            i
          ].memberAlreadyCheckedIn = true;
        } else {
          attendanceThis.props.classAttendances[
            i
          ].memberAlreadyCheckedIn = false;
        }
      }

      //    if (this.state.memberAlreadyCheckedIn){
      attendanceThis.props.setClassAttendances(
        attendanceThis.props.classAttendances,
      );
      //    }
    } else {
      for (let i = 0; i < attendanceThis.props.classAttendances.length; i++) {
        attendanceThis.props.classAttendances[i].memberAlreadyCheckedIn = false;
      }
    }
    console.log('Scanned:' + id);
    setTimeout(function() {
      $('#checkinMember').focus();
    }, 500);
  }
  selfCheckInMember() {
    let attendance = {
      attendanceStatus: this.state.attendanceStatus,
    };
    this.setState({
      memberItem: undefined,
      checkinClassMember: true,
    });
    attendanceThis.props.checkinMember(
      attendanceThis.props.createAttendance,
      attendance,
      attendanceThis.props.additionalPrograms,
      this.state.memberItem,
      this.state.className,
      this.state.classDate,
      this.state.classTime,
      this.state.attendanceStatus,
      attendanceThis.props.classAttendances,
      attendanceThis.props.allMembers,
      attendanceThis.props.updateMember,
    );
    console.log('checkInMember');
  }
  selfCheckinBooking(booking) {
    let memberItem;
    for (let i = 0; i < attendanceThis.props.allMembers.length; i++) {
      if (attendanceThis.props.allMembers[i].id === booking.memberGUID) {
        memberItem = attendanceThis.props.allMembers[i];
        this.setState({ memberItem: attendanceThis.props.allMembers[i] });
        if (
          attendanceThis.props.allMembers[i].values['Ranking Program'] ===
            undefined ||
          attendanceThis.props.allMembers[i].values['Ranking Belt'] ===
            undefined
        ) {
          this.setState({ noProgramSet: true });
        }
        break;
      }
    }
    var memberAlreadyCheckedIn = false;
    for (let j = 0; j < attendanceThis.props.classAttendances.length; j++) {
      if (
        attendanceThis.props.classAttendances[j].values['Member GUID'] ===
          booking.memberGUID &&
        attendanceThis.props.classAttendances[j].values['Class Time'] ===
          this.state.classTime &&
        attendanceThis.props.classAttendances[j].values['Class'] ===
          this.state.className
      ) {
        this.setState({ memberAlreadyCheckedIn: true });
        attendanceThis.props.classAttendances[j].memberAlreadyCheckedIn = true;
        memberAlreadyCheckedIn = true;
        break;
      }
    }

    let attendance = {
      attendanceStatus: 'Full Class',
    };
    this.setState({
      memberItem: undefined,
      checkinClassMember: true,
    });
    if (!memberAlreadyCheckedIn) {
      attendanceThis.props.checkinMember(
        attendanceThis.props.createAttendance,
        attendance,
        attendanceThis.props.additionalPrograms,
        memberItem,
        this.state.className,
        this.state.classDate,
        this.state.classTime,
        'Full Class',
        attendanceThis.props.classAttendances,
        attendanceThis.props.allMembers,
        attendanceThis.props.updateMember,
      );
    }
    let values = {};
    values['Status'] = 'Attended';
    attendanceThis.props.updateBooking({
      id: booking.id,
      values,
    });
    var idx = attendanceThis.props.classBookings.findIndex(
      element => element.id === booking.id,
    );
    var classBookings = attendanceThis.props.classBookings.splice(idx, 1);
    attendanceThis.props.setClassBookings({
      allMembers: attendanceThis.props.allMembers,
      classBookings: classBookings,
    });

    console.log('checkInMember');
  }
  handleError(data) {
    console.log('Scanned Error:' + data);
  }

  selfCheckinHandleScan(data) {
    data = data.toLowerCase();
    console.log('Selfcheckin Scanned ClassName00:' + data);
    console.log('Selfcheckin Scanned ClassName11:' + this.state.className);
    this.setState({
      memberItem: undefined,
      memberAlreadyCheckedIn: false,
      noProgramSet: false,
      attendanceStatus: 'Full Class',
      checkinClassMember: true,
    });

    for (let i = 0; i < attendanceThis.props.allMembers.length; i++) {
      if (
        attendanceThis.props.allMembers[i].id
          .split('-')[4]
          .substring(6, 12)
          .toLowerCase() === data ||
        (attendanceThis.props.allMembers[i].values['Alternate Barcode'] !==
          undefined &&
        attendanceThis.props.allMembers[i].values['Alternate Barcode'] !==
          null &&
        attendanceThis.props.allMembers[i].values['Alternate Barcode'] !== ''
          ? attendanceThis.props.allMembers[i].values[
              'Alternate Barcode'
            ].toLowerCase() === data
          : false)
      ) {
        this.setState({ memberItem: attendanceThis.props.allMembers[i] });
        if (
          attendanceThis.props.allMembers[i].values['Ranking Program'] ===
            undefined ||
          attendanceThis.props.allMembers[i].values['Ranking Belt'] ===
            undefined
        ) {
          this.setState({ noProgramSet: true });
        }
        break;
      }
    }
    for (let i = 0; i < attendanceThis.props.classAttendances.length; i++) {
      if (
        this.state.memberItem !== undefined &&
        attendanceThis.props.classAttendances[i].values['Member ID'] ===
          this.state.memberItem.values['Member ID'] &&
        attendanceThis.props.classAttendances[i].values['Class Time'] ===
          this.state.classTime &&
        attendanceThis.props.classAttendances[i].values['Class'] ===
          this.state.className
      ) {
        this.setState({ memberAlreadyCheckedIn: true });
        attendanceThis.props.classAttendances[i].memberAlreadyCheckedIn = true;
      } else {
        attendanceThis.props.classAttendances[i].memberAlreadyCheckedIn = false;
      }
    }

    attendanceThis.props.setClassAttendances(
      attendanceThis.props.classAttendances,
    );
    setTimeout(function() {
      $('#checkinMember').focus();
    }, 500);

    console.log('Scanned ClassName:' + this.state.className);
  }
  render() {
    return (
      <div>
        <div className="fullScreenMode">
          <div>
            <img
              className="checkinBackground"
              src="https://gbfms-files.s3-ap-southeast-2.amazonaws.com/GB+Name+Log.png"
              alt=""
            />
            <div className="selfCheckinMode">
              {this.state.verifyPIN && (
                <div className="verifyPIN">
                  <div className="info">
                    Please enter the Self Checkin code to exit Self Checkin
                    mode.
                  </div>
                  <PinInput
                    className="pinInput"
                    length={4}
                    initialValue=""
                    secret
                    onChange={(value, index) => {}}
                    type="numeric"
                    inputMode="number"
                    style={{ padding: '10px' }}
                    inputStyle={{ borderColor: 'red' }}
                    inputFocusStyle={{ borderColor: 'blue' }}
                    onComplete={(value, index) => {
                      if (value === '0000') {
                        this.setState({
                          memberItem: undefined,
                          verifyPIN: false,
                          invalidPIN: false,
                        });
                        attendanceThis.setState({
                          showingFullScreen: false,
                        });
                      } else {
                        this.setState({
                          invalidPIN: true,
                        });
                      }
                    }}
                    autoSelect={true}
                    regexCriteria={/^[ A-Za-z0-9_@./#&+-]*$/}
                  />
                  {this.state.invalidPIN && (
                    <div className="invalidPIN">
                      Invalid pin entered, please try again.
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                id="exitSelfCheckinBtn"
                className="btn btn-primary btn-block"
                onClick={async e => {
                  this.setState({
                    verifyPIN: true,
                  });
                  setTimeout(function() {
                    $('.pincode-input-container input')
                      .first()
                      .focus();
                  }, 100);
                }}
              >
                Exit Self Checkin
              </button>
              <div className="checkinAttendance checkinSection">
                <div className="dayClasses">
                  {attendanceThis
                    .getDayClasses(
                      attendanceThis.props.classSchedules,
                      this.state.classScheduleDateDay,
                    )
                    .filter(dayClass => {
                      return (
                        moment(dayClass.schedule.start).isAfter(moment()) ||
                        moment(dayClass.schedule.end).isAfter(moment())
                      );
                    })
                    .map((dayClass, idx) => (
                      <div className="dayClass" key={idx}>
                        <input
                          type="radio"
                          name="dayClass"
                          id={'class_' + idx}
                          value={dayClass.value}
                          checked={
                            dayClass.value === this.state.currentClassScheduleId
                              ? true
                              : false
                          }
                          onChange={e => {
                            this.doShowSelfCheckinAttendance(
                              attendanceThis,
                              this.state.classDate,
                              e.target.value,
                            );
                          }}
                        />
                        <label htmlFor={'class_' + idx}>{dayClass.label}</label>
                      </div>
                    ))}
                </div>

                {this.state.classTime !== undefined && (
                  <div className="memberSelection">
                    <div className="readyToScan">
                      <h5>READY TO SCAN MEMBER</h5>
                      <SVGInline svg={barcodeIcon} className="icon" />
                    </div>
                    <div className="manual">
                      <h5>OR SELECT MEMBER</h5>
                      <Select
                        closeMenuOnSelect={true}
                        options={this.getClassAllowedMembers()}
                        className="hide-columns-container"
                        classNamePrefix="hide-columns"
                        placeholder="Select Member"
                        value={
                          this.memberItem === undefined
                            ? ''
                            : this.memberItem.id
                        }
                        onChange={e => {
                          this.selectSelfCheckinMember(e);
                        }}
                        style={{ width: '300px' }}
                      />
                    </div>
                  </div>
                )}
                {this.state.memberItem === undefined ? (
                  <div />
                ) : (
                  <div className="memberInfo">
                    {this.state.memberItem.values['Photo'] === undefined ? (
                      <span className="noPhoto">
                        {this.state.memberItem.values['First Name'][0]}
                        {this.state.memberItem.values['Last Name'][0]}
                      </span>
                    ) : (
                      <img
                        src={this.state.memberItem.values['Photo']}
                        alt="Member Photograph"
                        className="photo"
                      />
                    )}
                    <div className="info">
                      {this.state.memberAlreadyCheckedIn ? (
                        <h2 className="alreadyCheckedinLabel">
                          Member already checked in
                        </h2>
                      ) : (
                        <div />
                      )}
                      {this.state.noProgramSet ? (
                        <h2 className="noProgramSetLabel">
                          Member does not have a Program or Belt value set
                        </h2>
                      ) : (
                        <div />
                      )}
                      {!this.state.memberAlreadyCheckedIn &&
                      this.state.noProgramSet ? (
                        <h2>Checking in member</h2>
                      ) : (
                        <div />
                      )}
                      <h4>
                        {this.state.memberItem.values['First Name']}{' '}
                        {this.state.memberItem.values['Last Name']}:{' '}
                        <b>{this.state.memberItem.values['Ranking Program']}</b>
                        -<i>{this.state.memberItem.values['Ranking Belt']}</i>
                      </h4>
                      <h4>
                        For class <b>{this.state.className}</b> at{' '}
                        <b>
                          {moment(this.state.classDate, 'L hh:mm A').format(
                            'L',
                          )}{' '}
                          {moment(this.state.classTime, 'HH:mm').format(
                            'h:mm A',
                          )}
                        </b>
                      </h4>
                    </div>
                    {this.state.memberAlreadyCheckedIn ||
                    this.state.noProgramSet ? (
                      <div />
                    ) : (
                      <div className="applyCheckin">
                        <div>
                          <button
                            type="button"
                            id="checkinMember"
                            className="btn btn-primary btn-block"
                            onClick={e => this.selfCheckInMember()}
                          >
                            Check-in
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {this.state.attendanceAdded &&
                  this.state.checkinClassMember && (
                    <Countdown
                      date={Date.now() + 1000 * 20}
                      renderer={this.renderer}
                    />
                  )}
              </div>
              <div className="classBookingSection">
                <h4 className="classBookingLabel">Class Bookings</h4>
                {attendanceThis.props.fetchingClassBookings ? (
                  <h4>Loading Class Bookings....</h4>
                ) : (
                  <div>
                    {attendanceThis.props.classBookings.size === 0 ? (
                      <div>
                        <h4>No bookings for this class</h4>
                      </div>
                    ) : (
                      <div className="classBookings">
                        {attendanceThis.props.classBookings.map(
                          (booking, index) => (
                            <span
                              key={index}
                              className={'memberCell'}
                              id={booking.id}
                            >
                              <span className="top">
                                {booking.photo === undefined ? (
                                  <span className="noPhoto">
                                    {booking.firstName[0]}
                                    {booking.lastName[0]}
                                  </span>
                                ) : (
                                  <img
                                    src={booking.photo}
                                    alt="Member Photograph"
                                    className="photo"
                                  />
                                )}
                                <span className="memberInfo">
                                  <h4 className="memberName">
                                    {booking.firstName} {booking.lastName}
                                  </h4>
                                  <span
                                    className="checkinBooking"
                                    onClick={e =>
                                      this.selfCheckinBooking(booking)
                                    }
                                  >
                                    <SVGInline
                                      svg={tickIcon}
                                      className="icon"
                                    />
                                  </span>
                                </span>
                              </span>
                              <span className="bottom">
                                <span className="ranking">
                                  <div className="program">
                                    {getProgramSVG(booking.rankingProgram)}
                                  </div>
                                  <div className="belt">
                                    {getBeltSVG(booking.rankingBelt)}
                                  </div>
                                </span>
                              </span>
                            </span>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="attendanceSection">
                <h4 className="classAttendancesLabel">
                  (
                  {
                    attendanceThis.props.classAttendances.filter(checkin => {
                      var result =
                        checkin.values['Class Time'] === this.state.classTime &&
                        checkin.values['Class'] === this.state.className;

                      if (result) {
                        var mIdx = attendanceThis.props.allMembers.findIndex(
                          member => member.id === checkin.values['Member GUID'],
                        );
                        if (mIdx !== -1) {
                          checkin.memberItem =
                            attendanceThis.props.allMembers[mIdx];
                        }
                      }
                      return result;
                    }).length
                  }
                  )
                </h4>
                {attendanceThis.props.fetchingClassAttendances ? (
                  <h4>Loading Class Attendances....</h4>
                ) : (
                  <div className="classMembers">
                    {attendanceThis.props.classAttendances.length === 0 ? (
                      <div>
                        <h4>No members checked in for this class</h4>
                      </div>
                    ) : (
                      <div>
                        {attendanceThis.props.classAttendances
                          .filter(checkin => {
                            return (
                              checkin.values['Class Time'] ===
                                this.state.classTime &&
                              checkin.values['Class'] === this.state.className
                            );
                          })
                          .map((checkin, index) => (
                            <span
                              key={index}
                              className={
                                checkin.memberAlreadyCheckedIn
                                  ? 'memberCell alreadyCheckedIn'
                                  : 'memberCell'
                              }
                              id={checkin.id}
                            >
                              <span className="top">
                                {checkin.values['Photo'] === undefined ? (
                                  <span className="noPhoto">
                                    {checkin.values['First Name'][0]}
                                    {checkin.values['Last Name'][0]}
                                  </span>
                                ) : (
                                  <img
                                    src={checkin.values['Photo']}
                                    alt="Member Photograph"
                                    className="photo"
                                  />
                                )}
                                <span className="memberInfo">
                                  <h4 className="memberName">
                                    <span>
                                      {checkin.values['First Name']}{' '}
                                      {checkin.values['Last Name']}
                                    </span>
                                  </h4>
                                  <h5
                                    className={
                                      checkin.values['Attendance Status'][0]
                                    }
                                  >
                                    {checkin.values['Attendance Status'][0]}
                                  </h5>

                                  <span
                                    className="deleteCheckin"
                                    onClick={e =>
                                      attendanceThis.deleteCheckin(checkin)
                                    }
                                  >
                                    <SVGInline svg={binIcon} className="icon" />
                                  </span>
                                </span>
                              </span>
                              <span className="bottom">
                                <span className="ranking">
                                  <div className="program">
                                    {getProgramSVG(
                                      checkin.values['Ranking Program'],
                                    )}
                                  </div>
                                  <div className="belt">
                                    {getBeltSVG(checkin.values['Ranking Belt'])}
                                  </div>
                                </span>
                              </span>
                            </span>
                          ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {this.state.classTime !== undefined && (
          <BarcodeReader
            onError={this.handleError}
            onScan={this.selfCheckinHandleScan}
          />
        )}
      </div>
    );
  }
}

export class AttendanceDetail extends Component {
  constructor(props) {
    super(props);

    attendanceThis = this;
    this.handleScan = this.handleScan.bind(this);
    this.getBamboraOverdues = this.getBamboraOverdues.bind(this);
    this.getDayClasses = this.getDayClasses.bind(this);

    let className = this.props.programs.get(0).program;
    let classDate = moment()
      .set({ hour: moment().get('hour'), minute: 0, second: 0 })
      .format('L hh:mm A');
    let classTime = moment()
      .set({ hour: moment().get('hour'), minute: 0, second: 0 })
      .format('HH:mm');
    let attendanceStatus = 'Full Class';
    let memberItem = undefined;
    let memberAlreadyCheckedIn = false;
    let noProgramSet = false;
    let captureType = 'scanner';
    let overduesLoaded = false;

    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }

    if (this.props.allMembers.length > 0) {
      this.props.fetchClassAttendances({
        classDate: classDate,
        className: className,
      });
    }
    var overdueMembers = [];
    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
      if (
        this.props.FAILEDpaymentHistory.length === 0 &&
        this.props.SUCCESSFULpaymentHistory.length === 0
      ) {
        this.props.fetchPaymentHistory({
          paymentType: 'FAILED',
          paymentMethod: 'ALL',
          paymentSource: 'ALL',
          dateField: 'PAYMENT',
          dateFrom: moment()
            .subtract(6, 'month')
            .format('YYYY-MM-DD'),
          dateTo: moment().format('YYYY-MM-DD'),
          setPaymentHistory: this.props.setPaymentHistory,
          internalPaymentType: 'client_failed',
          addNotification: this.props.addNotification,
          setSystemError: this.props.setSystemError,
        });

        this.props.fetchPaymentHistory({
          paymentType: 'SUCCESSFUL',
          paymentMethod: 'ALL',
          paymentSource: 'ALL',
          dateField: 'PAYMENT',
          dateFrom: moment()
            .subtract(1, 'month')
            .format('YYYY-MM-DD'),
          dateTo: moment().format('YYYY-MM-DD'),
          setPaymentHistory: this.props.setPaymentHistory,
          internalPaymentType: 'client_successful',
          addNotification: this.props.addNotification,
          setSystemError: this.props.setSystemError,
        });
      } else {
        if (
          getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
        ) {
          overdueMembers = this.getBamboraOverdues(
            this.props.FAILEDpaymentHistory,
            this.props.SUCCESSFULpaymentHistory,
            this.props.allMembers,
          );
        }
        overduesLoaded = true;
      }
    }
    this.state = {
      manualSelect: false,
      className,
      classDate,
      classTime,
      attendanceStatus,
      memberItem,
      memberAlreadyCheckedIn,
      noProgramSet,
      captureType,
      useCalendarSchedule: true,
      classScheduleDateDay: moment().day() === 0 ? 7 : moment().day(),
      overdueMembers,
      overduesLoaded: overduesLoaded,
      isFullscreenMode: false,
      showingFullScreen: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.fetchingClassSchedules &&
      !nextProps.fetchingClassAttendances &&
      nextProps.classSchedules.size !== 0 &&
      !this.state.manualSelect
    ) {
      var classScheduleDateDay = moment().day() === 0 ? 7 : moment().day();
      var classID = this.getClosestClass(
        classScheduleDateDay,
        nextProps.classSchedules,
      );
      var scheduleIdx = nextProps.classSchedules.findIndex(
        schedule => schedule.id === classID,
      );

      let className = nextProps.classSchedules.get(scheduleIdx).program;
      let classDate = moment(
        nextProps.classSchedules.get(scheduleIdx).start,
      ).format('L hh:mm A');
      let classTime = moment(
        nextProps.classSchedules.get(scheduleIdx).start,
      ).format('HH:mm');

      this.setState({
        classScheduleDateDay: classScheduleDateDay,
        //        className,
        classDate,
        //        classTime,
      });
    }
    if (
      nextProps.allMembers.length !== 0 &&
      nextProps.allMembers.length !== this.props.allMembers.length
    ) {
      let className = this.props.programs.get(0).program;
      let classDate = moment()
        .set({ hour: moment().get('hour'), minute: 0, second: 0 })
        .format('L hh:mm A');
      this.props.fetchClassAttendances({
        classDate: classDate,
        className: className,
      });
    }
    if (
      !nextProps.FAILEDpaymentHistoryLoading &&
      !nextProps.SUCCESSFULpaymentHistoryLoading &&
      nextProps.FAILEDpaymentHistory.length > 0 &&
      !this.state.overduesLoaded &&
      nextProps.allMembers.length > 0
    ) {
      var overdueMembers = this.getBamboraOverdues(
        nextProps.FAILEDpaymentHistory,
        nextProps.SUCCESSFULpaymentHistory,
        nextProps.allMembers,
      );
      this.setState({
        overdueMembers: overdueMembers,
        overduesLoaded: true,
      });
    }
  }

  getBamboraOverdues(failedPayments, successfulPayments, allMembers) {
    failedPayments = failedPayments.filter(
      payment =>
        payment.paymentStatus === 'Transaction Declined' ||
        payment.paymentStatus === 'DECLINED' ||
        payment.paymentStatus === 'PIN RETRY EXCEEDED' ||
        payment.paymentStatus === 'SERV NOT ALLOWED' ||
        payment.paymentStatus === 'EXPIRED CARD',
    );
    failedPayments = failedPayments.sort((a, b) => {
      if (a['debitDate'] < b['debitDate']) {
        return 1;
      }
      if (a['debitDate'] > b['debitDate']) {
        return -1;
      }
      return 0;
    });
    var uniqueFailed = [];
    failedPayments.forEach((failed, i) => {
      var idx = uniqueFailed.findIndex(
        unique => unique.yourSystemReference === failed.yourSystemReference,
      );
      if (idx === -1) {
        uniqueFailed[uniqueFailed.length] = failed;
      }
    });

    var uniqueHistoryAll = [];
    uniqueFailed.forEach((failed, i) => {
      // Remove any failed that has a successful payment
      var idx = successfulPayments.findIndex(successful => {
        return (
          failed.yourSystemReference === successful.yourSystemReference &&
          moment(successful.debitDate, 'YYYY-MM-DD HH:mm:SS').isAfter(
            moment(failed.debitDate, 'YYYY-MM-DD HH:mm:SS'),
          )
        );
      });

      if (idx === -1) {
        uniqueHistoryAll[uniqueHistoryAll.length] = failed;
      }
    });

    var uniqueHistory = [];
    uniqueHistoryAll.map(payment => {
      // Keep only Recurring Billing failures
      var idx = allMembers.findIndex(
        member =>
          member.values['Member ID'] === payment.yourSystemReference ||
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      if (idx !== -1) {
        if (validOverdue(allMembers[idx], successfulPayments, payment)) {
          uniqueHistory[uniqueHistory.length] = payment;
        }
      }
    });
    const data = uniqueHistory.map(payment => {
      var idx = allMembers.findIndex(
        member =>
          member.values['Member ID'] === payment.yourSystemReference ||
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      var member = undefined;
      if (idx !== -1) {
        member = allMembers[idx];
      }
      var lastPayment;
      if (idx !== -1) {
        lastPayment = getLastBillingStartDate(
          allMembers[idx],
          successfulPayments,
        );
      }
      let nowDate = moment();
      var overdueAmount = 0;
      if (member !== undefined) {
        var paymentPeriod = member.values['Billing Payment Period'];
        var period = 'months';
        var periodCount = 1;
        if (paymentPeriod === 'Daily') {
          period = 'days';
        } else if (paymentPeriod === 'Weekly') {
          period = 'weeks';
        } else if (paymentPeriod === 'Fortnightly') {
          period = 'weeks';
          periodCount = 2;
        } else if (paymentPeriod === 'Monthly') {
          period = 'months';
        }
        if (lastPayment.isAfter(moment())) {
          lastPayment = lastPayment.subtract(period, periodCount);
        }

        var nextBillingDate = lastPayment.add(period, periodCount);
        while (nextBillingDate.isBefore(nowDate)) {
          overdueAmount = overdueAmount + payment.paymentAmount;
          nextBillingDate = nextBillingDate.add(period, periodCount);
        }
        if (overdueAmount === 0) {
          overdueAmount = payment.paymentAmount;
        }
      }
      return {
        _id: payment.paymentID,
        paymentAmount: payment.paymentAmount,
        overdueAmount: overdueAmount,
        successDate: getLastBillingStartDate(member, successfulPayments),
        debitDate: payment.debitDate,
        memberGUID: member !== undefined ? member.id : '',
        name: member.values['First Name'] + ' ' + member.values['Last Name'],
      };
    });

    return data;
  }

  handleError(data) {
    console.log('Scanned Error:' + data);
  }

  handleScan(data) {
    data = data.toLowerCase();
    console.log('Scanned ClassName00:' + data);
    console.log('Scanned ClassName11:' + this.state.className);
    this.setState({ memberItem: undefined });
    this.setState({ memberAlreadyCheckedIn: false });
    this.setState({ noProgramSet: false });
    this.setState({ attendanceStatus: 'Full Class' });

    for (let i = 0; i < this.props.allMembers.length; i++) {
      if (
        this.props.allMembers[i].id
          .split('-')[4]
          .substring(6, 12)
          .toLowerCase() === data ||
        (this.props.allMembers[i].values['Alternate Barcode'] !== undefined &&
        this.props.allMembers[i].values['Alternate Barcode'] !== null &&
        this.props.allMembers[i].values['Alternate Barcode'] !== ''
          ? this.props.allMembers[i].values[
              'Alternate Barcode'
            ].toLowerCase() === data
          : false)
      ) {
        this.setState({ memberItem: this.props.allMembers[i] });
        if (
          this.props.allMembers[i].values['Ranking Program'] === undefined ||
          this.props.allMembers[i].values['Ranking Belt'] === undefined
        ) {
          this.setState({ noProgramSet: true });
        }
        break;
      }
    }
    for (let i = 0; i < this.props.classAttendances.length; i++) {
      if (
        this.state.memberItem !== undefined &&
        this.props.classAttendances[i].values['Member ID'] ===
          this.state.memberItem.values['Member ID'] &&
        this.props.classAttendances[i].values['Class Time'] ===
          this.state.classTime &&
        this.props.classAttendances[i].values['Class'] === this.state.className
      ) {
        this.setState({ memberAlreadyCheckedIn: true });
        this.props.classAttendances[i].memberAlreadyCheckedIn = true;
      } else {
        this.props.classAttendances[i].memberAlreadyCheckedIn = false;
      }
    }

    //    if (this.state.memberAlreadyCheckedIn){
    this.props.setClassAttendances(this.props.classAttendances);
    //    }
    setTimeout(function() {
      $('#checkinMember').focus();
    }, 500);

    console.log('Scanned ClassName:' + this.state.className);
  }

  doShowAttendance(classDate, classTime, className) {
    this.setState({
      className: className,
      memberItem: undefined,
    });
    if (
      moment(classDate).format('L hh:mm A') !==
        moment(this.state.classDate).format('L hh:mm A') ||
      classTime !== this.state.classTime ||
      this.state.className !== className
    ) {
      this.props.fetchClassBookings({
        classDate: moment(classDate, 'L hh:mm A').format('YYYY-MM-DD'),
        classTime: classTime,
        program: className,
        status: 'Booked',
        allMembers: this.props.allMembers,
      });
      this.props.fetchClassAttendances({
        classDate: moment(classDate, 'L hh:mm A').format('YYYY-MM-DD'),
      });
    }
    $('#programClass').blur(); // Need to avoid scanning setting a value wierdly
    console.log('showAttendance:' + this.state.className);
  }

  checkInMember() {
    let attendance = {
      attendanceStatus: this.state.attendanceStatus,
    };
    this.setState({ memberItem: undefined });
    this.props.checkinMember(
      this.props.createAttendance,
      attendance,
      this.props.additionalPrograms,
      this.state.memberItem,
      this.state.className,
      this.state.classDate,
      this.state.classTime,
      this.state.attendanceStatus,
      this.props.classAttendances,
      this.props.allMembers,
      this.props.updateMember,
    );
    console.log('checkInMember');
  }

  checkinBooking(booking) {
    let memberItem;
    for (let i = 0; i < this.props.allMembers.length; i++) {
      if (this.props.allMembers[i].id === booking.memberGUID) {
        memberItem = this.props.allMembers[i];
        this.setState({ memberItem: this.props.allMembers[i] });
        if (
          this.props.allMembers[i].values['Ranking Program'] === undefined ||
          this.props.allMembers[i].values['Ranking Belt'] === undefined
        ) {
          this.setState({ noProgramSet: true });
        }
        break;
      }
    }
    var memberAlreadyCheckedIn = false;
    for (let j = 0; j < this.props.classAttendances.length; j++) {
      if (
        this.props.classAttendances[j].values['Member GUID'] ===
          booking.memberGUID &&
        this.props.classAttendances[j].values['Class Time'] ===
          this.state.classTime &&
        this.props.classAttendances[j].values['Class'] === this.state.className
      ) {
        this.setState({ memberAlreadyCheckedIn: true });
        this.props.classAttendances[j].memberAlreadyCheckedIn = true;
        memberAlreadyCheckedIn = true;
        break;
      }
    }

    let attendance = {
      attendanceStatus: 'Full Class',
    };
    this.setState({ memberItem: undefined });
    if (!memberAlreadyCheckedIn) {
      this.props.checkinMember(
        this.props.createAttendance,
        attendance,
        this.props.additionalPrograms,
        memberItem,
        this.state.className,
        this.state.classDate,
        this.state.classTime,
        'Full Class',
        this.props.classAttendances,
        this.props.allMembers,
        this.props.updateMember,
      );
    }
    let values = {};
    values['Status'] = 'Attended';
    this.props.updateBooking({
      id: booking.id,
      values,
    });
    var idx = this.props.classBookings.findIndex(
      element => element.id === booking.id,
    );
    var classBookings = this.props.classBookings.splice(idx, 1);
    this.props.setClassBookings({
      allMembers: this.props.allMembers,
      classBookings: classBookings,
    });

    console.log('checkInMember');
  }

  deleteCheckin(attendance) {
    console.log('delete checkin:' + attendance.id);

    this.props.deleteAttendance({
      attendance: attendance,
      additionalPrograms: this.props.additionalPrograms,
      classAttendances: this.props.classAttendances,
      updateMember: this.props.updateMember,
      allMembers: this.props.allMembers,
      classDate: this.state.classDate,
    });
  }
  noShowBooking(booking) {
    let values = {};
    values['Status'] = 'No Show';
    this.props.updateBooking({
      id: booking.id,
      values,
    });
    var idx = this.props.classBookings.findIndex(
      element => element.id === booking.id,
    );
    var classBookings = this.props.classBookings.splice(idx, 1);
    this.props.setClassBookings({
      allMembers: this.props.allMembers,
      classBookings: classBookings,
    });
  }
  handleMemberIDChange(e) {
    this.setState({ memberItem: undefined });
    this.props.allMembers.forEach(member => {
      if (member.values['Member ID'] === e.target.value) {
        this.setState({ memberItem: member });
      }
    });
    console.log('handleMemberIDChange:' + e);
  }
  switchToManual() {
    this.setState({ captureType: 'manual' });
  }
  selectNewMember() {
    this.setState({
      memberItem: undefined,
    });
  }
  switchToScan() {
    this.setState({ captureType: 'scanner' });
  }
  getAllMembers() {
    let membersVals = [];
    membersVals.push({
      label: '',
      value: '',
    });
    this.props.allMembers.forEach(member => {
      if (member.values['Status'] !== 'Inactive') {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals;
  }
  getOptionStyle(schedule) {
    return {
      backgroundColor: schedule.colour,
      color: schedule.textColour,
      padding: '6px',
      margin: '4px',
    };
  }
  getDayClasses(classSchedules, classScheduleDateDay) {
    let classes = [];
    classSchedules
      .filter(schedule => {
        if (
          classScheduleDateDay ===
          (moment(schedule.start).day() === 0
            ? 7
            : moment(schedule.start).day())
        ) {
          return true;
        }
        return false;
      })
      .map(schedule =>
        classes.push({
          label: (
            <span style={this.getOptionStyle(schedule)}>
              {schedule.title +
                '[' +
                schedule.program +
                ']-' +
                moment(schedule.start).format('h:mm A')}
            </span>
          ),
          value: schedule.id,
          schedule: schedule,
        }),
      );
    return classes;
  }
  selectMember(e) {
    let id = e.value;
    this.setState({ memberItem: undefined });
    this.setState({ memberAlreadyCheckedIn: false });
    this.setState({ noProgramSet: false });
    this.setState({ overdueMember: false });
    this.setState({ attendanceStatus: 'Full Class' });

    let memberItem;
    for (let i = 0; i < this.props.allMembers.length; i++) {
      if (this.props.allMembers[i].id === id) {
        memberItem = this.props.allMembers[i];
        this.setState({ memberItem: this.props.allMembers[i] });
        if (
          this.props.allMembers[i].values['Ranking Program'] === undefined ||
          this.props.allMembers[i].values['Ranking Belt'] === undefined
        ) {
          this.setState({ noProgramSet: true });
        }
        break;
      }
    }
    for (let i = 0; i < this.props.classAttendances.length; i++) {
      if (
        this.props.classAttendances[i].values['Member ID'] ===
          memberItem.values['Member ID'] &&
        this.props.classAttendances[i].values['Class Time'] ===
          this.state.classTime &&
        this.props.classAttendances[i].values['Class'] === this.state.className
      ) {
        this.setState({ memberAlreadyCheckedIn: true });
        this.props.classAttendances[i].memberAlreadyCheckedIn = true;
      } else {
        this.props.classAttendances[i].memberAlreadyCheckedIn = false;
      }
    }

    var overdueIdx = this.state.overdueMembers.findIndex(
      member => member.memberGUID === memberItem.id,
    );
    if (overdueIdx !== -1) {
      memberItem.overdueAmount = this.state.overdueMembers[
        overdueIdx
      ].overdueAmount;
      this.setState({
        overdueMember: true,
      });
    }

    //    if (this.state.memberAlreadyCheckedIn){
    this.props.setClassAttendances(this.props.classAttendances);
    //    }
    console.log('Scanned:' + id);
    setTimeout(function() {
      $('#checkinMember').focus();
    }, 500);
  }

  getClosestClass(classScheduleDateDay, classSchedules) {
    var scheduleID = '';
    var lastDate = undefined;
    classSchedules.forEach((schedule, i) => {
      if (
        classScheduleDateDay ===
        (moment(schedule.start).day() === 0 ? 7 : moment(schedule.start).day())
      ) {
        if (
          lastDate === undefined ||
          (moment(schedule.start).hour() > lastDate.hour() &&
            moment(schedule.start).hour() <= moment().hour())
        ) {
          scheduleID = schedule.id;
          lastDate = moment(schedule.start);
        }
      }
    });

    return scheduleID;
  }
  render() {
    return (
      <div>
        {this.props.fetchingClassSchedules ||
        (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora' &&
          (this.props.FAILEDpaymentHistoryLoading ||
            this.props.SUCCESSFULpaymentHistoryLoading)) ||
        this.props.membersLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="attendanceSection">
            <div className="checkinFilter">
              <label htmlFor="checkins">Anytime Mode</label>
              <div className="checkboxFilter">
                <input
                  id="checkins"
                  type="checkbox"
                  value="1"
                  onChange={e => {
                    this.setState({
                      useCalendarSchedule: !this.state.useCalendarSchedule,
                      classScheduleDateDay:
                        moment(this.state.classDate, 'L hh:mm A').day() === 0
                          ? 7
                          : moment(this.state.classDate, 'L hh:mm A').day(),
                    });
                  }}
                />
                <label htmlFor="checkins"></label>
              </div>
            </div>
            <div className="startSelfCheckin">
              <button
                type="button"
                id="selfCheckinBtn"
                className="btn btn-primary btn-block"
                onClick={e => {
                  this.setState({
                    showingFullScreen: true,
                  });
                }}
              >
                Start Self Checkin
              </button>
            </div>
            {this.state.showingFullScreen && (
              <SelfCheckinMode
                attendanceThis={this}
                attendanceAdded={this.props.attendanceAdded}
              />
            )}
            {this.state.useCalendarSchedule ? (
              <div className="classSection">
                <span className="line">
                  <div className="sessionDate">
                    <label htmlFor="sessionDate">DATE</label>
                    <Datetime
                      className="float-right"
                      defaultValue={moment(
                        this.state.classDate,
                        'L hh:mm A',
                      ).set({
                        hour: 0,
                        minute: 0,
                        second: 0,
                      })}
                      dateFormat={moment(new Date())
                        .locale(
                          getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                        )
                        .localeData()
                        .longDateFormat('L')}
                      timeFormat={false}
                      onBlur={dt => {
                        this.doShowAttendance(
                          dt.format('L hh:mm A'),
                          dt.format('hh:mm'),
                          undefined,
                        );
                        $(
                          '.classSection .hide-columns__single-value span',
                        ).html('');
                        this.setState({
                          manualSelect: true,
                          classDate: dt.format('L hh:mm A'),
                          classScheduleDateDay:
                            moment(dt).day() === 0 ? 7 : moment(dt).day(),
                        });
                      }}
                    />
                  </div>
                  <div className="class">
                    <label htmlFor="programClass">CLASS</label>
                    <Select
                      closeMenuOnSelect={true}
                      options={this.getDayClasses(
                        this.props.classSchedules,
                        this.state.classScheduleDateDay,
                      )}
                      styles={{
                        option: base => ({
                          ...base,
                          width: '100%',
                        }),
                        input: base => ({
                          ...base,
                          width: '400px',
                        }),
                      }}
                      className="programClass"
                      classNamePrefix="hide-columns"
                      placeholder="Select Class"
                      onChange={e => {
                        var scheduleIdx = this.props.classSchedules.findIndex(
                          schedule => schedule.id === e.value,
                        );

                        this.setState({
                          manualSelect: true,
                          classTime: moment(
                            this.props.classSchedules.get(scheduleIdx).start,
                          ).format('HH:mm'),
                        });

                        this.doShowAttendance(
                          this.state.classDate,
                          moment(
                            this.props.classSchedules.get(scheduleIdx).start,
                          ).format('HH:mm'),
                          this.props.classSchedules.get(scheduleIdx).program,
                        );
                      }}
                    />
                  </div>
                </span>
              </div>
            ) : (
              <div className="classSection">
                <span className="line">
                  <div className="sessionDate">
                    <label htmlFor="sessionDate">DATE</label>
                    <Datetime
                      className="float-right"
                      defaultValue={moment(
                        this.state.classDate,
                        'L hh:mm A',
                      ).set({
                        hour: moment().get('hour'),
                        minute: 0,
                        second: 0,
                      })}
                      dateFormat={moment(new Date())
                        .locale(
                          getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                        )
                        .localeData()
                        .longDateFormat('L')}
                      timeConstraints={{
                        minutes: {
                          step: parseInt(
                            getAttributeValue(
                              this.props.space,
                              'Calendar Time Slots',
                              '15',
                            ),
                          ),
                        },
                      }}
                      onBlur={dt => {
                        this.doShowAttendance(
                          dt.format('L hh:mm A'),
                          dt.format('hh:mm'),
                          this.state.className,
                        );
                        this.setState({
                          manualSelect: true,
                          classDate: dt.format('L hh:mm A'),
                          classTime: dt.format('HH:mm'),
                        });
                      }}
                    />
                  </div>
                  <div className="class">
                    <label htmlFor="programClass">CLASS</label>
                    <select
                      name="programClass"
                      id="programClass"
                      onChange={e => {
                        this.doShowAttendance(
                          this.state.classDate,
                          this.state.classTime,
                          e.target.value,
                        );
                      }}
                    >
                      <option value="" />
                      {this.props.programs
                        .concat(this.props.additionalPrograms)
                        .map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program}
                          </option>
                        ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                </span>
              </div>
            )}
            <div className="classBookingSection">
              <h4 className="classBookingLabel">Class Bookings</h4>
              {this.props.fetchingClassBookings ? (
                <h4>Loading Class Bookings....</h4>
              ) : (
                <div>
                  {this.props.classBookings.size === 0 ? (
                    <div>
                      <h4>No bookings for this class</h4>
                    </div>
                  ) : (
                    <div className="classBookings">
                      {this.props.classBookings.map((booking, index) => (
                        <span
                          key={index}
                          className={'memberCell'}
                          id={booking.id}
                        >
                          <span className="top">
                            {booking.photo === undefined ? (
                              <span className="noPhoto">
                                {booking.firstName[0]}
                                {booking.lastName[0]}
                              </span>
                            ) : (
                              <img
                                src={booking.photo}
                                alt="Member Photograph"
                                className="photo"
                              />
                            )}
                            <span className="memberInfo">
                              <h4 className="memberName">
                                {booking.firstName} {booking.lastName}
                              </h4>
                              <span
                                className="checkinBooking"
                                onClick={e => this.checkinBooking(booking)}
                              >
                                <SVGInline svg={tickIcon} className="icon" />
                              </span>
                              <span
                                className="noshowBooking"
                                onClick={e => this.noShowBooking(booking)}
                              >
                                <SVGInline svg={crossIcon} className="icon" />
                              </span>
                            </span>
                          </span>
                          <span className="bottom">
                            <span className="ranking">
                              <div className="program">
                                {getProgramSVG(booking.rankingProgram)}
                              </div>
                              <div className="belt">
                                {getBeltSVG(booking.rankingBelt)}
                              </div>
                            </span>
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="checkinSection">
              {this.state.memberItem === undefined &&
              this.state.captureType === 'scanner' ? (
                <div className="readyToScan">
                  <h5>READY TO SCAN MEMBER</h5>
                  <SVGInline svg={barcodeIcon} className="icon" />
                  <button
                    type="button"
                    id="changeToManual"
                    className="btn btn-primary btn-block"
                    onClick={e => this.switchToManual()}
                  >
                    Enter Manually
                  </button>
                </div>
              ) : (
                <div />
              )}
              {this.state.memberItem === undefined &&
              this.state.captureType === 'manual' ? (
                <div className="manual">
                  <h5>PLEASE SELECT MEMBER</h5>
                  <Select
                    closeMenuOnSelect={true}
                    options={this.getAllMembers()}
                    className="hide-columns-container"
                    classNamePrefix="hide-columns"
                    placeholder="Select Member"
                    onChange={e => {
                      this.selectMember(e);
                    }}
                    style={{ width: '300px' }}
                  />
                  <button
                    type="button"
                    id="changeToScan"
                    className="btn btn-primary btn-block"
                    onClick={e => this.switchToScan()}
                  >
                    Switch to Scan
                  </button>
                </div>
              ) : (
                <div />
              )}
              {this.state.memberItem === undefined ? (
                <div />
              ) : (
                <div className="memberInfo">
                  {this.state.memberItem.values['Photo'] === undefined ? (
                    <span className="noPhoto">
                      {this.state.memberItem.values['First Name'][0]}
                      {this.state.memberItem.values['Last Name'][0]}
                    </span>
                  ) : (
                    <img
                      src={this.state.memberItem.values['Photo']}
                      alt="Member Photograph"
                      className="photo"
                    />
                  )}
                  <div className="info">
                    {this.state.memberAlreadyCheckedIn ? (
                      <h2 className="alreadyCheckedinLabel">
                        Member already checked in
                      </h2>
                    ) : (
                      <div />
                    )}
                    {this.state.noProgramSet ? (
                      <h2 className="noProgramSetLabel">
                        Member does not have a Program or Belt value set
                      </h2>
                    ) : (
                      <div />
                    )}
                    {!this.state.memberAlreadyCheckedIn &&
                    this.state.noProgramSet ? (
                      <h2>Checking in member</h2>
                    ) : (
                      <div />
                    )}
                    <h4>
                      {this.state.memberItem.values['First Name']}{' '}
                      {this.state.memberItem.values['Last Name']}:{' '}
                      <b>{this.state.memberItem.values['Ranking Program']}</b>-
                      <i>{this.state.memberItem.values['Ranking Belt']}</i>
                    </h4>
                    <h4>
                      For class <b>{this.state.className}</b> at{' '}
                      <b>
                        {moment(this.state.classDate, 'L hh:mm A').format(
                          'L hh:mm A',
                        )}
                      </b>
                    </h4>
                  </div>
                  {this.state.memberAlreadyCheckedIn ||
                  this.state.noProgramSet ? (
                    <div />
                  ) : (
                    <div className="applyCheckin">
                      <div>
                        <select
                          name="status"
                          id="status"
                          ref={input => (this.input = input)}
                          defaultValue="Full Class"
                          onChange={e => {
                            this.setState({ attendanceStatus: e.target.value });
                          }}
                        >
                          <option value="" />
                          <option key="Full Class" value="Full Class">
                            Full Class
                          </option>
                          <option key="Class Only" value="Class Only">
                            Class Only
                          </option>
                          <option key="Spar Only" value="Spar Only">
                            Spar Only
                          </option>
                          <option key="Late" value="Late">
                            Late
                          </option>
                        </select>
                        <div className="droparrow" />
                      </div>
                      <div>
                        <button
                          type="button"
                          id="checkinMember"
                          className="btn btn-primary btn-block"
                          onClick={e => this.checkInMember()}
                        >
                          Check-in Member
                        </button>
                      </div>
                      {this.state.memberItem.values['Covid19 Waiver'] ===
                        null ||
                      this.state.memberItem.values['Covid19 Waiver'] ===
                        undefined ||
                      this.state.memberItem.values['Covid19 Waiver'] === '' ? (
                        <div className="waiverIncomplete">Waiver Required</div>
                      ) : (
                        <div />
                      )}
                      {this.state.memberItem.values['Covid19 Waiver'] ===
                      'NOT Agreed' ? (
                        <div className="waiverIncomplete">
                          Waiver NOT Agreed
                        </div>
                      ) : (
                        <div />
                      )}
                      {Utils.getAttributeValue(
                        this.props.space,
                        'Covid Check Required',
                      ) === 'TRUE' && (
                        <div>
                          {this.state.memberItem.values[
                            'Student Covid Check'
                          ] === null ||
                          this.state.memberItem.values[
                            'Student Covid Check'
                          ] === undefined ||
                          this.state.memberItem.values[
                            'Student Covid Check'
                          ] === '' ? (
                            <div className="waiverIncomplete">
                              Student Covid Check Required
                            </div>
                          ) : (
                            <div />
                          )}
                        </div>
                      )}
                      {this.state.overdueMember ? (
                        <span
                          className="overdue"
                          onClick={e => {
                            window.location =
                              '/#/kapps/services/categories/bambora-billing/bambora-change-credit-card-details?id=' +
                              this.state.memberItem.id +
                              '&overdue=' +
                              this.state.memberItem.overdueAmount;
                          }}
                        >
                          <i className="fa fa-usd overdue"></i>
                          <span>{this.state.memberItem.overdueAmount}</span>
                        </span>
                      ) : (
                        <div />
                      )}
                    </div>
                  )}
                  <GradingStatus
                    memberItem={this.state.memberItem}
                    belts={this.props.belts}
                    allMembers={this.props.allMembers}
                  />
                  {this.state.captureType === 'manual' ? (
                    <button
                      type="button"
                      id="manualNewMember"
                      className="btn btn-primary btn-block"
                      onClick={e => this.selectNewMember()}
                    >
                      Select New Member
                    </button>
                  ) : (
                    <div />
                  )}
                </div>
              )}
            </div>
            <div className="attendanceSection">
              <h4 className="classAttendancesLabel">
                Class Attendees (
                {
                  this.props.classAttendances.filter(checkin => {
                    var result =
                      checkin.values['Class Time'] === this.state.classTime &&
                      checkin.values['Class'] === this.state.className;

                    if (result) {
                      var overdueIdx = this.state.overdueMembers.findIndex(
                        member =>
                          member.memberGUID === checkin.values['Member GUID'],
                      );
                      if (overdueIdx !== -1) {
                        checkin.overdueMember = true;
                        checkin.overdueAmount = this.state.overdueMembers[
                          overdueIdx
                        ].overdueAmount;
                      }
                      var mIdx = this.props.allMembers.findIndex(
                        member => member.id === checkin.values['Member GUID'],
                      );
                      if (mIdx !== -1) {
                        checkin.memberItem = this.props.allMembers[mIdx];
                      }
                    }
                    return result;
                  }).length
                }
                )
              </h4>
              {this.props.fetchingClassAttendances ? (
                <h4>Loading Class Attendances....</h4>
              ) : (
                <div className="classMembers">
                  {this.props.classAttendances.length === 0 ? (
                    <div>
                      <h4>No members checked in for this class</h4>
                    </div>
                  ) : (
                    <div>
                      {this.props.classAttendances
                        .filter(checkin => {
                          return (
                            checkin.values['Class Time'] ===
                              this.state.classTime &&
                            checkin.values['Class'] === this.state.className
                          );
                        })
                        .map((checkin, index) => (
                          <span
                            key={index}
                            className={
                              checkin.memberAlreadyCheckedIn
                                ? 'memberCell alreadyCheckedIn'
                                : 'memberCell'
                            }
                            id={checkin.id}
                          >
                            <span className="top">
                              {checkin.values['Photo'] === undefined ? (
                                <span className="noPhoto">
                                  {checkin.values['First Name'][0]}
                                  {checkin.values['Last Name'][0]}
                                </span>
                              ) : (
                                <img
                                  src={checkin.values['Photo']}
                                  alt="Member Photograph"
                                  className="photo"
                                />
                              )}
                              <span className="memberInfo">
                                <h4 className="memberName">
                                  <NavLink
                                    to={`/Member/${checkin.values['Member GUID']}`}
                                    className=""
                                  >
                                    {checkin.values['First Name']}{' '}
                                    {checkin.values['Last Name']}
                                  </NavLink>
                                </h4>
                                <h5
                                  className={
                                    checkin.values['Attendance Status'][0]
                                  }
                                >
                                  {checkin.values['Attendance Status'][0]}
                                </h5>
                                {checkin.overdueMember ? (
                                  <span
                                    className="overdue"
                                    onClick={e => {
                                      window.location =
                                        '/#/kapps/services/categories/bambora-billing/bambora-change-credit-card-details?id=' +
                                        checkin.values['Member GUID'] +
                                        '&overdue=' +
                                        checkin.overdueAmount;
                                    }}
                                  >
                                    <i className="fa fa-usd overdue"></i>
                                    <span>{checkin.overdueAmount}</span>
                                  </span>
                                ) : (
                                  <div />
                                )}

                                <span
                                  className="deleteCheckin"
                                  onClick={e => this.deleteCheckin(checkin)}
                                >
                                  <SVGInline svg={binIcon} className="icon" />
                                </span>
                              </span>
                            </span>
                            <span className="bottom">
                              <span className="ranking">
                                <div className="program">
                                  {getProgramSVG(
                                    checkin.values['Ranking Program'],
                                  )}
                                </div>
                                <div className="belt">
                                  {getBeltSVG(checkin.values['Ranking Belt'])}
                                </div>
                              </span>
                              <GradingStatus
                                memberItem={checkin.memberItem}
                                belts={this.props.belts}
                                allMembers={this.props.allMembers}
                              />
                            </span>
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            {!this.state.showingFullScreen && (
              <BarcodeReader
                onError={this.handleError}
                onScan={this.handleScan}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

export const AttendanceView = ({
  allMembers,
  programs,
  additionalPrograms,
  checkinMember,
  createAttendance,
  fetchClassAttendances,
  fetchClassBookings,
  classAttendances,
  fetchingClassAttendances,
  fetchingClassBookings,
  classBookings,
  classSchedules,
  fetchingClassSchedules,
  deleteAttendance,
  setClassAttendances,
  setClassBookings,
  updateBooking,
  updateMember,
  belts,
  space,
  profile,
  fetchPaymentHistory,
  setPaymentHistory,
  addNotification,
  setSystemError,
  FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading,
  SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading,
  attendanceAdded,
}) => (
  <AttendanceDetail
    allMembers={allMembers}
    programs={programs}
    additionalPrograms={additionalPrograms}
    checkinMember={checkinMember}
    createAttendance={createAttendance}
    fetchClassAttendances={fetchClassAttendances}
    fetchClassBookings={fetchClassBookings}
    classAttendances={classAttendances}
    classBookings={classBookings}
    fetchingClassAttendances={fetchingClassAttendances}
    fetchingClassBookings={fetchingClassBookings}
    classSchedules={classSchedules}
    fetchingClassSchedules={fetchingClassSchedules}
    deleteAttendance={deleteAttendance}
    setClassAttendances={setClassAttendances}
    setClassBookings={setClassBookings}
    updateBooking={updateBooking}
    updateMember={updateMember}
    belts={belts}
    space={space}
    profile={profile}
    fetchPaymentHistory={fetchPaymentHistory}
    setPaymentHistory={setPaymentHistory}
    addNotification={addNotification}
    setSystemError={setSystemError}
    FAILEDpaymentHistory={FAILEDpaymentHistory}
    FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
    SUCCESSFULpaymentHistory={SUCCESSFULpaymentHistory}
    SUCCESSFULpaymentHistoryLoading={SUCCESSFULpaymentHistoryLoading}
    attendanceAdded={attendanceAdded}
  />
);
export const AttendanceContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(props => {}),
  withHandlers({
    checkinMember: ({
      createAttendance,
      attendance,
      additionalPrograms,
      memberItem,
      className,
      classDate,
      classTime,
      attendanceStatus,
      classAttendances,
      allMembers,
      updateMember,
    }) => (
      createAttendance,
      attendance,
      additionalPrograms,
      memberItem,
      className,
      classDate,
      classTime,
      attendanceStatus,
      classAttendances,
      allMembers,
      updateMember,
    ) => {
      console.log('checkin:' + className);
      let values = {};
      values['Member GUID'] = memberItem.id;
      values['Member ID'] = memberItem.values['Member ID'];
      values['Status'] = 'Active';
      values['Ranking Program'] = memberItem.values['Ranking Program'];
      values['Ranking Belt'] = memberItem.values['Ranking Belt'];
      values['Class'] = className;
      let dt = moment(classDate, 'L hh:mm A');
      values['Class Date'] = moment(dt).format('YYYY-MM-DD');
      values['Class Time'] = classTime;
      values['Attendance Status'] = attendanceStatus;

      createAttendance({
        values: values,
        attendance: attendance,
        additionalPrograms: additionalPrograms,
        classAttendances: classAttendances,
        allMembers: allMembers,
        updateMember: updateMember,
        classDate: classDate,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );
      if (this.props.classSchedules.size === 0) {
        this.props.fetchClassSchedules();
      }
      if (this.props.isKiosk) {
        this.props.fetchMembers();
      }
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
    },
    componentWillUnmount() {},
  }),
)(AttendanceView);

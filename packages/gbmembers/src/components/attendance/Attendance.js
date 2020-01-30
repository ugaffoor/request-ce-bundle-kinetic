import React, { Component } from 'react';
import { compose, lifecycle } from 'recompose';
import $ from 'jquery';
import BarcodeReader from 'react-barcode-reader';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as memberActions } from '../../redux/modules/members';
import { connect } from 'react-redux';
import moment from 'moment';
import Datetime from 'react-datetime';
import barcodeIcon from '../../images/barcode.svg?raw';
import binIcon from '../../images/bin.svg?raw';
import SVGInline from 'react-svg-inline';
import Select from 'react-select';
import { withHandlers } from 'recompose';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  classAttendances: state.member.attendance.classAttendances,
  fetchingClassAttendances: state.member.attendance.fetchingClassAttendances,
});

const mapDispatchToProps = {
  fetchClassAttendances: attendanceActions.fetchClassAttendances,
  createAttendance: attendanceActions.createAttendance,
  deleteAttendance: attendanceActions.deleteAttendance,
  setClassAttendances: attendanceActions.setClassAttendances,
  updateMember: memberActions.updateMember,
};

export class AttendanceDetail extends Component {
  constructor(props) {
    super(props);

    this.handleScan = this.handleScan.bind(this);
    let className = this.props.programs.get(0).program;
    let classDate = moment()
      .set({ hour: moment().get('hour'), minute: 0, second: 0 })
      .format('MM/DD/YYYY hh:mm A');
    let classTime = moment()
      .set({ hour: moment().get('hour'), minute: 0, second: 0 })
      .format('HH:mm');
    let attendanceStatus = 'Full Class';
    let memberItem = undefined;
    let memberAlreadyCheckedIn = false;
    let noProgramSet = false;
    let captureType = 'scanner';
    this.state = {
      className,
      classDate,
      classTime,
      attendanceStatus,
      memberItem,
      memberAlreadyCheckedIn,
      noProgramSet,
      captureType,
    };
    this.props.fetchClassAttendances({
      classDate: classDate,
      className: className,
    });
  }

  handleError(data) {
    console.log('Scanned Error:' + data);
  }

  handleScan(data) {
    console.log('Scanned ClassName00:' + data);
    console.log('Scanned ClassName11:' + this.state.className);
    this.setState({ memberItem: undefined });
    this.setState({ memberAlreadyCheckedIn: false });
    this.setState({ noProgramSet: false });
    this.setState({ attendanceStatus: 'Full Class' });

    for (let i = 0; i < this.props.allMembers.length; i++) {
      if (this.props.allMembers[i].id.split('-')[4].substring(6, 12) === data) {
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
          this.state.memberItem.values['Member ID'] &&
        this.props.classAttendances[i].values['Class Time'] ===
          this.state.classTime
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

    console.log('Scanned ClassName:' + this.state.className);
  }

  doShowAttendance(classDate, className) {
    this.setState({
      className: className,
      memberItem: undefined,
    });
    if (
      moment(classDate).format('MM/DD/YYYY') !==
      moment(this.state.classDate).format('MM/DD/YYYY')
    ) {
      this.props.fetchClassAttendances({ classDate: classDate });
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
      this.state.memberItem,
      this.state.className,
      this.state.classDate,
      this.state.attendanceStatus,
      this.props.classAttendances,
      this.props.allMembers,
      this.props.updateMember,
    );
    console.log('checkInMember');
  }

  deleteCheckin(attendance) {
    console.log('delete checkin:' + attendance.id);
    this.props.deleteAttendance({
      attendance: attendance,
      classAttendances: this.props.classAttendances,
      updateMember: this.props.updateMember,
      allMembers: this.props.allMembers,
      classDate: this.state.classDate,
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
    this.props.allMembers.forEach(member => {
      membersVals.push({
        label: member.values['Last Name'] + ' ' + member.values['First Name'],
        value: member.id,
      });
    });
    return membersVals;
  }
  selectMember(e) {
    let id = e.value;
    this.setState({ memberItem: undefined });
    this.setState({ memberAlreadyCheckedIn: false });
    this.setState({ noProgramSet: false });
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
          this.state.classTime
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
    console.log('Scanned:' + id);
  }

  render() {
    return (
      <div className="attendanceSection">
        <div className="classSection">
          <span className="line">
            <div>
              <label htmlFor="sessionDate">Date</label>
              <Datetime
                className="float-right"
                defaultValue={moment().set({
                  hour: moment().get('hour'),
                  minute: 0,
                  second: 0,
                })}
                dateFormat="DD/MM/YYYY"
                timeConstraints={{ minutes: { step: 30 } }}
                onBlur={dt => {
                  this.doShowAttendance(
                    dt.format('MM/DD/YYYY hh:mm A'),
                    this.state.className,
                  );
                  this.setState({
                    classDate: dt.format('MM/DD/YYYY hh:mm A'),
                    classTime: dt.format('HH:mm'),
                  });
                }}
              />
            </div>
            <div>
              <label htmlFor="programClass">Class</label>
              <select
                name="programClass"
                id="programClass"
                defaultValue={this.props.programs.get(0).program}
                onChange={e => {
                  this.doShowAttendance(this.state.classDate, e.target.value);
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
        <div className="checkinSection">
          {this.state.memberItem === undefined &&
          this.state.captureType === 'scanner' ? (
            <div className="readyToScan">
              <h5>Ready to scan member</h5>
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
              <h5>Please select Member</h5>
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
                    {moment(this.state.classDate).format('DD/MM/YYYY hh:mm A')}
                  </b>
                </h4>
              </div>
              {this.state.memberAlreadyCheckedIn || this.state.noProgramSet ? (
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
                      Checkin Member
                    </button>
                  </div>
                </div>
              )}
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
          <h4 className="classAttendancesLabel">Class Attendees</h4>
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
                    .filter(
                      checkin =>
                        checkin.values['Class Time'] === this.state.classTime &&
                        checkin.values['Class'] === this.state.className,
                    )
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
                            {checkin.values['First Name']}{' '}
                            {checkin.values['Last Name']}
                          </h4>
                          <br />
                          <h4
                            className={checkin.values['Attendance Status'][0]}
                          >
                            {checkin.values['Attendance Status'][0]}
                          </h4>
                          <span
                            className="deleteCheckin"
                            onClick={e => this.deleteCheckin(checkin)}
                          >
                            <SVGInline svg={binIcon} className="icon" />
                          </span>
                        </span>
                      </span>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
        <BarcodeReader onError={this.handleError} onScan={this.handleScan} />
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
  classAttendances,
  fetchingClassAttendances,
  deleteAttendance,
  setClassAttendances,
  updateMember,
}) => (
  <AttendanceDetail
    allMembers={allMembers}
    programs={programs}
    additionalPrograms={additionalPrograms}
    checkinMember={checkinMember}
    createAttendance={createAttendance}
    fetchClassAttendances={fetchClassAttendances}
    classAttendances={classAttendances}
    fetchingClassAttendances={fetchingClassAttendances}
    deleteAttendance={deleteAttendance}
    setClassAttendances={setClassAttendances}
    updateMember={updateMember}
  />
);

export const AttendanceContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({
    checkinMember: ({
      createAttendance,
      attendance,
      memberItem,
      className,
      classDate,
      attendanceStatus,
      classAttendances,
      allMembers,
      updateMember,
    }) => (
      createAttendance,
      attendance,
      memberItem,
      className,
      classDate,
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
      let dt = moment(classDate);
      values['Class Date'] = dt.format('YYYY-MM-DD');
      values['Class Time'] = dt.format('HH:mm');
      values['Attendance Status'] = attendanceStatus;

      createAttendance({
        values: values,
        attendance: attendance,
        classAttendances: classAttendances,
        allMembers: allMembers,
        updateMember: updateMember,
        classDate: classDate,
      });
    },
  }),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(AttendanceView);

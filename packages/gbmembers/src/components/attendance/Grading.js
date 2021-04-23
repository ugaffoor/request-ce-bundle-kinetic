import React, { Component } from 'react';
import { compose, withState, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { GradingStatus } from './GradingStatus';
import { PromotionReviewIcon } from './PromotionReviewIcon';
import { withHandlers } from 'recompose';
import { getProgramSVG, getBeltSVG } from '../Member/MemberUtils';
import { actions as classActions } from '../../redux/modules/classes';
import moment from 'moment';
import { actions as attendanceActions } from '../../redux/modules/attendance';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  classSchedules: state.member.classes.classSchedules,
  fetchingClassSchedules: state.member.classes.fetchingClassSchedules,
  fetchingClassAttendances: state.member.attendance.fetchingClassAttendances,
  classAttendances: state.member.attendance.classAttendances,
});
const mapDispatchToProps = {
  fetchClassSchedules: classActions.fetchClassSchedules,
  fetchClassAttendances: attendanceActions.fetchClassAttendances,
};

export class GradingDetail extends Component {
  constructor(props) {
    super(props);
    this.setShowPromotionReviewDialog = this.setShowPromotionReviewDialog.bind(
      this,
    );
    let className = 'All Programs';
    let beltName = 'All Belts';
    let loadingMemberGrading = true;
    let isDirty = false;
    let programsGroup = [];
    this.state = {
      className,
      beltName,
      loadingMemberGrading,
      isDirty,
      programsGroup,
      showPromotionReviewDialog: false,
      classAttendances: undefined,
      classSchedule: undefined,
    };
  }
  setIsDirty = dirty => {
    this.setState({ isDirty: dirty });
  };
  handleProgramChange(e) {
    this.setState({
      className: e.target.value,
      beltName: $('#belt').val(),
    });
  }
  handleBeltChange(e) {
    this.setState({ beltName: e.target.value });
  }
  setShowPromotionReviewDialog(show) {
    this.setState({
      showPromotionReviewDialog: show,
    });
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.classSchedules.size > 0 &&
      this.state.classSchedule === undefined
    ) {
      let schedules = nextProps.classSchedules.filter(
        schedule => moment(schedule.start).day() === moment().day(),
      );
      console.log(schedules);
      let latest = undefined;
      schedules.forEach(schedule => {
        if (latest === undefined && moment(schedule.start).isBefore(moment())) {
          latest = schedule;
        } else if (
          latest !== undefined &&
          moment(schedule.start).isAfter(moment(latest.start)) &&
          moment(schedule.start).isBefore(moment())
        ) {
          latest = schedule;
        }
      });
      this.setState({
        classSchedule: latest,
      });
      if (latest !== undefined) {
        this.props.fetchClassAttendances({
          classDate: latest.start,
          className: latest.program,
        });
      }
    }
    if (
      nextProps.classAttendances.length >= 0 &&
      this.state.classAttendances === undefined
    ) {
      this.setState({
        classAttendances: nextProps.classAttendances,
      });
    }
  }
  render() {
    return (
      <div className="gradingSection">
        <div className="classSection">
          <span className="line">
            <div className="grading">
              <label htmlFor="program">Program</label>
              <select
                name="program"
                id="program"
                ref={input => (this.input = input)}
                defaultValue={this.state.className}
                onChange={e => this.handleProgramChange(e)}
              >
                <option value="All Programs">All Programs</option>
                {this.props.programs.map(program => (
                  <option key={program.program} value={program.program}>
                    {program.program}
                  </option>
                ))}
              </select>
              <div className="droparrow" />
            </div>
            <div className="program">
              <label htmlFor="program">Belt</label>
              <select
                name="belt"
                id="belt"
                ref={input => (this.input = input)}
                defaultValue={this.state.beltName}
                onChange={e => this.handleBeltChange(e)}
              >
                <option value="All Belts">All Belts</option>
                {this.props.belts.map(
                  belt =>
                    belt.program === this.state.className && (
                      <option key={belt.belt} value={belt.belt}>
                        {belt.belt}
                      </option>
                    ),
                )}
              </select>
              <div className="droparrow" />
            </div>
            <div className="checkinFilter">
              <label htmlFor="checkins">Show Latest Checkins</label>
              <div className="checkboxFilter">
                <input
                  id="checkins"
                  type="checkbox"
                  value="1"
                  onChange={e => {
                    if (this.state.classSchedule === undefined) {
                      this.props.fetchClassSchedules();
                    }
                    if (
                      this.state.classSchedule !== undefined &&
                      this.state.classAttendances !== undefined
                    ) {
                      this.setState({
                        classAttendances: undefined,
                      });
                    }
                    if (
                      this.state.classSchedule !== undefined &&
                      this.state.classAttendances === undefined
                    ) {
                      this.props.fetchClassAttendances({
                        classDate: this.state.classSchedule.start,
                        className: this.state.classSchedule.program,
                      });
                    }
                  }}
                />
                <label for="checkins"></label>
              </div>
              {this.props.fetchingClassSchedules ||
              this.props.fetchingClassAttendances ? (
                <div className="loading">Loading Class Attendances....</div>
              ) : (
                <div />
              )}
            </div>
          </span>
        </div>
        <div className="membersGradingSection">
          <div className="memberGrading">
            {this.props.allMembers
              .filter(member => {
                if (this.state.classAttendances !== undefined) {
                  let attendee = this.state.classAttendances.find(
                    att => att.values['Member GUID'] === member.id,
                  );
                  return attendee !== undefined ? true : false;
                }
                return (
                  member.values['Status'] !== 'Inactive' &&
                  member.values['Status'] !== 'Frozen'
                );
              })
              .sort(function(a, b) {
                if (a.programOrder < b.programOrder) {
                  return -1;
                }
                if (a.programOrder > b.programOrder) {
                  return 1;
                }
                if (a.promotionSort < b.promotionSort) {
                  return -1;
                }
                if (a.promotionSort > b.promotionSort) {
                  return 1;
                }
                if (a.attendancePerc > b.attendancePerc) {
                  return -1;
                }
                if (a.attendancePerc < b.attendancePerc) {
                  return 1;
                }

                return 0;
              })
              .map((member, index) => {
                if (index === 0) {
                  this.state.programsGroup = [];
                }
                if (
                  /*member.values['Last Promotion'] &&*/
                  (this.state.className === 'All Programs' ||
                    this.state.className ===
                      member.values['Ranking Program']) &&
                  (this.state.beltName === 'All Belts' ||
                    this.state.beltName === member.values['Ranking Belt'])
                ) {
                  let newProgram = false;
                  if (
                    this.state.programsGroup.indexOf(
                      member.values['Ranking Program'],
                    ) === -1
                  ) {
                    this.state.programsGroup.push(
                      member.values['Ranking Program'],
                    );
                    newProgram = true;
                    console.log(
                      'newProgram:' + member.values['Ranking Program'],
                    );
                  }
                  return (
                    <div key={index}>
                      {newProgram ? (
                        <div className="programName">
                          {member.values['Ranking Program']}
                        </div>
                      ) : (
                        <div />
                      )}
                      <span className="memberRow">
                        <h4 className="memberName">
                          {member.values['First Name']}{' '}
                          {member.values['Last Name']}
                        </h4>
                        <span className="lastPromotion">
                          {member.values['Last Promotion']
                            ? new Date(
                                member.values['Last Promotion'],
                              ).toLocaleDateString()
                            : 'Not Set'}
                        </span>
                        <GradingStatus
                          memberItem={member}
                          belts={this.props.belts}
                          setIsDirty={this.setIsDirty}
                          allMembers={this.props.allMembers}
                        />
                        <span className="statistics">
                          {member.values['Attendance Count']}/
                          {member.attendClasses} CLASSES AND{' '}
                          {member.daysElapsed}/{member.durationPeriod} DAYS
                        </span>
                        <span className="belt">
                          {getBeltSVG(member.values['Ranking Belt'])}
                        </span>
                        <PromotionReviewIcon
                          memberItem={member}
                          belts={this.props.belts}
                          setIsDirty={this.setIsDirty}
                          allMembers={this.props.allMembers}
                        />
                      </span>
                    </div>
                  );
                } else {
                  return <div />;
                }
              })}
          </div>
        </div>
      </div>
    );
  }
}

export const GradingView = ({
  allMembers,
  programs,
  belts,
  fetchingClassSchedules,
  fetchClassSchedules,
  classSchedules,
  fetchClassAttendances,
  fetchingClassAttendances,
  classAttendances,
}) => (
  <GradingDetail
    allMembers={allMembers}
    programs={programs}
    belts={belts}
    fetchingClassSchedules={fetchingClassSchedules}
    fetchClassSchedules={fetchClassSchedules}
    classSchedules={classSchedules}
    fetchClassAttendances={fetchClassAttendances}
    fetchingClassAttendances={fetchingClassAttendances}
    classAttendances={classAttendances}
  />
);

export const GradingContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({}),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
  }),
)(GradingView);

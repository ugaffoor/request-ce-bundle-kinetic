import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';
import { connect } from 'react-redux';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import moment from 'moment';
import { compose } from 'recompose';
import $ from 'jquery';
import { GradingStatus } from '../attendance/GradingStatus';
import { getBeltSVG } from '../Member/MemberUtils';
import { ReactComponent as Help } from '../../images/help.svg';

const mapStateToProps = state => ({
  attendances: state.member.attendance.memberAttendances,
  attendancesLoading: state.member.attendance.fetchingMemberAttendances,
  profile: state.member.app.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  fetchMemberAttendances: attendanceActions.fetchMemberAttendances,
};

export class WeekAttendances extends Component {
  constructor(props) {
    super(props);
    this.attendances = this.props.attendances;
  }
  render() {
    return (
      <div className="weekAttendances">
        {this.attendances.map(attendance => (
          <div className="attendance">
            <div className="date">
              {moment(attendance.values['Class Date']).format('ddd Do MMM')}{' '}
              {moment(attendance.values['Class Time'], 'HH:mm').format(
                'h:mm A',
              )}
            </div>
            <div className="class">
              {attendance.values['Class'] !== undefined
                ? attendance.values['Class']
                : attendance.values['Ranking Program']}
            </div>
            <div className="status">
              {attendance.values['Attendance Status']}
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export class PromotionReviewDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowPromotionReviewDialog(false);
  };
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.getData = this.getData.bind(this);
    let fromDate =
      this.props.memberItem.values['Last Promotion'] !== ''
        ? moment(this.props.memberItem.values['Last Promotion'], 'YYYY-MM-DD')
        : moment().subtract(1, 'years');
    let toDate = moment();
    this.state = {
      fromDate: fromDate.format('YYYY-MM-DD'),
      toDate: toDate.format('YYYY-MM-DD'),
      data: [],
    };
  }
  getData(attendances, lastPromotionDate) {
    if (!attendances || attendances.size === 0) {
      return [];
    }
    lastPromotionDate =
      lastPromotionDate !== ''
        ? moment(lastPromotionDate, 'YYYY-MM-DD')
        : moment().subtract(1, 'years');
    lastPromotionDate = lastPromotionDate.day(1);
    this.totalClasses = 0;
    this.nogiClasses = 0;

    let attendanceMap = new Map();
    attendances.forEach(attendance => {
      let date = moment(attendance.values['Class Date']);
      let week = date.diff(lastPromotionDate, 'weeks');
      this.totalClasses++;
      if (
        attendance.values['Class'] !== undefined &&
        (attendance.values['Class'].toUpperCase() === 'NO-GI' ||
          attendance.values['Class'].toUpperCase() === 'NOGI')
      )
        this.nogiClasses++;
      let attendances = attendanceMap.get(week);
      if (attendances === undefined) {
        attendances = [];
        attendances[attendances.length] = attendance;
        attendanceMap.set(week, attendances);
      } else {
        attendances[attendances.length] = attendance;
        attendanceMap.set(week, attendances);
      }
    });
    this.classesRequired =
      parseInt(this.props.memberItem.attendClasses) !== 0
        ? parseInt(this.props.memberItem.attendClasses) / 2
        : 0;
    this.weeksAttended = 0;

    let data = [];
    attendanceMap.forEach((value, key, map) => {
      if (value.length >= 2) this.weeksAttended++;

      value = value.sort(function(a, b) {
        return a.values['Class Date'] + a.values['Class Time'] >
          b.values['Class Date'] + b.values['Class Time']
          ? 1
          : b.values['Class Date'] + b.values['Class Time'] >
            a.values['Class Date'] + a.values['Class Time']
            ? -1
            : 0;
      });
      data.push({ week: key, attendances: value });
    });
    data = data.sort(function(a, b) {
      return a['week'] > b['week'] ? 1 : b['week'] > a['week'] ? -1 : 0;
    });
    return data;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let data = this.getData(
      nextProps.attendances,
      this.props.memberItem.values['Last Promotion'],
    );
    this.setState({
      data: data,
    });
  }
  componentDidMount() {
    this.props.fetchMemberAttendances({
      id: this.props.memberItem.id,
      fromDate: this.state.fromDate,
      toDate: this.state.toDate,
    });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="promotionReviewDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <div className="attendanceTable">
              <span className="memberRow">
                <h4 className="memberName">
                  {this.props.memberItem.values['First Name']}{' '}
                  {this.props.memberItem.values['Last Name']}
                </h4>
                <span className="lastPromotion" title="Last Promotion Date">
                  {moment(
                    this.props.memberItem.values['Last Promotion'],
                    'YYYY-MM-DD',
                  ).format('L')}
                </span>
                <GradingStatus
                  memberItem={this.props.memberItem}
                  belts={this.props.belts}
                  setIsDirty={this.props.setIsDirty}
                  allMembers={this.props.allMembers}
                />
                <span className="statistics">
                  {this.props.memberItem.values['Attendance Count']}/
                  {this.props.memberItem.attendClasses} CLASSES AND{' '}
                  {this.props.memberItem.daysElapsed}/
                  {this.props.memberItem.durationPeriod} DAYS
                </span>
                <span className="belt">
                  {getBeltSVG(this.props.memberItem.values['Ranking Belt'])}
                </span>
                <span className="noGI">
                  <span>
                    No-Gi Classes:{' '}
                    {this.nogiClasses !== 0
                      ? ((this.nogiClasses / this.totalClasses) * 100).toFixed(
                          2,
                        ) + '%'
                      : '0%'}
                  </span>
                  <Help
                    className="icon help icon-svg"
                    onClick={e => {
                      $('.noGIHelp').toggle('slow');
                    }}
                  />
                </span>
                <span className="noGIHelp">
                  <p>
                    A mandatory minimum attendance of twice per week, being at
                    least half Gi classes, is also required.
                  </p>
                </span>
                <span className="minimumWeeks">
                  <span>
                    Minimum Weeks Required:{' '}
                    {this.classesRequired !== 0 ? this.classesRequired : '0'}
                  </span>
                  <Help
                    className="icon help icon-svg"
                    onClick={e => {
                      $('.minimumWeeksHelp').toggle('slow');
                    }}
                  />
                </span>
                <span className="minimumWeeksHelp">
                  <p>
                    Rules for grading (1) the student must train at least 2x per
                    week (2) if the student doesn't train 7 days or more, this
                    period of time doesn't count towards the next promotion.
                  </p>
                </span>
                <span className="weeksAttended">
                  Weeks Attended:{' '}
                  {this.classesRequired !== 0 && this.weeksAttended !== 0
                    ? (
                        (this.weeksAttended / this.classesRequired) *
                        100
                      ).toFixed(2) + '%'
                    : '0%'}
                </span>
              </span>
              <div className="body">
                {this.props.attendancesLoading ? (
                  <div>
                    <ReactSpinner />
                  </div>
                ) : (
                  <div className="weekSection">
                    {this.state.data.map((weekAttendances, idx) => {
                      return (
                        <div className="weekInfo">
                          <div className="week">
                            Week {weekAttendances['week']}
                          </div>
                          <WeekAttendances
                            attendances={weekAttendances.attendances}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
);
const inlineStyle = {
  width: '700px',
  top: '30%',
  left: '20%',
};

export const PromotionReviewDialogContainer = enhance(PromotionReviewDialog);

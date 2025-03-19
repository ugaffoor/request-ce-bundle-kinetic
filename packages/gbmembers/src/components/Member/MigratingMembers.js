import React, { Component } from 'react';
import { compose, withState, lifecycle } from 'recompose';
import $ from 'jquery';
import { connect } from 'react-redux';
import { GradingStatus } from '../attendance/GradingStatus';
import { PromotionReviewIcon } from '../attendance/PromotionReviewIcon';
import { withHandlers } from 'recompose';
import { getProgramSVG, getBeltSVG } from '../Member/MemberUtils';
import { actions as classActions } from '../../redux/modules/classes';
import moment from 'moment';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as appActions } from '../../redux/modules/memberApp';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  classSchedules: state.member.classes.classSchedules,
  fetchingClassSchedules: state.member.classes.fetchingClassSchedules,
  fetchingClassAttendances: state.member.attendance.fetchingClassAttendances,
  classAttendances: state.member.attendance.classAttendances,
  profile: state.member.app.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  fetchClassSchedules: classActions.fetchClassSchedules,
  fetchClassAttendances: attendanceActions.fetchClassAttendances,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

export class MigrationDetail extends Component {
  constructor(props) {
    super(props);
    this.state = {
      status: undefined,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  render() {
    return (
      <div className="migrationSection">
        <div className="classSection">
          <span className="line">
            <div className="grading">
              <label htmlFor="program">Status</label>
              <select
                name="status"
                id="status"
                ref={input => (this.input = input)}
                onChange={e => {
                  this.setState({
                    status: e.target.value,
                  });
                }}
              >
                <option value="All">All</option>
                <option value="Not Started">Not Started</option>
                <option value="Migration Form Sent">Migration Form Sent</option>
                <option value="Migrated">Migrated</option>
              </select>
              <div className="droparrow" />
            </div>
          </span>
        </div>
        <div className="membersSection"></div>
      </div>
    );
  }
}

export const MigrationMembers = ({ allMembers }) => (
  <MigrationDetail allMembers={allMembers} />
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

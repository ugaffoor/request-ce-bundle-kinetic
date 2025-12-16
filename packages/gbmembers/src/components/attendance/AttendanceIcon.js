import React, { Component } from 'react';
import { AttendanceDialogContainer } from './AttendanceDialog';
import { ReactComponent as StatsBarIcon } from '../../images/stats-bars.svg';

export class AttendanceIcon extends Component {
  constructor(props) {
    super(props);
    this.setShowAttendanceDialog = this.setShowAttendanceDialog.bind(this);

    this.state = {
      showAttendanceDialog: false,
      member: this.props.memberItem,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  setShowAttendanceDialog(show) {
    this.setState({
      showAttendanceDialog: show,
    });
  }
  render() {
    return (
      <span className="attendanceIcon">
        <span placeholder="View Attendance">
          <StatsBarIcon
            className="icon statsbar icon-svg"
            onClick={e => this.setShowAttendanceDialog(true)}
          />
        </span>
        {this.state.showAttendanceDialog && (
          <AttendanceDialogContainer
            setShowAttendanceDialog={this.setShowAttendanceDialog}
            memberItem={this.state.member}
          />
        )}
      </span>
    );
  }
}

export default AttendanceIcon;

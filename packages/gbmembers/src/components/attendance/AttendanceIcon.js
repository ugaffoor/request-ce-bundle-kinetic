import React, { Component } from 'react';
import moment from 'moment';
import { AttendanceDialogContainer } from './AttendanceDialog';
import statsBarIcon from '../../images/stats-bars.svg?raw';
import SVGInline from 'react-svg-inline';
import { actions as attendanceActions } from '../../redux/modules/attendance';

export class AttendanceIcon extends Component {
  constructor(props) {
    super(props);
    this.setShowAttendanceDialog = this.setShowAttendanceDialog.bind(this);

    this.state = {
      showAttendanceDialog: false,
      member: this.props.memberItem,
    };
  }
  componentWillReceiveProps(nextProps) {}
  componentWillMount() {}
  setShowAttendanceDialog(show) {
    this.setState({
      showAttendanceDialog: show,
    });
  }
  render() {
    return (
      <span className="attendanceIcon">
        <span placeholder="View Attendance">
          <SVGInline
            svg={statsBarIcon}
            className="icon statsbar"
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

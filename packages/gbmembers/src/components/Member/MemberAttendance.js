import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import ReactTable from 'react-table';
import { email_received_date_format } from '../leads/LeadsUtils';
import moment from 'moment';
import { actions as attendanceActions } from '../../redux/modules/attendance';

const mapStateToProps = state => ({
  attendances: state.member.attendance.memberAttendances,
  attendancesLoading: state.member.attendance.fetchingMemberAttendances,
});

const mapDispatchToProps = {
  fetchMemberAttendances: attendanceActions.fetchMemberAttendances,
};

export class MemberAttendance extends Component {
  constructor(props) {
    super(props);
    const attendances = this.getData(this.props.attendances);
    this._columns = this.getColumns();

    this.state = {
      attendances,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (this.props.id !== nextProps.id) {
      this.props.fetchMemberAttendances({
        id: nextProps.id,
        fromDate: moment()
          .subtract(90, 'days')
          .format('YYYY-MM-DD'),
        toDate: moment().format('YYYY-MM-DD'),
      });
    }
    this.setState({
      attendances: this.getData(nextProps.attendances),
    });
  }

  UNSAFE_componentWillMount() {
    this.props.fetchMemberAttendances({
      id: this.props.id,
      fromDate: moment()
        .subtract(90, 'days')
        .format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
    });
  }

  getColumns() {
    return [
      {
        accessor: 'Date',
        Header: 'Date',
        Cell: props =>
          moment(props.original.values['Class Date']).format('DD/MM/YYYY'),
      },
      {
        accessor: 'Time',
        Header: 'Time',
        Cell: props => props.original.values['Class Time'],
      },
      {
        accessor: 'Class',
        Header: 'Class',
        Cell: props => props.original.values['Class'],
      },
      {
        accessor: 'Attendance',
        Header: 'Attendance',
        Cell: props => props.original.values['Attendance Status'],
      },
      {
        accessor: 'Program',
        Header: 'Program',
        Cell: props => props.original.values['Ranking Program'],
      },
      {
        accessor: 'Belt',
        Header: 'Belt',
        Cell: props => props.original.values['Ranking Belt'],
      },
    ];
  }

  getData(attendances) {
    if (!attendances || attendances.size === 0) {
      return [];
    }

    return attendances.sort(function(attendance1, attendance2) {
      if (
        moment(attendance1['Class Date'], email_received_date_format).isAfter(
          moment(attendance2['Class Date'], email_received_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(attendance1['Class Date'], email_received_date_format).isBefore(
          moment(attendance2['Class Date'], email_received_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-12">
          <span style={{ width: '100%' }}>
            <h3>Attendance</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.attendances}
              defaultPageSize={
                this.state.attendances.length > 0
                  ? this.state.attendances.length
                  : 2
              }
              pageSize={
                this.state.attendances.length > 0
                  ? this.state.attendances.length
                  : 2
              }
              showPagination={false}
              width={500}
            />
          </span>
        </div>
      </div>
    );
  }
}
const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const MemberAttendanceContainer = enhance(MemberAttendance);

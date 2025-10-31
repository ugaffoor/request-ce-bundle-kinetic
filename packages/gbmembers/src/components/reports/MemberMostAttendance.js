import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { getLocalePreference } from '../Member/MemberUtils';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

var compThis = undefined;

export class MemberMostAttendance extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    let columns = this.getColumns();

    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();
    let period = 'weekly';
    let dateRange = 'last_30_days';
    const data = this.getData(
      new Map(),
      period,
      dateRange,
      this.props.allMembers,
      'GB1',
    );

    this.tableComponentRef = React.createRef();

    this.state = {
      fromDate: fromDate.format('YYYY-MM-DD'),
      toDate: toDate.format('YYYY-MM-DD'),
      program: 'GB1',
      data,
      period,
      dateRange,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.attendancesByDate) {
      const data = this.getData(
        nextProps.attendancesByDate,
        this.state.period,
        this.state.dateRange,
        this.props.allMembers,
        this.state.program,
      );
      this.setState({
        data,
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchAttendancesByDate({
      fromDate: this.state.fromDate,
      toDate: this.state.toDate,
    });
  }

  getData(attendances, periodParam, dateRange, allMembers, program) {
    if (!attendances || attendances.size === 0) {
      return [];
    }

    let attendanceMap = new Map();
    attendances.forEach(attendance => {
      let member = attendanceMap.get(
        attendance.values['Member GUID'] +
          '###' +
          attendance.values['Ranking Program'],
      );
      if (member === undefined) {
        attendanceMap.set(
          attendance.values['Member GUID'] +
            '###' +
            attendance.values['Ranking Program'],
          { count: 1 },
        );
      } else {
        member.count = member.count + 1;
      }
    });

    let programMembers = [];
    attendanceMap.forEach((value, key, map) => {
      var id = key.split('###')[0];

      let mIdx = allMembers.findIndex(member => member.id === id);
      if (
        mIdx !== -1 &&
        (allMembers[mIdx].values['Status'] === 'Active' ||
          allMembers[mIdx].values['Status'] === 'Pending Freeze' ||
          allMembers[mIdx].values['Status'] === 'Pending Cancellation') &&
        (allMembers[mIdx].values['Ranking Program'] === program ||
          program === 'All')
      ) {
        programMembers.push({ member: allMembers[mIdx], count: value.count });
      }
    });

    var data = [];
    programMembers
      .sort((a, b) => (a.count < b.count ? 1 : b.count < a.count ? -1 : 0))
      .forEach(value => {
        data.push({
          program: value.member.values['Ranking Program'],
          id: value.member.id,
          name:
            value.member.values['First Name'] +
            ' ' +
            value.member.values['Last Name'],
          count: value.count,
        });
      });

    return data;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'program',
        Header: 'Program',
        width: 300,
      },
      {
        accessor: 'name',
        Header: 'Member',
        width: 300,
        Cell: props => {
          return props.original.name === undefined ? (
            <div />
          ) : (
            <NavLink to={`/Member/${props.original.id}`} className="">
              {props.original.name}
            </NavLink>
          );
        },
      },
      {
        accessor: 'count',
        Header: 'Count',
      },
    ];
    return columns;
  }
  handleDateChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      let fromDate, toDate;
      if (event.target.value === 'last_30_days') {
        fromDate = moment().subtract('30', 'days');
        toDate = moment();
      } else if (event.target.value === 'last_month') {
        fromDate = moment()
          .subtract(1, 'months')
          .startOf('month');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month');
      } else if (event.target.value === 'last_3_months') {
        fromDate = moment()
          .subtract(3, 'months')
          .startOf('month');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month');
      } else if (event.target.value === 'last_6_months') {
        fromDate = moment()
          .subtract(6, 'months')
          .startOf('month');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month');
      } else if (event.target.value === 'last_year') {
        fromDate = moment()
          .subtract(1, 'years')
          .startOf('month');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month');
      }
      this.setState({
        dateRange: event.target.value,
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
      });
      this.props.fetchAttendancesByDate({
        fromDate: fromDate.format('YYYY-MM-DD'),
        toDate: toDate.format('YYYY-MM-DD'),
      });
    }
  }

  applyCustomDates(fromDate, toDate) {
    fromDate = moment(fromDate).format('YYYY-MM-DD');
    toDate = moment(toDate).format('YYYY-MM-DD');
    this.setState({
      fromDate: fromDate,
      toDate: toDate,
    });
    this.props.fetchAttendancesByDate({
      fromDate: fromDate,
      toDate: toDate,
    });
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Member Most Attendances</h6>
        </div>
        <div className="filters">
          <div className="dateRange">
            <div
              className={
                this.state.dateRange !== 'custom' ? 'custom' : 'selection'
              }
            >
              <div className="">
                <label htmlFor="dateRange" className="control-label">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  id="dateRange"
                  className="form-control input-sm"
                  value={this.state.dateRange}
                  onChange={e => this.handleDateChange(e)}
                >
                  <option value="last_30_days">
                    Last 30 Days:{' '}
                    {moment()
                      .subtract('30', 'days')
                      .format('MMM D, YYYY')}{' '}
                    - {moment().format('MMM D, YYYY')}
                  </option>
                  <option value="last_month">
                    Last Month:{' '}
                    {moment()
                      .subtract(1, 'months')
                      .startOf('month')
                      .format('MMM D, YYYY')}{' '}
                    -{' '}
                    {moment()
                      .subtract(1, 'months')
                      .endOf('month')
                      .format('MMM D, YYYY')}
                  </option>
                  <option value="last_3_months">
                    Last 3 Months:{' '}
                    {moment()
                      .subtract(3, 'months')
                      .startOf('month')
                      .format('MMM D, YYYY')}{' '}
                    -{' '}
                    {moment()
                      .subtract(1, 'months')
                      .endOf('month')
                      .format('MMM D, YYYY')}
                  </option>
                  <option value="last_6_months">
                    Last 6 Months:{' '}
                    {moment()
                      .subtract(6, 'months')
                      .startOf('month')
                      .format('MMM D, YYYY')}{' '}
                    -{' '}
                    {moment()
                      .subtract(1, 'months')
                      .endOf('month')
                      .format('MMM D, YYYY')}
                  </option>
                  <option value="last_year">
                    Last Year:{' '}
                    {moment()
                      .subtract(1, 'years')
                      .startOf('month')
                      .format('MMM D, YYYY')}{' '}
                    -{' '}
                    {moment()
                      .subtract(1, 'years')
                      .endOf('month')
                      .format('MMM D, YYYY')}
                  </option>
                  <option value="custom">Custom</option>
                </select>
                <div className="droparrow" />
              </div>
            </div>
            {this.state.dateRange === 'custom' && (
              <div className="customDates">
                <div className="form-group">
                  <label htmlFor="fromDate" className="control-label">
                    From Date
                  </label>
                  <DayPickerInput
                    name="fromDate"
                    id="fromDate"
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
                    value={moment(this.state.fromDate, 'YYYY-MM-DD').toDate()}
                    onDayChange={function(
                      selectedDay,
                      modifiers,
                      dayPickerInput,
                    ) {
                      compThis.setState({
                        fromDate: moment(selectedDay).format('YYYY-MM-DD'),
                      });
                    }}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="toDate" className="control-label">
                    To Date
                  </label>
                  <DayPickerInput
                    name="toDate"
                    id="toDate"
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
                    value={moment(this.state.toDate, 'YYYY-MM-DD').toDate()}
                    onDayChange={function(
                      selectedDay,
                      modifiers,
                      dayPickerInput,
                    ) {
                      compThis.setState({
                        toDate: moment(selectedDay).format('YYYY-MM-DD'),
                      });
                    }}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                <button
                  className="btn btn-primary customButton"
                  onClick={e =>
                    this.applyCustomDates(
                      this.state.fromDate,
                      this.state.toDate,
                    )
                  }
                >
                  Go
                </button>
              </div>
            )}
          </div>
          <div className="programs">
            <label htmlFor="program">Program</label>
            <select
              name="program"
              id="program"
              value={this.state.program}
              onChange={e => {
                const data = this.getData(
                  this.props.attendancesByDate,
                  this.state.period,
                  this.state.dateRange,
                  this.props.allMembers,
                  e.target.value,
                );
                this.setState({
                  data,
                  program: e.target.value,
                });
              }}
            >
              <option value="" />
              <option value="All">All</option>
              {this.props.programs.map(program => (
                <option key={program.program} value={program.program}>
                  {program.program}
                </option>
              ))}
            </select>
            <div className="droparrow" />
          </div>
        </div>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg tablePrint" />}
          content={() => this.tableComponentRef.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
        />
        {this.props.fetchingAttendancesByDate ? (
          <div>Loading...</div>
        ) : (
          <ReactTable
            ref={this.tableComponentRef}
            columns={columns}
            data={data}
            className="-striped -highlight"
            defaultPageSize={data.length > 0 ? data.length : 2}
            pageSize={data.length > 0 ? data.length : 2}
            showPagination={false}
          />
        )}
        <br />
      </span>
    );
  }
}

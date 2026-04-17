import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers } from 'recompose';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import ReactSpinner from 'react16-spinjs';
import ReactTable from 'react-table';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { ReactComponent as CrossIcon } from '../../images/cross.svg';
import { KappNavLink as NavLink } from 'common';
import Select from 'react-select';

var myThis;

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
  attendancesByDate: state.member.attendance.attendancesByDate,
  fetchingAttendancesByDate: state.member.attendance.fetchingAttendancesByDate,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
});
const mapDispatchToProps = {
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchAttendancesByDate: attendanceActions.fetchAttendancesByDate,
};

export class Statistics extends Component {
  constructor(props) {
    super(props);
    myThis = this;
    this.state = {
      dateRange: 'last_30_days',
      fromDate: moment()
        .subtract(30, 'days')
        .format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
      // chart data: [{date, total, classes: [{key, time, program, title, records}]}]
      chartData: [],
      // drill-down: classes for the selected day
      selectedPrograms: [],
      selectedTimes: [],
      selectedTitles: [],
      selectedDay: null,
      // drill-down: members for the selected class
      selectedClass: null,
      panelFilter: '',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.attendancesByDate !== this.props.attendancesByDate) {
      this.setState({ chartData: this.getData(nextProps.attendancesByDate) });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchAttendancesByDate({
      fromDate: moment().subtract(30, 'days'),
      toDate: moment(),
    });
  }

  getData(attendances) {
    if (!attendances || attendances.size <= 0) return [];

    const dayMap = new Map();

    attendances.forEach(attendance => {
      const date = attendance.values['Class Date'] || '';
      const time = attendance.values['Class Time'] || '';
      const program = attendance.values['Ranking Program'] || '';
      const title = attendance.values['Title'] || '';
      const classKey = `${time}|${title}`;

      if (!dayMap.has(date)) {
        dayMap.set(date, { date, total: 0, classMap: new Map() });
      }
      const day = dayMap.get(date);
      day.total += 1;

      if (!day.classMap.has(classKey)) {
        day.classMap.set(classKey, { time, program, title, records: [] });
      }
      day.classMap.get(classKey).records.push(attendance);
    });

    return Array.from(dayMap.values())
      .sort((a, b) => moment(a.date).diff(moment(b.date)))
      .map(day => ({
        date: day.date,
        total: day.total,
        classes: Array.from(day.classMap.values()).sort((a, b) =>
          (a.time || '').localeCompare(b.time || ''),
        ),
      }));
  }

  handleDateChange(event) {
    this.setState({ [event.target.name]: event.target.value });
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      let fromDate, toDate;
      if (event.target.value === 'last_30_days') {
        fromDate = moment().subtract(30, 'days');
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
        selectedDay: null,
        selectedClass: null,
      });
      this.props.fetchAttendancesByDate({ fromDate, toDate });
    }
  }

  applyCustomDates(fromDate, toDate) {
    const from = moment(fromDate, 'YYYY-MM-DD');
    const to = moment(toDate, 'YYYY-MM-DD');
    this.setState({
      fromDate: from.format('YYYY-MM-DD'),
      toDate: to.format('YYYY-MM-DD'),
      selectedDay: null,
      selectedClass: null,
    });
    this.props.fetchAttendancesByDate({ fromDate: from, toDate: to });
  }

  formatTime(time) {
    if (!time) return '—';
    const parsed = moment(time, ['HH:mm', 'H:mm'], true);
    return parsed.isValid() ? parsed.format('h:mm A') : time;
  }

  resolveMember(memberGUID) {
    const members = this.props.members || [];
    const m = members.find(mem => mem.id === memberGUID);
    if (m) {
      return {
        id: m.id,
        name:
          (m.values['First Name'] || '') + ' ' + (m.values['Last Name'] || ''),
        link: `/Member/${m.id}`,
        program: m.values['Ranking Program'] || '',
        belt: m.values['Ranking Belt'] || '',
      };
    }
    return {
      id: memberGUID,
      name: memberGUID,
      link: null,
      program: '',
      belt: '',
    };
  }

  renderClassTable() {
    const { selectedDay } = this.state;
    if (!selectedDay) return null;

    return (
      <div className="memberChartDetails" style={{ marginTop: '16px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: '8px',
            marginTop: '12px',
            gap: '16px',
          }}
        >
          <strong style={{ flex: 1 }}>
            {moment(selectedDay.date).format('dddd D MMM YYYY')}
          </strong>
          <span
            className="closeMembers btn btn-primary"
            style={{ cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}
            onClick={() =>
              this.setState({ selectedDay: null, selectedClass: null })
            }
          >
            <CrossIcon className="icon icon-svg" /> Close
          </span>
        </div>
        <table className="table table-striped table-hover">
          <thead>
            <tr>
              <th>Time</th>
              <th>Title</th>
              <th>Attendees</th>
            </tr>
          </thead>
          <tbody>
            {selectedDay.classes.map((cls, i) => (
              <tr
                key={i}
                style={{ cursor: 'pointer' }}
                onClick={() =>
                  this.setState({
                    selectedClass: cls,
                    panelFilter: '',
                  })
                }
              >
                <td>{this.formatTime(cls.time)}</td>
                <td>{cls.title || '—'}</td>
                <td>{cls.records.length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  renderMemberPanel() {
    const { selectedClass, panelFilter } = this.state;
    if (!selectedClass) return null;

    const filterLower = panelFilter.toLowerCase();
    const people = selectedClass.records.map(r =>
      this.resolveMember(r.values['Member GUID']),
    );
    const filtered = filterLower
      ? people.filter(p => p.name.toLowerCase().includes(filterLower))
      : people;

    const label =
      this.formatTime(selectedClass.time) +
      ' ' +
      selectedClass.program +
      (selectedClass.title ? ' - ' + selectedClass.title : '');

    return (
      <div className="membersPanel" style={{ marginTop: '16px' }}>
        <div
          className="membersPanelHeader"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#4d5059' }}>
            {label}
          </span>
          <span
            className="closeMembers"
            onClick={() =>
              this.setState({ selectedClass: null, panelFilter: '' })
            }
          >
            <CrossIcon className="icon icon-svg" /> <span>Close</span>
          </span>
        </div>
        <input
          type="text"
          className="form-control memberFilterInput"
          placeholder="Filter by name..."
          value={panelFilter}
          onChange={e => this.setState({ panelFilter: e.target.value })}
          style={{ marginBottom: '8px' }}
        />
        <ReactTable
          columns={[
            {
              accessor: 'name',
              Header: 'Name',
              style: { whiteSpace: 'unset' },
              width: 200,
              Cell: props =>
                props.original.link ? (
                  <NavLink to={props.original.link}>
                    {props.original.name}
                  </NavLink>
                ) : (
                  props.original.name
                ),
            },
            {
              accessor: 'program',
              Header: 'Program',
            },
            {
              accessor: 'belt',
              Header: 'Belt',
            },
          ]}
          data={filtered}
          defaultPageSize={10}
          showPagination={filtered.length > 10}
        />
      </div>
    );
  }

  render() {
    const { selectedPrograms, selectedTimes, selectedTitles } = this.state;
    const programFilter = selectedPrograms.map(p => p.value);
    const timeFilter = selectedTimes.map(t => t.value);
    const titleFilter = selectedTitles.map(t => t.value);

    const allTimes = Array.from(
      new Set(
        this.state.chartData.flatMap(day =>
          day.classes.map(cls => cls.time).filter(Boolean),
        ),
      ),
    ).sort();

    const allTitles = Array.from(
      new Set(
        this.state.chartData.flatMap(day =>
          day.classes.map(cls => cls.title).filter(Boolean),
        ),
      ),
    ).sort();

    const chartData =
      programFilter.length === 0 &&
      timeFilter.length === 0 &&
      titleFilter.length === 0
        ? this.state.chartData
        : this.state.chartData
            .map(day => {
              const filteredClasses = day.classes
                .map(cls => {
                  const filteredRecords = cls.records.filter(
                    r =>
                      (programFilter.length === 0 ||
                        programFilter.includes(
                          r.values['Ranking Program'] || '',
                        )) &&
                      (timeFilter.length === 0 ||
                        timeFilter.includes(cls.time)) &&
                      (titleFilter.length === 0 ||
                        titleFilter.includes(cls.title)),
                  );
                  return { ...cls, records: filteredRecords };
                })
                .filter(cls => cls.records.length > 0);
              const total = filteredClasses.reduce(
                (sum, cls) => sum + cls.records.length,
                0,
              );
              return { ...day, classes: filteredClasses, total };
            })
            .filter(day => day.total > 0);

    return (
      <div className="statistics">
        <div className="header">
          <h6>Attendance Statistics</h6>
        </div>
        <span className="details">
          <div className="filters">
            <div className="dateRange">
              <div
                className={
                  this.state.dateRange !== 'custom' ? 'custom' : 'selection'
                }
              >
                <div>
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
                        .subtract(30, 'days')
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
                        .subtract(1, 'months')
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
                    <label htmlFor="statFromDate" className="control-label">
                      From Date
                    </label>
                    <DayPickerInput
                      name="statFromDate"
                      id="statFromDate"
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
                      onDayChange={function(selectedDay) {
                        myThis.setState({
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
                    <label htmlFor="statToDate" className="control-label">
                      To Date
                    </label>
                    <DayPickerInput
                      name="statToDate"
                      id="statToDate"
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
                      onDayChange={function(selectedDay) {
                        myThis.setState({
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
                    onClick={() =>
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
          </div>

          <div style={{ marginTop: '10px', maxWidth: '480px' }}>
            <label className="control-label">Filter by Program</label>
            <Select
              isMulti
              options={[
                ...(this.props.programs || []).map(p => ({
                  value: p.program,
                  label: p.program,
                })),
                ...(this.props.additionalPrograms || []).map(p => ({
                  value: p.program,
                  label: p.program,
                })),
              ]}
              value={this.state.selectedPrograms}
              onChange={selected =>
                this.setState({
                  selectedPrograms: selected || [],
                  selectedDay: null,
                  selectedClass: null,
                })
              }
              placeholder="All programs..."
            />
          </div>

          <div style={{ marginTop: '10px', maxWidth: '480px' }}>
            <label className="control-label">Filter by Title</label>
            <Select
              isMulti
              options={allTitles.map(t => ({ value: t, label: t }))}
              value={this.state.selectedTitles}
              onChange={selected =>
                this.setState({
                  selectedTitles: selected || [],
                  selectedDay: null,
                  selectedClass: null,
                })
              }
              placeholder="All titles..."
            />
          </div>

          <div style={{ marginTop: '10px', maxWidth: '480px' }}>
            <label className="control-label">Filter by Start Time</label>
            <Select
              isMulti
              options={allTimes.map(t => ({
                value: t,
                label: this.formatTime(t),
              }))}
              value={this.state.selectedTimes}
              onChange={selected =>
                this.setState({
                  selectedTimes: selected || [],
                  selectedDay: null,
                  selectedClass: null,
                })
              }
              placeholder="All times..."
            />
          </div>

          {this.props.fetchingAttendancesByDate ? (
            <div style={{ margin: '10px' }}>
              <p>Loading attendance statistics...</p>
              <ReactSpinner />
            </div>
          ) : chartData.length === 0 ? (
            <p style={{ marginTop: '16px' }}>
              No attendances found for this period.
            </p>
          ) : (
            <div
              className="attendancesByDate"
              style={{ marginTop: '16px', overflowX: 'auto' }}
            >
              <BarChart
                width={Math.max(600, chartData.length * 50)}
                height={300}
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={date => moment(date).format('ddd D MMM')}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis allowDecimals={false} />
                <Tooltip
                  labelFormatter={label =>
                    moment(label).format('dddd D MMM YYYY')
                  }
                  formatter={value => [value, 'Attendees']}
                />
                <Bar
                  dataKey="total"
                  name="Total Attendees"
                  fill="#0070c0"
                  style={{ cursor: 'pointer' }}
                  onClick={data =>
                    this.setState({
                      selectedDay: data,
                      selectedClass: null,
                      panelFilter: '',
                    })
                  }
                />
              </BarChart>
              <p
                style={{ fontSize: '12px', color: '#888', textAlign: 'center' }}
              >
                Click a bar to see classes for that day
              </p>
            </div>
          )}

          {chartData.length > 0 &&
            !this.props.fetchingAttendancesByDate &&
            (() => {
              const highest = chartData.reduce(
                (a, b) => (b.total > a.total ? b : a),
              );
              const lowest = chartData.reduce(
                (a, b) => (b.total < a.total ? b : a),
              );
              const average = (
                chartData.reduce((sum, d) => sum + d.total, 0) /
                chartData.length
              ).toFixed(1);
              return (
                <div
                  style={{
                    display: 'flex',
                    gap: '32px',
                    marginTop: '12px',
                    marginBottom: '4px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600 }}>Average: </span>
                    <span>{average}</span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Highest: </span>
                    <span>
                      {highest.total} —{' '}
                      {moment(highest.date).format('ddd D MMM YYYY')}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontWeight: 600 }}>Lowest: </span>
                    <span>
                      {lowest.total} —{' '}
                      {moment(lowest.date).format('ddd D MMM YYYY')}
                    </span>
                  </div>
                </div>
              );
            })()}

          <div
            style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}
          >
            <div style={{ flex: '0 0 auto' }}>{this.renderClassTable()}</div>
            <div style={{ flex: '1 1 auto' }}>{this.renderMemberPanel()}</div>
          </div>
        </span>
      </div>
    );
  }
}

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillMount() {},
  }),
);
export const StatisticsContainer = enhance(Statistics);

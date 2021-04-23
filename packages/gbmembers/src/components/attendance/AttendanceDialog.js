import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';
import { connect } from 'react-redux';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import moment from 'moment';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { compose } from 'recompose';
import $ from 'jquery';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';

const mapStateToProps = state => ({
  attendances: state.member.attendance.memberAttendances,
  attendancesLoading: state.member.attendance.fetchingMemberAttendances,
  profile: state.member.app.profile,
});
const mapDispatchToProps = {
  fetchMemberAttendances: attendanceActions.fetchMemberAttendances,
};
var compThis = undefined;

export class AttendanceDialog extends Component {
  handleClick = () => {
    //    this.setState({ isShowingModal: false });
    //    this.props.setShowAttendanceDialog(false);
  };
  handleClose = () => {
    //    this.setState({ isShowingModal: false });
    this.props.setShowAttendanceDialog(false);
  };
  constructor(props) {
    super(props);
    compThis = this;

    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();
    let period = 'weekly';
    let dateRange = 'last_30_days';
    const data = this.getData(this.props.attendances, period, dateRange);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);
    this.xAxisTickFormatter = this.xAxisTickFormatter.bind(this);
    this.toolTipLabelFormatter = this.toolTipLabelFormatter.bind(this);
    let average = 0;
    this.state = {
      fromDate: fromDate.format('YYYY-MM-DD'),
      toDate: toDate.format('YYYY-MM-DD'),
      data,
      average,
      period,
      dateRange,
    };
  }
  componentWillReceiveProps(nextProps) {
    let data = this.getData(
      nextProps.attendances,
      this.state.period,
      this.state.dateRange,
    );
    let average = this.getAverage(data);
    this.setState({
      data: data,
      average: average,
    });
  }
  componentWillMount() {
    this.props.fetchMemberAttendances({
      id: this.props.memberItem.id,
      fromDate: this.state.fromDate,
      toDate: this.state.toDate,
    });
  }
  setPeriod(period) {
    console.log('setPeriod:' + period);
    let data = this.getData(
      this.props.attendances,
      period,
      this.state.dateRange,
    );
    this.setState({
      period: period,
      data: data,
    });
  }
  getAverage(data) {
    let total = 0;
    data.forEach((value, key) => {
      total += value['Count'];
    });
    return total !== 0 ? (total / data.length).toFixed(2) : 0;
  }

  getData(attendances, periodParam, dateRange) {
    if (!attendances || attendances.size === 0) {
      return [];
    }

    let attendanceMap = new Map();
    attendances.forEach(attendance => {
      let date = moment(attendance.values['Class Date']);
      let period = date.year() + '-' + date.week();
      if (periodParam === 'daily')
        period = date.year() + '-' + date.dayOfYear();
      if (periodParam === 'monthly') period = date.year() + '-' + date.month();
      if (attendanceMap.get(period) === undefined) {
        attendanceMap.set(period, 1);
      } else {
        let count = attendanceMap.get(period);
        attendanceMap.set(period, count + 1);
      }
    });

    let data = [];
    attendanceMap.forEach((value, key, map) => {
      data.push({ Period: key, Count: value });
    });
    data = data.sort(function(a, b) {
      return a['Period'] > b['Period'] ? 1 : b['Period'] > a['Period'] ? -1 : 0;
    });
    return data;
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          ></svg>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(count) {
    return count;
  }

  xAxisTickFormatter(period) {
    let vals = period.split('-');
    let dt = moment().year(vals[0]);
    if (this.state.period === 'daily') {
      let day = dt.dayOfYear(vals[1]);
      return day.format('D MMM');
    } else if (this.state.period === 'weekly') {
      let sunday = dt.day('Sunday').week(vals[1]);
      dt = moment().year(vals[0]);
      let saturday = dt.day('Saturday').week(vals[1]);

      return sunday.format('D MMM') + '-' + saturday.format('D MMM');
    } else {
      let month = dt.month(vals[1]);
      return month.format('MMMM');
    }
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(period) {
    let vals = period.split('-');
    let dt = moment().year(vals[0]);
    if (this.state.period === 'daily') {
      let day = dt.dayOfYear(vals[1]);
      return day.format('D MMM');
    } else if (this.state.period === 'weekly') {
      let sunday = dt.day('Sunday').week(vals[1]);
      dt = moment().year(vals[0]);
      let saturday = dt.day('Saturday').week(vals[1]);

      return sunday.format('D MMM') + '-' + saturday.format('D MMM');
    } else {
      let month = dt.month(vals[1]);
      return month.format('MMMM');
    }
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
      this.props.fetchMemberAttendances({
        id: this.props.memberItem.id,
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
    this.props.fetchMemberAttendances({
      id: this.props.memberItem.id,
      fromDate: fromDate,
      toDate: toDate,
    });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            className="attendanceDialog"
            onClose={this.handleClose}
            style={inlineStyle}
          >
            <span className="graphs">
              {this.props.attendancesLoading ? (
                <div />
              ) : (
                <span>
                  <div className="page-header">
                    <h6 className="average">
                      Attendance {this.state.average} PER WEEK
                    </h6>
                    <div className="periods">
                      <span
                        onClick={e => this.setPeriod('daily')}
                        className={
                          this.state.period === 'daily' ? 'selected' : ''
                        }
                      >
                        DAILY
                      </span>
                      <span
                        onClick={e => this.setPeriod('weekly')}
                        className={
                          this.state.period === 'weekly' ? 'selected' : ''
                        }
                      >
                        WEEKLY
                      </span>
                      <span
                        onClick={e => this.setPeriod('monthly')}
                        className={
                          this.state.period === 'monthly' ? 'selected' : ''
                        }
                      >
                        MONTHLY
                      </span>
                    </div>
                    <div className="dateRange">
                      <div
                        className={
                          this.state.dateRange !== 'custom'
                            ? 'custom'
                            : 'selection'
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
                              value={moment(
                                this.state.fromDate,
                                'YYYY-MM-DD',
                              ).toDate()}
                              onDayChange={function(
                                selectedDay,
                                modifiers,
                                dayPickerInput,
                              ) {
                                compThis.setState({
                                  fromDate: moment(selectedDay).format(
                                    'YYYY-MM-DD',
                                  ),
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
                              value={moment(
                                this.state.toDate,
                                'YYYY-MM-DD',
                              ).toDate()}
                              onDayChange={function(
                                selectedDay,
                                modifiers,
                                dayPickerInput,
                              ) {
                                compThis.setState({
                                  toDate: moment(selectedDay).format(
                                    'YYYY-MM-DD',
                                  ),
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
                  </div>
                  <ResponsiveContainer minHeight={300}>
                    <LineChart
                      width={600}
                      height={300}
                      data={this.state.data}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="Period"
                        tickFormatter={this.xAxisTickFormatter}
                      />
                      <YAxis tickFormatter={this.yAxisTickFormatter} />
                      <Tooltip
                        labelFormatter={this.toolTipLabelFormatter}
                        formatter={this.toolTipFormatter}
                      />
                      <Legend content={this.renderCusomizedLegend} />
                      <Line
                        type="monotone"
                        strokeWidth={2}
                        dataKey="Count"
                        fill="#8884d8"
                        stackId="a"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </span>
              )}
            </span>
            <div className="attendanceTable">
              <div className="header">
                <table cellSpacing="1">
                  <thead>
                    <tr>
                      <td>DATE</td>
                      <td>TIME</td>
                      <td>CLASS</td>
                      <td>ATTENDANCE</td>
                      <td>BELT</td>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="body">
                {this.props.attendancesLoading ? (
                  <div>
                    <ReactSpinner />
                  </div>
                ) : (
                  <table cellSpacing="1">
                    <tbody>
                      {this.props.attendances
                        .sort(function(attendance1, attendance2) {
                          if (
                            moment(
                              attendance1.values['Class Date'],
                              'YYYY-MM-DD',
                            ).isAfter(
                              moment(
                                attendance2.values['Class Date'],
                                'YYYY-MM-DD',
                              ),
                            )
                          ) {
                            return -1;
                          } else if (
                            moment(
                              attendance1.values['Class Date'],
                              'YYYY-MM-DD',
                            ).isBefore(
                              moment(
                                attendance2.values['Class Date'],
                                'YYYY-MM-DD',
                              ),
                            )
                          ) {
                            return 1;
                          }
                          return 0;
                        })
                        .map((attendance, idx) => (
                          <tr key={idx}>
                            <td className="classDate">
                              {moment(attendance.values['Class Date']).format(
                                'D MMM YYYY',
                              )}
                            </td>
                            <td className="classTime">
                              {moment(
                                attendance.values['Class Date'] +
                                  ' ' +
                                  attendance.values['Class Time'],
                              ).format('h:mm A')}
                            </td>
                            <td className="class">
                              {attendance.values['Class']}
                            </td>
                            <td className="status">
                              {attendance.values['Attendance Status']}
                            </td>
                            <td className="belt">
                              {attendance.values['Ranking Belt']}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
const inlineStyle = {
  width: '800px',
  top: '30%',
  left: '20%',
};

export const AttendanceDialogContainer = enhance(AttendanceDialog);

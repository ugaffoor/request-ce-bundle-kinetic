import React, { Component } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import ReactSpinner from 'react16-spinjs';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import moment from 'moment';

var compThis = undefined;

export class InactiveCustomersChart extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    let data = this.getData(this.props.inactiveCustomersCount);
    this.showChart = this.showChart.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      data,
      dateRange: 'last_30_days',
      fromDate: '',
      toDate: '',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.inactiveCustomersCount) {
      this.setState({
        data: this.getData(nextProps.inactiveCustomersCount),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.getInactiveCustomersCount();
  }

  componentDidUpdate() {}

  getData(inactiveCustomersCount) {
    return inactiveCustomersCount;
  }

  showChart(dateRange, fromDate, toDate) {
    this.props.getInactiveCustomersCount(dateRange, fromDate, toDate);
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      this.showChart(event.target.value, null, null);
    }
  }

  handleSubmit() {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.showChart(
        this.state.dateRange,
        this.state.fromDate,
        this.state.toDate,
      );
    }
  }

  yAxisTickFormatter(memberCount) {
    return memberCount;
  }

  xAxisTickFormatter(date) {
    return date;
  }

  render() {
    const { data } = this.state;
    return this.props.inactiveCustomersLoading ? (
      <div style={{ height: '50vh', width: '50vw' }}>
        <p>Loading Inactive Customers Chart ...</p>
        <ReactSpinner />
      </div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <br />
          <h6>Inactive Customers</h6>
        </div>
        <ResponsiveContainer maxHeight={300}>
          <BarChart
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={this.xAxisTickFormatter} />
            <YAxis tickFormatter={this.yAxisTickFormatter} />
            <Tooltip />
            <Legend />
            <Bar dataKey="suspendedCount" fill="#8884d8" />
            <Bar dataKey="cancelledCount" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
        <div style={{ textAlign: 'center' }}>
          <div className="row" style={{ width: '50%', margin: '0 auto' }}>
            <div
              className={
                this.state.dateRange !== 'custom' ? 'col-md-12' : 'col-md-4'
              }
            >
              <div className="col-xs-2 mr-1">
                <label htmlFor="dateRange" className="control-label">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  id="dateRange"
                  className="form-control input-sm"
                  value={this.state.dateRange}
                  onChange={e => this.handleInputChange(e)}
                >
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="droparrow" />
              </div>
            </div>
            {this.state.dateRange === 'custom' && (
              <div className="col-md-8">
                <div className="row">
                  <div className="form-group col-xs-2 mr-1">
                    <label htmlFor="fromDate" className="control-label">
                      From Date
                    </label>
                    <DayPickerInput
                      name="fromDate"
                      id="fromDate"
                      className="form-control input-sm"
                      disabled={this.props.promotingMember}
                      placeholder={moment(new Date())
                        .localeData()
                        .longDateFormat('L')
                        .toLowerCase()}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      value={this.state.fromDate}
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
                        locale:
                          this.props.profile.preferredLocale == null
                            ? 'en-au'
                            : this.props.profile.preferredLocale.toLowerCase(),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                  <div className="form-group col-xs-2 mr-1">
                    <label htmlFor="toDate" className="control-label">
                      To Date
                    </label>
                    <DayPickerInput
                      name="toDate"
                      id="toDate"
                      className="form-control input-sm"
                      disabled={this.props.promotingMember}
                      placeholder={moment(new Date())
                        .localeData()
                        .longDateFormat('L')
                        .toLowerCase()}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      value={this.state.toDate}
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
                        locale:
                          this.props.profile.preferredLocale == null
                            ? 'en-au'
                            : this.props.profile.preferredLocale.toLowerCase(),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                  <div className="form-group col-xs-2">
                    <label className="control-label">&nbsp;</label>
                    <button
                      className="btn btn-primary form-control input-sm"
                      onClick={e => this.handleSubmit()}
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </span>
    );
  }
}

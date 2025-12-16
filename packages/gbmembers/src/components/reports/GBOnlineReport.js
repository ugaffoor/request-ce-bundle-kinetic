import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { getLocalePreference } from '../Member/MemberUtils';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

var myThis;

export class GBOnlineReport extends Component {
  constructor(props) {
    super(props);

    myThis = this;
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();
    let period = 'weekly';
    let dateRange = 'last_30_days';

    let data = {
      summary: {
        total: 0,
        openRate: 0,
        clickRate: 0,
      },
      emailDetailInfo: [],
      adultsSummary: {
        total: 0,
        opened: 0,
        clicked: 0,
      },
      kidsSummary: {
        total: 0,
        opened: 0,
        clicked: 0,
      },
    };

    this.state = {
      fromDate: fromDate.format('YYYY-MM-DD'),
      toDate: toDate.format('YYYY-MM-DD'),
      data,
      period,
      dateRange,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.emailCampaignsByDateLoading &&
      !nextProps.journeyInfoLoading &&
      !nextProps.emailTemplatesLoading
    ) {
      let data = this.getData(
        nextProps.journeyTriggers,
        nextProps.emailCampaignsByDate,
        nextProps.emailTemplates,
      );

      this.setState({
        data,
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchEmailCampaignsByDate({
      start: moment().subtract(30, 'days'),
      end: moment(),
    });
    this.props.fetchJourneyInfo();
    this.props.fetchEmailTemplates();
  }

  getOpenCount(emailCampaigns) {
    let count = 0;

    emailCampaigns.forEach(email => {
      if (
        email.values['Opened By Members'] !== undefined &&
        email.values['Opened By Members'] !== null
      ) {
        let open = JSON.parse(email.values['Opened By Members']);
        if (open.length > 0) {
          count = count + open.length;
        }
      }
    });

    return count;
  }

  getClickCount(emailCampaigns) {
    let count = 0;

    emailCampaigns.forEach(email => {
      if (
        email.values['Clicked By Members'] !== undefined &&
        email.values['Clicked By Members'] !== null
      ) {
        let clicked = JSON.parse(email.values['Clicked By Members']);
        if (clicked.length > 0) {
          console.log('Clicked Members: ' + email.values['Clicked By Members']);
          count = count + clicked.length;
        }
      }
    });

    return count;
  }
  renameKey(key) {
    if (key.endsWith('Week 1')) {
      return key.replace('Week 1', 'Week 01');
    }
    if (key.endsWith('Week 2')) {
      return key.replace('Week 2', 'Week 02');
    }
    if (key.endsWith('Week 3')) {
      return key.replace('Week 3', 'Week 03');
    }
    if (key.endsWith('Week 4')) {
      return key.replace('Week 4', 'Week 04');
    }
    if (key.endsWith('Week 5')) {
      return key.replace('Week 5', 'Week 05');
    }
    if (key.endsWith('Week 6')) {
      return key.replace('Week 6', 'Week 06');
    }
    if (key.endsWith('Week 7')) {
      return key.replace('Week 7', 'Week 07');
    }
    if (key.endsWith('Week 8')) {
      return key.replace('Week 8', 'Week 08');
    }
    if (key.endsWith('Week 9')) {
      return key.replace('Week 9', 'Week 09');
    }

    return key;
  }

  getData(journeyTriggers, emailCampaigns, emailTemplates) {
    if (journeyTriggers.length === 0 && emailCampaigns.length === 0) {
      return [];
    }
    let onlineJourneyTriggers = [];
    journeyTriggers.forEach(trigger => {
      if (
        trigger.values['Contact Type'] === 'Email' &&
        trigger.values['Template Name'].startsWith('GB Online')
      ) {
        onlineJourneyTriggers = onlineJourneyTriggers.concat(trigger);
      }
    });

    let onlineSubjectsTemplates = [];
    onlineJourneyTriggers.forEach(trigger => {
      let idx = emailTemplates.findIndex(
        email =>
          email.values['Template Name'] === trigger.values['Template Name'],
      );
      if (idx !== -1) {
        onlineSubjectsTemplates = onlineSubjectsTemplates.concat(
          emailTemplates[idx],
        );
      }
    });

    let templateEmailsMap = new Map();
    let onlineEmailCampaigns = [];
    emailCampaigns.submissions.forEach(email => {
      let idx = onlineSubjectsTemplates.findIndex(
        template => template.values['Subject'] === email.values['Subject'],
      );
      if (idx !== -1) {
        onlineEmailCampaigns = onlineEmailCampaigns.concat(email);
        let emails = templateEmailsMap.get(
          onlineSubjectsTemplates[idx].values['Template Name'],
        );
        if (emails === undefined) {
          emails = [];
        }
        emails = emails.concat(email);
        templateEmailsMap.set(
          onlineSubjectsTemplates[idx].values['Template Name'],
          emails,
        );
      }
    });

    let emailDetailInfo = [];
    templateEmailsMap.keys().forEach(key => {
      let emails = templateEmailsMap.get(key);

      let count = emails.length;
      let opened = this.getOpenCount(emails);
      let clicked = this.getClickCount(emails);
      let openRate = ((opened / emails.length) * 100).toFixed(2);
      let clickRate = ((clicked / emails.length) * 100).toFixed(2);

      emailDetailInfo = emailDetailInfo.concat({
        key: key,
        count: count,
        opened: opened,
        clicked: clicked,
        openRate: openRate,
        clickRate: clickRate,
      });
    });

    emailDetailInfo = emailDetailInfo.sort(function(a, b) {
      let aKey = myThis.renameKey(a.key);
      let bKey = myThis.renameKey(b.key);

      if (aKey > bKey) return 1;
      if (aKey < bKey) return -1;
      return 0;
    });

    let adultsSummary = {
      total: 0,
      opened: 0,
      clicked: 0,
    };
    let kidsSummary = {
      total: 0,
      opened: 0,
      clicked: 0,
    };

    emailDetailInfo.forEach(record => {
      if (record.key.includes('Adult')) {
        adultsSummary.total = adultsSummary.total + record.count;
        adultsSummary.opened = adultsSummary.opened + record.opened;
        adultsSummary.clicked = adultsSummary.clicked + record.clicked;
      }
      if (record.key.includes('Kids')) {
        kidsSummary.total = kidsSummary.total + record.count;
        kidsSummary.opened = kidsSummary.opened + record.opened;
        kidsSummary.clicked = kidsSummary.clicked + record.clicked;
      }
    });

    return {
      summary: {
        total: onlineEmailCampaigns.length,
        openRate: (
          (this.getOpenCount(onlineEmailCampaigns) /
            onlineEmailCampaigns.length) *
          100
        ).toFixed(2),
        clickRate: (
          (this.getClickCount(onlineEmailCampaigns) /
            onlineEmailCampaigns.length) *
          100
        ).toFixed(2),
      },
      emailDetailInfo: emailDetailInfo,
      adultsSummary: adultsSummary,
      kidsSummary: kidsSummary,
    };
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
      this.props.fetchEmailCampaignsByDate({
        start: fromDate,
        end: toDate,
      });
    }
  }

  applyCustomDates(fromDate, toDate) {
    fromDate = moment(fromDate, 'YYYY-MM-DD');
    toDate = moment(toDate, 'YYYY-MM-DD');
    this.setState({
      fromDate: fromDate,
      toDate: toDate,
    });
    this.props.fetchEmailCampaignsByDate({
      start: fromDate,
      end: toDate,
    });
  }

  render() {
    const { data, columns } = this.state;
    return this.props.emailCampaignsByDateLoading ||
      this.props.journeyInfoLoading ||
      this.props.emailTemplatesLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading GB Online report ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header gbonlineDetails"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>GB Online Report</h6>
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

          <div>
            <div className="summary">
              <table>
                <thead className="summaryHeader">
                  <th colSpan={4}>Summary</th>
                </thead>
                <thead>
                  <th width="200px">Sent</th>
                  <th width="200px">Open %</th>
                  <th width="200px">Clicked %</th>
                </thead>
                <tbody>
                  <tr>
                    <td>{this.state.data.summary.total}</td>
                    <td>{this.state.data.summary.openRate}</td>
                    <td>{this.state.data.summary.clickRate}</td>
                  </tr>
                </tbody>
              </table>
              <table>
                <thead className="adultsHeader">
                  <th colSpan={6}>Adults Onboarding</th>
                </thead>
                <thead>
                  <th width="200px">Week</th>
                  <th width="200px">Sent</th>
                  <th width="200px">Open #</th>
                  <th width="200px">Open %</th>
                  <th width="200px">Clicked #</th>
                  <th width="200px">Clicked %</th>
                </thead>
                <tbody>
                  {this.state.data.emailDetailInfo
                    .filter(record => record.key.includes('Adult'))
                    .map((record, idx) => (
                      <tr>
                        <td>
                          {
                            record.key.split(' ')[
                              record.key.split(' ').length - 1
                            ]
                          }
                        </td>
                        <td>{record.count}</td>
                        <td>{record.opened}</td>
                        <td>{record.openRate}</td>
                        <td>{record.clicked}</td>
                        <td>{record.clickRate}</td>
                      </tr>
                    ))}
                  <tr className="totals">
                    <td>Totals</td>
                    <td>{this.state.data.adultsSummary.total}</td>
                    <td>{this.state.data.adultsSummary.opened}</td>
                    <td>
                      {(
                        (this.state.data.adultsSummary.opened /
                          this.state.data.adultsSummary.total) *
                        100
                      ).toFixed(2)}
                    </td>
                    <td>{this.state.data.adultsSummary.clicked}</td>
                    <td>
                      {(
                        (this.state.data.adultsSummary.clicked /
                          this.state.data.adultsSummary.total) *
                        100
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <table>
                <thead className="kidsHeader">
                  <th colSpan={6}>Kids Onboarding</th>
                </thead>
                <thead>
                  <th width="200px">Week</th>
                  <th width="200px">Sent</th>
                  <th width="200px">Open #</th>
                  <th width="200px">Open %</th>
                  <th width="200px">Clicked #</th>
                  <th width="200px">Clicked %</th>
                </thead>
                <tbody>
                  {this.state.data.emailDetailInfo
                    .filter(record => record.key.includes('Kids'))
                    .map((record, idx) => (
                      <tr>
                        <td>
                          {
                            record.key.split(' ')[
                              record.key.split(' ').length - 1
                            ]
                          }
                        </td>
                        <td>{record.count}</td>
                        <td>{record.opened}</td>
                        <td>{record.openRate}</td>
                        <td>{record.clicked}</td>
                        <td>{record.clickRate}</td>
                      </tr>
                    ))}
                  <tr className="totals">
                    <td>Totals</td>
                    <td>{this.state.data.kidsSummary.total}</td>
                    <td>{this.state.data.kidsSummary.opened}</td>
                    <td>
                      {(
                        (this.state.data.kidsSummary.opened /
                          this.state.data.kidsSummary.total) *
                        100
                      ).toFixed(2)}
                    </td>
                    <td>{this.state.data.kidsSummary.clicked}</td>
                    <td>
                      {(
                        (this.state.data.kidsSummary.clicked /
                          this.state.data.kidsSummary.total) *
                        100
                      ).toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </span>
    );
  }
}

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers } from 'recompose';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import checkoutLeftArrowIcon from '../../images/checkoutLeftArrow.png?raw';
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

var myThis;

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
  emailCampaignsByDate: state.member.campaigns.allEmailCampaignsByDate,
  emailCampaignsByDateLoading:
    state.member.campaigns.emailCampaignsByDateLoading,
});
const mapDispatchToProps = {
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchEmailCampaignsByDate: campaignActions.fetchEmailCampaignsByDate,
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
      subjectFilter: '',
      selectedCampaign: null,
      selectedField: null,
      panelFilter: '',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    this.props.fetchEmailCampaignsByDate({
      start: moment().subtract(30, 'days'),
      end: moment(),
    });
  }

  getOpenCount(campaign) {
    try {
      const val = campaign.values['Opened By Members'];
      if (!val) return 0;
      return JSON.parse(val).length;
    } catch (e) {
      return 0;
    }
  }

  getClickCount(campaign) {
    try {
      const val = campaign.values['Clicked By Members'];
      if (!val) return 0;
      return JSON.parse(val).length;
    } catch (e) {
      return 0;
    }
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
      });
      this.props.fetchEmailCampaignsByDate({ start: fromDate, end: toDate });
    }
  }

  applyCustomDates(fromDate, toDate) {
    const from = moment(fromDate, 'YYYY-MM-DD');
    const to = moment(toDate, 'YYYY-MM-DD');
    this.setState({
      fromDate: from.format('YYYY-MM-DD'),
      toDate: to.format('YYYY-MM-DD'),
    });
    this.props.fetchEmailCampaignsByDate({ start: from, end: to });
  }

  getPanelIds(campaign, field) {
    try {
      const val = campaign.values[field];
      if (!val) return [];
      return JSON.parse(val);
    } catch (e) {
      return [];
    }
  }

  resolvePeople(ids) {
    const members = this.props.members || [];
    const leads = this.props.leads || [];
    return ids.map(id => {
      const member = members.find(m => m.id === id);
      if (member) {
        return {
          id,
          name:
            (member.values['First Name'] || '') +
            ' ' +
            (member.values['Last Name'] || ''),
          type: 'Member',
          link: `/Member/${id}`,
        };
      }
      const lead = leads.find(l => l.id === id);
      if (lead) {
        return {
          id,
          name:
            (lead.values['First Name'] || '') +
            ' ' +
            (lead.values['Last Name'] || ''),
          type: 'Lead',
          link: `/LeadDetail/${id}`,
        };
      }
      return { id, name: id, type: '—', link: null };
    });
  }

  closePeoplePanel() {
    this.setState({
      selectedCampaign: null,
      selectedField: null,
      panelFilter: '',
    });
  }

  getPanelTitle() {
    const { selectedField } = this.state;
    if (selectedField === 'Recipients') return 'Sent To';
    if (selectedField === 'Opened By Members') return 'Opened By';
    if (selectedField === 'Clicked By Members') return 'Clicked By';
    return '';
  }

  getPeopleTableColumns() {
    return [
      {
        accessor: 'name',
        Header: 'Name',
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        Cell: props =>
          props.original.link ? (
            <NavLink to={props.original.link}>{props.original.name}</NavLink>
          ) : (
            props.original.name
          ),
      },
      {
        accessor: 'type',
        Header: 'Type',
        maxWidth: 80,
      },
    ];
  }

  renderPeoplePanel() {
    const { selectedCampaign, selectedField, panelFilter } = this.state;
    if (!selectedCampaign || !selectedField) return null;

    const ids = this.getPanelIds(selectedCampaign, selectedField);
    const people = this.resolvePeople(ids);
    const filterLower = panelFilter.toLowerCase();
    const filtered = filterLower
      ? people.filter(p => p.name.toLowerCase().includes(filterLower))
      : people;

    return (
      <div
        className="membersPanel"
        style={{ marginTop: '16px', marginBottom: '16px' }}
      >
        <div
          className="membersPanelHeader"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            className="membersPanelTitle"
            style={{ fontSize: '14px', fontWeight: 600, color: '#4d5059' }}
          >
            {this.getPanelTitle()} — {selectedCampaign.values['Subject']}
          </span>
          <span
            className="closeMembers"
            onClick={() => this.closePeoplePanel()}
          >
            <CrossIcon className="icon icon-svg" /> Close
          </span>
        </div>
        <input
          type="text"
          className="form-control memberFilterInput"
          placeholder="Filter by name..."
          value={panelFilter}
          onChange={e => this.setState({ panelFilter: e.target.value })}
        />
        <ReactTable
          columns={this.getPeopleTableColumns()}
          data={filtered}
          defaultPageSize={10}
          showPagination={filtered.length > 10}
        />
      </div>
    );
  }

  render() {
    const subjectLower = this.state.subjectFilter.toLowerCase();
    const campaigns = (
      (this.props.emailCampaignsByDate || {}).submissions || []
    )
      .filter(c => {
        try {
          return (
            c.values['Recipients'] &&
            JSON.parse(c.values['Recipients']).length > 1
          );
        } catch (e) {
          return false;
        }
      })
      .filter(
        c =>
          !subjectLower ||
          (c.values['Subject'] || '').toLowerCase().includes(subjectLower),
      )
      .slice()
      .sort((a, b) =>
        moment(b.values['Sent Date']).diff(moment(a.values['Sent Date'])),
      );

    return (
      <div className="statistics">
        <span className="topRow">
          <div className="name">Email Statistics</div>
          <div
            className="continueSend"
            onClick={e => {
              this.props.setShowStatistics(false);
            }}
          >
            <img src={checkoutLeftArrowIcon} alt="Return to Send" />
            <span className="keepSending">Return to Send</span>
          </div>
        </span>
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
            <div className="subjectFilter" style={{ marginTop: '10px' }}>
              <label htmlFor="subjectFilter" className="control-label">
                Subject
              </label>
              <input
                type="text"
                id="subjectFilter"
                className="form-control input-sm"
                placeholder="Filter by subject..."
                value={this.state.subjectFilter}
                onChange={e => this.setState({ subjectFilter: e.target.value })}
              />
            </div>
          </div>

          {this.renderPeoplePanel()}

          {this.props.emailCampaignsByDateLoading ? (
            <div style={{ margin: '10px' }}>
              <p>Loading email statistics...</p>
              <ReactSpinner />
            </div>
          ) : (
            <table
              className="table table-striped"
              style={{ marginTop: '16px' }}
            >
              <thead>
                <tr>
                  <th>Date Sent</th>
                  <th>Subject</th>
                  <th>Sent</th>
                  <th>Opens</th>
                  <th>Open %</th>
                  <th>Clicks</th>
                  <th>Click %</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center' }}>
                      No campaigns found for this period.
                    </td>
                  </tr>
                ) : (
                  campaigns.map(c => {
                    const recipientsVal = c.values['Recipients'];
                    const sent = recipientsVal
                      ? (() => {
                          try {
                            return JSON.parse(recipientsVal).length;
                          } catch (e) {
                            return 0;
                          }
                        })()
                      : 0;
                    const opens = this.getOpenCount(c);
                    const clicks = this.getClickCount(c);
                    return (
                      <tr key={c.id}>
                        <td>
                          {c.values['Sent Date']
                            ? moment(c.values['Sent Date']).format(
                                'DD MMM YYYY',
                              )
                            : '—'}
                        </td>
                        <td>{c.values['Subject']}</td>
                        <td>
                          <span
                            className="statisticsLink"
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            onClick={() =>
                              this.setState({
                                selectedCampaign: c,
                                selectedField: 'Recipients',
                                panelFilter: '',
                                panelPage: 0,
                              })
                            }
                          >
                            {sent}
                          </span>
                        </td>
                        <td>
                          <span
                            className="statisticsLink"
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            onClick={() =>
                              this.setState({
                                selectedCampaign: c,
                                selectedField: 'Opened By Members',
                                panelFilter: '',
                                panelPage: 0,
                              })
                            }
                          >
                            {opens}
                          </span>
                        </td>
                        <td>
                          {sent > 0
                            ? Math.round((opens / sent) * 100) + '%'
                            : '0%'}
                        </td>
                        <td>
                          <span
                            className="statisticsLink"
                            style={{
                              cursor: 'pointer',
                              textDecoration: 'underline',
                            }}
                            onClick={() =>
                              this.setState({
                                selectedCampaign: c,
                                selectedField: 'Clicked By Members',
                                panelFilter: '',
                                panelPage: 0,
                              })
                            }
                          >
                            {clicks}
                          </span>
                        </td>
                        <td>
                          {sent > 0
                            ? Math.round((clicks / sent) * 100) + '%'
                            : '0%'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
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

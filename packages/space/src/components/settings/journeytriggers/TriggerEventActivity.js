import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import Select from 'react-select';
import { Button } from 'reactstrap';
import { I18n } from '@kineticdata/react';
import { actions } from '../../../redux/modules/journeyTriggers';
import { actions as leadActions } from 'gbmembers/src/redux/modules/leads';
import { actions as memberActions } from 'gbmembers/src/redux/modules/members';
import { Loading } from 'common';
import { MemberEvents } from './MemberEvents';
import { LeadEvents } from './LeadEvents';
import { getJson } from 'gbmembers/src/components/Member/MemberUtils';
import ReactTooltip from 'react-tooltip';

export const contact_date_format = 'YYYY-MM-DD HH:mm';
const globals = import('common/globals');
const journey_events_url =
  'app/api/v1/datastore/forms/journey-event/submissions?include=details,values&index=values[Record ID]&limit=1000';

const mapStateToProps = state => {
  return {
    journeyEventsLoading: state.space.journeyTriggers.journeyEventsLoading,
    journeyEvents: state.space.journeyTriggers.journeyEvents,
    allLeads: state.member.leads.allLeads,
    allMembers: state.member.members.allMembers,
  };
};
const mapDispatchToProps = {
  fetchJourneyEvents: actions.fetchJourneyEvents,
};
var compThis = undefined;
const util = require('util');

export class TriggerResults extends Component {
  constructor(props) {
    super(props);

    this.getEventConditionDuration = this.getEventConditionDuration.bind(this);
    this.getEventCondition = this.getEventCondition.bind(this);

    this.state = {};
  }

  getEventConditionDuration(triggerID) {
    let trigger = this.props.journeyTriggers.find(
      trigger => trigger.id === triggerID,
    );
    if (trigger !== undefined) {
      return trigger.values['Record Type'] === 'Member'
        ? trigger.values['Member Condition Duration']
        : trigger.values['Lead Condition Duration'];
    }
    return '';
  }
  getEventCondition(triggerID) {
    let trigger = this.props.journeyTriggers.find(
      trigger => trigger.id === triggerID,
    );
    if (trigger !== undefined) {
      return trigger.values['Record Type'] === 'Member'
        ? trigger.values['Member Condition']
        : trigger.values['Lead Condition'];
    }
    return 'unknown';
  }
  lastConditionValue = (histJson, note) => {
    return 'Note';
  };

  fetchDatastoreData = (url, record, triggers, recordType) => {
    return fetch(url)
      .then(res => res.json())
      .then(
        result => {
          var events = result.submissions ? result.submissions : [];
          var memberTriggers = triggers.filter(
            trigger => trigger.values['Record Type'] === recordType,
          );

          var histJson = getJson(
            recordType === 'Member'
              ? record.values['Notes History']
              : record.values['History'],
          );
          if (
            histJson.length > 0 &&
            typeof histJson[0] === 'string' &&
            histJson[0].indexOf('. User Comment:') !== -1
          ) {
            histJson[0] = histJson[0].replace('[{', '{').replace('}]', '}');
            histJson[0] = getJson(histJson[0].replace(/\n/g, ' '));
          }
          var data = [];

          events.forEach((event, i) => {
            let trigger =
              recordType === 'Member'
                ? triggers.find(
                    trigger => trigger.id === event.values['Trigger ID'],
                  )
                : triggers.find(
                    trigger => trigger.id === event.values['Trigger ID'],
                  );
            data[data.length] = {
              id: event.id,
              Date: moment(event['createdAt']).format(contact_date_format),
              Status: event.values['Status'],
              'Contact Type': event.values['Contact Type'],
              Note: event.values['Template Name'],
              Condition:
                recordType === 'Member'
                  ? trigger !== undefined
                    ? trigger.values['Member Condition']
                    : 'Trigger Deleted'
                  : trigger !== undefined
                    ? trigger.values['Lead Condition']
                    : 'Trigger Deleted',
              Duration:
                recordType === 'Member'
                  ? trigger !== undefined
                    ? trigger.values['Member Condition Duration']
                    : 'Trigger Deleted'
                  : trigger !== undefined
                    ? trigger.values['Lead Condition Duration']
                    : 'Trigger Deleted',
            };
          });
          memberTriggers.forEach((trigger, i) => {
            if (
              events.findIndex(
                event => event.values['Trigger ID'] === trigger.id,
              ) === -1
            ) {
              data[data.length] = {
                id: trigger.id,
                Date: moment(record['createdAt'])
                  .add(
                    recordType === 'Member'
                      ? trigger.values['Member Condition Duration']
                      : trigger.values['Lead Condition Duration'],
                    'days',
                  )
                  .format(contact_date_format),
                Status: 'Defined',
                'Contact Type': trigger.values['Contact Type'],
                Note: trigger.values['Template Name'],
                Condition:
                  recordType === 'Member'
                    ? trigger.values['Member Condition']
                    : trigger.values['Lead Condition'],
                Duration:
                  recordType === 'Member'
                    ? trigger.values['Member Condition Duration']
                    : trigger.values['Lead Condition Duration'],
              };
            }
          });

          histJson.slice().forEach((note, i) => {
            if (note['note'].indexOf('Journey Event:') === -1) {
              data[data.length] = {
                id: 'note_' + i,
                Date: moment(note['contactDate']).format(contact_date_format),
                Status: 'Manual',
                'Contact Type': note['contactMethod'],
                Note: note['note'],
                Condition: this.lastConditionValue(histJson, note),
              };
            }
          });

          let sortedData = data.sort(function(a, b) {
            if (
              moment(a['Date'], contact_date_format).isBefore(
                moment(b['Date'], contact_date_format),
              )
            )
              return -1;
            if (
              moment(a['Date'], contact_date_format).isAfter(
                moment(b['Date'], contact_date_format),
              )
            )
              return 1;
            return 0;
          });

          var dataMap = new Map();
          sortedData.forEach((item, i) => {
            var events = dataMap.get(item['Condition']);
            if (events === undefined) {
              events = [];
            }
            events[events.length] = item;
            dataMap.set(item['Condition'], events);
          });

          return dataMap;
        },
        error => {
          console.log('error: ' + util.inspect(error));
          return [];
        },
      );
  };
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}
  render() {
    return this.props.journeyEventsLoading ? (
      <Loading text="Loading Results..." />
    ) : (
      <div className="triggerResults">
        <table>
          <thead>
            <tr className="tableHeader">
              <th width="100">Created</th>
              <th width="100">Updated</th>
              <th width="80">Status</th>
              <th width="300">Member/Lead</th>
              <th width="10" />
              <th width="300">Condition</th>
              <th width="500">Template Name</th>
              <th />
              <th />
            </tr>
          </thead>
          <tbody>
            {this.props.journeyEvents.map((event, tIdx) => (
              <tr
                className={tIdx % 2 === 0 ? 'eventRow even' : 'eventRow odd'}
                id={event.values['Record ID']}
                key={tIdx}
              >
                <td>
                  {moment(event.createdAt, 'YYYY-MM-DDTHH:mm:ssZ').format('L')}
                </td>
                <td>
                  {moment(event.updatedAt, 'YYYY-MM-DDTHH:mm:ssZ').format('L')}
                </td>
                <td>{event.values['Status']}</td>
                <td
                  className="personName"
                  recordId={event.values['Record ID']}
                  recordType={event.values['Record Type']}
                  onClick={e => {
                    var recordId = $(e.target).attr('recordId');

                    if ($('.eventsDetail' + recordId).length === 0) {
                      var rowEl = document.createElement('tr');
                      $(rowEl).addClass('eventsDetail' + recordId);
                      var tdEl = document.createElement('td');
                      $(tdEl).attr('colspan', '9');
                      $(tdEl).html(
                        "<div class='loading'>Loading please wait...</div>",
                      );
                      rowEl.appendChild(tdEl);
                      var trEl = $(e.target).parent('tr');
                      trEl[0].insertAdjacentElement('afterend', rowEl);

                      var url =
                        journey_events_url +
                        '&q=values[Record ID]="' +
                        recordId +
                        '"';
                      var fetchEvents = this.fetchDatastoreData(
                        url,
                        event.values['Record Type'] === 'Member'
                          ? this.props.allMembers[
                              this.props.allMembers.findIndex(
                                member => member.id === recordId,
                              )
                            ]
                          : this.props.allLeads[
                              this.props.allLeads.findIndex(
                                lead => lead.id === recordId,
                              )
                            ],
                        this.props.journeyTriggers,
                        event.values['Record Type'],
                      );

                      if (event.values['Record Type'] === 'Member') {
                        fetchEvents.then(events => {
                          ReactDOM.render(
                            <MemberEvents
                              events={events}
                              memberItem={
                                this.props.allMembers[
                                  this.props.allMembers.findIndex(
                                    member => member.id === recordId,
                                  )
                                ]
                              }
                            />,
                            tdEl,
                          );
                        });
                      } else {
                        fetchEvents.then(events => {
                          ReactDOM.render(
                            <LeadEvents
                              events={events}
                              leadItem={
                                this.props.allLeads[
                                  this.props.allLeads.findIndex(
                                    lead => lead.id === recordId,
                                  )
                                ]
                              }
                            />,
                            tdEl,
                          );
                        });
                      }
                    } else if (
                      $('.eventsDetail' + recordId).length === 1 &&
                      $('.eventsDetail' + recordId + ':hidden').length === 1
                    ) {
                      $('.eventsDetail' + recordId).show();
                    } else {
                      $('.eventsDetail' + recordId).hide();
                    }
                  }}
                >
                  {event.values['Record Name']}
                </td>
                <td>
                  {this.getEventConditionDuration(event.values['Trigger ID'])}
                </td>
                <td>{this.getEventCondition(event.values['Trigger ID'])}</td>
                <td>{event.values['Template Name']}</td>
                <td>
                  <span
                    className={
                      event.values['Action'] === 'Alert'
                        ? 'fa fa-fw fa-bell'
                        : 'fa fa-fw fa-bolt'
                    }
                  />
                </td>
                <td>
                  <span
                    className={
                      event.values['Contact Type'] === 'Call'
                        ? 'fa fa-fw fa-phone'
                        : event.values['Contact Type'] === 'SMS'
                          ? 'fa fa-fw fa-comment-o'
                          : 'fa fa-fw fa-envelope-o'
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
}

export class TriggerEventActivity extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    this.getAllMembers = this.getAllMembers.bind(this);
    this.getAllLeads = this.getAllLeads.bind(this);
    this.disableSearch = this.disableSearch.bind(this);

    this.state = {
      triggerSelected: null,
      memberSelected: null,
      leadSelected: null,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}

  customFilter(option, searchText) {
    if (
      (option.data.values['Member Condition'] !== undefined &&
        option.data.values['Member Condition'] !== null &&
        option.data.values['Member Condition']
          .toLowerCase()
          .includes(searchText.toLowerCase())) ||
      (option.data.values['Lead Condition'] !== undefined &&
        option.data.values['Lead Condition'] !== null &&
        option.data.values['Lead Condition']
          .toLowerCase()
          .includes(searchText.toLowerCase()))
    ) {
      return true;
    } else {
      return false;
    }
  }
  getAllMembers() {
    let membersVals = [];
    this.props.allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals.sort(function(a, b) {
      if (a.label < b.label) {
        return -1;
      } else if (a.label > b.labe) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  getAllLeads() {
    let leadsVals = [];
    this.props.allLeads.forEach(lead => {
      if (
        lead.values['Status'] !== 'Converted' &&
        lead.values['Status'] !== 'Deleted'
      ) {
        leadsVals.push({
          label: lead.values['Last Name'] + ' ' + lead.values['First Name'],
          value: lead.id,
        });
      }
    });
    return leadsVals.sort(function(a, b) {
      if (a.label < b.label) {
        return -1;
      } else if (a.label > b.labe) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  disableSearch() {
    let ret = true;

    if (this.state.triggerSelected !== null) ret = false;
    if (this.state.recordType !== undefined) ret = false;
    if (
      this.state.memberSelected !== null &&
      this.state.memberSelected !== undefined &&
      this.state.memberSelected.value !== ''
    )
      ret = false;
    if (
      this.state.leadSelected !== null &&
      this.state.leadSelected !== undefined &&
      this.state.leadSelected.value !== ''
    )
      ret = false;

    return ret;
  }
  render() {
    return (
      <div className="triggerActivity">
        <div
          className="back fa fa-chevron-left"
          onClick={e => {
            this.props.setHideMemberBlock(false);
            this.props.setHideLeadBlock(false);
            this.props.setHideActivityBlock(false);
            this.props.setShowTriggerActivities(false);
          }}
        />
        <div className="header">
          <div className={`fa fa-history`} />
          <div className="details">
            <div className="title">Journey Trigger Activity</div>
            <div className="info">
              Evaluate/review all Journey Trigger usage/activity. Locate
              generated Journey Trigger events by Trigger/Member/Lead.
            </div>
          </div>
        </div>
        <div className="searchOptions">
          <div className="triggerConditionSelect">
            <Select
              closeMenuOnSelect={true}
              options={this.props.journeyTriggers.sort(function(a, b) {
                let ret = 0;
                if (a.values['Record Type'] < b.values['Record Type']) {
                  ret = 1;
                } else if (a.values['Record Type'] > b.values['Record Type']) {
                  ret = -1;
                } else {
                  if (
                    (a.values['Record Type'] === 'Member'
                      ? a.values['Member Condition']
                      : a.values['Lead Condition']) <
                    (b.values['Record Type'] === 'Member'
                      ? b.values['Member Condition']
                      : b.values['Lead Condition'])
                  ) {
                    ret = -1;
                  } else if (
                    (a.values['Record Type'] === 'Member'
                      ? a.values['Member Condition']
                      : a.values['Lead Condition']) >
                    (b.values['Record Type'] === 'Member'
                      ? b.values['Member Condition']
                      : b.values['Lead Condition'])
                  ) {
                    ret = 1;
                  } else {
                    if (
                      (a.values['Record Type'] === 'Member'
                        ? parseInt(a.values['Member Condition Duration'])
                        : parseInt(a.values['Lead Condition Duration'])) <
                      (b.values['Record Type'] === 'Member'
                        ? parseInt(b.values['Member Condition Duration'])
                        : parseInt(b.values['Lead Condition Duration']))
                    ) {
                      ret = -1;
                    } else if (
                      (a.values['Record Type'] === 'Member'
                        ? parseInt(a.values['Member Condition Duration'])
                        : parseInt(a.values['Lead Condition Duration'])) >
                      (b.values['Record Type'] === 'Member'
                        ? parseInt(b.values['Member Condition Duration'])
                        : parseInt(b.values['Lead Condition Duration']))
                    ) {
                      ret = 1;
                    }
                  }
                }

                return ret;
              })}
              value={this.state.triggerSelected}
              getOptionLabel={trigger => (
                <span>
                  {trigger.values['Record Type']}
                  {trigger.values['Contact Type'] === 'Call' ? (
                    <span className="fa fa-fw fa-phone" />
                  ) : trigger.values['Contact Type'] === 'SMS' ? (
                    <span className="fa fa-fw fa-comment-o" />
                  ) : (
                    <span className="fa fa-fw fa-envelope-o" />
                  )}
                  {' - [' +
                    (trigger.values['Record Type'] === 'Member'
                      ? trigger.values['Member Condition Duration'] +
                        ' ' +
                        trigger.values['Member Condition']
                      : trigger.values['Lead Condition Duration'] +
                        ' ' +
                        trigger.values['Lead Condition'])}
                  {'] - ' + trigger.values['Template Name']}
                </span>
              )}
              getOptionValue={trigger => `${trigger.id}`}
              filterOption={this.customFilter}
              styles={{
                option: base => ({
                  ...base,
                  width: '100%',
                }),
                input: base => ({
                  ...base,
                  width: '600px',
                }),
              }}
              className="triggerConditions"
              classNamePrefix="hide-columns"
              placeholder="Select Trigger Condition"
              onChange={value => {
                this.setState({
                  triggerSelected: value,
                  recordType: value.values['Record Type'],
                });
                if (value.values['Record Type'] === 'Member') {
                  this.setState({
                    leadSelected: null,
                  });
                } else {
                  this.setState({
                    memberSelected: null,
                  });
                }
              }}
            />
            <Button
              className="clearTriggers"
              color="primary"
              onClick={() => {
                this.setState({
                  triggerSelected: null,
                  recordType: undefined,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <div className="memberSelect">
            <Select
              value={this.state.memberSelected}
              closeMenuOnSelect={true}
              options={this.getAllMembers()}
              className="hide-columns-container"
              classNamePrefix="hide-columns"
              placeholder="Select Member"
              isDisabled={
                this.state.recordType !== undefined &&
                this.state.recordType !== 'Member'
              }
              onChange={value => {
                this.setState({
                  memberSelected: value.value === '' ? null : value,
                });
                ReactTooltip.rebuild();
              }}
              style={{ width: '300px' }}
            />
            <Button
              className="clearMember"
              color="primary"
              onClick={() => {
                this.setState({
                  memberSelected: null,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <div className="leadSelect">
            <Select
              value={this.state.leadSelected}
              closeMenuOnSelect={true}
              options={this.getAllLeads()}
              className="hide-columns-container"
              classNamePrefix="hide-columns"
              placeholder="Select Lead"
              isDisabled={
                this.state.recordType !== undefined &&
                this.state.recordType !== 'Lead'
              }
              onChange={value => {
                this.setState({
                  leadSelected: value.value === '' ? null : value,
                });
              }}
              style={{ width: '300px' }}
            />
            <Button
              className="clearLead"
              color="primary"
              onClick={() => {
                this.setState({
                  leadSelected: null,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <Button
            className="searchButton"
            color="primary"
            disabled={this.disableSearch()}
            onClick={() => {
              this.props.fetchJourneyEvents({
                triggerID:
                  this.state.triggerSelected !== null
                    ? this.state.triggerSelected.id
                    : null,
                memberID: this.state.memberSelected,
                leadID: this.state.leadSelected,
              });
            }}
          >
            <I18n>Search</I18n>
          </Button>
        </div>
        <TriggerResults
          journeyEventsLoading={this.props.journeyEventsLoading}
          journeyEvents={this.props.journeyEvents}
          allLeads={this.props.allLeads}
          allMembers={this.props.allMembers}
          journeyTriggers={this.props.journeyTriggers}
        />
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
);

export const TriggerEventActivityContainer = enhance(TriggerEventActivity);

import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/campaigns';
import $ from 'jquery';
import 'react-datetime/css/react-datetime.css';
import moment from 'moment';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as membersActions } from '../../redux/modules/members';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { actions as messagingActions } from '../../redux/modules/messaging';
import '../send/tinymce.min.js';
import sms from '../../../../app/src/assets/images/sms.png';
import { confirm } from '../helpers/Confirmation';
import { actions as eventsActions } from '../../../../app/src/redux/modules/journeyevents';
import { actions as errorActions } from '../../redux/modules/errors';
import { KappNavLink as NavLink } from 'common';
import { substituteFields } from '../leads/LeadsUtils';
import { contact_date_format } from '../leads/LeadsUtils';
import { getHistoryInfo } from './JourneyUtils';
import { HistoryInfo } from './HistoryInfo';
import { actions as appActions } from '../../redux/modules/memberApp';
import NumberFormat from 'react-number-format';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  journeyEventLoading: state.member.datastore.journeyEventLoading,
  journeyEvent: state.member.datastore.journeyEvent,
  space: state.member.app.space,
  allLeads: state.member.leads.allLeads,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  events: state.app.journeyevents.data,
  smsAccountCredit: state.member.messaging.smsAccountCredit,
  smsAccountCreditLoading: state.member.messaging.smsAccountCreditLoading,
  profile: state.member.kinops.profile,
});
const mapDispatchToProps = {
  sendSms: messagingActions.sendSms,
  fetchJourneyEvent: dataStoreActions.fetchJourneyEvent,
  updateJourneyEvent: dataStoreActions.updateJourneyEvent,
  deleteJourneyEvent: dataStoreActions.deleteJourneyEvent,
  resetJourneyEvent: dataStoreActions.resetJourneyEvent,
  fetchLeads: leadsActions.fetchLeads,
  setJourneyEvents: eventsActions.setJourneyEvents,
  getAccountCredit: messagingActions.getAccountCredit,
  setAccountCredit: messagingActions.setAccountCredit,
  createMemberActivities: messagingActions.createMemberActivities,
  createLeadActivities: messagingActions.createLeadActivities,
  updateMember: membersActions.updateMember,
  updateLead: leadsActions.updateLead,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

const util = require('util');

class EventResult extends Component {
  render() {
    return (
      <div className="smsEvent">
        {this.props.smsSent ? <h2>SMS Sent</h2> : <h2>Event Deleted</h2>}
        <div className="info">
          <span>
            <h1>
              <span className="icon">
                <img src={sms} alt="SMS" />
              </span>

              <small className="source">
                {this.props.journeyEvent.values['Record Type']}
              </small>
              {this.props.journeyEvent.values['Record Type'] === 'Member' ? (
                <NavLink
                  to={`/Member/${this.props.journeyEvent.values['Record ID']}`}
                  className="nameValue"
                >
                  {this.props.journeyEvent.values['Record Name']}
                </NavLink>
              ) : (
                <NavLink
                  to={`/LeadDetail/${this.props.journeyEvent.values['Record ID']}`}
                  className="nameValue"
                >
                  {this.props.journeyEvent.values['Record Name']}
                </NavLink>
              )}
            </h1>
            <table className="trigger">
              <tbody>
                <tr>
                  <td className="label">Template:</td>
                  <td className="value">
                    <span className="template">
                      {this.props.journeyEvent.values['Template Name']}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="label">Trigger date:</td>
                  <td className="value">
                    <span className="date">
                      {moment(this.props.journeyEvent['createdAt']).fromNow()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="label">Phone:</td>
                  <td className="value">
                    <span className="sms">
                      {this.props.journeyEvent.values['Record Type'] ===
                      'Member' ? (
                        this.props.memberItem &&
                        this.props.memberItem.values ? (
                          <span>
                            <NumberFormat
                              value={
                                this.props.memberItem.values['Phone Number']
                              }
                              displayType={'text'}
                              format={
                                getAttributeValue(
                                  this.props.space,
                                  'PhoneNumber Format',
                                ) !== undefined
                                  ? getAttributeValue(
                                      this.props.space,
                                      'PhoneNumber Format',
                                    )
                                  : '####-###-###'
                              }
                            />
                            <NumberFormat
                              value={
                                this.props.memberItem.values[
                                  'AdditionalPhone Number'
                                ]
                              }
                              displayType={'text'}
                              format={
                                getAttributeValue(
                                  this.props.space,
                                  'PhoneNumber Format',
                                ) !== undefined
                                  ? getAttributeValue(
                                      this.props.space,
                                      'PhoneNumber Format',
                                    )
                                  : '####-###-###'
                              }
                            />
                          </span>
                        ) : (
                          ''
                        )
                      ) : this.props.leadItem && this.props.leadItem.values ? (
                        <span>
                          <NumberFormat
                            value={this.props.leadItem.values['Phone Number']}
                            displayType={'text'}
                            format={
                              getAttributeValue(
                                this.props.space,
                                'PhoneNumber Format',
                              ) !== undefined
                                ? getAttributeValue(
                                    this.props.space,
                                    'PhoneNumber Format',
                                  )
                                : '####-###-###'
                            }
                          />
                          <NumberFormat
                            value={
                              this.props.leadItem.values[
                                'Additional Phone Number'
                              ]
                            }
                            displayType={'text'}
                            format={
                              getAttributeValue(
                                this.props.space,
                                'PhoneNumber Format',
                              ) !== undefined
                                ? getAttributeValue(
                                    this.props.space,
                                    'PhoneNumber Format',
                                  )
                                : '####-###-###'
                            }
                          />
                        </span>
                      ) : (
                        ''
                      )}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </span>
        </div>
      </div>
    );
  }
}
export class SMSEvent extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.sendSms = this.sendSms.bind(this);
    this.sendEnabled = this.sendEnabled.bind(this);

    var smsText = substituteFields(
      this.props.smsTemplate['SMS Content'],
      this.props.leadItem !== undefined
        ? this.props.leadItem
        : this.props.memberItem,
      this.props.space,
      this.props.profile,
    );
    this.state = {
      smsText: smsText,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {}

  componentDidUpdate() {}

  escapeJSON(str) {
    return str.replace(/(["])/g, '\\$1');
  }

  sendSms(person) {
    let to = person.values['Phone Number'];

    this.props.sendSmsMessage({
      type: 'outbound',
      status: 'sent',
      to: to,
      text: this.state.smsText,
      datetime: moment().format('DD-MM-YYYY hh:mm A'),
    });
  }

  sendEnabled() {
    var enable = true;
    if (parseInt(this.props.smsAccountCredit) <= 0) enable = false;

    if (
      this.props.memberItem !== undefined &&
      (this.props.memberItem.values['Phone Number'] === null ||
        this.props.memberItem.values['Phone Number'] === '')
    )
      enable = false;
    if (
      this.props.leadItem !== undefined &&
      (this.props.leadItem.values['Phone Number'] === undefined ||
        this.props.leadItem.values['Phone Number'] === '')
    )
      enable = false;

    return enable;
  }

  render() {
    return (
      <div className="smsEvent" style={{ marginTop: '2%' }}>
        <div
          className="row"
          style={{
            backgroundColor: '#f7f7f7',
            paddingTop: '2%',
          }}
        >
          <div className="info">
            <span>
              <h1>
                <span className="icon">
                  <img src={sms} alt="SMS" />
                </span>

                <small className="source">
                  {this.props.journeyEvent.values['Record Type']}
                </small>
                {this.props.journeyEvent.values['Record Type'] === 'Member' ? (
                  <NavLink
                    to={`/Member/${this.props.journeyEvent.values['Record ID']}`}
                    className="nameValue"
                  >
                    {this.props.journeyEvent.values['Record Name']}
                  </NavLink>
                ) : (
                  <NavLink
                    to={`/LeadDetail/${this.props.journeyEvent.values['Record ID']}`}
                    className="nameValue"
                  >
                    {this.props.journeyEvent.values['Record Name']}
                  </NavLink>
                )}
              </h1>
              <table className="trigger">
                <tbody>
                  <tr>
                    <td className="label">Template:</td>
                    <td className="value">
                      <span className="template">
                        {this.props.journeyEvent.values['Template Name']}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Trigger date:</td>
                    <td className="value">
                      <span className="date">
                        {moment(this.props.journeyEvent['createdAt']).fromNow()}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td className="label">Phone:</td>
                    <td className="value">
                      <span className="sms">
                        {this.props.recordType === 'Member' ? (
                          this.props.memberItem &&
                          this.props.memberItem.values ? (
                            <span>
                              <NumberFormat
                                value={
                                  this.props.memberItem.values['Phone Number']
                                }
                                displayType={'text'}
                                format={
                                  getAttributeValue(
                                    this.props.space,
                                    'PhoneNumber Format',
                                  ) !== undefined
                                    ? getAttributeValue(
                                        this.props.space,
                                        'PhoneNumber Format',
                                      )
                                    : '####-###-###'
                                }
                              />
                              <NumberFormat
                                value={
                                  this.props.memberItem.values[
                                    'Additional Phone Number'
                                  ]
                                }
                                displayType={'text'}
                                format={
                                  getAttributeValue(
                                    this.props.space,
                                    'PhoneNumber Format',
                                  ) !== undefined
                                    ? getAttributeValue(
                                        this.props.space,
                                        'PhoneNumber Format',
                                      )
                                    : '####-###-###'
                                }
                              />
                            </span>
                          ) : (
                            ''
                          )
                        ) : this.props.leadItem &&
                          this.props.leadItem.values ? (
                          <span>
                            <NumberFormat
                              value={this.props.leadItem.values['Phone Number']}
                              displayType={'text'}
                              format={
                                getAttributeValue(
                                  this.props.space,
                                  'PhoneNumber Format',
                                ) !== undefined
                                  ? getAttributeValue(
                                      this.props.space,
                                      'PhoneNumber Format',
                                    )
                                  : '####-###-###'
                              }
                            />
                            <NumberFormat
                              value={
                                this.props.leadItem.values[
                                  'Additional Phone Number'
                                ]
                              }
                              displayType={'text'}
                              format={
                                getAttributeValue(
                                  this.props.space,
                                  'PhoneNumber Format',
                                ) !== undefined
                                  ? getAttributeValue(
                                      this.props.space,
                                      'PhoneNumber Format',
                                    )
                                  : '####-###-###'
                              }
                            />
                          </span>
                        ) : (
                          ''
                        )}
                      </span>
                    </td>
                  </tr>
                  <HistoryInfo
                    history={this.props.history}
                    space={this.props.space}
                    profile={this.props.profile}
                  />
                </tbody>
              </table>
            </span>
          </div>
          <div className="buttons">
            <button
              type="button"
              id="saveButton"
              disabled={!this.sendEnabled()}
              className="btn btn-primary send"
              onClick={e =>
                this.sendSms(
                  this.props.memberItem !== undefined
                    ? this.props.memberItem
                    : this.props.leadItem,
                )
              }
            >
              Send
            </button>
            <button
              type="button"
              id="deleteButton"
              className="btn btn-primary send"
              onClick={async e => {
                if (
                  await confirm(
                    <span>
                      <span>
                        Are your sure you want to DELETE this SMS Event?
                      </span>
                      <table>
                        <tbody>
                          <tr>
                            <td>Template:</td>
                            <td>
                              {this.props.journeyEvent.values['Template Name']}
                            </td>
                          </tr>
                          <tr>
                            <td>Trigger Date:</td>
                            <td>
                              {moment(
                                this.props.journeyEvent['createdAt'],
                              ).fromNow()}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </span>,
                  )
                ) {
                  this.props.deleteJourneyEvent({
                    id: this.props.journeyEvent.id,
                  });
                  this.props.setEventDeleted(true);

                  this.props.events.forEach((item, i) => {
                    if (item.id === this.props.journeyEvent.id) {
                      item.values['Status'] = 'Completed';
                    }
                  });
                  this.props.setJourneyEvents(this.props.events);
                }
              }}
            >
              Delete
            </button>
            <div className="smsCredit">
              <label htmlFor="smsCredit">Credit</label>
              <input
                id="smsCredit"
                disabled
                readOnly={true}
                chars="5"
                value={this.props.smsAccountCredit}
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-10 details">
            <div id="editDiv" ref="editDiv">
              <textarea
                name="editSMS"
                value={this.state.smsText}
                onChange={e =>
                  this.setState({
                    smsText: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const SMSEventView = ({
  journeyEventLoading,
  journeyEvent,
  sendSmsMessage,
  isDirty,
  setIsDirty,
  space,
  smsSent,
  eventDeleted,
  setEventDeleted,
  events,
  setJourneyEvents,
  deleteJourneyEvent,
  smsAccountCredit,
  smsAccountCreditLoading,
  profile,
}) =>
  journeyEventLoading ||
  journeyEvent === undefined ||
  journeyEvent.smsTemplate === undefined ? (
    <div>Loading...</div>
  ) : (
    <div className="">
      {!smsSent && !eventDeleted ? (
        <SMSEvent
          smsTemplate={journeyEvent.smsTemplate}
          sendSmsMessage={sendSmsMessage}
          isDirty={isDirty}
          setIsDirty={setIsDirty}
          journeyEvent={journeyEvent.submission}
          eventId={journeyEvent.submission.id}
          recordType={journeyEvent.submission.values['Record Type']}
          recordId={journeyEvent.submission.values['Record ID']}
          leadItem={journeyEvent.leadItem}
          memberItem={journeyEvent.memberItem}
          space={space}
          setEventDeleted={setEventDeleted}
          events={events}
          setJourneyEvents={setJourneyEvents}
          deleteJourneyEvent={deleteJourneyEvent}
          smsAccountCredit={smsAccountCredit}
          smsAccountCreditLoading={smsAccountCreditLoading}
          profile={profile}
          history={getHistoryInfo(journeyEvent)}
        />
      ) : (
        <EventResult
          journeyEvent={journeyEvent.submission}
          leadItem={journeyEvent.leadItem}
          memberItem={journeyEvent.memberItem}
          smsSent={smsSent}
          eventDeleted={eventDeleted}
        />
      )}
    </div>
  );

export const SMSEventContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ match }) => {
    return {
      eventId: match.params.eventId,
      recordType: match.params.recordType,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('currentEventId', 'setCurrentEventId', null),
  withState('smsSent', 'setSmsSent', false),
  withState('eventDeleted', 'setEventDeleted', false),
  withHandlers({
    sendSmsMessage: ({
      submission,
      sendSms,
      createLeadActivities,
      createMemberActivities,
      fetchCurrentMember,
      fetchLead,
      updateMember,
      updateLead,
      target,
      addNotification,
      setSystemError,
      updateJourneyEvent,
      setJourneyEvents,
      setSmsSent,
      journeyEvent,
      profile,
      events,
    }) => sms => {
      if (!sms) {
        console.log('No SMS to send, returning...');
        return;
      }

      if (journeyEvent.submission.values['Record Type'] === 'Member') {
        journeyEvent.memberItem.values['SMS Sent Count'] =
          (!journeyEvent.memberItem.values['SMS Sent Count'] ||
          isNaN(journeyEvent.memberItem.values['SMS Sent Count'])
            ? 0
            : parseInt(journeyEvent.memberItem.values['SMS Sent Count'])) + 1;

        var notesHistory = journeyEvent.memberItem.values['Notes History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(
            notesHistory.replace(/(?:\r\n|\r|\n)/g, ' '),
          );
        }

        notesHistory.push({
          contactMethod: 'sms',
          note:
            'Journey Event:' + journeyEvent.submission.values['Template Name'],
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        journeyEvent.memberItem.values['Notes History'] = notesHistory;
        sendSms({
          sms: sms,
          target: journeyEvent.submission.values['Record Type'],
          id: journeyEvent.memberItem['id'],
          memberItem: journeyEvent.memberItem,
          updateMember,
          createMemberActivities: createMemberActivities,
          addNotification: addNotification,
          setSystemError: setSystemError,
          myThis: this,
        });
      } else if (journeyEvent.submission.values['Record Type'] === 'Lead') {
        journeyEvent.leadItem.values['SMS Sent Count'] =
          (!journeyEvent.leadItem.values['SMS Sent Count'] ||
          isNaN(journeyEvent.leadItem.values['SMS Sent Count'])
            ? 0
            : parseInt(journeyEvent.leadItem.values['SMS Sent Count'])) + 1;

        var notesHistory = journeyEvent.leadItem.values['History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(
            notesHistory.replace(/(?:\r\n|\r|\n)/g, ' '),
          );
        }

        notesHistory.push({
          contactMethod: 'sms',
          note:
            'Journey Event:' + journeyEvent.submission.values['Template Name'],
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        journeyEvent.leadItem.values['History'] = notesHistory;
        sendSms({
          sms: sms,
          target: 'Leads',
          id: journeyEvent.leadItem['id'],
          leadItem: journeyEvent.leadItem,
          updateLead,
          createLeadActivities: createLeadActivities,
          addNotification: addNotification,
          setSystemError: setSystemError,
          myThis: this,
        });
      }

      var journeyEventUpdate = {
        id: journeyEvent.submission.id,
        values: {},
      };
      journeyEventUpdate.values['Status'] = 'Completed';
      updateJourneyEvent(journeyEventUpdate);
      events.forEach((item, i) => {
        if (item.id === journeyEvent.submission.id) {
          item.values['Status'] = 'Completed';
        }
      });
      setJourneyEvents(events);
      setSmsSent(true);
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.resetJourneyEvent();
      if (this.props.allLeads.length === 0) {
        this.props.fetchLeads();
        this.props.setCurrentEventId('X');
      } else if (!this.props.membersLoading) {
        this.props.fetchJourneyEvent({
          id: this.props.eventId,
          leads: this.props.allLeads,
          members: this.props.allMembers,
        });
        this.props.setCurrentEventId(this.props.eventId);
      }
      this.props.getAccountCredit({
        setAccountCredit: this.props.setAccountCredit,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (!nextProps.leadsLoading && !nextProps.membersLoading) {
        if (
          nextProps.currentEventId !== null &&
          nextProps.currentEventId !== nextProps.eventId
        ) {
          this.props.setCurrentEventId(nextProps.eventId);
          this.props.fetchJourneyEvent({
            id: nextProps.eventId,
            leads: nextProps.allLeads,
            members: nextProps.allMembers,
          });
          this.props.setSmsSent(false);
          this.props.setEventDeleted(false);
          this.props.getAccountCredit({
            setAccountCredit: this.props.setAccountCredit,
          });
        }
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {
      console.log('SMS Unmount');
    },
  }),
)(SMSEventView);

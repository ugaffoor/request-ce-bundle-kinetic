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
import { actions as membersActions } from '../../redux/modules/members';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { actions as messagingActions } from '../../redux/modules/messaging';
import '../send/tinymce.min.js';
import phone from '../../../../app/src/assets/images/phone.png';
import { confirm } from '../helpers/Confirmation';
import { actions as eventsActions } from '../../../../app/src/redux/modules/journeyevents';
import { actions as errorActions } from '../../redux/modules/errors';
import { contact_date_format } from '../leads/LeadsUtils';
import { KappNavLink as NavLink } from 'common';
import { substituteFields } from '../leads/LeadsUtils';
import { getHistoryInfo } from './JourneyUtils';
import { HistoryInfo } from './HistoryInfo';

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
  profile: state.member.app.profile,
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
};

const util = require('util');

class EventResult extends Component {
  render() {
    return (
      <div className="smsEvent">
        {this.props.callRecorded ? (
          <h2>Call Recorded</h2>
        ) : (
          <h2>Event Deleted</h2>
        )}
        <div className="info">
          <span>
            <h1>
              <span className="icon">
                <img src={phone} alt="Phone" />
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
                    <span className="call">
                      {this.props.journeyEvent.values['Record Type'] ===
                      'Member'
                        ? this.props.memberItem && this.props.memberItem.values
                          ? this.props.memberItem.values['Phone Number'] +
                            (this.props.memberItem.values[
                              'Additional Phone Number'
                            ]
                              ? ',' +
                                this.props.memberItem.values[
                                  'Additional Phone Number'
                                ]
                              : '')
                          : ''
                        : this.props.leadItem && this.props.leadItem.values
                        ? this.props.leadItem.values['Phone Number'] +
                          (this.props.leadItem.values['Additional Phone Number']
                            ? ',' +
                              this.props.leadItem.values[
                                'Additional Phone Number'
                              ]
                            : '')
                        : ''}
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
export class CallEvent extends Component {
  constructor(props) {
    super(props);

    this.state = {
      callText: substituteFields(
        this.props.callTemplate['Script'],
        this.props.leadItem !== undefined
          ? this.props.leadItem
          : this.props.memberItem,
        this.props.space,
        this.props.profile,
      ),
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {}

  componentDidUpdate() {}

  escapeJSON(str) {
    return str.replace(/(["])/g, '\\$1');
  }

  saveNote(person) {
    this.props.saveCallNote({
      text: this.state.noteText,
      datetime: moment().format('DD-MM-YYYY hh:mm A'),
      person: person,
    });
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
                  <img src={phone} alt="Phone" />
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
                        {this.props.recordType === 'Member'
                          ? this.props.memberItem &&
                            this.props.memberItem.values
                            ? this.props.memberItem.values['Phone Number'] +
                              (this.props.memberItem.values[
                                'Additional Phone Number'
                              ]
                                ? ',' +
                                  this.props.memberItem.values[
                                    'Additional Phone Number'
                                  ]
                                : '')
                            : ''
                          : this.props.leadItem && this.props.leadItem.values
                          ? this.props.leadItem.values['Phone Number'] +
                            (this.props.leadItem.values[
                              'Additional Phone Number'
                            ]
                              ? ',' +
                                this.props.leadItem.values[
                                  'Additional Phone Number'
                                ]
                              : '')
                          : ''}
                      </span>
                    </td>
                  </tr>
                  <HistoryInfo history={this.props.history} />
                </tbody>
              </table>
            </span>
          </div>
          <div className="buttons">
            <button
              type="button"
              id="saveButton"
              className="btn btn-primary send"
              onClick={e => this.props.setShowNote(true)}
            >
              Record Call
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
                        Are your sure you want to DELETE this Call Event?
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
          </div>
        </div>
        {!this.props.showNote ? (
          <div />
        ) : (
          <div className="row callNoteDiv">
            <div className="col-sm-9 notes">
              <div className="form-group">
                <textarea
                  rows="6"
                  style={{ width: '100%' }}
                  id="callNote"
                  className="form-control"
                  ref={input => (this.input = input)}
                  placeholder="Start Typing for notes"
                  onChange={e => {
                    this.props.setIsDirty(true);
                    this.setState({
                      noteText: e.target.value,
                    });
                  }}
                />
              </div>
            </div>
            <div className="col-sm-2 notesButton">
              <button
                type="button"
                disabled={!this.props.isDirty}
                className="btn btn-primary notesButton"
                onClick={e =>
                  this.saveNote(
                    this.props.memberItem !== undefined
                      ? this.props.memberItem
                      : this.props.leadItem,
                  )
                }
              >
                Save Note
              </button>
            </div>
          </div>
        )}
        <div className="row">
          <div className="col-md-10 details">
            <div
              id="previewDiv"
              ref="previewDiv"
              style={{
                border: '1px solid #ccc',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: this.state.callText }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const CallEventView = ({
  journeyEventLoading,
  journeyEvent,
  isDirty,
  setIsDirty,
  space,
  callRecorded,
  eventDeleted,
  setEventDeleted,
  events,
  setJourneyEvents,
  deleteJourneyEvent,
  updateMember,
  updateLead,
  showNote,
  setShowNote,
  saveCallNote,
  profile,
  allMembers,
  allLeads,
  memberItem,
  leadItem,
}) =>
  journeyEventLoading ||
  journeyEvent === undefined ||
  journeyEvent.callTemplate === undefined ? (
    <div>Loading...</div>
  ) : (
    <div className="">
      {!callRecorded && !eventDeleted ? (
        <CallEvent
          callTemplate={journeyEvent.callTemplate}
          updateMember={updateMember}
          updateLead={updateLead}
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
          showNote={showNote}
          setShowNote={setShowNote}
          saveCallNote={saveCallNote}
          profile={profile}
          allMembers={allMembers}
          allLeads={allLeads}
          history={getHistoryInfo(journeyEvent)}
        />
      ) : (
        <EventResult
          journeyEvent={journeyEvent.submission}
          leadItem={journeyEvent.leadItem}
          memberItem={journeyEvent.memberItem}
          callRecorded={callRecorded}
          eventDeleted={eventDeleted}
        />
      )}
    </div>
  );

export const CallEventContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ match }) => {
    return {
      eventId: match.params.eventId,
      recordType: match.params.recordType,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('currentEventId', 'setCurrentEventId', null),
  withState('callRecorded', 'setCallRecorded', false),
  withState('eventDeleted', 'setEventDeleted', false),
  withState('showNote', 'setShowNote', false),
  withHandlers({
    saveCallNote: ({
      submission,
      updateMember,
      updateLead,
      target,
      addNotification,
      setSystemError,
      updateJourneyEvent,
      setJourneyEvents,
      setCallRecorded,
      journeyEvent,
      events,
      profile,
      allMembers,
      allLeads,
    }) => call => {
      if (journeyEvent.submission.values['Record Type'] === 'Member') {
        let notesHistory = call.person.values['Notes History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(notesHistory);
        }

        notesHistory.push({
          note: call.text,
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        call.person.values['Notes History'] = notesHistory;
        updateMember({
          id: call.person.id,
          memberItem: call.person,
        });
        for (let i = 0; i < allMembers.length; i++) {
          if (allMembers[i].id === call.person.id) {
            allMembers[i].values['Notes History'] = JSON.stringify(
              notesHistory,
            );
            break;
          }
        }
      } else if (journeyEvent.submission.values['Record Type'] === 'Lead') {
        let notesHistory = call.person.values['History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(notesHistory);
        }

        notesHistory.push({
          note: call.text,
          contactMethod: 'phone',
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        call.person.values['History'] = notesHistory;
        updateLead({
          id: call.person.id,
          leadItem: call.person,
        });
        for (let i = 0; i < allLeads.length; i++) {
          if (allLeads[i].id === call.person.id) {
            allLeads[i].values['History'] = JSON.stringify(notesHistory);
            break;
          }
        }
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
      setCallRecorded(true);
    },
  }),
  lifecycle({
    componentWillMount() {
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
    },
    componentWillReceiveProps(nextProps) {
      if (!nextProps.leadsLoading && !nextProps.membersLoading) {
        if (
          nextProps.currentEventId !== null &&
          nextProps.currentEventId !== nextProps.eventId
        ) {
          this.props.setShowNote(false);
          this.props.setCurrentEventId(nextProps.eventId);
          this.props.fetchJourneyEvent({
            id: nextProps.eventId,
            leads: nextProps.allLeads,
            members: nextProps.allMembers,
          });
          this.props.setCallRecorded(false);
          this.props.setEventDeleted(false);
        }
      }
    },
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {
      console.log('Call Unmount');
    },
  }),
)(CallEventView);

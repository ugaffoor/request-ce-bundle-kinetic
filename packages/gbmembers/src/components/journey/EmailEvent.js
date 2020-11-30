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
import { email_sent_date_format } from '../leads/LeadsUtils';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import '../send/tinymce.min.js';
import mail from '../../../../app/src/assets/images/mail.png';
import { confirm } from '../helpers/Confirmation';
import { actions as eventsActions } from '../../../../app/src/redux/modules/journeyevents';
import { KappNavLink as NavLink } from 'common';
import { substituteFields } from '../leads/LeadsUtils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newEmailCampaign,
  journeyEventLoading: state.member.datastore.journeyEventLoading,
  journeyEvent: state.member.datastore.journeyEvent,
  space: state.member.app.space,
  allLeads: state.member.leads.allLeads,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  events: state.app.journeyevents.data,
});
const mapDispatchToProps = {
  createCampaign: actions.createEmailCampaign,
  fetchJourneyEvent: dataStoreActions.fetchJourneyEvent,
  updateJourneyEvent: dataStoreActions.updateJourneyEvent,
  deleteJourneyEvent: dataStoreActions.deleteJourneyEvent,
  resetJourneyEvent: dataStoreActions.resetJourneyEvent,
  fetchLeads: leadsActions.fetchLeads,
  setJourneyEvents: eventsActions.setJourneyEvents,
};

const util = require('util');

class EventResult extends Component {
  render() {
    return (
      <div className="emailEvent">
        {this.props.emailSent ? <h2>Email Sent</h2> : <h2>Event Deleted</h2>}
        <div className="info">
          <span>
            <h1>
              <span className="icon">
                <img src={mail} alt="Email" />
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
                  <td className="label">Email:</td>
                  <td className="value">
                    <span className="email">
                      {this.props.journeyEvent.values['Record Type'] ===
                      'Member'
                        ? this.props.memberItem && this.props.memberItem.values
                          ? this.props.memberItem.values['Email'] +
                            (this.props.memberItem.values['Additional Email']
                              ? ',' +
                                this.props.memberItem.values['Additional Email']
                              : '')
                          : ''
                        : this.props.leadItem && this.props.leadItem.values
                        ? this.props.leadItem.values['Email'] +
                          (this.props.leadItem.values['Additional Email']
                            ? ',' +
                              this.props.leadItem.values['Additional Email']
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
export class EmailEvent extends Component {
  constructor(props) {
    super(props);

    this.createCampaign = this.createCampaign.bind(this);

    this.state = {
      subject: this.props.emailTemplate['Subject'],
      text: substituteFields(
        this.props.emailTemplate['Email Content'],
        this.props.leadItem !== undefined
          ? this.props.leadItem
          : this.props.memberItem,
        this.props.space,
      ),
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {}

  componentDidUpdate() {}

  escapeJSON(str) {
    return str.replace(/(["])/g, '\\$1');
  }

  createCampaign() {
    let recipientIds = [this.props.recordId];
    // Extract Embedded images from the Body
    let embeddedImages = [];
    let body = '';
    if (this.state.text.indexOf('<a href="') !== -1) {
      var contentHTML = this.state.text;

      body = contentHTML;
    } else {
      body = this.state.text;
    }

    body = body.replace(
      /class="ql-align-center"/g,
      'style="text-align: center;"',
    );
    body = body.replace(
      /class="ql-align-right"/g,
      'style="text-align: right;"',
    );
    body = body.replace(
      /class="ql-align-justify"/g,
      'style="text-align: justify;"',
    );
    if (this.props.recordId) {
      body +=
        "<div id='__gbmembers-" +
        this.props.recordType +
        '-' +
        this.props.recordId +
        "' />";
    }

    this.props.saveCampaign(
      this.state.subject,
      recipientIds,
      body,
      embeddedImages,
      this.props.space,
      this.props.journeyEvent,
      this.props.events,
    );
  }

  render() {
    return (
      <div className="emailEvent" style={{ marginTop: '2%' }}>
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
                  <img src={mail} alt="Email" />
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
                    <td className="label">Email:</td>
                    <td className="value">
                      <span className="email">
                        {this.props.recordType === 'Member'
                          ? this.props.memberItem &&
                            this.props.memberItem.values
                            ? this.props.memberItem.values['Email'] +
                              (this.props.memberItem.values['Additional Email']
                                ? ',' +
                                  this.props.memberItem.values[
                                    'Additional Email'
                                  ]
                                : '')
                            : ''
                          : this.props.leadItem && this.props.leadItem.values
                          ? this.props.leadItem.values['Email'] +
                            (this.props.leadItem.values['Additional Email']
                              ? ',' +
                                this.props.leadItem.values['Additional Email']
                              : '')
                          : ''}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </span>
          </div>
          <div className="buttons">
            <button
              type="button"
              id="saveButton"
              className="btn btn-primary send"
              onClick={e => this.createCampaign()}
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
                        Are your sure you want to DELETE this Email Event?
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
        <div className="row">
          <div className="col-md-10 details">
            <span className="line">
              <div>
                <label htmlFor="subject" required>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  style={{ width: '100%' }}
                  value={this.state.subject}
                  readOnly={true}
                />
              </div>
            </span>
            <div
              id="previewDiv"
              ref="previewDiv"
              style={{
                border: '1px solid #ccc',
              }}
            >
              <span dangerouslySetInnerHTML={{ __html: this.state.text }} />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const EmailEventView = ({
  journeyEventLoading,
  journeyEvent,
  saveCampaign,
  isDirty,
  setIsDirty,
  space,
  emailSent,
  eventDeleted,
  setEventDeleted,
  events,
  setJourneyEvents,
  deleteJourneyEvent,
}) =>
  journeyEventLoading ||
  journeyEvent === undefined ||
  journeyEvent.emailTemplate === undefined ? (
    <div>Loading...</div>
  ) : (
    <div className="">
      {!emailSent && !eventDeleted ? (
        <EmailEvent
          emailTemplate={journeyEvent.emailTemplate}
          saveCampaign={saveCampaign}
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
        />
      ) : (
        <EventResult
          journeyEvent={journeyEvent.submission}
          leadItem={journeyEvent.leadItem}
          memberItem={journeyEvent.memberItem}
          emailSent={emailSent}
          eventDeleted={eventDeleted}
        />
      )}
    </div>
  );

export const EmailEventContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ match }) => {
    return {
      eventId: match.params.eventId,
      recordType: match.params.recordType,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('currentEventId', 'setCurrentEventId', null),
  withState('emailSent', 'setEmailSent', false),
  withState('eventDeleted', 'setEventDeleted', false),
  withHandlers({
    saveCampaign: ({
      createCampaign,
      setEmailSent,
      updateJourneyEvent,
      setJourneyEvents,
    }) => (
      subject,
      recipients,
      body,
      embeddedImages,
      space,
      journeyEvent,
      events,
    ) => {
      var campaignItem = {
        values: {},
      };
      campaignItem.values['From'] = space.attributes['School Email'][0];
      campaignItem.values['Recipients'] = recipients;
      campaignItem.values['Subject'] = subject;
      campaignItem.values['Body'] = body;
      campaignItem.values['Embedded Images'] = embeddedImages;
      campaignItem.values['Sent Date'] = moment().format(
        email_sent_date_format,
      );

      var journeyEventUpdate = {
        id: journeyEvent.id,
        values: {},
      };
      journeyEventUpdate.values['Status'] = 'Completed';
      createCampaign({ campaignItem });
      updateJourneyEvent(journeyEventUpdate);
      events.forEach((item, i) => {
        if (item.id === journeyEvent.id) {
          item.values['Status'] = 'Completed';
        }
      });
      setJourneyEvents(events);
      setEmailSent(true);
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
          this.props.setCurrentEventId(nextProps.eventId);
          this.props.fetchJourneyEvent({
            id: nextProps.eventId,
            leads: nextProps.allLeads,
            members: nextProps.allMembers,
          });
          this.props.setEmailSent(false);
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
      console.log('Email Unmount');
    },
  }),
)(EmailEventView);

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
import { actions as membersActions } from '../../redux/modules/members';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import '../send/tinymce.min.js';
import mail from '../../../../app/src/assets/images/mail.png';
import { confirm } from '../helpers/Confirmation';
import { actions as eventsActions } from '../../../../app/src/redux/modules/journeyevents';
import { KappNavLink as NavLink } from 'common';
import { substituteFields } from '../leads/LeadsUtils';
import { getHistoryInfo } from './JourneyUtils';
import { HistoryInfo } from './HistoryInfo';
import EmailEditor from 'react-email-editor';
import {
  BrowserView,
  MobileView,
  TabletView,
  isBrowser,
  isMobile,
  isTablet,
} from 'react-device-detect';
import '../send/tinymce.min.js';
import { TinyMCEComponent, createEditorStore } from 'mb-react-tinymce';
import { contact_date_format } from '../leads/LeadsUtils';
import { actions as appActions } from '../../redux/modules/memberApp';

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
  profile: state.member.kinops.profile,
});
const mapDispatchToProps = {
  createCampaign: actions.createEmailCampaign,
  fetchJourneyEvent: dataStoreActions.fetchJourneyEvent,
  updateJourneyEvent: dataStoreActions.updateJourneyEvent,
  deleteJourneyEvent: dataStoreActions.deleteJourneyEvent,
  resetJourneyEvent: dataStoreActions.resetJourneyEvent,
  fetchLeads: leadsActions.fetchLeads,
  updateMember: membersActions.updateMember,
  updateLead: leadsActions.updateLead,
  setJourneyEvents: eventsActions.setJourneyEvents,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

const util = require('util');
var emailEditorRef = null;
var editorThis = null;

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
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.createCampaign = this.createCampaign.bind(this);
    this.onLoadEmail = this.onLoadEmail.bind(this);

    this.state = {
      subject: this.props.emailTemplate['Subject'],
      text: substituteFields(
        this.props.emailTemplate['Email Content'],
        this.props.leadItem !== undefined
          ? this.props.leadItem
          : this.props.memberItem,
        this.props.space,
        this.props.profile,
        this.props.journeyEvent,
      ),
      showEditor: false,
    };
    editorThis = this;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {
    if (isMobile || isTablet) {
      this.editorStore = createEditorStore();
    }
  }

  componentDidUpdate() {}

  escapeJSON(str) {
    return str.replace(/(["])/g, '\\$1');
  }

  onLoadEmail() {
    setTimeout(
      function(editorThis) {
        if (emailEditorRef === null) return;

        emailEditorRef.loadDesign(
          JSON.parse(editorThis.props.emailTemplate['Email JSON']),
        );
        emailEditorRef.exportHtml(function(data) {
          var html = data.html; // design html

          // Save the json, or html here
          editorThis.setState({ text: html });
        });

        emailEditorRef.addEventListener('design:updated', function(updates) {
          // Design is updated by the user
          emailEditorRef.exportHtml(function(data) {
            var json = data.design; // design json
            var html = data.html; // design html

            // Save the json, or html here
            editorThis.setState({ text: html });
          });
        });
      },
      1000,
      editorThis,
    );
  }

  createCampaign() {
    var content = this.state.text;
    if (isMobile || isTablet) {
      content = $('.emailEditor .mce-content-body').html();
    }

    let recipientIds = [this.props.recordId];
    // Extract Embedded images from the Body
    let embeddedImages = [];
    let body = '';
    if (content.indexOf('<a href="') !== -1) {
      var contentHTML = content;

      body = contentHTML;
    } else {
      body = content;
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
            {this.state.showEditor ? (
              <span className="line emailEditor">
                <BrowserView>
                  <EmailEditor
                    ref={editor => (emailEditorRef = editor)}
                    onLoad={this.onLoadEmail}
                  />
                </BrowserView>
                <MobileView>
                  <TinyMCEComponent
                    value={this.state.text}
                    isActive={true}
                    editorStore={this.editorStore}
                    init={{
                      menubar: false,
                    }}
                  />
                </MobileView>
                <TabletView>
                  <TinyMCEComponent
                    value={this.state.text}
                    isActive={true}
                    editorStore={this.editorStore}
                    init={{
                      menubar: false,
                    }}
                  />
                </TabletView>
              </span>
            ) : (
              <div id="previewDiv" ref="previewDiv">
                <span dangerouslySetInnerHTML={{ __html: this.state.text }} />
              </div>
            )}
          </div>
        </div>
        {this.state.showEditor ? (
          <div />
        ) : (
          <div className="row">
            <button
              type="button"
              id="editButton"
              className="btn btn-primary edit"
              onClick={e => {
                this.setState({
                  showEditor: true,
                });
              }}
            >
              Edit
            </button>
          </div>
        )}
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
  profile,
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
          profile={profile}
          history={getHistoryInfo(journeyEvent)}
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
      updateMember,
      updateLead,
      profile,
      journeyEvent,
      events,
    }) => (subject, recipients, body, embeddedImages, space) => {
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
        id: journeyEvent.submission.id,
        values: {},
      };
      journeyEventUpdate.values['Status'] = 'Completed';
      createCampaign({ campaignItem });
      updateJourneyEvent(journeyEventUpdate);
      events.forEach((item, i) => {
        if (item.id === journeyEvent.submission.id) {
          item.values['Status'] = 'Completed';
        }
      });

      if (journeyEvent.submission.values['Record Type'] === 'Member') {
        var notesHistory = journeyEvent.memberItem.values['Notes History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(
            notesHistory.replace(/(?:\r\n|\r|\n)/g, ' '),
          );
        }

        notesHistory.push({
          contactMethod: 'email',
          note:
            'Journey Event:' + journeyEvent.submission.values['Template Name'],
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        journeyEvent.memberItem.values['Notes History'] = notesHistory;
        updateMember({
          id: journeyEvent.memberItem['id'],
          memberItem: journeyEvent.memberItem,
        });
      } else if (journeyEvent.submission.values['Record Type'] === 'Lead') {
        var notesHistory = journeyEvent.leadItem.values['History'];
        if (!notesHistory) {
          notesHistory = [];
        } else if (typeof notesHistory !== 'object') {
          notesHistory = JSON.parse(
            notesHistory.replace(/(?:\r\n|\r|\n)/g, ' '),
          );
        }

        notesHistory.push({
          contactMethod: 'email',
          note:
            'Journey Event:' + journeyEvent.submission.values['Template Name'],
          contactDate: moment().format(contact_date_format),
          submitter: profile.displayName,
        });
        journeyEvent.leadItem.values['History'] = notesHistory;
        updateLead({
          id: journeyEvent.leadItem['id'],
          leadItem: journeyEvent.leadItem,
        });
      }
      setJourneyEvents(events);
      setEmailSent(true);
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
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (!nextProps.leadsLoading && !nextProps.membersLoading) {
        if (nextProps.currentEventId !== nextProps.eventId) {
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
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {
      console.log('Email Unmount');
    },
  }),
)(EmailEventView);

import React, { Fragment, Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/leads';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import {
  contact_date_format,
  reminder_date_format,
  getTimezone,
} from '../leads/LeadsUtils';
import lead_dtls from '../../images/lead_details.png';
import convert_to_member from '../../images/convert_to_member.png';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';
import in_person from '../../images/in_person.png';
import intro_class from '../../images/intro_class.png';
import cancel_class from '../../images/class_cancelled.png';
import free_class from '../../images/free_class.png';
import attended_class from '../../images/user-check.png';
import noshow_class from '../../images/no-show.png';
import moment from 'moment';
import { getJson, getPhoneNumberFormat } from '../Member/MemberUtils';
import ReactTable from 'react-table';
import 'react-datetime/css/react-datetime.css';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import { actions as settingsActions } from '../../redux/modules/settingsDatastore';
import ReactSpinner from 'react16-spinjs';
import { Confirm } from 'react-confirm-bootstrap';
import { CallScriptModalContainer } from '../Member/CallScriptModalContainer';
import { SMSModalContainer } from '../Member/SMSModalContainer';
import { SetStatusModalContainer } from './SetStatusModalContainer';
import { EmailsReceived } from '../Member/EmailsReceived';
import { Requests } from '../Member/Requests';
import { actions as errorActions } from '../../redux/modules/errors';
import { LeadSMS } from './LeadSMS';
import attentionRequired from '../../images/flag.svg?raw';
import SVGInline from 'react-svg-inline';
import binIcon from '../../images/bin.svg?raw';
import cancelClassIcon from '../../images/cancel-class.svg?raw';
import { confirm } from '../helpers/Confirmation';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { LeadOrders } from './LeadOrders';
import { actions as posActions } from '../../redux/modules/pos';
import NumberFormat from 'react-number-format';

const email_date_format = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ'];

const mapStateToProps = state => ({
  profile: state.app.profile,
  pathname: state.router.location.pathname,
  allLeads: state.member.leads.allLeads,
  leadItem: state.member.leads.currentLead,
  campaignItem: state.member.campaigns.emailCampaignItem,
  campaignLoading: state.member.campaigns.emailCampaignLoading,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  space: state.member.app.space,
  isSmsEnabled: state.member.app.isSmsEnabled,
  leadStatusValues: state.member.app.leadStatusValues,
  journeyTriggers: state.member.app.triggers,
  snippets: state.member.app.snippets,
  refundPOSTransactionInProgress:
    state.member.members.refundPOSTransactionInProgress,
  refundPOSTransactionID: state.member.members.refundPOSTransactionID,
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  fetchCampaign: campaignActions.fetchEmailCampaign,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  createJourneyEvent: settingsActions.createJourneyEvent,
  createTrialBooking: settingsActions.createTrialBooking,
  deleteTrialBooking: settingsActions.deleteTrialBooking,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  refundPOSTransaction: memberActions.refundPOSTransaction,
  refundPOSTransactionComplete: memberActions.refundPOSTransactionComplete,
  updatePOSOrder: posActions.updatePOSOrder,
  incrementPOSStock: posActions.incrementPOSStock,
  deletePOSPurchasedItem: posActions.deletePOSPurchasedItem,
};

function convertContactType(type) {
  var label = type;
  switch (type) {
    case 'phone':
      label = 'Phone Call';
      break;
    case 'email':
      label = 'Email';
      break;
    case 'sms':
      label = 'SMS';
      break;
    case 'in_person':
      label = 'In Person';
      break;
    case 'intro_class':
      label = 'Intro Class';
      break;
    case 'free_class':
      label = 'Free Class';
      break;
    case 'cancelled_class':
      label = 'Cancelled Class';
      break;
    case 'attended_class':
      label = 'Attended Class';
      break;
    case 'noshow_class':
      label = 'Class No Show';
      break;
    default:
  }
  return label;
}

const Datetime = require('react-datetime');
function getLatestHistory(history) {
  //console.log("# history = " + util.inspect(history));
  let sortedHistory = getJson(history)
    .slice()
    .sort(function(a, b) {
      if (
        moment(a['contactDate'], contact_date_format).isBefore(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return 1;
      if (
        moment(a['contactDate'], contact_date_format).isAfter(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return -1;
      return 0;
    });

  return sortedHistory[0];
}
const util = require('util');
export class LeadDetail extends Component {
  constructor(props) {
    super(props);
    this.saveLeadNote = this.props.saveLeadNote;
    this.saveRemoveLeadNote = this.props.saveRemoveLeadNote;
    this.saveCancelTrialNote = this.props.saveCancelTrialNote;

    this.saveStatus = this.props.saveStatus;
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let profile = this.props.profile;
    let contactMethod = 'phone';
    let contactLabel = 'Phone Call';

    if (this.props.leadItem.values['Lead State'] === 'Converted') {
      contactMethod = 'attended_class';
      contactLabel = 'Attended Class';
    }
    let note = '';
    let contactDate = moment().format(contact_date_format);
    let latestHistory = getLatestHistory(this.props.leadItem.values['History']);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.formatDeleteCell = this.formatDeleteCell.bind(this);

    let data = this.getData(this.props.leadItem);
    let columns = this.getColumns();

    this.state = {
      profile,
      contactMethod,
      contactLabel,
      note,
      contactDate,
      latestHistory,
      data,
      columns,
      leadItem: this.props.leadItem,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      latestHistory: getLatestHistory(nextProps.leadItem.values['History']),
      data: this.getData(nextProps.leadItem),
      columns: this.getColumns(),
    });
  }

  handleContactMethodChange(method) {
    var label = convertContactType(method);
    this.setState({
      contactMethod: method,
      contactLabel: label,
    });
  }

  handleChange(key, event) {
    if (key === 'note') {
      this.setState({
        note: event.target.value,
      });
    }
  }

  handleDateChange(date) {
    this.setState({
      contactDate: moment(date).format(contact_date_format),
    });
  }

  saveNote() {
    if (
      !this.state.note ||
      !this.state.contactMethod ||
      !this.state.contactDate
    ) {
      return;
    }
    let newHistory = {
      submitter: this.state.profile.username,
      //    createdDate: moment().format("YYYY-MM-DD HH:mm"),
      note: this.state.note,
      contactMethod: this.state.contactMethod,
      contactDate: this.state.contactDate,
    };
    this.saveLeadNote(newHistory);
    this.setState({ note: '' });
  }

  getColumns() {
    const columns = [];
    columns.push({
      accessor: 'note',
      className: 'notes',
      Cell: row => this.formatNoteCell(row),
    });
    columns.push({
      accessor: 'contactMethod',
      width: 150,
      Cell: row => this.formatContactMethodCell(row),
    });
    columns.push({
      accessor: 'contactDate',
      width: 250,
      Cell: row => moment(row.original.contactDate).format('L h:mm A'),
    });
    columns.push({
      accessor: 'submitter',
      width: 200,
      Cell: row => this.formatSubmitterCell(row),
    });
    columns.push({
      accessor: 'submitter',
      width: 100,
      Cell: this.formatDeleteCell,
    });

    return columns;
  }

  getData(leadItem) {
    //    let histJson=getJson(leadItem.values['History']!==undefined ? leadItem.values['History'].replace(/\n/g, " ") : "");
    let histJson = getJson(leadItem.values['History']);
    if (
      histJson.length > 0 &&
      typeof histJson[0] === 'string' &&
      histJson[0].indexOf('. User Comment:') !== -1
    ) {
      //      histJson[0]=histJson[0].replace("User Comment:", "\",\"User Comment\":\"").replaceAll("[{","{").replaceAll("}]","}");
      histJson[0] = histJson[0].replace('[{', '{').replace('}]', '}');
      histJson[0] = getJson(histJson[0].replace(/\n/g, ' '));
    }
    let histories = histJson.map(history => {
      return {
        ...history,
      };
    });

    return histories.sort(function(history1, history2) {
      if (
        moment(new Date(history1.contactDate), contact_date_format).isAfter(
          moment(new Date(history2.contactDate), contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(new Date(history1.contactDate), contact_date_format).isBefore(
          moment(new Date(history2.contactDate), contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  formatContactMethodCell(row) {
    if (row.original.contactMethod === 'phone') {
      return (
        <span className="notesCell phone">
          <img src={phone} alt="Phone Call" />
          Phone Call
        </span>
      );
    } else if (row.original.contactMethod === 'email') {
      return (
        <span className="notesCell email">
          <img src={mail} alt="Email" />
          Email
        </span>
      );
    } else if (row.original.contactMethod === 'sms') {
      return (
        <span className="notesCell sms">
          <img src={sms} alt="SMS" />
          SMS
        </span>
      );
    } else if (row.original.contactMethod === 'in_person') {
      return (
        <span className="notesCell in-person">
          <img src={in_person} alt="In Person" />
          In Person
        </span>
      );
    } else if (row.original.contactMethod === 'intro_class') {
      return (
        <span className="notesCell intro_class">
          <img src={intro_class} alt="Intro Class" />
          Intro Class
        </span>
      );
    } else if (row.original.contactMethod === 'free_class') {
      return (
        <span className="notesCell free_class">
          <img src={free_class} alt="Free Class" />
          Free Class
        </span>
      );
    } else if (row.original.contactMethod === 'cancelled_class') {
      return (
        <span className="notesCell cancelled_class">
          <img src={cancel_class} alt="Cancelled Class" />
          Cancelled Class
        </span>
      );
    } else if (row.original.contactMethod === 'attended_class') {
      return (
        <span className="notesCell attended_class">
          <img src={attended_class} alt="Attended Class" />
          Attended Class
        </span>
      );
    } else if (row.original.contactMethod === 'noshow_class') {
      return (
        <span className="notesCell noshow_class">
          <img src={noshow_class} alt="Class No Show" />
          Class No Show
        </span>
      );
    } else {
      return <span className="notesCell"></span>;
    }
  }

  formatNoteCell(row) {
    if (!row.original.note) {
      return '';
    }

    return row.original.note.replaceAll('<br>', ' ');
  }
  formatSubmitterCell(row) {
    if (!row.original.submitter) {
      return '';
    }

    return row.original.submitter;
  }
  formatDeleteCell(cellInfo) {
    return (
      <span>
        {' '}
        {cellInfo.original.contactMethod === 'intro_class' &&
          moment(cellInfo.original.contactDate, 'YYYY-MM-DD HH:mm').isAfter(
            moment(),
          ) && (
            <span
              className="cancelTrial"
              onClick={async e => {
                console.log(
                  e.currentTarget.getAttribute('noteDate') +
                    ' ' +
                    e.currentTarget.getAttribute('noteType'),
                );
                if (
                  await confirm(
                    <span>
                      <span>
                        Are you sure you want to CANCEL this Trial Class?
                      </span>
                      <table>
                        <tbody>
                          <tr>
                            <td>Date:</td>
                            <td>
                              {moment(
                                cellInfo.original.contactDate,
                                'YYYY-MM-DD HH:mm',
                              ).format('lll')}
                            </td>
                          </tr>
                          <tr>
                            <td>Type:</td>
                            <td>
                              {convertContactType(
                                cellInfo.original.contactMethod,
                              )}
                            </td>
                          </tr>
                          <tr>
                            <td>Note:</td>
                            <td>{cellInfo.original.note}</td>
                          </tr>
                          <tr>
                            <td>Reason:</td>
                            <td>
                              <textarea id="cancelTrialReason"> </textarea>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </span>,
                  )
                ) {
                  let history = getJson(this.state.leadItem.values['History']);
                  let historyItem = history.filter(element => {
                    return (
                      element.contactDate === cellInfo.original.contactDate &&
                      element.contactMethod ===
                        cellInfo.original.contactMethod &&
                      element.note === cellInfo.original.note
                    );
                  });
                  historyItem[0].contactMethod = 'cancelled_class';
                  historyItem[0].note =
                    historyItem[0].note +
                    '<br> Trial Class:' +
                    moment(historyItem[0].contactDate).format('L h:mm A');
                  historyItem[0].note =
                    historyItem[0].note +
                    '<br> Class Cancelled:' +
                    moment().format('lll');
                  if (
                    $('#cancelTrialReason')
                      .val()
                      .trim() !== ''
                  ) {
                    historyItem[0].note =
                      historyItem[0].note +
                      '<br> Reason:' +
                      $('#cancelTrialReason')
                        .val()
                        .trim();
                  }
                  console.log(history);
                  this.saveCancelTrialNote(
                    history,
                    cellInfo.original.contactMethod,
                    cellInfo.original.contactDate,
                    cellInfo.original.note,
                  );
                }
              }}
            >
              <SVGInline svg={cancelClassIcon} className="icon" />
            </span>
          )}
        <span
          className="deleteNote"
          onClick={async e => {
            console.log(
              e.currentTarget.getAttribute('noteDate') +
                ' ' +
                e.currentTarget.getAttribute('noteType'),
            );
            if (
              await confirm(
                <span>
                  <span>Are you sure you want to DELETE this Note?</span>
                  <table>
                    <tbody>
                      <tr>
                        <td>Date:</td>
                        <td>
                          {moment(
                            cellInfo.original.contactDate,
                            'YYYY-MM-DD HH:mm',
                          ).format('lll')}
                        </td>
                      </tr>
                      <tr>
                        <td>Type:</td>
                        <td>
                          {convertContactType(cellInfo.original.contactMethod)}
                        </td>
                      </tr>
                      <tr>
                        <td>Note:</td>
                        <td>{cellInfo.original.note}</td>
                      </tr>
                    </tbody>
                  </table>
                </span>,
              )
            ) {
              let history = getJson(this.state.leadItem.values['History']);
              history = history.filter(element => {
                return !(
                  element.contactDate === cellInfo.original.contactDate &&
                  element.contactMethod === cellInfo.original.contactMethod &&
                  element.note === cellInfo.original.note
                );
              });
              console.log(history);
              this.saveRemoveLeadNote(history);
            }
          }}
        >
          <SVGInline svg={binIcon} className="icon" />
        </span>
      </span>
    );
  }

  render() {
    return (
      <div
        className={
          this.props.leadItem.values['Lead State'] === 'Converted'
            ? 'container-fluid converted'
            : 'container-fluid'
        }
        id="noteDetailDiv"
      >
        <StatusMessagesContainer />
        <div className="card">
          <div className="card-header card-subtitle mb-2 text-muted">
            {this.state.latestHistory !== undefined
              ? this.state.latestHistory.note
              : ''}
          </div>
          <div className="card-body" style={{ padding: '20px' }}>
            <div className="row">
              <div className="col-md-6 text-center">
                <span className="float-md-left">
                  <div
                    style={{
                      fontFamily: 'Arial-BoldMT, "Arial Bold", Arial',
                      fontWeight: '700',
                      fontStyle: 'normal',
                      fontSize: '24px',
                      color: '#333333',
                    }}
                  >
                    {this.props.leadItem.values['First Name']}
                    &nbsp;
                    {this.props.leadItem.values['Last Name']}
                    {(this.props.leadItem.values['Parent or Guardian'] !==
                      undefined ||
                      this.props.leadItem.values['Parent or Guardian'] !==
                        null) &&
                    this.props.leadItem.values['ParentMember'] !== undefined &&
                    this.props.leadItem.values['ParentMember'] !== null ? (
                      <span>
                        <NavLink
                          to={`/Member/${this.props.leadItem.values['ParentMember']}`}
                          className={'nav-link icon-wrapper'}
                          activeClassName="active"
                          style={{ display: 'inline' }}
                        >
                          &nbsp;(
                          {this.props.leadItem.values['Parent or Guardian']})
                        </NavLink>
                      </span>
                    ) : null}
                    {(this.props.leadItem.values['Parent or Guardian'] !==
                      undefined ||
                      this.props.leadItem.values['Parent or Guardian'] !==
                        null) &&
                    this.props.leadItem.values['ParentLead'] !== undefined &&
                    this.props.leadItem.values['ParentLead'] !== null ? (
                      <span>
                        <NavLink
                          to={`/LeadDetail/${this.props.leadItem.values['ParentLead']}`}
                          className={'nav-link icon-wrapper'}
                          activeClassName="active"
                          style={{ display: 'inline' }}
                        >
                          &nbsp;(
                          {this.props.leadItem.values['Parent or Guardian']})
                        </NavLink>
                      </span>
                    ) : null}
                    {this.props.leadItem.values['Parent or Guardian'] !==
                      undefined &&
                    this.props.leadItem.values['Parent or Guardian'] !== null &&
                    (this.props.leadItem.values['ParentLead'] === undefined ||
                      this.props.leadItem.values['ParentLead'] === null) &&
                    (this.props.leadItem.values['ParentMember'] === undefined ||
                      this.props.leadItem.values['ParentMember'] === null) ? (
                      <span>
                        &nbsp;(
                        {this.props.leadItem.values['Parent or Guardian']})
                      </span>
                    ) : null}
                    -&nbsp;[
                    {this.props.leadItem.values['Status']}]
                  </div>
                  <div>
                    <img
                      src={phone}
                      alt="Phone"
                      style={{ border: 'none', marginRight: '5px' }}
                    />
                    <span>{this.props.leadItem.values['Phone Number']}</span>
                    {/*<NumberFormat
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
                          : this.props.space.slug === 'europe' ||
                            this.props.space.slug === 'unitedkingdom'
                          ? getPhoneNumberFormat(this.props.leadItem)
                          : '####-###-###'
                      }
                      mask="_"
                      value={this.props.leadItem.values['Phone Number']}
                    />
                    */}
                  </div>
                </span>
                <span className="setStatus">
                  <a
                    onClick={e => this.props.setShowSetStatusModal(true)}
                    className="btn btn-primary"
                    style={{ marginLeft: '10px', color: 'white' }}
                  >
                    Set Status
                  </a>
                  {this.props.showSetStatusModal && (
                    <SetStatusModalContainer
                      submission={this.props.leadItem}
                      target="Leads"
                      setShowSetStatusModal={this.props.setShowSetStatusModal}
                      setLeadStatus={this.props.saveStatus}
                      profile={this.props.profile}
                      leadStatusValues={this.props.leadStatusValues}
                    />
                  )}
                </span>
              </div>
              <div className="col-md-6 text-center followup">
                <span className="float-md-right">
                  <div
                    type="button"
                    className="attentionRequired"
                    onClick={e => {
                      this.props.updateAttentionRequired();
                    }}
                  >
                    <SVGInline
                      svg={attentionRequired}
                      className={'attention icon'}
                    />
                  </div>
                  <NavLink to={`/LeadEdit/${this.props.leadItem['id']}`}>
                    <img
                      src={lead_dtls}
                      alt="Lead Details"
                      style={{ border: 'none', marginRight: '20px' }}
                      title="Lead Details"
                    />
                  </NavLink>
                  {this.props.leadItem.values['Lead State'] !== 'Converted' && (
                    <NavLink to={`/NewMember/${this.props.leadItem['id']}`}>
                      <img
                        src={convert_to_member}
                        alt="Convert to Member"
                        style={{ border: 'none', marginRight: '20px' }}
                        title="Convert to Member"
                      />
                    </NavLink>
                  )}
                  <NavLink
                    to={`/FollowUp/${this.props.leadItem['id']}`}
                    className="btn btn-primary followup_button followup_image"
                    style={{
                      backgroundColor: '#4d5059',
                      height: '45px',
                      width: '100px',
                      textAlign: 'center',
                    }}
                    title="Set Followup date"
                  >
                    Follow Up
                    <br />
                    {this.props.leadItem &&
                    this.props.leadItem.values['Reminder Date'] !== undefined &&
                    this.props.leadItem.values['Reminder Date'] !== null
                      ? moment(
                          this.props.leadItem.values['Reminder Date'],
                          'YYYY-MM-DDTHH:mm:ssZ',
                        ).format('L')
                      : 'None'}
                  </NavLink>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div id="notesDiv" className="card">
          <div className="card-header">
            <p className="label">
              <b>Contact Notes</b>
            </p>
            <ul
              className="nav nav-tabs card-header-tabs contact-methods"
              role="tablist"
            >
              <li className="nav-item label">Method:</li>
              <li className="nav-item icon phone">
                <a
                  className="nav-link active"
                  title="Phone Contact"
                  data-toggle="tab"
                  href="#method"
                  id="phone_tab"
                  role="tab"
                  aria-controls="contact_method"
                  aria-selected="true"
                  onClick={() => this.handleContactMethodChange('phone')}
                >
                  <img
                    src={phone}
                    alt="Phone Call"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
              <li className="nav-item icon email">
                <a
                  className="nav-link"
                  title="Email Contact"
                  data-toggle="tab"
                  href="#method"
                  id="mail_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('email')}
                >
                  <img src={mail} alt="Email" style={{ border: 'none' }} />
                </a>
              </li>
              <li className="nav-item icon sms">
                <a
                  className="nav-link"
                  title="SMS Contact"
                  data-toggle="tab"
                  href="#method"
                  id="sms_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('sms')}
                >
                  <img src={sms} alt="SMS" style={{ border: 'none' }} />
                </a>
              </li>
              <li className="nav-item icon person">
                <a
                  className="nav-link"
                  title="In Person Contact"
                  data-toggle="tab"
                  href="#method"
                  id="person_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('in_person')}
                >
                  <img
                    src={in_person}
                    alt="In Person"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
              <li className="nav-item icon intro_class">
                <a
                  className="nav-link"
                  title="Introductory Class"
                  data-toggle="tab"
                  href="#method"
                  id="intro_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('intro_class')}
                >
                  <img
                    src={intro_class}
                    alt="Intro Class"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
              <li className="nav-item icon free_class">
                <a
                  className="nav-link"
                  title="Free Class"
                  data-toggle="tab"
                  href="#method"
                  id="free_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('free_class')}
                >
                  <img
                    src={free_class}
                    alt="Free Class"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
              <li className="nav-item icon attended_class">
                <a
                  className="nav-link"
                  title="Attended Class"
                  data-toggle="tab"
                  href="#method"
                  id="attended_tab"
                  role="tab"
                  aria-selected={
                    this.props.leadItem.values['Lead State'] === 'Converted'
                      ? 'true'
                      : ''
                  }
                  aria-controls="contact_method"
                  onClick={() =>
                    this.handleContactMethodChange('attended_class')
                  }
                >
                  <img
                    src={attended_class}
                    alt="Attended Class"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
              <li className="nav-item icon noshow_class">
                <a
                  className="nav-link"
                  title="Class No Show"
                  data-toggle="tab"
                  href="#method"
                  id="attended_tab"
                  role="tab"
                  aria-controls="contact_method"
                  onClick={() => this.handleContactMethodChange('noshow_class')}
                >
                  <img
                    src={noshow_class}
                    alt="Class No Show"
                    style={{ border: 'none' }}
                  />
                </a>
              </li>
            </ul>
            <ul
              className="nav nav-tabs card-header-tabs pull-left contact-method-select"
              role="tablist"
            >
              <li className="nav-item label">{this.state.contactLabel}</li>
              <li className="nav-item date">
                <Datetime
                  className="float-right"
                  dateFormat="L"
                  onChange={this.handleDateChange}
                  defaultValue={moment()}
                />
                {this.state.contactDate === 'Invalid date' && (
                  <span className="invaliddate">Invalid Date</span>
                )}
              </li>
              <li className="sendEmail">
                <NavLink
                  to={`/NewEmailCampaign/lead/${this.props.leadItem['id']}`}
                  className="btn btn-primary"
                >
                  Send Email
                </NavLink>
              </li>
              <li className="sendSMS">
                <a
                  onClick={e => this.props.setShowSMSModal(true)}
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                  disabled={!this.props.isSmsEnabled}
                >
                  Send SMS
                </a>
                {this.props.showSMSModal && (
                  <SMSModalContainer
                    submission={this.props.leadItem}
                    space={this.props.space}
                    profile={this.props.profile}
                    target="Leads"
                    setShowSMSModal={this.props.setShowSMSModal}
                  />
                )}
              </li>
              <li className="viewScript">
                <a
                  onClick={e => this.props.setShowCallScriptModal(true)}
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                >
                  View Call Scripts
                </a>
                {this.props.showCallScriptModal && (
                  <CallScriptModalContainer
                    scriptTarget="Leads"
                    setShowCallScriptModal={this.props.setShowCallScriptModal}
                  />
                )}
              </li>
            </ul>
          </div>
          <div className="card-body">
            <div className="tab-content">
              <div
                className="tab-pane fade show active"
                id="method"
                role="tabpanel"
                aria-labelledby="contact_method"
              >
                <div className="row">
                  <div className="col-sm-11">
                    <textarea
                      id="notes"
                      rows="5"
                      value={this.state.note}
                      onChange={e => this.handleChange('note', e)}
                      placeholder="Start Typing..."
                    />
                  </div>
                  <div className="col-sm-1 notesButton">
                    <button
                      type="button"
                      id="saveNote"
                      className="btn btn-primary btn-block saveNote"
                      disabled={
                        this.state.note === '' ||
                        this.state.contactDate === 'Invalid date'
                      }
                      onClick={async e => {
                        if (this.state.contactMethod === 'intro_class') {
                          if (
                            await confirm(
                              <span>
                                <span>
                                  Are you sure you want to schedule this Intro?
                                  Note, the note will be visible to the Lead.
                                </span>
                                <table>
                                  <tbody>
                                    <tr>
                                      <td>Intro Date:</td>
                                      <td>
                                        {moment(
                                          this.state.contactDate,
                                          'YYYY-MM-DD HH:mm',
                                        ).format('lll')}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Note:</td>
                                      <td>{this.state.note}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </span>,
                            )
                          ) {
                            this.saveNote();
                          }
                        } else if (this.state.contactMethod === 'free_class') {
                          if (
                            await confirm(
                              <span>
                                <span>
                                  Are you sure you want to schedule this Free
                                  Class? Note, the note will be visible to the
                                  Lead.
                                </span>
                                <table>
                                  <tbody>
                                    <tr>
                                      <td>Free Class Date:</td>
                                      <td>
                                        {moment(
                                          this.state.contactDate,
                                          'YYYY-MM-DD HH:mm',
                                        ).format('lll')}
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>Note:</td>
                                      <td>{this.state.note}</td>
                                    </tr>
                                  </tbody>
                                </table>
                              </span>,
                            )
                          ) {
                            this.saveNote();
                          }
                        } else {
                          this.saveNote();
                        }
                      }}
                    >
                      Save Notes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="col-md-12 text-center notesTable">
            <ReactTable
              data={this.state.data}
              columns={this.state.columns}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              SubComponent={row => {
                return (
                  <div
                    style={{ padding: '20px', textAlign: 'left' }}
                    dangerouslySetInnerHTML={{ __html: row.original.note }}
                  ></div>
                );
              }}
            />
          </div>
        </div>
        <div>
          <Requests
            requestContent={this.props.leadItem.requestContent}
            space={this.props.space}
            profile={this.props.profile}
          />
        </div>
        <div>
          <LeadEmails
            leadItem={this.props.leadItem}
            fetchCampaign={this.props.fetchCampaign}
            campaignItem={this.props.campaignItem}
            campaignLoading={this.props.campaignLoading}
            space={this.props.space}
            profile={this.props.profile}
          />
        </div>
        <div>
          <EmailsReceived
            submission={this.props.leadItem}
            space={this.props.space}
            profile={this.props.profile}
          />
        </div>
        <div>
          <LeadSMS
            leadItem={this.props.leadItem}
            space={this.props.space}
            profile={this.props.profile}
          />
        </div>
        <div>
          <LeadOrders
            leadItem={this.props.leadItem}
            space={this.props.space}
            profile={this.props.profile}
            snippets={this.props.snippets}
            refundPOSPayment={this.props.refundPOSPayment}
            refundPOSTransactionInProgress={
              this.props.refundPOSTransactionInProgress
            }
            refundPOSTransactionID={this.props.refundPOSTransactionID}
          />
        </div>
      </div>
    );
  }
}

export const LeadDetailView = ({
  profile,
  leadItem,
  saveLeadNote,
  saveRemoveLeadNote,
  saveCancelTrialNote,
  saveStatus,
  fetchCampaign,
  campaignItem,
  campaignLoading,
  currentLeadLoading,
  setShowCallScriptModal,
  showCallScriptModal,
  setShowSMSModal,
  setShowSetStatusModal,
  showSMSModal,
  showSetStatusModal,
  isSmsEnabled,
  leadStatusValues,
  updateAttentionRequired,
  space,
  snippets,
  journeyTriggers,
  createJourneyEvent,
  createTrialBooking,
  deleteTrialBooking,
  refundPOSPayment,
  refundPOSTransactionInProgress,
  refundPOSTransactionID,
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <LeadDetail
      profile={profile}
      leadItem={leadItem}
      saveLeadNote={saveLeadNote}
      saveRemoveLeadNote={saveRemoveLeadNote}
      saveCancelTrialNote={saveCancelTrialNote}
      saveStatus={saveStatus}
      fetchCampaign={fetchCampaign}
      campaignItem={campaignItem}
      campaignLoading={campaignLoading}
      setShowCallScriptModal={setShowCallScriptModal}
      showCallScriptModal={showCallScriptModal}
      setShowSMSModal={setShowSMSModal}
      showSMSModal={showSMSModal}
      setShowSetStatusModal={setShowSetStatusModal}
      showSetStatusModal={showSetStatusModal}
      isSmsEnabled={isSmsEnabled}
      leadStatusValues={leadStatusValues}
      space={space}
      snippets={snippets}
      journeyTriggers={journeyTriggers}
      createJourneyEvent={createJourneyEvent}
      createTrialBooking={createTrialBooking}
      deleteTrialBooking={deleteTrialBooking}
      updateAttentionRequired={updateAttentionRequired}
      refundPOSPayment={refundPOSPayment}
      refundPOSTransactionInProgress={refundPOSTransactionInProgress}
      refundPOSTransactionID={refundPOSTransactionID}
    />
  );

export const LeadDetailContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('showCallScriptModal', 'setShowCallScriptModal', false),
  withState('showSMSModal', 'setShowSMSModal', false),
  withState('showSetStatusModal', 'setShowSetStatusModal', false),
  withHandlers({
    saveCancelTrialNote: ({
      profile,
      leadItem,
      allLeads,
      updateLead,
      fetchLead,
      journeyTriggers,
      createJourneyEvent,
      deleteTrialBooking,
      addNotification,
      setSystemError,
      space,
      setIsDirty,
    }) => (newHistory, contactType, contactDate, note) => {
      leadItem.values['History'] = newHistory;

      let calendarDeleteEvent = null;

      calendarDeleteEvent = {
        summary:
          leadItem.values['First Name'] +
          ' ' +
          leadItem.values['Last Name'] +
          ' - ' +
          convertContactType(contactType) +
          (note.includes('[') && note.includes(']')
            ? ' ' + note.substring(note.indexOf('['), note.indexOf(']') + 1)
            : ''),
        attendeeEmail: leadItem.values['Email'],
        timeZone: getTimezone(profile.timezone, space.defaultTimezone),
        calendarName: getAttributeValue(space, 'Trial Calendar Name'),
      };
      let startDateTime = moment(contactDate, 'YYYY-MM-DD HH:mm');
      let rfcStartDateTime = startDateTime.utc().format('YYYY-MM-DDTHH:mm:ssZ');

      var triggerIdx = journeyTriggers.findIndex(
        element =>
          element['values']['Record Type'] === 'Lead' &&
          element['values']['Lead Condition'] === 'Trial Class Cancelled' &&
          element['values']['Lead Condition Duration'] === '0',
      );
      if (triggerIdx !== -1) {
        console.log('Creating Journey Event');
        var trigger = journeyTriggers.get(triggerIdx);
        var values = {};
        values['Status'] = 'New';
        values['Trigger ID'] = trigger['id'];
        values['Record Type'] = trigger['values']['Record Type'];
        values['Trigger Date'] = moment().format('YYYY-MM-DD');
        values['Event Source Date'] = startDateTime.format('YYYY-MM-DD');
        values['Record ID'] = leadItem['id'];
        values['Record Name'] =
          leadItem['values']['First Name'] +
          ' ' +
          leadItem['values']['Last Name'];
        values['Action'] = trigger['values']['Action'];
        values['Contact Type'] = trigger['values']['Contact Type'];
        values['Template Name'] = trigger['values']['Template Name'];

        createJourneyEvent({ values });
      }

      if (true) {
        values = {};
        values['Lead ID'] = leadItem['id'];
        values['Trial Datetime'] = startDateTime
          .utc()
          .format('YYYYMMDDTHH:mm:ssZ');

        deleteTrialBooking({ values });
      }

      calendarDeleteEvent.startDateTime = rfcStartDateTime;

      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        allLeads: allLeads,
        myThis: this,
        addNotification,
        setSystemError,
        calendarDeleteEvent,
      });
      setIsDirty(false);
    },
    saveRemoveLeadNote: ({
      profile,
      leadItem,
      allLeads,
      updateLead,
      fetchLead,
      addNotification,
      setSystemError,
      space,
      setIsDirty,
    }) => newHistory => {
      leadItem.values['History'] = newHistory;

      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        allLeads: allLeads,
        //        fetchLead: fetchLead,
        myThis: this,
        addNotification,
        setSystemError,
      });
      setIsDirty(false);
    },
    refundPOSPayment: ({
      leadItem,
      refundPOSTransaction,
      refundPOSTransactionComplete,
      updatePOSOrder,
      incrementPOSStock,
      deletePOSPurchasedItem,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => (
      billingThis,
      orderid,
      paymentId,
      paymentAmount,
      billingChangeReason,
    ) => {
      console.log('### paymentId = ' + paymentId);
      let args = {};
      args.orderid = orderid;
      args.transactionId = paymentId;
      args.refundAmount = paymentAmount;
      args.memberItem = leadItem;
      args.myThis = leadItem.myThis;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;
      args.billingThis = billingThis;
      args.updatePOSOrder = updatePOSOrder;
      args.incrementPOSStock = incrementPOSStock;
      args.deletePOSPurchasedItem = deletePOSPurchasedItem;
      args.refundPOSTransactionComplete = refundPOSTransactionComplete;

      refundPOSTransaction(args);
    },
    saveLeadNote: ({
      profile,
      leadItem,
      allLeads,
      updateLead,
      fetchLead,
      addNotification,
      setSystemError,
      space,
      journeyTriggers,
      createJourneyEvent,
      setIsDirty,
    }) => newHistory => {
      let history = getJson(leadItem.values['History']);
      history.push(newHistory);
      leadItem.values['History'] = history;
      if (
        moment(newHistory.contactDate, contact_date_format).isAfter(
          moment(leadItem.values['Last Contact'], contact_date_format),
        )
      ) {
        leadItem.values['Last Contact'] = newHistory.contactDate;
      }
      let calendarEvent = null;

      if (
        newHistory.contactMethod === 'intro_class' ||
        newHistory.contactMethod === 'free_class'
      ) {
        calendarEvent = {
          summary:
            leadItem.values['First Name'] +
            ' ' +
            leadItem.values['Last Name'] +
            ' - ' +
            convertContactType(newHistory.contactMethod),
          description: newHistory['note'],
          location: getAttributeValue(space, 'School Address'),
          attendeeEmail: leadItem.values['Email'],
          timeZone: getTimezone(profile.timezone, space.defaultTimezone),
          calendarName: getAttributeValue(space, 'Trial Calendar Name'),
        };

        let startDateTime = moment(newHistory.contactDate, 'YYYY-MM-DD HH:mm');
        let endDateTime = startDateTime.clone().add(1, 'hours');
        let rfcStartDateTime = startDateTime
          .utc()
          .format('YYYY-MM-DDTHH:mm:ssZ');
        let rfcEndDateTime = endDateTime.utc().format('YYYY-MM-DDTHH:mm:ssZ');
        calendarEvent.startDateTime = rfcStartDateTime;
        calendarEvent.endDateTime = rfcEndDateTime;

        if (newHistory.contactMethod === 'intro_class') {
          var triggers = journeyTriggers.filter(
            trigger =>
              trigger['values']['Record Type'] === 'Lead' &&
              trigger['values']['Lead Condition'] === 'Intro Class Scheduled' &&
              trigger['values']['Lead Condition Duration'] === '0',
          );
          triggers.forEach(trigger => {
            console.log('Creating Journey Event');
            var values = {};
            values['Status'] = 'New';
            values['Trigger ID'] = trigger['id'];
            values['Record Type'] = trigger['values']['Record Type'];
            values['Trigger Date'] = moment().format('YYYY-MM-DD');
            values['Event Source Date'] = startDateTime.format('YYYY-MM-DD');
            values['Record ID'] = leadItem['id'];
            values['Record Name'] =
              leadItem['values']['First Name'] +
              ' ' +
              leadItem['values']['Last Name'];
            values['Action'] = trigger['values']['Action'];
            values['Contact Type'] = trigger['values']['Contact Type'];
            values['Template Name'] = trigger['values']['Template Name'];

            createJourneyEvent({ values });
          });
        }
      }
      if (newHistory.contactMethod === 'noshow_class') {
        var triggers = journeyTriggers.filter(
          trigger =>
            trigger['values']['Record Type'] === 'Lead' &&
            trigger['values']['Lead Condition'] === 'Intro No Show' &&
            trigger['values']['Lead Condition Duration'] === '0',
        );
        triggers.forEach(trigger => {
          console.log('Creating Journey Event');
          var values = {};
          values['Status'] = 'New';
          values['Trigger ID'] = trigger['id'];
          values['Record Type'] = trigger['values']['Record Type'];
          values['Record ID'] = leadItem['id'];
          values['Record Name'] =
            leadItem['values']['First Name'] +
            ' ' +
            leadItem['values']['Last Name'];
          values['Trigger Date'] = moment().format('YYYY-MM-DD');
          values['Event Source Date'] = moment().format('YYYY-MM-DD');
          values['Action'] = trigger['values']['Action'];
          values['Contact Type'] = trigger['values']['Contact Type'];
          values['Template Name'] = trigger['values']['Template Name'];

          createJourneyEvent({ values });
        });
      }
      /* Leave for now, need to allow selection of Trial Classes
      if (newHistory.contactMethod === 'intro_class') {
        console.log('Creating Trial Booking');
        var values = {};
        values['Lead ID'] = leadItem['id'];
        values['Name'] =
          leadItem['values']['First Name'] +
          ' ' +
          leadItem['values']['Last Name'];
        values['Email'] = leadItem['values']['Email'];
        values['Phone Number'] = leadItem['values']['Phone Number'];
        values['Trial Datetime'] = leadItem['values']['Phone Number'];
        values['Class Title'] = leadItem['values']['Phone Number'];

        createJourneyEvent({ values });
      }
*/
      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        allLeads: allLeads,
        //  fetchLead: fetchLead,
        myThis: this,
        addNotification,
        setSystemError,
        calendarEvent,
      });
      setIsDirty(false);
    },
    updateIsNewReplyReceived: ({
      leadItem,
      allLeads,
      updateLead,
      fetchLeads,
      addNotification,
      setSystemError,
    }) => () => {
      leadItem.values['Is New Reply Received'] = 'false';
      updateLead({
        id: leadItem.id,
        leadItem,
        allLeads,
        //fetchLeads,
        addNotification,
        setSystemError,
      });
    },
    updateAttentionRequired: ({
      leadItem,
      allLeads,
      updateLead,
      fetchLeads,
      addNotification,
      setSystemError,
    }) => () => {
      leadItem.values['Is New Reply Received'] = 'true';
      updateLead({
        id: leadItem.id,
        leadItem,
        allLeads,
        //fetchLeads,
        addNotification,
        setSystemError,
      });
    },
    saveStatus: ({ leadItem, allLeads, updateLead }) => () => {
      updateLead({
        id: leadItem.id,
        leadItem,
        allLeads,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchLead({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchLead({
          id: nextProps.match.params['id'],
          myThis: this,
          history: nextProps.history,
        });
      }

      if (
        nextProps.leadItem.values &&
        nextProps.leadItem['id'] !== this.props.leadItem['id'] &&
        nextProps.leadItem.values['Is New Reply Received'] === 'true'
      ) {
        this.props.updateIsNewReplyReceived();
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('leads');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);

      if (this.props.allLeads.length === 0) {
        this.props.fetchLeads();
      }
    },
    componentWillUnmount() {},
  }),
)(LeadDetailView);

class LeadEmails extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.leadItem);
    this._columns = this.getColumns();
    this.getCampaign = this.getCampaign.bind(this);
    this.substituteFields = this.substituteFields.bind(this);
    this.state = {
      data,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.leadItem) {
      this.setState({
        data: this.getData(nextProps.leadItem),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchCampaign({ setDummy: true });
  }

  getColumns() {
    return [
      {
        accessor: 'Subject',
        Header: 'Subject',
        width: 600,
        style: { whiteSpace: 'unset' },
      },
      { accessor: 'Sent Date Formatted', Header: 'Sent Date' },
    ];
  }

  getData(leadItem) {
    let emails = leadItem.emailsSent;
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    emails = emails.sort(function(email1, email2) {
      if (
        moment(email1['Sent Date'], email_date_format).isAfter(
          moment(email2['Sent Date'], email_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(email1['Sent Date'], email_date_format).isBefore(
          moment(email2['Sent Date'], email_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });

    emails.forEach(email => {
      email['Sent Date Formatted'] = moment(
        email['Sent Date'],
        email_date_format,
      ).format('L HH:mm');
    });
    return emails;
  }

  getCampaign(campaignId) {
    this.props.fetchCampaign({ id: campaignId, history: this.props.history });
  }
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }
  substituteFields(body) {
    if (body === undefined) return '';
    body = body.replace(
      /\${submitterName}/g,
      this.props.campaignItem.createdBy,
    );
    body = body.replace(
      /member\('First Name'\)/g,
      this.props.leadItem.values['First Name'],
    );
    body = body.replace(
      /member\('Last Name'\)/g,
      this.props.leadItem.values['Last Name'],
    );
    var matches = body.match(/\$\{.*?\('(.*?)'\)\}/g);
    var self = this;
    if (matches !== null) {
      matches.forEach(function(value, index) {
        console.log(value);
        if (value.indexOf('spaceAttributes') !== -1) {
          body = body.replace(
            new RegExp(self.escapeRegExp(value), 'g'),
            self.props.space.attributes[value.split("'")[1]][0],
          );
        }
      });
    }
    return body;
  }
  render() {
    return (
      <div className="row">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>Emails Sent</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
              expanded={this.state.expandedRows}
              onExpandedChange={(newExpanded, index) => {
                let rows = [];
                if (newExpanded[index]) {
                  rows[index] = true;
                  this.getCampaign(this.state.data[index]['Campaign Id']);
                }
                this.setState({
                  expandedRows: rows,
                });
              }}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    <div id={row.original['Campaign Id']}>
                      {this.props.campaignLoading ? (
                        <div>Loading... </div>
                      ) : (
                        <div style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Viewed:</label>
                            </div>
                            <div className="col-sm-8">
                              {this.props.campaignItem !== undefined &&
                              this.props.campaignItem.values[
                                'Opened By Members'
                              ] !== undefined
                                ? this.props.campaignItem.values[
                                    'Opened By Members'
                                  ].indexOf(this.props.leadItem.id) !== -1
                                  ? 'Yes'
                                  : 'No'
                                : 'No'}
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Subject:</label>
                            </div>
                            <div className="col-sm-8">
                              {this.props.campaignItem.values['Subject']}
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Sent Date:</label>
                            </div>
                            <div className="col-sm-8">
                              {this.props.campaignItem.values['Sent Date']}
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Content:</label>
                            </div>
                          </div>
                          <div
                            className="row"
                            style={{ marginLeft: '20px', marginRight: '0' }}
                          >
                            <div
                              className="emailBodyView"
                              style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}
                            >
                              <span
                                dangerouslySetInnerHTML={{
                                  __html: this.substituteFields(
                                    this.props.campaignItem.values['Body'],
                                  ),
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }}
            />
          </span>
        </div>
      </div>
    );
  }
}

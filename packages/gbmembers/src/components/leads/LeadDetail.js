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
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import {
  contact_date_format,
  email_sent_date_format,
  reminder_date_format,
} from '../leads/LeadsUtils';
import lead_dtls from '../../images/lead_details.png';
import convert_to_member from '../../images/convert_to_member.png';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import in_person from '../../images/in_person.png';
import intro_class from '../../images/intro_class.png';
import free_class from '../../images/free_class.png';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import ReactTable from 'react-table';
import 'react-datetime/css/react-datetime.css';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import ReactSpinner from 'react16-spinjs';
import { CallScriptModalContainer } from '../Member/CallScriptModalContainer';
import { SMSModalContainer } from '../Member/SMSModalContainer';
import { EmailsReceived } from '../Member/EmailsReceived';
import { Requests } from '../Member/Requests';

const mapStateToProps = state => ({
  profile: state.app.profile,
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  campaignItem: state.member.campaigns.campaignItem,
  campaignLoading: state.member.campaigns.campaignLoading,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  fetchCampaign: campaignActions.fetchCampaign,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
};

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
    this.saveLead = this.props.saveLead;
    let profile = this.props.profile;
    let contactMethod = 'phone';
    let contactLabel = 'Phone Call';
    let note = undefined;
    let contactDate = moment().format(contact_date_format);
    let latestHistory = getLatestHistory(this.props.leadItem.values['History']);
    this.handleDateChange = this.handleDateChange.bind(this);

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
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      latestHistory: getLatestHistory(nextProps.leadItem.values['History']),
      data: this.getData(nextProps.leadItem),
      columns: this.getColumns(),
    });
  }

  handleContactMethodChange(method) {
    var label = '';
    switch (method) {
      case 'phone':
        label = 'Phone Call';
        break;
      case 'email':
        label = 'Email';
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
      default:
    }
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
      submitter: this.state.profile.displayName,
      note: this.state.note,
      contactMethod: this.state.contactMethod,
      contactDate: this.state.contactDate,
    };
    this.saveLead(newHistory);
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
      width: 150,
      Cell: row => moment(row.original.contactDate).format('MMM Do:h:hh A'),
    });
    columns.push({
      accessor: 'submitter',
      width: 150,
      Cell: row => this.formatSubmitterCell(row),
    });

    return columns;
  }

  getData(leadItem) {
    let histories = getJson(leadItem.values['History']).map(history => {
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
    }
  }

  formatNoteCell(row) {
    if (!row.original.note) {
      return '';
    }

    return row.original.note;
  }
  formatSubmitterCell(row) {
    if (!row.original.submitter) {
      return '';
    }

    return row.original.submitter;
  }

  render() {
    return (
      <div className="container-fluid" id="noteDetailDiv">
        <StatusMessagesContainer />
        <div className="card">
          <div className="card-header card-subtitle mb-2 text-muted">
            {this.state.latestHistory.note}
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
                  </div>
                  <div>
                    <img
                      src={phone}
                      alt="Phone"
                      style={{ border: 'none', marginRight: '5px' }}
                    />
                    {this.props.leadItem.values['Phone Number']}
                  </div>
                </span>
              </div>
              <div className="col-md-6 text-center">
                <span className="float-md-right">
                  <NavLink to={`/LeadEdit/${this.props.leadItem['id']}`}>
                    <img
                      src={lead_dtls}
                      alt="Lead Details"
                      style={{ border: 'none', marginRight: '20px' }}
                      title="Lead Details"
                    />
                  </NavLink>
                  <NavLink to={`/NewMember/${this.props.leadItem['id']}`}>
                    <img
                      src={convert_to_member}
                      alt="Convert to Member"
                      style={{ border: 'none', marginRight: '20px' }}
                      title="Convert to Member"
                    />
                  </NavLink>
                  <NavLink
                    to={`/FollowUp/${this.props.leadItem['id']}`}
                    className="btn btn-primary followup_button followup_image"
                    style={{
                      backgroundColor: '#991B1E',
                      height: '45px',
                      width: '100px',
                      textAlign: 'center',
                    }}
                    title="Set Followup date"
                  >
                    Follow Up
                    <br />
                    {this.props.leadItem
                      ? moment(
                          this.props.leadItem.values['Reminder Date'],
                          'YYYY-MM-DD',
                        ).format('DD MMM YYYY')
                      : ''}
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
              <li className="nav-item icon">
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
              <li className="nav-item icon">
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
              <li className="nav-item icon">
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
              <li className="nav-item icon">
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
              <li className="nav-item icon">
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
            </ul>
            <ul
              className="nav nav-tabs card-header-tabs pull-left contact-method-select"
              role="tablist"
            >
              <li className="nav-item label">{this.state.contactLabel}</li>
              <li className="nav-item date">
                <Datetime
                  className="float-right"
                  onChange={this.handleDateChange}
                  defaultValue={moment()}
                />
              </li>
              <li>
                <NavLink
                  to={`/NewManualCampaign/${this.props.leadItem['id']}/lead`}
                  className="btn btn-primary"
                >
                  Send Email
                </NavLink>
              </li>
              <li>
                <a
                  onClick={e => this.props.setShowSMSModal(true)}
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                >
                  Send SMS
                </a>
                {this.props.showSMSModal && (
                  <SMSModalContainer
                    submission={this.props.leadItem}
                    target="Leads"
                    setShowSMSModal={this.props.setShowSMSModal}
                  />
                )}
              </li>
              <li>
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
                      onClick={e => this.saveNote()}
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
          <div className="col-md-12 text-center" id="notesDiv">
            <ReactTable
              data={this.state.data}
              columns={this.state.columns}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    {row.original.note}
                  </div>
                );
              }}
            />
          </div>
        </div>
        <div>
          <LeadEmails
            leadItem={this.props.leadItem}
            fetchCampaign={this.props.fetchCampaign}
            campaignItem={this.props.campaignItem}
            campaignLoading={this.props.campaignLoading}
            space={this.state.space}
          />
        </div>
        <div>
          <EmailsReceived submission={this.props.leadItem} />
        </div>
        <div>
          <Requests submission={this.props.leadItem} />
        </div>
      </div>
    );
  }
}

export const LeadDetailView = ({
  profile,
  leadItem,
  saveLead,
  fetchCampaign,
  campaignItem,
  campaignLoading,
  currentLeadLoading,
  setShowCallScriptModal,
  showCallScriptModal,
  setShowSMSModal,
  showSMSModal,
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <LeadDetail
      profile={profile}
      leadItem={leadItem}
      saveLead={saveLead}
      fetchCampaign={fetchCampaign}
      campaignItem={campaignItem}
      campaignLoading={campaignLoading}
      setShowCallScriptModal={setShowCallScriptModal}
      showCallScriptModal={showCallScriptModal}
      setShowSMSModal={setShowSMSModal}
      showSMSModal={showSMSModal}
    />
  );

export const LeadDetailContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('showCallScriptModal', 'setShowCallScriptModal', false),
  withState('showSMSModal', 'setShowSMSModal', false),
  withHandlers({
    saveLead: ({ profile, leadItem, updateLead, fetchLead }) => newHistory => {
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
      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        fetchLead: fetchLead,
        myThis: this,
      });
    },
    updateIsNewReplyReceived: ({
      leadItem,
      updateLead,
      fetchLeads,
      addNotification,
      setSystemError,
    }) => () => {
      leadItem.values['Is New Reply Received'] = false;
      updateLead({
        id: leadItem.id,
        leadItem,
        //fetchLeads,
        addNotification,
        setSystemError,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchLead({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchLead({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
        });
      }

      if (
        nextProps.leadItem.values &&
        nextProps.leadItem.values['Is New Reply Received'] === 'true'
      ) {
        this.props.updateIsNewReplyReceived();
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
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

  componentWillReceiveProps(nextProps) {
    if (nextProps.leadItem) {
      this.setState({
        data: this.getData(nextProps.leadItem),
      });
    }
  }

  componentWillMount() {
    this.props.fetchCampaign({ setDummy: true });
  }

  getColumns() {
    return [
      {
        accessor: 'Subject',
        Header: 'Subject',
        width: 600,
        style: { whiteSpace: 'unset' },
        Cell: row => (
          <span>
            <a
              href="javascript:;"
              onClick={() => this.getCampaign(row.original['Campaign Id'])}
            >
              {row.original['Subject']}
            </a>
          </span>
        ),
      },
      { accessor: 'Sent Date', Header: 'Sent Date' },
    ];
  }

  getData(leadItem) {
    let emails = leadItem.emailsSent;
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    return emails.sort(function(email1, email2) {
      if (
        moment(email1['Sent Date'], email_sent_date_format).isAfter(
          moment(email2['Sent Date'], email_sent_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(email1['Sent Date'], email_sent_date_format).isBefore(
          moment(email2['Sent Date'], email_sent_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
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
        <div className="col-sm-6">
          <span style={{ width: '100%' }}>
            <h3>Emails Sent</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
            />
          </span>
        </div>
        <div className="col-sm-6">
          <h3>&nbsp;</h3>
          {this.props.campaignLoading ? (
            <div>Loading... </div>
          ) : (
            <div style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}>
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
                <div
                  className="col-sm-8"
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
  }
}

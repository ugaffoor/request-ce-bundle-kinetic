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
import { contact_date_format } from './LeadsUtils';
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
import { actions as dataStoreActions} from '../../redux/modules/settingsDatastore';
import Select from 'react-select';
const globals = import('common/globals');
import { CoreForm } from 'react-kinetic-core';
import { PageTitle } from 'common';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';

const mapStateToProps = state => ({
  profile: state.app.profile,
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  callScripts: state.member.datastore.callScripts,
  callScriptsLoading: state.member.datastore.callScriptsLoading
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  fetchCallScripts: dataStoreActions.fetchCallScripts
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
    this.setShowCallScriptModal = this.setShowCallScriptModal.bind(this);

    this.state = {
      profile,
      contactMethod,
      contactLabel,
      note,
      contactDate,
      latestHistory,
      data,
      columns,
      showCallScriptModal: false
    };
  }

  componentWillReceiveProps(nextProps) {
    console.log("### props = " + util.inspect(nextProps));
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
  setShowCallScriptModal(flag) {
    this.setState({
      showCallScriptModal: flag
    });
  }

  render() {
    return (
      <span>
      {this.state.showCallScriptModal &&
        <ScriptFormContainer
          getCallScripts={this.props.getCallScripts}
          callScripts={this.props.callScripts}
          callScriptsLoading={this.props.callScriptsLoading}
          setShowCallScriptModal={this.setShowCallScriptModal}
        />
      }
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
                    {this.props.leadItem.values['Phone']}
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
                onClick={e => this.setShowCallScriptModal(true)}
                className="btn btn-primary"
                style={{marginLeft: '10px', color: 'white'}}>
                View Call Scripts
                </a>
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
      </div>
      </span>
    );
  }
}

export const LeadDetailView = ({
  profile,
  leadItem,
  saveLead,
  currentLeadLoading,
  callScripts,
  callScriptsLoading,
  getCallScripts
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <LeadDetail profile={profile} leadItem={leadItem} saveLead={saveLead}
     getCallScripts={getCallScripts} callScripts={callScripts}
     callScriptsLoading={callScriptsLoading}/>
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
    getCallScripts: ({ fetchCallScripts }) => () => {
      fetchCallScripts();
    }
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
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(LeadDetailView);

export class CallScriptModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowCallScriptModal(false);
  };
  constructor(props) {
    super(props);
    this.getOptions = this.getOptions.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);

    this.state = {
      selectedOption: null,
      options: this.getOptions(this.props.callScripts)
    }
  }
  componentWillReceiveProps(nextProps) {
    if (this.props.callScripts.length !== nextProps.callScripts.length) {
      this.setState({
        options: this.getOptions(nextProps.callScripts)
      });
    }
  }
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
    this.props.getCallScripts();
  }

  getOptions(callScripts) {
    let options = [];
    if (!callScripts || callScripts.length <= 0) {
      return [];
    } else {
      callScripts.forEach(script => {
        if (script.values['Target'] === 'Leads') {
          options.push({value: script['id'], label: script.values['Script Name']});
        }
      });
      return options;
    }
  }

  handleOptionChange = (selectedOption) => {
    let selectedScript = null;
    if (selectedOption) {
      selectedScript = this.props.callScripts.find(script => script['id'] === selectedOption.value);
    }

    this.setState({
      selectedOption:  selectedOption,
      selectedScript: selectedScript
    });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog className="call-scripts-modal" onClose={this.handleClose}>
          {this.props.callScriptsLoading ? <div>Loading ... <ReactSpinner /></div>:
          <div>
          <div className="row">
          <div className="col-md-12" style={{margin:'10px'}}>
            <Select
            value={this.state.selectedOption}
            onChange={this.handleOptionChange}
            options={this.state.options}
            isClearable={true}
            className="script-dropdown"
            placeholder="Select script"
            />
          </div>
          </div>
          <div className="row">
          <div className="col-md-12">
          <span className="services-color-bar services-color-bar__blue-slate" />
          {this.state.selectedOption && this.state.selectedScript &&
          <div className="page-container page-container--services-form">
            <div className="embedded-core-form--wrapper">
              <div className="form-group col-xs-4 col-md-12">
                  <label htmlFor="name" className="control-label">Target</label>
                  <span className="form-control">{this.state.selectedScript.values['Target']}</span>
              </div>
              <div className="form-group col-xs-4 col-md-12">
                  <label htmlFor="name" className="control-label">Script Name</label>
                  <span className="form-control">{this.state.selectedScript.values['Script Name']}</span>
              </div>
              <div className="form-group col-xs-4 col-md-12">
                  <label htmlFor="name" className="control-label">Script</label>
                  <div className="form-control" style={{overflowY: 'scroll', height: '400px'}} dangerouslySetInnerHTML={{ __html: this.state.selectedScript.values['Script'] }}></div>
              </div>
            </div>
          </div>}
        </div>
        </div>
        </div>}
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

export const handleLoaded = props => form => {
}
const enhance = compose(
  withHandlers({ handleLoaded }),
);
export const ScriptFormContainer = enhance(CallScriptModal);

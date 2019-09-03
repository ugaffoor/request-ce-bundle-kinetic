import React, { Component } from 'react';
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
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleFormattedChange,
  getReminderDate,
  contact_date_format,
} from './LeadsUtils';
import moment from 'moment';
import 'react-datetime/css/react-datetime.css';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.newLead,
  programs: state.member.app.programs,
  newLeadLoading: state.member.leads.newLeadLoading,
  allLeads: state.member.leads.allLeads,
});
const mapDispatchToProps = {
  createLead: actions.createLead,
  fetchNewLead: actions.fetchNewLead,
  fetchLeads: actions.fetchLeads,
};

const Datetime = require('react-datetime');
export class LeadNew extends Component {
  constructor(props) {
    super(props);
    this.saveLead = this.props.saveLead;
    this.setIsDirty = this.props.setIsDirty;
    this.handleContactDateChange = this.handleContactDateChange.bind(this);

    let reminderDateString;
    let reminderDate = moment().format('YYYY-MM-DD');
    let contactMethod;
    let contactDate = moment().format(contact_date_format);
    let note;

    this.state = {
      contactMethod,
      contactDate,
      note,
      reminderDateString,
      reminderDate,
    };
  }

  handleChange(key, event) {
    let val = event.target.value;
    if (key === 'contactMethod') {
      this.setState({
        contactMethod: val,
      });
    } else if (key === 'note') {
      this.setState({
        note: val,
      });
    } else if (key === 'reminderDateString') {
      this.setState({
        reminderDateString: val,
      });
    } else if (key === 'reminderDate') {
      this.setState({
        reminderDate: moment(val).format('YYYY-MM-DD'),
      });
    }

    if ($(event.target).attr('required')) {
      if (val === undefined || val === null || val === '') {
        $(event.target)
          .siblings('label')
          .attr('required', 'required');
      } else {
        $(event.target)
          .siblings('label')
          .removeAttr('required');
        $(event.target).css('border-color', '');
      }
    }
  }

  handleContactDateChange(date) {
    console.log(
      'handleDateChange # date = ' + moment(date).format(contact_date_format),
    );
    this.setState({
      contactDate: moment(date).format(contact_date_format),
    });
  }

  saveLeadWithHistory() {
    if (
      this.state.reminderDateString === 'Custom' &&
      !this.state.reminderDate
    ) {
      return;
    }
    let newHistory = [
      {
        note: this.state.note,
        contactMethod: this.state.contactMethod,
        contactDate: this.state.contactDate,
      },
    ];
    this.saveLead(
      this.props.leadItem,
      newHistory,
      this.state.reminderDateString,
      this.state.reminderDate,
    );
  }

  render() {
    return (
      <div className="leadEditDetails memberEditDetails">
        <StatusMessagesContainer />
        <div className="general">
          <div className="userDetails">
            <div className="section1">
              <h3>Add New Lead</h3>
              <hr />
              <span className="line">
                <div
                  className="form-group form-inline"
                  style={{ width: 'auto' }}
                >
                  <label
                    htmlFor="source"
                    required={
                      this.props.leadItem.values['Source'] === undefined
                        ? true
                        : false
                    }
                  >
                    Lead referred via:
                  </label>
                  <select
                    name="source"
                    id="source"
                    className="form-group"
                    style={{ marginLeft: '10px' }}
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Source']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Source', e)
                    }
                  >
                    <option value="" />
                    <option value="Facebook">Facebook</option>
                    <option value="Twitter">Twitter</option>
                    <option value="Google+">Google+</option>
                    <option value="Linkedin">Linkedin</option>
                    <option value="Family">Family</option>
                    <option value="Friend">Friend</option>
                    <option value="Magazine">Magazine</option>
                    <option value="Newspaper">Newspaper</option>
                    <option value="Television">Television</option>
                    <option value="Brochure">Brochure</option>
                    <option value="Leaflet">Leaflet</option>
                    <option value="Poster">Poster</option>
                    <option value="Phone Call">Phone Call</option>
                    <option value="Website">Website</option>
                    <option value="Word of Mouth">Word of Mouth</option>
                    <option value="Walk-In">Walk-In</option>
                    <option value="Other Advertising">Other Advertising</option>
                  </select>
                  <span className="droparrow" />
                </div>
                <div
                  className="form-group form-inline"
                  style={{ width: 'auto', margin: '15px 3px !important' }}
                >
                  <label
                    htmlFor="date"
                    required={
                      this.props.leadItem.values['Date'] === undefined
                        ? true
                        : false
                    }
                  >
                    On
                  </label>
                  <input
                    type="date"
                    name="date"
                    id="date"
                    style={{ marginLeft: '10px' }}
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Date']}
                    onChange={e => handleChange(this.props.leadItem, 'Date', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="firstName"
                    required={
                      this.props.leadItem.values['First Name'] === undefined
                        ? true
                        : false
                    }
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['First Name']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'First Name', e)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    required={
                      this.props.leadItem.values['Last Name'] === undefined
                        ? true
                        : false
                    }
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastNames"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Last Name']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Last Name', e)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="gender"
                    required={
                      this.props.leadItem.values['Gender'] === undefined
                        ? true
                        : false
                    }
                  >
                    Gender
                  </label>
                  <select
                    name="gender"
                    id="gender"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Gender']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Gender', e)
                    }
                  >
                    <option value="" />
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="address"
                    required={
                      this.props.leadItem.values['Address'] === undefined
                        ? true
                        : false
                    }
                  >
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    size="80"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Address']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Address', e)
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="suburb"
                    required={
                      this.props.leadItem.values['Suburb'] === undefined
                        ? true
                        : false
                    }
                  >
                    Suburb
                  </label>
                  <input
                    type="text"
                    name="suburb"
                    id="suburb"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Suburb']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Suburb', e)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="State"
                    required={
                      this.props.leadItem.values['State'] === undefined
                        ? true
                        : false
                    }
                  >
                    State
                  </label>
                  <select
                    name="state"
                    id="state"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['State']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'State', e)
                    }
                  >
                    <option value="" />
                    <option value="ACT">ACT</option>
                    <option value="NSW">NSW</option>
                    <option value="NT">NT</option>
                    <option value="QLD">QLD</option>
                    <option value="TAS">TAS</option>
                    <option value="VIC">VIC</option>
                    <option value="WA">WA</option>
                  </select>
                  <div className="droparrow" />
                </div>
                <div>
                  <label
                    htmlFor="postcode"
                    required={
                      this.props.leadItem.values['Postcode'] === undefined
                        ? true
                        : false
                    }
                  >
                    Postcode
                  </label>
                  <NumberFormat
                    format="####"
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Postcode']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Postcode',
                        e,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div className="emailDiv">
                  <label
                    htmlFor="email"
                    required={
                      this.props.leadItem.values['Email'] === null
                        ? true
                        : false
                    }
                  >
                    Email
                  </label>
                  <input
                    type="text"
                    name="email"
                    id="email"
                    size="40"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['Email']}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Email', e)
                    }
                  />
                </div>
                <div>
                  <label
                    htmlFor="phone"
                    required={
                      this.props.leadItem.values['Phone Number'] === undefined
                        ? true
                        : false
                    }
                  >
                    Phone
                  </label>
                  <NumberFormat
                    format="(##) ####-####"
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Phone Number']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Phone Number',
                        e,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="birthday">Birthday</label>
                  <input
                    type="date"
                    name="birthday"
                    id="birthday"
                    ref={input => (this.input = input)}
                    defaultValue={this.props.leadItem.values['DOB']}
                    onChange={e => handleChange(this.props.leadItem, 'DOB', e)}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="contactMethod" required>
                    Contact Method
                  </label>
                  <select
                    name="contactMethod"
                    id="contactMethod"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.state.contactMethod}
                    onChange={e => this.handleChange('contactMethod', e)}
                  >
                    <option value="" />
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                    <option value="in_person">In Person</option>
                  </select>
                  <div className="droparrow" />
                </div>
                <div>
                  <label htmlFor="contactDate">Contact Date</label>
                  <Datetime
                    className="float-right"
                    onChange={this.handleContactDateChange}
                    defaultValue={moment()}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="reminderDateString" required>
                    Reminder Date
                  </label>
                  <select
                    id="reminderDateString"
                    name="reminderDateString"
                    required
                    defaultValue={this.props.leadItem.values['Reminder Date']}
                    onChange={e => this.handleChange('reminderDateString', e)}
                  >
                    <option value="" />
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="Next Week">Next Week</option>
                    <option value="Next Month">Next Month</option>
                    <option value="Custom">Custom</option>
                    <option value="Never">Never</option>
                  </select>
                </div>
                {this.state.reminderDateString === 'Custom' && (
                  <div className="float-left">
                    <label htmlFor="reminderDate">&nbsp;</label>
                    <input
                      type="date"
                      name="reminderDate"
                      id="reminderDate"
                      className="float-left"
                      required
                      ref={input => (this.input = input)}
                      defaultValue={this.state.reminderDate}
                      onChange={e => this.handleChange('reminderDate', e)}
                    />
                  </div>
                )}
              </span>
              <span className="line">
                <div>
                  <label htmlFor="program">Interest in Program</label>
                  <select
                    name="program"
                    id="program"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Interest in Program']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Interest in Program',
                        e,
                      )
                    }
                  >
                    <option value="" />
                    {this.props.programs.map(program => (
                      <option key={program.program} value={program.program}>
                        {program.program}
                      </option>
                    ))}
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="sourceReference1">Source Reference 1</label>
                  <input
                    type="text"
                    name="sourceReference1"
                    id="sourceReference1"
                    size="20"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 1']
                    }
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Source Reference 1', e)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="sourceReference2">Source Reference 2</label>
                  <input
                    type="text"
                    name="sourceReference2"
                    id="sourceReference2"
                    size="20"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 2']
                    }
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Source Reference 2', e)
                    }
                  />
                </div>
                <div>
                  <label htmlFor="sourceReference3">Source Reference 3</label>
                  <select
                    name="sourceReference3"
                    id="sourceReference3"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 3']
                    }
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Source Reference 3', e)
                    }
                  >
                    <option value="" />
                    <option value="Adult">Adult</option>
                    <option value="Kids">Kids</option>
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
              <span className="line">
                <div style={{ width: '60%' }}>
                  <label htmlFor="note" required>
                    Contact Note
                  </label>
                  <textarea
                    name="note"
                    id="note"
                    style={{ width: '100%' }}
                    required
                    defaultValue={this.state.note}
                    onChange={e => this.handleChange('note', e)}
                  />
                </div>
              </span>
            </div>
            <div className="section4">
              <span className="line">
                <span className="rightButtons">
                  <NavLink to={`/Leads`} className="btn btn-primary">
                    Cancel
                  </NavLink>
                  <button
                    type="button"
                    id="saveButton"
                    className="btn btn-primary"
                    onClick={e => this.saveLeadWithHistory()}
                  >
                    Save
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const LeadNewView = ({
  leadItem,
  saveLead,
  isDirty,
  programs,
  setIsDirty,
  newLeadLoading,
}) =>
  newLeadLoading ? (
    <div />
  ) : (
    <LeadNew
      leadItem={leadItem}
      saveLead={saveLead}
      programs={programs}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
    />
  );

export const LeadNewContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ leadItem, createLead }) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveLead: ({ createLead, fetchLeads }) => (
      leadItem,
      history,
      reminderDateString,
      reminderDate,
    ) => {
      if ($('label[required]').length > 0) {
        $('label[required]')
          .siblings('input[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('select[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('textarea[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('input[required]')
          .first()
          .focus();
      } else {
        leadItem.values['History'] = history;
        leadItem.values['Last Contact'] = history[0].contactDate;
        if (reminderDateString === 'Custom') {
          leadItem.values['Reminder Date'] = reminderDate;
        } else {
          leadItem.values['Reminder Date'] = getReminderDate(
            reminderDateString,
          );
        }
        leadItem.values['Status'] = 'Open';
        leadItem.values['Date Created'] = moment().format('DD-MM-YYYY');
        //console.log("### saving lead # " + util.inspect(leadItem.values));
        createLead({
          leadItem,
          history: leadItem.history,
          fetchLeads: fetchLeads,
        });
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchNewLead({
        myThis: this,
        history: this.props.history,
        fetchLeads: this.props.fetchLeads,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewLead({
          myThis: this,
          history: this.props.history,
          fetchLeads: this.props.fetchLeads,
        });
      }
      $('.leadEditDetails input').val('');
      $('.leadEditDetails select').val('');
      $(
        '.leadEditDetails input[required],.leadEditDetails select[required]',
      ).each(function() {
        if (
          $(this).val() === undefined ||
          $(this).val() === null ||
          $(this).val() === ''
        ) {
          $(this)
            .siblings('label')
            .attr('required', 'required');
        } else {
          $(this)
            .siblings('label')
            .removeAttr('required');
          $(this).css('border-color', '');
        }
      });
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(LeadNewView);

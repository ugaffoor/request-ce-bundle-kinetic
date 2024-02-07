import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleFormattedChange,
  getReminderDate,
  contact_date_format,
  handleDateChange,
  getDateValue,
  getLocalePreference,
  handleCountryChange,
} from './LeadsUtils';
import { getPhoneNumberFormat } from '../Member/MemberUtils';
import 'react-datetime/css/react-datetime.css';
import { StatusMessagesContainer } from '../StatusMessages';
import Select from 'react-select';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { I18n } from '../../../../app/src/I18nProvider';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.newLead,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  newLeadLoading: state.member.leads.newLeadLoading,
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  leadLastFetchTime: state.member.leads.leadLastFetchTime,
  profile: state.member.kinops.profile,
  leadSourceValues: state.member.app.leadSourceValues,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  createLead: leadsActions.createLead,
  fetchNewLead: leadsActions.fetchNewLead,
  fetchLeads: leadsActions.fetchLeads,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

const Datetime = require('react-datetime');
export class LeadNew extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.saveLead = this.props.saveLead;
    this.setIsDirty = this.props.setIsDirty;
    this.handleContactDateChange = this.handleContactDateChange.bind(this);

    let reminderDateString;
    let reminderDate = moment().format('YYYY-MM-DD');
    let contactMethod;
    let contactDate = moment().format(contact_date_format);
    let note;
    let parentGuardian;
    this.state = {
      contactMethod,
      contactDate,
      note,
      reminderDateString,
      reminderDate,
      parentGuardian,
    };
  }

  getAllLeads() {
    let leadsVals = [];
    this.props.leads.forEach(lead => {
      leadsVals.push({
        label: lead.values['Last Name'] + ' ' + lead.values['First Name'],
        value: lead.id,
      });
    });
    return leadsVals;
  }
  getAllMembers() {
    let membersVals = [];
    this.props.members.forEach(member => {
      membersVals.push({
        label: member.values['Last Name'] + ' ' + member.values['First Name'],
        value: member.id,
      });
    });
    return membersVals;
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
                  className="form-group form-inline leadReferral"
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
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Source', e)
                    }
                  >
                    <option value="" />
                    {this.props.leadSourceValues.map((value, index) => {
                      return (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      );
                    })}
                  </select>
                  <span className="droparrow" />
                </div>
                <div
                  className="form-group form-inline"
                  style={{ width: 'auto', margin: '15px 3px !important' }}
                >
                  <label
                    id="date"
                    htmlFor="date"
                    required={
                      this.props.leadItem.values['Date'] === undefined
                        ? true
                        : false
                    }
                  >
                    On
                  </label>
                  <DayPickerInput
                    name="date"
                    id="date"
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
                    fieldName="Date"
                    required
                    leadItem={this.props.leadItem}
                    onDayPickerHide={handleDateChange}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                    }}
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
                    {getAttributeValue(this.props.space, 'Franchisor') ===
                    'YES' ? (
                      <span>&nbsp;</span>
                    ) : (
                      'First Name'
                    )}
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    disabled={
                      getAttributeValue(this.props.space, 'Franchisor') ===
                      'YES'
                        ? true
                        : false
                    }
                    required={
                      getAttributeValue(this.props.space, 'Franchisor') ===
                      'YES'
                        ? false
                        : true
                    }
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['First Name']}
                    defaultValue={
                      getAttributeValue(this.props.space, 'Franchisor') ===
                      'YES'
                        ? 'GB'
                        : ''
                    }
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
                    {getAttributeValue(this.props.space, 'Franchisor') === 'YES'
                      ? 'School Name'
                      : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastNames"
                    required
                    ref={input => (this.input = input)}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Last Name', e)
                    }
                  />
                </div>
                {getAttributeValue(this.props.space, 'Franchisor') !==
                  'YES' && (
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
                      onChange={e =>
                        handleChange(this.props.leadItem, 'Gender', e)
                      }
                    >
                      <option value="" />
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      {getAttributeValue(
                        this.props.space,
                        'Additional Gender Options',
                      ) === 'YES' && (
                        <option value="Prefer not to answer">
                          Prefer not to answer
                        </option>
                      )}
                      {getAttributeValue(
                        this.props.space,
                        'Additional Gender Options',
                      ) === 'YES' && <option value="Other">Other</option>}
                    </select>
                    <div className="droparrow" />
                  </div>
                )}
              </span>
              <span className="line">
                <div>
                  <label htmlFor="address">Address</label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    size="80"
                    ref={input => (this.input = input)}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Address', e)
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="suburb">
                    <I18n>Suburb</I18n>
                  </label>
                  <input
                    type="text"
                    name="suburb"
                    id="suburb"
                    ref={input => (this.input = input)}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Suburb', e)
                    }
                  />
                </div>
                {getAttributeValue(this.props.space, 'School States', '') ===
                  undefined && (
                  <div>
                    <label htmlFor="country">Country</label>
                    <select
                      name="country"
                      id="country"
                      required
                      ref={input => (this.input = input)}
                      defaultValue={''}
                      onChange={e =>
                        handleCountryChange(this.props.leadItem, 'Country', e)
                      }
                    >
                      <option value="" />
                      {getAttributeValue(this.props.space, 'Countries', '') ===
                      undefined ? (
                        <option value=""></option>
                      ) : (
                        getAttributeValue(this.props.space, 'Countries', '')
                          .split(',')
                          .map(country => {
                            return <option value={country}>{country}</option>;
                          })
                      )}
                    </select>
                    <div className="droparrow" />
                  </div>
                )}
                <div className="state">
                  <label
                    htmlFor="State"
                    required={
                      this.props.leadItem.values['State'] === undefined ||
                      this.props.leadItem.values['State'] === ''
                        ? true
                        : false
                    }
                  >
                    State
                  </label>
                  {getAttributeValue(this.props.space, 'School States', '') ===
                    undefined && (
                    <span>
                      <select
                        name="state"
                        id="state"
                        required
                        ref={input => (this.input = input)}
                        defaultValue={''}
                        onChange={e =>
                          handleChange(this.props.leadItem, 'State', e)
                        }
                      >
                        <option value="" />
                        {this.props.states.split(',').map(state => {
                          return <option value={state}>{state}</option>;
                        })}
                      </select>
                      <div className="droparrow" />
                    </span>
                  )}
                  {getAttributeValue(this.props.space, 'School States', '') !==
                    undefined && (
                    <span>
                      <select
                        name="state"
                        id="state"
                        required
                        ref={input => (this.input = input)}
                        defaultValue={''}
                        onChange={e =>
                          handleChange(this.props.leadItem, 'State', e)
                        }
                      >
                        <option value="" />
                        {getAttributeValue(
                          this.props.space,
                          'School States',
                          '',
                        )
                          .split(',')
                          .map(state => {
                            return <option value={state}>{state}</option>;
                          })}
                      </select>
                      <div className="droparrow" />
                    </span>
                  )}
                </div>
                <div className="postcode">
                  <label htmlFor="postcode">
                    <I18n>Postcode</I18n>
                  </label>
                  {getAttributeValue(this.props.space, 'Postcode Format') ===
                    undefined ||
                  getAttributeValue(this.props.space, 'Postcode Format') ===
                    null ||
                  getAttributeValue(this.props.space, 'Postcode Format') ===
                    '' ? (
                    <input
                      type="text"
                      name="postcode"
                      id="postcode"
                      size="10"
                      ref={input => (this.input = input)}
                      defaultValue={''}
                      onChange={e =>
                        handleChange(this.props.leadItem, 'Postcode', e)
                      }
                    />
                  ) : (
                    <NumberFormat
                      format={
                        getAttributeValue(
                          this.props.space,
                          'Postcode Format',
                        ) !== undefined
                          ? getAttributeValue(
                              this.props.space,
                              'Postcode Format',
                            )
                          : '####'
                      }
                      id="postcode"
                      mask="_"
                      ref={input => (this.input = input)}
                      onValueChange={(values, e) =>
                        handleFormattedChange(
                          values,
                          this.props.leadItem,
                          'Postcode',
                          e,
                        )
                      }
                    />
                  )}
                </div>
              </span>
              <span className="line">
                <div className="emailDiv">
                  <label
                    htmlFor="email"
                    required={
                      getAttributeValue(
                        this.props.space,
                        'Lead Email Required',
                      ) !== undefined &&
                      getAttributeValue(
                        this.props.space,
                        'Lead Email Required',
                      ) === 'False'
                        ? false
                        : this.props.leadItem.values['Email'] === undefined
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
                    required={
                      getAttributeValue(
                        this.props.space,
                        'Lead Email Required',
                      ) !== undefined &&
                      getAttributeValue(
                        this.props.space,
                        'Lead Email Required',
                      ) === 'False'
                        ? false
                        : true
                    }
                    ref={input => (this.input = input)}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Email', e)
                    }
                  />
                </div>
                <div className="emailDiv ml-1">
                  <label htmlFor="additionalEmail">Additional Email</label>
                  <input
                    type="text"
                    name="additionalEmail"
                    id="additionalEmail"
                    size="40"
                    ref={input => (this.input = input)}
                    onChange={e =>
                      handleChange(this.props.leadItem, 'Additional Email', e)
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="phone">Phone</label>
                  <NumberFormat
                    id="phone"
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
                    ref={input => (this.input = input)}
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
                <div>
                  <label htmlFor="additionalPhone">Additional Phone</label>
                  <NumberFormat
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
                    ref={input => (this.input = input)}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Additional Phone Number',
                        e,
                      )
                    }
                  />
                </div>
              </span>
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <div className="sectionParent">
                  <h4>Parent or Guardian</h4>
                  <span className="line">
                    <div className="radioGroup">
                      <label>Lead, Member or Other</label>
                      <br />
                      <label htmlFor="SAFL1B8-13" className="radio">
                        <input
                          id="SAFL1B8-13"
                          name="LeadMemberOther"
                          type="radio"
                          value="Lead"
                          onChange={e =>
                            this.setState({ parentGuardian: 'Lead' })
                          }
                        />
                        Lead
                      </label>
                      <label htmlFor="SAFL1B8-14" className="radio">
                        <input
                          id="SAFL1B8-14"
                          name="LeadMemberOther"
                          type="radio"
                          value="Member"
                          onChange={e =>
                            this.setState({ parentGuardian: 'Member' })
                          }
                        />
                        Member
                      </label>
                      <label htmlFor="SAFL1B8-15" className="radio">
                        <input
                          id="SAFL1B8-15"
                          name="LeadMemberOther"
                          type="radio"
                          value="Other"
                          onChange={e =>
                            this.setState({ parentGuardian: 'Other' })
                          }
                        />
                        Other
                      </label>
                    </div>
                  </span>
                  <span className="line">
                    {this.state.parentGuardian !== 'Lead' ? null : (
                      <Select
                        closeMenuOnSelect={true}
                        options={this.getAllLeads()}
                        className="hide-columns-container"
                        classNamePrefix="hide-columns"
                        placeholder="Select Lead"
                        onChange={e => {
                          handleChange(this.props.leadItem, 'ParentLead', e);
                          this.props.leadItem.values['Parent or Guardian'] =
                            e.label;

                          var idx = this.props.leads.findIndex(
                            lead => lead.id === e.value,
                          );
                          if (idx !== -1) {
                            if ($('#address').val() === '') {
                              $('#address').val(
                                this.props.leads[idx].values['Address'],
                              );
                              this.props.leadItem.values[
                                'Address'
                              ] = this.props.leads[idx].values['Address'];
                              $('#suburb').val(
                                this.props.leads[idx].values['Suburb'],
                              );
                              this.props.leadItem.values[
                                'Suburb'
                              ] = this.props.leads[idx].values['Suburb'];
                              $('#state').val(
                                this.props.leads[idx].values['State'],
                              );
                              this.props.leadItem.values[
                                'State'
                              ] = this.props.leads[idx].values['State'];
                              $('#postcode').val(
                                this.props.leads[idx].values['Postcode'],
                              );
                              this.props.leadItem.values[
                                'Postcode'
                              ] = this.props.leads[idx].values['Postcode'];
                              $('#email').val(
                                this.props.leads[idx].values['Email'],
                              );
                              this.props.leadItem.values[
                                'Email'
                              ] = this.props.leads[idx].values['Email'];
                              $('#phone').val(
                                this.props.leads[idx].values['Phone Number'],
                              );
                              this.props.leadItem.values[
                                'Phone Number'
                              ] = this.props.leads[idx].values['Phone Number'];
                            }
                          }
                        }}
                        style={{ width: '300px' }}
                      />
                    )}
                  </span>
                  <span className="line">
                    {this.state.parentGuardian !== 'Member' ? null : (
                      <Select
                        closeMenuOnSelect={true}
                        options={this.getAllMembers()}
                        className="hide-columns-container"
                        classNamePrefix="hide-columns"
                        placeholder="Select Member"
                        onChange={e => {
                          handleChange(this.props.leadItem, 'ParentMember', e);
                          this.props.leadItem.values['Parent or Guardian'] =
                            e.label;
                          var idx = this.props.members.findIndex(
                            member => member.id === e.value,
                          );
                          if (idx !== -1) {
                            if ($('#address').val() === '') {
                              $('#address').val(
                                this.props.members[idx].values['Address'],
                              );
                              this.props.leadItem.values[
                                'Address'
                              ] = this.props.members[idx].values['Address'];
                              $('#suburb').val(
                                this.props.members[idx].values['Suburb'],
                              );
                              this.props.leadItem.values[
                                'Suburb'
                              ] = this.props.members[idx].values['Suburb'];
                              $('#state').val(
                                this.props.members[idx].values['State'],
                              );
                              this.props.leadItem.values[
                                'State'
                              ] = this.props.members[idx].values['State'];
                              $('#postcode').val(
                                this.props.members[idx].values['Postcode'],
                              );
                              this.props.leadItem.values[
                                'Postcode'
                              ] = this.props.members[idx].values['Postcode'];
                              $('#email').val(
                                this.props.members[idx].values['Email'],
                              );
                              this.props.leadItem.values[
                                'Email'
                              ] = this.props.members[idx].values['Email'];
                              $('#phone').val(
                                this.props.members[idx].values['Phone Number'],
                              );
                              this.props.leadItem.values[
                                'Phone Number'
                              ] = this.props.members[idx].values[
                                'Phone Number'
                              ];
                            }
                          }
                        }}
                        style={{ width: '300px' }}
                      />
                    )}
                  </span>
                  <span className="line">
                    {this.state.parentGuardian !== 'Other' ? null : (
                      <div>
                        <label htmlFor="ParentGuardian">
                          Parent or Guardian
                        </label>
                        <input
                          type="text"
                          name="ParentGuardian"
                          id="ParentGuardian"
                          ref={input => (this.input = input)}
                          onChange={e =>
                            handleChange(
                              this.props.leadItem,
                              'Parent or Guardian',
                              e,
                            )
                          }
                        />
                      </div>
                    )}
                  </span>
                </div>
              )}
              <div className="line">
                {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' ? (
                  <h1>Emergency Contact Information</h1>
                ) : (
                  <h1>Contact Information</h1>
                )}
                <hr />
                <span className="line">
                  <div>
                    <label htmlFor="emergencyname">Name</label>
                    <input
                      type="text"
                      size="40"
                      name="emergencyname"
                      id="emergencyname"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Emergency Contact Name',
                          e,
                        )
                      }
                    />
                  </div>
                  {getAttributeValue(this.props.space, 'Franchisor') !==
                    'YES' && (
                    <div>
                      <label htmlFor="relationship">Relationship</label>
                      <input
                        type="text"
                        size="40"
                        name="relationship"
                        id="relationship"
                        ref={input => (this.input = input)}
                        onChange={e =>
                          handleChange(
                            this.props.leadItem,
                            'Emergency Contact Relationship',
                            e,
                          )
                        }
                      />
                    </div>
                  )}
                </span>
                <span className="line">
                  <div>
                    <label htmlFor="emergencyphone">Phone</label>
                    <NumberFormat
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
                      ref={input => (this.input = input)}
                      onValueChange={(values, e) =>
                        handleFormattedChange(
                          values,
                          this.props.leadItem,
                          'Emergency Contact Phone',
                          e,
                        )
                      }
                    />
                  </div>
                  {getAttributeValue(this.props.space, 'Franchisor') !==
                    'YES' && (
                    <div>
                      <label htmlFor="alergies">Medical / Allergies</label>
                      <input
                        type="text"
                        size="40"
                        name="alergies"
                        id="alergies"
                        ref={input => (this.input = input)}
                        onChange={e =>
                          handleChange(
                            this.props.leadItem,
                            'Medical Allergies',
                            e,
                          )
                        }
                      />
                    </div>
                  )}
                </span>
              </div>
              <div className="line">
                <h1>Other Information</h1>
                <hr />
              </div>
              <span className="line">
                <hr />
                {getAttributeValue(this.props.space, 'Franchisor') !==
                  'YES' && (
                  <div>
                    <label id="birthday" htmlFor="birthday">
                      Birthday
                    </label>
                    <DayPickerInput
                      name="birthday"
                      id="birthday"
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
                      fieldName="DOB"
                      leadItem={this.props.leadItem}
                      onDayPickerHide={handleDateChange}
                      dayPickerProps={{
                        locale: getLocalePreference(
                          this.props.space,
                          this.props.profile,
                        ),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                )}
              </span>
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
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
                      onChange={e => this.handleChange('contactMethod', e)}
                    >
                      <option value="" />
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="in_person">In Person</option>
                      <option value="social_media">Social Media</option>
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
              )}
              <span className="line">
                <div>
                  <label htmlFor="reminderDateString" required>
                    Reminder Date
                  </label>
                  <select
                    id="reminderDateString"
                    name="reminderDateString"
                    required
                    onChange={e => this.handleChange('reminderDateString', e)}
                  >
                    <option value="" />
                    <option value="Tomorrow">Tomorrow</option>
                    <option value="2 days from now">2 days from now</option>
                    <option value="Next Week">Next Week</option>
                    <option value="Next Month">Next Month</option>
                    <option value="Custom">Custom</option>
                    <option value="Never">Never</option>
                  </select>
                </div>
                {this.state.reminderDateString === 'Custom' && (
                  <div className="float-left">
                    <label id="reminderDate" htmlFor="reminderDate">
                      &nbsp;
                    </label>
                    <DayPickerInput
                      name="reminderDate"
                      id="reminderDate"
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
                      fieldName="Reminder Date"
                      leadThis={this}
                      leadItem={this.props.leadItem}
                      onDayPickerHide={handleDateChange}
                      dayPickerProps={{
                        locale: getLocalePreference(
                          this.props.space,
                          this.props.profile,
                        ),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                )}
              </span>
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <span className="line">
                  <span>Main Benefits to Train</span>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <span className="line benefits">
                  <span className="optionItem">
                    <label htmlFor="excercise" style={{ minWidth: 'auto' }}>
                      excercise
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="excercise"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="excercise"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'excercise',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'excercise');
                        } else {
                          e.target.value = 'excercise';
                          this.props.leadItem.values['Main Benefits'].push(
                            'excercise',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="discipline" style={{ minWidth: 'auto' }}>
                      discipline
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="discipline"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="discipline"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'discipline',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'discipline');
                        } else {
                          e.target.value = 'discipline';
                          this.props.leadItem.values['Main Benefits'].push(
                            'discipline',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="selfdefense" style={{ minWidth: 'auto' }}>
                      self defense
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="selfdefense"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="self defense"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'self defense',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'self defense');
                        } else {
                          e.target.value = 'self defense';
                          this.props.leadItem.values['Main Benefits'].push(
                            'self defense',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="reducestress" style={{ minWidth: 'auto' }}>
                      reduce stress
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="reducestress"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="reduce stress"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'reduce stress',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'reduce stress');
                        } else {
                          e.target.value = 'reduce stress';
                          this.props.leadItem.values['Main Benefits'].push(
                            'reduce stress',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="respect" style={{ minWidth: 'auto' }}>
                      respect
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="respect"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="respect"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'respect',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'respect');
                        } else {
                          e.target.value = 'respect';
                          this.props.leadItem.values['Main Benefits'].push(
                            'respect',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label
                      htmlFor="selfconfidence"
                      style={{ minWidth: 'auto' }}
                    >
                      self confidence
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="selfconfidence"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="self confidence"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'self confidence',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'self confidence');
                        } else {
                          e.target.value = 'self confidence';
                          this.props.leadItem.values['Main Benefits'].push(
                            'self confidence',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="concentration" style={{ minWidth: 'auto' }}>
                      concentration
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="concentration"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="concentration"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'concentration',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'concentration');
                        } else {
                          e.target.value = 'concentration';
                          this.props.leadItem.values['Main Benefits'].push(
                            'concentration',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="coordination" style={{ minWidth: 'auto' }}>
                      coordination
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="coordination"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="coordination"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'coordination',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'coordination');
                        } else {
                          e.target.value = 'coordination';
                          this.props.leadItem.values['Main Benefits'].push(
                            'coordination',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="balance" style={{ minWidth: 'auto' }}>
                      balance
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="balance"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="balance"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'balance',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'balance');
                        } else {
                          e.target.value = 'balance';
                          this.props.leadItem.values['Main Benefits'].push(
                            'balance',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label
                      htmlFor="characterdevelopment"
                      style={{ minWidth: 'auto' }}
                    >
                      character development
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="characterdevelopment"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="character development"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'character development',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'character development');
                        } else {
                          e.target.value = 'character development';
                          this.props.leadItem.values['Main Benefits'].push(
                            'character development',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="focus" style={{ minWidth: 'auto' }}>
                      focus
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="focus"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="focus"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'focus',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'focus');
                        } else {
                          e.target.value = 'focus';
                          this.props.leadItem.values['Main Benefits'].push(
                            'focus',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="fun" style={{ minWidth: 'auto' }}>
                      fun
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="fun"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="fun"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'fun',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'fun');
                        } else {
                          e.target.value = 'fun';
                          this.props.leadItem.values['Main Benefits'].push(
                            'fun',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="competition" style={{ minWidth: 'auto' }}>
                      competition
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="competition"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="competition"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'competition',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'competition');
                        } else {
                          e.target.value = 'competition';
                          this.props.leadItem.values['Main Benefits'].push(
                            'competition',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                  <span className="optionItem">
                    <label htmlFor="ArtofJiuJitsu" style={{ minWidth: 'auto' }}>
                      Art of Jiu Jitsu
                    </label>
                    <input
                      type="checkbox"
                      name="mainbenefits"
                      id="ArtofJiuJitsu"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="Art of Jiu Jitsu"
                      onChange={e => {
                        if (
                          this.props.leadItem.values['Main Benefits'] ===
                          undefined
                        )
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = new Array();
                        if (
                          this.props.leadItem.values['Main Benefits'].includes(
                            'Art of Jiu Jitsu',
                          )
                        ) {
                          e.target.value = '';
                          this.props.leadItem.values[
                            'Main Benefits'
                          ] = this.props.leadItem.values[
                            'Main Benefits'
                          ].filter(elem => elem !== 'Art of Jiu Jitsu');
                        } else {
                          e.target.value = 'Art of Jiu Jitsu';
                          this.props.leadItem.values['Main Benefits'].push(
                            'Art of Jiu Jitsu',
                          );
                        }
                        handleChange(this.props.leadItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <span className="line">
                  <div>
                    <label htmlFor="program">Interest in Program</label>
                    <select
                      name="program"
                      id="program"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Interest in Program',
                          e,
                        )
                      }
                    >
                      <option value="" />
                      {this.props.programs
                        .concat(this.props.additionalPrograms)
                        .map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program}
                          </option>
                        ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <span className="line">
                  <div>
                    <label htmlFor="sourceReference1">Source Reference 1</label>
                    <input
                      type="text"
                      name="sourceReference1"
                      id="sourceReference1"
                      size="20"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Source Reference 1',
                          e,
                        )
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
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Source Reference 2',
                          e,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="sourceReference3">Source Reference 3</label>
                    <select
                      name="sourceReference3"
                      id="sourceReference3"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Source Reference 3',
                          e,
                        )
                      }
                    >
                      <option value="" />
                      <option value="Adult">Adult</option>
                      <option value="Kids">Kids</option>
                    </select>
                    <div className="droparrow" />
                  </div>
                </span>
              )}
              {getAttributeValue(this.props.space, 'Franchisor') !== 'YES' && (
                <span className="line">
                  <div>
                    <label htmlFor="sourceReference2">Source Reference 4</label>
                    <input
                      type="text"
                      name="sourceReference4"
                      id="sourceReference4"
                      size="20"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Source Reference 4',
                          e,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="sourceReference2">Source Reference 5</label>
                    <input
                      type="text"
                      name="sourceReference5"
                      id="sourceReference5"
                      size="20"
                      ref={input => (this.input = input)}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Source Reference 5',
                          e,
                        )
                      }
                    />
                  </div>
                </span>
              )}
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
  members,
  leads,
  profile,
  leadSourceValues,
  fetchLeads,
  saveLead,
  isDirty,
  programs,
  additionalPrograms,
  setIsDirty,
  newLeadLoading,
  space,
  states,
}) =>
  newLeadLoading ? (
    <div />
  ) : (
    <LeadNew
      leadItem={leadItem}
      leads={leads}
      profile={profile}
      leadSourceValues={leadSourceValues}
      members={members}
      saveLead={saveLead}
      programs={programs}
      additionalPrograms={additionalPrograms}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      space={space}
      states={states}
    />
  );

export const LeadNewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ leadItem, createLead }) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('states', 'setStates', ''),
  withHandlers({
    fetchLeads: ({ fetchLeads }) => () => {
      fetchLeads({});
    },
    saveLead: ({ createLead, fetchLeads, leadLastFetchTime }) => (
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
          .siblings('.DayPickerInput')
          .children('input')
          .css('border-color', 'red');
        var firstElem = $('label[required]')
          .siblings(
            'input[required],select[required],textarea[required],.DayPickerInput',
          )
          .first();
        if (firstElem.hasClass('DayPickerInput')) {
          firstElem.children('input').focus();
        } else {
          firstElem.focus();
        }
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
        // Trim spaces
        var keys = Object.keys(leadItem.values);
        keys.forEach((item, i) => {
          if (
            leadItem.values[item] !== null &&
            leadItem.values[item] !== undefined &&
            typeof leadItem.values[item] !== 'object'
          ) {
            leadItem.values[item] = leadItem.values[item].trim();
          }
        });

        leadItem.values['Lead State'] = 'Open';
        leadItem.values['Status'] = 'Open';
        leadItem.values['Date Created'] = moment().format('L');
        //console.log("### saving lead # " + util.inspect(leadItem.values));

        $('#saveButton').prop('disabled', true);
        createLead({
          leadItem,
          history: leadItem.history,
          leadLastFetchTime: leadLastFetchTime,
          fetchLeads: fetchLeads,
        });
      }
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchLeads();
      this.props.fetchNewLead({
        myThis: this,
        history: this.props.history,
        fetchLeads: this.props.fetchLeads,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
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
      if (getAttributeValue(this.props.space, 'Franchisor') === 'YES') {
        nextProps.leadItem.values['First Name'] = 'GB';
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('leads');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(LeadNewView);

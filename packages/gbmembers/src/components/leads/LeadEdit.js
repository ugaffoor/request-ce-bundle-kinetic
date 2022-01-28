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
  handleDateChange,
  getDateValue,
  getLocalePreference,
} from './LeadsUtils';
import { Confirm } from 'react-confirm-bootstrap';
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
  leadItem: state.member.leads.currentLead,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  profile: state.member.kinops.profile,
  leadSourceValues: state.member.app.leadSourceValues,
  space: state.app.space,
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  deleteLead: actions.deleteLead,
};

export class LeadEdit extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.saveLead = this.props.saveLead;
    this.removeLead = this.props.removeLead;
    this.setIsDirty = this.props.setIsDirty;
    let parentGuardian;
    if (
      this.props.leadItem.values['ParentLead'] !== undefined &&
      this.props.leadItem.values['ParentLead'] !== null
    ) {
      parentGuardian = 'Lead';
    } else if (
      this.props.leadItem.values['ParentMember'] !== undefined &&
      this.props.leadItem.values['ParentMember'] !== null
    ) {
      parentGuardian = 'Member';
    } else if (this.props.leadItem.values['Parent or Guardian'] !== undefined) {
      parentGuardian = 'Other';
    }
    this.state = {
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

  UNSAFE_componentWillReceiveProps(nextProps) {}

  render() {
    return (
      <div className="leadEditDetails memberEditDetails">
        <StatusMessagesContainer />
        <div className="general">
          <div className="userDetails">
            <div className="section1">
              <h3>Edit Lead</h3>
              <hr />
              {this.props.profile.username !== 'unus@uniqconsulting.com.au' ? (
                <div />
              ) : (
                <span>
                  <div className="line" style={{ margin: '10px' }}>
                    <div className="row">
                      <button
                        type="button"
                        className="btn btn-primary report-btn-default"
                        onClick={e =>
                          this.props.setEditAdmin(
                            this.props.editAdmin ? false : true,
                          )
                        }
                      >
                        {this.props.editAdmin
                          ? 'Hide Edit Admin'
                          : 'Show Edit Admin'}
                      </button>
                    </div>
                  </div>
                  {!this.props.editAdmin ? null : (
                    <div className="admin">
                      <span className="line">
                        <div>
                          <label htmlFor="emailsReceivedCount">
                            emailsReceivedCount
                          </label>
                          <input
                            type="text"
                            name="emailsReceivedCount"
                            id="emailsReceivedCount"
                            size="30"
                            ref={input => (this.input = input)}
                            defaultValue={
                              this.props.leadItem.values[
                                'Emails Received Count'
                              ]
                            }
                            onChange={e =>
                              handleChange(
                                this.props.leadItem,
                                'Emails Received Count',
                                e,
                                this.setIsDirty,
                              )
                            }
                          />
                        </div>
                      </span>
                      <span className="line">
                        <div>
                          <label htmlFor="status">Status</label>
                          <input
                            type="text"
                            name="status"
                            id="status"
                            size="30"
                            ref={input => (this.input = input)}
                            defaultValue={this.props.leadItem.values['Status']}
                            onChange={e =>
                              handleChange(
                                this.props.leadItem,
                                'Status',
                                e,
                                this.setIsDirty,
                              )
                            }
                          />
                        </div>
                        <div>
                          <label htmlFor="leadState">Lead State</label>
                          <input
                            type="text"
                            name="leadState"
                            id="leadState"
                            size="30"
                            ref={input => (this.input = input)}
                            defaultValue={
                              this.props.leadItem.values['Lead State']
                            }
                            onChange={e =>
                              handleChange(
                                this.props.leadItem,
                                'Lead State',
                                e,
                                this.setIsDirty,
                              )
                            }
                          />
                        </div>
                      </span>
                      <span className="line">
                        <div>
                          <label htmlFor="convertedMemberID">
                            Converted Member ID
                          </label>
                          <input
                            type="text"
                            name="convertedMemberID"
                            id="convertedMemberID"
                            size="30"
                            ref={input => (this.input = input)}
                            defaultValue={
                              this.props.leadItem.values['Converted Member ID']
                            }
                            onChange={e =>
                              handleChange(
                                this.props.leadItem,
                                'Converted Member ID',
                                e,
                                this.setIsDirty,
                              )
                            }
                          />
                        </div>
                      </span>
                      <span className="line">
                        <div>
                          <label htmlFor="history">History</label>
                          <input
                            type="text"
                            name="history"
                            id="history"
                            size="90"
                            ref={input => (this.input = input)}
                            defaultValue={this.props.leadItem.values['History']}
                            onChange={e =>
                              handleChange(
                                this.props.leadItem,
                                'History',
                                e,
                                this.setIsDirty,
                              )
                            }
                          />
                        </div>
                      </span>
                    </div>
                  )}
                </span>
              )}
              <span className="line">
                <div>
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
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Source']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    {this.props.leadSourceValues.map((value, index) => {
                      return <option value={value}>{value}</option>;
                    })}
                  </select>
                  <div className="droparrow" />
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
                    value={getDateValue(this.props.leadItem.values['Date'])}
                    fieldName="Date"
                    required
                    leadItem={this.props.leadItem}
                    onDayPickerHide={handleDateChange}
                    setIsDirty={this.setIsDirty}
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
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['First Name']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'First Name',
                        e,
                        this.setIsDirty,
                      )
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
                    value={this.props.leadItem.values['Last Name']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Last Name',
                        e,
                        this.setIsDirty,
                      )
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
                    value={this.props.leadItem.values['Gender']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Gender',
                        e,
                        this.setIsDirty,
                      )
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
                    value={this.props.leadItem.values['Address']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Address',
                        e,
                        this.setIsDirty,
                      )
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
                    <I18n>Suburb</I18n>
                  </label>
                  <input
                    type="text"
                    name="suburb"
                    id="suburb"
                    required
                    ref={input => (this.input = input)}
                    value={this.props.leadItem.values['Suburb']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Suburb',
                        e,
                        this.setIsDirty,
                      )
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
                    value={this.props.leadItem.values['State']}
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'State',
                        e,
                        this.setIsDirty,
                      )
                    }
                  >
                    <option value="" />
                    {getAttributeValue(this.props.space, 'School States', '')
                      .split(',')
                      .map(state => {
                        return <option value={state}>{state}</option>;
                      })}
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
                      required
                      ref={input => (this.input = input)}
                      defaultValue={this.props.leadItem.values['Postcode']}
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Postcode',
                          e,
                          this.setIsDirty,
                        )
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
                          this.setIsDirty,
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
                        : this.props.leadItem.values['Email'] === null
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
                    value={this.props.leadItem.values['Email']}
                    onChange={e => {
                      if (e.target.value !== null)
                        e.target.value = e.target.value.trim().toLowerCase();
                      this.props.leadItem.values['Email'] =
                        this.props.leadItem.values['Email'] === undefined ||
                        this.props.leadItem.values['Email'] === null
                          ? ''
                          : this.props.leadItem.values['Email']
                              .trim()
                              .toLowerCase();
                      handleChange(
                        this.props.leadItem,
                        'Email',
                        e,
                        this.setIsDirty,
                      );
                    }}
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
                    value={this.props.leadItem.values['Additional Email']}
                    onChange={e => {
                      if (e.target.value !== null)
                        e.target.value = e.target.value.trim().toLowerCase();
                      this.props.leadItem.values['Additional Email'] =
                        this.props.leadItem.values['Additional Email'] ===
                          undefined ||
                        this.props.leadItem.values['Additional Email'] === null
                          ? ''
                          : this.props.leadItem.values['Additional Email']
                              .trim()
                              .toLowerCase();
                      handleChange(
                        this.props.leadItem,
                        'Additional Email',
                        e,
                        this.setIsDirty,
                      );
                    }}
                  />
                </div>
              </span>
              <span className="line">
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
                        this.setIsDirty,
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
                        : '####-###-###'
                    }
                    mask="_"
                    ref={input => (this.input = input)}
                    value={
                      this.props.leadItem.values['Additional Phone Number']
                    }
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        this.props.leadItem,
                        'Additional Phone Number',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
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
                        onChange={e => {
                          this.setState({ parentGuardian: 'Lead' });
                          this.props.leadItem.values['ParentMember'] = '';
                          this.props.leadItem.values['Parent or Guardian'] = '';
                        }}
                        defaultChecked={
                          this.props.leadItem.values['ParentLead'] !==
                            undefined &&
                          this.props.leadItem.values['ParentLead'] !== null
                            ? 'defaultChecked'
                            : ''
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
                        onChange={e => {
                          this.setState({ parentGuardian: 'Member' });
                          this.props.leadItem.values['ParentLead'] = '';
                          this.props.leadItem.values['Parent or Guardian'] = '';
                        }}
                        defaultChecked={
                          this.props.leadItem.values['ParentMember'] !==
                            undefined &&
                          this.props.leadItem.values['ParentMember'] !== null
                            ? 'defaultChecked'
                            : ''
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
                        onChange={e => {
                          this.setState({ parentGuardian: 'Other' });
                          this.props.leadItem.values['ParentLead'] = '';
                          this.props.leadItem.values['ParentMember'] = '';
                          this.props.leadItem.values['Parent or Guardian'] = '';
                        }}
                        defaultChecked={
                          (this.props.leadItem.values['ParentLead'] ===
                            undefined ||
                            this.props.leadItem.values['ParentLead'] ===
                              null) &&
                          (this.props.leadItem.values['ParentMember'] ===
                            undefined ||
                            this.props.leadItem.values['ParentMember'] === null)
                            ? 'defaultChecked'
                            : ''
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
                      defaultInputValue={
                        this.props.leadItem.values['ParentLead'] !==
                          undefined &&
                        this.props.leadItem.values['ParentLead'] !== null
                          ? this.props.leadItem.values['Parent or Guardian']
                          : ''
                      }
                      onChange={e => {
                        handleChange(
                          this.props.leadItem,
                          'ParentLead',
                          e,
                          this.setIsDirty,
                        );
                        this.props.leadItem.values['Parent or Guardian'] =
                          e.label;
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
                      defaultInputValue={
                        this.props.leadItem.values['ParentMember'] !==
                          undefined &&
                        this.props.leadItem.values['ParentMember'] !== null
                          ? this.props.leadItem.values['Parent or Guardian']
                          : ''
                      }
                      onChange={e => {
                        handleChange(
                          this.props.leadItem,
                          'ParentMember',
                          e,
                          this.setIsDirty,
                        );
                        this.props.leadItem.values['Parent or Guardian'] =
                          e.label;
                      }}
                      style={{ width: '300px' }}
                    />
                  )}
                </span>
                <span className="line">
                  {this.state.parentGuardian !== 'Other' ? null : (
                    <div>
                      <label htmlFor="ParentGuardian">Parent or Guardian</label>
                      <input
                        type="text"
                        name="ParentGuardian"
                        id="ParentGuardian"
                        ref={input => (this.input = input)}
                        defaultValue={
                          this.props.leadItem.values['Parent or Guardian']
                        }
                        onChange={e =>
                          handleChange(
                            this.props.leadItem,
                            'Parent or Guardian',
                            e,
                            this.setIsDirty,
                          )
                        }
                      />
                    </div>
                  )}
                </span>
              </div>
              <div className="line">
                <h1>Emergency Contact Information</h1>
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
                      defaultValue={
                        this.props.leadItem.values['Emergency Contact Name']
                      }
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Emergency Contact Name',
                          e,
                          this.setIsDirty,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="relationship">Relationship</label>
                    <input
                      type="text"
                      size="40"
                      name="relationship"
                      id="relationship"
                      ref={input => (this.input = input)}
                      defaultValue={
                        this.props.leadItem.values[
                          'Emergency Contact Relationship'
                        ]
                      }
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Emergency Contact Relationship',
                          e,
                          this.setIsDirty,
                        )
                      }
                    />
                  </div>
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
                          : '####-###-###'
                      }
                      mask="_"
                      ref={input => (this.input = input)}
                      value={
                        this.props.leadItem.values['Emergency Contact Phone']
                      }
                      onValueChange={(values, e) =>
                        handleFormattedChange(
                          values,
                          this.props.leadItem,
                          'Emergency Contact Phone',
                          e,
                          this.setIsDirty,
                        )
                      }
                    />
                  </div>
                  <div>
                    <label htmlFor="alergies">Medical / Allergies</label>
                    <input
                      type="text"
                      size="40"
                      name="alergies"
                      id="alergies"
                      ref={input => (this.input = input)}
                      defaultValue={
                        this.props.leadItem.values['Medical Allergies']
                      }
                      onChange={e =>
                        handleChange(
                          this.props.leadItem,
                          'Medical Allergies',
                          e,
                          this.setIsDirty,
                        )
                      }
                    />
                  </div>
                </span>
              </div>
              <div className="line">
                <h1>Other Information</h1>
                <hr />
              </div>
              <span className="line">
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
                    value={getDateValue(this.props.leadItem.values['DOB'])}
                    fieldName="DOB"
                    leadItem={this.props.leadItem}
                    onDayPickerHide={handleDateChange}
                    setIsDirty={this.setIsDirty}
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
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 1',
                        e,
                        this.setIsDirty,
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
                    defaultValue={
                      this.props.leadItem.values['Source Reference 2']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 2',
                        e,
                        this.setIsDirty,
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
                    defaultValue={
                      this.props.leadItem.values['Source Reference 3']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 3',
                        e,
                        this.setIsDirty,
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
              <span className="line">
                <div>
                  <label htmlFor="sourceReference2">Source Reference 4</label>
                  <input
                    type="text"
                    name="sourceReference4"
                    id="sourceReference4"
                    size="20"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['Source Reference 4']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 4',
                        e,
                        this.setIsDirty,
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
                    defaultValue={
                      this.props.leadItem.values['Source Reference 5']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'Source Reference 5',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="moreInformation">More Information</label>
                  <textarea
                    type="text"
                    name="moreInformation"
                    id="moreInformation"
                    cols="60"
                    ref={input => (this.input = input)}
                    defaultValue={
                      this.props.leadItem.values['More Information']
                    }
                    onChange={e =>
                      handleChange(
                        this.props.leadItem,
                        'More Information',
                        e,
                        this.setIsDirty,
                      )
                    }
                  />
                </div>
              </span>
            </div>
            <div className="section4">
              <span className="line">
                <br />
                <span className="leftButtons">
                  <Confirm
                    onConfirm={e => this.removeLead()}
                    body="Are you sure you want to delete this lead?"
                    confirmText="Confirm Delete"
                    title="Deleting Lead"
                  >
                    <button
                      type="button"
                      id="deleteButton"
                      className="btn btn-primary"
                    >
                      Delete
                    </button>
                  </Confirm>
                </span>
                <span className="rightButtons">
                  <NavLink
                    to={`/LeadDetail/${this.props.leadItem['id']}`}
                    className="btn btn-primary"
                  >
                    Cancel
                  </NavLink>
                  <button
                    type="button"
                    id="saveButton"
                    className={
                      this.props.isDirty
                        ? 'btn btn-primary dirty'
                        : 'btn btn-primary notDirty disabled'
                    }
                    onClick={e => this.saveLead(this.props.leadItem)}
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

export const LeadEditView = ({
  leadItem,
  saveLead,
  members,
  leads,
  leadSourceValues,
  fetchLeads,
  removeLead,
  programs,
  additionalPrograms,
  currentLeadLoading,
  isDirty,
  setIsDirty,
  profile,
  space,
  editAdmin,
  setEditAdmin,
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <LeadEdit
      leadItem={leadItem}
      leads={leads}
      leadSourceValues={leadSourceValues}
      members={members}
      saveLead={saveLead}
      programs={programs}
      additionalPrograms={additionalPrograms}
      removeLead={removeLead}
      isDirty={isDirty}
      setIsDirty={setIsDirty}
      profile={profile}
      space={space}
      editAdmin={editAdmin}
      setEditAdmin={setEditAdmin}
    />
  );

export const LeadEditContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('editAdmin', 'setEditAdmin', false),
  withProps(() => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    fetchLeads: ({ fetchLeads }) => () => {
      fetchLeads({});
    },
    saveLead: ({ updateLead, fetchLeads, isDirty }) => leadItem => {
      if (!isDirty) {
        return;
      }
      if ($('label[required]').length > 0) {
        $('label[required]')
          .siblings('input[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('select[required]')
          .css('border-color', 'red');
        $('label[required]')
          .siblings('input[required]')
          .first()
          .focus();
      } else {
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

        updateLead({
          id: leadItem['id'],
          leadItem: leadItem,
          history: leadItem.history,
          fetchLeads: fetchLeads,
        });
      }
    },
    removeLead: ({ leadItem, deleteLead, fetchLeads }) => () => {
      leadItem.values['Lead State'] = 'Deleted';
      deleteLead({
        leadItem: leadItem,
        history: leadItem.history,
        fetchLeads: fetchLeads,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchLeads();
      this.props.fetchLead({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchLead({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
        });
      }
      //$(".leadEditDetails input").val("");
      //$(".leadEditDetails select").val("");
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
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(LeadEditView);

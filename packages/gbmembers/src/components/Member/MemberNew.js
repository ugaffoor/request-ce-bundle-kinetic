import React from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import { PhotoForm } from '../PhotoForm';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleNewChange,
  handleProgramChange,
  handleFormattedChange,
  handleDynamicChange,
  handleDateChange,
  getDateValue,
  getLocalePreference,
  handleCountryChange,
  getPhoneNumberFormat,
} from './MemberUtils';
import { StatusMessagesContainer } from '../StatusMessages';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { I18n } from '../../../../app/src/I18nProvider';
import Barcode from 'react-barcode';
import enAU from 'moment/locale/en-au';
import enCA from 'moment/locale/en-ca';
import enGB from 'moment/locale/en-gb';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.newMember,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  belts: state.member.app.belts,
  membershipTypes: state.member.app.membershipTypes,
  newMemberLoading: state.member.members.newMemberLoading,
  allMembers: state.member.members.allMembers,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
  allLeads: state.member.leads.allLeads,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  createMember: actions.createMember,
  fetchNewMember: actions.fetchNewMember,
  fetchMembers: actions.fetchMembers,
  setNewMember: actions.setNewMember,
  fetchLead: leadsActions.fetchCurrentLead,
  updateLead: leadsActions.updateLead,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

export function getMemberID(firstName, lastName) {
  return (
    (firstName !== undefined ? firstName.toLowerCase() : '') +
    (lastName !== undefined ? lastName.toLowerCase() : '')
  )
    .replace(/[^\x00-\x7F]|['"`\.,\(\)\W]/g, '')
    .substring(0, 30);
}

export function handleNameChange(memberItem, event) {
  var firstName = memberItem.values['First Name'];
  var lastName = memberItem.values['Last Name'];

  memberItem.values['Member ID'] = getMemberID(firstName, lastName);

  $('#username').val(memberItem.values['Member ID']);
  //Remove/add the 'required' attribute by calling handleDynamicChange
  handleDynamicChange(memberItem, 'Member ID', 'username');
}
var myThis;

export const MemberNew = ({
  memberItem,
  saveMember,
  createMember,
  programs,
  additionalPrograms,
  belts,
  membershipTypes,
  newMemberLoading,
  profile,
  space,
  states,
}) =>
  newMemberLoading ? (
    <div />
  ) : (
    <I18n context={`kapps.gbmembers.forms.member`}>
      <div className="memberEditDetails">
        <StatusMessagesContainer />
        <div className="general">
          <div className="userDetails">
            <div className="section1">
              <h1> New Member Profile </h1>
              <hr />
              <span className="line">
                <div>
                  <label
                    htmlFor="firstName"
                    required={
                      memberItem.values['First Name'] === undefined ||
                      memberItem.values['First Name'] === ''
                        ? true
                        : false
                    }
                  >
                    {getAttributeValue(space, 'Franchisor') === 'YES' ? (
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
                      getAttributeValue(space, 'Franchisor') === 'YES'
                        ? true
                        : false
                    }
                    required
                    ref={input => (this.input = input)}
                    value={
                      getAttributeValue(space, 'Franchisor') === 'YES'
                        ? 'GB'
                        : memberItem.values['First Name']
                    }
                    onChange={e => handleNewChange(memberItem, 'First Name', e)}
                    onBlur={e => handleNameChange(memberItem, e)}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    required={
                      memberItem.values['Last Name'] === undefined ||
                      memberItem.values['Last Name'] === ''
                        ? true
                        : false
                    }
                  >
                    {getAttributeValue(space, 'Franchisor') === 'YES'
                      ? 'School Name'
                      : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    ref={input => (this.input = input)}
                    value={memberItem.values['Last Name']}
                    onChange={e => handleNewChange(memberItem, 'Last Name', e)}
                    onBlur={e => handleNameChange(memberItem, e)}
                  />
                </div>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div>
                    <label
                      htmlFor="gender"
                      required={
                        memberItem.values['Gender'] === undefined ? true : false
                      }
                    >
                      Gender
                    </label>
                    <select
                      name="gender"
                      id="gender"
                      required
                      ref={input => (this.input = input)}
                      value={memberItem.values['Gender']}
                      onChange={e => handleChange(memberItem, 'Gender', e)}
                    >
                      <option value="" />
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      {getAttributeValue(space, 'Additional Gender Options') ===
                        'YES' && (
                        <option value="Prefer not to answer">
                          Prefer not to answer
                        </option>
                      )}
                      {getAttributeValue(space, 'Additional Gender Options') ===
                        'YES' && <option value="Other">Other</option>}
                    </select>
                    <div className="droparrow" />
                  </div>
                )}
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <span id="photoForm">
                    <PhotoForm memberItem={memberItem} />
                  </span>
                )}
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="username"
                    required={
                      memberItem.values['Member ID'] === undefined ||
                      memberItem.values['Member ID'] === ''
                        ? true
                        : false
                    }
                  >
                    Member ID
                  </label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    required
                    ref={input => (this.input = input)}
                    value={memberItem.values['Member ID']}
                    onBlur={e => {
                      e.target.value = e.target.value.trim();
                    }}
                    onChange={e => handleChange(memberItem, 'Member ID', e)}
                  />
                </div>
                <div id="duplicateUserInfo" className="hide">
                  <p>
                    First Name, Last Name, Member ID must be unique for a
                    Member. Another user already exists.
                  </p>
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="address"
                    required={
                      memberItem.values['Address'] === undefined ||
                      memberItem.values['Address'] === ''
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
                    value={memberItem.values['Address']}
                    onChange={e => handleNewChange(memberItem, 'Address', e)}
                    onBlur={e =>
                      (memberItem.values['Address'] = e.target.value.trim())
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="suburb"
                    required={
                      memberItem.values['Suburb'] === undefined ||
                      memberItem.values['Suburb'] === ''
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
                    value={memberItem.values['Suburb']}
                    onChange={e => handleNewChange(memberItem, 'Suburb', e)}
                    onBlur={e =>
                      (memberItem.values['Suburb'] = e.target.value.trim())
                    }
                  />
                </div>
                {getAttributeValue(space, 'School States', '') ===
                  undefined && (
                  <div>
                    <label htmlFor="country">Country</label>
                    <select
                      name="country"
                      id="country"
                      required
                      ref={input => (this.input = input)}
                      value={memberItem.values['Country']}
                      onChange={e =>
                        handleCountryChange(memberItem, 'Country', e)
                      }
                    >
                      <option value="" />
                      {getAttributeValue(space, 'Countries', '') ===
                      undefined ? (
                        <option value=""></option>
                      ) : (
                        getAttributeValue(space, 'Countries', '')
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
                      memberItem.values['State'] === undefined ||
                      memberItem.values['State'] === ''
                        ? true
                        : false
                    }
                  >
                    State
                  </label>
                  {getAttributeValue(space, 'School States', '') ===
                    undefined && (
                    <span>
                      <select
                        name="state"
                        id="state"
                        required
                        ref={input => (this.input = input)}
                        value={memberItem.values['State']}
                        onChange={e => handleChange(memberItem, 'State', e)}
                      >
                        <option value="" />
                        {states.split(',').map(state => {
                          return <option value={state}>{state}</option>;
                        })}
                      </select>
                      <div className="droparrow" />
                    </span>
                  )}
                  {getAttributeValue(space, 'School States', '') !==
                    undefined && (
                    <span>
                      <select
                        name="state"
                        id="state"
                        required
                        ref={input => (this.input = input)}
                        value={memberItem.values['State']}
                        onChange={e => handleChange(memberItem, 'State', e)}
                      >
                        <option value="" />
                        {getAttributeValue(space, 'School States', '')
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
                  <label
                    htmlFor="postcode"
                    required={
                      memberItem.values['Postcode'] === undefined ? true : false
                    }
                  >
                    <I18n>Postcode</I18n>
                  </label>
                  {getAttributeValue(space, 'Postcode Format') === undefined ||
                  getAttributeValue(space, 'Postcode Format') === null ||
                  getAttributeValue(space, 'Postcode Format') === '' ? (
                    <input
                      type="text"
                      name="postcode"
                      id="postcode"
                      size="10"
                      required
                      ref={input => (this.input = input)}
                      value={memberItem.values['Postcode']}
                      onChange={e => {
                        handleChange(memberItem, 'Postcode', e);
                      }}
                    />
                  ) : (
                    <NumberFormat
                      id="postcode"
                      format={
                        getAttributeValue(space, 'Postcode Format') !==
                        undefined
                          ? getAttributeValue(space, 'Postcode Format')
                          : '####'
                      }
                      mask="_"
                      required
                      ref={input => (this.input = input)}
                      value={memberItem.values['Postcode']}
                      onValueChange={(values, e) =>
                        handleFormattedChange(values, memberItem, 'Postcode', e)
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
                      memberItem.values['Email'] === undefined ||
                      memberItem.values['Email'] === ''
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
                    value={memberItem.values['Email']}
                    onChange={e => {
                      e.target.value = e.target.value.trim().toLowerCase();
                      handleNewChange(memberItem, 'Email', e);
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
                    value={memberItem.values['Additional Email']}
                    onChange={e => {
                      e.target.value = e.target.value.trim().toLowerCase();
                      handleChange(memberItem, 'Additional Email', e);
                    }}
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="phone"
                    required={
                      memberItem.values['Phone Number'] === undefined
                        ? true
                        : false
                    }
                  >
                    Phone
                  </label>
                  <NumberFormat
                    id="phonenumber"
                    format={
                      getAttributeValue(space, 'PhoneNumber Format') !==
                      undefined
                        ? getAttributeValue(space, 'PhoneNumber Format')
                        : space.slug === 'europe' ||
                          space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                    }
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={memberItem.values['Phone Number']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        memberItem,
                        'Phone Number',
                        e,
                      )
                    }
                  />
                </div>
                <div>
                  <label htmlFor="additionalPhone">Additional Phone</label>
                  <NumberFormat
                    id="additionalPhoneNumber"
                    format={
                      getAttributeValue(space, 'PhoneNumber Format') !==
                      undefined
                        ? getAttributeValue(space, 'PhoneNumber Format')
                        : space.slug === 'europe' ||
                          space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                    }
                    mask="_"
                    ref={input => (this.input = input)}
                    value={memberItem.values['Additional Phone Number']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        memberItem,
                        'Additional Phone Number',
                        e,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label
                    id="datejoined"
                    htmlFor="datejoined"
                    required={
                      memberItem.values['Date Joined'] === undefined ||
                      memberItem.values['Date Joined'] === ''
                        ? true
                        : false
                    }
                  >
                    Date Joined
                  </label>
                  <DayPickerInput
                    name="datejoined"
                    id="datejoined"
                    placeholder={moment(new Date())
                      .locale(getLocalePreference(space, profile))
                      .localeData()
                      .longDateFormat('L')
                      .toLowerCase()}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    fieldName="Date Joined"
                    memberItem={memberItem}
                    required
                    value={getDateValue(memberItem.values['Date Joined'])}
                    onDayPickerHide={handleDateChange}
                    dayPickerProps={{
                      locale: getLocalePreference(space, profile),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div>
                    <label
                      id="birthday"
                      htmlFor="birthday"
                      required={
                        memberItem.values['DOB'] === undefined ||
                        memberItem.values['DOB'] === ''
                          ? true
                          : false
                      }
                    >
                      Birthday
                    </label>
                    <DayPickerInput
                      name="birthday"
                      id="birthday"
                      placeholder={moment(new Date())
                        .locale(getLocalePreference(space, profile))
                        .localeData()
                        .longDateFormat('L')
                        .toLowerCase()}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      fieldName="DOB"
                      memberItem={memberItem}
                      value={getDateValue(memberItem.values['DOB'])}
                      onDayPickerHide={handleDateChange}
                      dayPickerProps={{
                        locale: getLocalePreference(space, profile),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                )}
              </span>
              <span className="line">
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div>
                    <label
                      htmlFor="membertype"
                      required={
                        memberItem.values['Member Type'] === undefined ||
                        memberItem.values['Member Type'] === ''
                          ? true
                          : false
                      }
                    >
                      Member Type
                    </label>
                    <select
                      name="membertype"
                      id="membertype"
                      required
                      ref={input => (this.input = input)}
                      value={memberItem.values['Member Type']}
                      onChange={e => handleChange(memberItem, 'Member Type', e)}
                    >
                      <option value="" />
                      {membershipTypes.map(type => (
                        <option key={type.type} value={type.type}>
                          {type.type}
                        </option>
                      ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                )}
              </span>
            </div>
            <div className="section2">
              {getAttributeValue(space, 'Franchisor') !== 'YES' ? (
                <h1>Emergency Contact Information</h1>
              ) : (
                <h1>Contact Information</h1>
              )}
              <hr />
              <span className="line">
                <div>
                  <label
                    htmlFor="emergencyname"
                    required={
                      memberItem.values['Emergency Contact Name'] === undefined
                        ? true
                        : false
                    }
                  >
                    Name
                  </label>
                  <input
                    type="text"
                    size="40"
                    required
                    name="emergencyname"
                    id="emergencyname"
                    ref={input => (this.input = input)}
                    value={memberItem.values['Emergency Contact Name']}
                    onChange={e =>
                      handleNewChange(memberItem, 'Emergency Contact Name', e)
                    }
                    onBlur={e =>
                      (memberItem.values[
                        'Emergency Contact Name'
                      ] = e.target.value.trim())
                    }
                  />
                </div>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div>
                    <label
                      htmlFor="relationship"
                      required={
                        memberItem.values['Emergency Contact Relationship'] ===
                        undefined
                          ? true
                          : false
                      }
                    >
                      Relationship
                    </label>
                    <input
                      type="text"
                      size="40"
                      name="relationship"
                      required
                      id="relationship"
                      ref={input => (this.input = input)}
                      value={
                        memberItem.values['Emergency Contact Relationship']
                      }
                      onChange={e =>
                        handleNewChange(
                          memberItem,
                          'Emergency Contact Relationship',
                          e,
                        )
                      }
                      onBlur={e =>
                        (memberItem.values[
                          'Emergency Contact Relationship'
                        ] = e.target.value.trim())
                      }
                    />
                  </div>
                )}
              </span>
              <span className="line">
                <div>
                  <label
                    htmlFor="emergencyphone"
                    required={
                      memberItem.values['Emergency Contact Phone'] === undefined
                        ? true
                        : false
                    }
                  >
                    Phone
                  </label>
                  <NumberFormat
                    id="emergencyphone"
                    name="emergencyphone"
                    format={
                      getAttributeValue(space, 'PhoneNumber Format') !==
                      undefined
                        ? getAttributeValue(space, 'PhoneNumber Format')
                        : space.slug === 'europe' ||
                          space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                    }
                    mask="_"
                    required
                    ref={input => (this.input = input)}
                    value={memberItem.values['Emergency Contact Phone']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        memberItem,
                        'Emergency Contact Phone',
                        e,
                      )
                    }
                  />
                </div>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div>
                    <label htmlFor="alergies">Medical / Allergies</label>
                    <input
                      type="text"
                      size="40"
                      name="alergies"
                      id="alergies"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Medical Allergies']}
                      onChange={e =>
                        handleNewChange(memberItem, 'Medical Allergies', e)
                      }
                    />
                  </div>
                )}
              </span>
            </div>
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <div className="section3">
                <h1>Ranking</h1>
                <hr />
                <span className="line">
                  <div>
                    <label
                      htmlFor="program"
                      required={
                        memberItem.values['Ranking Program'] === undefined
                          ? true
                          : false
                      }
                    >
                      Program
                    </label>
                    <select
                      name="program"
                      id="program"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Ranking Program']}
                      onChange={e =>
                        handleProgramChange(memberItem, 'Ranking Program', e)
                      }
                    >
                      <option value="" />
                      {programs.map(program => (
                        <option key={program.program} value={program.program}>
                          {program.program}
                        </option>
                      ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                  <div>
                    <label
                      htmlFor="belt"
                      required={
                        memberItem.values['Ranking Belt'] === undefined
                          ? true
                          : false
                      }
                    >
                      Belt
                    </label>
                    <select
                      name="belt"
                      id="belt"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Ranking Belt']}
                      onChange={e =>
                        handleChange(memberItem, 'Ranking Belt', e)
                      }
                    >
                      <option value="" />
                      {belts.map(
                        belt =>
                          belt.program ===
                            memberItem.values['Ranking Program'] && (
                            <option key={belt.belt} value={belt.belt}>
                              {belt.belt}
                            </option>
                          ),
                      )}
                    </select>
                    <div className="droparrow" />
                  </div>
                </span>
                <span className="line">
                  <div className="field">
                    <label
                      id="lastPromotion"
                      htmlFor="lastPromotion"
                      required={
                        memberItem.values['Last Promotion'] === undefined
                          ? true
                          : false
                      }
                    >
                      Last Promotion
                    </label>
                    <DayPickerInput
                      name="lastPromotion"
                      id="lastPromotion"
                      required
                      placeholder={moment(new Date())
                        .locale(getLocalePreference(space, profile))
                        .localeData()
                        .longDateFormat('L')
                        .toLowerCase()}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      fieldName="Last Promotion"
                      memberItem={memberItem}
                      value={getDateValue(memberItem.values['Last Promotion'])}
                      onDayPickerHide={handleDateChange}
                      dayPickerProps={{
                        locale: getLocalePreference(space, profile),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </div>
                  <div>
                    <label htmlFor="attendanceCount">Attendance Count</label>
                    <input
                      type="number"
                      name="attendanceCount"
                      id="attendanceCount"
                      style={{ width: '130px' }}
                      ref={input => (this.input = input)}
                      value={memberItem.values['Attendance Count']}
                      onChange={e =>
                        handleChange(memberItem, 'Attendance Count', e)
                      }
                    />
                  </div>
                </span>
                <span className="line">
                  <div className="field">
                    <label htmlFor="maxWeeklyClasses">Max Weekly Classes</label>
                    <input
                      type="number"
                      name="maxWeeklyClasses"
                      id="maxWeeklyClasses"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Max Weekly Classes']}
                      onChange={e =>
                        handleChange(memberItem, 'Max Weekly Classes', e)
                      }
                    />
                  </div>
                </span>
              </div>
            )}
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <div className="section3">
                <h1>Other Information</h1>
                <hr />
                <span className="line">
                  <div>
                    <label htmlFor="nopaying" style={{ minWidth: '100px' }}>
                      Non Paying
                    </label>
                    <input
                      type="checkbox"
                      name="nonpaying"
                      id="nonpaying"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="YES"
                      checked={
                        memberItem.values['Non Paying'] === 'YES' ? true : false
                      }
                      onChange={e => handleChange(memberItem, 'Non Paying', e)}
                    />
                  </div>
                </span>
                <span className="line">
                  <div>
                    <label htmlFor="optout" style={{ minWidth: '100px' }}>
                      Opt Out
                    </label>
                    <input
                      type="checkbox"
                      name="optout"
                      id="optout"
                      style={{ clear: 'none', margin: '4px' }}
                      ref={input => (this.input = input)}
                      value="YES"
                      checked={
                        memberItem.values['Opt-Out'] === 'YES' ? true : false
                      }
                      onChange={e => handleChange(memberItem, 'Opt-Out', e)}
                    />
                  </div>
                </span>
                <span className="line">
                  <span>Main Benefits to Train</span>
                </span>
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'excercise',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'excercise',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'excercise',
                          );
                        } else {
                          e.target.value = 'excercise';
                          memberItem.values['Main Benefits'].push('excercise');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'discipline',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'discipline',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'discipline',
                          );
                        } else {
                          e.target.value = 'discipline';
                          memberItem.values['Main Benefits'].push('discipline');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'self defense',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'self defense',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'self defense',
                          );
                        } else {
                          e.target.value = 'self defense';
                          memberItem.values['Main Benefits'].push(
                            'self defense',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'reduce stress',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'reduce stress',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'reduce stress',
                          );
                        } else {
                          e.target.value = 'reduce stress';
                          memberItem.values['Main Benefits'].push(
                            'reduce stress',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'respect',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes('respect')
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'respect',
                          );
                        } else {
                          e.target.value = 'respect';
                          memberItem.values['Main Benefits'].push('respect');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'self confidence',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'self confidence',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'self confidence',
                          );
                        } else {
                          e.target.value = 'self confidence';
                          memberItem.values['Main Benefits'].push(
                            'self confidence',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'concentration',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'concentration',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'concentration',
                          );
                        } else {
                          e.target.value = 'concentration';
                          memberItem.values['Main Benefits'].push(
                            'concentration',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'coordination',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'coordination',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'coordination',
                          );
                        } else {
                          e.target.value = 'coordination';
                          memberItem.values['Main Benefits'].push(
                            'coordination',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'balance',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes('balance')
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'balance',
                          );
                        } else {
                          e.target.value = 'balance';
                          memberItem.values['Main Benefits'].push('balance');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'character development',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'character development',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'character development',
                          );
                        } else {
                          e.target.value = 'character development';
                          memberItem.values['Main Benefits'].push(
                            'character development',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes('focus')
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes('focus')
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'focus',
                          );
                        } else {
                          e.target.value = 'focus';
                          memberItem.values['Main Benefits'].push('focus');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes('fun')
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes('fun')
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'fun',
                          );
                        } else {
                          e.target.value = 'fun';
                          memberItem.values['Main Benefits'].push('fun');
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'competition',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'competition',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'competition',
                          );
                        } else {
                          e.target.value = 'competition';
                          memberItem.values['Main Benefits'].push(
                            'competition',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
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
                      checked={
                        memberItem.values['Main Benefits'] !== undefined
                          ? memberItem.values['Main Benefits'].includes(
                              'Art of Jiu Jitsu',
                            )
                          : false
                      }
                      onChange={e => {
                        if (memberItem.values['Main Benefits'] === undefined)
                          memberItem.values['Main Benefits'] = new Array();
                        if (
                          memberItem.values['Main Benefits'].includes(
                            'Art of Jiu Jitsu',
                          )
                        ) {
                          e.target.value = '';
                          memberItem.values[
                            'Main Benefits'
                          ] = memberItem.values['Main Benefits'].filter(
                            elem => elem !== 'Art of Jiu Jitsu',
                          );
                        } else {
                          e.target.value = 'Art of Jiu Jitsu';
                          memberItem.values['Main Benefits'].push(
                            'Art of Jiu Jitsu',
                          );
                        }
                        handleChange(memberItem, 'Main Benefits', e);
                      }}
                    />
                  </span>
                </span>
                <span className="line">
                  <div>
                    <label htmlFor="additionalprogram1">
                      Additional Program 1
                    </label>
                    <select
                      name="additionalprogram1"
                      id="additionalprogram1"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Additional Program 1']}
                      onChange={e =>
                        handleProgramChange(
                          memberItem,
                          'Additional Program 1',
                          e,
                        )
                      }
                    >
                      <option value="" />
                      {additionalPrograms.map(program => (
                        <option key={program.program} value={program.program}>
                          {program.program}
                        </option>
                      ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                  <div>
                    <label htmlFor="additionalprogram2">
                      Additional Program 2
                    </label>
                    <select
                      name="additionalprogram2"
                      id="additionalprogram2"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Additional Program 2']}
                      onChange={e =>
                        handleProgramChange(
                          memberItem,
                          'Additional Program 2',
                          e,
                        )
                      }
                    >
                      <option value="" />
                      {additionalPrograms.map(program => (
                        <option key={program.program} value={program.program}>
                          {program.program}
                        </option>
                      ))}
                    </select>
                    <div className="droparrow" />
                  </div>
                </span>
                {/*                <span className="line">
                  <div>
                    <label htmlFor="covid19">Covid19 Waiver Agreement</label>
                    <select
                      name="covid19"
                      id="covid19"
                      ref={input => (this.input = input)}
                      defaultValue={''}
                      onChange={e =>
                        handleChange(memberItem, 'Covid19 Waiver', e)
                      }
                    >
                      <option value="" />
                      <option value="Agreed">Agreed</option>
                      <option value="NOT Agreed">NOT Agreed</option>
                    </select>
                    <div className="droparrow" />
                  </div>
                </span> 
*/}
                <span className="line">
                  <div className="field">
                    <label htmlFor="alternateBarcode">Alternate Barcode</label>
                    <input
                      type="text"
                      name="alternateBarcode"
                      id="alternateBarcode"
                      ref={input => (this.input = input)}
                      value={memberItem.values['Alternate Barcode']}
                      onChange={e =>
                        handleChange(memberItem, 'Alternate Barcode', e)
                      }
                      onBlur={e =>
                        (memberItem.values[
                          'Alternate Barcode'
                        ] = e.target.value.trim())
                      }
                    />
                  </div>
                  <div className="memberBarcode">
                    <Barcode
                      value={''}
                      width={1.3}
                      height={30}
                      displayValue={false}
                    />
                  </div>
                </span>
              </div>
            )}
            <div className="section4">
              <span className="line">
                <span className="rightButtons">
                  {this.newMember ? (
                    <NavLink to={`/Home`} className="btn btn-primary">
                      Cancel
                    </NavLink>
                  ) : (
                    <NavLink to={`/`} className="btn btn-primary">
                      Cancel
                    </NavLink>
                  )}
                  <button
                    type="button"
                    id="saveButton"
                    className="btn btn-primary"
                    onClick={e => saveMember(memberItem, createMember)}
                  >
                    Create New Member
                  </button>
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </I18n>
  );

export const MemberNewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem, createMember }) => {
    return {};
  }),
  withState('states', 'setStates', ''),
  withState('convertedLeadID', 'setConvertedLeadID', ''),
  withHandlers({
    saveMember: ({
      memberItem,
      createMember,
      allLeads,
      updateLead,
      match,
      membersNextPageToken,
      memberInitialLoadComplete,
      memberLastFetchTime,
    }) => () => {
      $('#duplicateUserInfo')
        .removeClass('show')
        .addClass('hide');
      var duplicateUser = false;
      for (var i = 0; i < memberItem.myThis.props.allMembers.length; i++) {
        if (
          memberItem.myThis.props.allMembers[i].values['Member ID'] ===
            memberItem.values['Member ID'] ||
          (memberItem.values['First Name'] ===
            memberItem.myThis.props.allMembers[i].values['First Name'] &&
            memberItem.values['Last Name'] ===
              memberItem.myThis.props.allMembers[i].values['Last Name'])
        ) {
          duplicateUser = true;
        }
      }

      if (duplicateUser) {
        $('#duplicateUserInfo')
          .removeClass('hide')
          .addClass('show');
      }
      if ($('label[required]').length > 0 || duplicateUser) {
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
        // Trim spaces
        var keys = Object.keys(memberItem.values);
        keys.forEach((item, i) => {
          if (
            memberItem.values[item] !== null &&
            memberItem.values[item] !== undefined &&
            typeof memberItem.values[item] !== 'object'
          ) {
            memberItem.values[item] = memberItem.values[item].trim();
          }
        });

        var leadItem;
        let idx = allLeads.findIndex(
          lead => lead.id === match.params['leadId'],
        );
        if (idx !== -1) {
          leadItem = allLeads[idx];
          memberItem.values['Lead Submission ID'] = leadItem.id;
        }

        memberItem.values['Status'] = 'Active';
        $('#saveButton').prop('disabled', true);
        createMember({
          memberItem,
          history: memberItem.history,
          membersNextPageToken: membersNextPageToken,
          memberInitialLoadComplete: memberInitialLoadComplete,
          memberLastFetchTime: memberLastFetchTime,
          fetchMembers: memberItem.fetchMembers,
          allLeads: allLeads,
          leadId: leadItem !== undefined ? leadItem.id : '',
          leadItem: leadItem,
          updateLead: updateLead,
        });
      }
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      let values = {
        'First Name': '',
        'Last Name': '',
        'Member ID': '',
        Gender: '',
        Address: '',
        Postcode: '',
        Suburb: '',
        State: '',
        Email: '',
        'Additional Email': '',
        'Phone Number': '',
        'Additional Phone Number': '',
        'Date Joined': '',
        'Member Type': '',
        'Emergency Contact Name': '',
        'Emergency Contact Phone': '',
        'Emergency Contact Relationship': '',
        DOB: '',
        'Ranking Program': '',
        'Ranking Belt': '',
        'Last Promotion': moment().format('YYYY-MM-DD'),
        'Attendance Count': '0',
        'Max Weekly Classes': '',
        'Medical Allergies': '',
        'Main Benefits': [],
        'Non Paying': '',
        'Opt-Out': '',
        'Additional Program 1': '',
        'Additional Program 2': '',
        'Alternate Barcode': '',
      };
      if (this.props.match.params['leadId']) {
        let idx = this.props.allLeads.findIndex(
          lead => lead.id === this.props.match.params['leadId'],
        );
        if (idx !== -1) {
          values['First Name'] =
            this.props.allLeads[idx].values['First Name'] !== undefined
              ? this.props.allLeads[idx].values['First Name']
              : '';
          values['Last Name'] =
            this.props.allLeads[idx].values['Last Name'] !== undefined
              ? this.props.allLeads[idx].values['Last Name']
              : '';
          values['Member ID'] = getMemberID(
            values['First Name'],
            values['Last Name'],
          );
          values['Gender'] =
            this.props.allLeads[idx].values['Gender'] !== undefined
              ? this.props.allLeads[idx].values['Gender']
              : '';
          values['Address'] =
            this.props.allLeads[idx].values['Address'] !== undefined
              ? this.props.allLeads[idx].values['Address']
              : '';
          values['Suburb'] =
            this.props.allLeads[idx].values['Suburb'] !== undefined
              ? this.props.allLeads[idx].values['Suburb']
              : '';
          values['Postcode'] =
            this.props.allLeads[idx].values['Postcode'] !== undefined
              ? this.props.allLeads[idx].values['Postcode']
              : '';
          values['State'] =
            this.props.allLeads[idx].values['State'] !== undefined
              ? this.props.allLeads[idx].values['State']
              : '';
          values['Email'] =
            this.props.allLeads[idx].values['Email'] !== undefined
              ? this.props.allLeads[idx].values['Email']
              : '';
          values['Additional Email'] =
            this.props.allLeads[idx].values['Additional Email'] !== undefined
              ? this.props.allLeads[idx].values['Additional Email']
              : '';
          values['Phone Number'] =
            this.props.allLeads[idx].values['Phone Number'] !== undefined
              ? this.props.allLeads[idx].values['Phone Number']
              : '';
          values['Additional Phone Number'] =
            this.props.allLeads[idx].values['Additional Phone Number'] !==
            undefined
              ? this.props.allLeads[idx].values['Additional Phone Number']
              : '';
          values['Emergency Contact Name'] =
            this.props.allLeads[idx].values['Emergency Contact Name'] !==
            undefined
              ? this.props.allLeads[idx].values['Emergency Contact Name']
              : '';
          values['Emergency Contact Phone'] =
            this.props.allLeads[idx].values['Emergency Contact Phone'] !==
            undefined
              ? this.props.allLeads[idx].values['Emergency Contact Phone']
              : '';
          values['Emergency Contact Relationship'] =
            this.props.allLeads[idx].values[
              'Emergency Contact Relationship'
            ] !== undefined
              ? this.props.allLeads[idx].values[
                  'Emergency Contact Relationship'
                ]
              : '';
          values['DOB'] =
            this.props.allLeads[idx].values['DOB'] !== undefined
              ? this.props.allLeads[idx].values['DOB']
              : '';
          values['Medical Allergies'] =
            this.props.allLeads[idx].values['Medical Allergies'] !== undefined
              ? this.props.allLeads[idx].values['Medical Allergies']
              : '';
          values['Opt-Out'] =
            this.props.allLeads[idx].values['Opt-Out'] !== undefined
              ? this.props.allLeads[idx].values['Opt-Out']
              : '';
          values['Main Benefits'] =
            this.props.allLeads[idx].values['Main Benefits'] !== undefined
              ? this.props.allLeads[idx].values['Main Benefits']
              : '';
          values['Attendance Count'] = '0';
        }
      }
      if (getAttributeValue(this.props.space, 'Franchisor') === 'YES') {
        values['First Name'] = 'GB';
      }

      var member = {
        myThis: this,
        history: this.props.history,
        fetchMembers: this.props.fetchMembers,
        values: values,
      };
      this.props.setNewMember(member);
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        let values = {
          'First Name': '',
          'Last Name': '',
          'Member ID': '',
          Gender: '',
          Address: '',
          Postcode: '',
          Suburb: '',
          State: '',
          Email: '',
          'Additional Email': '',
          'Phone Number': '',
          'Additional Phone Number': '',
          'Date Joined': '',
          'Member Type': '',
          'Emergency Contact Name': '',
          'Emergency Contact Phone': '',
          'Emergency Contact Relationship': '',
          DOB: '',
          'Ranking Program': '',
          'Ranking Belt': '',
          'Last Promotion': moment().format('YYYY-MM-DD'),
          'Attendance Count': '0',
          'Max Weekly Classes': '',
          'Medical Allergies': '',
          'Main Benefits': [],
          'Non Paying': '',
          'Opt-Out': '',
          'Additional Program 1': '',
          'Additional Program 2': '',
          'Alternate Barcode': '',
        };
        if (nextProps.match.params['leadId']) {
          let idx = this.props.allLeads.findIndex(
            lead => lead.id === this.props.match.params['leadId'],
          );
          if (idx !== -1) {
            values['First Name'] =
              this.props.allLeads[idx].values['First Name'] !== undefined
                ? this.props.allLeads[idx].values['First Name']
                : '';
            values['Last Name'] =
              this.props.allLeads[idx].values['Last Name'] !== undefined
                ? this.props.allLeads[idx].values['Last Name']
                : '';
            values['Member ID'] = getMemberID(
              values['First Name'],
              values['Last Name'],
            );
            values['Gender'] =
              this.props.allLeads[idx].values['Gender'] !== undefined
                ? this.props.allLeads[idx].values['Gender']
                : '';
            values['Address'] =
              this.props.allLeads[idx].values['Address'] !== undefined
                ? this.props.allLeads[idx].values['Address']
                : '';
            values['Suburb'] =
              this.props.allLeads[idx].values['Suburb'] !== undefined
                ? this.props.allLeads[idx].values['Suburb']
                : '';
            values['Postcode'] =
              this.props.allLeads[idx].values['Postcode'] !== undefined
                ? this.props.allLeads[idx].values['Postcode']
                : '';
            values['State'] =
              this.props.allLeads[idx].values['State'] !== undefined
                ? this.props.allLeads[idx].values['State']
                : '';
            values['Email'] =
              this.props.allLeads[idx].values['Email'] !== undefined
                ? this.props.allLeads[idx].values['Email']
                : '';
            values['Additional Email'] =
              this.props.allLeads[idx].values['Additional Email'] !== undefined
                ? this.props.allLeads[idx].values['Additional Email']
                : '';
            values['Phone Number'] =
              this.props.allLeads[idx].values['Phone Number'] !== undefined
                ? this.props.allLeads[idx].values['Phone Number']
                : '';
            values['Additional Phone Number'] =
              this.props.allLeads[idx].values['Additional Phone Number'] !==
              undefined
                ? this.props.allLeads[idx].values['Additional Phone Number']
                : '';
            values['Emergency Contact Name'] =
              this.props.allLeads[idx].values['Emergency Contact Name'] !==
              undefined
                ? this.props.allLeads[idx].values['Emergency Contact Name']
                : '';
            values['Emergency Contact Phone'] =
              this.props.allLeads[idx].values['Emergency Contact Phone'] !==
              undefined
                ? this.props.allLeads[idx].values['Emergency Contact Phone']
                : '';
            values['Emergency Contact Relationship'] =
              this.props.allLeads[idx].values[
                'Emergency Contact Relationship'
              ] !== undefined
                ? this.props.allLeads[idx].values[
                    'Emergency Contact Relationship'
                  ]
                : '';
            values['DOB'] =
              this.props.allLeads[idx].values['DOB'] !== undefined
                ? this.props.allLeads[idx].values['DOB']
                : '';
            values['Medical Allergies'] =
              this.props.allLeads[idx].values['Medical Allergies'] !== undefined
                ? this.props.allLeads[idx].values['Medical Allergies']
                : '';
            values['Opt-Out'] =
              this.props.allLeads[idx].values['Opt-Out'] !== undefined
                ? this.props.allLeads[idx].values['Opt-Out']
                : '';
            values['Main Benefits'] =
              this.props.allLeads[idx].values['Main Benefits'] !== undefined
                ? this.props.allLeads[idx].values['Main Benefits']
                : '';
            values['Attendance Count'] = '0';
          }
        }
        if (getAttributeValue(nextProps.space, 'Franchisor') === 'YES') {
          values['First Name'] = 'GB';
        }
        var member = {
          myThis: this,
          history: this.props.history,
          fetchMembers: this.props.fetchMembers,
          values: values,
        };
        this.props.setNewMember(member);
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      myThis = this;
    },
    componentWillUnmount() {},
  }),
)(MemberNew);

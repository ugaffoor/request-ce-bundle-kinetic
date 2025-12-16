import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import { actions as leadActions } from '../../redux/modules/leads';
import { actions as appActions } from '../../redux/modules/memberApp';
import { KappNavLink as NavLink } from 'common';
import { PhotoForm } from '../PhotoForm';
import $ from 'jquery';
import { Confirm } from 'react-confirm-bootstrap';
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleFormattedChange,
  handleDateChange,
  getDateValue,
  getLocalePreference,
  handleCountryChange,
  getPhoneNumberFormat,
} from './MemberUtils';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import ReactTable from 'react-table';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { StatusMessagesContainer } from '../StatusMessages';
import { SetStatusModalContainer } from './SetStatusModalContainer';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { I18n } from '@kineticdata/react';
import Barcode from 'react-barcode';
import Autocomplete from 'react-google-autocomplete';

import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

var myThis;

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  belts: state.member.app.belts,
  beltSizes: state.member.app.beltSizes,
  membershipTypes: state.member.app.membershipTypes,
  currentMemberLoading: state.member.members.currentMemberLoading,
  profile: state.member.kinops.profile,
  loggedInUserProfile: state.member.app.profile,
  memberStatusValues: state.member.app.memberStatusValues,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  updateMember: actions.updateMember,
  deleteMember: actions.deleteMember,
  fetchCurrentMember: actions.fetchCurrentMember,
  updateLead: leadActions.updateLead,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
var myThis;

export function getJson(input) {
  if (input === undefined || input === null) {
    return [];
  }

  if (typeof input === 'string') {
    return $.parseJSON(input);
  } else {
    return input;
  }
}

class MemberAudit extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowMemberAudit(false);
  };

  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  getColumns() {
    return [
      { accessor: 'date', Header: 'Date' },
      { accessor: 'user', Header: 'User' },
      { accessor: 'field', Header: 'Field' },
      { accessor: 'from', Header: 'From' },
      { accessor: 'to', Header: 'To' },
    ];
  }

  getData(memberItem) {
    let memberChanges = memberItem.values['Member Changes'];
    if (!memberChanges) {
      return [];
    } else if (typeof memberChanges !== 'object') {
      memberChanges = JSON.parse(memberChanges);
    }

    return memberChanges.sort(function(change1, change2) {
      if (
        moment(change1.date, contact_date_format).isAfter(
          moment(change2.date, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(change1.date, contact_date_format).isBefore(
          moment(change2.date, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose} style={{ width: '90vw' }}>
            <ModalDialog style={{ width: '50%' }} onClose={this.handleClose}>
              <h2>
                Member Audit for {this.props.memberItem.values['First Name']}{' '}
                {this.props.memberItem.values['Last Name']}
              </h2>
              <ReactTable
                columns={this._columns}
                data={this.state.data}
                defaultPageSize={this.state.data.length}
                pageSize={this.state.data.length}
                showPagination={false}
                style={{
                  height: '60vh',
                }}
              />
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

export const MemberEdit = ({
  memberItem,
  saveMember,
  allMembers,
  updateMember,
  updateLead,
  deleteMemberCall,
  deleteMember,
  isDirty,
  setIsDirty,
  programs,
  additionalPrograms,
  belts,
  beltSizes,
  membershipTypes,
  currentMemberLoading,
  profile,
  memberChanges,
  setShowMemberAudit,
  showMemberAudit,
  memberStatusValues,
  setShowSetStatusModal,
  showSetStatusModal,
  setEditUserName,
  editUserName,
  editAdmin,
  setEditAdmin,
  space,
  states,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <div className="memberEditDetails">
      <StatusMessagesContainer />
      <div className="general">
        <div className="userDetails">
          <div className="section1">
            <h1>
              Editing {memberItem.values['First Name']}
              's Profile'
            </h1>
            <span className="statusInfo">
              <h4 className="status">Status: {memberItem.values['Status']}</h4>
              <a
                onClick={e => setShowSetStatusModal(true)}
                className="btn btn-primary"
                style={{ marginLeft: '10px', color: 'white' }}
              >
                Set Status
              </a>
              {showSetStatusModal && (
                <SetStatusModalContainer
                  submission={memberItem}
                  target="Members"
                  setShowSetStatusModal={setShowSetStatusModal}
                  profile={profile}
                  space={space}
                  memberStatusValues={memberStatusValues}
                  setIsDirty={setIsDirty}
                />
              )}
            </span>
            <span className="userNameInfo">
              {!editUserName && (
                <span>
                  <p className="userName">{memberItem.values['Member ID']}</p>
                  <a
                    onClick={e => setEditUserName(true)}
                    className="btn btn-primary editUserName"
                    style={{ marginLeft: '10px', color: 'white' }}
                  >
                    Edit Username
                  </a>
                </span>
              )}
              {editUserName && (
                <span>
                  <label htmlFor="username">User Name</label>
                  <input
                    type="text"
                    name="username"
                    id="username"
                    className="userNameField"
                    required
                    defaultValue={memberItem.values['Member ID']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Member ID',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                  <div id="duplicateUserInfo" className="hide">
                    <p>
                      Username must be unique for a Member. Another user already
                      exists.
                    </p>
                  </div>
                </span>
              )}
            </span>
            <hr />
            <span className="line">
              <div>
                <label
                  htmlFor="firstName"
                  required={
                    memberItem.values['First Name'] === undefined ? true : false
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
                  required
                  disabled={
                    getAttributeValue(space, 'Franchisor') === 'YES'
                      ? true
                      : false
                  }
                  defaultValue={memberItem.values['First Name']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'First Name',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="lastName"
                  required={
                    memberItem.values['Last Name'] === undefined ? true : false
                  }
                >
                  {getAttributeValue(space, 'Franchisor') === 'YES'
                    ? 'School Name'
                    : 'Last Name'}
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastNames"
                  required
                  defaultValue={memberItem.values['Last Name']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Last Name',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
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
                    defaultValue={memberItem.values['Gender']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Gender',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
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
                  <PhotoForm
                    memberItem={memberItem}
                    setIsDirty={setIsDirty}
                    memberChanges={memberChanges}
                  />
                </span>
              )}
            </span>
            {profile.username !== 'unus@uniqconsulting.com.au' ? (
              <div />
            ) : (
              <span>
                <div className="line" style={{ margin: '10px' }}>
                  <div className="row">
                    <button
                      type="button"
                      className="btn btn-primary report-btn-default"
                      onClick={e => setEditAdmin(editAdmin ? false : true)}
                    >
                      {editAdmin ? 'Hide Edit Admin' : 'Show Edit Admin'}
                    </button>
                  </div>
                </div>
                {!editAdmin ? null : (
                  <div className="admin">
                    <span className="line">
                      <div>
                        <label htmlFor="billingUser">Billing User</label>
                        <input
                          type="text"
                          name="billingUser"
                          id="billingUser"
                          size="30"
                          defaultValue={memberItem.values['Billing User']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing User',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="migrated">Biller Migrated</label>
                        <input
                          type="text"
                          name="migrated"
                          id="migrated"
                          size="30"
                          defaultValue={memberItem.values['Biller Migrated']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Biller Migrated',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="useSubAccount">Use Sub Account</label>
                        <input
                          type="text"
                          name="useSubAccount"
                          id="useSubAccount"
                          size="30"
                          defaultValue={memberItem.values['useSubAccount']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'useSubAccount',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="ccExpiryMonth">
                          Credit Card Expiry Month
                        </label>
                        <input
                          type="text"
                          name="ccExpiryMonth"
                          id="ccExpiryMonth"
                          size="30"
                          defaultValue={
                            memberItem.values['Credit Card Expiry Month']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Credit Card Expiry Month',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="ccExpiryYear">
                          Credit Card Expiry Year
                        </label>
                        <input
                          type="text"
                          name="ccExpiryYear"
                          id="ccExpiryYear"
                          size="30"
                          defaultValue={
                            memberItem.values['Credit Card Expiry Year']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Credit Card Expiry Year',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingId">Billing Customer Id</label>
                        <input
                          type="text"
                          name="billingId"
                          id="billingId"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Customer Id']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Customer Id',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="billingRef">Billing Reference</label>
                        <input
                          type="text"
                          name="billingRef"
                          id="billingRef"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Customer Reference']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Customer Reference',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingId">Billing Setup Fee Id</label>
                        <input
                          type="text"
                          name="billingId"
                          id="billingId"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Setup Fee Id']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Setup Fee Id',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="billingId">
                          Billing Setup Fee Type
                        </label>
                        <input
                          type="text"
                          name="billingId"
                          id="billingId"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Setup Fee Type']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Setup Fee Type',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingPaymentType">
                          Billing Payment Type
                        </label>
                        <input
                          type="text"
                          name="billingPaymentType"
                          id="billingPaymentType"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Payment Type']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Payment Type',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="billingPaymentPeriod">
                          Billing Payment Period
                        </label>
                        <input
                          type="text"
                          name="billingPaymentPeriod"
                          id="billingPaymentPeriod"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Payment Period']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Payment Period',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="billingPeriod">Billing Period</label>
                        <input
                          type="text"
                          name="billingPeriod"
                          id="billingPeriod"
                          size="30"
                          defaultValue={memberItem.values['Billing Period']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Period',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingPayment">Payment</label>
                        <input
                          type="text"
                          name="billingPayment"
                          id="billingPayment"
                          size="30"
                          defaultValue={memberItem.values['Payment']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Payment',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="membershipCost">Membership Cost</label>
                        <input
                          type="text"
                          name="membershipCost"
                          id="membershipCost"
                          size="30"
                          defaultValue={memberItem.values['Membership Cost']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Membership Cost',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingStartDate">
                          Billing Start Date
                        </label>
                        <input
                          type="text"
                          name="billingStartDate"
                          id="billingStartDate"
                          size="30"
                          defaultValue={memberItem.values['Billing Start Date']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Start Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="billingParentMember">
                          Billing Parent Member
                        </label>
                        <input
                          type="text"
                          name="billingParentMember"
                          id="billingParentMember"
                          size="30"
                          defaultValue={
                            memberItem.values['Billing Parent Member']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Parent Member',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="billingFamilyMembers">
                          Billing Family Members
                        </label>
                        <input
                          type="text"
                          name="billingFamilyMembers"
                          id="billingFamilyMembers"
                          size="90"
                          defaultValue={
                            memberItem.values['Billing Family Members']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Family Members',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="resumeDate">Resume Date</label>
                        <input
                          type="text"
                          name="resumeDate"
                          id="resumeDate"
                          size="30"
                          defaultValue={memberItem.values['Resume Date']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Resume Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="posProfileID">POS Profile ID</label>
                        <input
                          type="text"
                          name="posProfileID"
                          id="posProfileID"
                          size="30"
                          defaultValue={memberItem.values['POS Profile ID']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'POS Profile ID',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="registeredWithCard">
                          Registered with Card
                        </label>
                        <input
                          type="text"
                          name="registeredWithCard"
                          id="registeredWithCard"
                          size="30"
                          defaultValue={
                            memberItem.values['Registered with Card']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Registered with Card',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
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
                          defaultValue={
                            memberItem.values['Emails Received Count']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Emails Received Count',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="leadSubmissionID">
                          Lead Submission ID
                        </label>
                        <input
                          type="text"
                          name="leadSubmissionID"
                          id="leadSubmissionID"
                          size="30"
                          defaultValue={memberItem.values['Lead Submission ID']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Lead Submission ID',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="statusHistory">Status History</label>
                        <input
                          type="text"
                          name="statusHistory"
                          id="statusHistory"
                          size="50"
                          defaultValue={memberItem.values['Status History']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Status History',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="statusHistory">Notes History</label>
                        <input
                          type="text"
                          name="notesHistory"
                          id="notesHistory"
                          size="50"
                          defaultValue={memberItem.values['Notes History']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Notes History',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="photo">Photo</label>
                        <input
                          type="text"
                          name="photo"
                          id="photo"
                          size="50"
                          defaultValue={memberItem.values['Photo']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Photo',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="lastAttendanceDate">
                          Last Attendance Date
                        </label>
                        <input
                          type="text"
                          name="Last Attendance Date"
                          id="lastAttendanceDate"
                          size="50"
                          defaultValue={
                            memberItem.values['Last Attendance Date']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Last Attendance Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="refundedHistory">
                          Refunded Payments
                        </label>
                        <input
                          type="text"
                          name="refundedHistory"
                          id="refundedHistory"
                          size="50"
                          defaultValue={memberItem.values['Refunded Payments']}
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Refunded Payments',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="cashStart">
                          Billing Cash Term Start Date
                        </label>
                        <input
                          type="text"
                          name="cashStart"
                          id="cashStart"
                          size="50"
                          defaultValue={
                            memberItem.values['Billing Cash Term Start Date']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Cash Term Start Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                      <div>
                        <label htmlFor="cashEnd">
                          Billing Cash Term End Date
                        </label>
                        <input
                          type="text"
                          name="cashEnd"
                          id="cashEnd"
                          size="50"
                          defaultValue={
                            memberItem.values['Billing Cash Term End Date']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Billing Cash Term End Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                    <span className="line">
                      <div>
                        <label htmlFor="waiverCompleteDate">
                          Waiver Complete Date
                        </label>
                        <input
                          type="text"
                          name="waiverCompleteDate"
                          id="waiverCompleteDate"
                          size="50"
                          defaultValue={
                            memberItem.values['Waiver Complete Date']
                          }
                          onChange={e =>
                            handleChange(
                              memberItem,
                              'Waiver Complete Date',
                              e,
                              setIsDirty,
                              memberChanges,
                            )
                          }
                        />
                      </div>
                    </span>
                  </div>
                )}
              </span>
            )}
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <span className="line">
                <Autocomplete
                  id="addressAutoComplete"
                  apiKey={getAttributeValue(
                    this.props.space,
                    'AutoCompleteKey',
                  )}
                  placeholder="Lookup Address"
                  style={{
                    width: '400px',
                    borderTop: 'none',
                    borderRight: 'none',
                    borderWidth: '1px',
                    borderLeftStyle: 'dashed',
                    borderBottomStyle: 'dashed',
                    backgroundColor: '#f1eeee',
                  }}
                  onPlaceSelected={place => {
                    memberItem.values['Address'] = '';
                    for (var i = 0; i < place.address_components.length; i++) {
                      var addressType = place.address_components[i].types[0];

                      if (addressType === 'street_number') {
                        var newValue = place.address_components[i]['long_name'];
                        handleChange(
                          memberItem,
                          'Address',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                      if (addressType === 'route') {
                        var newValue =
                          memberItem.values['Address'] +
                          ' ' +
                          place.address_components[i]['long_name'];
                        handleChange(
                          memberItem,
                          'Address',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                      if (addressType === 'locality') {
                        var newValue = place.address_components[i]['long_name'];
                        handleChange(
                          memberItem,
                          'Suburb',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                      if (
                        getAttributeValue(space, 'School Country Code') ===
                          'GB' &&
                        addressType === 'postal_town'
                      ) {
                        var newValue =
                          place.address_components[i]['short_name'];
                        handleChange(
                          memberItem,
                          'State',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                      if (
                        addressType === 'administrative_area_level_1' &&
                        getAttributeValue(space, 'School Country Code') !== 'GB'
                      ) {
                        var newValue =
                          place.address_components[i]['short_name'];
                        handleChange(
                          memberItem,
                          'State',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                      if (addressType === 'postal_code') {
                        var newValue =
                          place.address_components[i]['short_name'];
                        handleChange(
                          memberItem,
                          'Postcode',
                          { target: { value: newValue } },
                          setIsDirty,
                          memberChanges,
                        );
                      }
                    }
                    setIsDirty(true);
                    myThis.setState({ dummy: true });
                  }}
                  options={{
                    types: ['geocode'],
                  }}
                />
              </span>
            )}
            <span className="line">
              <div>
                <label
                  htmlFor="address"
                  required={
                    memberItem.values['Address'] === undefined ? true : false
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
                  defaultValue={memberItem.values['Address']}
                  onChange={e => {
                    handleChange(
                      memberItem,
                      'Address',
                      e,
                      setIsDirty,
                      memberChanges,
                    );
                  }}
                />
              </div>
            </span>
            <span className="line">
              <div>
                <label
                  htmlFor="suburb"
                  required={
                    memberItem.values['Suburb'] === undefined ? true : false
                  }
                >
                  <I18n>Suburb</I18n>
                </label>
                <input
                  type="text"
                  name="suburb"
                  id="suburb"
                  required
                  defaultValue={memberItem.values['Suburb']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Suburb',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              {getAttributeValue(space, 'School States', '') === undefined && (
                <div>
                  <label htmlFor="country">Country</label>
                  <select
                    name="country"
                    id="country"
                    required
                    defaultValue={memberItem.values['Country']}
                    onChange={e => {
                      memberItem.myThis = myThis;
                      handleCountryChange(
                        memberItem,
                        'Country',
                        e,
                        setIsDirty,
                        memberChanges,
                      );
                    }}
                  >
                    <option value="" />
                    {getAttributeValue(space, 'Countries', '')
                      .split(',')
                      .map(country => {
                        return <option value={country}>{country}</option>;
                      })}
                  </select>
                  <div className="droparrow" />
                </div>
              )}
              <div className="state">
                <label
                  htmlFor="State"
                  required={
                    memberItem.values['State'] === undefined ? true : false
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
                      defaultValue={memberItem.values['State']}
                      onChange={e =>
                        handleChange(
                          memberItem,
                          'State',
                          e,
                          setIsDirty,
                          memberChanges,
                        )
                      }
                    >
                      <option value="" />
                      {states === '' ? (
                        <option value={memberItem.values['State']}>
                          {memberItem.values['State']}
                        </option>
                      ) : (
                        states.split(',').map(state => {
                          return <option value={state}>{state}</option>;
                        })
                      )}
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
                      defaultValue={memberItem.values['State']}
                      onChange={e =>
                        handleChange(
                          memberItem,
                          'State',
                          e,
                          setIsDirty,
                          memberChanges,
                        )
                      }
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
                    defaultValue={memberItem.values['Postcode']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Postcode',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                ) : (
                  <NumberFormat
                    format={
                      getAttributeValue(space, 'Postcode Format') !== undefined
                        ? getAttributeValue(space, 'Postcode Format')
                        : '####'
                    }
                    mask="_"
                    required
                    value={memberItem.values['Postcode']}
                    onValueChange={(values, e) =>
                      handleFormattedChange(
                        values,
                        memberItem,
                        'Postcode',
                        e,
                        setIsDirty,
                        memberChanges,
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
                  required={memberItem.values['Email'] === null ? true : false}
                >
                  Email
                </label>
                <input
                  type="text"
                  name="email"
                  id="email"
                  size="40"
                  required
                  defaultValue={memberItem.values['Email']}
                  onChange={e => {
                    if (e.target.value !== null)
                      e.target.value = e.target.value.trim().toLowerCase();
                    memberItem.values['Email'] =
                      memberItem.values['Email'] === undefined ||
                      memberItem.values['Email'] === null
                        ? ''
                        : memberItem.values['Email'].trim().toLowerCase();
                    handleChange(
                      memberItem,
                      'Email',
                      e,
                      setIsDirty,
                      memberChanges,
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
                  defaultValue={memberItem.values['Additional Email']}
                  onChange={e => {
                    if (e.target.value !== null)
                      e.target.value = e.target.value.trim().toLowerCase();
                    memberItem.values['Additional Email'] =
                      memberItem.values['Additional Email'] === undefined ||
                      memberItem.values['Additional Email'] === null
                        ? ''
                        : memberItem.values['Additional Email']
                            .trim()
                            .toLowerCase();
                    handleChange(
                      memberItem,
                      'Additional Email',
                      e,
                      setIsDirty,
                      memberChanges,
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
                    memberItem.values['Phone Number'] === undefined
                      ? true
                      : false
                  }
                >
                  Phone
                </label>
                <NumberFormat
                  format={
                    getAttributeValue(space, 'PhoneNumber Format') !== undefined
                      ? getAttributeValue(space, 'PhoneNumber Format')
                      : space.slug === 'europe' ||
                        space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                  }
                  mask="_"
                  required
                  value={memberItem.values['Phone Number']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(
                      values,
                      memberItem,
                      'Phone Number',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              <div>
                <label htmlFor="additionalPhone">Additional Phone</label>
                <NumberFormat
                  format={
                    getAttributeValue(space, 'PhoneNumber Format') !== undefined
                      ? getAttributeValue(space, 'PhoneNumber Format')
                      : space.slug === 'europe' ||
                        space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                  }
                  mask="_"
                  required
                  value={memberItem.values['Additional Phone Number']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(
                      values,
                      memberItem,
                      'Additional Phone Number',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
            </span>
            <span className="line">
              <div>
                <label
                  htmlFor="datejoined"
                  id="datejoined"
                  required={
                    memberItem.values['Date Joined'] === undefined && !editAdmin
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
                  value={getDateValue(memberItem.values['Date Joined'])}
                  fieldName="Date Joined"
                  memberItem={memberItem}
                  setIsDirty={setIsDirty}
                  memberChanges={memberChanges}
                  onDayPickerHide={handleDateChange}
                  required
                  dayPickerProps={{
                    locale: getLocalePreference(space, profile),
                    localeUtils: MomentLocaleUtils,
                  }}
                />
              </div>
              {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                <div>
                  <label
                    htmlFor="birthday"
                    id="birthday"
                    required={
                      memberItem.values['DOB'] === undefined && !editAdmin
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
                    value={getDateValue(memberItem.values['DOB'])}
                    fieldName="DOB"
                    memberItem={memberItem}
                    setIsDirty={setIsDirty}
                    memberChanges={memberChanges}
                    onDayPickerHide={handleDateChange}
                    required
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
                  <label htmlFor="membertype">Member Type:</label>
                  <select
                    name="membertype"
                    id="membertype"
                    value={memberItem.values['Member Type']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Member Type',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  >
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
          {getAttributeValue(space, 'Franchisor') !== 'YES' && (
            <div className="sectionParent">
              <h4>Parent or Guardian</h4>
              <span className="line">
                <div>
                  <label htmlFor="ParentGuardian">Parent or Guardian</label>
                  <input
                    type="text"
                    name="ParentGuardian"
                    id="ParentGuardian"
                    defaultValue={memberItem.values['Parent or Guardian']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Parent or Guardian',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                </div>
              </span>
            </div>
          )}
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
                    memberItem.values['Emergency Contact Name'] === undefined &&
                    !editAdmin
                      ? true
                      : false
                  }
                >
                  Name
                </label>
                <input
                  type="text"
                  size="40"
                  name="emergencyname"
                  id="emergencyname"
                  required
                  defaultValue={memberItem.values['Emergency Contact Name']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Emergency Contact Name',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                <div>
                  <label
                    htmlFor="relationship"
                    required={
                      memberItem.values['Emergency Contact Relationship'] ===
                        undefined && !editAdmin
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
                    id="relationship"
                    required
                    defaultValue={
                      memberItem.values['Emergency Contact Relationship']
                    }
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Emergency Contact Relationship',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
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
                    memberItem.values['Emergency Contact Phone'] ===
                      undefined && !editAdmin
                      ? true
                      : false
                  }
                >
                  Phone
                </label>
                <NumberFormat
                  format={
                    getAttributeValue(space, 'PhoneNumber Format') !== undefined
                      ? getAttributeValue(space, 'PhoneNumber Format')
                      : space.slug === 'europe' ||
                        space.slug === 'unitedkingdom'
                        ? getPhoneNumberFormat(memberItem)
                        : '####-###-###'
                  }
                  mask="_"
                  required
                  value={memberItem.values['Emergency Contact Phone']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(
                      values,
                      memberItem,
                      'Emergency Contact Phone',
                      e,
                      setIsDirty,
                      memberChanges,
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
                    defaultValue={memberItem.values['Medical Allergies']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Medical Allergies',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
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
                      memberItem.values['Ranking Program'] === undefined &&
                      !editAdmin
                        ? true
                        : false
                    }
                  >
                    Program
                  </label>
                  <select
                    name="program"
                    id="program"
                    required
                    defaultValue={memberItem.values['Ranking Program']}
                    onChange={e => {
                      handleChange(
                        memberItem,
                        'Ranking Program',
                        e,
                        setIsDirty,
                        memberChanges,
                      );
                      //memberItem.values['Ranking Belt'] = undefined;
                      console.log(
                        'Ranking Program change belt=' +
                          memberItem.values['Ranking Belt'],
                      );
                    }}
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
                      memberItem.values['Ranking Belt'] === undefined &&
                      !editAdmin
                        ? true
                        : false
                    }
                  >
                    Belt
                  </label>
                  <select
                    name="belt"
                    id="belt"
                    required
                    defaultValue={memberItem.values['Ranking Belt']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Ranking Belt',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  >
                    <option key="" value="" />
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
                      memberItem.values['Last Promotion'] === undefined &&
                      !editAdmin
                        ? true
                        : false
                    }
                  >
                    Last Promotion
                  </label>
                  <DayPickerInput
                    name="lastPromotion"
                    id="lastPromotion"
                    placeholder={moment(new Date())
                      .locale(getLocalePreference(space, profile))
                      .localeData()
                      .longDateFormat('L')
                      .toLowerCase()}
                    formatDate={formatDate}
                    parseDate={parseDate}
                    value={getDateValue(memberItem.values['Last Promotion'])}
                    fieldName="Last Promotion"
                    memberItem={memberItem}
                    setIsDirty={setIsDirty}
                    memberChanges={memberChanges}
                    onDayPickerHide={handleDateChange}
                    dayPickerProps={{
                      locale: getLocalePreference(space, profile),
                      localeUtils: MomentLocaleUtils,
                    }}
                  />
                </div>
                <div className="field">
                  <label htmlFor="attendanceCount">Attendance Count</label>
                  <input
                    type="number"
                    name="attendanceCount"
                    id="attendanceCount"
                    defaultValue={memberItem.values['Attendance Count']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Attendance Count',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                </div>{' '}
              </span>
              <span className="line">
                <div className="field">
                  <label htmlFor="maxWeeklyClasses">Max Weekly Classes</label>
                  <input
                    type="number"
                    name="maxWeeklyClasses"
                    id="maxWeeklyClasses"
                    defaultValue={memberItem.values['Max Weekly Classes']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Max Weekly Classes',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                </div>
              </span>
              <span className="line">
                <div>
                  <label htmlFor="beltSize">Belt Size</label>
                  <select
                    name="beltSize"
                    id="beltSize"
                    defaultValue={memberItem.values['Belt Size']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'Belt Size',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  >
                    <option value="" />
                    {beltSizes.map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                  <div className="droparrow" />
                </div>
              </span>
            </div>
          )}
          <div className="section3">
            <h1>Other Information</h1>
            <hr />
            {getAttributeValue(space, 'Member TAX ID') === 'YES' && (
              <span className="line">
                <div>
                  <label htmlFor="taxID">Tax Id</label>
                  <input
                    type="text"
                    size="20"
                    name="taxID"
                    id="taxIDtaxID"
                    defaultValue={memberItem.values['TAX ID']}
                    onChange={e =>
                      handleChange(
                        memberItem,
                        'TAX ID',
                        e,
                        setIsDirty,
                        memberChanges,
                      )
                    }
                  />
                </div>
              </span>
            )}
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <span className="line">
                <div>
                  <label htmlFor="nonpaying" style={{ minWidth: '100px' }}>
                    Non Paying
                  </label>
                  <input
                    type="checkbox"
                    name="nonpaying"
                    id="nonpaying"
                    style={{ clear: 'none', margin: '4px' }}
                    value="YES"
                    checked={
                      memberItem.values['Non Paying'] === 'YES' ? true : false
                    }
                    onChange={e => {
                      if (memberItem.values['Non Paying'] === 'YES') {
                        e.target.value = '';
                      } else {
                        e.target.value = 'YES';
                      }
                      handleChange(
                        memberItem,
                        'Non Paying',
                        e,
                        setIsDirty,
                        memberChanges,
                      );
                    }}
                  />
                </div>
              </span>
            )}
            {(getAttributeValue(space, 'Billing Company') === 'Bambora' ||
              getAttributeValue(space, 'Billing Company') === 'Stripe') && (
              <span className="line">
                <div>
                  <label htmlFor="billingReceipt" style={{ minWidth: '100px' }}>
                    Send Billing Payment Receipt
                  </label>
                  <input
                    type="checkbox"
                    name="billingReceipt"
                    id="billingReceipt"
                    style={{ clear: 'none', margin: '4px' }}
                    value="YES"
                    checked={
                      memberItem.values['Send Payment Receipt'] === 'YES'
                        ? true
                        : false
                    }
                    onChange={e => {
                      if (memberItem.values['Send Payment Receipt'] === 'YES') {
                        e.target.value = '';
                      } else {
                        e.target.value = 'YES';
                      }
                      handleChange(
                        memberItem,
                        'Send Payment Receipt',
                        e,
                        setIsDirty,
                        memberChanges,
                      );
                    }}
                  />
                </div>
              </span>
            )}
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <span>
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
                      value="YES"
                      checked={
                        memberItem.values['Opt-Out'] === 'YES' ? true : false
                      }
                      onChange={e => {
                        if (memberItem.values['Opt-Out'] === 'YES') {
                          e.target.value = '';
                        } else {
                          e.target.value = 'YES';
                        }
                        handleChange(
                          memberItem,
                          'Opt-Out',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
                      }}
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
                      value="excercise"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'excercise',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="discipline"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'discipline',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="self defense"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'self defense',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="reduce stress"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'reduce stress',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="respect"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'respect',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="self confidence"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'self confidence',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="concentration"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'concentration',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="coordination"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'coordination',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="balance"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'balance',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="character development"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'character development',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="focus"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes('focus')
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="fun"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes('fun')
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="competition"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'competition',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      value="Art of Jiu Jitsu"
                      checked={
                        memberItem.values['Main Benefits'] !== undefined &&
                        memberItem.values['Main Benefits'] !== null
                          ? memberItem.values['Main Benefits'].includes(
                              'Art of Jiu Jitsu',
                            )
                          : false
                      }
                      onChange={e => {
                        if (
                          memberItem.values['Main Benefits'] === undefined ||
                          memberItem.values['Main Benefits'] === null
                        )
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
                        handleChange(
                          memberItem,
                          'Main Benefits',
                          e,
                          setIsDirty,
                          memberChanges,
                        );
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
                      defaultValue={memberItem.values['Additional Program 1']}
                      onChange={e =>
                        handleChange(
                          memberItem,
                          'Additional Program 1',
                          e,
                          setIsDirty,
                          memberChanges,
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
                      defaultValue={memberItem.values['Additional Program 2']}
                      onChange={e =>
                        handleChange(
                          memberItem,
                          'Additional Program 2',
                          e,
                          setIsDirty,
                          memberChanges,
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
                  </div>{' '}
                </span>
                <span className="line">
                  <div className="field">
                    <label htmlFor="alternateBarcode">Alternate Barcode</label>
                    <input
                      type="text"
                      name="alternateBarcode"
                      id="alternateBarcode"
                      defaultValue={memberItem.values['Alternate Barcode']}
                      onChange={e =>
                        handleChange(
                          memberItem,
                          'Alternate Barcode',
                          e,
                          setIsDirty,
                          memberChanges,
                        )
                      }
                    />
                  </div>
                  <div className="memberBarcode">
                    {memberItem.values['Alternate Barcode'] !== undefined &&
                      memberItem.values['Alternate Barcode'] !== null && (
                        <Barcode
                          defaultValue={memberItem.values['Alternate Barcode']}
                          width={1.3}
                          height={30}
                          displayValue={false}
                        />
                      )}
                  </div>
                </span>
              </span>
            )}
          </div>
          <div className="section4">
            <span className="line">
              <span className="leftButtons">
                <Confirm
                  onConfirm={e =>
                    deleteMemberCall(memberItem, deleteMember, updateLead)
                  }
                  body="Are you sure you want to delete this member?"
                  confirmText="Confirm Delete"
                  title="Deleting Member"
                >
                  <button
                    type="button"
                    id="deleteButton"
                    className={
                      isDirty
                        ? 'btn btn-primary dirty'
                        : 'btn btn-primary notDirty'
                    }
                  >
                    Delete
                  </button>
                </Confirm>
                <button
                  type="button"
                  className="btn btn-primary dirty"
                  onClick={e => setShowMemberAudit(true)}
                >
                  Member Audit
                </button>
              </span>
              <span className="rightButtons">
                <NavLink
                  to={`/Member/${memberItem.id}`}
                  className="btn btn-primary"
                >
                  Cancel
                </NavLink>
                <button
                  type="button"
                  id="saveButton"
                  className={
                    isDirty
                      ? 'btn btn-primary dirty'
                      : 'btn btn-primary notDirty'
                  }
                  onClick={e =>
                    saveMember(memberItem, updateMember, isDirty, allMembers)
                  }
                >
                  Save
                </button>
              </span>
            </span>
            {showMemberAudit && (
              <MemberAudit
                memberItem={memberItem}
                setShowMemberAudit={setShowMemberAudit}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );

export const MemberEditContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ memberItem, updateMember, deleteMember }) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withState('memberChanges', 'setMemberChanges', []),
  withState('showMemberAudit', 'setShowMemberAudit', false),
  withState('showSetStatusModal', 'setShowSetStatusModal', false),
  withState('editUserName', 'setEditUserName', false),
  withState('editAdmin', 'setEditAdmin', false),
  withState('states', 'setStates', ''),
  withHandlers({
    deleteMemberCall: ({
      memberItem,
      deleteMember,
      updateLead,
      allMembers,
      setIsDirty,
    }) => () => {
      let convertedLead = memberItem.values['Lead Submission ID'];
      deleteMember({
        allMembers,
        memberItem,
        history: memberItem.history,
      });
      console.log('delete member:' + memberItem.username);

      let values = {};
      values['Converted Member ID'] = null;
      values['Status'] = 'Open';
      values['Lead State'] = 'Open';

      let leadItem = {
        values: values,
      };
      if (convertedLead !== undefined && convertedLead !== null) {
        updateLead({
          id: convertedLead,
          leadItem: leadItem,
        });
      }
      setIsDirty(false);
    },
    saveMember: ({
      memberItem,
      updateMember,
      isDirty,
      allMembers,
      memberChanges,
      loggedInUserProfile,
      setIsDirty,
    }) => () => {
      if (!isDirty) {
        return;
      }
      $('#duplicateUserInfo')
        .removeClass('show')
        .addClass('hide');
      var duplicateUser = false;
      for (var i = 0; i < allMembers.length; i++) {
        if (
          allMembers[i].values['Member ID'] ===
            memberItem.values['Member ID'] &&
          allMembers[i].id !== memberItem.id &&
          memberItem.values['Status'] === 'Active'
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

        let emailChanged = false;
        memberChanges.forEach(change => {
          change.user = loggedInUserProfile.username;
          if (change.field === 'Email') {
            emailChanged = true;
          }
        });

        let changes = memberItem.values['Member Changes'];
        if (!changes) {
          changes = [];
        } else if (typeof changes !== 'object') {
          changes = JSON.parse(changes);
        }
        changes.push(...memberChanges);
        memberItem.values['Member Changes'] = changes;
        //console.log("memberChanges=" + util.inspect(changes));
        var values = {};
        memberChanges.forEach(
          field => (values[field.field] = memberItem.values[field.field]),
        );
        values['Member Changes'] = changes;
        values['Status'] = memberItem.values['Status'];
        values['Status History'] = memberItem.values['Status History'];
        updateMember({
          id: memberItem.id,
          memberItem,
          values: values,
          history: memberItem.history,
          emailChanged,
          allMembers,
        });
        for (let i = 0; i < allMembers.length; i++) {
          if (allMembers[i].id === memberItem.id) {
            allMembers[i].values = memberItem.values;
            break;
          }
        }
        setIsDirty(false);
      }
    },
  }),
  lifecycle({
    constructor() {
      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        history: this.props.history,
        allMembers: this.props.allMembers,
      });
    },
    componentDidUpdate() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );
    },
    UNSAFE_componentWillMount() {
      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        history: this.props.history,
        billingService: getAttributeValue(this.props.space, 'Billing Company'),
        allMembers: this.props.allMembers,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      myThis = this;

      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: this.props.match.params.id,
          history: this.props.history,
          billingService: getAttributeValue(
            this.props.space,
            'Billing Company',
          ),
          allMembers: this.props.allMembers,
        });
      }
    },
    componentDidMount() {
      myThis = this;
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
      this.props.setMemberChanges([]);
    },
    componentWillUnmount() {},
  }),
)(MemberEdit);

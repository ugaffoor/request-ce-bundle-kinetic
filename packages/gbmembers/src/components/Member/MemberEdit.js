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
import { KappNavLink as NavLink } from 'common';
import { PhotoForm } from '../PhotoForm';
import $ from 'jquery';
import { Confirm } from 'react-confirm-bootstrap';
import NumberFormat from 'react-number-format';
import { handleChange, handleFormattedChange } from './MemberUtils';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import ReactTable from 'react-table';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { StatusMessagesContainer } from '../StatusMessages';
import { SetStatusModalContainer } from './SetStatusModalContainer';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  membershipTypes: state.member.app.membershipTypes,
  currentMemberLoading: state.member.members.currentMemberLoading,
  profile: state.member.kinops.profile,
  loggedInUserProfile: state.member.app.profile,
  memberStatusValues: state.member.app.memberStatusValues,
});

const mapDispatchToProps = {
  updateMember: actions.updateMember,
  deleteMember: actions.deleteMember,
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
};

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

  componentWillMount() {
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
  updateMember,
  deleteMemberCall,
  deleteMember,
  isDirty,
  setIsDirty,
  programs,
  belts,
  membershipTypes,
  currentMemberLoading,
  profile,
  memberChanges,
  setShowMemberAudit,
  showMemberAudit,
  memberStatusValues,
  setShowSetStatusModal,
  showSetStatusModal,
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
                  memberStatusValues={memberStatusValues}
                  setIsDirty={setIsDirty}
                />
              )}
            </span>
            <p>{memberItem.values['Member ID']}</p>
            <hr />
            <span className="line">
              <div>
                <label
                  htmlFor="firstName"
                  required={
                    memberItem.values['First Name'] === undefined ? true : false
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
                  Last Name
                </label>
                <input
                  type="text"
                  name="lastName"
                  id="lastNames"
                  required
                  ref={input => (this.input = input)}
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
                </select>
                <div className="droparrow" />
              </div>
              <span id="photoForm">
                <PhotoForm memberItem={memberItem} setIsDirty={setIsDirty} />
              </span>
            </span>
            {/*
          <span className="line">
            <div>
              <label htmlFor="billingRef">
                Billing Reference
              </label>
              <input type="text" name="billingRef" id="billingRef" size="30" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Customer Reference']} onChange={(e) => handleChange(memberItem,'Billing Customer Reference', e, setIsDirty)}/>
            </div>
            <div>
              <label htmlFor="billingPaymentType">
                Billing Payment Type
              </label>
              <input type="text" name="billingPaymentType" id="billingPaymentType" size="5" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Payment Type']} onChange={(e) => handleChange(memberItem,'Billing Payment Type', e, setIsDirty)}/>
            </div>
            <div>
              <label htmlFor="billingPaymentPeriod">
                Billing Payment Period
              </label>
              <input type="text" name="billingPaymentPeriod" id="billingPaymentPeriod" size="5" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Payment Period']} onChange={(e) => handleChange(memberItem,'Billing Payment Period', e, setIsDirty)}/>
            </div>
          </span>
          <span className="line">
            <div>
              <label htmlFor="billingMembers">
                Billing Members
              </label>
              <input type="text" name="billingMembers" id="billingMembers" size="80" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Members']} onChange={(e) => handleChange(memberItem,'Billing Members', e, setIsDirty)}/>
            </div>
            </span>
            <span className="line">
            <div>
              <label htmlFor="billingParentMember">
                Billing Parent Member
              </label>
              <input type="text" name="billingParentMember" id="billingParentMember" size="20" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Parent Member']} onChange={(e) => handleChange(memberItem,'Billing Parent Member', e, setIsDirty)}/>
            </div>
          </span>
          <span>

          <label htmlFor="billingChanges">
            Billing Changes
          </label>
          <input type="text" name="billingChanges" id="billingChanges" size="60" ref={(input) => this.input = input} defaultValue={memberItem.values['Billing Changes']} onChange={(e) => handleChange(memberItem,'Billing Changes', e, setIsDirty)}/>
          </span>
          */}
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
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Address']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Address',
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
                  htmlFor="suburb"
                  required={
                    memberItem.values['Suburb'] === undefined ? true : false
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
              <div>
                <label
                  htmlFor="State"
                  required={
                    memberItem.values['State'] === undefined ? true : false
                  }
                >
                  State
                </label>
                <select
                  name="state"
                  id="state"
                  required
                  ref={input => (this.input = input)}
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
                    memberItem.values['Postcode'] === undefined ? true : false
                  }
                >
                  Postcode
                </label>
                <NumberFormat
                  format="####"
                  mask="_"
                  required
                  ref={input => (this.input = input)}
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
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Email']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Email',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
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
                  format="(##) ####-####"
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
                  required={
                    memberItem.values['Date Joined'] === undefined
                      ? true
                      : false
                  }
                >
                  Date Joined
                </label>
                <input
                  type="date"
                  name="datejoined"
                  id="datejoined"
                  required
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Date Joined']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Date Joined',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="birthday"
                  required={
                    memberItem.values['DOB'] === undefined ? true : false
                  }
                >
                  Birthday
                </label>
                <input
                  type="date"
                  name="birthday"
                  id="birthday"
                  required
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['DOB']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'DOB',
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
                <label htmlFor="membertype">Member Type:</label>
                <select
                  name="membertype"
                  id="membertype"
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Member Type']}
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
            </span>
          </div>
          <div className="section2">
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
              <div>
                <label htmlFor="relationship">Relationship</label>
                <input
                  type="text"
                  size="40"
                  name="relationship"
                  id="relationship"
                  ref={input => (this.input = input)}
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
            </span>
            <span className="line">
              <div>
                <label htmlFor="emergencyphone">Phone</label>
                <NumberFormat
                  format="(##) ####-####"
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
                      setIsDirty,
                      memberChanges,
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
            </span>
          </div>
          <div className="section3">
            <h1>Ranking {isDirty}</h1>
            <hr />
            <span className="line">
              <div>
                <label htmlFor="program">Program</label>
                <select
                  name="program"
                  id="program"
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Ranking Program']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Ranking Program',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
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
                <label htmlFor="belt">Belt</label>
                <select
                  name="belt"
                  id="belt"
                  ref={input => (this.input = input)}
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
                  {belts.map(
                    belt =>
                      belt.program === memberItem.values['Ranking Program'] && (
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
              <div>
                <label htmlFor="lastPromotion">Last Promotion</label>
                <input
                  type="date"
                  name="lastPromotion"
                  id="lastPromotion"
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Last Promotion']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Last Promotion',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
              <div>
                <label htmlFor="nextPromotion">Next Scheduled Promotion</label>
                <input
                  type="date"
                  name="nextPromotion"
                  id="nextPromotion"
                  style={{ width: '230px' }}
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Next Schedule Promotion']}
                  onChange={e =>
                    handleChange(
                      memberItem,
                      'Next Schedule Promotion',
                      e,
                      setIsDirty,
                      memberChanges,
                    )
                  }
                />
              </div>
            </span>
          </div>
          <div className="section4">
            <span className="line">
              <span className="leftButtons">
                <Confirm
                  onConfirm={e => deleteMemberCall(memberItem, deleteMember)}
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
                {this.newMember ? (
                  <NavLink to={`/Home`} className="btn btn-primary">
                    Cancel
                  </NavLink>
                ) : (
                  <NavLink
                    to={`/Member/${memberItem.id}`}
                    className="btn btn-primary"
                  >
                    Cancel
                  </NavLink>
                )}
                <button
                  type="button"
                  id="saveButton"
                  className={
                    isDirty
                      ? 'btn btn-primary dirty'
                      : 'btn btn-primary notDirty'
                  }
                  onClick={e => saveMember(memberItem, updateMember, isDirty)}
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
  withHandlers({
    deleteMemberCall: ({ memberItem, deleteMember }) => () => {
      deleteMember({
        memberItem,
        history: memberItem.history,
        fetchMembers: memberItem.fetchMembers,
      });
      console.log('delete member:' + memberItem.username);
    },
    saveMember: ({
      memberItem,
      updateMember,
      isDirty,
      memberChanges,
      loggedInUserProfile,
      fetchMembers,
    }) => () => {
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
        memberChanges.forEach(change => {
          change.user = loggedInUserProfile.username;
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
        updateMember({
          id: memberItem.id,
          memberItem,
          history: memberItem.history,
          fetchMembers: fetchMembers,
        });
      }
    },
  }),
  lifecycle({
    constructor() {
      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        history: this.props.history,
        fetchMembers: this.props.fetchMembers,
      });
    },
    componentDidUpdate() {},
    componentWillMount() {
      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        history: this.props.history,
        fetchMembers: this.props.fetchMembers,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: this.props.match.params.id,
          history: this.props.history,
          fetchMembers: this.props.fetchMembers,
        });
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
      this.props.setMemberChanges([]);
    },
    componentWillUnmount() {},
  }),
)(MemberEdit);

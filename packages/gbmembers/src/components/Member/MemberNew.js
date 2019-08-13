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
import { KappNavLink as NavLink } from 'common';
import { PhotoForm } from '../PhotoForm';
import $ from 'jquery';
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleProgramChange,
  handleFormattedChange,
  handleDynamicChange,
  handleDynamicFormattedChange,
} from './MemberUtils';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.newMember,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  membershipTypes: state.member.app.membershipTypes,
  newMemberLoading: state.member.members.newMemberLoading,
  allMembers: state.member.members.allMembers,
  leadItem: state.member.leads.currentLead,
});
const mapDispatchToProps = {
  createMember: actions.createMember,
  fetchNewMember: actions.fetchNewMember,
  fetchMembers: actions.fetchMembers,
  fetchLead: leadsActions.fetchCurrentLead,
  updateLead: leadsActions.updateLead,
};

export function handleNameChange(memberItem, event) {
  var firstName = memberItem.values['First Name'];
  var lastName = memberItem.values['Last Name'];

  memberItem.values['Member ID'] =
    (firstName !== undefined ? firstName.toLowerCase() : '') +
    (lastName !== undefined ? lastName.toLowerCase() : '');

  $('#username').val(memberItem.values['Member ID']);
  //Remove/add the 'required' attribute by calling handleDynamicChange
  handleDynamicChange(memberItem, 'Member ID', 'username');
}

export const MemberNew = ({
  memberItem,
  saveMember,
  createMember,
  programs,
  belts,
  membershipTypes,
  newMemberLoading,
}) =>
  newMemberLoading ? (
    <div />
  ) : (
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
                  onChange={e => handleChange(memberItem, 'First Name', e)}
                  onBlur={e => handleNameChange(memberItem, e)}
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
                  id="lastName"
                  required
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Last Name']}
                  onChange={e => handleChange(memberItem, 'Last Name', e)}
                  onBlur={e => handleNameChange(memberItem, e)}
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
                  onChange={e => handleChange(memberItem, 'Gender', e)}
                >
                  <option value="" />
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <div className="droparrow" />
              </div>
              <span id="photoForm">
                <PhotoForm memberItem={memberItem} />
              </span>
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
                  defaultValue={memberItem.values['Member ID']}
                  onChange={e => handleChange(memberItem, 'Member ID', e)}
                />
              </div>
              <div id="duplicateUserInfo" className="hide">
                <p>
                  First Name, Last Name, Member ID must be unique for a Member.
                  Another user already exists.
                </p>
              </div>
            </span>
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
                  onChange={e => handleChange(memberItem, 'Address', e)}
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
                  onChange={e => handleChange(memberItem, 'Suburb', e)}
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
                  onChange={e => handleChange(memberItem, 'State', e)}
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
                  id="postcode"
                  format="####"
                  mask="_"
                  required
                  ref={input => (this.input = input)}
                  value={memberItem.values['Postcode']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(values, memberItem, 'Postcode', e)
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
                  onChange={e => handleChange(memberItem, 'Email', e)}
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
                  id="phonenumber"
                  format="(##) ####-####"
                  mask="_"
                  required
                  ref={input => (this.input = input)}
                  value={memberItem.values['Phone Number']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(values, memberItem, 'Phone Number', e)
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
                  onChange={e => handleChange(memberItem, 'Date Joined', e)}
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
                  onChange={e => handleChange(memberItem, 'DOB', e)}
                />
              </div>
            </span>
            <span className="line">
              <div>
                <label
                  htmlFor="membertype"
                  required={
                    memberItem.values['Member Type'] === undefined
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
                  defaultValue={memberItem.values['Member Type']}
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
                    handleChange(memberItem, 'Emergency Contact Name', e)
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
                    handleChange(memberItem, 'Medical Allergies', e)
                  }
                />
              </div>
            </span>
          </div>
          <div className="section3">
            <h1>Ranking</h1>
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
                <label htmlFor="belt">Belt</label>
                <select
                  name="belt"
                  id="belt"
                  ref={input => (this.input = input)}
                  defaultValue={memberItem.values['Ranking Belt']}
                  onChange={e => handleChange(memberItem, 'Ranking Belt', e)}
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
                  onChange={e => handleChange(memberItem, 'Last Promotion', e)}
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
                    handleChange(memberItem, 'Next Schedule Promotion', e)
                  }
                />
              </div>
            </span>
          </div>
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
                  Save
                </button>
              </span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );

export const MemberNewContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ memberItem, createMember }) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveMember: ({
      memberItem,
      createMember,
      leadItem,
      updateLead,
      match,
    }) => () => {
      $('#duplicateUserInfo')
        .removeClass('show')
        .addClass('hide');
      var duplicateUser = false;
      /*      for (var i=0; i<memberItem.myThis.props.allMembers.length; i++) {
        console.log(memberItem.myThis.props.allMembers[i].username);
        console.log();
      	if (memberItem.myThis.props.allMembers[i].username===memberItem.username ||
            (getAttributeValue(memberItem, "First Name")===getAttributeValue(memberItem.myThis.props.allMembers[i], "First Name") &&
             getAttributeValue(memberItem, "Last Name")===getAttributeValue(memberItem.myThis.props.allMembers[i], "Last Name"))
        ) {
      		duplicateUser=true;
        }
      }
*/
      if (duplicateUser) {
        $('#duplicateUserInfo')
          .removeClass('hide')
          .addClass('show');
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
        memberItem.values['Status'] = 'Active';
        createMember({
          memberItem,
          history: memberItem.history,
          fetchMembers: memberItem.fetchMembers,
          leadId: match.params['leadId'],
          leadItem: leadItem,
          updateLead: updateLead,
        });
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchNewMember({
        myThis: this,
        history: this.props.history,
        fetchMembers: this.props.fetchMembers,
      });
      if (this.props.match.params['leadId']) {
        this.props.fetchLead({ id: this.props.match.params['leadId'] });
      }
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewMember({
          myThis: this,
          history: this.props.history,
          fetchMembers: this.props.fetchMembers,
        });
      }
      $('.memberEditDetails input').val('');
      $('.memberEditDetails select').val('');
      $(
        '.memberEditDetails input[required],.memberEditDetails select[required]',
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

      if (
        this.props.match.params['leadId'] &&
        nextProps.leadItem &&
        nextProps.leadItem.values &&
        nextProps.memberItem &&
        nextProps.memberItem.values
      ) {
        $('#firstName').val(nextProps.leadItem.values['First Name']);
        handleDynamicChange(nextProps.memberItem, 'First Name', 'firstName');
        $('#lastName').val(nextProps.leadItem.values['Last Name']);
        handleDynamicChange(nextProps.memberItem, 'Last Name', 'lastName');
        $('#username').val(
          nextProps.leadItem.values['First Name'] +
            nextProps.leadItem.values['Last Name'],
        );
        handleDynamicChange(nextProps.memberItem, 'Member ID', 'username');
        $('#gender').val(nextProps.leadItem.values['Gender']);
        handleDynamicChange(nextProps.memberItem, 'Gender', 'gender');
        $('#address').val(nextProps.leadItem.values['Address']);
        handleDynamicChange(nextProps.memberItem, 'Address', 'address');
        $('#suburb').val(nextProps.leadItem.values['Suburb']);
        handleDynamicChange(nextProps.memberItem, 'Suburb', 'suburb');
        $('#state').val(nextProps.leadItem.values['State']);
        handleDynamicChange(nextProps.memberItem, 'State', 'state');
        $('#email').val(nextProps.leadItem.values['Email']);
        handleDynamicChange(nextProps.memberItem, 'Email', 'email');
        $('#birthday').val(nextProps.leadItem.values['DOB']);
        handleDynamicChange(nextProps.memberItem, 'DOB', 'birthday');
        handleDynamicFormattedChange(
          nextProps.leadItem.values['Postcode'],
          nextProps.memberItem,
          'Postcode',
          'postcode',
        );
        handleDynamicFormattedChange(
          nextProps.leadItem.values['Phone'],
          nextProps.memberItem,
          'Phone Number',
          'phonenumber',
        );
      }
    },
    componentWillUnmount() {},
  }),
)(MemberNew);

import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { getJson } from '../Member/MemberUtils';
import moment from 'moment';
import { compose } from 'recompose';
import $ from 'jquery';
import { KappNavLink as NavLink } from 'common';
import { Utils } from 'common';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class ChangeStatusModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowChangeStatusModal(false);
  };
  constructor(props) {
    super(props);
    this.statusValues = props.memberStatusValues;
    this.parentMember = this.getParentMember();
    this.state = {};
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  isSingleBiller() {
    var parentMember = this.props.memberItem.values['Billing Parent Member'];
    var familyMembers = this.props.memberItem.values['Billing Family Members'];

    if (
      (this.props.memberItem.id === parentMember ||
        parentMember === undefined ||
        parentMember === null) &&
      this.props.memberItem.values['Billing User'] === 'YES'
    ) {
      if (familyMembers !== null && familyMembers !== undefined) {
        var dependants = JSON.parse(familyMembers);
        if (dependants.length === 1) {
          return true;
        }
      } else {
        return true;
      }
    }
    return false;
  }
  isPrimaryBiller() {
    //    var parentMember=this.props.memberItem.values['Billing Parent Member'];
    var familyMembers = this.props.memberItem.values['Billing Family Members'];

    //   	if (this.props.memberItem.id===parentMember && familyMembers!==null && familyMembers!==undefined){
    if (familyMembers !== null && familyMembers !== undefined) {
      var dependants = JSON.parse(familyMembers);
      var isPrimary = false;
      dependants.forEach(id => {
        if (id !== this.props.memberItem.id) {
          isPrimary = true;
        }
      });
      return isPrimary;
    }
    return false;
  }
  isDependantMember() {
    var parentMember = this.props.memberItem.values['Billing Parent Member'];

    if (
      parentMember !== undefined &&
      parentMember !== null &&
      this.props.memberItem.id !== parentMember
    ) {
      return true;
    }
    return false;
  }
  getParentMember() {
    var parentMember = this.props.memberItem.values['Billing Parent Member'];
    var idx = this.props.allMembers.findIndex(
      member => parentMember === member.id,
    );
    if (idx !== -1) {
      return this.props.allMembers[idx];
    }

    return this.props.memberItem;
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog
            className="setChangeStatusDialog"
            onClose={this.handleClose}
          >
            <div className="statusOptions">
              {Utils.getAttributeValue(this.props.space, 'Billing Company') ===
                'Bambora' && (
                <form>
                  <tbody>
                    {(this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.isPrimaryBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="resume">Resume Frozen Member</h2>
                              <h4>Primary Family Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is the Primary family member.
                              </span>
                              <br />
                              <span>
                                If you only wish to Resume this member only and
                                NOT the dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Switch the Billing Member to one of the
                                  dependant members.
                                </li>
                                <li>
                                  Complete the Bambora Setup Biller
                                  Details(Family) form to remove dependant
                                  members from billing.
                                </li>
                                <li>
                                  Set this student's status to Frozen(Edit
                                  member details), after completing the above
                                  form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span>
                                If you wish to Resume this member and ALL
                                dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-resume-frozen-member?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Resume Frozen Member form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.isDependantMember() && (
                        <span className="cell">
                          {this.parentMember.id !== this.props.memberItem.id &&
                            this.parentMember.values['Status'] === 'Active' && (
                              <tr>
                                <td>
                                  <h2 className="resume">
                                    Resume Frozen Member
                                  </h2>
                                  <h4>Dependant Family Member</h4>
                                  <span>
                                    The member selected{' '}
                                    <b>
                                      {
                                        this.props.memberItem.values[
                                          'First Name'
                                        ]
                                      }{' '}
                                      {
                                        this.props.memberItem.values[
                                          'Last Name'
                                        ]
                                      }
                                    </b>{' '}
                                    is a dependant family member.
                                  </span>
                                  <br />
                                  <span>
                                    To resume this member, please follow below.
                                  </span>
                                  <br />
                                  <ol>
                                    <li>
                                      Click{' '}
                                      <NavLink
                                        to={`/categories/bambora-billing/bambora-setup-biller-details?id=${this.props.memberItem.values['Billing Parent Member']}`}
                                        kappSlug={'services'}
                                        className={'nav-link icon-wrapper'}
                                        activeClassName="active"
                                        style={{ display: 'inline' }}
                                      >
                                        {' '}
                                        here{' '}
                                      </NavLink>{' '}
                                      to complete Bambora Setup Biller
                                      Details(Family) form to add this student
                                      to billing.
                                    </li>
                                    <li>
                                      Set this student's status to Active(Edit
                                      member details), after completing the
                                      above form.
                                    </li>
                                  </ol>
                                </td>
                              </tr>
                            )}
                          {this.parentMember.id !== this.props.memberItem.id &&
                            (this.parentMember.values['Status'] === 'Frozen' ||
                              this.parentMember.values['Status'] ===
                                'Pending Freeze') && (
                              <tr>
                                <td>
                                  <h2 className="resume">
                                    Resume Frozen Member
                                  </h2>
                                  <h4>Dependant Family Member</h4>
                                  <span>
                                    The member selected{' '}
                                    <b>
                                      {
                                        this.props.memberItem.values[
                                          'First Name'
                                        ]
                                      }{' '}
                                      {
                                        this.props.memberItem.values[
                                          'Last Name'
                                        ]
                                      }
                                    </b>{' '}
                                    is a dependant family member of{' '}
                                    <b>
                                      {this.parentMember.values['First Name']}{' '}
                                      {this.parentMember.values['Last Name']}
                                    </b>
                                    .
                                  </span>
                                  <br />
                                  <span>
                                    If you wish to only Resume this studunt
                                    please follow below.
                                  </span>
                                  <br />
                                  <ol>
                                    <li>
                                      Click{' '}
                                      <NavLink
                                        to={`/Member/${this.props.memberItem.values['Billing Parent Member']}`}
                                        kappSlug={'gbmembers'}
                                        className={'nav-link icon-wrapper'}
                                        activeClassName="active"
                                        style={{ display: 'inline' }}
                                      >
                                        {' '}
                                        here{' '}
                                      </NavLink>{' '}
                                      to Switch the Billing member{' '}
                                      <b>
                                        {this.parentMember.values['First Name']}{' '}
                                        {this.parentMember.values['Last Name']}
                                      </b>{' '}
                                      to{' '}
                                      <b>
                                        {
                                          this.props.memberItem.values[
                                            'First Name'
                                          ]
                                        }{' '}
                                        {
                                          this.props.memberItem.values[
                                            'Last Name'
                                          ]
                                        }
                                      </b>
                                      .
                                    </li>
                                    <li>
                                      Complete the Bambora Setup Biller
                                      Details(Family) form to remove other
                                      members from billing.
                                    </li>
                                    <li>
                                      Complete a Resume Membership Frozen form.
                                    </li>
                                  </ol>
                                </td>
                              </tr>
                            )}
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.props.memberItem.values['Billing Payment Type'] !==
                        'Cash' &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      this.isSingleBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="resume">Resume Frozen Member</h2>
                              <span>
                                To resume this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-resume-frozen-member?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Resume Frozen Membership form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      (this.props.memberItem.values['Non Paying'] === 'YES' ||
                        this.props.memberItem.values['Billing Payment Type'] ===
                          'Cash' ||
                        this.props.memberItem.values['Billing User'] ===
                          undefined ||
                        this.props.memberItem.values['Billing User'] === null ||
                        this.props.memberItem.values['Billing User'] ===
                          '') && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="resume">Resume Frozen Member</h2>
                              <span>
                                To resume this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Set this student's status to Active(Edit
                                  member details).
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Active' &&
                      this.isPrimaryBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="freeze">Freeze Member</h2>
                              <h4>Primary Family Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is the Primary family member.
                              </span>
                              <br />
                              <span>
                                If you only wish to Freeze this member only and
                                NOT the dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Switch the Billing Member to one of the
                                  dependant members.
                                </li>
                                <li>
                                  Complete the Bambora Setup Biller
                                  Details(Family) form to remove this student
                                  from billing.
                                </li>
                                <li>
                                  Set this student's status to Frozen(Edit
                                  member details), after completing the above
                                  form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span>
                                If you wish to Freeze this member and ALL
                                dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-membership-freeze?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Membership Freeze form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Active' &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.isDependantMember() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="freeze">Freeze Member</h2>
                              <h4>Dependant Family Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is a dependant family member.
                              </span>
                              <br />
                              <span>
                                To freeze this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-setup-biller-details?id=${this.props.memberItem.values['Billing Parent Member']}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete Bambora Setup Biller
                                  Details(Family) form to remove this student
                                  from billing.
                                </li>
                                <li>
                                  Set this student's status to Frozen(Edit
                                  member details), after completing the above
                                  form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Active' &&
                      this.props.memberItem.values['Non Paying'] === 'YES' && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="freeze">Freeze Member</h2>
                              <h4>Non Paying Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is a Non Paying member.
                              </span>
                              <br />
                              <span>
                                To freeze this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Set this student's status to Frozen(Edit
                                  member details).
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Active' &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      (this.props.memberItem.values['Billing Payment Type'] ===
                        'Cash' ||
                        this.props.memberItem.values['Billing User'] ===
                          undefined ||
                        this.props.memberItem.values['Billing User'] === null ||
                        this.props.memberItem.values['Billing User'] ===
                          '') && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="freeze">Freeze Member</h2>
                              <span>
                                To freeze this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Set this student's status to Freeze(Edit
                                  member details).
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Active' &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.props.memberItem.values['Billing Payment Type'] !==
                        'Cash' &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      this.isSingleBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="freeze">Freeze Member</h2>
                              <span>
                                To freeze this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-membership-freeze?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Membership Freeze form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Active' ||
                      this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.isPrimaryBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="cancel">Cancel Member</h2>
                              <h4>Primary Family Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is the Primary family member.
                              </span>
                              <br />
                              <span>
                                If you only wish to Cancel this member only and
                                NOT the dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Switch the Billing Member to one of the
                                  dependant members.
                                </li>
                                <li>
                                  Complete the Bambora Setup Biller
                                  Details(Family) form to remove this student
                                  from billing.
                                </li>
                                <li>
                                  Set this student's status to Inactive(Edit
                                  member details), after completing the above
                                  form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <span>
                                If you wish to Cancel this member and ALL
                                dependant members, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-member-cancellation?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Member Cancellation form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Active' ||
                      this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.isDependantMember() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="cancel">Cancel Member</h2>
                              <h4>Dependant Family Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is a dependant family member.
                              </span>
                              <br />
                              <span>
                                To cancel this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-setup-biller-details?id=${this.props.memberItem.values['Billing Parent Member']}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete Bambora Setup Biller
                                  Details(Family) form to remove this student
                                  from billing.
                                </li>
                                <li>
                                  Set this student's status to Inactive(Edit
                                  member details), after completing the above
                                  form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Active' ||
                      this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] === 'YES' && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="cancel">Cancel Member</h2>
                              <h4>Non Paying Member</h4>
                              <span>
                                The member selected{' '}
                                <b>
                                  {this.props.memberItem.values['First Name']}{' '}
                                  {this.props.memberItem.values['Last Name']}
                                </b>{' '}
                                is a Non Paying member.
                              </span>
                              <br />
                              <span>
                                To cancel this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Set this student's status to Inactive(Edit
                                  member details).
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Active' ||
                      this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      (this.props.memberItem.values['Billing Payment Type'] ===
                        'Cash' ||
                        this.props.memberItem.values['Billing User'] ===
                          undefined ||
                        this.props.memberItem.values['Billing User'] === null ||
                        this.props.memberItem.values['Billing User'] ===
                          '') && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="cancel">Cancel Member</h2>
                              <span>
                                To cancel this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Set this student's status to Inactive(Edit
                                  member details).
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {(this.props.memberItem.values['Status'] === 'Active' ||
                      this.props.memberItem.values['Status'] === 'Frozen' ||
                      this.props.memberItem.values['Status'] ===
                        'Pending Freeze') &&
                      this.props.memberItem.values['Non Paying'] !== 'YES' &&
                      this.props.memberItem.values['Billing Payment Type'] !==
                        'Cash' &&
                      !this.isPrimaryBiller() &&
                      !this.isDependantMember() &&
                      this.isSingleBiller() && (
                        <span className="cell">
                          <tr>
                            <td>
                              <h2 className="cancel">Cancel Member</h2>
                              <span>
                                To cancel this member, please follow below.
                              </span>
                              <br />
                              <ol>
                                <li>
                                  Click{' '}
                                  <NavLink
                                    to={`/categories/bambora-billing/bambora-member-cancellation?id=${this.props.memberItem.id}`}
                                    kappSlug={'services'}
                                    className={'nav-link icon-wrapper'}
                                    activeClassName="active"
                                    style={{ display: 'inline' }}
                                  >
                                    {' '}
                                    here{' '}
                                  </NavLink>{' '}
                                  to complete a Member Cancellation form.
                                </li>
                              </ol>
                            </td>
                          </tr>
                        </span>
                      )}
                    {this.props.memberItem.values['Status'] === 'Inactive' && (
                      <span className="cell">
                        <tr>
                          <td>
                            <h2 className="activate">Activate Member</h2>
                            <span>
                              To activate a Cancelled member, you must follow
                              below.
                            </span>
                            <br />
                            <ol>
                              <li>
                                Set this student's status to Active(Edit member
                                details).
                              </li>
                              <li>
                                Complete a Bambora Member Registration form.
                              </li>
                            </ol>
                          </td>
                        </tr>
                      </span>
                    )}
                  </tbody>
                </form>
              )}
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const ChangeStatusModalContainer = enhance(ChangeStatusModal);

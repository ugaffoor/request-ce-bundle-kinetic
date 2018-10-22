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
import $ from 'jquery';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { PaymentPeriod, PaymentType } from './BillingUtils';
import NumberFormat from 'react-number-format';
import {
  handleChange,
  handleFormattedChange,
  handleMultiSelectChange,
  getJson,
} from './MemberUtils';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import checkboxHOC from 'react-table/lib/hoc/selectTable';
import update from 'immutability-helper';
import { updateBillingMembers } from '../../redux/sagas/members';
import {
  getMembershipCost,
  getFamilyMembershipCost,
} from '../helpers/membershipFee';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import 'bootstrap/scss/bootstrap.scss';
import { DropDownEditor } from '../helpers/DropDownEditor';
import { DropDownFormatter } from '../helpers/DropDownFormatter';
import * as multi_select from '../helpers/jquery.multiselect.js';
import '../../styles/react_data_grid.scss';
import '../helpers/jquery.multiselect.css';
import { contact_date_format } from '../leads/LeadsUtils';
import mastercard from '../../images/Mastercard.gif';
import visa from '../../images/Visa.gif';
import amex from '../../images/Amex.jpg';
import jcb from '../../images/JCBCard.jpg';
import dinersclub from '../../images/DinersClub.jpg';
import { confirmWithInput } from './Confirm';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
<script src="../helpers/jquery.multiselect.js" />;

const ReactDataGrid = require('react-data-grid');

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  billingInfo: state.member.members.billingInfo,
  members: state.member.members.allMembers,
  billingInfoLoading: state.member.members.billingInfoLoading,
  completeMemberBilling: state.member.members.completeMemberBilling,
  currentMemberLoading: state.member.members.currentMemberLoading,
  allMembers: state.member.members.allMembers,
  membershipFees: state.member.app.membershipFees,
  paymentHistory: state.member.members.paymentHistory,
  paymentHistoryLoading: state.member.members.paymentHistoryLoading,
  familyMembers: state.member.members.familyMembers,
  removedBillingMembers: state.member.members.removedBillingMembers,
  billingDDRUrl: state.member.app.billingDDRUrl,
  billingWidgetUrl: state.member.app.billingWidgetUrl,
  profile: state.member.app.profile,
  billingCompany: state.member.app.billingCompany,
  ddrTemplates: state.member.app.ddrTemplates,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchBillingInfo: actions.fetchBillingInfo,
  fetchBillingInfoAfterRegistration: actions.fetchBillingInfoAfterRegistration,
  setBillingInfo: actions.setBillingInfo,
  setCurrentMember: actions.setCurrentMember,
  updateMember: actions.updateMember,
  fetchMembers: actions.fetchMembers,
  editPaymentAmount: actions.editPaymentAmount,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  clearPaymentSchedule: actions.clearPaymentSchedule,
  createPaymentSchedule: actions.createPaymentSchedule,
  fetchFamilyMembers: actions.fetchFamilyMembers,
  setFamilyMembers: actions.setFamilyMembers,
  registerBillingMember: actions.registerBillingMember,
  editPaymentMethod: actions.editPaymentMethod,
  refundTransaction: actions.refundTransaction,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchDdrStatus: actions.fetchDdrStatus,
};

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

function isValidFamilyMembers(familyMembers) {
  for (var i = 0; i < familyMembers.length; i++) {
    if (
      !familyMembers[i].values['Family Member Order'] ||
      !familyMembers[i].values['Fee Program']
    ) {
      return false;
    }
  }
  return true;
}

export function editPaymentType(event, myThis, setEditPaymentTypeReason) {
  confirmWithInput({ message: 'hello' }).then(
    ({ reason }) => {
      console.log('proceed! input:' + reason);
      if (myThis.props.billingCompany === 'EziDebit') {
        myThis.src =
          'https://widget.demo.ezidebit.com.au/account/view?dk=A0CC35A3-2E9F-4163-FCB0-A450B8FB6D9D&er=' +
          myThis.props.billingInfo.customerBillingId +
          '&E=1';

        myThis.props.setEditPaymentType(true);
      } else if (myThis.props.billingCompany === 'IntegraPay') {
        myThis.props.setEditPaymentTypeModal(true);
      } else if (myThis.props.billingCompany === 'PaySmart') {
        setEditPaymentTypeReason(reason);
        myThis.props.setEditPaymentTypeModal(true);
      }
    },
    () => {
      console.log('cancel!');
    },
  );
}

export function closeEditPaymentType(event, myThis) {
  myThis.props.setEditPaymentType(false);
}
export function startRegistration(event, setDoRegistration) {
  setDoRegistration(true);
}

export function startAddMember(event, setIsAddMember) {
  setIsAddMember(true);
}

function validateAndRegister(
  event,
  memberItem,
  setIsValidInput,
  setErrorMessage,
  setDoRegistration,
  setDoPaySmartRegistration,
  registerMember,
  billingCompany,
) {
  if (
    !memberItem.values['Billing First Name'] ||
    !memberItem.values['Billing Last Name'] ||
    !memberItem.values['Billing Email'] ||
    !memberItem.values['Billing Phone Number'] ||
    !memberItem.values['Billing Address'] ||
    !memberItem.values['Billing Suburb'] ||
    !memberItem.values['Billing State'] ||
    !memberItem.values['Billing Postcode']
  ) {
    setIsValidInput(false);
    setErrorMessage('Please provide values for all mandatory fields');
  } else {
    if (billingCompany === 'EziDebit') {
      startRegistration(event, setDoRegistration);
    } else if (billingCompany === 'IntegraPay') {
      registerMember(memberItem);
    } else if (billingCompany === 'PaySmart') {
      setDoPaySmartRegistration(true);
    } else {
      console.log(
        'Invalid billing company: ' + billingCompany + '. Nothing to do',
      );
    }
  }
}

const handleSaveBillingChanges = (
  saveMember,
  memberItem,
  updateMember,
  isDirty,
  myThis,
) => {
  confirmWithInput({ message: 'hello' }).then(
    ({ reason }) => {
      console.log('proceed! input:' + reason);
      saveMember(memberItem, updateMember, reason, isDirty, myThis);
    },
    () => {
      console.log('cancel!');
    },
  );
};

const copyToClipboard = str => {
  const el = document.createElement('textarea'); // Create a <textarea> element
  el.value = str; // Set its value to the string that you want copied
  el.setAttribute('readonly', ''); // Make it readonly to be tamper-proof
  el.style.position = 'absolute';
  el.style.left = '-9999px'; // Move outside the screen to make it invisible
  document.body.appendChild(el); // Append the <textarea> element to the HTML document
  const selected =
    document.getSelection().rangeCount > 0 // Check if there is any content selected previously
      ? document.getSelection().getRangeAt(0) // Store selection if found
      : false; // Mark as false to know no selection existed before
  el.select(); // Select the <textarea> content
  document.execCommand('copy'); // Copy - only works as a result of a user action (e.g. click events)
  document.body.removeChild(el); // Remove the <textarea> element
  if (selected) {
    // If a selection existed before copying
    document.getSelection().removeAllRanges(); // Unselect everything on the HTML document
    document.getSelection().addRange(selected); // Restore the original selection
  }
};

export class RegisterPaySmartMemberBilling extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setDoPaySmartRegistration(false);
  };
  constructor(props) {
    super(props);
    let data = this.getData(this.props.ddrTemplates);
    this.columns = this.getColumns();
    this.state = {
      data,
    };
  }
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }
  getData(ddrTemplates) {
    if (!ddrTemplates || ddrTemplates.size <= 0) {
      return [];
    }
    let data = [];
    ddrTemplates.forEach(template => {
      data.push({
        _id: template.name,
        name: template.name,
        url: template.url,
      });
    });
    return data;
  }
  getColumns(data) {
    const columns = [
      { accessor: 'name', Header: 'Name' },
      { accessor: 'url', Header: 'URL' },
      {
        accessor: '$launch',
        Cell: row => (
          <span>
            <a
              href={row.original['url']}
              target="_blank"
              className="btn btn-primary"
            >
              Launch
            </a>
          </span>
        ),
      },
      {
        accessor: '$copy',
        Cell: row => (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => copyToClipboard(row.original['url'])}
          >
            Copy URL
          </button>
        ),
      },
    ];
    return columns;
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        {this.state.isShowingModal && (
          <ModalContainer onClose={this.handleClose}>
            <ModalDialog
              style={{ width: '50%', height: '60%' }}
              onClose={this.handleClose}
            >
              <h1>DDR Templates</h1>
              <div>
                <ReactTable
                  columns={this.columns}
                  data={this.state.data}
                  className="-striped -highlight"
                  defaultPageSize={this.state.data.length}
                  pageSize={this.state.data.length}
                  showPagination={false}
                />
              </div>
            </ModalDialog>
          </ModalContainer>
        )}
      </div>
    );
  }
}

export class RegisterMemberBilling extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.setDoRegistration(false);
  };
  completeBillingSetup = () => {
    this.completeMemberRegistration(
      this.props.memberItem,
      this.fetchBillingInfoAfterRegistration,
      this.setBillingInfo,
      this.updateMember,
    );
  };
  constructor(props) {
    super(props);
    this.memberItem = this.props.memberItem;
    this.setDoRegistration = this.props.setDoRegistration;
    this.completeMemberRegistration = this.props.completeMemberRegistration;
    this.fetchBillingInfoAfterRegistration = this.props.fetchBillingInfoAfterRegistration;
    this.setBillingInfo = this.props.setBillingInfo;
    this.updateMember = this.props.updateMember;
    this.billingDDRUrl = this.props.billingDDRUrl;

    this.src =
      this.billingDDRUrl +
      '&debits=2&uRefLabel=MemberID&uRef=' +
      props.memberItem.values['Member ID'] +
      '&businessOrPerson=1' +
      '&fName=' +
      this.memberItem.values['Billing First Name'] +
      '&lName=' +
      this.memberItem.values['Billing Last Name'] +
      '&email=' +
      this.memberItem.values['Billing Email'] +
      '&mobile=' +
      this.memberItem.values['Billing Phone Number'] +
      '&addr=' +
      this.memberItem.values['Billing Address'] +
      '&suburb=' +
      this.memberItem.values['Billing Suburb'] +
      '&state=' +
      this.memberItem.values['Billing State'] +
      '&pCode=' +
      this.memberItem.values['Billing Postcode'] +
      '&rAmount=' +
      this.memberItem.values['Membership Cost'] +
      '&rDate=' +
      moment($('#billingStartDate').val(), 'YYYY-MM-DD').format('DD/MM/YYYY') +
      '&aFreq=6' +
      '&freq=2' +
      '&aDur=1' +
      '&dur=1';
    // Including &ed=1 Allowing editing causes The One Time payment to show.
  }
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        {this.state.isShowingModal &&
          (this.props.billingCustomerId === null ||
            this.props.billingCustomerId === undefined) && (
            <ModalContainer onClose={this.handleClose}>
              <ModalDialog
                className="billingRegistrationDialog"
                onClose={this.handleClose}
              >
                <h1>Setup Membership Billing</h1>
                <iframe
                  src={this.src}
                  title="Setup Membership Billing"
                  width="100%"
                  height="100%"
                  id="registeriFrame"
                  className="registeriFrame"
                  allowFullScreen
                />
                <div>
                  <button
                    type="button"
                    id="completeBillingSetup"
                    className="btn btn-primary"
                    onClick={e => this.completeBillingSetup()}
                  >
                    Complete Member Billing
                  </button>
                  {this.props.billingInfoLoading && <ReactSpinner />}
                  <button
                    type="button"
                    id="cancelBillingSetup"
                    className="btn btn-primary"
                    onClick={e => this.handleClose()}
                  >
                    Cancel
                  </button>
                </div>
              </ModalDialog>
            </ModalContainer>
          )}
      </div>
    );
  }
}

export class EditPaymentType extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setEditPaymentTypeModal(false);
  };
  constructor(props) {
    super(props);
    this.onPaymentMethodChange = this.onPaymentMethodChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updatePaymentMethod = this.updatePaymentMethod.bind(this);

    this.state = {
      paymentMethod: 'cc',
      creditCardNumber: '',
      creditCardType: '',
      expiryMonth: '',
      expiryYear: '',
      creditCardName: '',
      bankAccountName: '',
      bankAccountBsb: '',
      bankAccountNumber: '',
    };
  }
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }
  onPaymentMethodChange(event, methodType) {
    console.log(event.target.checked + ' : ' + methodType);
    if (methodType === 'cc') {
      $('#ccForm').css('display', 'block');
      $('#bankForm').css('display', 'none');
    } else if (methodType === 'bank') {
      $('#ccForm').css('display', 'none');
      $('#bankForm').css('display', 'block');
    }
    this.setState({
      paymentMethod: event.target.value,
    });
  }
  handleInputChange(event) {
    const target = event.target;
    const value = target.value;
    const name = target.name;
    //console.log(" name = " + name + " , val = " + value);
    this.setState({
      [name]: value,
    });
  }

  updatePaymentMethod() {
    if (this.state.paymentMethod === 'cc') {
      if (
        !this.state.creditCardNumber ||
        !this.state.creditCardType ||
        !this.state.creditCardName ||
        !this.state.expiryMonth ||
        !this.state.expiryYear
      ) {
        console.log('Please provide all required values');
        return;
      }

      let paymentMethod = {
        methodName: 'CREDITCARD',
        creditCardNumber: this.state.creditCardNumber,
        creditCardType: this.state.creditCardType,
        creditCardExpiryDate:
          this.state.expiryMonth + '/' + this.state.expiryYear,
        creditCardName: this.state.creditCardName,
      };
      this.props.updatePaymentMethod(paymentMethod);
      this.handleClose();
    }

    if (this.state.paymentMethod === 'bank') {
      if (
        !this.state.bankAccountName ||
        !this.state.bankAccountBsb ||
        !this.state.bankAccountNumber
      ) {
        console.log('Please provide all required values');
        return;
      }

      let paymentMethod = {
        methodName: 'BANKACCOUNT',
        bankAccountName: this.state.bankAccountName,
        bankAccountBsb: this.state.bankAccountBsb,
        bankAccountNumber: this.state.bankAccountNumber,
      };
      this.props.updatePaymentMethod(paymentMethod);
      this.handleClose();
    }
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose}>
            <ModalDialog className="" onClose={this.handleClose}>
              <div className="card-title">
                <h3>Edit Payment Type</h3>
              </div>
              <div className="container">
                <div className="form-check-inline">
                  <label className="form-check-label">
                    <input
                      type="radio"
                      className="form-check-input"
                      value="bank"
                      name="paymentMethod"
                      checked={this.state.paymentMethod === 'bank'}
                      onChange={e => this.onPaymentMethodChange(e, 'bank')}
                    />{' '}
                    Debit my bank account
                  </label>
                </div>
                <div className="form-check-inline">
                  <label className="form-check-label">
                    <input
                      type="radio"
                      className="form-check-input"
                      value="cc"
                      name="paymentMethod"
                      checked={this.state.paymentMethod === 'cc'}
                      onChange={e => this.onPaymentMethodChange(e, 'cc')}
                    />{' '}
                    Debit my credit card
                  </label>
                </div>
                <form className="form-horizontal" role="form" id="ccForm">
                  <div className="form-group text-left">
                    <ul className="list-inline">
                      <li className="list-inline-item">Supported Cards</li>
                      <li className="list-inline-item">
                        <img src={mastercard} className="supported-card-icon" />
                      </li>
                      <li className="list-inline-item">
                        <img src={visa} className="supported-card-icon" />
                      </li>
                      <li className="list-inline-item">
                        <img src={amex} className="supported-card-icon" />
                      </li>
                      <li className="list-inline-item">
                        <img src={dinersclub} className="supported-card-icon" />
                      </li>
                      <li className="list-inline-item">
                        <img src={jcb} className="supported-card-icon" />
                      </li>
                    </ul>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="creditCardNumber"
                    >
                      Card Number
                    </label>
                    <div className="col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        name="creditCardNumber"
                        id="creditCardNumber"
                        onChange={this.handleInputChange}
                        placeholder="Credit card number"
                      />
                    </div>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="creditCardType"
                    >
                      Card Type
                    </label>
                    <div className="col-sm-4">
                      <select
                        className="form-control"
                        name="creditCardType"
                        id="creditCardType"
                        onChange={this.handleInputChange}
                      >
                        <option value="">--</option>
                        <option value="Visa">Visa</option>
                        <option value="MasterCard">MasterCard</option>
                        <option value="American Express">
                          American Express
                        </option>
                        <option value="Diners Club">Diners Club</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="expiryMonth"
                    >
                      Expiry Date
                    </label>
                    <div className="col-sm-4">
                      <div className="col-xs-3">
                        <select
                          className="form-control"
                          name="expiryMonth"
                          id="expiryMonth"
                          onChange={this.handleInputChange}
                        >
                          <option value="">Month</option>
                          <option value="01">(1) Jan</option>
                          <option value="02">(2) Feb</option>
                          <option value="03">(3) Mar</option>
                          <option value="04">(4) Apr</option>
                          <option value="05">(5) May</option>
                          <option value="06">(6) Jun</option>
                          <option value="07">(7) Jul</option>
                          <option value="08">(8) Aug</option>
                          <option value="09">(9) Sep</option>
                          <option value="10">(10) Oct</option>
                          <option value="11">(11) Nov</option>
                          <option value="12">(12) Dec</option>
                        </select>
                      </div>
                      <div className="col-xs-3">
                        <select
                          className="form-control"
                          name="expiryYear"
                          id="expiryYear"
                          onChange={this.handleInputChange}
                        >
                          <option value="">Year</option>
                          <option value="2018">2018</option>
                          <option value="2019">2019</option>
                          <option value="2020">2020</option>
                          <option value="2021">2021</option>
                          <option value="2022">2022</option>
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                          <option value="2027">2027</option>
                          <option value="2028">2028</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="creditCardName"
                    >
                      Name on Card
                    </label>
                    <div className="col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        name="creditCardName"
                        id="creditCardName"
                        placeholder="Card holder's name"
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                </form>
                <form
                  className="form-horizontal"
                  role="form"
                  id="bankForm"
                  style={{ display: 'none' }}
                >
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="bankAccountName"
                    >
                      Account Name
                    </label>
                    <div className="col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        name="bankAccountName"
                        id="bankAccountName"
                        placeholder="Account holder's name"
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="bankAccountBsb"
                    >
                      BSB
                    </label>
                    <div className="col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        name="bankAccountBsb"
                        id="bankAccountBsb"
                        placeholder="The branch identifier"
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="form-group row">
                    <label
                      className="col-sm-2 col-form-label"
                      htmlFor="bankAccountNumber"
                    >
                      Account Number
                    </label>
                    <div className="col-sm-4">
                      <input
                        type="text"
                        className="form-control"
                        name="bankAccountNumber"
                        id="bankAccountNumber"
                        placeholder="The bank account number"
                        onChange={this.handleInputChange}
                      />
                    </div>
                  </div>
                </form>
              </div>
              <div>
                <button
                  type="button"
                  id="updatePaymentMethod"
                  className="btn btn-primary"
                  onClick={e => this.updatePaymentMethod()}
                  style={{ backgroundColor: '#991B1E' }}
                >
                  Edit Payment Method
                </button>
                &nbsp;
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={e => this.handleClose()}
                  style={{ backgroundColor: '#991B1E' }}
                >
                  Cancel
                </button>
              </div>
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

const CheckboxTable = checkboxHOC(ReactTable);
const util = require('util');

export class AddMember extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.setIsAddMember(false);
  };

  constructor(props) {
    super(props);
    this.setIsAddMember = this.props.setIsAddMember;
    this.allMembers = this.props.allMembers;
    this.memberItem = this.props.memberItem;
    this.addBillingMembers = this.props.addBillingMembers;
    this.familyMembers = this.props.familyMembers;
    this.setIsDirty = this.props.setIsDirty;
    this.myThis = this.props.myThis;
    const data = this.getTableData(
      this.allMembers,
      this.familyMembers,
      this.memberItem,
    );
    const columns = this.getTableColumns(data);

    this.state = {
      data,
      columns,
      selection: [],
      selectAll: false,
    };
  }

  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  getTableData(allMembers, familyMembers, memberItem) {
    const tempData = allMembers.filter(member => {
      return (
        member.values['Status'] === 'Active' &&
        !familyMembers.some(existing => existing['id'] === member['id']) &&
        member.values['Member ID'] !== memberItem.values['Member ID'] &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '') &&
        (member.values['Billing Customer Id'] === undefined ||
          member.values['Billing Customer Id'] === '')
      );
    });

    const data = tempData.map(member => {
      return {
        _id: member['id'],
        ...member.values,
      };
    });
    return data;
  }

  getTableColumns(data) {
    const columns = [];
    const allowedCols = [
      'Member ID',
      'First Name',
      'Last Name',
      'Gender',
      'Status',
      'Member Type',
      'Ranking Program',
    ];
    const sample = data[0];
    var columKeys =
      data !== undefined && data !== null && data.length > 0
        ? Object.keys(sample)
        : allowedCols;
    columKeys.forEach(key => {
      if (key !== '_id' && $.inArray(key, allowedCols) >= 0) {
        columns.push({
          accessor: key,
          Header: key,
        });
      }
    });

    return columns;
  }

  toggleSelection = (key, shift, row) => {
    // start off with the existing state
    let selection = [...this.state.selection];
    const keyIndex = selection.indexOf(key);
    // check to see if the key exists
    if (keyIndex >= 0) {
      // it does exist so we will remove it using destructing
      selection = [
        ...selection.slice(0, keyIndex),
        ...selection.slice(keyIndex + 1),
      ];
    } else {
      // it does not exist so add it
      selection.push(key);
    }
    // update the state
    this.setState({ selection });
  };

  toggleAll = () => {
    const selectAll = this.state.selectAll ? false : true;
    const selection = [];
    if (selectAll) {
      // we need to get at the internals of ReactTable
      const wrappedInstance = this.checkboxTable.getWrappedInstance();
      // the 'sortedData' property contains the currently accessible records based on the filter and sort
      const currentRecords = wrappedInstance.getResolvedState().sortedData;
      // we just push all the IDs onto the selection array
      currentRecords.forEach(item => {
        selection.push(item._original._id);
      });
    }
    this.setState({ selectAll, selection });
  };

  isSelected = key => {
    return this.state.selection.includes(key);
  };

  addSelected = () => {
    let selectedIds = this.state.selection;
    /*var result = this.state.data.filter(function( obj ) {
          return $.inArray(obj._id, selectedIds) >= 0;
        });*/
    var members = this.allMembers.filter(member => {
      return selectedIds.some(id => id === member['id']);
    });
    this.addBillingMembers(members, this.myThis);
    this.handleClose();
    this.setIsDirty(true);
  };

  render() {
    const { toggleSelection, toggleAll, isSelected, addSelected } = this;
    const { data, columns, selectAll } = this.state;

    const checkboxProps = {
      selectAll,
      isSelected,
      toggleSelection,
      toggleAll,
      selectType: 'checkbox',
    };

    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose} style={{ width: '90vw' }}>
            <ModalDialog
              className="addBillingMember"
              style={{ width: '90vw' }}
              onClose={this.handleClose}
            >
              <h1>Add Billing Members</h1>
              <div>
                <button onClick={addSelected}>Add Billing Members</button>
                <CheckboxTable
                  ref={r => (this.checkboxTable = r)}
                  data={data}
                  columns={columns}
                  defaultPageSize={5}
                  filterable={true}
                  className="-striped -highlight"
                  {...checkboxProps}
                />
                <button
                  type="button"
                  id="cancelAddMember"
                  className="btn btn-primary"
                  onClick={e => this.handleClose()}
                >
                  Close
                </button>
              </div>
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

export class BillingParentInfo extends Component {
  constructor(props) {
    super(props);
    this.memberId = this.props.memberId;
    this.allMembers = this.props.allMembers;
    this.member = undefined;
    for (var j = 0; j < this.props.allMembers.length; j++) {
      if (
        this.props.allMembers[j]['id'] === this.memberId ||
        this.props.allMembers[j].values['Member ID'] === this.memberId
      ) {
        this.member = this.props.allMembers[j];
        break;
      }
    }
  }

  render() {
    return (
      <span>
        <div className="userDetails">
          <h4>Parent Billing Member Details</h4>
          <hr />
          <div className="section1">
            <span className="line">
              <div>
                <NavLink
                  to={`/Member/${this.member.id}`}
                  className={'nav-link icon-wrapper'}
                  activeClassName="active"
                >
                  {this.member.values['First Name']}{' '}
                  {this.member.values['Last Name']}
                </NavLink>
              </div>
            </span>
          </div>
        </div>
      </span>
    );
  }
}

export class FamilyMembers extends Component {
  render() {
    return this.props.memberItem.values['Billing Members'] !== undefined &&
      this.props.memberItem.values['Billing Members'] !== '' &&
      JSON.parse(this.props.memberItem.values['Billing Members']) !== null ? (
      <div className="section2">
        <h1>Family Members</h1>
        <hr />
        <table>
          <tr>
            <th width="100%">Name</th>
          </tr>
          {JSON.parse(this.props.memberItem.values['Billing Members']).map(
            member => (
              <tr>
                <td>{member.member}</td>
              </tr>
            ),
          )}
        </table>
      </div>
    ) : (
      <div />
    );
  }
}

export class FamilyFeeDetails extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(
      this.props.memberItem,
      this.props.familyMembers,
      this.props.membershipFees,
    );
    let columns = this.getColumns(data);
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.familyMembers) {
      this.setState({
        data: this.getData(
          nextProps.memberItem,
          nextProps.familyMembers,
          this.props.membershipFees,
        ),
        columns: this.getColumns(
          this.getData(
            nextProps.memberItem,
            nextProps.familyMembers,
            this.props.membershipFees,
          ),
        ),
      });
    }
  }

  getData(memberItem, familyMembers, membershipFees) {
    if (!familyMembers) {
      return [];
    }
    let feeDetails = getFamilyMemberFeeDetails(familyMembers, membershipFees);
    const data = feeDetails.map(details => {
      let member = familyMembers.find(member => member['id'] === details['id']);
      return {
        _id: details['id'],
        member: member.values['First Name'] + ' ' + member.values['Last Name'],
        program: getJson(details.program).join(', '),
        fee: details.fee,
        order: details.order,
        discount: details.discount,
        cost: details.cost,
      };
    });

    let program = '';
    if (getJson(memberItem.values['Fee Program'])) {
      program = getJson(memberItem.values['Fee Program']).join(', ');
    }

    let fee = getMembershipCost(memberItem, membershipFees);
    let parentFeeDtls = {
      id: memberItem['id'],
      member:
        memberItem.values['First Name'] + ' ' + memberItem.values['Last Name'],
      program: program,
      fee: fee,
      order: 'NA',
      discount: 'NA',
      cost: fee,
    };
    data.unshift(parentFeeDtls);
    return data;
  }

  getColumns(data) {
    let costSum = 0.0;
    if (data) {
      data.forEach(feeProgram => {
        if (feeProgram.cost) {
          costSum += Number(feeProgram.cost);
        } else {
          costSum += 0.0;
        }
      });
    }
    const columns = [
      { accessor: 'member', Header: 'Member' },
      {
        accessor: 'program',
        Header: 'Program',
        Cell: props => (props.value ? props.value : 'NA'),
      },
      {
        accessor: 'fee',
        Header: 'Fee',
        Cell: props => (props.value ? '$' + props.value : 'NA'),
      },
      {
        accessor: 'order',
        Header: 'Order',
        Cell: props =>
          props.value
            ? props.value.charAt(0).toUpperCase() + props.value.slice(1)
            : 'NA',
      },
      {
        accessor: 'discount',
        Header: 'Discount',
        Footer: 'Total:',
        Cell: props =>
          props.value
            ? props.value === 'NA'
              ? props.value
              : props.value + '%'
            : 'NA',
      },
      {
        accessor: 'cost',
        Header: 'Cost',
        Footer: '$' + costSum,
        Cell: props => (props.value ? '$' + props.value : 'NA'),
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return (
      <ReactTable
        columns={columns}
        data={data}
        className="-striped -highlight"
        defaultPageSize={data.length}
        pageSize={data.length}
        showPagination={false}
      />
    );
  }
}

export class PaymentHistory extends Component {
  constructor(props) {
    super(props);
    this.refundPayment = this.refundPayment.bind(this);
    this.paymentHistory = this.props.paymentHistory;
    let data = this.getData(this.paymentHistory);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.paymentHistory) {
      this.paymentHistory = nextProps.paymentHistory;
      this.setState({
        data: this.getData(nextProps.paymentHistory),
      });
    }
  }

  getData(payments) {
    const data = payments.map(payment => {
      return {
        _id: payment.paymentID,
        scheduledAmount: payment.scheduledAmount,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        transactionFee: payment.transactionFeeCustomer,
        debitDate: payment.debitDate,
      };
    });
    return data;
  }

  isPaymentRefunded(paymentId, paymentsRefunded) {
    return paymentsRefunded.find(id => id === paymentId) ? true : false;
  }

  getColumns(data) {
    let paymentsRefunded =
      typeof this.props.memberItem.values['Refunded Payments'] === 'object'
        ? this.props.memberItem.values['Refunded Payments']
        : this.props.memberItem.values['Refunded Payments']
          ? JSON.parse(this.props.memberItem.values['Refunded Payments'])
          : [];

    const columns = [
      {
        accessor: 'scheduledAmount',
        Header: 'Scheduled Amount',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'paymentAmount',
        Header: 'Payment Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'paymentMethod', Header: 'Payment Method' },
      { accessor: 'paymentStatus', Header: 'Payment Status' },
      {
        accessor: 'transactionFee',
        Header: 'Transaction Fee',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'debitDate',
        Header: 'Debit Date',
        Cell: props =>
          moment(props.value, ezidebit_date_format).format('YYYY-MM-DD'),
      },
      {
        accessor: '$refundPayment',
        Cell: row =>
          !this.isPaymentRefunded(row.original['_id'], paymentsRefunded) &&
          (row.original.paymentStatus === 'S' ||
            row.original.paymentStatus === 'Settled') ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={e =>
                this.refundPayment(
                  row.original['_id'],
                  row.original.paymentAmount,
                )
              }
            >
              Refund Payment
            </button>
          ) : (
            ''
          ),
      },
    ];
    return columns;
  }

  refundPayment(paymentId, amount) {
    confirmWithInput({ message: 'hello' }).then(
      ({ reason }) => {
        console.log('proceed! input:' + reason);
        this.props.refundPayment(paymentId, amount, reason);
      },
      () => {
        console.log('cancel!');
      },
    );
  }

  render() {
    const { data, columns } = this.state;
    return this.props.paymentHistoryLoading ? (
      <div>Loading Payment History ...</div>
    ) : (
      <ReactTable
        columns={columns}
        data={data}
        className="-striped -highlight"
        defaultPageSize={data.length > 0 ? data.length : 2}
        pageSize={data.length > 0 ? data.length : 2}
        showPagination={false}
      />
    );
  }
}

var errorMessageDiv = {
  color: '#D8000C',
  background: '#FFBABA',
};

var emptyRowsDiv = {
  textAlign: 'center',
  verticalAlign: 'middle',
  color: '#808080',
};
var createReactClass = require('create-react-class');
const EmptyRowsView = createReactClass({
  render() {
    return <div style={emptyRowsDiv}>No rows found</div>;
  },
});

class BillingAudit extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowBillingAudit(false);
  };

  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  componentWillMount() {}
  componentDidMount() {}
  getColumns() {
    return [
      { accessor: 'date', Header: 'Date' },
      { accessor: 'user', Header: 'User' },
      { accessor: 'action', Header: 'Action' },
      {
        accessor: 'to',
        Header: 'To',
        Cell: props =>
          typeof props.value === 'object'
            ? objectToString(props.value)
            : props.value
              ? props.value
              : '',
      },
      { accessor: 'reason', Header: 'Reason' },
    ];
  }

  getData(memberItem) {
    let billingChanges = memberItem.values['Billing Changes'];
    console.log('billingChanges=' + util.inspect(billingChanges));
    if (!billingChanges) {
      return [];
    } else if (typeof billingChanges !== 'object') {
      billingChanges = JSON.parse(billingChanges);
    }

    return billingChanges.sort(function(change1, change2) {
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
            <ModalDialog className="billingAudit" onClose={this.handleClose}>
              <h1>
                Billing Audit for {this.props.memberItem.values['First Name']}{' '}
                {this.props.memberItem.values['Last Name']}
              </h1>
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

export class BillerDetails extends Component {
  constructor(props) {
    super(props);
    this.removeBillingMember = this.props.removeBillingMember;
    this.updateBillingMember = this.props.updateBillingMember;
    this.myThis = this.props.myThis;
    this.setIsDirty = this.props.setIsDirty;
    this.setIsValidInput = this.props.setIsValidInput;
    this.setErrorMessage = this.props.setErrorMessage;
    this.onFeeProgramChange = this.props.onFeeProgramChange;
    this.setIsAddMember = this.props.setIsAddMember;

    let billingMembers = this.getData(this.props.familyMembers);
    this.formattedFeeData = this.getFormattedFeeData(this.props.membershipFees);
    this._columns = this.getColumns();
    let showFamilyBillingDetails = false;
    let familyBillingDtlsBtnLabel = 'Show Family Billing  Details';
    this.showHideFamilyBillingDtls = this.showHideFamilyBillingDtls.bind(this);
    this.onFeeProgramOptionClick = this.onFeeProgramOptionClick.bind(this);

    this.state = {
      billingMembers,
      showFamilyBillingDetails,
      familyBillingDtlsBtnLabel,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (
      nextProps.familyMembers !== undefined &&
      nextProps.familyMembers !== null
    ) {
      this.setState({
        billingMembers: this.getData(nextProps.familyMembers),
      });
    }
  }

  componentDidUpdate() {
    let elm = this.refs.errorDiv;
    if (elm) {
      //window.scrollTo(0, 0);
      let scrollTodiv = this.refs.scrollToDiv;
      scrollTodiv.scrollIntoView();
      //elm.scrollIntoView(true);
    }
  }

  componentDidMount() {
    this.refs.feeProgramDiv &&
      $(this.refs.feeProgramDiv)
        .find('select')
        .multiselect({
          onOptionClick: this.onFeeProgramOptionClick,
          texts: { placeholder: 'Select Program' },
          checkboxAutoFit: true,
        });
  }

  onFeeProgramOptionClick(element, option) {
    this.onFeeProgramChange(
      'Fee Program',
      element,
      this.setIsDirty,
      this.myThis,
    );
  }

  showHideFamilyBillingDtls() {
    let label = null;
    if (this.state.showFamilyBillingDetails) {
      label = 'Show Family Billing  Details';
    } else {
      label = 'Hide Family Billing  Details';
    }

    this.setState({
      showFamilyBillingDetails: !this.state.showFamilyBillingDetails,
      familyBillingDtlsBtnLabel: label,
    });
  }

  getFormattedFeeData(memberFeeData) {
    const feeData = [];
    memberFeeData.forEach(item => {
      var text = item.program + ' - $' + item.fee;
      feeData.push({
        id: item.program,
        value: item.program,
        text: text,
        title: item.info,
      });
    });
    return feeData;
  }

  deleteRows(id) {
    console.log('# DELETE called id = ' + id);
    this.removeBillingMember(id, this.myThis);
    this.setIsDirty(true);
  }

  rowGetter = i => {
    return this.state.billingMembers[i];
  };

  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    console.log('### ROW updated # updated # ' + util.inspect(updated));
    if (fromRow !== toRow) {
      //if user has updated multiple rows using cell drag
      return;
    }
    let rows = this.state.billingMembers.slice();
    let updatedKey = Object.keys(updated)[0];
    let originalValue = rows[fromRow][updatedKey];
    console.log(
      '#### ' +
        util.inspect(originalValue) +
        ', # ' +
        util.inspect(updated[updatedKey]),
    );
    if (updatedKey === 'Fee Program') {
      if (!originalValue) {
        originalValue = [];
      }
      if (isArraysEqual(originalValue, updated[updatedKey])) {
        return;
      }
    } else {
      if (originalValue === updated[updatedKey]) {
        return;
      }
    }
    var updatedMember = this.props.familyMembers.filter(
      member => member['id'] === rows[fromRow]['id'],
    )[0];
    for (let i = fromRow; i <= toRow; i++) {
      let rowToUpdate = rows[i];
      let updatedRow = update(rowToUpdate, { $merge: updated });
      rows[i] = updatedRow;
    }
    this.updateBillingMember(updatedMember['id'], updated, this.myThis);
    this.setState({ billingMembers: rows });
    this.setIsDirty(true);
  };

  getData(familyMembers) {
    const memberData = familyMembers.map(member => {
      return {
        id: member['id'],
        ...member.values,
      };
    });
    //Fix for react-data-grid issue wherein DropDownEditor throws an exception if element is present
    //but null or undefined
    memberData.forEach(member => {
      if (member && !member['Family Member Order']) {
        delete member['Family Member Order'];
      }
      if (member && !member['Fee Program']) {
        delete member['Fee Program'];
      }
    });
    return memberData;
  }

  getColumns = () => {
    const memberOrder = [
      {
        id: 'first',
        value: 'first',
        text: 'First',
        title: 'First family member',
      },
      {
        id: 'second',
        value: 'second',
        text: 'Second',
        title: 'Second family member',
      },
      {
        id: 'third',
        value: 'third',
        text: 'Third',
        title: 'Third family member',
      },
    ];

    const memberOrderEditor = <DropDownEditor options={memberOrder} />;
    const memberOrderFormatter = (
      <DropDownFormatter
        options={memberOrder}
        value="first"
        message="Required information must be entered ('Member Order')"
      />
    );
    const programsEditor = (
      <DropDownEditor options={this.formattedFeeData} multiple={true} />
    );
    const programsFormatter = (
      <DropDownFormatter
        options={this.formattedFeeData}
        value={['GBK1']}
        message="Required information must be entered ('Fee Program')"
        multiple={true}
      />
    );

    return [
      { key: 'Member ID', name: 'Member ID', resizable: true },
      { key: 'First Name', name: 'First Name', resizable: true },
      { key: 'Last Name', name: 'Last Name', resizable: true },
      {
        key: 'Fee Program',
        name: 'Fee Program',
        resizable: true,
        editor: programsEditor,
        formatter: programsFormatter,
      },
      {
        key: 'Family Member Order',
        name: 'Order',
        resizable: true,
        editor: memberOrderEditor,
        formatter: memberOrderFormatter,
      },
      {
        key: '$delete',
        name: 'Remove',
        resizable: true,
        getRowMetaData: row => row,
        formatter: ({ dependentValues }) => (
          <span>
            <a
              href="javascript:;"
              onClick={() => this.deleteRows(dependentValues['id'])}
            >
              Delete
            </a>
          </span>
        ),
      },
    ];
  };

  render() {
    if (
      this.props.memberItem.values['Billing Parent Member'] !== undefined &&
      this.props.memberItem.values['Billing Parent Member'] !== null
    ) {
      return (
        <BillingParentInfo
          memberId={this.props.memberItem.values['Billing Parent Member']}
          allMembers={this.props.allMembers}
        />
      );
    }

    const { data, columns } = this.state;
    return (
      <span>
        <div ref="scrollToDiv" />
        <div className="userDetails">
          <h4>Biller Details</h4>
          <hr />
          {!this.props.isValidInput ? (
            <div ref="errorDiv" style={errorMessageDiv}>
              {this.props.errorMessage}
            </div>
          ) : (
            ''
          )}
          <hr />
          <div className="section1">
            <span className="line">
              <div>
                <label
                  htmlFor="firstName"
                  required={
                    this.props.memberItem.values['Billing First Name'] ===
                    undefined
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
                  defaultValue={
                    this.props.memberItem.values['Billing First Name']
                  }
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing First Name',
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
                    this.props.memberItem.values['Billing Last Name'] ===
                    undefined
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
                  defaultValue={
                    this.props.memberItem.values['Billing Last Name']
                  }
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing Last Name',
                      e,
                      this.setIsDirty,
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
                    this.props.memberItem.values['Billing Email'] === null
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
                  defaultValue={this.props.memberItem.values['Billing Email']}
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing Email',
                      e,
                      this.setIsDirty,
                    )
                  }
                />
              </div>
              <div>
                <label
                  htmlFor="phone"
                  required={
                    this.props.memberItem.values['Billing Phone Number'] ===
                    undefined
                      ? true
                      : false
                  }
                >
                  Phone
                </label>
                <NumberFormat
                  format="+1 (###) ###-####"
                  mask="_"
                  required
                  ref={input => (this.input = input)}
                  value={this.props.memberItem.values['Billing Phone Number']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(
                      values,
                      this.props.memberItem,
                      'Billing Phone Number',
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
                  htmlFor="address"
                  required={
                    this.props.memberItem.values['Billing Address'] ===
                    undefined
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
                  defaultValue={this.props.memberItem.values['Billing Address']}
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing Address',
                      e,
                      this.setIsDirty,
                    )
                  }
                />
              </div>
            </span>
            <span className="line" />
            <span className="line">
              <div>
                <label
                  htmlFor="suburb"
                  required={
                    this.props.memberItem.values['Billing Suburb'] === undefined
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
                  defaultValue={this.props.memberItem.values['Billing Suburb']}
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing Suburb',
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
                    this.props.memberItem.values['Billing State'] === undefined
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
                  defaultValue={this.props.memberItem.values['Billing State']}
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Billing State',
                      e,
                      this.setIsDirty,
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
                    this.props.memberItem.values['Billing Postcode'] ===
                    undefined
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
                  value={this.props.memberItem.values['Billing Postcode']}
                  onValueChange={(values, e) =>
                    handleFormattedChange(
                      values,
                      this.props.memberItem,
                      'Billing Postcode',
                      e,
                      this.setIsDirty,
                    )
                  }
                />
              </div>
            </span>
            <span className="line">
              <div id="feeProgramDiv" ref="feeProgramDiv">
                <label
                  htmlFor="feeprogram"
                  required={
                    this.props.memberItem.values['Fee Program'] === undefined
                      ? true
                      : false
                  }
                >
                  Fee Program
                </label>
                <select
                  name="feeprogram"
                  id="feeprogram"
                  required
                  multiple
                  ref={input => (this.input = input)}
                  defaultValue={getJson(
                    this.props.memberItem.values['Fee Program'],
                  )}
                  onChange={e =>
                    this.onFeeProgramChange(
                      'Fee Program',
                      e,
                      this.setIsDirty,
                      this.myThis,
                    )
                  }
                >
                  {this.props.membershipFees.map(program => (
                    <option key={program.program} value={program.program}>
                      {program.program} - ${program.fee}
                    </option>
                  ))}
                </select>
                <div className="droparrow" />
              </div>
              <div>
                <label htmlFor="membershipFee">Membership Cost&nbsp;</label>
                <input
                  type="text"
                  name="cost"
                  id="cost"
                  value={this.props.memberItem.values['Membership Cost']}
                  onChange={e =>
                    handleChange(
                      this.props.memberItem,
                      'Membership Cost',
                      e,
                      this.setIsDirty,
                    )
                  }
                />
              </div>
            </span>
            <span className="line">
              {this.props.familyMembers.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <button
                    type="button"
                    id="showHideBillingDtls"
                    className={'btn btn-info'}
                    onClick={e => this.showHideFamilyBillingDtls()}
                  >
                    {this.state.familyBillingDtlsBtnLabel}
                  </button>
                </div>
              )}
            </span>
            <span className="line">
              <div style={{ width: '90vw', marginTop: '10px' }}>
                {this.state.showFamilyBillingDetails &&
                  this.props.familyMembers.length > 0 && (
                    <FamilyFeeDetails
                      memberItem={this.props.memberItem}
                      familyMembers={this.props.familyMembers}
                      membershipFees={this.props.membershipFees}
                    />
                  )}
              </div>
            </span>
          </div>
          <div className="section1">
            <span className="line">
              <div style={{ width: '90vw' }}>
                <h6>
                  <u>Manage Family Members</u>
                </h6>
                <ReactDataGrid
                  enableCellSelect={true}
                  columns={this._columns}
                  rowGetter={this.rowGetter}
                  rowsCount={this.state.billingMembers.length}
                  onGridRowsUpdated={this.handleGridRowsUpdated}
                  enableCellAutoFocus={false}
                  minHeight={
                    this.state.billingMembers.length > 0
                      ? this.state.billingMembers.length * 35 + 50
                      : 80
                  }
                  emptyRowsView={EmptyRowsView}
                  ref="billingMembersGrid"
                />
              </div>
            </span>
            <span>
              <button
                type="button"
                id="addMember"
                className="btn btn-primary"
                onClick={e => startAddMember(e, this.setIsAddMember)}
              >
                Add Billing Member
              </button>
            </span>
          </div>
        </div>
      </span>
    );
  }
}

export class BillingInfo extends Component {
  constructor(props) {
    super(props);
    this.src =
      this.props.billingWidgetUrl +
      '&er=' +
      this.props.billingInfo.customerBillingId +
      '&E=1';
    this.removeBillingMember = this.props.removeBillingMember;
    this.updateBillingMember = this.props.updateBillingMember;
    this.myThis = this.props.myThis;
    this.setIsDirty = this.props.setIsDirty;
    this.setIsValidInput = this.props.setIsValidInput;
    this.setErrorMessage = this.props.setErrorMessage;
    this.onFeeProgramChange = this.props.onFeeProgramChange.bind(this);
    this.getPaymentHistory = this.props.getPaymentHistory;
    this.suspendPayments = this.props.suspendPayments;
    this.createSchedule = this.props.createSchedule;
    this.setIsAddMember = this.props.setIsAddMember;

    let billingMembers = this.getData(this.props.familyMembers);
    this.formattedFeeData = this.getFormattedFeeData(this.props.membershipFees);
    this._columns = this.getColumns();
    let showFamilyBillingDetails = false;
    let familyBillingDtlsBtnLabel = 'Show Family Billing  Details';
    this.showHideFamilyBillingDtls = this.showHideFamilyBillingDtls.bind(this);
    this.onFeeProgramOptionClick = this.onFeeProgramOptionClick.bind(this);
    this.setShowBillingAudit = this.setShowBillingAudit.bind(this);
    this.stopPayments = this.stopPayments.bind(this);
    this.handleChange = handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let showPaymentHistory = false;
    let paymentHistoryBtnLabel = 'Show Payment History';
    this.showHidePaymentHistory = this.showHidePaymentHistory.bind(this);

    this.memberFee = this.props.memberItem.values['Membership Cost']
      ? Number(this.props.memberItem.values['Membership Cost'])
      : undefined;
    let isMemberFeeChanged = false;

    this.state = {
      billingMembers,
      showFamilyBillingDetails,
      familyBillingDtlsBtnLabel,
      showPaymentHistory,
      paymentHistoryBtnLabel,
      isMemberFeeChanged,
      showBillingAudit: false,
      scheduleStartDate: '',
      scheduleResumeDate: '',
      suspensionStartDate: '',
      suspensionEndDate: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    let nextFee = nextProps.memberItem.values['Membership Cost']
      ? Number(nextProps.memberItem.values['Membership Cost'])
      : undefined;
    if (
      nextProps.familyMembers !== undefined &&
      nextProps.familyMembers !== null
    ) {
      this.setState({
        billingMembers: this.getData(nextProps.familyMembers),
      });
    }
    this.setState({
      isMemberFeeChanged: nextFee === this.memberFee ? false : true,
    });
  }

  componentDidUpdate() {
    let elm = this.refs.errorDiv;
    if (elm) {
      //window.scrollTo(0, 0);
      let scrollTodiv = this.refs.scrollToDiv;
      scrollTodiv.scrollIntoView();
      //elm.scrollIntoView(true);
    }

    this.refs.feeProgramDiv &&
      $(this.refs.feeProgramDiv)
        .find('select')
        .multiselect({
          onOptionClick: this.onFeeProgramOptionClick,
          texts: { placeholder: 'Select Program' },
        });
    $('#feeProgramDiv button:first-child').addClass('form-control');
  }

  componentDidMount() {
    this.refs.feeProgramDiv &&
      $(this.refs.feeProgramDiv)
        .find('select')
        .multiselect({
          onOptionClick: this.onFeeProgramOptionClick,
          texts: { placeholder: 'Select Program' },
        });
    $('#feeProgramDiv button:first-child').addClass('form-control');
  }

  setShowBillingAudit(val) {
    this.setState({ showBillingAudit: val });
  }

  onFeeProgramOptionClick(element, option) {
    this.onFeeProgramChange(
      'Fee Program',
      element,
      this.setIsDirty,
      this.myThis,
    );
  }

  showHideFamilyBillingDtls() {
    let label = null;
    if (this.state.showFamilyBillingDetails) {
      label = 'Show Family Billing  Details';
    } else {
      label = 'Hide Family Billing  Details';
    }

    this.setState({
      showFamilyBillingDetails: !this.state.showFamilyBillingDetails,
      familyBillingDtlsBtnLabel: label,
    });
  }

  showHidePaymentHistory() {
    if (!this.state.showPaymentHistory) {
      this.getPaymentHistory();
    }

    let label = this.state.showPaymentHistory
      ? 'Show Payment History'
      : 'Hide Payment History';
    this.setState({
      showPaymentHistory: !this.state.showPaymentHistory,
      paymentHistoryBtnLabel: label,
    });
  }

  createPaymentSchedule() {
    if (!this.props.memberItem.values['Membership Cost']) {
      console.log('Membership Fee is required');
      return;
    }
    if (!this.state.scheduleStartDate) {
      console.log('Schedule start date is required');
      return;
    }
    if (
      this.state.scheduleResumeDate &&
      moment(this.state.scheduleStartDate, 'DD-MM-YYYY').isSameOrAfter(
        moment(this.state.scheduleResumeDate, 'DD-MM-YYYY'),
      )
    ) {
      console.log('Schedule resume date must be after schedule start date');
      return;
    }

    if (
      window.confirm(
        'Existing payments will be stopped and a new schedule will be setup. Are you sure you wish to continue?',
      )
    ) {
      confirmWithInput({ message: 'hello' }).then(
        ({ reason }) => {
          console.log('proceed! input:' + reason);
          this.createSchedule(
            'F',
            'MON',
            this.state.scheduleStartDate,
            this.state.scheduleResumeDate,
            reason,
          );
        },
        () => {
          console.log('cancel!');
        },
      );
    }
  }

  stopPayments() {
    if (!this.state.suspensionStartDate) {
      console.log('Start date is required');
      return;
    }
    if (
      this.state.suspensionEndDate &&
      moment(this.state.suspensionStartDate, 'DD-MM-YYYY').isSameOrAfter(
        moment(this.state.suspensionEndDate, 'DD-MM-YYYY'),
      )
    ) {
      console.log('Resume date must be after start date');
      return;
    }

    confirmWithInput({ message: 'hello' }).then(
      ({ reason }) => {
        console.log('proceed! input:' + reason);
        this.suspendPayments(
          this.state.suspensionStartDate,
          this.state.suspensionEndDate,
          reason,
        );
      },
      () => {
        console.log('cancel!');
      },
    );
  }

  getFormattedFeeData(memberFeeData) {
    const feeData = [];
    memberFeeData.forEach(item => {
      var text = item.program + ' - $' + item.fee;
      feeData.push({
        id: item.program,
        value: item.program,
        text: text,
        title: item.info,
      });
    });
    return feeData;
  }

  deleteRows(id) {
    console.log('###### DELETE called id = ' + id);
    this.removeBillingMember(id, this.myThis);
    this.setIsDirty(true);
  }

  rowGetter = i => {
    return this.state.billingMembers[i];
  };

  handleGridRowsUpdated = ({ fromRow, toRow, updated }) => {
    console.log('### ROW updated # updated # ' + util.inspect(updated));
    if (fromRow !== toRow) {
      //if user has updated multiple rows using cell drag
      return;
    }
    let rows = this.state.billingMembers.slice();
    let updatedKey = Object.keys(updated)[0];
    let originalValue = rows[fromRow][updatedKey];
    console.log(
      '#### ' +
        util.inspect(originalValue) +
        ', # ' +
        util.inspect(updated[updatedKey]),
    );
    if (updatedKey === 'Fee Program') {
      if (!originalValue) {
        originalValue = [];
      }
      if (isArraysEqual(originalValue, updated[updatedKey])) {
        return;
      }
    } else {
      if (originalValue === updated[updatedKey]) {
        return;
      }
    }
    var updatedMember = this.props.familyMembers.filter(
      member => member['id'] === rows[fromRow]['id'],
    )[0];
    for (let i = fromRow; i <= toRow; i++) {
      let rowToUpdate = rows[i];
      let updatedRow = update(rowToUpdate, { $merge: updated });
      rows[i] = updatedRow;
    }

    this.updateBillingMember(updatedMember['id'], updated, this.myThis);
    this.setState({ billingMembers: rows });
    this.setIsDirty(true);
  };

  getData(familyMembers) {
    const memberData = familyMembers.map(member => {
      return {
        id: member['id'],
        ...member.values,
      };
    });
    //Fix for react-data-grid issue wherein DropDownEditor throws an exception if element is present
    //but null or undefined
    memberData.forEach(member => {
      if (member && !member['Family Member Order']) {
        delete member['Family Member Order'];
      }
      if (member && !member['Fee Program']) {
        delete member['Fee Program'];
      }
    });
    return memberData;
  }

  getColumns = () => {
    const memberOrder = [
      {
        id: 'first',
        value: 'first',
        text: 'First',
        title: 'First family member',
      },
      {
        id: 'second',
        value: 'second',
        text: 'Second',
        title: 'Second family member',
      },
      {
        id: 'third',
        value: 'third',
        text: 'Third',
        title: 'Third family member',
      },
    ];

    const memberOrderEditor = <DropDownEditor options={memberOrder} />;
    const memberOrderFormatter = (
      <DropDownFormatter
        options={memberOrder}
        value="first"
        message="Required information must be entered ('Member Order')"
      />
    );
    const programsEditor = (
      <DropDownEditor options={this.formattedFeeData} multiple={true} />
    );
    const programsFormatter = (
      <DropDownFormatter
        options={this.formattedFeeData}
        value={['GBK1']}
        message="Required information must be entered ('Fee Program')"
        multiple={true}
      />
    );

    return [
      { key: 'Member ID', name: 'Member ID', resizable: true },
      { key: 'First Name', name: 'First Name', resizable: true },
      { key: 'Last Name', name: 'Last Name', resizable: true },
      {
        key: 'Fee Program',
        name: 'Fee Program',
        resizable: true,
        editor: programsEditor,
        formatter: programsFormatter,
      },
      {
        key: 'Family Member Order',
        name: 'Order',
        resizable: true,
        editor: memberOrderEditor,
        formatter: memberOrderFormatter,
      },
      {
        key: '$delete',
        name: 'Remove',
        resizable: true,
        getRowMetaData: row => row,
        formatter: ({ dependentValues }) => (
          <span>
            <a
              href="javascript:;"
              onClick={() => this.deleteRows(dependentValues['id'])}
            >
              Delete
            </a>
          </span>
        ),
      },
    ];
  };

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });

    if (event.target.name === 'scheduleStartDate') {
      this.props.setScheduleStartDate(event.target.value);
    } else if (event.target.name === 'scheduleResumeDate') {
      this.props.setScheduleResumeDate(event.target.value);
    }
  }

  render() {
    const { data, columns } = this.state;
    return (
      <div ref="scrollToDiv" className="section1">
        <h1>
          Billing Details for {this.props.memberItem.values['First Name']}{' '}
          {this.props.memberItem.values['Last Name']}
        </h1>
        <hr />
        <span className="line">
          <div title="Billing Info" className="billingInfo">
            {!this.props.isValidInput ? (
              <div ref="errorDiv" style={errorMessageDiv}>
                {this.props.errorMessage}
              </div>
            ) : (
              ''
            )}
            <hr />
            {this.props.billingInfoLoading === true ? (
              <div>
                <p>Loading Billing Information</p>
                <ReactSpinner />
              </div>
            ) : (
              <span>
                <table
                  className={
                    this.props.billingInfo.customerBillingId !== undefined
                      ? 'show'
                      : 'hide'
                  }
                >
                  <tbody>
                    <tr>
                      <th width="30%">Item</th>
                      <th width="70%">Value</th>
                    </tr>
                    <tr>
                      <td>DDR Statuts:</td>
                      <td>{this.props.memberItem.values['DDR Status']}</td>
                    </tr>
                    <tr>
                      <td>Billing Reference ID:</td>
                      <td>{this.props.billingInfo.customerBillingId}</td>
                    </tr>
                    <tr>
                      <td>Billing Status:</td>
                      <td>
                        {this.props.billingInfo.statusCode}-
                        {this.props.billingInfo.statusDescription}
                      </td>
                    </tr>
                    <tr>
                      <td>Name:</td>
                      <td>
                        {this.props.billingInfo.customerFirstName}{' '}
                        {this.props.billingInfo.customerName}
                      </td>
                    </tr>
                    <tr>
                      <td>Address:</td>
                      <td>{this.props.billingInfo.addressLine1}</td>
                    </tr>
                    <tr>
                      <td />
                      <td>{this.props.billingInfo.addressLine2}</td>
                    </tr>
                    <tr>
                      <td />
                      <td>
                        {this.props.billingInfo.addressSuburb},
                        {this.props.billingInfo.addressState}{' '}
                        {this.props.billingInfo.addressPostCode}
                      </td>
                    </tr>
                    {this.props.billingInfo.email && (
                      <tr>
                        <td>Email:</td>
                        <td>{this.props.billingInfo.email}</td>
                      </tr>
                    )}
                    {this.props.billingInfo.mobilePhone && (
                      <tr>
                        <td>Phone:</td>
                        <td>{this.props.billingInfo.mobilePhone}</td>
                      </tr>
                    )}
                    <tr>
                      <td>Payment Method:</td>
                      <td>
                        <PaymentType
                          type={this.props.billingInfo.paymentMethod}
                        />
                      </td>
                    </tr>
                    {this.props.billingInfo.paymentPeriod && (
                      <tr>
                        <td>Payment Period:</td>
                        <td>
                          <PaymentPeriod
                            period={this.props.billingInfo.paymentPeriod}
                          />
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>Successful Payments:</td>
                      <td>{this.props.billingInfo.totalPaymentsSuccessful}</td>
                    </tr>
                    <tr>
                      <td>Successful Payments:</td>
                      <td>
                        {this.props.billingInfo.totalPaymentsSuccessful}-
                        {this.props.billingInfo.totalPaymentsSuccessfulAmount}
                      </td>
                    </tr>
                    <tr>
                      <td>Failed Payments:</td>
                      <td>
                        {this.props.billingInfo.totalPaymentsFailed}-
                        {this.props.billingInfo.totalPaymentsFailedAmount}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <hr />
                <div className="section1">
                  {this.props.editPaymentType === false ? (
                    <button
                      type="button"
                      id="editPaymentType"
                      className="btn btn-primary"
                      disabled={
                        this.props.memberItem.values['DDR Status'] !==
                        'Processed'
                      }
                      onClick={e =>
                        editPaymentType(
                          e,
                          this,
                          this.props.setEditPaymentTypeReason,
                        )
                      }
                    >
                      Edit Payment Type
                    </button>
                  ) : (
                    this.props.billingCompany === 'EziDebit' && (
                      <button
                        type="button"
                        id="closeEditPaymentType"
                        className="btn btn-primary"
                        onClick={e => closeEditPaymentType(e, this)}
                      >
                        Close Edit Payment Type
                      </button>
                    )
                  )}
                  {this.props.editPaymentType === false ? (
                    <div />
                  ) : (
                    <iframe
                      src={this.src}
                      title="Edit Payment Type"
                      width="400px"
                      height="400px"
                      id="editPaymentTypeiFrame"
                      className="editPaymentTypeiFrame"
                      allowFullScreen
                    />
                  )}
                  {this.props.editPaymentTypeModal && (
                    <EditPaymentType
                      memberItem={this.props.memberItem}
                      setEditPaymentTypeModal={
                        this.props.setEditPaymentTypeModal
                      }
                      billingCompany={this.props.billingCompany}
                      updatePaymentMethod={this.props.updatePaymentMethod}
                    />
                  )}
                  <span className="line">
                    <div id="feeProgramDiv" ref="feeProgramDiv">
                      <label
                        htmlFor="feeprogram"
                        required={
                          this.props.memberItem.values['Fee Program'] ===
                          undefined
                            ? true
                            : false
                        }
                      >
                        Fee Program
                      </label>
                      <select
                        name="feeprogram"
                        id="feeprogram"
                        required
                        multiple
                        ref={input => (this.input = input)}
                        defaultValue={getJson(
                          this.props.memberItem.values['Fee Program'],
                        )}
                        onChange={e =>
                          this.onFeeProgramChange(
                            'Fee Program',
                            e,
                            this.setIsDirty,
                            this.myThis,
                          )
                        }
                      >
                        {this.props.membershipFees.map(program => (
                          <option key={program.program} value={program.program}>
                            {program.program} - ${program.fee}
                          </option>
                        ))}
                      </select>
                      <div className="droparrow" />
                    </div>
                    <div>
                      <label htmlFor="membershipFee">
                        Membership Cost&nbsp;
                      </label>
                      <input
                        type="text"
                        name="cost"
                        id="cost"
                        className="form-control"
                        value={this.props.memberItem.values['Membership Cost']}
                        onChange={e =>
                          this.handleChange(
                            this.props.memberItem,
                            'Membership Cost',
                            e,
                            this.setIsDirty,
                          )
                        }
                      />
                    </div>
                  </span>
                  <span className="line">
                    {this.props.familyMembers.length > 0 && (
                      <div style={{ marginTop: '10px' }}>
                        <button
                          type="button"
                          id="showHideBillingDtls"
                          className={'btn btn-primary'}
                          onClick={e => this.showHideFamilyBillingDtls()}
                        >
                          {this.state.familyBillingDtlsBtnLabel}
                        </button>
                      </div>
                    )}
                  </span>
                  <span
                    className="line"
                    style={{
                      display:
                        this.props.billingInfo.statusCode == '2'
                          ? 'block'
                          : 'none',
                    }}
                  >
                    <div style={{ marginTop: '10px' }} className="row">
                      <div className="col-md-4">
                        <label
                          htmlFor="scheduleStartDate"
                          className="control-label"
                        >
                          Start Date
                        </label>
                        <select
                          name="scheduleStartDate"
                          id="scheduleStartDate"
                          className="form-control"
                          value={this.state.scheduleStartDate}
                          onChange={this.handleInputChange}
                          disabled={
                            (!this.props.memberItem.values[
                              'Payment Schedule'
                            ] ||
                              this.state.isMemberFeeChanged) &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                        >
                          <option key="" value="">
                            --
                          </option>
                          {getStartDates(
                            this.props.billingInfo.nextBillingDate,
                            this.props.billingInfo.paymentPeriod,
                          ).map((startDate, index) => (
                            <option key={index} value={startDate}>
                              {startDate}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label
                          htmlFor="scheduleResumeDate"
                          className="control-label"
                        >
                          Resume Date
                        </label>
                        <select
                          name="scheduleResumeDate"
                          id="scheduleResumeDate"
                          className="form-control"
                          value={this.state.scheduleResumeDate}
                          onChange={this.handleInputChange}
                          disabled={
                            (!this.props.memberItem.values[
                              'Payment Schedule'
                            ] ||
                              this.state.isMemberFeeChanged) &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                        >
                          <option key="" value="">
                            --
                          </option>
                          {getResumeDates(
                            this.props.billingInfo.nextBillingDate,
                            this.props.billingInfo.paymentPeriod,
                          ).map((startDate, index) => (
                            <option key={index} value={startDate}>
                              {startDate}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="control-label">&nbsp;</label>
                        <button
                          type="button"
                          id="createSchedule"
                          className="btn btn-primary"
                          disabled={
                            (!this.props.memberItem.values[
                              'Payment Schedule'
                            ] ||
                              this.state.isMemberFeeChanged) &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                          onClick={e => this.createPaymentSchedule()}
                        >
                          Resume Payments
                        </button>
                      </div>
                    </div>
                  </span>
                  <span className="line">
                    <div style={{ marginTop: '10px' }} className="row">
                      <div className="col-md-4">
                        <label
                          htmlFor="suspensionStartDate"
                          className="control-label"
                        >
                          Start Date
                        </label>
                        <select
                          name="suspensionStartDate"
                          id="suspensionStartDate"
                          className="form-control"
                          value={this.state.suspensionStartDate}
                          onChange={this.handleInputChange}
                          disabled={
                            this.props.memberItem.values['Payment Schedule'] &&
                            this.props.billingInfo.statusCode !== '2' &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                        >
                          <option key="" value="">
                            --
                          </option>
                          {getStartDates(
                            this.props.billingInfo.nextBillingDate,
                            this.props.billingInfo.paymentPeriod,
                          ).map((startDate, index) => (
                            <option key={index} value={startDate}>
                              {startDate}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label
                          htmlFor="suspensionEndDate"
                          className="control-label"
                        >
                          Resume Date
                        </label>
                        <select
                          name="suspensionEndDate"
                          id="suspensionEndDate"
                          className="form-control"
                          value={this.state.suspensionEndDate}
                          onChange={this.handleInputChange}
                          disabled={
                            this.props.memberItem.values['Payment Schedule'] &&
                            this.props.billingInfo.statusCode !== '2' &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                        >
                          <option key="" value="">
                            --
                          </option>
                          {getResumeDates(
                            this.props.billingInfo.nextBillingDate,
                            this.props.billingInfo.paymentPeriod,
                          ).map((startDate, index) => (
                            <option key={index} value={startDate}>
                              {startDate}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-4">
                        <label className="control-label">&nbsp;</label>
                        <button
                          type="button"
                          id="clearSchedule"
                          className={'btn btn-primary'}
                          disabled={
                            this.props.memberItem.values['Payment Schedule'] &&
                            this.props.billingInfo.statusCode !== '2' &&
                            this.props.memberItem.values['DDR Status'] ===
                              'Processed'
                              ? false
                              : true
                          }
                          onClick={e => this.stopPayments()}
                        >
                          Stop Payments
                        </button>
                      </div>
                    </div>
                  </span>
                  <span className="line">
                    <div style={{ width: '90vw', marginTop: '10px' }}>
                      {this.state.showFamilyBillingDetails &&
                        this.props.familyMembers.length > 0 && (
                          <FamilyFeeDetails
                            memberItem={this.props.memberItem}
                            familyMembers={this.props.familyMembers}
                            membershipFees={this.props.membershipFees}
                          />
                        )}
                    </div>
                  </span>
                  <span className="line">
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        id="showHidePaymentHistory"
                        className={'btn btn-primary'}
                        onClick={e => this.showHidePaymentHistory()}
                      >
                        {this.state.paymentHistoryBtnLabel}
                      </button>
                    </div>
                  </span>
                  <span className="line">
                    <div style={{ width: '90vw', marginTop: '10px' }}>
                      {this.state.showPaymentHistory && (
                        <PaymentHistory
                          paymentHistory={this.props.paymentHistory}
                          paymentHistoryLoading={
                            this.props.paymentHistoryLoading
                          }
                          refundPayment={this.props.refundPayment}
                          memberItem={this.props.memberItem}
                        />
                      )}
                    </div>
                  </span>
                  <span className="line">
                    <div style={{ marginTop: '10px' }}>
                      <button
                        type="button"
                        className={'btn btn-primary'}
                        onClick={e => this.setShowBillingAudit(true)}
                      >
                        Billing Audit
                      </button>
                    </div>
                    {this.state.showBillingAudit && (
                      <BillingAudit
                        memberItem={this.props.memberItem}
                        setShowBillingAudit={this.setShowBillingAudit}
                      />
                    )}
                  </span>
                  <span className="line">
                    <div style={{ width: '90vw' }}>
                      <h6>
                        <u>Manage Family Members</u>
                      </h6>
                      <ReactDataGrid
                        enableCellSelect={true}
                        columns={this._columns}
                        rowGetter={this.rowGetter}
                        rowsCount={this.state.billingMembers.length}
                        onGridRowsUpdated={this.handleGridRowsUpdated}
                        enableCellAutoFocus={false}
                        minHeight={
                          this.state.billingMembers.length > 0
                            ? this.state.billingMembers.length * 35 + 50
                            : 80
                        }
                        emptyRowsView={EmptyRowsView}
                      />
                    </div>
                  </span>
                </div>
                <span>
                  <button
                    type="button"
                    id="addMember"
                    className="btn btn-primary"
                    onClick={e => startAddMember(e, this.setIsAddMember)}
                  >
                    Add Billing Member
                  </button>
                </span>
              </span>
            )}
          </div>
        </span>
      </div>
    );
  }
}

export const Billing = ({
  memberItem,
  billingInfo,
  isDirty,
  setIsDirty,
  isRegistered,
  setIsRegistered,
  doRegistration,
  setDoRegistration,
  isAddMember,
  setIsAddMember,
  billingInfoLoading,
  completeMemberBilling,
  currentMemberLoading,
  completeMemberRegistration,
  fetchBillingInfo,
  fetchBillingInfoAfterRegistration,
  setBillingInfo,
  updateMember,
  editPaymentType,
  setEditPaymentType,
  allMembers,
  saveMember,
  membershipFees,
  addBillingMembers,
  removeBillingMember,
  updateBillingMember,
  familyMembers,
  isValidInput,
  setIsValidInput,
  errorMessage,
  setErrorMessage,
  onFeeProgramChange,
  getPaymentHistory,
  paymentHistory,
  paymentHistoryLoading,
  suspendPayments,
  createSchedule,
  billingDDRUrl,
  billingWidgetUrl,
  registerMember,
  billingCompany,
  editPaymentTypeModal,
  setEditPaymentTypeModal,
  updatePaymentMethod,
  refundPayment,
  setEditPaymentTypeReason,
  doPaySmartRegistration,
  setDoPaySmartRegistration,
  ddrTemplates,
  setScheduleStartDate,
  setScheduleResumeDate,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <div className="memberBillingDetails">
      <StatusMessagesContainer />
      <div className="general">
        <div className="userDetails">
          {memberItem.values['Billing Customer Id'] !== null &&
            memberItem.values['Billing Customer Id'] !== undefined &&
            memberItem.values['Billing Customer Id'] !== '' && (
              <BillingInfo
                billingInfo={billingInfo}
                billingInfoLoading={billingInfoLoading}
                editPaymentType={editPaymentType}
                setEditPaymentType={setEditPaymentType}
                memberItem={memberItem}
                removeBillingMember={removeBillingMember}
                myThis={memberItem.myThis}
                setIsDirty={setIsDirty}
                familyMembers={familyMembers}
                allMembers={allMembers}
                membershipFees={membershipFees}
                updateBillingMember={updateBillingMember}
                isValidInput={isValidInput}
                setIsValidInput={setIsValidInput}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                onFeeProgramChange={onFeeProgramChange}
                getPaymentHistory={getPaymentHistory}
                paymentHistory={paymentHistory}
                suspendPayments={suspendPayments}
                createSchedule={createSchedule}
                paymentHistoryLoading={paymentHistoryLoading}
                billingWidgetUrl={billingWidgetUrl}
                setIsAddMember={setIsAddMember}
                editPaymentTypeModal={editPaymentTypeModal}
                setEditPaymentTypeModal={setEditPaymentTypeModal}
                billingCompany={billingCompany}
                updatePaymentMethod={updatePaymentMethod}
                refundPayment={refundPayment}
                setEditPaymentTypeReason={setEditPaymentTypeReason}
                setScheduleStartDate={setScheduleStartDate}
                setScheduleResumeDate={setScheduleResumeDate}
              />
            )}
          {(memberItem.values['Billing Customer Id'] === null ||
            memberItem.values['Billing Customer Id'] === undefined ||
            memberItem.values['Billing Customer Id'] === '') && (
            <span>
              <BillerDetails
                memberItem={memberItem}
                removeBillingMember={removeBillingMember}
                myThis={memberItem.myThis}
                setIsDirty={setIsDirty}
                familyMembers={familyMembers}
                allMembers={allMembers}
                membershipFees={membershipFees}
                updateBillingMember={updateBillingMember}
                isValidInput={isValidInput}
                setIsValidInput={setIsValidInput}
                errorMessage={errorMessage}
                setErrorMessage={setErrorMessage}
                onFeeProgramChange={onFeeProgramChange}
                setIsAddMember={setIsAddMember}
              />
              <br />
              {!memberItem.values['Billing Parent Member'] && (
                <span>
                  <button
                    type="button"
                    id="setupBilling"
                    className="btn btn-primary"
                    onClick={e =>
                      validateAndRegister(
                        e,
                        memberItem,
                        setIsValidInput,
                        setErrorMessage,
                        setDoRegistration,
                        setDoPaySmartRegistration,
                        registerMember,
                        billingCompany,
                      )
                    }
                  >
                    Setup Member Billing
                  </button>
                  <div>
                    <label
                      htmlFor="datejoined"
                      required={
                        memberItem.values['Date Joined'] === undefined
                          ? true
                          : false
                      }
                    >
                      Billing Start Date
                    </label>
                    <input
                      type="date"
                      name="billingStartDate"
                      id="billingStartDate"
                      required
                      ref={input => (this.input = input)}
                      defaultValue={moment().format('YYYY-MM-DD')}
                    />
                  </div>
                </span>
              )}
            </span>
          )}
          {doRegistration && (
            <RegisterMemberBilling
              isShowingModal={true}
              billingCustomerId={memberItem.values['Billing Customer Id']}
              memberItem={memberItem}
              setDoRegistration={setDoRegistration}
              completeMemberRegistration={completeMemberRegistration}
              fetchBillingInfoAfterRegistration={
                fetchBillingInfoAfterRegistration
              }
              setBillingInfo={setBillingInfo}
              billingInfoLoading={billingInfoLoading}
              completeMemberBilling={completeMemberBilling}
              updateMember={updateMember}
              billingDDRUrl={billingDDRUrl}
            />
          )}
          {doPaySmartRegistration && (
            <RegisterPaySmartMemberBilling
              isShowingModal={true}
              billingCustomerId={memberItem.values['Billing Customer Id']}
              memberItem={memberItem}
              setDoPaySmartRegistration={setDoPaySmartRegistration}
              ddrTemplates={ddrTemplates}
            />
          )}
          {isAddMember && (
            <AddMember
              isShowingModal={true}
              memberItem={memberItem}
              allMembers={allMembers}
              setIsAddMember={setIsAddMember}
              addBillingMembers={addBillingMembers}
              setIsDirty={setIsDirty}
              myThis={memberItem.myThis}
              familyMembers={familyMembers}
            />
          )}
          {!memberItem.values['Billing Parent Member'] && (
            <div className="section3">
              <span className="line">
                <span className="rightButtons">
                  {this.newMember ? (
                    <NavLink to={`/Home`} className="btn btn-primary">
                      Cancel
                    </NavLink>
                  ) : (
                    <NavLink
                      to={`/Member/${memberItem['id']}`}
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
                    onClick={e =>
                      handleSaveBillingChanges(
                        saveMember,
                        memberItem,
                        updateMember,
                        isDirty,
                        memberItem.myThis,
                      )
                    }
                  >
                    Save
                  </button>
                </span>
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );

export const BillingContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(
    ({
      memberItem,
      updateMember,
      deleteMember,
      allMembers,
      familyMembers,
      removedBillingMembers,
    }) => {
      return {};
    },
  ),
  withState('isDirty', 'setIsDirty', false),
  withState('isRegistered', 'setIsRegistered', false),
  withState('doRegistration', 'setDoRegistration', false),
  withState('isAddMember', 'setIsAddMember', false),
  withState('editPaymentType', 'setEditPaymentType', false),
  withState('editPaymentTypeModal', 'setEditPaymentTypeModal', false),
  withState('editPaymentTypeReason', 'setEditPaymentTypeReason', null),
  withState('isValidInput', 'setIsValidInput', true),
  withState('errorMessage', 'setErrorMessage', ''),
  withState('doPaySmartRegistration', 'setDoPaySmartRegistration', false),
  withState('scheduleStartDate', 'setScheduleStartDate', ''),
  withState('scheduleResumeDate', 'setScheduleResumeDate', ''),
  withHandlers({
    completeMemberRegistration: ({
      memberItem,
      fetchBillingInfoAfterRegistration,
      setBillingInfo,
      updateMember,
      fetchCurrentMember,
    }) => () => {
      fetchBillingInfoAfterRegistration({
        billingRef: memberItem.values['Billing Customer Id'],
        memberItem: memberItem,
        setBillingInfo: setBillingInfo,
        updateMember: updateMember,
        fetchCurrentMember: fetchCurrentMember,
        myThis: memberItem.myThis,
      });
      console.log(
        'completeMemberRegistration:' + memberItem.values['Member ID'],
      );
    },
    addBillingMembers: ({ familyMembers, removedBillingMembers }) => (
      billingMembers,
      myThis,
    ) => {
      console.log('billingMembers size:' + billingMembers.length);
      billingMembers.forEach(function(member) {
        member.toBeUpdated = true;
        familyMembers.push(member);
        var index = $.inArray(member['id'], removedBillingMembers);
        if (index !== -1) {
          removedBillingMembers.splice(index, 1);
        }
      });
      myThis.setState({ familyMembers: familyMembers });
    },
    updateBillingMember: ({ memberItem, familyMembers, membershipFees }) => (
      updatedMemberId,
      updatedProp,
      myThis,
    ) => {
      var index = familyMembers.findIndex(
        member => member['id'] === updatedMemberId,
      );
      for (var key in updatedProp) {
        familyMembers[index].values[key] = updatedProp[key];
        familyMembers[index].toBeUpdated = true;
      }

      memberItem.values['Membership Cost'] = getFamilyMembershipCost(
        memberItem,
        familyMembers,
        membershipFees,
      );

      memberItem.myThis.setState({
        familyMembers,
        memberItem,
      });
    },
    removeBillingMember: ({
      memberItem,
      familyMembers,
      removedBillingMembers,
      membershipFees,
      myThis,
    }) => (memberId, myThis) => {
      console.log('memberId:' + memberId);
      var index = familyMembers.findIndex(member => member['id'] === memberId);
      var removedMember = familyMembers[index];
      removedMember.values['Family Member Order'] = null;
      familyMembers.splice(index, 1);
      removedBillingMembers.push(memberId);
      memberItem.values['Membership Cost'] = getFamilyMembershipCost(
        memberItem,
        familyMembers,
        membershipFees,
      );
      memberItem.myThis.setState({
        memberItem,
        familyMembers,
      });
    },
    saveMember: ({
      allMembers,
      familyMembers,
      removedBillingMembers,
      updateMember,
      membershipFees,
      setIsValidInput,
      editPaymentAmount,
      errorMessage,
      addNotification,
      setSystemError,
      scheduleStartDate,
      scheduleResumeDate,
    }) => (memberItem, updateMember, billingChangeReason, isDirty, myThis) => {
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
        if (!isValidFamilyMembers(familyMembers)) {
          //setIsValidInput(false);
          myThis.setState({
            familyMembers,
            isValidInput: false,
            errorMessage:
              'Please provide valid input for highlighted input fields',
          });
          return;
        }
        let membersToUpdate = familyMembers.filter(
          member => member.toBeUpdated,
        );
        let membersToRemove = [];
        removedBillingMembers.forEach(id => {
          var member = null;
          allMembers.forEach(memberitem => {
            if (memberitem['id'] === id) {
              member = memberitem;
            }
          });
          if (
            member.values['Billing Parent Member'] &&
            member.values['Billing Parent Member'] === memberItem['id']
          ) {
            console.log(
              '#Removed Member found # Id #' + member.values['Member ID'],
            );
            member.values['Billing Parent Member'] = null;
            member.values['Membership Cost'] = getMembershipCost(
              member,
              membershipFees,
            );
            member.values['Family Member Order'] = null;
            membersToRemove.push(member);
          }
        });

        console.log(
          '#### In Save # membersToRemove # ' + util.inspect(membersToRemove),
        );
        if (!scheduleStartDate) {
          console.log('Schedule start date is required');
          return;
        }
        if (
          scheduleResumeDate &&
          moment(scheduleStartDate, 'DD-MM-YYYY').isSameOrAfter(
            moment(scheduleResumeDate, 'DD-MM-YYYY'),
          )
        ) {
          console.log('Schedule resume date must be after schedule start date');
          return;
        }

        if (familyMembers) {
          //memberItem.values['Membership Cost'] = getFamilyMembershipCost(memberItem, familyMembers, membershipFees);
          memberItem.values['Family Fee Details'] = getFamilyMemberFeeDetails(
            familyMembers,
            membershipFees,
          );
        } else {
          //memberItem.values['Membership Cost'] = getMembershipCost(memberItem, membershipFees);
        }
        if (
          memberItem.values['Billing Customer Id'] &&
          memberItem.values['DDR Status'] === 'Processed'
        ) {
          updatePaymentAmount(
            memberItem,
            editPaymentAmount,
            updateMember,
            billingChangeReason,
            addNotification,
            setSystemError,
            scheduleStartDate,
            scheduleResumeDate,
          );
        }
        updateBillingMembers(
          memberItem['id'],
          membersToUpdate,
          membersToRemove,
        );

        memberItem.values['Status'] = $('#memberStatus').html();
        let memberIds = familyMembers.map(member => member['id']);
        memberItem.values['Billing Family Members'] = memberIds;
        updateMember({
          id: memberItem['id'],
          memberItem,
          history: memberItem.myThis.props.history,
          fetchMembers: memberItem.myThis.props.fetchMembers,
        });
      }
    },
    onFeeProgramChange: ({ memberItem, familyMembers, membershipFees }) => (
      key,
      element,
      setIsDirty,
      myThis,
    ) => {
      handleMultiSelectChange(memberItem, key, element, setIsDirty);
      let fee = 0.0;
      if (memberItem.values['Fee Program']) {
        if (familyMembers) {
          fee = getFamilyMembershipCost(
            memberItem,
            familyMembers,
            membershipFees,
          );
        } else {
          fee = getMembershipCost(memberItem, membershipFees);
        }
      }
      memberItem.values['Membership Cost'] = fee;
      console.log('### mythis = ' + myThis);
      memberItem.myThis.setState({ memberItem });
    },
    getPaymentHistory: ({
      memberItem,
      fetchPaymentHistory,
      setPaymentHistory,
      addNotification,
      setSystemError,
    }) => () => {
      fetchPaymentHistory({
        billingRef: memberItem.values['Billing Customer Id'],
        paymentType: 'ALL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        //dateFrom: '',
        dateTo: moment.utc().format('YYYY-MM-DD'),
        history: memberItem.myThis.props.history,
        setPaymentHistory: memberItem.myThis.props.setPaymentHistory,
        internalPaymentType: 'customer',
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    suspendPayments: ({
      memberItem,
      clearPaymentSchedule,
      updateMember,
      fetchCurrentMember,
      fetchMembers,
      profile,
      addNotification,
      setSystemError,
    }) => (suspensionStartDate, suspensionEndDate, billingChangeReason) => {
      clearPaymentSchedule({
        billingRef: memberItem.values['Billing Customer Id'],
        keepManualPayments: 'YES',
        startDate: suspensionStartDate,
        resumeDate: suspensionEndDate,
        memberItem: memberItem,
        updateMember: updateMember,
        fetchCurrentMember: fetchCurrentMember,
        fetchMembers: fetchMembers,
        myThis: memberItem.myThis,
        user: profile.username,
        billingChangeReason: billingChangeReason,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    createSchedule: ({
      memberItem,
      createPaymentSchedule,
      updateMember,
      fetchCurrentMember,
      fetchMembers,
      profile,
      addNotification,
      setSystemError,
    }) => (
      periodType,
      dayOfWeek,
      scheduleStartDate,
      scheduleResumeDate,
      billingChangeReason,
    ) => {
      let day = '0';
      let args = {};
      args.billingRef = memberItem.values['Billing Customer Id'];
      if (scheduleStartDate) {
        args.scheduleStartDate = scheduleStartDate;
      } else {
        args.scheduleStartDate = moment
          .utc()
          .add(1, 'days')
          .format('YYYY-MM-DD');
      }
      args.scheduleResumeDate = scheduleResumeDate;
      args.schedulePeriodType = periodType;
      if (periodType === 'F') {
        args.dayOfWeek = dayOfWeek;
      }
      args.dayOfMonth = day;
      args.paymentAmountInCents = getAmountInCents(
        memberItem.values['Membership Cost'],
      );
      args.limitToNumberOfPayments = '0';
      args.limitToTotalAmountInCents = '0';
      args.keepManualPayments = 'YES';

      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.fetchCurrentMember = fetchCurrentMember;
      args.fetchMembers = fetchMembers;
      args.myThis = memberItem.myThis;
      args.user = profile.username;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;

      createPaymentSchedule(args);
    },

    registerMember: ({
      memberItem,
      registerBillingMember,
      addNotification,
      setSystemError,
    }) => () => {
      registerBillingMember({ memberItem, addNotification, setSystemError });
    },
    updatePaymentMethod: ({
      memberItem,
      editPaymentMethod,
      editPaymentTypeReason,
      updateMember,
      fetchCurrentMember,
      addNotification,
      setSystemError,
    }) => paymentMethod => {
      editPaymentMethod({
        memberItem,
        paymentMethod,
        editPaymentTypeReason,
        updateMember,
        fetchCurrentMember,
        addNotification,
        setSystemError,
        myThis: memberItem.myThis,
      });
    },
    refundPayment: ({
      memberItem,
      refundTransaction,
      updateMember,
      fetchCurrentMember,
      fetchMembers,
      addNotification,
      setSystemError,
    }) => (paymentId, paymentAmount, billingChangeReason) => {
      console.log('### paymentId = ' + paymentId);
      let args = {};
      args.transactionId = paymentId;
      args.refundAmount = paymentAmount * 100;
      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.fetchCurrentMember = fetchCurrentMember;
      args.fetchMembers = fetchMembers;
      args.myThis = memberItem.myThis;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;
      refundTransaction(args);
    },
  }),
  lifecycle({
    constructor() {},
    componentDidUpdate() {},
    componentWillMount() {
      var member = undefined;
      for (var j = 0; j < this.props.members.length; j++) {
        if (this.props.members[j]['id'] === this.props.match.params['id']) {
          member = this.props.members[j];
          break;
        }
      }
      if (member === undefined) {
        this.props.history.push('/Member/' + this.props.match.params['id']);
      } else {
        this.props.fetchBillingInfo({
          billingRef: member.values['Billing Customer Id'],
          history: this.props.history,
          myThis: this,
          setBillingInfo: this.props.setBillingInfo,
          addNotification: this.props.addNotification,
          setSystemError: this.props.setSystemError,
        });
        this.props.fetchCurrentMember({
          id: this.props.match.params['id'],
          myThis: this,
          forBilling: true,
        });
      }

      this.props.fetchFamilyMembers({
        currentMember: this.props.memberItem,
        allMembers: this.props.allMembers,
        setFamilyMembers: this.props.setFamilyMembers,
      });
      if (
        member &&
        member.values['Billing Customer Id'] &&
        member.values['DDR Status'] !== 'Processed'
      ) {
        this.props.fetchDdrStatus({
          memberItem: member,
          updateMember: this.props.updateMember,
          fetchMember: this.props.fetchMember,
          fetchMembers: this.props.fetchMembers,
          myThis: this,
          addNotification: this.props.addNotification,
          setSystemError: this.props.setSystemError,
        });
      }
    },

    componentWillReceiveProps(nextProps) {
      //$(".content")[0].scrollIntoView(true);
      if (this.props.pathname !== nextProps.pathname) {
        var member = undefined;
        for (var j = 0; j < this.props.members.length; j++) {
          if (this.props.members[j]['id'] === this.props.match.params['id']) {
            member = this.props.members[j];
            break;
          }
        }
        if (member === undefined) {
          this.props.history.push('/Member/' + this.props.match.params['id']);
        } else {
          this.props.fetchBillingInfo({
            billingRef: member.values['Billing Customer Id'],
            history: this.props.history,
            myThis: this,
            setBillingInfo: this.props.setBillingInfo,
            addNotification: this.props.addNotification,
            setSystemError: this.props.setSystemError,
          });
          this.props.fetchCurrentMember({
            id: this.props.match.params['id'],
            myThis: this,
          });
        }
      }
    },
    componentWillUnmount() {},
  }),
)(Billing);

function getFamilyMemberFeeDetails(familyMembers, membershipFees) {
  let feeDetails = [];
  familyMembers.forEach(member => {
    let childFeeDtls = {
      id: member['id'],
      program: member.values['Fee Program'],
      fee: getMembershipCost(member, membershipFees),
      order: member.values['Family Member Order'],
      discount: getDiscount(member.values['Family Member Order']),
      cost: member.values['Membership Cost'],
    };
    feeDetails.push(childFeeDtls);
  });
  return feeDetails;
}

function getDiscount(memberOrder) {
  var familyDiscounts = { first: 10.0, second: 20.0, third: 30.0 };
  return familyDiscounts[memberOrder];
}

function updatePaymentAmount(
  member,
  editPaymentAmount,
  updateMember,
  billingChangeReason,
  addNotification,
  setSystemError,
  scheduleStartDate,
  scheduleResumeDate,
) {
  let response = editPaymentAmount({
    memberItem: member,
    updateMember: updateMember,
    billingRef: member.values['Billing Customer Id'],
    changeFromPaymentNumber: '0',
    changeFromDate: moment
      .utc()
      .add(1, 'days')
      .format('YYYY-MM-DD'),
    newPaymentAmountInCents: getAmountInCents(member.values['Membership Cost']),
    applyToAllFuturePayments: 'YES',
    keepManualPayments: 'NO',
    billingChangeReason: billingChangeReason,
    setSystemError: setSystemError,
    addNotification: addNotification,
    scheduleStartDate: scheduleStartDate,
    scheduleResumeDate: scheduleResumeDate,
  });
}

function getAmountInCents(amount) {
  return Math.ceil(Number(amount) * 100);
}

function isArraysEqual(array1, array2) {
  if (array1.length !== array2.length) {
    return false;
  }
  for (var i = 0; i < array1.length; i++) {
    if (array2.indexOf(array1[i]) === -1) return false;
  }
  return true;
}

function objectToString(obj) {
  var arr = [];
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      arr.push(key.charAt(0).toUpperCase() + key.slice(1) + ':' + obj[key]);
    }
  }
  return arr.join(', ');
}

function getStartDates(nextBillingDate, billingPeriod) {
  if (!nextBillingDate || !billingPeriod) {
    return [];
  }
  let startDate = moment(nextBillingDate, 'DD-MM-YYYY');
  let toDate = moment(nextBillingDate, 'DD-MM-YYYY').add(1, 'years');
  let dates = [];
  if (billingPeriod === 'Weekly') {
    if (startDate.isSame(moment(), 'day')) {
      startDate = startDate.add(7, 'days');
    }
    dates.push(startDate.format('DD-MM-YYYY'));
    while (startDate.isSameOrBefore(toDate)) {
      startDate = startDate.add(7, 'days');
      dates.push(startDate.format('DD-MM-YYYY'));
    }
    return dates;
  } else if (billingPeriod === 'Fortnightly') {
    if (startDate.isSame(moment(), 'day')) {
      startDate = startDate.add(15, 'days');
    }
    dates.push(startDate.format('DD-MM-YYYY'));
    while (startDate.isSameOrBefore(toDate)) {
      startDate = startDate.add(15, 'days');
      dates.push(startDate.format('DD-MM-YYYY'));
    }
    return dates;
  } else if (billingPeriod === 'Monthly') {
    if (startDate.isSame(moment(), 'day')) {
      startDate = startDate.add(1, 'months');
    }
    dates.push(startDate.format('DD-MM-YYYY'));
    while (startDate.isSameOrBefore(toDate)) {
      startDate = startDate.add(1, 'months');
      dates.push(startDate.format('DD-MM-YYYY'));
    }
    return dates;
  }
}

function getResumeDates(nextBillingDate, billingPeriod) {
  let dates = getStartDates(nextBillingDate, billingPeriod);
  if (dates.length <= 0) {
    return [];
  }
  dates.shift();
  let lastDate = moment(dates[dates.length - 1], 'DD-MM-YYYY');
  if (billingPeriod === 'Weekly') {
    lastDate.add(7, 'days');
  } else if (billingPeriod === 'Fortnightly') {
    lastDate.add(15, 'days');
  } else if (billingPeriod === 'Monthly') {
    lastDate.add(1, 'months');
  }
  dates.push(lastDate.format('DD-MM-YYYY'));
  return dates;
}

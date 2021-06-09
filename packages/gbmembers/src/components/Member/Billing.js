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
import { confirmWithDates } from './ConfirmWithDates';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { RecentNotificationsContainer } from '../notifications/RecentNotifications';
import { FormContainer } from '../form/FormContainer';
import { Link } from 'react-router-dom';
import { Utils } from 'common';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

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
  actionRequests: state.member.members.actionRequests,
  actionRequestsLoading: state.member.members.actionRequestsLoading,
  space: state.app.space,
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
  fetchFamilyMembers: actions.fetchFamilyMembers,
  setFamilyMembers: actions.setFamilyMembers,
  refundTransaction: actions.refundTransaction,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchDdrStatus: actions.fetchDdrStatus,
  fetchActionRequests: actions.fetchActionRequests,
  setActionRequests: actions.setActionRequests,
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

export function startAddMember(event, setIsAddMember) {
  setIsAddMember(true);
}

const handleSaveBillingChanges = (
  saveMember,
  memberItem,
  updateMember,
  isDirty,
  setIsDirty,
  myThis,
  startDates,
  resumeDates,
) => {
  if (memberItem.values['Billing Customer Id']) {
    confirmWithDates({ startDates, resumeDates }).then(
      ({ reason, startDate, resumeDate }) => {
        console.log('proceed! input:' + reason);
        saveMember(
          memberItem,
          updateMember,
          reason,
          isDirty,
          setIsDirty,
          myThis,
          startDate,
          resumeDate,
        );
      },
      () => {
        console.log('cancel!');
      },
    );
  } else {
    confirmWithInput({}).then(
      ({ reason }) => {
        console.log('proceed! input:' + reason);
        saveMember(
          memberItem,
          updateMember,
          reason,
          isDirty,
          setIsDirty,
          myThis,
          null,
          null,
        );
      },
      () => {
        console.log('cancel!');
      },
    );
  }
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

export class ActionRequests extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.actionRequests);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.actionRequests) {
      this.setState({
        data: this.getData(nextProps.actionRequests),
      });
    }
  }

  getData(actionRequests) {
    const data = actionRequests.map(actionRequest => {
      return {
        _id: actionRequest.customerId,
        requestType: actionRequest.actionRequestType,
        customerId: actionRequest.customerId,
        amount: actionRequest.amount,
        billingPeriod: actionRequest.billingPeriod,
        startDate: actionRequest.startDate,
        resumeDate: actionRequest.resumeDate,
        status: actionRequest.status,
      };
    });
    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'requestType', Header: 'Request Type' },
      { accessor: 'customerId', Header: 'Customer Id' },
      {
        accessor: 'amount',
        Header: 'Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'billingPeriod', Header: 'Billing Period' },
      { accessor: 'startDate', Header: 'Start Date' },
      { accessor: 'resumeDate', Header: 'Resume Date' },
      { accessor: 'status', Header: 'Status' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.actionRequestsLoading ? (
      <div>Loading action requests ...</div>
    ) : (
      <span>
        <ReactTable
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
      </span>
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

export class FamilyFeeDetails extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.memberItem);
    let columns = this.getColumns(data);
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.familyMembers) {
      this.setState({
        data: this.getData(nextProps.memberItem),
        columns: this.getColumns(this.getData(nextProps.memberItem)),
      });
    }
  }

  getData(memberItem) {
    if (!memberItem.values['Family Fee Details']) {
      return [];
    }
    let feeDetails = getJson(memberItem.values['Family Fee Details']);
    const data = feeDetails.map(details => {
      return {
        _id: details['id'],
        member: details.Name,
        program: details.feeProgram,
        fee: details.fee,
        discount: details.discount,
        cost: details.cost,
      };
    });

    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'member', Header: 'Member' },
      {
        accessor: 'program',
        Header: 'Program',
        Cell: props => (props.value ? props.value : 'NA'),
      },
      {
        accessor: 'cost',
        Header: 'Cost',
        align: 'center',
        Cell: props => (props.value ? '$' + props.value : 'NA'),
      },
      {
        accessor: 'discount',
        Header: 'Discount',
        align: 'center',
        Cell: props => (props.value ? props.value : 'NA'),
        headerClassName: 'col-align-center',
      },
      {
        accessor: 'fee',
        Header: 'Fee',
        align: 'center',
        Cell: props => (props.value ? '$' + props.value : 'NA'),
        headerClassName: 'col-align-center',
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <ReactTable
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length}
          pageSize={data.length}
          showPagination={false}
        />
        <span className="line">
          <h4>Membership Cost:</h4>
          &nbsp;
          <h4>
            {new Number(
              this.props.memberItem.values['Membership Cost'],
            ).toLocaleString('en', { style: 'currency', currency: 'USD' })}
          </h4>
        </span>
      </span>
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
          moment(props.value, ezidebit_date_format).format('Do MMM YYYY'),
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
    this.setIsAddMember = this.props.setIsAddMember;
    this.getActionRequests = this.props.getActionRequests;

    let billingMembers = this.getData(this.props.familyMembers);
    let showFamilyBillingDetails = false;
    let familyBillingDtlsBtnLabel = 'Show Family Billing  Details';
    this.setShowBillingAudit = this.setShowBillingAudit.bind(this);
    this.handleChange = handleChange.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);

    let showPaymentHistory = false;
    let paymentHistoryBtnLabel = 'Show Payment History';
    this.showHidePaymentHistory = this.showHidePaymentHistory.bind(this);

    this.memberFee = this.props.memberItem.values['Membership Cost']
      ? Number(this.props.memberItem.values['Membership Cost'])
      : undefined;

    this.state = {
      billingMembers,
      showFamilyBillingDetails,
      familyBillingDtlsBtnLabel,
      showPaymentHistory,
      paymentHistoryBtnLabel,
      showBillingAudit: false,
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

  componentDidMount() {}

  setShowBillingAudit(val) {
    this.setState({ showBillingAudit: val });
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

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
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
                    {getAttributeValue(this.props.space, 'Billing Company') ===
                      'PaySmart' && (
                      <tr>
                        <td>DDR Status:</td>
                        <td>{this.props.memberItem.values['DDR Status']}</td>
                      </tr>
                    )}
                    {getAttributeValue(this.props.space, 'Billing Company') ===
                      'PaySmart' && (
                      <tr>
                        <td>FFA ID:</td>
                        <td>{this.props.billingInfo.ffaid}</td>
                      </tr>
                    )}
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
                            period={
                              this.props.memberItem.values[
                                'Billing Payment Period'
                              ]
                            }
                          />
                        </td>
                      </tr>
                    )}
                    {this.props.billingInfo.nextBillingDate && (
                      <tr>
                        <td>Next Billing Date:</td>
                        <td>
                          {new Date(
                            moment(
                              this.props.billingInfo.nextBillingDate,
                              'DD-MM-YYYY',
                            ),
                          ).toLocaleDateString()}
                        </td>
                      </tr>
                    )}
                    {this.props.billingInfo.paymentAmountInCents && (
                      <tr>
                        <td>Payment Amount:</td>
                        <td>
                          {'$' +
                            Number(
                              this.props.billingInfo.paymentAmountInCents,
                            ) /
                              100}
                        </td>
                      </tr>
                    )}
                    <tr>
                      <td>Successful Payments:</td>
                      <td>
                        {'$' +
                          Number(
                            this.props.billingInfo
                              .totalPaymentsSuccessfulAmount,
                          )}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <hr />
                <span className="line">
                  <div style={{ width: '90vw', marginTop: '10px' }}>
                    {this.props.familyMembers.length > 0 && (
                      <FamilyFeeDetails memberItem={this.props.memberItem} />
                    )}
                  </div>
                </span>
                <div className="section1">
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
                </div>
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
  billingDDRUrl,
  billingWidgetUrl,
  billingCompany,
  updatePaymentMethod,
  refundPayment,
  doPaySmartRegistration,
  setDoPaySmartRegistration,
  ddrTemplates,
  actionRequests,
  actionRequestsLoading,
  getActionRequests,
  profile,
  space,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <div className="memberBillingDetails">
      <StatusMessagesContainer />
      <RecentNotificationsContainer />
      <div className="general">
        <div className="userDetails">
          {memberItem.values['Billing Customer Id'] !== null &&
            memberItem.values['Billing Customer Id'] !== undefined &&
            memberItem.values['Billing Customer Id'] !== '' && (
              <BillingInfo
                billingInfo={billingInfo}
                billingInfoLoading={billingInfoLoading}
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
                paymentHistoryLoading={paymentHistoryLoading}
                billingWidgetUrl={billingWidgetUrl}
                setIsAddMember={setIsAddMember}
                billingCompany={billingCompany}
                updatePaymentMethod={updatePaymentMethod}
                refundPayment={refundPayment}
                actionRequests={actionRequests}
                actionRequestsLoading={actionRequestsLoading}
                getActionRequests={getActionRequests}
                profile={profile}
                space={space}
              />
            )}
          {(memberItem.values['Billing Customer Id'] === null ||
            memberItem.values['Billing Customer Id'] === undefined ||
            memberItem.values['Billing Customer Id'] === '') && (
            <span>
              <h3>
                This Member is not synced with Billing or is not a Family Member
                of a Billing Member.
              </h3>
            </span>
          )}
        </div>
      </div>
    </div>
  );

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
    while (startDate.isSameOrBefore(moment())) {
      startDate = startDate.add(7, 'days');
    }
    dates.push(startDate.format('DD-MM-YYYY'));
    while (startDate.isSameOrBefore(toDate)) {
      startDate = startDate.add(7, 'days');
      dates.push(startDate.format('DD-MM-YYYY'));
    }
    return dates;
  } else if (billingPeriod === 'Fortnightly') {
    while (startDate.isSameOrBefore(moment())) {
      startDate = startDate.add(15, 'days');
    }
    dates.push(startDate.format('DD-MM-YYYY'));
    while (startDate.isSameOrBefore(toDate)) {
      startDate = startDate.add(15, 'days');
      dates.push(startDate.format('DD-MM-YYYY'));
    }
    return dates;
  } else if (billingPeriod === 'Monthly') {
    while (startDate.isSameOrBefore(moment())) {
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

export const BillingContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
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
  withState('isValidInput', 'setIsValidInput', true),
  withState('errorMessage', 'setErrorMessage', ''),
  withState('doPaySmartRegistration', 'setDoPaySmartRegistration', false),
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
    }) => (
      memberItem,
      updateMember,
      billingChangeReason,
      isDirty,
      setIsDirty,
      myThis,
      startDate,
      resumeDate,
    ) => {
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
        if (familyMembers) {
          //memberItem.values['Membership Cost'] = getFamilyMembershipCost(memberItem, familyMembers, membershipFees);
          memberItem.values['Family Fee Details'] = getFamilyMemberFeeDetails(
            familyMembers,
            membershipFees,
          );
        } else {
          //memberItem.values['Membership Cost'] = getMembershipCost(memberItem, membershipFees);
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
          fromBilling: true,
        });
        setIsDirty(false);
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
      space,
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
      args.refundAmount = paymentAmount;
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
    getActionRequests: ({
      memberItem,
      fetchActionRequests,
      setActionRequests,
      addNotification,
      setSystemError,
    }) => () => {
      fetchActionRequests({
        customerId: memberItem.values['Billing Customer Id'],
        setActionRequests: setActionRequests,
        setSystemError: setSystemError,
        addNotification: addNotification,
      });
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
        if (member.values['Billing Customer Id']) {
          this.props.fetchBillingInfo({
            billingRef: member.values['Billing Customer Id'],
            history: this.props.history,
            myThis: this,
            setBillingInfo: this.props.setBillingInfo,
            addNotification: this.props.addNotification,
            setSystemError: this.props.setSystemError,
          });
        }
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
      /*      if (
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
*/
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

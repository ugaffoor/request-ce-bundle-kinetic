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
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import {
  getLocalePreference,
  handleChange,
  handleMultiSelectChange,
  getJson,
} from './MemberUtils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import checkboxHOC from 'react-table/lib/hoc/selectTable';
import { updateBillingMembers } from '../../redux/sagas/members';
import {
  getMembershipCost,
  getFamilyMembershipCost,
} from '../helpers/membershipFee';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import 'bootstrap/scss/bootstrap.scss';
import '../../styles/react_data_grid.scss';
import '../helpers/jquery.multiselect.css';
import { contact_date_format } from '../leads/LeadsUtils';
import { confirmWithInput } from './Confirm';
import { confirmWithDates } from './ConfirmWithDates';
import { confirmWithAmount } from './ConfirmWithAmount';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { RecentNotificationsContainer } from '../notifications/RecentNotifications';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { actions as appActions } from '../../redux/modules/memberApp';
import { actions as posActions } from '../../redux/modules/pos';
import { actions as servicesActions } from '../../redux/modules/services';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import { MembershipReceiptToPrint } from './MembershipReceiptToPrint';
import ReactToPrint from 'react-to-print';
import axios from 'axios';
import { ReceiptToPrint } from './ReceiptToPrint';
import ScaleLoader from 'react-spinners/ScaleLoader';
import checkoutRightArrowIcon from '../../images/checkoutRightArrow.png?raw';
import Helmet from 'react-helmet';
import { getTimezone } from '../leads/LeadsUtils';
import { isBamboraFailedPayment } from '../Member/MemberUtils';
import mail from '../../images/mail.png';
import { confirm } from '../helpers/Confirmation';

<script src="../helpers/jquery.multiselect.js" />;

const ReactDataGrid = require('react-data-grid');

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  posCards: state.member.pos.posCards,
  posCardsLoading: state.member.pos.posCardsLoading,
  members: state.member.members.allMembers,
  billingInfo: state.member.members.billingInfo,
  billingInfoLoading: state.member.members.billingInfoLoading,
  setupBillingInfo: state.member.members.setupBillingInfo,
  setupBillingInfoLoading: state.member.members.setupBillingInfoLoading,
  completeMemberBilling: state.member.members.completeMemberBilling,
  currentMemberLoading: state.member.members.currentMemberLoading,
  allMembers: state.member.members.allMembers,
  membershipFees: state.member.app.membershipFees,
  paymentHistory: state.member.members.ALLpaymentHistory,
  paymentHistoryLoading: state.member.members.ALLpaymentHistoryLoading,
  setupPaymentHistory: state.member.members.SETUPpaymentHistory,
  setupPaymentHistoryLoading: state.member.members.SETUPpaymentHistoryLoading,
  refundTransactionInProgress: state.member.members.refundTransactionInProgress,
  refundTransactionID: state.member.members.refundTransactionID,
  familyMembers: state.member.members.familyMembers,
  removedBillingMembers: state.member.members.removedBillingMembers,
  billingDDRUrl: state.member.app.billingDDRUrl,
  billingWidgetUrl: state.member.app.billingWidgetUrl,
  profile: state.member.app.profile,
  billingCompany: state.member.app.billingCompany,
  ddrTemplates: state.member.app.ddrTemplates,
  actionRequests: state.member.members.actionRequests,
  actionRequestsLoading: state.member.members.actionRequestsLoading,
  space: state.member.app.space,
  spaceSlug: state.member.app.spaceSlug,
  snippets: state.member.app.snippets,
  memberCashPayments: state.member.members.memberCashPayments,
  memberCashPaymentsLoading: state.member.members.memberCashPaymentsLoading,
  membershipServices: state.member.services.membershipServices,
  membershipServicesLoading: state.member.services.membershipServicesLoading,
  cashRegistrations: state.member.services.cashRegistrations,
  cashRegistrationsLoading: state.member.services.cashRegistrationsLoading,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchBillingInfoAfterRegistration: actions.fetchBillingInfoAfterRegistration,
  fetchBillingInfo: actions.fetchBillingInfo,
  setBillingInfo: actions.setBillingInfo,
  fetchSetupBillingInfo: actions.fetchBillingInfo,
  setSetupBillingInfo: actions.setSetupBillingInfo,
  setCurrentMember: actions.setCurrentMember,
  clearPOSCards: posActions.clearPOSCards,
  fetchPOSCards: posActions.fetchPOSCards,
  setPOSCards: posActions.setPOSCards,
  updateMember: actions.updateMember,
  editPaymentAmount: actions.editPaymentAmount,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  setPaymentHistoryLoaded: actions.setPaymentHistoryLoaded,
  fetchFamilyMembers: actions.fetchFamilyMembers,
  setFamilyMembers: actions.setFamilyMembers,
  refundTransaction: actions.refundTransaction,
  refundTransactionComplete: actions.refundTransactionComplete,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchActionRequests: actions.fetchActionRequests,
  setActionRequests: actions.setActionRequests,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  addCashPayment: actions.addCashPayment,
  fetchMemberCashPayments: actions.fetchMemberCashPayments,
  fetchBillingChangeByBillingReference:
    servicesActions.fetchBillingChangeByBillingReference,
  fetchCashRegistrations: servicesActions.fetchCashRegistrations,
  sendReceipt: servicesActions.sendReceipt,
};

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';
var compThis = undefined;

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

var payNowThis;
class PayNow extends Component {
  constructor(props) {
    super(props);
    payNowThis = this;
    this.processPayment = this.processPayment.bind(this);
    this.processCashPayment = this.processCashPayment.bind(this);
    this.completeCashPayment = this.completeCashPayment.bind(this);
    this.processBamboraPayment = this.processBamboraPayment.bind(this);
    this.completePayment = this.completePayment.bind(this);
    this.disablePayNow = this.disablePayNow.bind(this);
    this.loadBamboraCheckout = this.loadBamboraCheckout.bind(this);

    this.componentRef = React.createRef();

    axios
      .get('https://api.ipify.org/')
      .then(ip => {
        this.setState({
          publicIP: ip.data,
        });
      })
      .catch(error => {
        console.log(error.response);
      });

    if (getAttributeValue(this.props.space, 'POS System') !== 'Bambora') {
      this.loadBamboraCheckout = this.loadBamboraCheckout.bind(this);

      this.customCheckout = undefined;
      this.isCardNumberComplete = false;
      this.isCVVComplete = false;
      this.isExpiryComplete = false;
    }

    this.state = {
      personType: 'Member',
      personID: undefined,
      payment: undefined,
      cvc: '',
      expiry: '',
      focus: '',
      name:
        this.props.memberItem.values['First Name'] +
        ' ' +
        this.props.memberItem.values['Last Name'],
      firstName: this.props.memberItem.values['First Name'],
      lastName: this.props.memberItem.values['Last Name'],
      number: '',
      posProfileID: this.props.memberItem.values['POS Profile ID'],
      processing: false,
      processingComplete: false,
      issuer: '',
      maxLength: 16,
      status: '',
      errors: '',
      myExternalLib: null,
      country: getAttributeValue(this.props.space, 'School Country Code'),
      paymentAmount: '0',
      address: this.props.memberItem.values['Address'],
      city: this.props.memberItem.values['Suburb'],
      postCode: this.props.memberItem.values['Postcode'],
      province: this.props.memberItem.values['State'],
      phoneNumber: this.props.memberItem.values['Phone Number'],
      email: this.props.memberItem.values['Email'],
      feeType: 'Membership Fee',
    };
    this.handleScriptInject = this.handleScriptInject.bind(this);
  }
  handleScriptInject({ scriptTags }) {
    if (scriptTags) {
      const scriptTag = scriptTags[0];
      scriptTag.onload = () => {
        // I don't really like referencing window.
        console.log(`myExternalLib loaded!`, window.myExternalLib);
        this.setState({
          myExternalLib: window.myExternalLib,
        });
        this.loadBamboraCheckout();
      };
    }
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentWillMount() {}

  completePayment() {}
  processBamboraPayment(posServiceURL, spaceSlug, posSystem, schoolName, uuid) {
    var data = JSON.stringify({
      space: this.props.spaceSlug,
      billingService: posSystem,
      issuer: this.state.issuer,
      customerId: 'dummy',
      payment: this.state.paymentAmount,
      orderId: this.props.memberItem.values['Billing Customer Id'],
      cardToken: this.state.cardToken,
      profileId: this.state.posProfileID,
      cardId: this.state.cardId,
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      sourceIP: this.state.publicIP,
      address: this.state.address,
      city: this.state.city,
      province: this.state.province,
      postCode: this.state.postCode,
      country: this.state.country === undefined ? 'US' : this.state.country,
      phoneNumber: this.state.phoneNumber,
      email: this.state.email,
      description:
        this.state.feeType === 'Membership Fee'
          ? 'Manual Membership Payment'
          : 'Manual Registration Fee',
    });

    var config = {
      method: 'post',
      url: posServiceURL,
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    axios(config)
      .then(function(response) {
        var data = JSON.parse(response.data.data);
        console.log(JSON.stringify(data));
        payNowThis.setState({
          status: data['status'],
          status_message: data['status_message'],
          errors: data['errors'],
          auth_code: data['auth_code'],
          transaction_id: data['transaction_id'],
          processingComplete: true,
          processing: false,
          datetime: moment(),
        });

        if (data['status'] === '1') {
          payNowThis.completePayment();
        } else {
          payNowThis.setState({
            processingComplete: false,
          });
        }
      })
      .catch(err => {
        var error = 'Connection Error';
        if (err.response) {
          // client received an error response (5xx, 4xx)
          error = err.response;
        } else if (err.request) {
          // client never received a response, or request never left
          error = err.request;
        }
        payNowThis.setState({
          status: '10',
          status_message: 'System Error',
          errors: error,
          auth_code: '',
          transaction_id: '',
          processingComplete: false,
          processing: false,
          datetime: moment(),
        });
        console.log(error);
      });
  }
  disablePayNow() {
    var disable = false;
    if (this.state.processing) {
      return true;
    }
    if (
      this.state.paymentAmount === undefined ||
      this.state.paymentAmount === '0' ||
      this.state.paymentAmount === ''
    ) {
      disable = true;
    }
    if (this.state.payment === undefined) {
      disable = true;
    }
    if (
      (this.state.payment === 'creditcard' ||
        this.state.payment === 'updateCreditCard') &&
      (this.state.cvc === '') |
        (this.state.expiry === '') |
        (this.state.name === '') |
        (this.state.number === '')
    ) {
      disable = true;
    }
    return disable;
  }
  processPayment() {
    var billingSystem = getAttributeValue(this.props.space, 'Billing Company');
    var posSystem = getAttributeValue(this.props.space, 'POS System');
    var posServiceURL = getAttributeValue(this.props.space, 'POS Service URL');
    var schoolName = getAttributeValue(this.props.space, 'School Name');
    if (
      billingSystem === 'Bambora' ||
      posSystem === 'Bambora' ||
      (posSystem === 'Square' &&
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora')
    ) {
      this.processBamboraPayment(
        posServiceURL,
        this.props.spaceSlug,
        'Bambora',
        schoolName,
        this.props.memberItem.values['Billing Customer Id'],
      );
    }
  }
  processCashPayment() {
    let values = {};
    values['Member ID'] = this.props.memberItem.values['Member ID'];
    values['Member GUID'] = this.props.memberItem.id;
    values['Date'] = moment();
    values['Amount'] = this.state.paymentAmount;

    this.props.addCashPaymentValue(
      values,
      this.completeCashPayment,
      this.props.billingInfo.nextBillingDate,
      this.props.memberItem,
      this.props.updateMember,
    );
  }
  completeCashPayment() {
    this.setState({
      transaction_id: 'Cash',
      status: '1',
      processingComplete: true,
      datetime: moment(),
    });
  }
  loadBamboraCheckout() {
    console.log('Loading Bambora Checkout');

    this.customCheckout = window.customcheckout();
    var customCheckoutController = {
      payThis: this,
      init: function() {
        console.log('checkout.init()');
        let formElem = $(
          "<form id='checkout-form' class='form-inline  text-center'></form>",
        );
        formElem.append(
          "<div class='form-group col-xs-6 has-feedback' id='card-number-bootstrap'><div id='card-number' class='form-control'></div><label class='help-block' for='card-number' id='card-number-error'></label></div>",
        );
        formElem.append(
          "<div class='form-group col-xs-2 has-feedback' id='card-cvv-bootstrap'><div id='card-cvv' class='form-control'></div><label class='help-block' for='card-cvv' id='card-cvv-error'></label></div>",
        );
        formElem.append(
          "<div class='form-group col-xs-2 has-feedback' id='card-expiry-bootstrap'><div id='card-expiry' class='form-control'></div><label class='help-block' for='card-expiry' id='card-expiry-error'></label></div>",
        );
        formElem.append(
          "<div class='col-xs-2 text-center'><button id='pay-button' type='submit' class='verifyBtn btn-primary disabled' disabled='true'>Create Token</button></div>",
        );
        //        formElem.append(
        //          "<div class='col-xs-2 text-center'><button id='save-to-profile' type='submit' class='btn btn-primary disabled' disabled='true'>Save for Later</button></div>",
        //        );
        $('.card-container .row').append(formElem);
        customCheckoutController.createInputs();
        customCheckoutController.addListeners();
      },
      createInputs: function() {
        console.log('checkout.createInputs()');
        var options = {};
        var payThis = customCheckoutController.payThis;
        // Create and mount the inputs
        options.placeholder = 'Card number';
        payThis.customCheckout
          .create('card-number', options)
          .mount('#card-number');

        options.placeholder = 'CVV';
        payThis.customCheckout.create('cvv', options).mount('#card-cvv');

        options.placeholder = 'MM / YY';
        payThis.customCheckout.create('expiry', options).mount('#card-expiry');
      },
      addListeners: function() {
        var self = this;
        var payThis = customCheckoutController.payThis;

        // listen for submit button
        if (document.getElementById('checkout-form') !== null) {
          document
            .getElementById('checkout-form')
            .addEventListener('submit', self.onSubmit.bind(self));
        }

        payThis.customCheckout.on('brand', function(event) {
          console.log('brand: ' + JSON.stringify(event));

          var cardLogo = 'none';
          if (event.brand && event.brand !== 'unknown') {
            var filePath =
              'https://cdn.na.bambora.com/downloads/images/cards/' +
              event.brand +
              '.svg';
            cardLogo = 'url(' + filePath + ')';
          }
          document.getElementById(
            'card-number',
          ).style.backgroundImage = cardLogo;
        });

        payThis.customCheckout.on('blur', function(event) {
          console.log('blur: ' + JSON.stringify(event));
        });

        payThis.customCheckout.on('focus', function(event) {
          console.log('focus: ' + JSON.stringify(event));
        });

        payThis.customCheckout.on('empty', function(event) {
          console.log('empty: ' + JSON.stringify(event));

          if (event.empty) {
            if (event.field === 'card-number') {
              payThis.isCardNumberComplete = false;
            } else if (event.field === 'cvv') {
              payThis.isCVVComplete = false;
            } else if (event.field === 'expiry') {
              payThis.isExpiryComplete = false;
            }
            self.setPayButton(false);
          }
        });

        payThis.customCheckout.on('complete', function(event) {
          console.log('complete: ' + JSON.stringify(event));

          if (event.field === 'card-number') {
            payThis.isCardNumberComplete = true;
            self.hideErrorForId('card-number');
          } else if (event.field === 'cvv') {
            payThis.isCVVComplete = true;
            self.hideErrorForId('card-cvv');
          } else if (event.field === 'expiry') {
            payThis.isExpiryComplete = true;
            self.hideErrorForId('card-expiry');
          }

          self.setPayButton(
            payThis.isCardNumberComplete &&
              payThis.isCVVComplete &&
              payThis.isExpiryComplete,
          );
        });

        payThis.customCheckout.on('error', function(event) {
          console.log('error: ' + JSON.stringify(event));

          if (event.field === 'card-number') {
            payThis.isCardNumberComplete = false;
            self.showErrorForId('card-number', event.message);
          } else if (event.field === 'cvv') {
            payThis.isCVVComplete = false;
            self.showErrorForId('card-cvv', event.message);
          } else if (event.field === 'expiry') {
            payThis.isExpiryComplete = false;
            self.showErrorForId('card-expiry', event.message);
          }
          self.setPayButton(false);
        });
      },
      onSubmit: function(event) {
        var self = this;
        var payThis = customCheckoutController.payThis;

        console.log('checkout.onSubmit()');

        event.preventDefault();
        self.setPayButton(false);
        self.toggleProcessingScreen();

        var callback = function(result) {
          console.log('token result : ' + JSON.stringify(result));
          if (result.error) {
            self.processTokenError(result.error);
            payThis.setState({
              cardToken: '',
              cvc: '',
              expiry: '',
              number: '',
              name: '',
              processingComplete: false,
            });
          } else {
            self.processTokenSuccess(result.token);
            if (payThis.state.payment === 'updateCreditCard') {
              var posSystem = getAttributeValue(
                payThis.props.space,
                'POS System',
              );
              var posServiceURL = getAttributeValue(
                payThis.props.space,
                'POS Service URL',
              );
            } else {
              payThis.setState({
                cardToken: result['token'],
                cvc: 'XXX',
                expiry: result['expiryMonth'] + '/' + result['expiryYear'],
                number: result['last4'],
                name: payThis.state.name,
                processingComplete: false,
              });
            }
          }
        };

        console.log('checkout.createToken()');
        payThis.customCheckout.createToken(callback);
      },
      hideErrorForId: function(id) {
        console.log('hideErrorForId: ' + id);

        var element = document.getElementById(id);

        if (element !== null) {
          var errorElement = document.getElementById(id + '-error');
          if (errorElement !== null) {
            errorElement.innerHTML = '';
          }

          var bootStrapParent = document.getElementById(id + '-bootstrap');
          if (bootStrapParent !== null) {
            bootStrapParent.className = 'form-group has-feedback has-success';
          }
        } else {
          console.log('showErrorForId: Could not find ' + id);
        }
      },
      showErrorForId: function(id, message) {
        console.log('showErrorForId: ' + id + ' ' + message);

        var element = document.getElementById(id);

        if (element !== null) {
          var errorElement = document.getElementById(id + '-error');
          if (errorElement !== null) {
            errorElement.innerHTML = message;
          }

          var bootStrapParent = document.getElementById(id + '-bootstrap');
          if (bootStrapParent !== null) {
            bootStrapParent.className = 'form-group has-feedback has-error ';
          }
        } else {
          console.log('showErrorForId: Could not find ' + id);
        }
      },
      setPayButton: function(enabled) {
        console.log('checkout.setPayButton() disabled: ' + !enabled);

        var payButton = document.getElementById('pay-button');
        if (enabled) {
          payButton.disabled = false;
          payButton.className = 'btn btn-primary';
        } else {
          payButton.disabled = true;
          payButton.className = 'btn btn-primary disabled';
        }
      },
      setSaveLaterButton: function(enabled) {
        console.log('checkout.setSaveButton() disabled: ' + !enabled);

        var payButton = document.getElementById('save-to-profile');
        if (enabled) {
          payButton.disabled = false;
          payButton.className = 'btn btn-primary';
        } else {
          payButton.disabled = true;
          payButton.className = 'btn btn-primary disabled';
        }
      },
      toggleProcessingScreen: function() {
        var processingScreen = document.getElementById('processing-screen');
        if (processingScreen) {
          processingScreen.classList.toggle('visible');
        }
      },
      showErrorFeedback: function(message) {
        var xMark = '\u2718';
        this.feedback = document.getElementById('feedback');
        this.feedback.innerHTML = xMark + ' ' + message;
        this.feedback.classList.add('error');
      },
      showSuccessFeedback: function(message) {
        var checkMark = '\u2714';
        this.feedback = document.getElementById('feedback');
        this.feedback.innerHTML = checkMark + ' ' + message;
        this.feedback.classList.add('success');
      },
      processTokenError: function(error) {
        error = JSON.stringify(error, undefined, 2);
        console.log('processTokenError: ' + error);

        this.showErrorFeedback(
          'Error creating token: </br>' + JSON.stringify(error, null, 4),
        );
        this.setPayButton(true);
        this.toggleProcessingScreen();
        var saveButton = document.getElementById('save-to-profile');
        saveButton.disabled = true;
        $(saveButton).addClass('disabled');
      },
      processTokenSuccess: function(token) {
        console.log('processTokenSuccess: ' + token);
        var payThis = customCheckoutController.payThis;

        this.showSuccessFeedback('Success! Created token: ' + token);
        this.setPayButton(true);
        this.toggleProcessingScreen();

        payThis.setState({
          status: '',
        });
      },
    };
    customCheckoutController.init();
  }

  render() {
    return (
      <div>
        <div className="paynow">
          {!this.state.processingComplete ||
          (this.state.status !== '1' && this.state.status !== '') ? (
            <span className="capturePayment">
              <span className="totalRow">
                <div className="radioGroup">
                  <label htmlFor="membershipFeeType" className="radio">
                    <input
                      id="membershipFeeType"
                      name="feeType"
                      type="radio"
                      checked={this.state.feeType === 'Membership Fee'}
                      value="Membership Fee"
                      onChange={e => {
                        this.setState({
                          feeType: 'Membership Fee',
                        });
                      }}
                      onClick={async e => {}}
                    />
                    Membership Fee
                  </label>
                  <label htmlFor="registrationFeeType" className="radio">
                    <input
                      id="registrationFeeType"
                      name="feeType"
                      type="radio"
                      checked={this.state.feeType === 'Registration Fee'}
                      onChange={e => {
                        this.setState({
                          feeType: 'Registration Fee',
                        });
                      }}
                      onClick={async e => {}}
                    />
                    Registration Fee
                  </label>
                </div>
              </span>
              <span className="totalRow">
                <span className="total">
                  <div className="label">Membership Amount</div>
                  <div className="value">
                    <NumberFormat
                      value={this.state.paymentAmount}
                      onValueChange={(values, e) => {
                        var { formattedValue, value } = values;
                        this.setState({
                          paymentAmount: value,
                        });
                      }}
                    />
                  </div>
                </span>
              </span>
              {this.state.posProfileID !== undefined &&
              this.state.posProfileID !== null &&
              this.state.posProfileID !== '' &&
              this.props.posCardsLoading ? (
                <span className="paymentType">
                  <div className="label">Loading Saved Card...</div>
                </span>
              ) : (
                <span className="paymentType">
                  <div className="label">Saved Card</div>
                  <table className="savedCards">
                    <tr>
                      <th>Number</th>
                      <th>Expiry Month</th>
                      <th>Year</th>
                      <th>Type</th>
                    </tr>
                    {this.props.posCards.map((card, index) => (
                      <tr>
                        <td>{card.number}</td>
                        <td>{card.expiryMonth}</td>
                        <td>{card.expiryYear}</td>
                        <td>{card.cardType}</td>
                      </tr>
                    ))}
                  </table>
                  <div className="radioGroup">
                    {this.props.posCards.length > 0 && (
                      <label htmlFor="savedCreditCard" className="radio">
                        <input
                          id="savedCreditCard"
                          name="savedcard"
                          type="radio"
                          value="Use Saved Card"
                          checked={this.state.payment === 'useSavedCreditCard'}
                          onChange={e => {
                            this.setState({
                              payment: 'useSavedCreditCard',
                              cardId: this.props.posCards[0].cardID,
                              number: this.props.posCards[0].number,
                              status: '',
                              errors: '',
                              processingComplete: false,
                              cardToken: undefined,
                            });
                          }}
                          onClick={async e => {}}
                        />
                        Use Saved Card
                      </label>
                    )}
                    <label htmlFor="useAnotherCreditCard" className="radio">
                      <input
                        id="useAnotherCreditCard"
                        name="savedcard"
                        type="radio"
                        onChange={e => {
                          this.setState({ payment: 'creditcard' });
                        }}
                        onClick={async e => {}}
                      />
                      Use Another Credit Card
                    </label>
                    <label htmlFor="cash" className="radio">
                      <input
                        id="cash"
                        name="savedcard"
                        type="radio"
                        value="Cash"
                        onChange={e => {
                          this.setState({
                            payment: 'cash',
                            cardToken: '',
                            cvc: '',
                            expiry: '',
                            number: '',
                          });
                        }}
                      />
                      Cash
                    </label>
                  </div>
                </span>
              )}
              {this.state.payment === 'creditcard' &&
                getAttributeValue(this.props.space, 'POS System') ===
                  'Bambora' && (
                  <span className="creditCard" id="bamboraCheckout">
                    {/* Load the myExternalLib.js library. */}
                    <Helmet
                      script={[
                        {
                          src:
                            'https://libs.na.bambora.com/customcheckout/1/customcheckout.js',
                        },
                      ]}
                      // Helmet doesn't support `onload` in script objects so we have to hack in our own
                      onChangeClientState={(newState, addedTags) =>
                        this.handleScriptInject(addedTags)
                      }
                    />
                    <div>
                      {this.state.myExternalLib !== null ? (
                        <span>
                          <meta
                            name="viewport"
                            content="width=device-width, initial-scale=1"
                          />
                          <div className="card-container">
                            <div className="row" />
                          </div>
                          <div className="row">
                            <div className="col-lg-12 text-center">
                              <div id="feedback" />
                            </div>
                          </div>
                        </span>
                      ) : (
                        'loading...'
                      )}
                    </div>
                  </span>
                )}
              {this.state.status !== '1' &&
                this.state.status !== '' && (
                  <span className="error">
                    <span className="statusCode">
                      <label>Status:</label>
                      <value>{this.state.status}</value>
                    </span>
                    <span className="statusMessage">
                      <label>Status Message:</label>
                      <value>{this.state.status_message}</value>
                    </span>
                    {this.state.errors !== '' && (
                      <span className="errors">
                        <label>Errors:</label>
                        <value>{this.state.errors}</value>
                      </span>
                    )}
                  </span>
                )}
            </span>
          ) : (
            <span className="receipt">
              <ReceiptToPrint
                locale={this.props.locale}
                currency={this.props.currency}
                total={this.state.paymentAmount}
                number={this.state.number}
                auth_code={this.state.auth_code}
                transaction_id={this.state.transaction_id}
                space={this.props.space}
                snippets={this.props.snippets}
                datetime={this.state.datetime}
                name={this.state.name}
                ref={this.componentRef}
              />
              <span className="printReceipt">
                <ReactToPrint
                  trigger={() => (
                    <PrinterIcon className="icon barcodePrint icon-svg" />
                  )}
                  content={() => this.componentRef.current}
                  pageStyle="@page {size: a4 portrait;margin: 0;}"
                  onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
                />
              </span>
            </span>
          )}
          <span className="bottomRow">
            {(!this.state.processingComplete ||
              (this.state.status !== '1' && this.state.status !== '')) &&
              this.state.payment !== 'capture' && (
                <div
                  className="paynowButton"
                  disabled={this.disablePayNow() && !this.state.processing}
                  onClick={e => {
                    if (this.disablePayNow() || this.state.processing) return;
                    this.setState({
                      processing: true,
                    });
                    if (
                      this.state.payment === 'creditcard' ||
                      this.state.payment === 'useSavedCreditCard' ||
                      this.state.payment === 'updateCreditCard'
                    ) {
                      this.processPayment();
                    } else if (this.state.payment === 'cash') {
                      this.processCashPayment();
                    } else {
                      setTimeout(function() {
                        this.setState({
                          processing: false,
                          processingComplete: true,
                          status: '1',
                          errors: '',
                          auth_code: '',
                          transaction_id: 'cash',
                          datetime: moment(),
                        });
                        this.completePayment();
                      });
                    }
                  }}
                >
                  {this.state.processing ? (
                    <ScaleLoader
                      className="processing"
                      height="35px"
                      width="16px"
                      radius="2px"
                      margin="4px"
                      color="white"
                    />
                  ) : (
                    <span>
                      <span className="label">Pay Now</span>
                      <img src={checkoutRightArrowIcon} alt="Pay Now" />
                    </span>
                  )}
                </div>
              )}
          </span>
        </div>
      </div>
    );
  }
}
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

  UNSAFE_componentWillReceiveProps(nextProps) {
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

  UNSAFE_componentWillMount() {
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

  UNSAFE_componentWillReceiveProps(nextProps) {
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
        Cell: props =>
          new Intl.NumberFormat(this.props.locale, {
            style: 'currency',
            currency: this.props.currency,
          }).format(props.value),
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
        Cell: props =>
          new Intl.NumberFormat(this.props.locale, {
            style: 'currency',
            currency: this.props.currency,
          }).format(props.value),
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
            {new Intl.NumberFormat(this.props.locale, {
              style: 'currency',
              currency: this.props.currency,
            }).format(this.props.memberItem.values['Membership Cost'])}
          </h4>
        </span>
      </span>
    );
  }
}

export class PaymentHistory extends Component {
  constructor(props) {
    super(props);
    this.formatEmailCell = this.formatEmailCell.bind(this);
    this.refundPayment = this.refundPayment.bind(this);
    this.paymentHistory = this.props.paymentHistory;
    this.memberCashPayments = this.props.memberCashPayments;
    let data = this.getData(
      this.paymentHistory,
      this.memberCashPayments,
      this.props.setupPaymentHistory,
    );
    let columns = this.getColumns();
    this.rowRecieptsRefs = new Map();

    this.tableComponentRef = React.createRef();

    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.paymentHistoryLoading &&
      !nextProps.setupPaymentHistoryLoading &&
      !nextProps.memberCashPaymentsLoading &&
      !nextProps.membershipServicesLoading &&
      !nextProps.cashRegistrationsLoading
    ) {
      this.paymentHistory = nextProps.paymentHistory;
      this.setState({
        data: this.getData(
          this.props.memberItem,
          nextProps.paymentHistory,
          nextProps.memberCashPayments,
          nextProps.setupPaymentHistory,
          nextProps.membershipServices,
        ),
      });
    }
  }
  formatEmailCell(cellInfo) {
    return cellInfo.original.paymentStatus === 'S' ||
      cellInfo.original.paymentStatus === 'paid' ||
      cellInfo.original.paymentStatus === 'Settled' ||
      cellInfo.original.paymentStatus === 'Approved' ||
      cellInfo.original.paymentStatus === 'Cash' ? (
      <span
        className="registrationEmail"
        onClick={async e => {
          if (
            await confirm(
              <span>
                <span>Are you sure you want to send a receipt email?</span>
              </span>,
            )
          ) {
            var values = {};
            values['Form Slug'] = 'member_receipt';
            values['Submission ID'] = this.props.memberItem.id;
            values['Email Content'] = $(
              '#print_' + cellInfo.original['_id'],
            ).html();

            this.props.sendReceipt({
              values: values,
              addNotification: this.props.addNotification,
              setSystemError: this.props.setSystemError,
            });
          }
        }}
      >
        <img src={mail} alt="Email" />
        {cellInfo.original['receiptSender'] !== undefined && (
          <span className="sendTimes" placeholder="Send Receipt Times">
            {cellInfo.original['receiptSender'].map(date => (
              <span className="sendTime">{date.format('L hh:mmA')}</span>
            ))}
          </span>
        )}
      </span>
    ) : (
      <div />
    );
  }
  getData(
    memberItem,
    payments,
    memberCashPayments,
    setupfees,
    membershipServices,
  ) {
    var successfulPayments = [];
    payments.forEach((payment, i) => {
      if (payment.paymentStatus !== 'Refund') {
        successfulPayments[successfulPayments.length] = payment;
      }
    });

    payments.forEach((payment, i) => {
      if (payment.paymentStatus === 'Refund') {
        var idx = successfulPayments.findIndex(item => {
          return item.paymentID === payment.yourSystemReference;
        });
        if (idx !== -1) {
          successfulPayments[idx].refundAmount = payment.paymentAmount;
        }
      }
    });

    if (setupfees !== undefined) {
      setupfees.forEach((payment, i) => {
        if (payment.paymentStatus !== 'Refund') {
          successfulPayments[successfulPayments.length] = payment;
        }
      });

      setupfees.forEach((payment, i) => {
        if (payment.paymentStatus === 'Refund') {
          var idx = successfulPayments.findIndex(item => {
            return item.paymentID === payment.yourSystemReference;
          });
          if (idx !== -1) {
            successfulPayments[idx].refundAmount = payment.paymentAmount;
          }
        }
      });
    }
    memberCashPayments.forEach((payment, i) => {
      successfulPayments[successfulPayments.length] = {
        paymentAmount: payment.values['Amount'],
        scheduledAmount: payment.values['Amount'],
        paymentMethod: 'Cash',
        paymentStatus: 'Cash',
        debitDate: moment(payment.values['Date']).format('YYYY-MM-DD HH:mm:ss'),
        paymentSource: 'Cash',
        paymentID: payment.handle,
      };
    });

    let dataResult = successfulPayments.sort(function(p1, p2) {
      if (
        moment(p1.debitDate, contact_date_format).isAfter(
          moment(p2.debitDate, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(p1.debitDate, contact_date_format).isBefore(
          moment(p2.debitDate, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
    var idx = 0;
    dataResult = dataResult.map(payment => {
      return {
        _id: payment.paymentID + '_' + idx++,
        scheduledAmount: payment.scheduledAmount,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        refundAmount: payment.refundAmount,
        transactionFee: payment.transactionFeeCustomer,
        debitDate: payment.debitDate,
        paymentSource: payment.paymentSource,
        paymentReference: payment.paymentReference,
        paymentID: payment.paymentID,
        payment: payment,
      };
    });
    return dataResult;
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

    const columns = [];
    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
      columns.push({
        accessor: 'paymentSource',
        Header: 'Type',
        Cell: props => {
          return props.value !== undefined && props.value.trim() !== ''
            ? props.value
            : 'Membership';
        },
      });
    }
    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
      columns.push({
        accessor: 'paymentID',
        Header: 'Transaction ID',
        Cell: props => {
          return props.value;
        },
      });
    }

    if (
      getAttributeValue(this.props.space, 'Billing Company') === 'PaySmart' ||
      getAttributeValue(this.props.space, 'Billing Company') === 'Stripe'
    ) {
      columns.push({
        accessor: 'scheduledAmount',
        Header: 'Scheduled Amount',
        Cell: props =>
          new Intl.NumberFormat(this.props.locale, {
            style: 'currency',
            currency: this.props.currency,
          }).format(props.value),
      });
    }
    columns.push({
      accessor: 'paymentAmount',
      Header: 'Payment Amount',
      Cell: props =>
        new Intl.NumberFormat(this.props.locale, {
          style: 'currency',
          currency: this.props.currency,
        }).format(props.value),
    });
    if (getAttributeValue(this.props.space, 'Billing Company') === 'PaySmart') {
      columns.push({ accessor: 'paymentMethod', Header: 'Payment Method' });
    }
    columns.push({ accessor: 'paymentStatus', Header: 'Payment Status' });
    columns.push({
      accessor: 'debitDate',
      Header: 'Debit Date',
      Cell: props => moment(props.value, ezidebit_date_format).format('L'),
    });
    columns.push({
      accessor: '$refundPayment',
      headerClassName: 'refund',
      className: 'refund',
      Cell: row =>
        !this.isPaymentRefunded(row.original.paymentID, paymentsRefunded) &&
        (row.original.paymentStatus === 'S' ||
          row.original.paymentStatus === 'paid' ||
          row.original.paymentStatus === 'Settled' ||
          row.original.paymentStatus === 'Approved') ? (
          <button
            type="button"
            className="btn btn-primary"
            disabled={this.props.refundTransactionInProgress ? true : false}
            onClick={e =>
              this.refundPayment(
                row.original.paymentID,
                row.original.paymentAmount,
              )
            }
          >
            {this.props.refundTransactionInProgress
              ? 'Refunding...'
              : 'Refund Payment'}
          </button>
        ) : this.isPaymentRefunded(row.original.paymentID, paymentsRefunded) ? (
          <span>
            Refunded{' '}
            {row.original['refundAmount'] !== undefined && (
              <span className="refundValue">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(
                  row.original['refundAmount'] !== undefined
                    ? row.original['refundAmount']
                    : '',
                )}
              </span>
            )}
            {this.props.refundTransactionID.id !== undefined &&
              this.props.refundTransactionID.id === row.original.paymentID && (
                <span className="refundValue">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(
                    this.props.refundTransactionID.id === row.original.paymentID
                      ? this.props.refundTransactionID.value
                      : row.original['Refund'],
                  )}
                </span>
              )}
          </span>
        ) : (
          ''
        ),
    });
    columns.push({
      headerClassName: 'print',
      className: 'print',
      Cell: row =>
        (row.original.paymentStatus === 'S' ||
          row.original.paymentStatus === 'paid' ||
          row.original.paymentStatus === 'Settled' ||
          row.original.paymentStatus === 'Approved' ||
          row.original.paymentStatus === 'Cash') && (
          <span className="col-sm-2 orderreceipt">
            <span
              style={{ display: 'none' }}
              id={'print_' + row.original['_id']}
            >
              <MembershipReceiptToPrint
                memberItem={this.props.memberItem}
                membershipServices={this.props.membershipServices}
                cashRegistrations={this.props.cashRegistrations}
                familyMembers={this.props.familyMembers}
                locale={this.props.locale}
                currency={this.props.currency}
                payment={row.original}
                paymentID={row.original['paymentID']}
                paymentMethod={row.original['paymentMethod']}
                refundValue={row.original['refundAmount']}
                status={
                  this.isPaymentRefunded(
                    row.original.paymentID,
                    paymentsRefunded,
                  )
                    ? 'Refunded'
                    : 'Approved'
                }
                total={row.original.paymentAmount}
                datetime={moment(row.original.debitDate, 'YYYY-MM-DD HH:mm:SS')}
                space={this.props.space}
                snippets={this.props.snippets}
                name={
                  this.props.memberItem.values['First Name'] +
                  ' ' +
                  this.props.memberItem.values['Last Name']
                }
                ref={el => this.rowRecieptsRefs.set(row.original._id, el)}
              />
            </span>
            <span className="printReceipt">
              <ReactToPrint
                trigger={() => (
                  <PrinterIcon className="icon barcodePrint icon-svg" />
                )}
                content={() => this.rowRecieptsRefs.get(row.original._id)}
                pageStyle="@page {size: a4 portrait;margin: 0;}"
                onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
              />
            </span>
          </span>
        ),
    });
    columns.push({
      headerClassName: 'email',
      className: 'email',
      Cell: this.formatEmailCell,
    });

    return columns;
  }

  refundPayment(paymentId, amount) {
    confirmWithAmount({
      title: 'Refund transaction',
      amount: amount,
      placeholder:
        'Please enter a reason for this Refund. Not entering a valid reason could cause you pain later.',
    }).then(
      ({ amount, reason }) => {
        console.log('proceed! input:' + reason);
        this.props.refundPayment(
          this.props.billingThis,
          paymentId,
          amount,
          reason,
        );
      },
      () => {
        console.log('cancel!');
      },
    );
  }

  render() {
    const { data, columns } = this.state;
    return this.props.paymentHistoryLoading ||
      this.props.memberCashPaymentsLoading ||
      this.props.membershipServicesLoading ||
      this.props.cashRegistrationsLoading ? (
      <div>Loading Payment History ...</div>
    ) : (
      <div className="purchaseItemsReport">
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon tablePrint icon-svg" />}
          content={() => this.tableComponentRef.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
        />
        <div className="paymentHistoryTable">
          <ReactTable
            columns={columns}
            data={data}
            className="-striped -highlight paymentHistory"
            defaultPageSize={data.length > 0 ? data.length : 2}
            pageSize={data.length > 0 ? data.length : 2}
            showPagination={false}
          />
        </div>
        {
          <a
            onClick={e => {
              console.log('Show More..');
              this.props.getPaymentHistory();
            }}
            className="btn btn-primary showMore"
            style={{ marginLeft: '10px', color: 'white' }}
          >
            Show More
          </a>
        }

        <span style={{ display: 'none' }}>
          <div
            className="printMemberBillingTransactions"
            ref={this.tableComponentRef}
          >
            <div className="memberDetails">
              <div className="header">
                <img
                  src="https://gbfms-files.s3-ap-southeast-2.amazonaws.com/GB+Name+Log.png"
                  alt="GB Logo"
                  className="GBLogo"
                />
              </div>
              <table className="details">
                <tr>
                  <td colSpan={2} className="label">
                    {getAttributeValue(this.props.space, 'School Name')}
                  </td>
                </tr>
                <tr>
                  <td className="label">Name: </td>
                  <td className="name">
                    {this.props.memberItem.values['First Name']}{' '}
                    {this.props.memberItem.values['Last Name']}
                  </td>
                </tr>
                <tr>
                  <td className="label">Address: </td>
                  <td className="name">
                    {this.props.memberItem.values['Address']}
                  </td>
                </tr>
                <tr>
                  <td className="label" />
                  <td className="name">
                    {this.props.memberItem.values['Suburb']},{' '}
                    {this.props.memberItem.values['State']}{' '}
                    {this.props.memberItem.values['Postcode']}
                  </td>
                </tr>
              </table>
            </div>
            {this.props.familyMembers !== undefined &&
              this.props.familyMembers.length > 0 && (
                <span className="familyMembers">
                  <table style={{ border: 1, width: '100%' }}>
                    <thead>
                      <td>
                        <b>Member</b>
                      </td>
                      <td>
                        <b>Program</b>
                      </td>
                    </thead>
                    <tbody>
                      {getJson(
                        this.props.memberItem.values['Family Fee Details'],
                      ).map((member, index) => (
                        <tr>
                          <td>{member.Name}</td>
                          <td>{member.feeProgram}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <br />
                </span>
              )}
            <div className="memberDetails">
              <table className="transactions">
                <thead>
                  {getAttributeValue(this.props.space, 'Billing Company') ===
                    'Bambora' && <th>Type</th>}
                  {getAttributeValue(this.props.space, 'Billing Company') ===
                    'Bambora' && <th>Transaction ID</th>}
                  {getAttributeValue(this.props.space, 'Billing Company') ===
                    'PaySmart' && <th>Scheduled Amount</th>}
                  <th>Payment Amount</th>
                  {getAttributeValue(this.props.space, 'Billing Company') ===
                    'PaySmart' && <th>Payment Method</th>}
                  <th>Payment Status</th>
                  <th>Debit Date</th>
                  <th>Refund</th>
                </thead>
                <tbody>
                  {this.state.data.map((item, index) => (
                    <tr idx={index}>
                      {getAttributeValue(
                        this.props.space,
                        'Billing Company',
                      ) === 'Bambora' && (
                        <td>
                          {item.paymentSource !== undefined &&
                          item.paymentSource !== ''
                            ? item.paymentSource
                            : 'Membership'}
                        </td>
                      )}
                      {getAttributeValue(
                        this.props.space,
                        'Billing Company',
                      ) === 'Bambora' && <td>{item.paymentID}</td>}
                      {getAttributeValue(
                        this.props.space,
                        'Billing Company',
                      ) === 'PaySmart' && (
                        <td>
                          {new Intl.NumberFormat(this.props.locale, {
                            style: 'currency',
                            currency: this.props.currency,
                          }).format(item.scheduledAmount)}
                        </td>
                      )}
                      <td>
                        {new Intl.NumberFormat(this.props.locale, {
                          style: 'currency',
                          currency: this.props.currency,
                        }).format(item.paymentAmount)}
                      </td>
                      {getAttributeValue(
                        this.props.space,
                        'Billing Company',
                      ) === 'PaySmart' && <td>{item.paymentMethod}</td>}
                      <td>{item.paymentStatus}</td>
                      <td>
                        {moment(item.debitDate, ezidebit_date_format).format(
                          'L',
                        )}
                      </td>
                      {item.refundAmount !== undefined && (
                        <td>
                          {new Intl.NumberFormat(this.props.locale, {
                            style: 'currency',
                            currency: this.props.currency,
                          }).format(
                            item.refundAmount !== undefined
                              ? item.refundAmount
                              : '',
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </span>
      </div>
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

  UNSAFE_componentWillMount() {}
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
    compThis = this;

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );
    this.completeRenewCashPayment = this.completeRenewCashPayment.bind(this);
    this.processRenewCashPayment = this.processRenewCashPayment.bind(this);

    getAttributeValue(this.props.space, 'Billing Company');
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
      capturePayment: false,
      cashRenewal: false,
      processingRenewCash: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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
      this.props.fetchMemberCashPayments({
        id: this.props.memberItem.id,
      });
      this.props.fetchCashRegistrations({
        id: this.props.memberItem.id,
      });

      this.props.fetchBillingChangeByBillingReference({
        franchisor: getAttributeValue(this.props.space, 'Franchisor'),
        billingCompany: getAttributeValue(this.props.space, 'Billing Company'),
        billingCustomerRef: this.props.memberItem.values['Billing Customer Id'],
      });
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
  getRenewalToDate(fromDate, memberItem) {
    var period = memberItem.values['Billing Payment Period'];

    if (period === 'Fortnightly' || period === 'Weekly') {
      var from = moment(memberItem.values['Billing Cash Term Start Date']);
      var to = moment(memberItem.values['Billing Cash Term End Date']);
      var weeks = to.diff(from, 'weeks');

      return fromDate.add(weeks, 'weeks');
    }

    if (period === 'Monthly') {
      var from = moment(memberItem.values['Billing Cash Term Start Date']);
      var to = moment(memberItem.values['Billing Cash Term End Date']);
      var months = to.diff(from, 'months');

      return fromDate.add(months, 'months');
    }
    return undefined;
  }
  processRenewCashPayment() {
    this.setState({
      processingRenewCash: true,
    });

    let values = {};
    values['Member ID'] = this.props.memberItem.values['Member ID'];
    values['Member GUID'] = this.props.memberItem.id;
    values['Date'] = moment();
    values['Amount'] = this.props.memberItem.values['Membership Cost'];

    this.props.addCashPaymentValue(
      values,
      this.completeRenewCashPayment,
      undefined,
      this.props.memberItem,
      this.props.updateMember,
    );
  }
  completeRenewCashPayment(updateMember) {
    var origStartDate = moment(
      this.props.memberItem.values['Billing Cash Term Start Date'],
      'YYYY-MM-DD',
    );
    var origEndDate = moment(
      this.props.memberItem.values['Billing Cash Term End Date'],
      'YYYY-MM-DD',
    );

    this.props.memberItem.values[
      'Billing Cash Term Start Date'
    ] = this.state.renewalFromDate.format('YYYY-MM-DD');
    this.props.memberItem.values[
      'Billing Cash Term End Date'
    ] = this.state.renewalToDate.format('YYYY-MM-DD');

    let changes = this.props.memberItem.values['Billing Changes'];
    if (!changes) {
      changes = [];
    } else if (typeof changes !== 'object') {
      changes = JSON.parse(changes);
    }
    changes.push({
      date: moment().format(contact_date_format),
      user: this.props.profile.username,
      action: 'Cash Membership Renewal',
      from: origStartDate.format('L') + ' - ' + origEndDate.format('L'),
      to:
        this.state.renewalFromDate.format('L') +
        ' - ' +
        this.state.renewalToDate.format('L'),
    });

    let values = {};
    values['Billing Start Date'] = this.props.billingInfo.nextBillingDate;
    values['Billing Cash Term Start Date'] = this.state.renewalFromDate.format(
      'YYYY-MM-DD',
    );
    values['Billing Cash Term End Date'] = this.state.renewalToDate.format(
      'YYYY-MM-DD',
    );
    values['Billing Changes'] = changes;

    updateMember({
      id: this.props.memberItem['id'],
      memberItem: this.props.memberItem,
      values: values,
    });

    this.setState({
      processingRenewCash: false,
      cashRenewal: false,
    });
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
        {this.props.memberItem.values['Billing Payment Type'] === 'Cash' &&
          !this.state.cashRenewal && (
            <div
              className={
                this.props.memberItem.values['Billing Payment Type'] === 'Cash'
                  ? 'billingInfo show'
                  : 'hide'
              }
            >
              <p>
                Cash paid for period{' '}
                {moment(
                  this.props.memberItem.values['Billing Cash Term Start Date'],
                ).format('L')}{' '}
                to{' '}
                {moment(
                  this.props.memberItem.values['Billing Cash Term End Date'],
                ).format('L')}
              </p>
              <p>
                Payment:{' '}
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.props.memberItem.values['Membership Cost'])}
              </p>
              {
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={e => {
                    this.setState({
                      cashRenewal: true,
                      renewalFromDate: moment(
                        this.props.memberItem.values[
                          'Billing Cash Term End Date'
                        ],
                      ).add(1, 'day'),
                      renewalToDate: this.getRenewalToDate(
                        moment(
                          this.props.memberItem.values[
                            'Billing Cash Term End Date'
                          ],
                        ).add(1, 'day'),
                        this.props.memberItem,
                      ),
                    });
                  }}
                >
                  Renew existing
                </button>
              }
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'Bambora' && (
                <a
                  href={
                    getAttributeValue(this.props.space, 'Web Server Url') +
                    '/#/kapps/services/categories/bambora-billing/cash-member-registration?id=' +
                    this.props.memberItem.id
                  }
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                >
                  Renew with new details
                </a>
              )}
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'PaySmart' && (
                <a
                  href={
                    getAttributeValue(this.props.space, 'Web Server Url') +
                    '/#/kapps/services/categories/billing-registration/cash-member-registration?id=' +
                    this.props.memberItem.id
                  }
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                >
                  Renew with new details
                </a>
              )}
              {getAttributeValue(this.props.space, 'Billing Company') ===
                'Stripe' && (
                <a
                  href={
                    getAttributeValue(this.props.space, 'Web Server Url') +
                    '/#/kapps/services/categories/stripe-registration/cash-member-registration?id=' +
                    this.props.memberItem.id
                  }
                  className="btn btn-primary"
                  style={{ marginLeft: '10px', color: 'white' }}
                >
                  Renew with new details
                </a>
              )}
            </div>
          )}
        {this.props.memberItem.values['Billing Payment Type'] === 'Cash' &&
          this.state.cashRenewal && (
            <div>
              <div className="cashRenewalContainer">
                <div className="cashRenewalDiv">
                  <p>
                    Payment:{' '}
                    {new Intl.NumberFormat(this.props.locale, {
                      style: 'currency',
                      currency: this.props.currency,
                    }).format(this.props.memberItem.values['Membership Cost'])}
                  </p>
                  <div className="col-md-8">
                    <div className="row">
                      <div className="form-group col-xs-2 mr-1">
                        <label htmlFor="fromDate" className="control-label">
                          From Date
                        </label>
                        <DayPickerInput
                          name="fromDate"
                          id="fromDate"
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
                          value={this.state.renewalFromDate.toDate()}
                          onDayChange={function(
                            selectedDay,
                            modifiers,
                            dayPickerInput,
                          ) {
                            compThis.setState({
                              renewalFromDate: moment(selectedDay),
                              renewalToDate: compThis.getRenewalToDate(
                                moment(selectedDay),
                                compThis.props.memberItem,
                              ),
                            });
                          }}
                          dayPickerProps={{
                            locale: getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                            localeUtils: MomentLocaleUtils,
                          }}
                        />
                      </div>
                      <div className="form-group col-xs-2 mr-1">
                        <label htmlFor="toDate" className="control-label">
                          To Date
                        </label>
                        <input
                          type="text"
                          name="toDate"
                          id="toDate"
                          disabled={true}
                          defaultValue={''}
                          value={this.state.renewalToDate.format('L')}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="form-group col-xs-2">
                        <label className="control-label">&nbsp;</label>
                        <button
                          className="btn btn-primary form-control input-sm"
                          onClick={e => this.setState({ cashRenewal: false })}
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="form-group col-xs-2">
                        <label className="control-label">&nbsp;</label>
                        <button
                          className="btn btn-primary form-control input-sm"
                          onClick={e => this.processRenewCashPayment()}
                          disabled={this.state.processingRenewCash}
                        >
                          Renew
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        {this.props.memberItem.values['Non Paying'] === 'YES' && (
          <p>Non Paying</p>
        )}
        <span className="line">
          {this.props.memberItem.values['Billing Payment Type'] !== 'Cash' &&
            this.props.memberItem.values['Non Paying'] !== 'YES' &&
            ((this.props.memberItem.values['Billing Customer Id'] !==
              undefined &&
              this.props.memberItem.values['Billing Customer Id'] !== null &&
              this.props.memberItem.values['Billing Customer Id'] !== '') ||
              (this.props.memberItem.values['Billing Setup Fee Id'] !==
                undefined &&
                this.props.memberItem.values['Billing Setup Fee Id'] !== null &&
                this.props.memberItem.values['Billing Setup Fee Id'] !==
                  '')) && (
              <span>
                <div title="Billing Info" className="billingInfo">
                  {!this.props.isValidInput ? (
                    <div ref="errorDiv" style={errorMessageDiv}>
                      {this.props.errorMessage}
                    </div>
                  ) : (
                    ''
                  )}
                  <hr />
                  {(this.props.memberItem.values['Billing Customer Id'] !==
                    undefined &&
                    this.props.memberItem.values['Billing Customer Id'] !==
                      null &&
                    this.props.memberItem.values['Billing Customer Id'] !==
                      '' &&
                    this.props.billingInfoLoading === true) ||
                  (this.props.memberItem.values['Billing Setup Fee Id'] !==
                    undefined &&
                    this.props.memberItem.values['Billing Setup Fee Id'] !==
                      null &&
                    this.props.memberItem.values['Billing Setup Fee Id'] !==
                      '' &&
                    this.props.setupBillingInfoLoading === true) ? (
                    <div>
                      <p>Loading Billing Information</p>
                      <ReactSpinner />
                    </div>
                  ) : (
                    <span>
                      <span className="line updateButtons">
                        {getAttributeValue(
                          this.props.space,
                          'Billing Company',
                        ) === 'Bambora' && (
                          <div>
                            <NavLink
                              to={`/categories/bambora-billing/bambora-submit-billing-changes?id=${
                                this.props.memberItem.id
                              }`}
                              kappSlug={'services'}
                              className={
                                'nav-link icon-wrapper btn btn-primary'
                              }
                              activeClassName="active"
                              disabled={
                                this.props.memberItem.values['Status'] !==
                                'Active'
                              }
                              style={{
                                display: 'inline',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                              }}
                            >
                              Update Billing Details
                            </NavLink>
                          </div>
                        )}
                        {getAttributeValue(
                          this.props.space,
                          'Billing Company',
                        ) === 'Stripe' &&
                          getAttributeValue(this.props.space, 'Franchisor') !==
                            'YES' && (
                            <div>
                              <NavLink
                                to={`/categories/stripe-billing/stripe-submit-billing-changes?id=${
                                  this.props.memberItem.id
                                }`}
                                kappSlug={'services'}
                                className={
                                  'nav-link icon-wrapper btn btn-primary'
                                }
                                activeClassName="active"
                                disabled={
                                  this.props.memberItem.values['Status'] !==
                                  'Active'
                                }
                                style={{
                                  display: 'inline',
                                  paddingTop: '4px',
                                  paddingBottom: '4px',
                                }}
                              >
                                Update Billing Details
                              </NavLink>
                            </div>
                          )}
                        {getAttributeValue(
                          this.props.space,
                          'Billing Company',
                        ) === 'Bambora' && (
                          <div>
                            <NavLink
                              to={`/categories/bambora-billing/bambora-change-credit-card-details?id=${
                                this.props.memberItem.id
                              }`}
                              kappSlug={'services'}
                              className={
                                'nav-link icon-wrapper btn btn-primary'
                              }
                              activeClassName="active"
                              style={{
                                display: 'inline',
                                paddingTop: '4px',
                                paddingBottom: '4px',
                              }}
                            >
                              Update Credit Card
                            </NavLink>
                          </div>
                        )}
                      </span>
                      <table
                        className={
                          this.props.billingInfo.customerBillingId !==
                            undefined ||
                          this.props.setupBillingInfo.customerBillingId !==
                            undefined
                            ? 'show'
                            : 'hide'
                        }
                      >
                        <tbody>
                          <tr>
                            <th width="30%">Item</th>
                            <th width="70%">Value</th>
                          </tr>
                          {this.props.memberItem.values[
                            'Billing Setup Fee Id'
                          ] && (
                            <tr className="setupFee">
                              <td>Setup Fee ID:</td>
                              <td>
                                {
                                  this.props.memberItem.values[
                                    'Billing Setup Fee Id'
                                  ]
                                }
                              </td>
                            </tr>
                          )}
                          {this.props.memberItem.values[
                            'Billing Setup Fee Type'
                          ] && (
                            <tr className="setupFee">
                              <td>Setup Fee Type:</td>
                              <td>
                                {
                                  this.props.memberItem.values[
                                    'Billing Setup Fee Type'
                                  ]
                                }
                              </td>
                            </tr>
                          )}
                          {this.props.memberItem.values[
                            'Billing Setup Fee Id'
                          ] && (
                            <tr className="setupFee">
                              <td>Setup Billing Status:</td>
                              {getAttributeValue(
                                this.props.space,
                                'Billing Company',
                              ) === 'PaySmart' && (
                                <td>
                                  {this.props.setupBillingInfo.statusCode}-
                                  {
                                    this.props.setupBillingInfo
                                      .statusDescription
                                  }
                                </td>
                              )}
                              {getAttributeValue(
                                this.props.space,
                                'Billing Company',
                              ) !== 'PaySmart' && (
                                <td>
                                  {this.props.setupBillingInfo.statusCode}
                                </td>
                              )}
                            </tr>
                          )}
                          {this.props.memberItem.values[
                            'Billing Setup Fee Id'
                          ] &&
                            (this.props.setupBillingInfo.statusCode ===
                              'Active' ||
                              this.props.setupBillingInfo.statusCode ===
                                'Pending Freeze' ||
                              this.props.setupBillingInfo.statusCode ===
                                'Pending Cancellation' ||
                              this.props.setupBillingInfo.statusCode === '0') &&
                            this.props.setupBillingInfo.nextBillingDate && (
                              <tr className="setupFee">
                                <td>Setup Next Billing Date:</td>
                                <td>
                                  {typeof this.props.setupBillingInfo
                                    .nextBillingDate === 'string'
                                    ? moment(
                                        this.props.setupBillingInfo
                                          .nextBillingDate,
                                        'DD-MM-YYYY',
                                      ).format('L')
                                    : this.props.setupBillingInfo.nextBillingDate.format(
                                        'L',
                                      )}
                                </td>
                              </tr>
                            )}
                          {this.props.memberItem.values[
                            'Billing Setup Fee Id'
                          ] &&
                            (this.props.setupBillingInfo.statusCode ===
                              'Frozen' ||
                              this.props.setupBillingInfo.statusCode ===
                                '2') && (
                              <tr className="setupFee">
                                <td>Setup Next Billing Date:</td>
                                <td>
                                  {this.props.memberItem.values[
                                    'Resume Date'
                                  ] == null
                                    ? 'Until Further Notice'
                                    : this.props.memberItem.values[
                                        'Resume Date'
                                      ]}
                                </td>
                              </tr>
                            )}
                          {this.props.memberItem.values[
                            'Billing Setup Fee Id'
                          ] &&
                            this.props.setupBillingInfo
                              .paymentAmountInCents && (
                              <tr className="setupFee">
                                <td>Setup Payment Amount:</td>
                                <td>
                                  {new Intl.NumberFormat(this.props.locale, {
                                    style: 'currency',
                                    currency: this.props.currency,
                                  }).format(
                                    this.props.setupBillingInfo
                                      .paymentAmountInCents / 100,
                                  )}
                                </td>
                              </tr>
                            )}
                          {this.props.memberItem.values['useSubAccount'] ===
                            'YES' && (
                            <tr>
                              <td>Sub Account:</td>
                              <td>YES</td>
                            </tr>
                          )}
                          {getAttributeValue(
                            this.props.space,
                            'Billing Company',
                          ) === 'PaySmart' && (
                            <tr>
                              <td>DDR Status:</td>
                              <td>
                                {this.props.memberItem.values['DDR Status']}
                              </td>
                            </tr>
                          )}
                          {getAttributeValue(
                            this.props.space,
                            'Billing Company',
                          ) === 'PaySmart' && (
                            <tr>
                              <td>FFA ID:</td>
                              <td>{this.props.billingInfo.ffaid}</td>
                            </tr>
                          )}
                          <tr>
                            <td>Billing Reference ID:</td>
                            <td>{this.props.billingInfo.customerReference}</td>
                          </tr>
                          <tr>
                            <td>Billing Status:</td>
                            {getAttributeValue(
                              this.props.space,
                              'Billing Company',
                            ) === 'PaySmart' && (
                              <td>
                                {this.props.billingInfo.statusCode}-
                                {this.props.billingInfo.statusDescription}
                              </td>
                            )}
                            {getAttributeValue(
                              this.props.space,
                              'Billing Company',
                            ) !== 'PaySmart' && (
                              <td>{this.props.billingInfo.statusCode}</td>
                            )}
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
                          {(this.props.billingInfo.statusCode === 'Active' ||
                            this.props.billingInfo.statusCode ===
                              'Pending Freeze' ||
                            this.props.billingInfo.statusCode ===
                              'Pending Cancellation' ||
                            this.props.billingInfo.statusCode === '0') &&
                            this.props.billingInfo.nextBillingDate && (
                              <tr>
                                <td>Next Billing Date:</td>
                                <td>
                                  {typeof this.props.billingInfo
                                    .nextBillingDate === 'string'
                                    ? getAttributeValue(
                                        this.props.space,
                                        'Billing Company',
                                      ) === 'Bambora'
                                      ? moment(
                                          this.props.billingInfo
                                            .nextBillingDate,
                                          "YYYY-MM-DD'T'hh:mm:ss",
                                        ).format('L')
                                      : moment(
                                          this.props.billingInfo
                                            .nextBillingDate,
                                          'DD-MM-YYYY',
                                        ).format('L')
                                    : this.props.billingInfo.nextBillingDate.format(
                                        'L',
                                      )}
                                </td>
                              </tr>
                            )}
                          {(this.props.billingInfo.statusCode === 'Frozen' ||
                            this.props.billingInfo.statusCode === '2') && (
                            <tr>
                              <td>Next Billing Date:</td>
                              <td>
                                {this.props.memberItem.values['Resume Date'] ==
                                null
                                  ? 'Until Further Notice'
                                  : this.props.memberItem.values['Resume Date']}
                              </td>
                            </tr>
                          )}
                          {this.props.billingInfo.paymentAmountInCents && (
                            <tr>
                              <td>Payment Amount:</td>
                              <td>
                                {new Intl.NumberFormat(this.props.locale, {
                                  style: 'currency',
                                  currency: this.props.currency,
                                }).format(
                                  this.props.billingInfo.paymentAmountInCents /
                                    100,
                                )}
                              </td>
                            </tr>
                          )}
                          {getAttributeValue(
                            this.props.space,
                            'Billing Company',
                          ) === 'Bambora' &&
                            this.props.memberItem.values['POS Profile ID'] !==
                              undefined &&
                            this.props.memberItem.values['POS Profile ID'] !==
                              '' &&
                            this.props.memberItem.values['POS Profile ID'] !==
                              null &&
                            !this.props.posCardsLoading &&
                            this.props.posCards.length > 0 && (
                              <tr>
                                <td>Card on File:</td>
                                <td>
                                  <table>
                                    <tbody>
                                      <tr>
                                        <th width="300">Card ID</th>
                                        <th width="150">Number</th>
                                        <th>Expiry Month</th>
                                        <th>Year</th>
                                        <th>Type</th>
                                      </tr>
                                      <tr>
                                        <td>
                                          {
                                            this.props.memberItem.values[
                                              'POS Profile ID'
                                            ]
                                          }
                                        </td>
                                        <td>
                                          {this.props.posCards[0]['number']}
                                        </td>
                                        <td>
                                          {
                                            this.props.posCards[0][
                                              'expiryMonth'
                                            ]
                                          }
                                        </td>
                                        <td>
                                          {this.props.posCards[0]['expiryYear']}
                                        </td>
                                        <td>
                                          {this.props.posCards[0]['cardType']}
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            )}
                          {getAttributeValue(
                            this.props.space,
                            'Billing Company',
                          ) === 'Bambora' && (
                            <tr>
                              <td rowSpan="2">
                                <button
                                  type="button"
                                  className="btn btn-primary"
                                  onClick={e => {
                                    this.setState({
                                      capturePayment: !this.state
                                        .capturePayment,
                                    });
                                  }}
                                >
                                  {!this.state.capturePayment
                                    ? 'Capture Member Payment'
                                    : 'Close Member Payment'}
                                </button>
                              </td>
                            </tr>
                          )}
                          {getAttributeValue(
                            this.props.space,
                            'Billing Company',
                          ) === 'PaySmart' && (
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
                          )}
                        </tbody>
                      </table>
                      {this.state.capturePayment && (
                        <PayNow
                          locale={this.props.locale}
                          currency={this.props.currency}
                          total={this.state.total}
                          fetchPOSCards={this.props.fetchPOSCards}
                          posCardsLoading={this.props.posCardsLoading}
                          posCards={this.props.posCards}
                          addCashPaymentValue={this.props.addCashPaymentValue}
                          memberItem={this.props.memberItem}
                          space={this.props.space}
                          kapp={this.props.kapp}
                          spaceSlug={this.props.space.slug}
                          snippets={this.props.snippets}
                          addNotification={this.props.addNotification}
                          billingInfo={this.props.billingInfo}
                        />
                      )}
                    </span>
                  )}
                  <hr />
                  <span className="line">
                    <div style={{ width: '90vw', marginTop: '10px' }}>
                      {this.props.familyMembers.length > 0 && (
                        <FamilyFeeDetails
                          memberItem={this.props.memberItem}
                          currency={this.props.currency}
                          locale={this.props.locale}
                        />
                      )}
                    </div>
                  </span>
                </div>
              </span>
            )}
        </span>
        <div className="line">
          {true /*(this.props.memberItem.values['Billing Customer Id'] !==
            undefined &&
            this.props.memberItem.values['Billing Customer Id'] !== null &&
            this.props.memberItem.values['Billing Customer Id'] !== '') ||
            (this.props.memberItem.values['Billing Setup Fee Id'] !==
              undefined &&
              this.props.memberItem.values['Billing Setup Fee Id'] !== null &&
          this.props.memberItem.values['Billing Setup Fee Id'] !== '')*/ && (
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
          )}
          <span className="line">
            <div style={{ width: '90vw', marginTop: '10px' }}>
              {this.state.showPaymentHistory && (
                <PaymentHistory
                  getPaymentHistory={this.props.getPaymentHistory}
                  paymentHistory={this.props.paymentHistory}
                  paymentHistoryLoading={this.props.paymentHistoryLoading}
                  setupPaymentHistory={this.props.setupPaymentHistory}
                  setupPaymentHistoryLoading={
                    this.props.setupPaymentHistoryLoading
                  }
                  billingThis={this}
                  refundPayment={this.props.refundPayment}
                  refundTransactionInProgress={
                    this.props.refundTransactionInProgress
                  }
                  refundTransactionID={this.props.refundTransactionID}
                  memberItem={this.props.memberItem}
                  familyMembers={this.props.familyMembers}
                  currency={this.props.currency}
                  locale={this.props.locale}
                  space={this.props.space}
                  snippets={this.props.snippets}
                  memberCashPayments={this.props.memberCashPayments}
                  memberCashPaymentsLoading={
                    this.props.memberCashPaymentsLoading
                  }
                  membershipServices={this.props.membershipServices}
                  membershipServicesLoading={
                    this.props.membershipServicesLoading
                  }
                  cashRegistrations={this.props.cashRegistrations}
                  cashRegistrationsLoading={this.props.cashRegistrationsLoading}
                  sendReceipt={this.props.sendReceipt}
                  addNotification={this.props.addNotification}
                  setSystemError={this.props.setSystemError}
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
      </div>
    );
  }
}

export const Billing = ({
  memberItem,
  isDirty,
  setIsDirty,
  isRegistered,
  setIsRegistered,
  doRegistration,
  setDoRegistration,
  isAddMember,
  setIsAddMember,
  completeMemberBilling,
  currentMemberLoading,
  completeMemberRegistration,
  billingInfo,
  fetchBillingInfo,
  setBillingInfo,
  billingInfoLoading,
  setupBillingInfo,
  fetchSetupBillingInfo,
  setSetupBillingInfo,
  setupBillingInfoLoading,
  fetchBillingInfoAfterRegistration,
  fetchPOSCards,
  setPOSCards,
  posCards,
  posCardsLoading,
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
  setupPaymentHistory,
  setupPaymentHistoryLoading,
  billingDDRUrl,
  billingWidgetUrl,
  billingCompany,
  updatePaymentMethod,
  refundPayment,
  refundTransactionInProgress,
  refundTransactionID,
  doPaySmartRegistration,
  setDoPaySmartRegistration,
  ddrTemplates,
  actionRequests,
  actionRequestsLoading,
  getActionRequests,
  profile,
  space,
  snippets,
  currency,
  locale,
  addCashPaymentValue,
  memberCashPayments,
  memberCashPaymentsLoading,
  fetchMemberCashPayments,
  membershipServices,
  membershipServicesLoading,
  fetchBillingChangeByBillingReference,
  fetchCashRegistrations,
  cashRegistrations,
  cashRegistrationsLoading,
  sendReceipt,
  addNotification,
  setSystemError,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <div className="memberBillingDetails">
      <StatusMessagesContainer />
      <RecentNotificationsContainer />
      <div className="general">
        <div className="userDetails">
          {/*memberItem.values['Billing Customer Id'] !== null &&
            memberItem.values['Billing Customer Id'] !== undefined &&
            memberItem.values['Billing Customer Id'] !== ''*/ true && (
            <BillingInfo
              billingInfo={billingInfo}
              billingInfoLoading={billingInfoLoading}
              setupBillingInfo={setupBillingInfo}
              setupBillingInfoLoading={setupBillingInfoLoading}
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
              setupPaymentHistory={setupPaymentHistory}
              setupPaymentHistoryLoading={setupPaymentHistoryLoading}
              fetchPOSCards={fetchPOSCards}
              setPOSCards={setPOSCards}
              posCards={posCards}
              posCardsLoading={posCardsLoading}
              billingWidgetUrl={billingWidgetUrl}
              setIsAddMember={setIsAddMember}
              billingCompany={billingCompany}
              updateMember={updateMember}
              updatePaymentMethod={updatePaymentMethod}
              refundPayment={refundPayment}
              refundTransactionInProgress={refundTransactionInProgress}
              refundTransactionID={refundTransactionID}
              actionRequests={actionRequests}
              actionRequestsLoading={actionRequestsLoading}
              getActionRequests={getActionRequests}
              profile={profile}
              space={space}
              snippets={snippets}
              currency={currency}
              locale={locale}
              addCashPaymentValue={addCashPaymentValue}
              memberCashPayments={memberCashPayments}
              memberCashPaymentsLoading={memberCashPaymentsLoading}
              fetchMemberCashPayments={fetchMemberCashPayments}
              membershipServices={membershipServices}
              membershipServicesLoading={membershipServicesLoading}
              fetchBillingChangeByBillingReference={
                fetchBillingChangeByBillingReference
              }
              fetchCashRegistrations={fetchCashRegistrations}
              cashRegistrations={cashRegistrations}
              cashRegistrationsLoading={cashRegistrationsLoading}
              sendReceipt={sendReceipt}
              addNotification={addNotification}
              setSystemError={setSystemError}
            />
          )}
          {/*(memberItem.values['Billing Customer Id'] === null ||
            memberItem.values['Billing Customer Id'] === undefined ||
            memberItem.values['Billing Customer Id'] === '') && (
            <span>
              <h3>
                This Member is not synced with Billing or is not a Family Member
                of a Billing Member.
              </h3>
            </span>
          )*/}
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
      refundTransactionComplete,
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
  withState('lastHistoryDate', 'setLastHistoryDate', null),
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
      profile,
      fetchPaymentHistory,
      setPaymentHistory,
      setPaymentHistoryLoaded,
      addNotification,
      setSystemError,
      lastHistoryDate,
      setLastHistoryDate,
    }) => () => {
      if (
        memberItem.values['Billing Customer Id'] !== null &&
        memberItem.values['Billing Customer Id'] !== undefined &&
        memberItem.values['Billing Customer Id'] !== ''
      ) {
        fetchPaymentHistory({
          billingRef:
            memberItem.values['Billing Customer Id'] !== null &&
            memberItem.values['Billing Customer Id'] !== undefined &&
            memberItem.values['Billing Customer Id'] !== ''
              ? memberItem.values['Billing Customer Id']
              : memberItem.values['Member ID'],
          paymentType: 'ALL',
          paymentMethod: 'ALL',
          paymentSource: 'ALL',
          dateField: 'PAYMENT',
          dateFrom: moment
            .utc()
            .subtract(2, 'years')
            .format('YYYY-MM-DD'),
          dateTo: moment
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD'),
          history: memberItem.myThis.props.history,
          setPaymentHistory: memberItem.myThis.props.setPaymentHistory,
          internalPaymentType: 'customer',
          addNotification: addNotification,
          setSystemError: setSystemError,
          timezone: getTimezone(profile.timezone, space.defaultTimezone),
          useSubAccount:
            memberItem.values['useSubAccount'] === 'YES' ||
            (getAttributeValue(space, 'Billing Company') === 'Bambora' &&
              getAttributeValue(space, 'PaySmart SubAccount') === 'YES')
              ? true
              : false,
        });
      } else {
        setPaymentHistoryLoaded({
          setPaymentHistory: memberItem.myThis.props.setPaymentHistory,
          data: [],
          paymentType: 'ALL',
        });
      }
      if (
        memberItem.values['Billing Setup Fee Id'] !== null &&
        memberItem.values['Billing Setup Fee Id'] !== undefined &&
        memberItem.values['Billing Setup Fee Id'] !== ''
      ) {
        fetchPaymentHistory({
          billingRef:
            memberItem.values['Billing Setup Fee Id'] !== null &&
            memberItem.values['Billing Setup Fee Id'] !== undefined &&
            memberItem.values['Billing Setup Fee Id'] !== ''
              ? memberItem.values['Billing Setup Fee Id']
              : memberItem.values['Member ID'],
          paymentType: 'SETUP',
          paymentMethod: 'ALL',
          paymentSource: 'ALL',
          dateField: 'PAYMENT',
          dateFrom: moment
            .utc()
            .subtract(2, 'years')
            .format('YYYY-MM-DD'),
          dateTo: moment
            .utc()
            .add(1, 'days')
            .format('YYYY-MM-DD'),
          history: memberItem.myThis.props.history,
          setPaymentHistory: memberItem.myThis.props.setPaymentHistory,
          internalPaymentType: 'customer',
          addNotification: addNotification,
          setSystemError: setSystemError,
          timezone: getTimezone(profile.timezone, space.defaultTimezone),
          useSubAccount:
            memberItem.values['useSubAccount'] === 'YES' ? true : false,
        });
      } else {
        setPaymentHistoryLoaded({
          setPaymentHistory: memberItem.myThis.props.setPaymentHistory,
          data: [],
          paymentType: 'SETUP',
        });
      }
      //      setLastHistoryDate(lastHistoryDate===null ? moment.utc() : lastHistoryDate.utc().subtract(1, 'years'));
    },
    addCashPaymentValue: ({
      addCashPayment,
      addNotification,
      setSystemError,
    }) => (
      values,
      completeCashPayment,
      nextBillingDate,
      memberItem,
      updateMember,
    ) => {
      let args = {};
      args.values = values;
      args.completeCashPayment = completeCashPayment;
      args.nextBillingDate = nextBillingDate;
      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;

      addCashPayment(args);
    },
    refundPayment: ({
      memberItem,
      refundTransaction,
      refundTransactionComplete,
      updateMember,
      fetchCurrentMember,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => (billingThis, paymentId, paymentAmount, billingChangeReason) => {
      console.log('### paymentId = ' + paymentId);
      let args = {};
      args.transactionId = paymentId;
      args.refundAmount = paymentAmount;
      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.fetchCurrentMember = fetchCurrentMember;
      args.myThis = memberItem.myThis;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;
      args.billingThis = billingThis;
      args.refundTransactionComplete = refundTransactionComplete;
      args.useSubAccount =
        memberItem.values['useSubAccount'] === 'YES' ? true : false;

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
    updateBamboraBillingInfo: ({
      memberItem,
      updateMember,
      addNotification,
      setSystemError,
    }) => data => {
      if (
        memberItem.values['Billing Start Date'] !==
        moment(data.nextBillingDate).format('YYYY-MM-DD')
      ) {
        //alert("Need to Update Member Billing Start Date");
      }
      console.log(data);
    },
  }),
  lifecycle({
    constructor() {},
    componentDidUpdate() {},
    UNSAFE_componentWillMount() {
      var member = undefined;
      for (var j = 0; j < this.props.members.length; j++) {
        if (this.props.members[j]['id'] === this.props.match.params['id']) {
          member = this.props.members[j];
          break;
        }
      }
      if (member === undefined) {
        this.props.history.push(
          '/kapps/gbmembers/Member/' + this.props.match.params['id'],
        );
      } else {
        if (
          getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
        ) {
          if (
            member.values['POS Profile ID'] !== undefined &&
            member.values['POS Profile ID'] !== null &&
            member.values['POS Profile ID'] !== ''
          ) {
            this.props.fetchPOSCards({
              profileId: member.values['POS Profile ID'],
              setPOSCards: this.props.setPOSCards,
            });
          } else {
            this.props.clearPOSCards();
          }
        }
        if (
          member.values['Billing Customer Reference'] !== undefined &&
          member.values['Billing Customer Reference'] !== null &&
          member.values['Billing Customer Reference'] !== ''
        ) {
          this.props.fetchBillingInfo({
            billingRef: member.values['Billing Customer Reference'],
            history: this.props.history,
            myThis: this,
            setBillingInfo: this.props.setBillingInfo,
            updateBillingInfo:
              getAttributeValue(this.props.space, 'Billing Company') ===
              'Bambora'
                ? this.props.updateBamboraBillingInfo
                : undefined,
            addNotification: this.props.addNotification,
            setSystemError: this.props.setSystemError,
            useSubAccount:
              member.values['useSubAccount'] === 'YES' ? true : false,
          });
        }
        if (
          member.values['Billing Setup Fee Id'] !== undefined &&
          member.values['Billing Setup Fee Id'] !== null &&
          member.values['Billing Setup Fee Id'] !== ''
        ) {
          this.props.fetchSetupBillingInfo({
            billingRef: member.values['Billing Setup Fee Id'],
            history: this.props.history,
            myThis: this,
            setBillingInfo: this.props.setSetupBillingInfo,
            addNotification: this.props.addNotification,
            setSystemError: this.props.setSystemError,
            useSubAccount:
              member.values['useSubAccount'] === 'YES' ? true : false,
          });
        }
        this.props.fetchCurrentMember({
          id: this.props.match.params['id'],
          myThis: this,
          forBilling: true,
          billingService: getAttributeValue(
            this.props.space,
            'Billing Company',
          ),
          allMembers: this.props.allMembers,
        });
      }

      this.props.fetchFamilyMembers({
        currentMember: this.props.memberItem,
        allMembers: this.props.allMembers,
        setFamilyMembers: this.props.setFamilyMembers,
      });

      let currency = getAttributeValue(this.props.space, 'Currency');
      if (currency === undefined) currency = 'USD';

      this.locale =
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale;

      this.setState({
        currency: currency,
        locale: this.locale,
      });
    },

    UNSAFE_componentWillReceiveProps(nextProps) {
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
          this.props.history.push(
            '/kapps/gbmembers/Member/' + this.props.match.params['id'],
          );
        } else {
          this.props.fetchBillingInfo({
            billingRef: member.values['Billing Customer Id'],
            history: this.props.history,
            myThis: this,
            setBillingInfo: this.props.setBillingInfo,
            addNotification: this.props.addNotification,
            setSystemError: this.props.setSystemError,
          });
          if (
            member.values['Billing Setup Fee Id'] !== undefined &&
            member.values['Billing Setup Fee Id'] !== null &&
            member.values['Billing Setup Fee Id'] !== ''
          ) {
            this.props.fetchSetupBillingInfo({
              billingRef: member.values['Billing Setup Fee Id'],
              history: this.props.history,
              myThis: this,
              setBillingInfo: this.props.setSetupBillingInfo,
              addNotification: this.props.addNotification,
              setSystemError: this.props.setSystemError,
            });
          }
          this.props.fetchCurrentMember({
            id: this.props.match.params['id'],
            myThis: this,
            billingService: getAttributeValue(
              this.props.space,
              'Billing Company',
            ),
            allMembers: this.props.allMembers,
          });
        }
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
    },
    componentWillUnmount() {},
  }),
)(Billing);

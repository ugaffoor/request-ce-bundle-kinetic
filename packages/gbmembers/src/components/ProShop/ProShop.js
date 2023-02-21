import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/pos';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { Utils } from 'common';
import SVGInline from 'react-svg-inline';
import apparelIcon from '../../images/apparel.svg?raw';
import starIcon from '../../images/star.svg?raw';
import addIcon from '../../images/add.png?raw';
import privateClassesIcon from '../../images/Privateclasses.svg?raw';
import pairingIcon from '../../images/pos_pairing.svg?raw';
import promoIcon from '../../images/Promo.svg?raw';
import eventIcon from '../../images/Events.svg?raw';
import binIcon from '../../images/bin.svg?raw';
import checkoutIcon from '../../images/checkout.png?raw';
import checkoutLeftArrowIcon from '../../images/checkoutLeftArrow.png?raw';
import discountIcon from '../../images/discount.png?raw';
import checkoutRightArrowIcon from '../../images/checkoutRightArrow.png?raw';
import editIcon from '../../images/pencil.png';
import settingsIcon from '../../images/Settings.svg?raw';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { AddProductToCheckoutDialogContainer } from './AddProductToCheckoutDialog';
import { EditProductDialogContainer } from './EditProductDialog';
import { AddProductDialogContainer } from './AddProductDialog';
import { RecordStockDialogContainer } from './RecordStockDialog';
import { AddDiscountDialogContainer } from './AddDiscountDialog';
import { confirm } from '../helpers/Confirmation';
import Select from 'react-select';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as memberActions } from '../../redux/modules/members';
import axios from 'axios';
import Cards from 'react-credit-cards';
import ScaleLoader from 'react-spinners/ScaleLoader';
import printerIcon from '../../images/Print.svg?raw';
import ReactToPrint from 'react-to-print';
import NumberFormat from 'react-number-format';
import uuid from 'uuid';
import moment from 'moment';
import { ReceiptToPrint } from './ReceiptToPrint';
import Helmet from 'react-helmet';
import { I18n } from '../../../../app/src/I18nProvider';
import { actions as appActions } from '../../redux/modules/memberApp';
import BarcodeReader from 'react-barcode-reader';
import barcodeIcon from '../../images/barcode.svg?raw';
import { SettingsContainer } from './Settings';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
  confirmCardPayment,
} from '@stripe/react-stripe-js';
import { loadStripeTerminal } from '@stripe/terminal-js/pure';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  allLeads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  posAutoCreateCardProcessing: state.member.pos.posAutoCreateCardProcessing,
  posCards: state.member.pos.posCards,
  posCardsLoading: state.member.pos.posCardsLoading,
  posCategories: state.member.pos.posCategories,
  posCategoriesLoading: state.member.pos.posCategoriesLoading,
  posProducts: state.member.pos.posProducts,
  posProductsLoading: state.member.pos.posProductsLoading,
  posStock: state.member.pos.posStock,
  posBarcodes: state.member.pos.posBarcodes,
  posBarcodesLoading: state.member.pos.posBarcodesLoading,
  posDiscounts: state.member.pos.posDiscounts,
  posDiscountsLoading: state.member.pos.posDiscountsLoading,
  profile: state.member.app.profile,
  space: state.member.app.space,
  spaceSlug: state.member.app.spaceSlug,
  posCheckout: state.member.pos.posCheckout,
  posCheckoutLoading: state.member.pos.posCheckoutLoading,
  posStockSaving: state.member.pos.posStockSaving,
  kapp: state.member.app.kapp,
  snippets: state.member.app.snippets,
  SUCCESSFULpaymentHistory: state.member.members.SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading:
    state.member.members.SUCCESSFULpaymentHistoryLoading,
});

const mapDispatchToProps = {
  autoCreateCard: actions.autoCreateCard,
  setCreateCard: actions.setCreateCard,
  fetchPOSCards: actions.fetchPOSCards,
  setPOSCards: actions.setPOSCards,
  fetchPOSCategories: actions.fetchPOSCategories,
  fetchPOSProducts: actions.fetchPOSProducts,
  fetchPOSBarcodes: actions.fetchPOSBarcodes,
  fetchPOSDiscounts: actions.fetchPOSDiscounts,
  fetchPOSCheckout: actions.fetchPOSCheckout,
  updatePOSCheckout: actions.updatePOSCheckout,
  savePOSCheckout: actions.savePOSCheckout,
  savePOSSavePurchasedItem: actions.savePOSSavePurchasedItem,
  decrementPOSStock: actions.decrementPOSStock,
  fetchLeads: leadsActions.fetchLeads,
  savePOSStock: actions.savePOSStock,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  updateMember: memberActions.updateMember,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchPaymentHistory: memberActions.fetchPaymentHistory,
  setPaymentHistory: memberActions.setPaymentHistory,
};
var StripeTerminal = undefined;
var terminal = undefined;
var discoveredReaders;
var paymentIntentId;

var posThis = undefined;
var verifyDeviceCount = 0;
var updatingCard = false;

const StripePaymentCapture = () => {
  const stripe = useStripe();
  const elements = useElements();
  return (
    <CardElement
      onReady={e => {
        $('.__PrivateStripeElement iframe').css('width', '400px');
      }}
      onChange={e => {
        console.log('Complete:' + e.complete);
        if (e.complete) {
          posThis.setState({
            processing: false,
            cvc: 'NA',
            expiry: 'NA',
            number: 'NA',
            stripe: stripe,
            stripeElements: elements,
          });
        }
      }}
      options={{
        hidePostalCode: true,
        style: {
          base: {
            fontSize: '16px',
            color: '#424770',
            '::placeholder': {
              color: '#aab7c4',
            },
          },
          invalid: {
            color: '#9e2146',
          },
        },
      }}
    />
  );
};
class PayNow extends Component {
  constructor(props) {
    super(props);
    posThis = this;
    this.processPayment = this.processPayment.bind(this);
    //    this.saveCardForLater = this.saveCardForLater.bind(this);

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
    var subtotal = 0;
    var discount = 0;
    var total = 0;
    if (this.props.posCheckout['Checkout Items']['products'] !== undefined) {
      this.props.posCheckout['Checkout Items']['products'].forEach(
        (product, i) => {
          subtotal =
            subtotal +
            parseFloat(product['price'], 2) * parseInt(product['quantity']);
          total = subtotal;
        },
      );
    }

    if (
      this.props.posCheckout['Checkout Items']['discountName'] !== undefined &&
      this.props.posCheckout['Checkout Items']['voucher'] === undefined
    ) {
      discount = parseFloat(
        this.props.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        this.props.posCheckout['Checkout Items']['discountType'] ===
        'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    } else if (
      this.props.posCheckout['Checkout Items']['discountName'] !== undefined &&
      this.props.posCheckout['Checkout Items']['voucher'] !== undefined
    ) {
      discount = parseFloat(
        this.props.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        this.props.posCheckout['Checkout Items']['discountType'] ===
        'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    }
    if (this.props.salestax !== 0) {
      total = parseFloat((total + this.props.salestax).toFixed(2));
    }

    total = parseFloat(total.toFixed(2));

    this.state = {
      total: total,
      personType: 'Member',
      personID: undefined,
      pickUp: undefined,
      payment: undefined,
      cvc: '',
      expiry: '',
      focus: '',
      name: '',
      number: '',
      processing: false,
      processingComplete: false,
      issuer: '',
      maxLength: 16,
      status: '',
      errors: '',
      acceptedCards: getAttributeValue(this.props.space, 'POS Accepted Cards'),
      myExternalLib: null,
      country: getAttributeValue(this.props.space, 'School Country Code'),
      deviceStatus: 'UNPAIRED',
      status_message: undefined,
    };
    updatingCard = false;
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
  componentWillReceiveProps(nextProps) {
    if (!nextProps.posCardsLoading && this.state.payment === undefined) {
      this.setState({
        payment: 'useSavedCreditCard',
      });
    }
  }
  componentWillMount() {
    if (this.props.allLeads.length === 0) {
      this.props.fetchLeads();
    }
  }
  getAllMembers() {
    let membersVals = [];
    this.props.allMembers.forEach(member => {
      if (member.values['Lead State'] !== 'Open') {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals;
  }
  getAllLeads() {
    let ignoreStatusValues = getAttributeValue(
      this.props.kapp,
      'Ignore Lead Status Values',
    );
    let leadsVals = [];
    this.props.allLeads.forEach(lead => {
      if (
        ignoreStatusValues === undefined ||
        ignoreStatusValues.indexOf(lead.values['Status']) === -1
      ) {
        leadsVals.push({
          label: lead.values['Last Name'] + ' ' + lead.values['First Name'],
          value: lead.id,
        });
      }
    });
    return leadsVals;
  }
  handleInputFocus = e => {
    this.setState({ focus: e.target.name });
  };

  handleInputChange = e => {
    const { name, value } = e.target;

    this.setState({ [name]: value });
  };
  disablePayNow() {
    var disable = false;
    if (this.state.processing) {
      return true;
    }
    if (this.state.personID === undefined) {
      disable = true;
    }
    //    if (this.state.pickUp===undefined) {
    //      disable = true;
    //    }
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
  disablePaymentType() {
    var disable = true;
    if (this.state.personID !== undefined) {
      disable = false;
    }
    if (this.state.total === 0) {
      disable = true;
    }
    return disable;
  }
  disableCashPaymentType() {
    var disable = true;
    if (this.state.personID !== undefined) {
      disable = false;
    }
    return disable;
  }
  completeCheckout() {
    this.props.completePOSCheckout(
      this.state.personType,
      this.state.personID,
      this.state.firstName,
      this.state.lastName,
      this.state.payment,
      this.state.datetime,
      this.state.auth_code,
      this.state.transaction_id,
      this.state.number,
      this.props.subtotal,
      this.props.discount,
      this.props.salestax,
      this.props.total,
    );
  }
  saveCardForLater = async () => {
    var posSystem = getAttributeValue(this.props.space, 'POS System');
    var posServiceURL = getAttributeValue(this.props.space, 'POS Service URL');

    var data = JSON.stringify({
      space: this.props.spaceSlug,
      billingService: posSystem,
      token: this.state.cardToken,
      country: getAttributeValue(this.props.space, 'School Country Code'),
      name: this.state.firstName + ' ' + this.state.lastName,
      address: this.state.address,
      city: this.state.city,
      province: this.state.province,
      postalCode: this.state.postCode,
      email: this.state.email,
    });

    var config = {
      method: 'post',
      url: posServiceURL.replace('processPOS', 'createProfileCard'),
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    await axios(config)
      .then(function(response) {
        var data = JSON.parse(response.data.data);
        if (data.status === 1) {
          posThis.setState({
            profileId: data.profileId,
          });
          posThis.props.updateMemberItem(
            posThis.state.personID,
            data.profileId,
          );
          var saveButton = document.getElementById('save-to-profile');
          saveButton.disabled = true;
          $(saveButton).addClass('disabled');
          $(saveButton).html('Saved');
        } else {
          posThis.setState({
            status: data.status,
            status_message: data.status_message,
            errors: data.status_message,
            auth_code: '',
            transaction_id: '',
            processingComplete: true,
            processing: false,
            datetime: moment(),
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
        posThis.setState({
          status: '10',
          status_message: 'System Error',
          errors: error,
          auth_code: '',
          transaction_id: '',
          processingComplete: true,
          processing: false,
          datetime: moment(),
        });
        console.log(error);
      });
  };
  updateProfileCard = async (
    posServiceURL,
    spaceSlug,
    posSystem,
    profileId,
    result,
    name,
  ) => {
    if (posThis.state.cardToken === result['token']) return;
    var data = JSON.stringify({
      space: spaceSlug,
      billingService: posSystem,
      profileId: profileId,
      token: result['token'],
      name: name,
      cardId: '1',
    });

    var config = {
      method: 'post',
      url: posServiceURL.replace('processPOS', 'updateProfileCard'),
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    await axios(config)
      .then(function(response) {
        var data = JSON.parse(response.data.data);
        if (data.status === 1) {
          posThis.setState({
            cardToken: result['token'],
            cvc: 'XXX',
            expiry: result['expiryMonth'] + '/' + result['expiryYear'],
            number: result['last4'],
            name: posThis.state.name,
          });
          updatingCard = false;
          posThis.props.fetchPOSCards({
            profileId: profileId,
            setPOSCards: posThis.props.setPOSCards,
          });
        } else {
          posThis.setState({
            status: data.status,
            status_message: data.status_message,
            errors: data.status_message,
            auth_code: '',
            transaction_id: '',
            processingComplete: true,
            processing: false,
            datetime: moment(),
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
        posThis.setState({
          status: '10',
          status_message: 'System Error',
          errors: error,
          auth_code: '',
          transaction_id: '',
          processingComplete: true,
          processing: false,
          datetime: moment(),
        });
        updatingCard = false;
        console.log(error);
      });
  };
  deleteCardProfile = async (
    posServiceURL,
    spaceSlug,
    posSystem,
    profileId,
  ) => {
    var data = JSON.stringify({
      space: spaceSlug,
      billingService: posSystem,
      profileId: profileId,
    });

    var config = {
      method: 'post',
      url: posServiceURL.replace('processPOS', 'deleteProfile'),
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    await axios(config)
      .then(function(response) {
        var data = JSON.parse(response.data.data);
        if (data.status === '1') {
          posThis.setState({
            posProfileID: undefined,
          });
          posThis.props.updateMemberItem(posThis.state.personID, '');
        } else {
          posThis.setState({
            status: data.status,
            status_message: data.status_message,
            errors: data.status_message,
            auth_code: '',
            transaction_id: '',
            processingComplete: true,
            processing: false,
            datetime: moment(),
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
        posThis.setState({
          status: '10',
          status_message: 'System Error',
          errors: error,
          auth_code: '',
          transaction_id: '',
          processingComplete: true,
          processing: false,
          datetime: moment(),
        });
        console.log(error);
      });
  };
  fetchPaymentIntentClientSecret = async (
    posServiceURL,
    spaceSlug,
    posSystem,
    currency,
    amount,
    email,
  ) => {
    var clientSecret = 'NOT_FOUND';
    var data = JSON.stringify({
      space: spaceSlug,
      billingService: posSystem,
      type: 'payment',
      currency: currency,
      amount: amount,
      email: email,
    });

    var config = {
      method: 'post',
      url: posServiceURL.replace('processPOS', 'fetchPaymentIntent'),
      headers: {
        'Content-Type': 'application/json',
      },
      data: data,
    };
    await axios(config)
      .then(function(response) {
        clientSecret = response.data.data.clientSecret;
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
        posThis.setState({
          status: '10',
          status_message: 'System Error',
          errors: error,
          auth_code: '',
          transaction_id: '',
          processingComplete: true,
          processing: false,
          datetime: moment(),
        });
        console.log(error);
        clientSecret = 'ERROR';
      });
    return clientSecret;
  };
  processStripePayment = async (
    posServiceURL,
    spaceSlug,
    posSystem,
    schoolName,
    uuid,
    posThis,
  ) => {
    console.log('processStripePayment');
    // Fetch the intent client secret from the backend
    const clientSecret = await this.fetchPaymentIntentClientSecret(
      posServiceURL,
      spaceSlug,
      posSystem,
      posThis.props.currency,
      posThis.state.total,
      posThis.state.email,
    );

    if (clientSecret === 'NOT_FOUND') {
      posThis.setState({
        status: '10',
        status_message: 'System Error',
        errors: 'Client not obtained',
        auth_code: '',
        transaction_id: '',
        processingComplete: true,
        processing: false,
        datetime: moment(),
      });
      return;
    }

    const payload = await posThis.state.stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: posThis.state.stripeElements.getElement(CardElement),
          billing_details: {
            name: posThis.state.firstName + ' ' + posThis.state.lastName,
          },
        },
      },
    );

    if (payload.error) {
      posThis.setState({
        status: '10',
        status_message: payload.error.message,
        errors: payload.error.message,
        auth_code: payload.error.code,
        transaction_id: '',
        processingComplete: true,
        processing: false,
        datetime: moment(),
      });
    } else {
      posThis.setState({
        status: '1',
        status_message: payload.paymentIntent.status,
        errors: '',
        auth_code: '',
        transaction_id: payload.paymentIntent.id,
        processingComplete: true,
        processing: false,
        datetime: moment(),
      });

      posThis.completeCheckout();
    }
  };
  processBamboraPayment(
    posServiceURL,
    spaceSlug,
    posSystem,
    schoolName,
    uuid,
    posThis,
  ) {
    var data = JSON.stringify({
      space: spaceSlug,
      billingService: posSystem,
      issuer: this.state.issuer,
      customerId: 'dummy',
      payment: this.state.total,
      orderId: uuid,
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
      description: schoolName + ' POS',
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
        posThis.setState({
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
          posThis.completeCheckout();
        } else {
          posThis.setState({
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
        posThis.setState({
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

  processPayment() {
    var posSystem = getAttributeValue(this.props.space, 'POS System');
    var posServiceURL = getAttributeValue(this.props.space, 'POS Service URL');
    var schoolName = getAttributeValue(this.props.space, 'School Name');
    if (posSystem === 'Bambora') {
      this.processBamboraPayment(
        posServiceURL,
        this.props.spaceSlug,
        posSystem,
        schoolName,
        uuid(),
        this,
      );
    } else if (posSystem === 'Stripe') {
      this.processStripePayment(
        posServiceURL,
        this.props.spaceSlug,
        posSystem,
        schoolName,
        uuid(),
        this,
      );
    }
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
          "<div class='col-xs-2 text-center'><button id='pay-button' type='submit' class='verifyBtn btn-primary disabled' disabled='true'>Verify</button></div>",
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
        // listen for submit button
        //        document
        //          .getElementById('save-to-profile')
        //          .addEventListener('click', payThis.saveCardForLater);
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
              if (!updatingCard) {
                updatingCard = true;
                payThis.updateProfileCard(
                  posServiceURL,
                  payThis.props.spaceSlug,
                  posSystem,
                  payThis.state.posProfileID,
                  result,
                  payThis.state.name,
                );
              }
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
        /*        if (
          (payThis.state.posProfileID === undefined ||
            payThis.state.posProfileID === null) &&
          payThis.state.personType === 'Member' &&
          payThis.state.payment !== 'updateCreditCard'
        ) {
          var saveButton = document.getElementById('save-to-profile');
          saveButton.disabled = false;
          $(saveButton).removeClass('disabled');
        } else {
          var saveButton = document.getElementById('save-to-profile');
          saveButton.disabled = true;
          $(saveButton).addClass('disabled');
        } */
        payThis.setState({
          status: '',
        });
      },
    };
    customCheckoutController.init();
  }
  createDeviceID() {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'createDeviceID');
    var args = {
      space: this.props.space.slug,
      billingService: getAttributeValue(this.props.space, 'POS System'),
    };
    axios
      .post(url, args)
      .then(result => {
        var data = result.data.data;
        if (data.error === 100) {
          this.setState({
            deviceStatus: 'ERROR',
            status_message: result.data.errorMessage,
          });
        } else {
          this.setState({
            squareDevice: data.id,
            terminalCode: data.code,
            deviceStatus: data.status,
            status_message: undefined,
          });
          verifyDeviceCount = 0;
          this.verifyDevice(this.state.squareDevice);
        }
      })
      .catch(error => {
        console.log(error.response);
      });
  }
  verifyDevice(deviceID) {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'verifyDevice');
    var args = {
      space: this.props.space.slug,
      billingService: getAttributeValue(this.props.space, 'POS System'),
      deviceId: deviceID,
      verifyDeviceCount: verifyDeviceCount,
    };
    axios
      .post(url, args)
      .then(result => {
        var data = result.data.data;
        this.setState({
          squareDevice: data.id,
          terminalCode: data.code,
          deviceStatus: data.status,
        });
        if ($('.paynow').length > 0 && this.state.deviceStatus !== 'PAIRED') {
          var myThis = this;
          verifyDeviceCount = verifyDeviceCount + 1;
          setTimeout(function() {
            myThis.verifyDevice(myThis.state.squareDevice);
          }, 1000);
        } else if (this.state.deviceStatus === 'PAIRED') {
          this.processSquareCheckout();
        }
      })
      .catch(error => {
        console.log(error.response);
      });
  }
  checkTerminalCheckout() {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'checkTerminalCheckout');
    var args = {
      space: this.props.space.slug,
      billingService: getAttributeValue(this.props.space, 'POS System'),
      checkoutId: this.state.squareCheckoutId,
      checkCount: verifyDeviceCount,
    };
    axios
      .post(url, args)
      .then(result => {
        var data = result.data.data;
        this.setState({
          squareCheckoutStatus: data.status,
        });
        if (
          $('.paynow').length > 0 &&
          (this.state.squareCheckoutStatus === 'PENDING' ||
            this.state.squareCheckoutStatus === 'IN_PROGRESS')
        ) {
          var myThis = this;
          verifyDeviceCount = verifyDeviceCount + 1;
          setTimeout(function() {
            myThis.checkTerminalCheckout();
          }, 1000);
        }
        if (
          $('.paynow').length > 0 &&
          this.state.squareCheckoutStatus === 'COMPLETED'
        ) {
          this.setState({
            processingComplete: true,
            currency: this.props.currency,
            auth_code: '',
            number: '',
            transaction_id: data.id,
            name: this.state.firstName + ' ' + this.state.lastName,
            datetime: moment(),
          });
          this.completeCheckout();
        }
        if (
          $('.paynow').length > 0 &&
          this.state.squareCheckoutStatus === 'CANCELED'
        ) {
          this.setState({
            processingComplete: true,
            currency: this.props.currency,
            auth_code: '',
            number: '',
            transaction_id: data.id,
            name: this.state.firstName + ' ' + this.state.lastName,
            datetime: moment(),
          });
          //this.completeCheckout();
        }
      })
      .catch(error => {
        console.log(error.response);
      });
  }
  processSquareCheckout() {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    var schoolName = getAttributeValue(this.props.space, 'School Name');
    url = url.replace('processPOS', 'terminalCheckout');
    var args = {
      space: this.props.space.slug,
      billingService: getAttributeValue(this.props.space, 'POS System'),
      deviceId: this.state.squareDevice,
      amount: this.state.total,
      currency: this.props.currency,
      note: schoolName + ' sale',
      referenceId: this.props.posCheckout.id,
    };
    axios
      .post(url, args)
      .then(result => {
        var data = result.data.data;
        if (result.data.error === 100) {
          this.setState({
            squareCheckoutStatus: result.data.error,
            deviceStatus: 'ERROR',
            status_message: result.data.errorMessage,
          });
        } else {
          this.setState({
            squareCheckoutId: data.id,
            squareCheckoutStatus: data.status,
            deviceStatus: 'CHECKOUT',
            processingComplete: false,
          });
          verifyDeviceCount = 0;
          this.checkTerminalCheckout();
        }
      })
      .catch(error => {
        console.log(error.response);
      });
  }

  unexpectedDisconnect() {
    // In this function, your app should notify the user that the reader disconnected.
    // You can also include a way to attempt to reconnect to a reader.
    console.log('Disconnected from reader');
    posThis.setState({
      deviceStatus: 'ERROR',
    });
  }
  stripeTerminalCancelCapture() {
    terminal.cancelCollectPaymentMethod().then(function(result) {
      console.log('Canceled Capture');
      posThis.setState({
        status: '',
        status_message: undefined,
        paymentIntentId: undefined,
      });
    });
  }
  fetchStripeTerminalPaymentIntentClientSecret(amount) {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'terminalCheckout');
    var args = {
      space: this.props.space.slug,
      billingService: 'Stripe',
      amount: amount,
      currency: this.props.currency,
      deviceId: 'dummy',
      note: 'dummy',
      referenceId: 'dummy',
      receiptEmail: this.state.email,
    };
    const bodyContent = JSON.stringify(args);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyContent,
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        if (data.error === 100) {
          posThis.setState({
            status: '0',
            deviceStatus: 'ERROR',
            status_message: data.errorMessage,
          });
          return null;
        } else {
          data = JSON.parse(data.data);
          posThis.setState({
            paymentIntentId: data.paymentIntentId,
          });
          return data.client_secret;
        }
      });
  }
  stripeTerminalCapture(paymentIntentId) {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'checkTerminalCheckout');
    var args = {
      space: this.props.space.slug,
      billingService: 'Stripe',
      checkoutId: paymentIntentId,
      checkCount: 1,
    };
    const bodyContent = JSON.stringify(args);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyContent,
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log('server.capture', data);
        if (data.error === 100) {
          posThis.setState({
            status: '0',
            deviceStatus: 'ERROR',
            status_message: data.errorMessage,
          });
          return null;
        } else {
          data = JSON.parse(data.data);

          posThis.setState({
            processing: false,
            processingComplete: true,
            status: '1',
            errors: '',
            auth_code: '',
            transaction_id: data.id,
            datetime: moment(),
          });
          posThis.completeCheckout();
        }
      });
  }

  stripeTerminalCollectPayment() {
    console.log('In collectPayment.');
    posThis
      .fetchStripeTerminalPaymentIntentClientSecret(
        Math.round(posThis.state.total * 100),
      )
      .then(function(client_secret) {
        terminal.setSimulatorConfiguration({
          testCardNumber: '4242424242424242',
        });
        //        terminal.setSimulatorConfiguration({testCardNumber: '4000000000000002'}); // charge_declined
        //        terminal.setSimulatorConfiguration({testCardNumber: '4000000000009995'}); // charge_declined_insufficient_funds
        //        terminal.setSimulatorConfiguration({testCardNumber: '4001007020000002'}); // offline_pin_cvm

        terminal
          .collectPaymentMethod(client_secret, {
            stripeAccount: getAttributeValue(
              posThis.props.space,
              'Stripe Account ID',
            ),
          })
          .then(function(result) {
            if (result.error) {
              posThis.setState({
                status: '0',
                deviceStatus: 'ERROR',
                status_message: result.error.message,
              });
            } else {
              console.log(
                'terminal.collectPaymentMethod',
                result.paymentIntent,
              );
              terminal
                .processPayment(result.paymentIntent)
                .then(function(result) {
                  if (result.error) {
                    console.log(result.error);
                    posThis.setState({
                      status: '0',
                      deviceStatus: 'ERROR',
                      status_message: result.error.message,
                    });
                  } else if (result.paymentIntent) {
                    paymentIntentId = result.paymentIntent.id;
                    console.log(
                      'terminal.processPayment',
                      result.paymentIntent,
                    );
                    posThis.stripeTerminalCapture(paymentIntentId);
                  }
                });
            }
          });
      });
  }
  stripeTerminalCreateReaderLocationHandler() {
    var url = getAttributeValue(this.props.space, 'POS Service URL');
    url = url.replace('processPOS', 'createDeviceID');
    var schoolAddress = getAttributeValue(this.props.space, 'School Address');
    var addressInfo = schoolAddress.split(',');

    var args = {
      space: this.props.space.slug,
      billingService: 'Stripe',
      deviceId: this.state.stripeTerminalCode,
      name: getAttributeValue(this.props.space, 'School Name'),
      address: addressInfo.length > 0 ? addressInfo[0].trim() : 'unknown',
      city: getAttributeValue(this.props.space, 'School City'),
      postcode: getAttributeValue(this.props.space, 'School Postcode'),
      country: getAttributeValue(this.props.space, 'School Country Code'),
    };
    const bodyContent = JSON.stringify(args);
    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: bodyContent,
    })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        console.log('server.capture', data);
        if (data.error === 100) {
          posThis.setState({
            status: '0',
            deviceStatus: 'ERROR',
            status_message: data.errorMessage,
          });
          return null;
        } else {
          data = JSON.parse(data.data);

          posThis.setState({
            processing: false,
          });
          posThis.stripeTerminalDiscoverReaderHandler();
        }
      });
  }
  stripeTerminalDiscoverReaderHandler() {
    var config = { simulated: false };
    terminal.discoverReaders(config).then(function(discoverResult) {
      if (discoverResult.error) {
        console.log('Failed to discover: ', discoverResult.error);
        posThis.setState({
          status: '0',
          deviceStatus: 'ERROR',
          status_message: discoverResult.error.message,
        });
      } else if (discoverResult.discoveredReaders.length === 0) {
        console.log('No available readers.');
        posThis.setState({
          status: '1',
          deviceStatus: 'CAPTURE',
          status_message:
            'No readers have been detected. Please ensure you have a Terminal configured against your location.',
        });
      } else {
        discoveredReaders = discoverResult.discoveredReaders;
        console.log('terminal.discoverReaders', discoveredReaders);

        var selectedReader = discoveredReaders[0];
        terminal.connectReader(selectedReader).then(function(connectResult) {
          if (connectResult.error) {
            console.log('Failed to connect: ', connectResult.error);
            posThis.setState({
              status: '0',
              deviceStatus: 'ERROR',
              status_message: connectResult.error.message,
            });
          } else {
            console.log('Connected to reader: ', connectResult.reader.label);
            console.log('terminal.connectReader', connectResult);
            posThis.setState({
              deviceStatus: 'PAIRED',
            });
            posThis.stripeTerminalCollectPayment();
          }
        });
      }
    });
  }

  render() {
    return (
      <div>
        <div className="paynow">
          <span className="topRow">
            <div className="ckeckoutIcon">
              <img src={checkoutIcon} alt="Checkout" />
            </div>
            <div className="name">Checkout</div>
            <div
              className="continueShopping"
              onClick={e => {
                this.props.setShowCheckout(false);
              }}
            >
              <img src={checkoutLeftArrowIcon} alt="Continue Shopping" />
              <span className="keepShopping">Keep Shopping</span>
            </div>
          </span>
          {!this.state.processingComplete ||
          (this.state.status !== '1' && this.state.status !== '') ||
          this.state.squareCheckoutStatus === 'CANCELED' ? (
            <span className="capturePayment">
              <span className="person">
                <div className="radioGroup">
                  <label htmlFor="memberType" className="radio">
                    <input
                      id="memberType"
                      name="MemberLead"
                      type="radio"
                      value="Member"
                      checked={this.state.personType === 'Member'}
                      onChange={e => {
                        this.setState({ personType: 'Member' });
                      }}
                    />
                    Member
                  </label>
                  <label htmlFor="leadType" className="radio">
                    <input
                      id="leadType"
                      name="MemberLead"
                      type="radio"
                      value="Lead"
                      checked={this.state.personType === 'Lead'}
                      onChange={e => {
                        this.setState({ personType: 'Lead' });
                      }}
                    />
                    Lead
                  </label>
                </div>
                {this.state.personType === 'Member' ? (
                  <Select
                    closeMenuOnSelect={true}
                    options={this.getAllMembers()}
                    className="hide-columns-container"
                    classNamePrefix="hide-columns"
                    placeholder="Select Member"
                    onChange={e => {
                      var firstName = '';
                      var lastName = '';
                      var address = '';
                      var city = '';
                      var province = '';
                      var postCode = '';
                      var phoneNumber = '';
                      var email = '';
                      var posProfileID = undefined;
                      var cardId = undefined;
                      var memberItem = undefined;
                      var dependantBillerProfileID = undefined;

                      for (let i = 0; i < this.props.allMembers.length; i++) {
                        if (this.props.allMembers[i].id === e.value) {
                          memberItem = this.props.allMembers[i];
                        }
                      }
                      firstName = memberItem.values['First Name'];
                      lastName = memberItem.values['Last Name'];
                      address = memberItem.values['Address'];
                      city = memberItem.values['Suburb'];
                      province = memberItem.values['State'];
                      postCode = memberItem.values['Postcode'];
                      phoneNumber = memberItem.values['Phone Number'];
                      email = memberItem.values['Email'];
                      posProfileID = memberItem.values['POS Profile ID'];
                      cardId = '1';

                      if (
                        memberItem.values['Billing Parent Member'] !==
                        memberItem.id
                      ) {
                        var parentMember = undefined;
                        for (let i = 0; i < this.props.allMembers.length; i++) {
                          if (
                            this.props.allMembers[i].id ===
                            memberItem.values['Billing Parent Member']
                          ) {
                            parentMember = this.props.allMembers[i];
                          }
                        }
                        if (parentMember !== undefined) {
                          dependantBillerProfileID =
                            parentMember.values['POS Profile ID'];
                        }
                      }
                      this.setState({
                        personID: e.value,
                        firstName: firstName,
                        lastName: lastName,
                        name: firstName + ' ' + lastName,
                        address: address,
                        city: city,
                        province: province,
                        postCode: postCode,
                        phoneNumber: phoneNumber,
                        email: email,
                        posProfileID: posProfileID,
                        cardId: cardId,
                        payment: undefined,
                      });
                      if (
                        getAttributeValue(this.props.space, 'POS System') ===
                        'Bambora'
                      ) {
                        if (
                          posProfileID !== undefined &&
                          posProfileID !== null &&
                          posProfileID !== ''
                        ) {
                          this.props.fetchPOSCards({
                            profileId: posProfileID,
                            setPOSCards: this.props.setPOSCards,
                          });
                        } else if (
                          memberItem.values['Billing User'] === 'YES'
                        ) {
                          var idx = this.props.SUCCESSFULpaymentHistory.findIndex(
                            successful => {
                              return (
                                memberItem.values['Member ID'] ===
                                  successful.yourSystemReference ||
                                memberItem.values['Billing Customer Id'] ===
                                  successful.yourSystemReference
                              );
                            },
                          );
                          if (idx !== -1) {
                            this.props.autoCreateCard({
                              transactionID: this.props
                                .SUCCESSFULpaymentHistory[idx].paymentID,
                              member: memberItem,
                              addNotification: this.props.addNotification,
                              setCreateCard: this.props.setCreateCard,
                              updateMember: this.props.updateMember,
                              autoCreateCardCompleted: this.props
                                .autoCreateCardCompleted,
                            });
                          }
                        } else if (dependantBillerProfileID !== undefined) {
                          this.setState({
                            posProfileID: dependantBillerProfileID,
                          });

                          this.props.fetchPOSCards({
                            profileId: dependantBillerProfileID,
                            setPOSCards: this.props.setPOSCards,
                          });
                        }
                      }
                    }}
                    style={{ width: '300px' }}
                  />
                ) : (
                  <Select
                    closeMenuOnSelect={true}
                    options={this.getAllLeads()}
                    className="hide-columns-container"
                    classNamePrefix="hide-columns"
                    placeholder="Select Lead"
                    onChange={e => {
                      var firstName = '';
                      var lastName = '';
                      var address = '';
                      var city = '';
                      var province = '';
                      var postCode = '';
                      var phoneNumber = '';
                      var email = '';
                      var posProfileID = undefined;
                      var cardId = undefined;
                      for (let i = 0; i < this.props.allLeads.length; i++) {
                        if (this.props.allLeads[i].id === e.value) {
                          firstName = this.props.allLeads[i].values[
                            'First Name'
                          ];
                          lastName = this.props.allLeads[i].values['Last Name'];
                          address = this.props.allLeads[i].values['Address'];
                          city = this.props.allLeads[i].values['Suburb'];
                          province = this.props.allLeads[i].values['State'];
                          postCode = this.props.allLeads[i].values['Postcode'];
                          phoneNumber = this.props.allLeads[i].values[
                            'Phone Number'
                          ];
                          email = this.props.allLeads[i].values['Email'];
                        }
                      }
                      this.setState({
                        personID: e.value,
                        firstName: firstName,
                        lastName: lastName,
                        name: firstName + ' ' + lastName,
                        address: address,
                        city: city,
                        province: province,
                        postCode: postCode,
                        phoneNumber: phoneNumber,
                        email: email,
                        posProfileID: posProfileID,
                        cardId: cardId,
                      });
                    }}
                    style={{ width: '300px' }}
                  />
                )}
              </span>
              <span className="totalRow">
                <span className="total">
                  <div className="label">TOTAL</div>
                  <div className="value">
                    {new Intl.NumberFormat(this.props.locale, {
                      style: 'currency',
                      currency: this.props.currency,
                    }).format(this.state.total)}
                  </div>
                </span>
              </span>
              {this.props.posAutoCreateCardProcessing ? (
                <span className="paymentType">
                  <div className="label">Auto Creating Saved Card...</div>
                </span>
              ) : this.state.posProfileID !== undefined &&
                this.state.posProfileID !== null &&
                this.state.posProfileID !== '' ? (
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
                              status: '',
                              errors: '',
                              processingComplete: false,
                              cardToken: undefined,
                            });
                            updatingCard = false;
                          }}
                          onClick={async e => {}}
                        />
                        Use Saved Card
                      </label>
                      {/*<label htmlFor="updateCreditCard" className="radio">
                          <input
                            id="updateCreditCard"
                            name="savedcard"
                            type="radio"
                            onChange={e => {
                              this.setState({
                                payment: 'updateCreditCard',
                                cardToken: '',
                                cvc: '',
                                expiry: '',
                                number: '',
                                status: '',
                                errors: '',
                                processingComplete: false,
                              });
                              updatingCard = false;
                            }}
                            onClick={async e => {}}
                          />
                          Update Credit Card
                        </label>
                      */}
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
                          disabled={this.disableCashPaymentType()}
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
                )
              ) : (
                <span className="paymentType">
                  <div className="label">Payment Type</div>
                  <div className="radioGroup">
                    {getAttributeValue(this.props.space, 'POS System') !==
                      'Square' &&
                      getAttributeValue(this.props.space, 'POS System') !==
                        'StripeTerminal' && (
                        <label htmlFor="creditCard" className="radio">
                          <input
                            id="creditCard"
                            name="cardpayment"
                            type="radio"
                            disabled={this.disablePaymentType()}
                            value="Credit Card"
                            onChange={e => {
                              this.setState({ payment: 'creditcard' });
                            }}
                            onClick={async e => {
                              if (
                                getAttributeValue(
                                  this.props.space,
                                  'POS System',
                                ) === 'Bambora'
                              ) {
                              }
                            }}
                          />
                          Credit Card
                        </label>
                      )}
                    {getAttributeValue(this.props.space, 'POS System') ===
                      'Square' && (
                      <label htmlFor="capture" className="radio">
                        <input
                          id="capture"
                          name="cardpayment"
                          type="radio"
                          disabled={this.disablePaymentType()}
                          value="Capture"
                          onChange={e => {
                            this.setState({
                              payment: 'capture',
                              squareCheckoutStatus: '',
                              processingComplete: false,
                            });
                          }}
                          onClick={async e => {
                            var url = getAttributeValue(
                              this.props.space,
                              'POS Service URL',
                            );
                            url = url.replace('processPOS', 'pairedDevice');
                            var args = {
                              space: this.props.space.slug,
                              billingService: getAttributeValue(
                                this.props.space,
                                'POS System',
                              ),
                            };
                            axios
                              .post(url, args)
                              .then(result => {
                                if (result.data.error === 100) {
                                  this.createDeviceID();
                                } else {
                                  var data = result.data.data;
                                  this.setState({
                                    squareDevice: data.id,
                                    terminalCode: data.code,
                                    deviceStatus: data.status,
                                    status_message: undefined,
                                  });

                                  this.processSquareCheckout();
                                }
                              })
                              .catch(error => {
                                console.log(error.response);
                              });
                          }}
                        />
                        Capture
                      </label>
                    )}
                    {getAttributeValue(this.props.space, 'POS System') ===
                      'StripeTerminal' && (
                      <Elements
                        stripe={loadStripe(
                          getAttributeValue(
                            this.props.space,
                            'POS Stripe Publishable Key',
                          ),
                          /*                          {
                            stripeAccount: getAttributeValue(
                              this.props.space,
                              'Stripe Account ID',
                            ),
                          },*/
                        )}
                      >
                        <label htmlFor="captureStripe" className="radio">
                          <input
                            id="captureStripe"
                            name="cardpayment"
                            type="radio"
                            checked={
                              this.state.payment !== undefined &&
                              this.state.payment === 'capture'
                            }
                            disabled={this.disablePaymentType()}
                            value="Capture"
                            onChange={e => {
                              this.setState({
                                payment: 'capture',
                                squareCheckoutStatus: '',
                                processingComplete: false,
                                paymentIntentId: undefined,
                              });
                            }}
                            onClick={async e => {
                              StripeTerminal = await loadStripeTerminal();
                              terminal = StripeTerminal.create({
                                onFetchConnectionToken: async () => {
                                  var url = getAttributeValue(
                                    this.props.space,
                                    'POS Service URL',
                                  );
                                  url = url.replace(
                                    'processPOS',
                                    'pairedDevice',
                                  );
                                  var args = {
                                    space: this.props.space.slug,
                                    billingService: 'Stripe',
                                  };

                                  const bodyContent = JSON.stringify(args);
                                  return fetch(url, {
                                    method: 'POST',
                                    headers: {
                                      'Content-Type': 'application/json',
                                    },
                                    body: bodyContent,
                                  })
                                    .then(function(response) {
                                      return response.json();
                                    })
                                    .then(function(data) {
                                      data = JSON.parse(data.data);
                                      if (data.error === 100) {
                                        this.setState({
                                          deviceStatus: 'ERROR',
                                          status_message:
                                            'Unable to connect to Terminal server',
                                        });
                                      } else {
                                        return data.secret;
                                      }
                                    });
                                },
                                onUnexpectedReaderDisconnect: this
                                  .unexpectedDisconnect,
                              });

                              this.stripeTerminalDiscoverReaderHandler();
                            }}
                          />
                          Capture
                        </label>
                      </Elements>
                    )}
                    <label htmlFor="cash" className="radio">
                      <input
                        id="cash"
                        name="cardpayment"
                        type="radio"
                        checked={
                          this.state.payment !== undefined &&
                          this.state.payment === 'cash'
                        }
                        disabled={this.disableCashPaymentType()}
                        value="Cash"
                        onChange={e => {
                          if (
                            this.state.payment === 'capture' &&
                            this.state.paymentIntentId !== undefined
                          ) {
                            this.stripeTerminalCancelCapture();
                          }

                          this.setState({
                            payment: 'cash',
                            cardToken: '',
                            cvc: '',
                            expiry: '',
                            number: '',
                            posProfileID: undefined,
                            cardId: undefined,
                            status: '',
                            deviceStatus: '',
                            status_message: undefined,
                            paymentIntentId: undefined,
                          });
                        }}
                      />
                      Cash
                    </label>
                  </div>
                </span>
              )}
              {this.state.payment === 'capture' &&
              getAttributeValue(this.props.space, 'POS System') ===
                'StripeTerminal' ? (
                <span className="capture">
                  <SVGInline
                    svg={pairingIcon}
                    className={
                      'posPairing icon ' +
                      this.state.deviceStatus +
                      ' S' +
                      (verifyDeviceCount % 2)
                    }
                  />
                  {this.state.squareCheckoutStatus === 'CANCELED' && (
                    <p>Transaction cancelled...</p>
                  )}
                  {this.state.status_message !== undefined && (
                    <p>An error has ocurred: {this.state.status_message}</p>
                  )}
                  {this.state.deviceStatus === 'CAPTURE' && (
                    <div>
                      <p>
                        Please enter you terminal pairing code then click to
                        Pair
                      </p>
                      <input
                        id="stripeTerminalPairingCode"
                        type="text"
                        placeholder="Enter Terminal pairing code"
                        className="pairingCodeInput"
                        size="50"
                        onChange={e => {
                          this.setState({
                            stripeTerminalCode: e.target.value,
                          });
                        }}
                      />
                      <div
                        className="pairTerminalButton"
                        onClick={async e => {
                          posThis.stripeTerminalCreateReaderLocationHandler();
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
                            <span className="label">Apply Pairing Code</span>
                            <img
                              src={checkoutRightArrowIcon}
                              alt="Apply Pairing Code"
                            />
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </span>
              ) : (
                <div />
              )}
              {this.state.payment === 'capture' &&
              getAttributeValue(this.props.space, 'POS System') === 'Square' ? (
                <span className="capture">
                  <SVGInline
                    svg={pairingIcon}
                    className={
                      'posPairing icon ' +
                      this.state.deviceStatus +
                      ' S' +
                      (verifyDeviceCount % 2)
                    }
                  />
                  {/*                    <p>Device ID: {this.state.squareDevice}</p>
                    <p>Device Status {this.state.deviceStatus}</p> */}
                  {this.state.deviceStatus === 'UNPAIRED' && (
                    <p>
                      Please pair your Square terminal with code{' '}
                      <span className="pairCode">
                        {this.state.terminalCode}
                      </span>
                    </p>
                  )}
                  {this.state.deviceStatus === 'CHECKOUT' &&
                    this.state.squareCheckoutStatus !== 'CANCELED' && (
                      <p>Capturing payment from customer, please wait...</p>
                    )}
                  {this.state.squareCheckoutStatus === 'CANCELED' && (
                    <p>Customer cancelled transaction...</p>
                  )}
                  {this.state.status_message !== undefined && (
                    <p>An error has ocurred: {this.state.status_message}</p>
                  )}
                </span>
              ) : (
                <div />
              )}
              {(this.state.payment === 'creditcard' ||
                this.state.payment === 'updateCreditCard') &&
              getAttributeValue(this.props.space, 'POS System') ===
                'Bambora' ? (
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
                          <div className="row"></div>
                        </div>
                        <div className="row">
                          <div className="col-lg-12 text-center">
                            <div id="feedback"></div>
                          </div>
                        </div>
                      </span>
                    ) : (
                      'loading...'
                    )}
                  </div>
                </span>
              ) : (
                <div />
              )}
              {this.state.payment === 'creditcard' &&
              getAttributeValue(this.props.space, 'POS System') === 'Stripe' ? (
                <span className="creditCard">
                  <Elements
                    stripe={loadStripe(
                      getAttributeValue(
                        this.props.space,
                        'POS Stripe Publishable Key',
                      ),
                      /*                      {
                        stripeAccount: getAttributeValue(
                          this.props.space,
                          'Stripe Account ID',
                        ),
                      }, */
                    )}
                  >
                    <StripePaymentCapture />
                  </Elements>
                </span>
              ) : (
                <div />
              )}
              {this.state.status !== '1' && this.state.status !== '' && (
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
                posCheckout={this.props.posCheckout}
                total={this.props.total}
                subtotal={this.props.subtotal}
                salestax={this.props.salestax}
                discount={this.props.discount}
                number={this.state.number}
                auth_code={this.state.auth_code}
                transaction_id={this.state.transaction_id}
                space={this.props.space}
                snippets={this.props.snippets}
                datetime={this.state.datetime}
                name={this.state.name}
                ref={el => (this.componentRef = el)}
              />
              <span className="printReceipt">
                <ReactToPrint
                  trigger={() => (
                    <SVGInline
                      svg={printerIcon}
                      className="icon barcodePrint"
                    />
                  )}
                  content={() => this.componentRef}
                  pageStyle="@page {size: a4 portrait;margin: 0;}"
                />
              </span>
            </span>
          )}
          <span className="bottomRow">
            {this.state.payment === 'capture' &&
              this.state.status !== '1' &&
              this.state.status !== '0' &&
              this.state.paymentIntentId !== undefined &&
              getAttributeValue(this.props.space, 'POS System') ===
                'StripeTerminal' && (
                <div
                  className="cancelTerminalButton"
                  onClick={async e => {
                    terminal
                      .cancelCollectPaymentMethod()
                      .then(function(result) {
                        if (result.error) {
                          posThis.setState({
                            status: '0',
                            deviceStatus: 'ERROR',
                            status_message: result.error.message,
                          });
                        } else {
                          posThis.setState({
                            status: '1',
                            squareCheckoutStatus: 'CANCELED',
                            status_message: undefined,
                            paymentIntentId: undefined,
                          });
                        }
                      });
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
                      <span className="label">Cancel Payment</span>
                      <img src={checkoutRightArrowIcon} alt="Cancel Payment" />
                    </span>
                  )}
                </div>
              )}
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
                      console.log('calling processPayment');
                      this.processPayment();
                    } else {
                      setTimeout(function() {
                        posThis.setState({
                          processing: false,
                          processingComplete: true,
                          status: '1',
                          errors: '',
                          auth_code: '',
                          transaction_id: 'cash',
                          datetime: moment(),
                        });
                        posThis.completeCheckout();
                      });
                    }
                    /*
                setTimeout(function(){
                  posThis.setState({
                    processing: false,
                    processingComplete:true,
                    status: "1",
                    status_message: "Authorised",
                    errors: "",
                    auth_code: "999",
                    transaction_id: "63636-343-34-34-343433",
                    datetime: moment(),
                  });
                  if ("1"==="2"){
                    posThis.completeCheckout();
                  }
                },5000);
*/
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

class Checkout extends Component {
  constructor(props) {
    super(props);
    var subtotal = 0;
    var discount = 0;
    var salestax = 0;
    var total = 0;
    posThis = this;

    salestax = parseFloat(
      getAttributeValue(this.props.space, 'POS Sales Tax') === undefined
        ? 0
        : getAttributeValue(this.props.space, 'POS Sales Tax'),
    );

    if (this.props.posCheckout['Checkout Items']['products'] !== undefined) {
      this.props.posCheckout['Checkout Items']['products'].forEach(
        (product, i) => {
          subtotal =
            subtotal +
            parseFloat(product['price'], 2) * parseInt(product['quantity']);
          total = subtotal;
        },
      );
    }
    if (
      this.props.posCheckout['Checkout Items']['discountName'] !== undefined &&
      this.props.posCheckout['Checkout Items']['voucher'] === undefined
    ) {
      discount = parseFloat(
        this.props.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        this.props.posCheckout['Checkout Items']['discountType'] ===
        'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    } else if (
      this.props.posCheckout['Checkout Items']['discountName'] !== undefined &&
      this.props.posCheckout['Checkout Items']['voucher'] !== undefined
    ) {
      discount = parseFloat(
        this.props.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        this.props.posCheckout['Checkout Items']['discountType'] ===
        'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    }
    if (salestax !== 0) {
      salestax = parseFloat((total * salestax).toFixed(2));
      total = total + salestax;
    }
    total = parseFloat(total.toFixed(2));

    this.setShowAddDiscountDialog = this.setShowAddDiscountDialog.bind(this);
    this.setShowPayNow = this.setShowPayNow.bind(this);

    this.state = {
      subtotal: subtotal,
      discount: discount,
      salestax: salestax,
      total: total,
      showAddDiscountDialog: false,
      showPayNow: false,
    };
  }
  setShowAddDiscountDialog(show, discountid) {
    this.setState({
      showAddDiscountDialog: show,
    });

    this.props.addDiscount(discountid);
  }
  setShowPayNow(show) {
    this.setState({
      showPayNow: show,
    });
  }
  componentWillReceiveProps(nextProps) {
    var subtotal = 0;
    var discount = 0;
    var salestax = 0;
    var total = 0;

    if (this.state.salestax === 0) {
    } else {
      salestax = parseFloat(
        getAttributeValue(this.props.space, 'POS Sales Tax') === undefined
          ? 0
          : getAttributeValue(this.props.space, 'POS Sales Tax'),
      );
    }

    if (nextProps.posCheckout['Checkout Items']['products'] !== undefined) {
      nextProps.posCheckout['Checkout Items']['products'].forEach(
        (product, i) => {
          subtotal =
            subtotal +
            parseFloat(product['price'], 2) * parseInt(product['quantity']);
          total = subtotal;
        },
      );
    }
    if (
      nextProps.posCheckout['Checkout Items']['discountName'] !== undefined &&
      nextProps.posCheckout['Checkout Items']['voucher'] === undefined
    ) {
      discount = parseFloat(
        nextProps.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        nextProps.posCheckout['Checkout Items']['discountType'] === 'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    } else if (
      nextProps.posCheckout['Checkout Items']['discountName'] !== undefined &&
      nextProps.posCheckout['Checkout Items']['voucher'] !== undefined
    ) {
      discount = parseFloat(
        nextProps.posCheckout['Checkout Items']['discountValue'],
      );
      if (
        nextProps.posCheckout['Checkout Items']['discountType'] === 'Percentage'
      ) {
        discount = subtotal * (discount / 100);
        total = subtotal - discount;
      } else {
        total = subtotal - discount;
      }
    }
    if (salestax !== 0) {
      salestax = parseFloat((total * salestax).toFixed(2));
      total = total + salestax;
    }
    total = parseFloat(total.toFixed(2));

    this.setState({
      subtotal: subtotal,
      discount: discount,
      salestax: salestax,
      total: total,
    });
  }
  componentWillMount() {}
  render() {
    return (
      <div className="checkout">
        {this.state.showAddDiscountDialog && (
          <AddDiscountDialogContainer
            setShowAddDiscountDialog={this.setShowAddDiscountDialog}
            posCheckout={this.props.posCheckout}
            locale={this.props.locale}
            currency={this.props.currency}
            posDiscounts={this.props.posDiscounts}
          />
        )}
        {this.state.showPayNow ? (
          <PayNow
            setShowPayNow={this.setShowPayNow}
            locale={this.props.locale}
            currency={this.props.currency}
            posCheckout={this.props.posCheckout}
            total={this.state.total}
            subtotal={this.state.subtotal}
            discount={this.state.discount}
            salestax={this.state.salestax}
            fetchPOSCards={this.props.fetchPOSCards}
            setPOSCards={this.props.setPOSCards}
            posCardsLoading={this.props.posCardsLoading}
            posCards={this.props.posCards}
            updatePOSCheckout={this.props.updatePOSCheckout}
            fetchPOSCheckout={this.props.fetchPOSCheckout}
            completePOSCheckout={this.props.completePOSCheckout}
            updateMember={this.props.updateMember}
            updateMemberItem={this.props.updateMemberItem}
            autoCreateCardCompleted={this.props.autoCreateCardCompleted}
            setShowCheckout={this.props.setShowCheckout}
            allMembers={this.props.allMembers}
            allLeads={this.props.allLeads}
            fetchLeads={this.props.fetchLeads}
            leadsLoading={this.props.leadsLoading}
            space={this.props.space}
            kapp={this.props.kapp}
            spaceSlug={this.props.spaceSlug}
            snippets={this.props.snippets}
            SUCCESSFULpaymentHistory={this.props.SUCCESSFULpaymentHistory}
            autoCreateCard={this.props.autoCreateCard}
            setCreateCard={this.props.setCreateCard}
            posAutoCreateCardProcessing={this.props.posAutoCreateCardProcessing}
            addNotification={this.props.addNotification}
          />
        ) : (
          <span>
            <span className="topRow">
              <div className="ckeckoutIcon">
                <img src={checkoutIcon} alt="Checkout" />
              </div>
              <div className="name">Checkout</div>
              <div
                className="continueShopping"
                onClick={e => {
                  this.props.setShowCheckout(false);
                }}
              >
                <img src={checkoutLeftArrowIcon} alt="Continue Shopping" />
                <span className="keepShopping">Keep Shopping</span>
              </div>
            </span>
            <span className="details">
              {this.props.posCheckout['Checkout Items']['products'] !==
                undefined &&
                this.props.posCheckout['Checkout Items']['products'].filter(
                  product => product['productType'] === 'Apparel',
                ).length > 0 && (
                  <div className="apparel">
                    <div className="label">Apparel</div>
                    <div className="products">
                      {this.props.posCheckout['Checkout Items']['products'] !==
                        undefined &&
                        this.props.posCheckout['Checkout Items']['products']
                          .filter(
                            product => product['productType'] === 'Apparel',
                          )
                          .map((product, index) => (
                            <div
                              className="lineItem"
                              product-id={product['productID']}
                              key={index}
                            >
                              <div className="quantity">
                                {product['quantity']}
                              </div>
                              <div className="name">
                                {product['name'] +
                                  ' ' +
                                  product['colour'] +
                                  ' ' +
                                  product['size']}
                              </div>
                              <div className="price">
                                {new Intl.NumberFormat(this.props.locale, {
                                  style: 'currency',
                                  currency: this.props.currency,
                                }).format(product['price'])}
                              </div>
                              <SVGInline
                                svg={binIcon}
                                className="icon delete"
                                onClick={async e => {
                                  var cancelButton = $(e.target);
                                  if (
                                    await confirm(
                                      <span>
                                        <span>
                                          Are you sure you want to REMOVE this
                                          item?
                                        </span>
                                        <table>
                                          <tbody>
                                            <tr>
                                              <td>
                                                {$(e.target)
                                                  .parents('.lineItem')
                                                  .children('.name')
                                                  .html()}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </span>,
                                    )
                                  ) {
                                    console.log('sds');

                                    this.props.removeProduct(
                                      cancelButton
                                        .parents('.lineItem')
                                        .attr('product-id'),
                                    );
                                  }
                                }}
                              />
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              {this.props.posCheckout['Checkout Items']['products'] !==
                undefined &&
                this.props.posCheckout['Checkout Items']['products'].filter(
                  product => product['productType'] === 'Service',
                ).length > 0 && (
                  <div className="services">
                    <div className="label">Services</div>
                    <div className="products">
                      {this.props.posCheckout['Checkout Items']['products'] !==
                        undefined &&
                        this.props.posCheckout['Checkout Items']['products']
                          .filter(
                            product => product['productType'] === 'Service',
                          )
                          .map((product, index) => (
                            <div
                              className="lineItem"
                              product-id={product['productID']}
                              key={index}
                            >
                              <div className="quantity">
                                {product['quantity']}
                              </div>
                              <div className="name">{product['name']}</div>
                              <div className="price">
                                {new Intl.NumberFormat(this.props.locale, {
                                  style: 'currency',
                                  currency: this.props.currency,
                                }).format(product['price'])}
                              </div>
                              <SVGInline
                                svg={binIcon}
                                className="icon delete"
                                onClick={async e => {
                                  var cancelButton = $(e.target);
                                  if (
                                    await confirm(
                                      <span>
                                        <span>
                                          Are you sure you want to REMOVE this
                                          item?
                                        </span>
                                        <table>
                                          <tbody>
                                            <tr>
                                              <td>
                                                {$(e.target)
                                                  .parents('.lineItem')
                                                  .children('.name')
                                                  .html()}
                                              </td>
                                            </tr>
                                          </tbody>
                                        </table>
                                      </span>,
                                    )
                                  ) {
                                    console.log('sds');

                                    this.props.removeProduct(
                                      cancelButton
                                        .parents('.lineItem')
                                        .attr('product-id'),
                                    );
                                  }
                                }}
                              />
                            </div>
                          ))}
                    </div>
                  </div>
                )}
              {this.props.posCheckout['Checkout Items']['products'] !==
                undefined &&
                this.props.posCheckout['Checkout Items']['products'].filter(
                  product => product['productType'] === 'Package',
                ).length > 0 && (
                  <div className="packages">
                    <div className="label">Packages</div>
                    <div className="products">
                      {this.props.posCheckout['Checkout Items']['products'] !==
                        undefined &&
                        this.props.posCheckout['Checkout Items']['products']
                          .filter(
                            product => product['productType'] === 'Package',
                          )
                          .map((product, index) => (
                            <div className="packageInfo" key={index}>
                              <div
                                className="lineItem"
                                product-id={product['productID']}
                              >
                                <div className="quantity">
                                  {product['quantity']}
                                </div>
                                <div className="name">{product['name']}</div>
                                <div className="price">
                                  {new Intl.NumberFormat(this.props.locale, {
                                    style: 'currency',
                                    currency: this.props.currency,
                                  }).format(product['price'])}
                                </div>
                                <SVGInline
                                  svg={binIcon}
                                  className="icon delete"
                                  onClick={async e => {
                                    var cancelButton = $(e.target);
                                    if (
                                      await confirm(
                                        <span>
                                          <span>
                                            Are you sure you want to REMOVE this
                                            item?
                                          </span>
                                          <table>
                                            <tbody>
                                              <tr>
                                                <td>
                                                  {$(e.target)
                                                    .parents('.lineItem')
                                                    .children('.name')
                                                    .html()}
                                                </td>
                                              </tr>
                                            </tbody>
                                          </table>
                                        </span>,
                                      )
                                    ) {
                                      console.log('sds');

                                      this.props.removeProduct(
                                        cancelButton
                                          .parents('.lineItem')
                                          .attr('product-id'),
                                      );
                                    }
                                  }}
                                />
                              </div>
                              <div className="stockItems">
                                {product.packageStock.map((stock, index) => (
                                  <div className="stockItem" key={index}>
                                    <div className="name">{stock['name']}</div>
                                    <div className="colour">
                                      {stock['colour']}
                                    </div>
                                    <div className="size">{stock['size']}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                    </div>
                  </div>
                )}
            </span>
            <span className="subtotal">
              <div className="label">
                <I18n>SUBTOTAL</I18n>
              </div>
              <div className="value">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.state.subtotal)}
              </div>
            </span>
            {this.props.posCheckout['Checkout Items']['discountType'] ===
            undefined ? (
              <div />
            ) : (
              <div className="discountLine">
                <div className="label">
                  <I18n>Discount</I18n> |
                </div>
                <i className="percentageValue">
                  <div className="type">
                    {this.props.posCheckout['Checkout Items']['discountName']}
                  </div>
                </i>
                {this.props.posCheckout['Checkout Items']['voucher'] ===
                'Voucher' ? (
                  <div className="voucherValue value">
                    <span className="discountType">
                      {this.props.posCheckout['Checkout Items'][
                        'discountType'
                      ] === 'Percentage'
                        ? '%'
                        : '$'}
                    </span>
                    <NumberFormat
                      ref={input => (this.input = input)}
                      value={
                        this.props.posCheckout['Checkout Items'][
                          'discountValue'
                        ]
                      }
                      onValueChange={(values, e) => {
                        var { formattedValue, value } = values;
                        posThis.props.updateDiscount(parseFloat(value));
                      }}
                    />
                  </div>
                ) : (
                  <div className="value">
                    {new Intl.NumberFormat(this.props.locale, {
                      style: 'currency',
                      currency: this.props.currency,
                    }).format(this.state.discount)}
                  </div>
                )}
                <SVGInline
                  svg={binIcon}
                  className="icon delete"
                  onClick={async e => {
                    var cancelButton = $(e.target);
                    if (
                      await confirm(
                        <span>
                          <span>
                            Are you sure you want to REMOVE this discount?
                          </span>
                          <table>
                            <tbody>
                              <tr>
                                <td>
                                  {$(e.target)
                                    .parents('.discountLine')
                                    .children('.type')
                                    .html()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </span>,
                      )
                    ) {
                      this.props.removeDiscount();
                    }
                  }}
                />
              </div>
            )}
            {this.state.salestax === 0 ? (
              <div />
            ) : (
              <span className="salestax">
                <div className="label">
                  {getAttributeValue(
                    this.props.space,
                    'POS Sales Tax Label',
                  ) === undefined ? (
                    <I18n>SALES TAX</I18n>
                  ) : (
                    getAttributeValue(this.props.space, 'POS Sales Tax Label')
                  )}
                </div>
                <div className="value">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(this.state.salestax)}
                </div>
                <SVGInline
                  svg={binIcon}
                  className="icon delete"
                  onClick={async e => {
                    var cancelButton = $(e.target);
                    if (
                      await confirm(
                        <span>
                          <span>
                            Are you sure you want to REMOVE the{' '}
                            {getAttributeValue(
                              this.props.space,
                              'POS Sales Tax Label',
                            ) === undefined ? (
                              <span>SALES TAX</span>
                            ) : (
                              getAttributeValue(
                                this.props.space,
                                'POS Sales Tax Label',
                              )
                            )}
                            ?
                          </span>
                          <table>
                            <tbody>
                              <tr>
                                <td>
                                  {$(e.target)
                                    .parents('.discountLine')
                                    .children('.type')
                                    .html()}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </span>,
                      )
                    ) {
                      var total = this.state.total - this.state.salestax;
                      this.setState({
                        salestax: 0,
                        total: total,
                      });
                    }
                  }}
                />
              </span>
            )}
            <span className="total">
              <div className="label">
                <I18n>TOTAL</I18n>
              </div>
              <div className="value">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.state.total)}
              </div>
            </span>
            <span className="bottomRow">
              <div
                className="addDiscount"
                onClick={e => {
                  this.setShowAddDiscountDialog(true);
                }}
              >
                <img src={discountIcon} alt="Add Discount" />
                <span className="label">Add Discount</span>
              </div>
              <div
                className="checkoutButton"
                disabled={
                  this.state.total === 0 &&
                  (this.state.discount !== this.state.subtotal ||
                    this.state.subtotal === 0)
                }
                onClick={e => {
                  this.setShowPayNow(true);
                }}
              >
                <span className="label">Checkout</span>
                <img src={checkoutRightArrowIcon} alt="Checkout" />
              </div>
            </span>
          </span>
        )}
      </div>
    );
  }
}

class ProductEditDisplay extends Component {
  constructor(props) {
    super(props);
    this.setShowEditProductDialog = this.setShowEditProductDialog.bind(this);
    this.state = {
      showEditProductDialog: false,
    };
  }
  setShowEditProductDialog(show) {
    this.setState({
      showEditProductDialog: show,
    });
  }
  render() {
    return (
      <div className="productEditInfo">
        {this.state.showEditProductDialog && (
          <EditProductDialogContainer
            setShowEditProductDialog={this.setShowEditProductDialog}
            product={this.props.product}
            locale={this.props.locale}
            currency={this.props.currency}
            addProduct={this.props.addProduct}
            refreshProducts={this.props.refreshProducts}
            posProducts={this.props.posProducts}
          />
        )}
        {this.props.product.values['Product Type'] === 'Package' ? (
          <div className="package">
            <div
              className="info"
              dangerouslySetInnerHTML={{
                __html: this.props.product.values['Details'].replace(
                  /(?:\r\n|\r|\n)/g,
                  '<br>',
                ),
              }}
            />
            <div className="products">
              <div className="label">Product Options</div>
              {this.props.product.packageStock.map((product, i) => {
                return (
                  <div className="name" key={i}>
                    {product.values['Name']}-{product.values['Colour']}
                  </div>
                );
              })}
            </div>
            {this.props.product.values['Display Type'] === 'New' ? (
              <div className="new-banner">
                <span>NEW</span>
              </div>
            ) : (
              <div />
            )}
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="on-sale-banner">
                <span>sale</span>
              </div>
            ) : (
              <div />
            )}
            <span
              className="quick-view mfp-inline hidemobile"
              onClick={e => {
                console.log('setShowAddProductToCheckoutDialog');
                this.setShowEditProductDialog(true);
              }}
            >
              <span>
                <img src={editIcon} alt="Edit" />
              </span>
            </span>
          </div>
        ) : (
          <div
            className="productImage"
            style={{
              backgroundImage: `url(${this.props.product.values['Image URL']})`,
            }}
          >
            {this.props.product.values['Display Type'] === 'New' ? (
              <div className="new-banner">
                <span>NEW</span>
              </div>
            ) : (
              <div />
            )}
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="on-sale-banner">
                <span>sale</span>
              </div>
            ) : (
              <div />
            )}
            <span
              className="quick-view mfp-inline hidemobile"
              onClick={e => {
                console.log('setShowAddProductDialog');
                this.setShowEditProductDialog(true);
              }}
            >
              <span>
                <img src={editIcon} alt="Edit" />
              </span>
            </span>
          </div>
        )}
        <div className="productDetails">
          <div className="name">{this.props.product.values['Name']}</div>
          <div className="colour">{this.props.product.values['Colour']}</div>
          {this.props.product.values['Limited Edition'] !== null &&
          this.props.product.values['Limited Edition'] !== [] &&
          this.props.product.values['Limited Edition'].indexOf(
            'Limited Edition',
          ) !== -1 ? (
            <div className="limitedEdition">Limited Edition</div>
          ) : (
            <div />
          )}
          <div className="prices">
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="sale">
                <s className="fullPrice">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(this.props.product.values['Price'])}
                </s>
                <span className="discount">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(this.props.product.values['Discount'])}
                </span>{' '}
                SALE
              </div>
            ) : (
              <span className="fullPrice">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.props.product.values['Price'])}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}

class ProductDisplay extends Component {
  constructor(props) {
    super(props);
    this.setShowAddProductToCheckoutDialog = this.setShowAddProductToCheckoutDialog.bind(
      this,
    );
    this.state = {
      showAddProductToCheckoutDialog: this.props.scanned,
    };
  }
  setShowAddProductToCheckoutDialog(show) {
    if (!show) {
      this.props.resetScanned();
    }
    this.setState({
      showAddProductToCheckoutDialog: show,
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('ProductDisplay WillReceiveProps');
    if (nextProps.showScanned) {
      this.setShowAddProductToCheckoutDialog(true);
    }
  }
  UNSAFE_componentWillMount() {
    console.log('ProductDisplay willMount');
  }
  render() {
    return (
      <div
        className={'productInfo ' + this.props.product.values['Product Type']}
      >
        {this.state.showAddProductToCheckoutDialog && (
          <AddProductToCheckoutDialogContainer
            setShowAddProductToCheckoutDialog={
              this.setShowAddProductToCheckoutDialog
            }
            product={this.props.product}
            locale={this.props.locale}
            currency={this.props.currency}
            addProduct={this.props.addProduct}
            showScanned={this.props.showScanned}
            scannedSKU={this.props.scannedSKU}
            resetScanned={this.props.resetScanned}
          />
        )}
        {this.props.product.values['Product Type'] === 'Package' ? (
          <div className="package">
            <div
              className="info"
              dangerouslySetInnerHTML={{
                __html: this.props.product.values['Details'].replace(
                  /(?:\r\n|\r|\n)/g,
                  '<br>',
                ),
              }}
            />
            <div className="products">
              <div className="label">Product Options</div>
              {this.props.product.packageStock.map((product, i) => {
                return (
                  <div className="name" key={i}>
                    {product.values['Name']}-{product.values['Colour']}
                  </div>
                );
              })}
            </div>
            {this.props.product.values['Display Type'] === 'New' ? (
              <div className="new-banner">
                <span>NEW</span>
              </div>
            ) : (
              <div />
            )}
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="on-sale-banner">
                <span>sale</span>
              </div>
            ) : (
              <div />
            )}
            <span
              className="quick-view mfp-inline hidemobile"
              onClick={e => {
                console.log('setShowAddProductToCheckoutDialog');
                this.setShowAddProductToCheckoutDialog(true);
              }}
            >
              <span>+</span>
            </span>
          </div>
        ) : (
          <div
            className="productImage"
            style={{
              backgroundImage: `url(${this.props.product.values['Image URL']})`,
            }}
          >
            {this.props.product.values['Display Type'] === 'New' ? (
              <div className="new-banner">
                <span>NEW</span>
              </div>
            ) : (
              <div />
            )}
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="on-sale-banner">
                <span>sale</span>
              </div>
            ) : (
              <div />
            )}
            <span
              className="quick-view mfp-inline hidemobile"
              onClick={e => {
                console.log('setShowAddProductToCheckoutDialog');
                this.setShowAddProductToCheckoutDialog(true);
              }}
            >
              <span>+</span>
            </span>
          </div>
        )}
        <div className="productDetails">
          <div className="name">{this.props.product.values['Name']}</div>
          <div className="colour">{this.props.product.values['Colour']}</div>
          {this.props.product.values['Limited Edition'] !== null &&
          this.props.product.values['Limited Edition'] !== [] &&
          this.props.product.values['Limited Edition'].indexOf(
            'Limited Edition',
          ) !== -1 ? (
            <div className="limitedEdition">Limited Edition</div>
          ) : (
            <div />
          )}
          <div className="prices">
            {this.props.product.values['Display Type'] === 'Sale' ? (
              <div className="sale">
                <s className="fullPrice">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(this.props.product.values['Price'])}
                </s>
                <span className="discount">
                  {new Intl.NumberFormat(this.props.locale, {
                    style: 'currency',
                    currency: this.props.currency,
                  }).format(this.props.product.values['Discount'])}
                </span>{' '}
                SALE
              </div>
            ) : (
              <span className="fullPrice">
                {new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
                }).format(this.props.product.values['Price'])}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }
}
export class ProShop extends Component {
  constructor(props) {
    super(props);
    this.handleScan = this.handleScan.bind(this);
    this.resetScanned = this.resetScanned.bind(this);

    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;
    this.setShowCheckout = this.setShowCheckout.bind(this);
    this.setShowSettings = this.setShowSettings.bind(this);
    this.setShowAddProductDialog = this.setShowAddProductDialog.bind(this);
    this.setShowRecordStockDialog = this.setShowRecordStockDialog.bind(this);
    this.refreshProducts = this.refreshProducts.bind(this);

    this.state = {
      category: 'All',
      productCount: 0,
      showCheckout: false,
      showSettings: false,
      showAddProductDialog: false,
      showRecordStockDialog: false,
      refresh: false,
    };
  }
  setShowAddProductDialog(show) {
    this.setState({
      showAddProductDialog: show,
    });
  }
  setShowRecordStockDialog(show) {
    if (!show) {
      this.resetScanned();
    }
    this.setState({
      showRecordStockDialog: show,
    });
  }
  refreshProducts() {
    this.setState({
      refresh: this.state.refresh,
    });
  }
  setShowCheckout(show) {
    this.setState({
      showCheckout: show,
      showSettings: false,
      editProductsSwitch: false,
    });
  }
  setShowSettings(show) {
    this.setState({
      showSettings: show,
      showCheckout: false,
      editProductsSwitch: false,
    });
  }
  resetScanned() {
    this.setState({
      scanned: undefined,
    });
  }
  componentWillReceiveProps(nextProps) {
    if (
      nextProps.posCheckout['Checkout Items'] !== undefined &&
      nextProps.posCheckout['Checkout Items'].length !== this.state.productCount
    ) {
      this.setState({
        productCount:
          nextProps.posCheckout['Checkout Items']['products'] !== undefined
            ? nextProps.posCheckout['Checkout Items']['products'].length
            : 0,
      });
    }
  }
  handleScan(data) {
    console.log('data:' + data);
    this.setState({
      scanned: undefined,
      scannedSKU: '',
      productCodeValue: '',
    });

    var idx = this.props.posBarcodes.findIndex((item, i) => {
      return item.values['Barcode'] === data;
    });
    if (idx !== -1) {
      var skuValue = this.props.posBarcodes[idx].values['SKU'];
      var productSKUValue = '';
      idx = this.props.posProducts.findIndex((product, i) => {
        var matched = false;
        var sizes = product.values['Sizes'];
        var productSku =
          product.values['SKU'] !== null ? product.values['SKU'].trim() : '';
        sizes.forEach((size, i) => {
          if (
            productSku + size === skuValue ||
            (size === 'ALL' && productSku === skuValue)
          ) {
            matched = true;
            productSKUValue = productSku;
          }
        });
        return matched;
      });
      if (idx !== -1) {
        console.log('SKU Found:' + skuValue);
        this.setState({
          scanned: true,
          scannedSKU: skuValue,
          productCodeValue: productSKUValue,
        });
      } else {
        this.setState({
          scanned: true,
          scannedSKU: skuValue,
          productCodeValue: '',
        });
      }
    } else {
      this.setState({
        scanned: true,
        scannedSKU: data,
        productCodeValue: '',
      });
    }
  }
  render() {
    return (
      <div className="proshopContainer">
        {this.props.posCategoriesLoading ||
        this.props.posProductsLoading ||
        this.props.posBarcodesLoading ||
        this.props.posDiscountsLoading ||
        this.props.posCheckoutLoading ? (
          <div>Loading...</div>
        ) : (
          <div className="proshop">
            <StatusMessagesContainer />
            {this.state.showCheckout ? (
              <Checkout
                setShowCheckout={this.setShowCheckout}
                locale={this.locale}
                currency={this.currency}
                posCheckout={this.props.posCheckout}
                posDiscounts={this.props.posDiscounts}
                addDiscount={this.props.addDiscount}
                updateDiscount={this.props.updateDiscount}
                removeDiscount={this.props.removeDiscount}
                removeProduct={this.props.removeProduct}
                fetchPOSCards={this.props.fetchPOSCards}
                setPOSCards={this.props.setPOSCards}
                posCardsLoading={this.props.posCardsLoading}
                posCards={this.props.posCards}
                updatePOSCheckout={this.props.updatePOSCheckout}
                fetchPOSCheckout={this.props.fetchPOSCheckout}
                completePOSCheckout={this.props.completePOSCheckout}
                updateMember={this.props.updateMember}
                updateMemberItem={this.props.updateMemberItem}
                autoCreateCardCompleted={this.props.autoCreateCardCompleted}
                allMembers={this.props.allMembers}
                allLeads={this.props.allLeads}
                fetchLeads={this.props.fetchLeads}
                leadsLoading={this.props.leadsLoading}
                space={this.props.space}
                kapp={this.props.kapp}
                spaceSlug={this.props.spaceSlug}
                snippets={this.props.snippets}
                SUCCESSFULpaymentHistory={this.props.SUCCESSFULpaymentHistory}
                autoCreateCard={this.props.autoCreateCard}
                setCreateCard={this.props.setCreateCard}
                posAutoCreateCardProcessing={
                  this.props.posAutoCreateCardProcessing
                }
                addNotification={this.props.addNotification}
              />
            ) : this.state.showSettings ? (
              <SettingsContainer
                setShowSettings={this.setShowSettings}
                posStock={this.props.posStock}
                posProducts={this.props.posProducts}
              />
            ) : (
              <div className="catalog">
                <div className="topRow">
                  <div
                    className="categoryIconButton active apparel"
                    onClick={e => {
                      $('.topRow .categoryIconButton').removeClass('active');
                      $(e.target)
                        .parents('.categoryIconButton')
                        .addClass('active');
                      this.props.setProductType('Apparel');
                      if (
                        this.props.posCategories.filter(
                          category => category.values['Type'] === 'Apparel',
                        ).length > 0
                      ) {
                        this.setState({
                          category: this.props.posCategories.filter(
                            category => category.values['Type'] === 'Apparel',
                          )[0].values['Label'],
                        });
                      } else {
                        this.setState({
                          category: '',
                        });
                      }
                      this.setState({
                        scanned: undefined,
                        scannedSKU: undefined,
                        productCodeValue: undefined,
                      });
                    }}
                  >
                    <SVGInline svg={apparelIcon} className="icon" />
                    <span className="appName">APPAREL</span>
                    <div className="droparrow" />
                  </div>
                  <div
                    className="categoryIconButton service"
                    onClick={e => {
                      $('.topRow .categoryIconButton').removeClass('active');
                      $(e.target)
                        .parents('.categoryIconButton')
                        .addClass('active');
                      this.props.setProductType('Service');
                      if (
                        this.props.posCategories.filter(
                          category => category.values['Type'] === 'Service',
                        ).length > 0
                      ) {
                        this.setState({
                          category: this.props.posCategories.filter(
                            category => category.values['Type'] === 'Service',
                          )[0].values['Label'],
                        });
                      } else {
                        this.setState({
                          category: '',
                        });
                      }
                      this.setState({
                        scanned: undefined,
                        scannedSKU: undefined,
                        productCodeValue: undefined,
                      });
                    }}
                  >
                    <SVGInline svg={starIcon} className="icon" />
                    <span className="appName">SERVICES</span>
                    <div className="droparrow" />
                  </div>
                  <div
                    className="categoryIconButton package"
                    onClick={e => {
                      $('.topRow .categoryIconButton').removeClass('active');
                      $(e.target)
                        .parents('.categoryIconButton')
                        .addClass('active');
                      this.props.setProductType('Package');
                      if (
                        this.props.posCategories.filter(
                          category => category.values['Type'] === 'Package',
                        ).length > 0
                      ) {
                        this.setState({
                          category: this.props.posCategories.filter(
                            category => category.values['Type'] === 'Package',
                          )[0].values['Label'],
                        });
                      } else {
                        this.setState({
                          category: '',
                        });
                      }
                      this.setState({
                        scanned: undefined,
                        scannedSKU: undefined,
                        productCodeValue: undefined,
                      });
                    }}
                  >
                    <SVGInline svg={starIcon} className="icon" />
                    <span className="appName">PACKAGES</span>
                    <div className="droparrow" />
                  </div>
                  <div className="editProductsView">
                    <label htmlFor="editProductsMode">Edit Products</label>
                    <div className="checkboxFilter">
                      <input
                        id="editProductsMode"
                        type="checkbox"
                        value="1"
                        onChange={e => {
                          this.setState({
                            editProductsSwitch: !this.state.editProductsSwitch,
                            scanned: undefined,
                            scannedSKU: undefined,
                            productCodeValue: undefined,
                          });
                        }}
                      />
                      <label htmlFor="editProductsMode"></label>
                    </div>
                    {}
                  </div>
                  {<SVGInline svg={barcodeIcon} className="barcodeIcon" />}
                  {/*<input
                    type="text"
                    className="searchValue"
                    placeholder="Search by Code..."
                    onChange={e => {
                      this.handleScan(e.target.value);
                    }}
                  />*/}

                  <div
                    className="recordStockButton"
                    onClick={e => {
                      this.setShowRecordStockDialog(true);
                    }}
                  >
                    <img src={addIcon} alt="Add" />
                    <span className="appName">RECORD STOCK</span>
                  </div>
                  {this.state.showRecordStockDialog && (
                    <RecordStockDialogContainer
                      setShowRecordStockDialog={this.setShowRecordStockDialog}
                      products={this.props.posProducts}
                      locale={this.props.locale}
                      currency={this.props.currency}
                      savePOSStock={this.props.savePOSStock}
                      posStockSaving={this.props.posStockSaving}
                      posBarcodes={this.props.posBarcodes}
                    />
                  )}
                  <div
                    className="addButton"
                    onClick={e => {
                      this.setShowAddProductDialog(true);
                    }}
                  >
                    <img src={addIcon} alt="Add" />
                    <span className="appName">
                      ADD{' '}
                      {this.props.productType === 'Apparel'
                        ? 'PRODUCT'
                        : 'SERVICE'}
                    </span>
                  </div>
                  {this.state.showAddProductDialog && (
                    <AddProductDialogContainer
                      setShowAddProductDialog={this.setShowAddProductDialog}
                      productType={this.props.productType}
                      locale={this.props.locale}
                      currency={this.props.currency}
                    />
                  )}
                  <div className="setting">
                    <SVGInline
                      svg={settingsIcon}
                      className="icon"
                      onClick={e => {
                        this.setShowSettings(true);
                      }}
                    />
                  </div>
                </div>
                <div className="secondRow">
                  {this.props.posCategories
                    .filter(category => {
                      if (category.values['Type'] === this.props.productType)
                        return true;
                      return false;
                    })
                    .map((category, index) => {
                      return (
                        <div key={index}>
                          {category.values['Icon'] !== null &&
                          category.values['Icon'] !== '' ? (
                            <div
                              className={
                                index === 0
                                  ? 'categoryIconButton active'
                                  : 'categoryIconButton'
                              }
                              value={category.values['Label']}
                              onClick={e => {
                                $('.secondRow .categoryIconButton').removeClass(
                                  'active',
                                );
                                $(e.target)
                                  .parents('.categoryIconButton')
                                  .addClass('active');
                                this.setState({
                                  category: $(e.target).hasClass(
                                    'categoryIconButton',
                                  )
                                    ? $(e.target).attr('value')
                                    : $(e.target)
                                        .parents('.categoryIconButton')
                                        .attr('value'),
                                });
                              }}
                            >
                              <SVGInline
                                svg={
                                  category.values['Icon'] === 'events'
                                    ? eventIcon
                                    : category.values['Icon'] === 'promotion'
                                    ? promoIcon
                                    : category.values['Icon'] ===
                                      'private_class'
                                    ? privateClassesIcon
                                    : apparelIcon
                                }
                                className={category.values['Icon'] + ' icon'}
                              />
                              <span className="appName">
                                {category.values['Label']}
                              </span>
                              <div className="droparrow" />
                            </div>
                          ) : (
                            <div
                              className={
                                index === 0
                                  ? 'categoryButton active'
                                  : 'categoryButton'
                              }
                              value={category.values['Label']}
                              onClick={e => {
                                $('.secondRow .categoryButton').removeClass(
                                  'active',
                                );
                                $(e.target).hasClass('categoryButton')
                                  ? $(e.target).addClass('active')
                                  : $(e.target)
                                      .parents('.categoryButton')
                                      .addClass('active');
                                this.setState({
                                  category: $(e.target).hasClass(
                                    'categoryButton',
                                  )
                                    ? $(e.target).attr('value')
                                    : $(e.target)
                                        .parents('.categoryButton')
                                        .attr('value'),
                                  scanned: undefined,
                                  scannedSKU: undefined,
                                  productCodeValue: undefined,
                                });
                              }}
                            >
                              <span className="appName">
                                {category.values['Label']}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
                <div className="thirdRow">
                  {this.state.editProductsSwitch &&
                    this.props.posProducts
                      .filter(product => {
                        if (
                          product.values['Categories'].includes(
                            this.state.category,
                          ) &&
                          (product.values['Status'] === 'Active' ||
                            product.values['Status'] === 'Inactive') &&
                          product.values['Product Type'] ===
                            this.props.productType
                        )
                          return true;
                        return false;
                      })
                      .sort((a, b) => {
                        if (
                          b.values['Display Order'] === undefined ||
                          a.values['Display Order'] < b.values['Display Order']
                        ) {
                          return -1;
                        }
                        if (
                          a.values['Display Order'] === undefined ||
                          a.values['Display Order'] > b.values['Display Order']
                        ) {
                          return 1;
                        }

                        return 0;
                      })
                      .map((product, index) => {
                        return (
                          <ProductEditDisplay
                            key={index}
                            product={product}
                            locale={this.locale}
                            currency={this.currency}
                            addProduct={this.props.addProduct}
                            posProducts={this.props.posProducts}
                            refreshProducts={this.refreshProducts}
                          />
                        );
                      })}
                  {!this.state.editProductsSwitch &&
                    this.props.posProducts
                      .filter(product => {
                        if (
                          (this.state.scanned &&
                          this.state.productCodeValue ===
                            (product.values['SKU'] !== null
                              ? product.values['SKU'].trim()
                              : product.values['SKU'])
                            ? true
                            : false) ||
                          (this.state.scanned === undefined &&
                            product.values['Categories'].includes(
                              this.state.category,
                            ) &&
                            product.values['Status'] === 'Active' &&
                            product.values['Product Type'] ===
                              this.props.productType &&
                            (product.values['Product Type'] === 'Apparel'
                              ? product.stock.length > 0
                              : true))
                        )
                          return true;
                        return false;
                      })
                      .sort((a, b) => {
                        if (
                          b.values['Display Order'] === undefined ||
                          a.values['Display Order'] < b.values['Display Order']
                        ) {
                          return -1;
                        }
                        if (
                          a.values['Display Order'] === undefined ||
                          a.values['Display Order'] > b.values['Display Order']
                        ) {
                          return 1;
                        }

                        return 0;
                      })
                      .map((product, index) => {
                        return (
                          <ProductDisplay
                            key={index}
                            product={product}
                            locale={this.locale}
                            currency={this.currency}
                            addProduct={this.props.addProduct}
                            showScanned={
                              this.state.showRecordStockDialog
                                ? false
                                : this.state.scanned
                            }
                            scannedSKU={this.state.scannedSKU}
                            resetScanned={this.resetScanned}
                          />
                        );
                      })}
                  {this.state.scanned && this.state.productCodeValue === '' && (
                    <div className="scannedNotFound">
                      Scanned product with barcode[{this.state.scannedSKU}] does
                      not exist.
                    </div>
                  )}
                </div>
                <div
                  className="ckeckoutIcon"
                  onClick={e => {
                    this.setState({
                      showCheckout: true,
                      showSettings: false,
                    });
                  }}
                >
                  <img src={checkoutIcon} alt="Checkout" />
                  <div className="basketCount">{this.state.productCount}</div>
                </div>
              </div>
            )}
            <BarcodeReader
              onError={this.handleError}
              onScan={this.handleScan}
            />
          </div>
        )}
      </div>
    );
  }
}

export const ProShopView = ({
  profile,
  productType,
  setProductType,
  posCategories,
  posCategoriesLoading,
  posProducts,
  posProductsLoading,
  posStock,
  posBarcodes,
  posBarcodesLoading,
  posDiscounts,
  posDiscountsLoading,
  posCheckout,
  posCheckoutLoading,
  addProduct,
  updatePOSCheckout,
  completePOSCheckout,
  updateMember,
  updateMemberItem,
  autoCreateCardCompleted,
  removeProduct,
  addDiscount,
  updateDiscount,
  removeDiscount,
  space,
  kapp,
  spaceSlug,
  allMembers,
  allLeads,
  fetchLeads,
  leadsLoading,
  snippets,
  savePOSStock,
  posStockSaving,
  fetchPOSCards,
  setPOSCards,
  posCardsLoading,
  posCards,
  SUCCESSFULpaymentHistory,
  autoCreateCard,
  setCreateCard,
  posAutoCreateCardProcessing,
  addNotification,
}) => (
  <ProShop
    profile={profile}
    productType={productType}
    setProductType={setProductType}
    posCategories={posCategories}
    posCategoriesLoading={posCategoriesLoading}
    posProducts={posProducts}
    posProductsLoading={posProductsLoading}
    posStock={posStock}
    posBarcodes={posBarcodes}
    posBarcodesLoading={posBarcodesLoading}
    posDiscounts={posDiscounts}
    posDiscountsLoading={posDiscountsLoading}
    posCheckout={posCheckout}
    posCheckoutLoading={posCheckoutLoading}
    space={space}
    kapp={kapp}
    spaceSlug={spaceSlug}
    completePOSCheckout={completePOSCheckout}
    updateMember={updateMember}
    updateMemberItem={updateMemberItem}
    autoCreateCardCompleted={autoCreateCardCompleted}
    addProduct={addProduct}
    addDiscount={addDiscount}
    updateDiscount={updateDiscount}
    removeDiscount={removeDiscount}
    removeProduct={removeProduct}
    allMembers={allMembers}
    allLeads={allLeads}
    fetchLeads={fetchLeads}
    leadsLoading={leadsLoading}
    snippets={snippets}
    savePOSStock={savePOSStock}
    posStockSaving={posStockSaving}
    fetchPOSCards={fetchPOSCards}
    setPOSCards={setPOSCards}
    posCardsLoading={posCardsLoading}
    posCards={posCards}
    SUCCESSFULpaymentHistory={SUCCESSFULpaymentHistory}
    autoCreateCard={autoCreateCard}
    setCreateCard={setCreateCard}
    posAutoCreateCardProcessing={posAutoCreateCardProcessing}
    addNotification={addNotification}
  />
);

export const ProShopContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('productType', 'setProductType', 'Apparel'),
  withHandlers({
    completePOSCheckout: ({
      savePOSCheckout,
      savePOSSavePurchasedItem,
      decrementPOSStock,
      posCheckout,
      fetchPOSCheckout,
      updatePOSCheckout,
      posProducts,
      profile,
    }) => (
      personType,
      personID,
      firstName,
      lastName,
      payment,
      datetime,
      auth_code,
      transaction_id,
      number,
      subtotal,
      discount,
      salestax,
      total,
    ) => {
      console.log('completePOSCheckout:' + posCheckout);

      savePOSCheckout({
        posCheckout: posCheckout,
        personType: personType,
        personID: personID,
        firstName: firstName,
        lastName: lastName,
        paymentType: payment,
        number: number,
        subtotal: subtotal,
        discount: discount,
        salestax: salestax,
        total: total,
        datetime: datetime,
        auth_code: auth_code,
        transaction_id: transaction_id,
      });

      var products = posCheckout['Checkout Items']['products'];
      products.forEach((product, i) => {
        if (product['productType'] === 'Package') {
          product.packageStock.forEach((stock, i) => {
            var values = {};
            values['Product ID'] = stock['productID'];
            values['Product Name'] = stock['name'];
            values['Person ID'] = personID;
            values['Person Name'] = firstName + ' ' + lastName;
            values['Size'] = stock['size'];
            values['Quantity'] = 1;
            values['Price'] = '';
            savePOSSavePurchasedItem({ values: values });
          });
        } else {
          var values = {};
          values['Product ID'] = product['productID'];
          values['Product Name'] = product['name'];
          values['Person ID'] = personID;
          values['Person Name'] = firstName + ' ' + lastName;
          values['Size'] = product['size'];
          values['Quantity'] = product['quantity'];
          values['Price'] = product['price'];
          savePOSSavePurchasedItem({ values: values });
        }
      });
      products.forEach((product, i) => {
        if (product['productType'] === 'Package') {
          product.packageStock.forEach((stockProd, i) => {
            decrementPOSStock({
              productID: stockProd['productID'],
              size: stockProd['size'],
              quantity: 1,
            });
            var prodIdx = posProducts.findIndex(
              prod => prod.id === stockProd['productID'],
            );
            var stockIdx = posProducts[prodIdx].stock.findIndex(
              stock =>
                stock.values['Product ID'] === stockProd['productID'] &&
                stock.values['Size'] === stockProd['size'],
            );
            posProducts[prodIdx].stock[stockIdx].values['Quantity'] =
              parseInt(
                posProducts[prodIdx].stock[stockIdx].values['Quantity'],
              ) - 1;
          });
        } else if (product['productType'] === 'Service') {
        } else {
          decrementPOSStock({
            productID: product['productID'],
            size: product['size'],
            quantity: product['quantity'],
          });
          var prodIdx = posProducts.findIndex(
            prod => prod.id === product['productID'],
          );
          var stockIdx = posProducts[prodIdx].stock.findIndex(
            stock =>
              stock.values['Product ID'] === product['productID'] &&
              stock.values['Size'] === product['size'],
          );
          posProducts[prodIdx].stock[stockIdx].values['Quantity'] =
            parseInt(posProducts[prodIdx].stock[stockIdx].values['Quantity']) -
            parseInt(product['quantity']);
        }
      });
      posCheckout = {
        id: posCheckout['id'],
        'Checkout Items': {},
      };
      updatePOSCheckout(posCheckout, posProducts);
      //      fetchPOSCheckout({username: profile.username});
    },
    addProduct: ({
      updatePOSCheckout,
      posCheckout,
      fetchPOSCheckout,
      profile,
    }) => (product, stock, quantity) => {
      console.log('added product to basket:' + posCheckout);
      var products =
        posCheckout['Checkout Items']['products'] !== undefined
          ? posCheckout['Checkout Items']['products']
          : [];
      if (product.values['Product Type'] === 'Apparel') {
        products[products.length] = {
          productID: stock.values['Product ID'],
          productType: product.values['Product Type'],
          name: stock.values['Product Name'],
          size: stock.values['Size'],
          colour: stock.values['Colour'],
          sku: stock.values['SKU'],
          price:
            product.values['Discount'] !== null ||
            product.values['Discount'] === ''
              ? product.values['Discount']
              : product.values['Price'],
          quantity: quantity,
        };
      } else if (product.values['Product Type'] === 'Package') {
        var stockItems = [];
        stock.forEach((item, i) => {
          stockItems[stockItems.length] = {
            productID: item.values['Product ID'],
            name: item.values['Product Name'],
            size: item.values['Size'],
            colour: item.values['Colour'],
          };
        });

        products[products.length] = {
          productType: product.values['Product Type'],
          name: product.values['Name'],
          price:
            product.values['Discount'] !== null ||
            product.values['Discount'] === ''
              ? product.values['Discount']
              : product.values['Price'],
          quantity: quantity,
          packageStock: stockItems,
        };
      } else {
        products[products.length] = {
          productType: product.values['Product Type'],
          name: product.values['Name'],
          price:
            product.values['Discount'] !== null ||
            product.values['Discount'] === ''
              ? product.values['Discount']
              : product.values['Price'],
          quantity: quantity,
        };
      }
      posCheckout['Checkout Items']['products'] = products;
      updatePOSCheckout(posCheckout);
      fetchPOSCheckout({ username: profile.username });
    },
    removeProduct: ({
      updatePOSCheckout,
      posCheckout,
      fetchPOSCheckout,
      profile,
    }) => (product, stock, quantity) => {
      console.log('remove product from basket:' + posCheckout);
      var products =
        posCheckout['Checkout Items']['products'] !== undefined
          ? posCheckout['Checkout Items']['products']
          : [];

      var idx = products.findIndex(prod => product === prod.productID);
      products.splice(idx, 1);
      console.log(products);
      posCheckout['Checkout Items']['products'] = products;
      updatePOSCheckout(posCheckout);
      fetchPOSCheckout({ username: profile.username });
    },
    addDiscount: ({
      updatePOSCheckout,
      posCheckout,
      fetchPOSCheckout,
      posDiscounts,
      profile,
    }) => discountid => {
      console.log('add discount to basket:' + posCheckout);
      if (discountid !== undefined) {
        var discount = posDiscounts.find(
          discount => discount.id === discountid,
        );
        posCheckout['Checkout Items']['discountName'] = discount.values['Name'];
        posCheckout['Checkout Items']['discountType'] = discount.values['Type'];
        if (
          discount.values['Voucher'] === undefined ||
          discount.values['Voucher'].length === 0
        ) {
          posCheckout['Checkout Items']['discountValue'] =
            discount.values['Value'];
        } else {
          posCheckout['Checkout Items']['discountValue'] = 0;
          posCheckout['Checkout Items']['voucher'] = 'Voucher';
        }
      }

      updatePOSCheckout(posCheckout);
      fetchPOSCheckout({ username: profile.username });
    },
    updateDiscount: ({
      updatePOSCheckout,
      posCheckout,
      fetchPOSCheckout,
      posDiscounts,
      profile,
    }) => discountValue => {
      console.log('update discount to basket:' + posCheckout);
      posCheckout['Checkout Items']['discountValue'] = discountValue;

      updatePOSCheckout(posCheckout);
      fetchPOSCheckout({ username: profile.username });
    },
    removeDiscount: ({
      updatePOSCheckout,
      posCheckout,
      fetchPOSCheckout,
      posDiscounts,
      profile,
    }) => () => {
      console.log('remove discount from basket:' + posCheckout);
      var checkout = {};

      checkout = {
        id: posCheckout['id'],
        'Checkout Items': {
          products: posCheckout['Checkout Items'].products,
        },
      };
      updatePOSCheckout(checkout);
      fetchPOSCheckout({ username: profile.username });
    },
    savePOSStock: ({ savePOSStock, profile }) => stock => {
      console.log('savePOSStock');
      savePOSStock(stock);
    },
    updateMemberItem: ({
      allMembers,
      updateMember,
      addNotification,
      setSystemError,
    }) => (memberId, profileId) => {
      var memberItem = {};
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberId) {
          memberItem = allMembers[i];
          break;
        }
      }
      memberItem.values['POS Profile ID'] = profileId;
      updateMember({
        id: memberItem.id,
        memberItem,
        allMembers,
        addNotification,
        setSystemError,
      });
    },
    autoCreateCardCompleted: ({ updateMember }) => (profileID, member) => {
      console.log('autoCreateCardCompleted');
      member.values['POS Profile ID'] = profileID;

      updateMember({
        id: member.id,
        memberItem: member,
      });

      posThis.setState({
        posProfileID: profileID,
      });

      posThis.props.fetchPOSCards({
        profileId: profileID,
        setPOSCards: posThis.props.setPOSCards,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchPOSCategories();
      this.props.fetchPOSProducts();
      this.props.fetchPOSBarcodes();
      this.props.fetchPOSDiscounts();
      this.props.fetchPOSCheckout({ username: this.props.profile.username });

      if (
        getAttributeValue(this.props.space, 'POS System') === 'Bambora' &&
        this.props.SUCCESSFULpaymentHistory.length === 0
      ) {
        this.props.fetchPaymentHistory({
          paymentType: 'SUCCESSFUL',
          paymentMethod: 'ALL',
          paymentSource: 'ALL',
          dateField: 'PAYMENT',
          dateFrom: moment()
            .subtract(2, 'month')
            .format('YYYY-MM-DD'),
          dateTo: moment().format('YYYY-MM-DD'),
          setPaymentHistory: this.props.setPaymentHistory,
          internalPaymentType: 'client_successful',
          addNotification: this.props.addNotification,
          setSystemError: this.props.setSystemError,
        });
      }
    },
    componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
    },
    componentWillUnmount() {},
  }),
)(ProShopView);

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

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  allLeads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  posCategories: state.member.pos.posCategories,
  posCategoriesLoading: state.member.pos.posCategoriesLoading,
  posProducts: state.member.pos.posProducts,
  posProductsLoading: state.member.pos.posProductsLoading,
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
});

const mapDispatchToProps = {
  fetchPOSCategories: actions.fetchPOSCategories,
  fetchPOSProducts: actions.fetchPOSProducts,
  fetchPOSDiscounts: actions.fetchPOSDiscounts,
  fetchPOSCheckout: actions.fetchPOSCheckout,
  updatePOSCheckout: actions.updatePOSCheckout,
  savePOSCheckout: actions.savePOSCheckout,
  savePOSSavePurchasedItem: actions.savePOSSavePurchasedItem,
  decrementPOSStock: actions.decrementPOSStock,
  fetchLeads: leadsActions.fetchLeads,
  savePOSStock: actions.savePOSStock,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
var posThis = undefined;
var verifyDeviceCount = 0;

class PayNow extends Component {
  constructor(props) {
    super(props);
    posThis = this;
    this.processPayment = this.processPayment.bind(this);

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
    /*    if (this.checkout===undefined && nextProps.allLeads.length > 0 && !nextProps.leadsLoading){
        this.checkout = new InlineCheckout(uuid());

    } */
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
      this.state.payment === 'creditcard' &&
      (this.state.cvc === '') |
        (this.state.expiry === '') |
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
      this.state.total,
    );
  }
  processDebitSuccesPayment(
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
      customerId: '',
      payment: this.state.total,
      orderId: uuid,
      ccnumber: this.state.number,
      expiry: this.state.expiry,
      cvc: this.state.cvc,
      firstName: this.state.firstName,
      lastName: this.state.lastName,
      description: schoolName + ' sale',
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
  }
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
      description: schoolName + ' sale',
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
    } else if (posSystem === 'DebitSuccess') {
      this.processDebitSuccesPayment(
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
          debugger;
          if (result.error) {
            self.processTokenError(result.error);
            payThis.setState({
              cardToken: '',
              cvc: '',
              expiry: '',
              number: '',
              name: '',
            });
          } else {
            self.processTokenSuccess(result.token);

            payThis.setState({
              cardToken: result['token'],
              cvc: 'XXX',
              expiry: result['expiryMonth'] + '/' + result['expiryYear'],
              number: result['last4'],
              name: payThis.state.name,
            });
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
          this.completeCheckout();
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
          (this.state.status !== '1' && this.state.status !== '') ? (
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
                      for (let i = 0; i < this.props.allMembers.length; i++) {
                        if (this.props.allMembers[i].id === e.value) {
                          firstName = this.props.allMembers[i].values[
                            'First Name'
                          ];
                          lastName = this.props.allMembers[i].values[
                            'Last Name'
                          ];
                          address = this.props.allMembers[i].values['Address'];
                          city = this.props.allMembers[i].values['Suburb'];
                          province = this.props.allMembers[i].values['State'];
                          postCode = this.props.allMembers[i].values[
                            'Postcode'
                          ];
                          phoneNumber = this.props.allMembers[i].values[
                            'Phone Number'
                          ];
                          email = this.props.allMembers[i].values['Email'];
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
                      });
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
                      for (let i = 0; i < this.props.allLeads.length; i++) {
                        if (this.props.allLeads[i].id === e.value) {
                          firstName = this.props.allLeads[i].values[
                            'First Name'
                          ];
                          lastName = this.props.allLeads[i].values['Last Name'];
                          address = this.props.allMembers[i].values['Address'];
                          city = this.props.allMembers[i].values['Suburb'];
                          province = this.props.allMembers[i].values['State'];
                          postCode = this.props.allMembers[i].values[
                            'Postcode'
                          ];
                          phoneNumber = this.props.allMembers[i].values[
                            'Phone Number'
                          ];
                          email = this.props.allMembers[i].values['Email'];
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
              <span className="paymentType">
                <div className="label">Payment Type</div>
                <div className="radioGroup">
                  {getAttributeValue(this.props.space, 'POS System') !==
                    'Square' && (
                    <label htmlFor="creditCard" className="radio">
                      <input
                        id="creditCard"
                        name="cardpayment"
                        type="radio"
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
                          this.setState({ payment: 'capture' });
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
                  <label htmlFor="cash" className="radio">
                    <input
                      id="cash"
                      name="cardpayment"
                      type="radio"
                      disabled={this.disablePaymentType()}
                      value="Cash"
                      onChange={e => {
                        this.setState({ payment: 'cash' });
                      }}
                    />
                    Cash
                  </label>
                </div>
              </span>
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
                  {this.state.deviceStatus === 'CHECKOUT' && (
                    <p>Capturing payment from customer, please wait...</p>
                  )}
                  {this.state.deviceStatus === 'CANCELED' && (
                    <p>Customer cancelled transaction...</p>
                  )}
                  {this.state.status_message !== undefined && (
                    <p>An error has ocurred: {this.state.status_message}</p>
                  )}
                </span>
              ) : (
                <div />
              )}
              {this.state.payment === 'creditcard' &&
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
                        <div class="card-container">
                          <div class="row"></div>
                        </div>
                        <div class="row">
                          <div class="col-lg-12 text-center">
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
              getAttributeValue(this.props.space, 'POS System') !==
                'Bambora' ? (
                <span className="creditCard">
                  <Cards
                    cvc={this.state.cvc}
                    expiry={this.state.expiry}
                    focused={this.state.focus}
                    name={this.state.name}
                    number={this.state.number}
                    acceptedCards={this.state.acceptedCards}
                    callback={params => {
                      posThis.setState({
                        issuer: params.issuer,
                        maxLength: params.maxLength,
                      });
                    }}
                  />
                  <form className="cardDetails">
                    <input
                      type="tel"
                      name="number"
                      maxlength={this.state.maxLength}
                      placeholder="Card Number"
                      onChange={this.handleInputChange}
                      onFocus={this.handleInputFocus}
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="Name"
                      defaultValue={this.state.name}
                      onChange={this.handleInputChange}
                      onFocus={this.handleInputFocus}
                    />
                    <input
                      type="text"
                      name="expiry"
                      placeholder="Valid Thru"
                      maxlength="5"
                      onChange={this.handleInputChange}
                      onFocus={this.handleInputFocus}
                    />
                    <input
                      type="text"
                      name="cvc"
                      placeholder="CVC"
                      maxlength="4"
                      onChange={this.handleInputChange}
                      onFocus={this.handleInputFocus}
                    />
                  </form>
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
            {(!this.state.processingComplete ||
              (this.state.status !== '1' && this.state.status !== '')) &&
              this.state.payment !== 'capture' && (
                <div
                  className="paynowButton"
                  disabled={this.disablePayNow() && !this.state.processing}
                  onClick={e => {
                    if (this.disablePayNow() && !this.state.processing) return;
                    this.setState({
                      processing: true,
                    });
                    if (this.state.payment === 'creditcard') {
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
                      height="35"
                      width="16"
                      radius="2"
                      margin="4"
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

    salestax = parseFloat(
      getAttributeValue(this.props.space, 'POS Sales Tax') === undefined
        ? 0
        : getAttributeValue(this.props.space, 'POS Sales Tax'),
    );

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
            updatePOSCheckout={this.props.updatePOSCheckout}
            fetchPOSCheckout={this.props.fetchPOSCheckout}
            completePOSCheckout={this.props.completePOSCheckout}
            setShowCheckout={this.props.setShowCheckout}
            allMembers={this.props.allMembers}
            allLeads={this.props.allLeads}
            fetchLeads={this.props.fetchLeads}
            leadsLoading={this.props.leadsLoading}
            space={this.props.space}
            kapp={this.props.kapp}
            spaceSlug={this.props.spaceSlug}
            snippets={this.props.snippets}
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
                disabled={this.state.total === 0}
                onClick={e => {
                  if (this.state.total !== 0) {
                    this.setShowPayNow(true);
                  }
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
      showAddProductToCheckoutDialog: false,
    };
  }
  setShowAddProductToCheckoutDialog(show) {
    this.setState({
      showAddProductToCheckoutDialog: show,
    });
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
    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    this.locale = this.props.space.defaultLocale.split('-')[0];
    this.setShowCheckout = this.setShowCheckout.bind(this);
    this.setShowAddProductDialog = this.setShowAddProductDialog.bind(this);
    this.setShowRecordStockDialog = this.setShowRecordStockDialog.bind(this);
    this.refreshProducts = this.refreshProducts.bind(this);

    this.state = {
      category: 'All',
      productCount: 0,
      showCheckout: false,
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
      editProductsSwitch: false,
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

  render() {
    return (
      <div className="proshopContainer">
        {this.props.posCategoriesLoading ||
        this.props.posProductsLoading ||
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
                updatePOSCheckout={this.props.updatePOSCheckout}
                fetchPOSCheckout={this.props.fetchPOSCheckout}
                completePOSCheckout={this.props.completePOSCheckout}
                allMembers={this.props.allMembers}
                allLeads={this.props.allLeads}
                fetchLeads={this.props.fetchLeads}
                leadsLoading={this.props.leadsLoading}
                space={this.props.space}
                kapp={this.props.kapp}
                spaceSlug={this.props.spaceSlug}
                snippets={this.props.snippets}
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
                          });
                        }}
                      />
                      <label htmlFor="editProductsMode"></label>
                    </div>
                    {}
                  </div>
                  <div
                    className="recordStockButton"
                    onClick={e => {
                      this.setShowRecordStockDialog(true);
                    }}
                  >
                    {this.state.showRecordStockDialog && (
                      <RecordStockDialogContainer
                        setShowRecordStockDialog={this.setShowRecordStockDialog}
                        products={this.props.posProducts}
                        locale={this.props.locale}
                        currency={this.props.currency}
                        savePOSStock={this.props.savePOSStock}
                        posStockSaving={this.props.posStockSaving}
                      />
                    )}
                    <img src={addIcon} alt="Add" />
                    <span className="appName">RECORD STOCK</span>
                  </div>
                  <div
                    className="addButton"
                    onClick={e => {
                      this.setShowAddProductDialog(true);
                    }}
                  >
                    {this.state.showAddProductDialog && (
                      <AddProductDialogContainer
                        setShowAddProductDialog={this.setShowAddProductDialog}
                        productType={this.props.productType}
                        locale={this.props.locale}
                        currency={this.props.currency}
                      />
                    )}
                    <img src={addIcon} alt="Add" />
                    <span className="appName">
                      ADD{' '}
                      {this.props.productType === 'Apparel'
                        ? 'PRODUCT'
                        : 'SERVICE'}
                    </span>
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
                          product.values['Categories'].includes(
                            this.state.category,
                          ) &&
                          product.values['Status'] === 'Active' &&
                          product.values['Product Type'] ===
                            this.props.productType &&
                          (product.values['Product Type'] === 'Apparel'
                            ? product.stock.length > 0
                            : true)
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
                          />
                        );
                      })}
                </div>
                <div
                  className="ckeckoutIcon"
                  onClick={e => {
                    this.setState({
                      showCheckout: true,
                    });
                  }}
                >
                  <img src={checkoutIcon} alt="Checkout" />
                  <div className="basketCount">{this.state.productCount}</div>
                </div>
              </div>
            )}
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
  posDiscounts,
  posDiscountsLoading,
  posCheckout,
  posCheckoutLoading,
  addProduct,
  updatePOSCheckout,
  completePOSCheckout,
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
}) => (
  <ProShop
    profile={profile}
    productType={productType}
    setProductType={setProductType}
    posCategories={posCategories}
    posCategoriesLoading={posCategoriesLoading}
    posProducts={posProducts}
    posProductsLoading={posProductsLoading}
    posDiscounts={posDiscounts}
    posDiscountsLoading={posDiscountsLoading}
    posCheckout={posCheckout}
    posCheckoutLoading={posCheckoutLoading}
    space={space}
    kapp={kapp}
    spaceSlug={spaceSlug}
    completePOSCheckout={completePOSCheckout}
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
        if (discount.values['Voucher'] === undefined) {
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
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchPOSCategories();
      this.props.fetchPOSProducts();
      this.props.fetchPOSDiscounts();
      this.props.fetchPOSCheckout({ username: this.props.profile.username });
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

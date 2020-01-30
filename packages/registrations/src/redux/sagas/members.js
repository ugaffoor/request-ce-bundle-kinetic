import { select, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import $ from 'jquery';

import { types, actions } from '../modules/members';
import axios from 'axios';
import moment from 'moment';

export const getBillingServerUrl = state =>
  state.app.kapps
    .find(kapp => kapp.slug === 'services')
    .attributes.find(
      attribute => attribute.name === 'Kinetic Billing Server URL',
    ).values[0];
export const getUserName = state => state.app.profile.username;
export const spaceSlug = 'gbmembers-template'; //hard-coded till we figure out how to retrieve it dynamically
export const billingCompany = 'PaySmart'; //hard-coded till we figure out how to retrieve it dynamically

export const contact_date_format = 'YYYY-MM-DD HH:mm';
const getBillingInfoUrl = '/billingInfo';
const registerUserUrl = '/registerUser';

const util = require('util');

export function* fetchMembers(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member',
      kapp: 'gbmembers',
      search,
    });
    console.log('AllMembers' + submissions);
    yield put(actions.setMembers(submissions));
  } catch (error) {
    console.log('Error in fetchMembers: ' + util.inspect(error));
  }
}

export function* updateCurrentMember(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.memberItem.values,
    });
    if (action.payload.history && action.payload.fromTasks === undefined) {
      action.payload.history.push(
        '/kapps/gbmembers/Member/' + action.payload.id,
      );
    }
    if (action.payload.history && action.payload.fromTasks)
      action.payload.history.push('/kapps/gbmembers/Leads');
    if (action.payload.fetchMembers) action.payload.fetchMembers();
    if (action.payload.fetchMember)
      action.payload.fetchMember({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    console.log('updateCurrentMember:' + submission);
  } catch (error) {
    console.log('Error in updateCurrentMember: ' + util.inspect(error));
  }
}

export function* fetchBillingInfo(action) {
  if (
    action.payload.billingRef === undefined ||
    action.payload.billingRef === ''
  ) {
    yield put(actions.setBillingInfo({}));
  } else {
    const kineticBillingServerUrl = yield select(getBillingServerUrl);
    var args = {
      customerId: action.payload.billingRef,
      space: spaceSlug,
      billingService: billingCompany,
    };
    axios
      .post(kineticBillingServerUrl + getBillingInfoUrl, args)
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          console.log(result.data.errorMessage);
        } else {
          action.payload.setBillingInfo(result.data.data);
        }
      })
      .catch(error => {
        console.log(error.response);
      });
    yield put(actions.setDummy());
  }
}

export function* fetchBillingInfoAfterRegistration(action) {
  const kineticBillingServerUrl = yield select(getBillingServerUrl);
  const username = yield select(getUserName);
  var args = {
    customerId: action.payload.billingRef,
    space: spaceSlug,
    billingService: billingCompany,
  };
  console.log('action:' + action.payload);
  axios
    .post(kineticBillingServerUrl + getBillingInfoUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
      } else {
        // Update memberItem values from billingInfo
        action.payload.memberItem.values['Billing Customer Reference'] =
          result.data.data.customerReference;
        action.payload.memberItem.values['Billing Customer Id'] =
          result.data.data.customerBillingId;
        action.payload.memberItem.values['Billing Payment Type'] =
          result.data.data.paymentMethod;
        action.payload.memberItem.values['Billing Payment Period'] =
          result.data.data.paymentPeriod;
        action.payload.memberItem.values['Payment Schedule'] = {
          period: 'Fortnightly',
          amount: result.data.data.paymentAmountInCents / 100,
        };

        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: username,
          action: 'Setup Billing',
          from: null,
          to:
            'Setup Member Billing with payments of [' +
            result.data.data.paymentAmountInCents / 100 +
            ']',
        });
        action.payload.memberItem.values['Billing Changes'] = changes;

        action.payload.updateMember({
          id: action.payload.memberItem.id,
          memberItem: action.payload.memberItem,
          myThis: action.payload.memberItem.myThis,
          fetchMembers: action.payload.fetchMembers,
        });
      }
    })
    .catch(error => {
      console.log(error.response);
    });
  yield put(actions.setDummy());
}

export function* registerBillingMember(action) {
  let ccNumber = null;
  if (action.payload.billingInfo.values['Credit Card Number']) {
    ccNumber = action.payload.billingInfo.values['Credit Card Number'];
    action.payload.billingInfo.values[
      'Credit Card Number'
    ] = action.payload.billingInfo.values['Credit Card Number'].replace(
      /.(?=.{4,}$)/g,
      '*',
    );
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.billingInfo['id'],
      values: action.payload.billingInfo.values,
    });
  }

  const kineticBillingServerUrl = yield select(getBillingServerUrl);
  let args = {};
  //args.addIfNotExists = '1';
  args.customerId = action.payload.memberItem.values['Member ID'];
  args.firstName = action.payload.billingInfo.values['First Name'];
  args.lastName = action.payload.billingInfo.values['Last Name'];
  args.dob = action.payload.billingInfo.values['DOB'];
  args.address = action.payload.billingInfo.values['Address'];
  args.suburb = action.payload.billingInfo.values['Suburb'];
  args.state = action.payload.billingInfo.values['State'];
  args.postCode = action.payload.billingInfo.values['Postcode'];
  //args.country = 'Australia';
  args.email = action.payload.billingInfo.values['Email'];
  args.driversLicence = action.payload.billingInfo.values['Drivers Licence'];
  args.phoneHome = action.payload.billingInfo.values['Phone Home'];
  args.phoneWork = action.payload.billingInfo.values['Phone Work'];
  args.mobile = action.payload.billingInfo.values['Mobile'];
  args.payment = action.payload.billingInfo.values['Payment'];
  args.firstPayment = action.payload.billingInfo.values['First Payment'];
  args.billingPeriod = action.payload.billingInfo.values['Billing Period'];
  args.contractStartDate =
    action.payload.billingInfo.values['Billing Start Date'];
  args.paymentMethod = action.payload.billingInfo.values['Payment Method'];
  if (args.paymentMethod === 'Credit Card') {
    args.creditCardName = action.payload.billingInfo.values['Name On Card'];
    args.creditCardNumber = ccNumber;
    args.creditCardExpiryMonth =
      action.payload.billingInfo.values['Credit Card Expiry Month'];
    args.creditCardExpiryYear =
      action.payload.billingInfo.values['Credit Card Expiry Year'];
    args.creditCardType = action.payload.billingInfo.values['Credit Card Type'];
  } else if (args.paymentMethod === 'Bank Account') {
    args.bankAccountName = action.payload.billingInfo.values['Account Name'];
    args.bankAccountNumber =
      action.payload.billingInfo.values['Account Number'];
    args.bankAccountBsb = action.payload.billingInfo.values['BSB'];
  }
  args.contractByValue = false;
  args.fta = false;
  args.space = spaceSlug;
  args.billingService = billingCompany;
  args.gbmemberId = action.payload.memberItem['id'];
  args.gbmembersReturn = window.location.href;
  /*
  axios
    .post(kineticBillingServerUrl + registerUserUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('registerBillingMember Error: ' + result.data.errorMessage);
      } else {
        action.payload.memberItem.values['Billing Info Form Id'] =
          action.payload.billingInfo['id'];

        action.payload.fetchBillingInfoAfterRegistration({
          billingRef: action.payload.memberItem.values['Member ID'],
          memberItem: action.payload.memberItem,
          updateMember: action.payload.updateMember,
          fetchMembers: action.payload.fetchMembers,
        });
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
    });
*/
}

export function* watchMembers() {
  console.log('watchMembers');
  yield takeEvery(types.FETCH_MEMBERS, fetchMembers);
  yield takeEvery(types.UPDATE_MEMBER, updateCurrentMember);
  yield takeEvery(types.FETCH_BILLING_INFO, fetchBillingInfo);
  yield takeEvery(
    types.FETCH_BILLING_INFO_AFTER_REGISTRATION,
    fetchBillingInfoAfterRegistration,
  );
  yield takeEvery(types.REGISTER_BILLING_MEMBER, registerBillingMember);
}

function getBillingChanges(memberItem) {
  let changes = memberItem.values['Billing Changes'];
  if (!changes) {
    changes = [];
  } else if (typeof changes !== 'object') {
    changes = JSON.parse(changes);
  }
  return changes;
}

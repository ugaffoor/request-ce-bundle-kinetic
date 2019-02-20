import { select, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/messaging';
import { actions as errorActions } from '../modules/errors';
import axios from 'axios';

export const getAppSettings = state => state.member.app;
const sendSmsUrl = '/send_sms';
const getAccountCreditUrl = '/account_credit';
const util = require('util');

export function* sendSms(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    toNumber: '91' + action.payload.sms.to,
    text: action.payload.sms.text,
    target: action.payload.target,
  };
  axios
    .post(
      appSettings.kapp.attributes['Kinetic Messaging Server URL'] + sendSmsUrl,
      args,
    )
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Send SMS',
        );
      } else {
        console.log(result.data.data);
        /*action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'SMS queued successfully',
          'Send SMS',
        );*/
        if (action.payload.target === 'Member') {
          action.payload.updateMember({
            id: action.payload.memberItem['id'],
            memberItem: action.payload.memberItem,
            fetchMember: action.payload.fetchCurrentMember,
            myThis: this,
          });
        } else if (action.payload.target === 'Leads') {
          action.payload.updateLead({
            id: action.payload.leadItem['id'],
            leadItem: action.payload.leadItem,
            fetchLead: action.payload.fetchLead,
            myThis: this,
          });
        }
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
}

export function* getAccountCredit(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
  };
  axios
    .post(
      appSettings.kapp.attributes['Kinetic Messaging Server URL'] +
        getAccountCreditUrl,
      args,
    )
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Account Details',
        );
      } else {
        console.log(result.data.data);
        action.payload.setAccountCredit(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
}

export function* watchMessaging() {
  yield takeEvery(types.SEND_SMS, sendSms);
  yield takeEvery(types.GET_ACCOUNT_CREDIT, getAccountCredit);
}

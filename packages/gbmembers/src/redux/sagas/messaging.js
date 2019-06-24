import { select, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/messaging';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import axios from 'axios';

export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';
export const getAppSettings = state => state.member.app;
const sendSmsUrl = '/send_sms';
const getAccountCreditUrl = '/account_credit';
const util = require('util');

export function* sendSms(action) {
  const appSettings = yield select(getAppSettings);
  let status = null;
  var args = {
    space: appSettings.spaceSlug,
    toNumber: action.payload.sms.to,
    text: action.payload.sms.text,
    target: action.payload.target,
    submissionId: action.payload['id'],
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
        if (action.payload.target === 'Member') {
          let memberActivities = { values: {} };
          memberActivities.values['Member ID'] =
            action.payload.memberItem['id'];
          memberActivities.values['Type'] = 'SMS';
          memberActivities.values['Direction'] = 'Outbound';
          memberActivities.values['Content'] = {
            To: action.payload.sms.to,
            Content: action.payload.sms.text,
            'Sent Date': moment()
              .utc()
              .format('DD-MM-YYYY hh:mm'),
          };
          action.payload.createMemberActivities({
            memberActivities,
            id: action.payload.id,
            myThis: action.payload.myThis,
            fetchMember: action.payload.fetchMember,
          });
          action.payload.updateMember({
            id: action.payload.memberItem['id'],
            memberItem: action.payload.memberItem,
            history: action.payload.memberItem.history,
          });
        } else if (action.payload.target === 'Leads') {
          let leadActivities = { values: {} };
          leadActivities.values['Lead ID'] = action.payload.leadItem['id'];
          leadActivities.values['Type'] = 'SMS';
          leadActivities.values['Direction'] = 'Outbound';
          leadActivities.values['Content'] = {
            To: action.payload.sms.to,
            Content: action.payload.sms.text,
            'Sent Date': moment()
              .utc()
              .format('DD-MM-YYYY hh:mm'),
          };
          action.payload.createLeadActivities({
            leadActivities,
            id: action.payload.id,
            myThis: action.payload.myThis,
            fetchLead: action.payload.fetchLead,
          });
          action.payload.updateLead({
            id: action.payload.leadItem['id'],
            leadItem: action.payload.leadItem,
            history: action.payload.leadItem.history,
          });
        }
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'SMS queued successfully',
          'Send SMS',
        );
        action.payload.smsInputElm.val('');
      }
    })
    .catch(error => {
      console.log(error);
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

export function* createMemberActivities(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'member-activities',
      values: action.payload.memberActivities.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });
    if (action.payload.fetchMember) {
      action.payload.fetchMember({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    }
  } catch (error) {
    console.log('Error in createMemberActivities: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* createLeadActivities(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'lead-activities',
      values: action.payload.leadActivities.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });
    if (action.payload.fetchLead) {
      action.payload.fetchLead({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    }
  } catch (error) {
    console.log('Error in createLeadActivities: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchMessaging() {
  yield takeEvery(types.SEND_SMS, sendSms);
  yield takeEvery(types.GET_ACCOUNT_CREDIT, getAccountCredit);
  yield takeEvery(types.CREATE_MEMBER_ACTIVITIES, createMemberActivities);
  yield takeEvery(types.CREATE_LEAD_ACTIVITIES, createLeadActivities);
}

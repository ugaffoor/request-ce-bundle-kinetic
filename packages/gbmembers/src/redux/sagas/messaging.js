import { select, call, all, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/messaging';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import axios from 'axios';
import moment from 'moment';

export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';
export const getAppSettings = state => state.member.app;
const sendSmsUrl = '/send_sms';
const sendBulkSmsUrl = '/send_bulk_sms';
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
            'Sent Date': moment().format('DD-MM-YYYY HH:mm'),
          };
          action.payload.createMemberActivities({
            memberActivities,
            id: action.payload.id,
            myThis: action.payload.myThis,
            fetchMember: action.payload.fetchMember,
          });
          var values =
            action.payload.values !== undefined
              ? action.payload.values
              : action.payload.memberItem.values;

          action.payload.updateMember({
            id: action.payload.memberItem['id'],
            memberItem: action.payload.memberItem,
            values: values,
            history: action.payload.memberItem.history,
            fetchMemberAdditional: action.payload.fetchMemberAdditional,
          });
        } else if (action.payload.target === 'Leads') {
          let leadActivities = { values: {} };
          leadActivities.values['Lead ID'] = action.payload.leadItem['id'];
          leadActivities.values['Type'] = 'SMS';
          leadActivities.values['Direction'] = 'Outbound';
          leadActivities.values['Content'] = {
            To: action.payload.sms.to,
            Content: action.payload.sms.text,
            'Sent Date': moment().format('DD-MM-YYYY HH:mm'),
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
            showLead: true,
            history: action.payload.leadItem.history,
          });
        }
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'SMS queued successfully',
          'Send SMS',
        );
        if (action.payload.smsInputElm !== undefined)
          action.payload.smsInputElm.val('');
      }
    })
    .catch(error => {
      console.log(error);
      //action.payload.setSystemError(error);
    });
}

export function* sendBulkSms(action) {
  const appSettings = yield select(getAppSettings);
  let status = null;
  var args = {
    space: appSettings.spaceSlug,
    toNumbers: action.payload.phoneNumbers,
    text: action.payload.campaignItem.values['SMS Content'],
    target: action.payload.target,
  };
  axios
    .post(
      appSettings.kapp.attributes['Kinetic Messaging Server URL'] +
        sendBulkSmsUrl,
      args,
    )
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Create sms campaign',
        );
      } else {
        console.log(result.data.data);
        let deliveredToMemberIds = result.data.data['deliveredToIds'];
        if (action.payload.target === 'Member') {
          for (let i = 0; i < args.toNumbers.length; i++) {
            if (!deliveredToMemberIds.includes(args.toNumbers[i]['id'])) {
              continue;
            }
            let memberActivities = { values: {} };
            memberActivities.values['Member ID'] = args.toNumbers[i]['id'];
            memberActivities.values['Type'] = 'SMS';
            memberActivities.values['Direction'] = 'Outbound';
            memberActivities.values['Content'] = {
              To: args.toNumbers[i]['number'],
              Content: action.payload.campaignItem.values['SMS Content'],
              'Sent Date': moment().format('DD-MM-YYYY HH:mm'),
            };

            action.payload.createMemberActivities({
              memberActivities,
              myThis: action.payload.myThis,
            });
          }
          action.payload.fetchMembers();
        }
        if (action.payload.target === 'Lead') {
          for (let i = 0; i < args.toNumbers.length; i++) {
            if (!deliveredToMemberIds.includes(args.toNumbers[i]['id'])) {
              continue;
            }
            let leadActivities = { values: {} };
            leadActivities.values['Lead ID'] = args.toNumbers[i]['id'];
            leadActivities.values['Type'] = 'SMS';
            leadActivities.values['Direction'] = 'Outbound';
            leadActivities.values['Content'] = {
              To: args.toNumbers[i]['number'],
              Content: action.payload.campaignItem.values['SMS Content'],
              'Sent Date': moment().format('DD-MM-YYYY HH:mm'),
            };

            action.payload.createLeadActivities({
              leadActivities,
              myThis: action.payload.myThis,
            });
          }
        }

        if (action.payload.history)
          action.payload.history.push('/kapps/gbmembers/Send');
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
        allMembers: action.payload.allMembers,
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

export function* getIndividualSMS(action) {
  try {
    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch()
      .eq('values[Type]', 'SMS')
      .eq('values[Direction]', 'Outbound')
      .include(['details', 'values'])
      .startDate(
        moment()
          .subtract(31, 'days')
          .toDate(),
      )
      .endDate(moment().toDate())
      .limit(25)
      .build();
    const LEAD_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch()
      .eq('values[Type]', 'SMS')
      .eq('values[Direction]', 'Outbound')
      .include(['details', 'values'])
      .startDate(
        moment()
          .subtract(31, 'days')
          .toDate(),
      )
      .endDate(moment().toDate())
      .limit(25)
      .build();
    const [memberActivities, leadActivities] = yield all([
      call(CoreAPI.searchSubmissions, {
        form: 'member-activities',
        kapp: 'gbmembers',
        search: MEMBER_ACTIVITIES_SEARCH,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'lead-activities',
        kapp: 'gbmembers',
        search: LEAD_ACTIVITIES_SEARCH,
      }),
    ]);

    let individualSMS = [];
    for (let i = 0; i < memberActivities.submissions.length; i++) {
      let contents = JSON.parse(
        memberActivities.submissions[i].values['Content'],
      );
      individualSMS[individualSMS.length] = {
        id: memberActivities.submissions[i].values['Member ID'],
        Type: 'Member',
        To: contents['To'],
        Date: contents['Sent Date'],
        Content: contents['Content'],
      };
    }
    for (let i = 0; i < leadActivities.submissions.length; i++) {
      let contents = JSON.parse(
        leadActivities.submissions[i].values['Content'],
      );
      individualSMS[individualSMS.length] = {
        id: leadActivities.submissions[i].values['Lead ID'],
        Type: 'Lead',
        To: contents['To'],
        Date: contents['Sent Date'],
        Content: contents['Content'],
      };
    }
    individualSMS = individualSMS.sort((a, b) => {
      if (a['Date'] < b['Date']) {
        return -1;
      }
      if (a['Date'] > b['Date']) {
        return 1;
      }
      return 0;
    });

    yield put(action.payload.setIndividualSMS(individualSMS));
  } catch (error) {
    console.log('Error in getIndividualSMS: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchMessaging() {
  yield takeEvery(types.SEND_SMS, sendSms);
  yield takeEvery(types.SEND_BULK_SMS, sendBulkSms);
  yield takeEvery(types.GET_ACCOUNT_CREDIT, getAccountCredit);
  yield takeEvery(types.CREATE_MEMBER_ACTIVITIES, createMemberActivities);
  yield takeEvery(types.CREATE_LEAD_ACTIVITIES, createLeadActivities);
  yield takeEvery(types.GET_INDIVIDUAL_SMS, getIndividualSMS);
}

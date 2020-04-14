import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import $ from 'jquery';

import { types, actions } from '../modules/members';
import { getJson } from '../../components/Member/MemberUtils';
import axios from 'axios';
import moment from 'moment';
import { contact_date_format } from '../../components/leads/LeadsUtils';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';
export const TOO_MANY_STATUS_STRING = 'Your filter matches too many items.';

export const USER_INCLUDES = 'details,attributes,profile.attributes';
export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';

export const getAppSettings = state => state.member.app;
export const getCurrentMember = state => state.currentMember;
export const getNewMember = state => state.newMember;

const getBillingInfoUrl = '/billingInfo';
const getPaymentsUrl = '/payments';
const getScheduledPaymentsUrl = '/scheduledPayments';
const ChangeScheduledAmountUrl = '/scheduledAmountChange';
const createScheduleUrl = '/createSchedule';
const clearScheduleUrl = '/clearSchedule';
const registerUserUrl = '/registerUser';
const updatePaymentMethodUrl = '/savePaymentMethod';
const refundTransactionUrl = '/refundTransaction';
const getNewCustomersUrl = '/newCustomers';
const ddrStatusUrl = '/getDDRStatus';
const actionRequestsUrl = '/getActionRequests';
const getVariationsUrl = '/getVariations';
const getCustomersUrl = '/getCustomers';
const getInactiveCustomersCountUrl = '/getInactiveCustomersCount';

const util = require('util');

export function* fetchMembers(action) {
  try {
    const appSettings = yield select(getAppSettings);
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
    let memberInfo = {
      members: submissions,
      belts: appSettings.belts,
    };
    yield put(actions.setMembers(memberInfo));
  } catch (error) {
    console.log('Error in fetchMembers: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchCurrentMember(action) {
  try {
    const appSettings = yield select(getAppSettings);
    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member ID]', action.payload.id)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const [submission, memberActivities] = yield all([
      call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'member-activities',
        kapp: 'gbmembers',
        search: MEMBER_ACTIVITIES_SEARCH,
      }),
    ]);

    if (action.payload.myThis) submission.myThis = action.payload.myThis;
    if (action.payload.history) submission.history = action.payload.history;
    if (action.payload.fetchMembers)
      submission.fetchMembers = action.payload.fetchMembers;
    if (action.payload.forBilling)
      submission.forBilling = action.payload.forBilling;

    // Add Email Sent/Recieved submissions
    let emailSentContent = [];
    let emailReceivedContent = [];
    let smsContent = [];
    let requestContent = [];
    let promotionContent = [];
    for (let i = 0; i < memberActivities.submissions.length; i++) {
      if (
        memberActivities.submissions[i].values['Type'] === 'Email' &&
        memberActivities.submissions[i].values['Direction'] === 'Outbound'
      ) {
        emailSentContent[emailSentContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
      }
      if (
        memberActivities.submissions[i].values['Type'] === 'Email' &&
        memberActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        emailReceivedContent[emailReceivedContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
        emailReceivedContent[emailReceivedContent.length - 1]['Activity ID'] =
          memberActivities.submissions[i].id;
      }
      if (memberActivities.submissions[i].values['Type'] === 'SMS') {
        smsContent[smsContent.length] = memberActivities.submissions[i];
      }
      if (
        memberActivities.submissions[i].values['Type'] === 'Request' &&
        memberActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        requestContent[requestContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
      }
      if (memberActivities.submissions[i].values['Type'] === 'Promotion') {
        var content = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
        content['Submitter'] = memberActivities.submissions[i].updatedBy;
        promotionContent[promotionContent.length] = content;
      }
    }

    submission.submission.emailsReceived = emailReceivedContent;
    submission.submission.emailsSent = emailSentContent;
    submission.submission.smsContent = smsContent;
    submission.submission.requestContent = requestContent;
    submission.submission.promotionContent = promotionContent;
    if (action.payload.setInitialLoad) {
      console.log('members.js setInitialLoad 111');
    }

    if (action.payload.myThis)
      submission.submission.myThis = action.payload.myThis;
    /*    if (action.payload.history) submission.history = action.payload.history;
    if (action.payload.fetchMembers)
      submission.fetchMembers = action.payload.fetchMembers;
    if (action.payload.forBilling)
      submission.forBilling = action.payload.forBilling;
*/
    let memberInfo = {
      member: submission.submission,
      belts: appSettings.belts,
    };
    yield put(actions.setCurrentMember(memberInfo));
    /*

    const { submission } = yield call(CoreAPI.fetchSubmission, {
      id: action.payload.id,
      include: SUBMISSION_INCLUDES,
    });
    if (action.payload.myThis) submission.myThis = action.payload.myThis;
    if (action.payload.history) submission.history = action.payload.history;
    if (action.payload.fetchMembers)
      submission.fetchMembers = action.payload.fetchMembers;
    if (action.payload.forBilling)
      submission.forBilling = action.payload.forBilling;

    yield put(actions.setCurrentMember(submission));
*/
  } catch (error) {
    console.log('Error in fetchCurrentMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchMemberPromotions(action) {
  try {
    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member ID]', action.payload.id)
      .eq('values[Type]', 'Promotion')
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member-activities',
      kapp: 'gbmembers',
      search: MEMBER_ACTIVITIES_SEARCH,
    });

    let promotionContent = [];
    for (let i = 0; i < submissions.length; i++) {
      if (submissions[i].values['Type'] === 'Promotion') {
        var content = JSON.parse(submissions[i].values['Content']);
        content['Submitter'] = submissions[i].updatedBy;
        promotionContent[promotionContent.length] = content;
      }
    }

    yield put(action.payload.setMemberPromotions(promotionContent));
  } catch (error) {
    console.log('Error in fetchMemberPromotions: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchNewMember(action) {
  var member = {
    values: {},
  };
  yield put(actions.setNewMember(member));
  console.log('fetchNewMember:' + member);
  if (action.payload.myThis) member.myThis = action.payload.myThis;
  if (action.payload.history) member.history = action.payload.history;
  if (action.payload.fetchMembers)
    member.fetchMembers = action.payload.fetchMembers;
  if (action.payload.allMembers) member.allMembers = action.payload.allMembers;
}

export function* updateCurrentMember(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.memberItem.values,
    });
    if (
      action.payload.history &&
      action.payload.fromTasks === undefined &&
      action.payload.fromBilling === undefined
    ) {
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
    yield put(
      errorActions.addSuccess('Member updated successfully', 'Update Member'),
    );
  } catch (error) {
    console.log('Error in updateCurrentMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* createMember(action) {
  try {
    action.payload.memberItem.myThis = undefined;
    action.payload.memberItem.history = undefined;
    action.payload.memberItem.fetchMembers = undefined;
    if (
      action.payload.leadItem !== undefined &&
      action.payload.leadItem.values !== undefined &&
      action.payload.leadItem.values['Source'] !== undefined
    )
      action.payload.memberItem.values['Lead Source'] =
        action.payload.leadItem.values['Source'];
    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'member',
      values: action.payload.memberItem.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });

    //if leadId is present then the lead is being converted into a member
    if (action.payload.leadId) {
      action.payload.leadItem.values['Status'] = 'Converted';
      action.payload.leadItem.values['Lead State'] = 'Converted';
      action.payload.leadItem.values['Converted Member ID'] = submission.id;
      action.payload.updateLead({
        id: action.payload.leadItem['id'],
        leadItem: action.payload.leadItem,
      });
    }

    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Member/' + submission.id);
    if (action.payload.fetchMembers) action.payload.fetchMembers();

    if (
      action.payload.showNotification === undefined ||
      action.payload.showNotification !== false
    ) {
      yield put(
        errorActions.addSuccess('Member created successfully', 'Create Member'),
      );
    }
  } catch (error) {
    console.log('Error in createMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteMember(action) {
  try {
    const { submission } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.memberItem.id,
    });
    if (action.payload.history) action.payload.history.push('/Home');
    if (action.payload.fetchMembers) action.payload.fetchMembers();

    yield put(
      errorActions.addSuccess('Member deleted successfully', 'Delete Member'),
    );
  } catch (error) {
    console.log('Error in deleteMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchBillingInfo(action) {
  if (
    action.payload.billingRef === undefined ||
    action.payload.billingRef === ''
  ) {
    yield put(actions.setBillingInfo({}));
  } else {
    const appSettings = yield select(getAppSettings);
    var args = {
      customerId: action.payload.billingRef,
      space: appSettings.spaceSlug,
      billingService: appSettings.billingCompany,
    };
    axios
      .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          console.log(result.data.errorMessage);
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Billing Info',
          );
        } else {
          action.payload.setBillingInfo(result.data.data);
        }
      })
      .catch(error => {
        console.log(error.response);
        //action.payload.setSystemError(error);
      });
    yield put(actions.setDummy());
  }
}

export function* fetchBillingInfoAfterRegistration(action) {
  if (
    action.payload.billingRef === undefined ||
    action.payload.billingRef === ''
  ) {
    yield put(actions.setBillingInfo({}));
  } else {
    const appSettings = yield select(getAppSettings);
    var args = {
      customerId: action.payload.billingRef,
      space: appSettings.spaceSlug,
      billingService: appSettings.billingCompany,
    };
    console.log('action:' + action.payload);
    axios
      .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          console.log(result.data.errorMessage);
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Billing Info After Registration',
          );
        } else {
          action.payload.setBillingInfo(result.data.data);
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
            user: appSettings.profile.username,
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
            fetchMember: action.payload.fetchCurrentMember,
          });
        }
      })
      .catch(error => {
        console.log(error.response);
        //action.payload.setSystemError(error);
      });
    yield put(actions.setDummy());
  }
}

export function* syncBillingCustomer(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    customerId: action.payload.billingRef,
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Sync Billing Customer',
        );
      } else {
        action.payload.setBillingInfo(result.data.data);
        // Update memberItem values from billingInfo
        action.payload.memberItem.values['Billing Customer Reference'] =
          result.data.data.customerReference;
        action.payload.memberItem.values['Billing Customer Id'] =
          result.data.data.customerBillingId;
        action.payload.memberItem.values['Billing User'] = 'YES';
        action.payload.memberItem.values['Billing Payment Type'] =
          result.data.data.paymentMethod;
        action.payload.memberItem.values['Billing Payment Period'] =
          result.data.data.paymentPeriod;
        action.payload.memberItem.values['Payment Schedule'] = {
          period: result.data.data.paymentPeriod,
          amount: result.data.data.paymentAmountInCents / 100,
        };
        action.payload.memberItem.values['Membership Cost'] =
          result.data.data.paymentAmountInCents / 100;

        if (
          result.data.data.statusDescription === 'Inactive' &&
          action.payload.memberItem.values['Status'] !== 'Inactive'
        ) {
          action.payload.memberItem.values['Status'] = 'Inactive';
          let history = getJson(
            action.payload.memberItem.values['Status History'],
          );
          let newHistory = {
            submitter: appSettings.profile.displayName,
            date: moment().toString(),
            status: 'Inactive',
          };
          history.push(newHistory);
          action.payload.memberItem.values['Status History'] = history;
        }
        if (
          result.data.data.statusDescription === 'Frozen' &&
          action.payload.memberItem.values['Status'] !== 'Frozen'
        ) {
          action.payload.memberItem.values['Status'] = 'Frozen';
          let history = getJson(
            action.payload.memberItem.values['Status History'],
          );
          let newHistory = {
            submitter: appSettings.profile.displayName,
            date: moment().toString(),
            status: 'Frozen',
          };
          history.push(newHistory);
          action.payload.memberItem.values['Status History'] = history;
        }
        //        action.payload.memberItem.values['DDR Status'] = 'Pending';

        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Sync Billing Customer',
          from: null,
          to:
            'Synced Member Billing with payments of [' +
            result.data.data.paymentAmountInCents / 100 +
            ']',
        });
        action.payload.memberItem.values['Billing Changes'] = changes;

        action.payload.updateMember({
          id: action.payload.memberItem.id,
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Billing customer synced successfully',
          'Sync Billing Customer',
        );
        let memberInfo = {
          member: action.payload.memberItem,
          belts: appSettings.belts,
        };
        action.setCurrentMember(memberInfo);

        /*        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.fetchMembers();
*/
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* fetchNewCustomers(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getNewCustomersUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get New Customers',
        );
      } else {
        action.payload.setNewCustomers(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* editPaymentAmount(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    customerId: action.payload.billingRef,
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    changeFromPaymentNumber: action.payload.changeFromPaymentNumber,
    changeFromDate: action.payload.changeFromDate,
    newPaymentAmountInCents: action.payload.newPaymentAmountInCents,
    applyToAllFuturePayments: action.payload.applyToAllFuturePayments,
    keepManualPayments: action.payload.keepManualPayments,
    scheduleStartDate: action.payload.scheduleStartDate,
    scheduleResumeDate: action.payload.scheduleResumeDate,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + ChangeScheduledAmountUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Edit Payment Amount',
        );
      } else {
        console.log('ChangeScheduledAmount result =' + result.data.data);
        if (action.payload.billingChangeReason) {
          let changes = getBillingChanges(action.payload.memberItem);
          changes.push({
            date: moment().format(contact_date_format),
            user: appSettings.profile.username,
            action: 'Change Payment Amount',
            to:
              'Payment amount changed to [' +
              action.payload.memberItem.values['Membership Cost'] +
              ']',
            reason: action.payload.billingChangeReason,
          });
          action.payload.memberItem.values['Billing Changes'] = changes;
          action.payload.updateMember({
            id: action.payload.memberItem.id,
            memberItem: action.payload.memberItem,
          });
        }
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment amount edited successfully',
          'Edit Payment Amount',
        );
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}

export function* fetchPaymentHistory(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
    customerId: action.payload.billingRef,
    internalPaymentType: action.payload.internalPaymentType,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Payment History',
        );
      } else {
        action.payload.setPaymentHistory(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* fetchBillingPayments(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
    internalPaymentType: action.payload.internalPaymentType,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Billing Payments',
        );
      } else {
        action.payload.setBillingPayments(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}

export function* fetchProcessedAndScheduledPayments(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
  };
  console.log('action:' + action.payload);
  let allPayments = [];
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Billing Payments',
        );
      } else {
        allPayments.processedPayments = result.data.data;
        var args1 = {
          space: appSettings.spaceSlug,
          billingService: appSettings.billingCompany,
          dateFrom: action.payload.dateFrom,
          dateTo: action.payload.dateTo,
        };

        axios
          .post(
            appSettings.kineticBillingServerUrl + getScheduledPaymentsUrl,
            args1,
          )
          .then(result1 => {
            if (result1.data.Error && result1.data.Error > 0) {
              console.log(result1.data.ErrorMessage);
              action.payload.addNotification(
                NOTICE_TYPES.ERROR,
                result.data.errorMessage,
                'Get Scheduled Payments',
              );
            } else {
              allPayments.scheduledPayments = result1.data.data;
              action.payload.setProcessedAndScheduledPayments(allPayments);
            }
          })
          .catch(error => {
            console.log(error.response);
            //action.payload.setSystemError(error);
          });
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}

export function* clearPaymentSchedule(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    customerId: action.payload.billingRef,
    keepManualPayments: action.payload.keepManualPayments,
    startDate: action.payload.startDate,
    resumeDate: action.payload.resumeDate,
  };

  axios
    .post(appSettings.kineticBillingServerUrl + clearScheduleUrl, args)
    .then(result => {
      //console.log("clearPaymentSchedule # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Clear Payment Schedule',
        );
      } else {
        console.log(result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Clear Schedule',
          to: {
            startDate: action.payload.startDate,
            resumeDate: action.payload.resumeDate,
          },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.memberItem.values['Payment Schedule'] = undefined;
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment schedule cleared successfully',
          'Clear Payment Schedule',
        );
      }
    })
    .catch(error => {
      console.log(JSON.stringify(error));
      action.payload.setSystemError(error);
    });
}

export function* createPaymentSchedule(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId = action.payload.billingRef;
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.scheduleStartDate = action.payload.scheduleStartDate;
  args.scheduleResumeDate = action.payload.scheduleResumeDate;
  args.schedulePeriodType = action.payload.schedulePeriodType;
  if (action.payload.dayOfWeek) {
    args.dayOfWeek = action.payload.dayOfWeek;
  }
  args.dayOfMonth = action.payload.dayOfMonth;
  args.paymentAmountInCents = action.payload.paymentAmountInCents;
  args.limitToNumberOfPayments = action.payload.limitToNumberOfPayments;
  args.limitToTotalAmountInCents = action.payload.limitToTotalAmountInCents;
  args.keepManualPayments = action.payload.keepManualPayments;
  args.scheduleType = 'UNENDING'; //for integraPay

  axios
    .post(appSettings.kineticBillingServerUrl + createScheduleUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Create Payment Schedule',
        );
      } else {
        console.log(result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Create Schedule',
          to: {
            period: 'Fortnightly',
            amount: action.payload.paymentAmountInCents / 100,
            startDate: action.payload.scheduleStartDate,
            endDate: action.payload.scheduleResumeDate,
          },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.memberItem.values['Payment Schedule'] = {
          period: 'Fortnightly',
          amount: action.payload.paymentAmountInCents / 100,
        };
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment schedule created successfully',
          'Create Payment Schedule',
        );
      }
    })
    .catch(error => {
      console.log('Error in createPaymentSchedule: ' + util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function fetchFamilyMembers(action) {
  let members = [];
  if (action.payload.currentMember && action.payload.allMembers) {
    members = action.payload.allMembers.filter(member => {
      return getJson(
        action.payload.currentMember.values['Billing Family Members'],
      ).some(memberid => memberid === member['id']);
    });
  }

  var clonedMembers = [];
  members.forEach(member => {
    clonedMembers.push($.extend(true, {}, member));
  });

  console.log(
    '# Redux # fetchFamilyMembers called, size=' + clonedMembers.length,
  );
  action.payload.setFamilyMembers(clonedMembers);
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

  const appSettings = yield select(getAppSettings);
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
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.gbmemberId = action.payload.memberItem['id'];
  args.gbmembersReturn = window.location.href;

  axios
    .post(appSettings.kineticBillingServerUrl + registerUserUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('registerBillingMember Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Register Billing Member',
        );
      } else {
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Billing Member registered successfully',
          'Register Billing Member',
        );

        action.payload.memberItem.values['Billing Info Form Id'] =
          action.payload.billingInfo['id'];

        action.payload.fetchBillingInfoAfterRegistration({
          billingRef: action.payload.memberItem.values['Member ID'],
          memberItem: action.payload.memberItem,
          setBillingInfo: action.payload.setBillingInfo,
          updateMember: action.payload.updateMember,
          fetchCurrentMember: action.payload.fetchCurrentMember,
          addNotification: action.payload.addNotification,
        });
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function* editPaymentMethod(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId =
    action.payload.memberItem.values['Billing Customer Reference'];
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.paymentMethod = action.payload.paymentMethod.methodName;
  if (action.payload.paymentMethod.methodName === 'CREDITCARD') {
    args.creditCardNumber = action.payload.paymentMethod.creditCardNumber;
    args.creditCardType = action.payload.paymentMethod.creditCardType;
    args.creditCardExpiryDate =
      action.payload.paymentMethod.creditCardExpiryDate;
    args.creditCardName = action.payload.paymentMethod.creditCardName;
  } else if (action.payload.paymentMethod.methodName === 'BANKACCOUNT') {
    args.bankAccountBsb = action.payload.paymentMethod.bankAccountBsb;
    args.bankAccountNumber = action.payload.paymentMethod.bankAccountNumber;
    args.bankAccountName = action.payload.paymentMethod.bankAccountName;
    //args.bankAccountType = action.payload.paymentMethod.bankAccountType; For USA customers only, for all other countries this parameter can be blank. if used value must be "CHECK" or "SAVINGS"
  }

  axios
    .post(appSettings.kineticBillingServerUrl + updatePaymentMethodUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('editPaymentMethod Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Edit Payment Method',
        );
      } else {
        console.log('#### Response = ' + result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Edit Payment Method',
          to: { method: action.payload.paymentMethod.methodName },
          reason: action.payload.editPaymentTypeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment method updated successfully',
          'Update Payment Method',
        );
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function* refundTransaction(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.customerId =
    action.payload.memberItem.values['Billing Customer Reference'];
  args.transactionId = action.payload.transactionId;
  args.bankReceiptId = action.payload.bankReceiptId;
  args.refundAmount = action.payload.refundAmount;

  axios
    .post(appSettings.kineticBillingServerUrl + refundTransactionUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('refundTransaction Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Refund Transaction',
        );
      } else {
        console.log('#### Response = ' + result.data.data);
        let paymentsRefunded =
          typeof action.payload.memberItem.values['Refunded Payments'] ===
          'object'
            ? action.payload.memberItem.values['Refunded Payments']
            : action.payload.memberItem.values['Refunded Payments']
            ? JSON.parse(action.payload.memberItem.values['Refunded Payments'])
            : [];

        paymentsRefunded.push(action.payload.transactionId);
        action.payload.memberItem.values[
          'Refunded Payments'
        ] = paymentsRefunded;

        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Refund Transaction',
          to: { amount: +action.payload.refundAmount / 100 },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment refunded successfully',
          'Refund Transaction',
        );
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function* fetchDdrStatus(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.customerId = action.payload.memberItem.values['Billing Customer Id'];
  axios
    .post(appSettings.kineticBillingServerUrl + ddrStatusUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('fetchDdrStatus Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get DDR Status',
        );
      } else {
        if (
          !action.payload.memberItem.values['DDR Status'] ||
          action.payload.memberItem.values['DDR Status'] !==
            result.data.data.ddrStatus
        ) {
          action.payload.memberItem.values['DDR Status'] =
            result.data.data.ddrStatus;
          action.payload.updateMember({
            id: action.payload.memberItem['id'],
            memberItem: action.payload.memberItem,
            fetchMember: action.payload.fetchMember,
            fetchMembers: action.payload.fetchMembers,
            mythis: action.payload.myThis,
          });
        }
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchActionRequests(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId = action.payload.customerId;
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  axios
    .post(appSettings.kineticBillingServerUrl + actionRequestsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('fetchActionRequests Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Action Requests',
        );
      } else {
        action.payload.setActionRequests(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchVariationCustomers(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  axios
    .post(appSettings.kineticBillingServerUrl + getVariationsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(
          'fetchVariationCustomers Error: ' + result.data.errorMessage,
        );
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Variation Customers',
        );
      } else {
        action.payload.setVariationCustomers(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchBillingCustomers(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.active = true;
  axios
    .post(appSettings.kineticBillingServerUrl + getCustomersUrl, args)
    .then(resultActive => {
      if (resultActive.data.error && resultActive.data.error > 0) {
        console.log(
          'loadBillingCustomers Error: ' + resultActive.data.errorMessage,
        );
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          resultActive.data.errorMessage,
          'Get Billing Customers',
        );
      } else {
        console.log(
          '#### loadBillingCustomers ACTIVE # data = ' +
            JSON.stringify(resultActive.data.data),
        );
      }
      args.active = false;
      axios
        .post(appSettings.kineticBillingServerUrl + getCustomersUrl, args)
        .then(resultInactive => {
          if (resultInactive.data.error && resultInactive.data.error > 0) {
            console.log(
              'loadBillingCustomers Error: ' + resultInactive.data.errorMessage,
            );
            action.payload.addNotification(
              NOTICE_TYPES.ERROR,
              resultInactive.data.errorMessage,
              'Get Billing Customers',
            );
          } else {
            console.log(
              '#### loadBillingCustomers INACTIVE # data = ' +
                JSON.stringify(resultInactive.data.data),
            );
            action.payload.createBillingMembers({
              customers: resultActive.data.data.concat(
                resultInactive.data.data,
              ),
              setBillingCustomers: action.payload.setBillingCustomers,
              fetchMembers: action.payload.fetchMembers,
              appSettings: appSettings,
              allMembers: action.payload.allMembers,
            });
          }
        })
        .catch(error => {
          console.log(util.inspect(error));
          action.payload.setSystemError(error);
        });
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* createBillingMembers(action) {
  let newMemberAdded = false;
  let newMembers = [];
  for (let i = 0; i < action.payload.customers.length; i++) {
    let customer = action.payload.customers[i];

    const MEMBER_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Billing Customer Id]', customer.customerId)
      .include('details,values')
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member',
      kapp: 'gbmembers',
      search: MEMBER_SEARCH,
    });
    //    console.log(
    //      '#### createMembers # submissions = ' + util.inspect(submissions),
    //    );
    console.log(
      'Name:' +
        customer.firstName +
        ' ' +
        customer.lastName +
        ' - PaySmartID:' +
        customer.customerId +
        ' - Status:' +
        customer.status +
        (!submissions || submissions.length <= 0
          ? 'NEW'
          : submissions[0].values['Status']),
    );

    var memberItem = {
      values: {},
    };
    if (!submissions || submissions.length <= 0) {
      let memberId =
        customer.firstName.charAt(0).toLowerCase() +
        customer.firstName.slice(1) +
        customer.lastName.charAt(0).toLowerCase() +
        customer.lastName.slice(1);

      let memberidInc = 0;
      action.payload.allMembers.forEach(member => {
        if (
          member.values['Member ID'] !== null &&
          member.values['Member ID'].indexOf(memberId) !== -1
        ) {
          memberidInc++;
        }
      });
      newMembers.forEach(member => {
        if (member.values['Member ID'].indexOf(memberId) !== -1) {
          memberidInc++;
        }
      });

      memberItem.values['Status'] = customer.status;

      memberItem.values['First Name'] = customer.firstName;
      memberItem.values['Last Name'] = customer.lastName;
      memberItem.values['Member ID'] =
        memberId + (memberidInc !== 0 ? memberidInc : '');
      memberItem.values['Address'] = customer.address;
      memberItem.values['Suburb'] = customer.suburb;
      memberItem.values['State'] = customer.state;
      memberItem.values['Postcode'] = customer.postCode;
      memberItem.values['Email'] = customer.email;
      memberItem.values['Phone Number'] = customer.phone;
      memberItem.values['DOB'] = customer.dob;

      memberItem.values['Billing Customer Id'] = customer.customerId;
      memberItem.values['Billing User'] = 'YES';
      memberItem.values['Billing Payment Type'] = customer.paymentMethod;
      memberItem.values['Billing Payment Period'] = customer.billingPeriod;
      memberItem.values['Payment Schedule'] = {
        period: customer.billingPeriod,
        amount: customer.billingAmount,
      };
      memberItem.values['Membership Cost'] = customer.billingAmount;
      memberItem.values['DDR Status'] = 'Pending';

      newMembers[newMembers.length] = memberItem;
      yield put(actions.createMember({ memberItem, showNotification: false }));
      newMemberAdded = true;
    } else if (submissions && submissions.length === 1) {
      memberItem.values = submissions[0].values;
      let changeMade = false;
      if (customer.status !== memberItem.values['Status']) {
        memberItem.values['Status'] = customer.status;
        let history = getJson(memberItem.values['Status History']);
        let newHistory = {
          submitter: action.payload.appSettings.profile.displayName,
          date: moment().toString(),
          status: 'Inactive',
        };
        history.push(newHistory);
        memberItem.values['Status History'] = history;
        changeMade = true;
      }
      if (memberItem.values['Billing User'] !== 'YES') {
        memberItem.values['Billing User'] = 'YES';
        changeMade = true;
      }
      if (
        memberItem.values['Billing Payment Type'] !== customer.paymentMethod
      ) {
        memberItem.values['Billing Payment Type'] = customer.paymentMethod;
        changeMade = true;
      }
      if (
        memberItem.values['Billing Payment Period'] !== customer.billingPeriod
      ) {
        memberItem.values['Billing Payment Period'] = customer.billingPeriod;
        changeMade = true;
      }
      if (
        parseInt(memberItem.values['Membership Cost']) !==
        customer.billingAmount
      ) {
        memberItem.values['Payment Schedule'] = {
          period: customer.billingPeriod,
          amount: customer.billingAmount,
        };
        memberItem.values['Membership Cost'] = customer.billingAmount;
        changeMade = true;
      }
      if (changeMade) {
        memberItem.id = submissions[0].id;
        yield put(
          actions.updateMember({
            id: memberItem.id,
            memberItem: memberItem,
          }),
        );
      }
    }
  }

  if (action.payload.setBillingCustomers) {
    action.payload.setBillingCustomers();
    if (newMemberAdded) {
      action.payload.fetchMembers();
    }
  }
}

export function* fetchInactiveCustomersCount(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.fromDate = action.payload.fromDate;
  args.toDate = action.payload.toDate;

  axios
    .post(
      appSettings.kineticBillingServerUrl + getInactiveCustomersCountUrl,
      args,
    )
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(
          'fetchInactiveCustomersCount Error: ' + result.data.errorMessage,
        );
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Inactive Customers',
        );
      } else {
        action.payload.setInactiveCustomersCount(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}
export function* promoteMember(action) {
  try {
    let memberActivities = { values: {} };
    memberActivities.values['Member ID'] = action.payload.memberItem['id'];
    memberActivities.values['Type'] = 'Promotion';
    memberActivities.values['Direction'] = '';
    memberActivities.values['Content'] = {
      Program: action.payload.memberItem.values['Ranking Program'],
      Belt: action.payload.memberItem.values['Ranking Belt'],
      PromotionDate: action.payload.memberItem.values['Last Promotion'],
      Notes: action.payload.notes,
    };

    action.payload.createMemberActivities({
      memberActivities,
      id: action.payload.memberItem['id'],
      myThis: action.payload.myThis,
      fetchMember: action.payload.fetchMember,
    });
    action.payload.updateMember({
      id: action.payload.memberItem['id'],
      memberItem: action.payload.memberItem,
    });
    memberActivities.values['Content']['Submitter'] = action.payload.submitter;
    action.payload.memberItem.promotionContent.splice(
      0,
      0,
      memberActivities.values['Content'],
    );

    yield put(actions.memberPromoted());
    yield put(action.payload.promotionComplete());
  } catch (error) {
    console.log('Error in updateCurrentMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchMembers() {
  console.log('watchMembers');
  yield takeEvery(types.FETCH_MEMBERS, fetchMembers);
  yield takeEvery(types.FETCH_CURRENT_MEMBER, fetchCurrentMember);
  yield takeEvery(types.UPDATE_MEMBER, updateCurrentMember);
  yield takeEvery(types.CREATE_MEMBER, createMember);
  yield takeEvery(types.DELETE_MEMBER, deleteMember);
  yield takeEvery(types.FETCH_NEW_MEMBER, fetchNewMember);
  yield takeEvery(types.FETCH_BILLING_INFO, fetchBillingInfo);
  yield takeEvery(
    types.FETCH_BILLING_INFO_AFTER_REGISTRATION,
    fetchBillingInfoAfterRegistration,
  );
  yield takeEvery(types.EDIT_PAYMENT_AMOUNT, editPaymentAmount);
  yield takeEvery(types.FETCH_MEMBER_PROMOTIONS, fetchMemberPromotions);
  yield takeEvery(types.FETCH_PAYMENT_HISTORY, fetchPaymentHistory);
  yield takeEvery(types.CLEAR_PAYMENT_SCHEDULE, clearPaymentSchedule);
  yield takeEvery(types.CREATE_PAYMENT_SCHEDULE, createPaymentSchedule);
  yield takeEvery(types.FETCH_BILLING_PAYMENTS, fetchBillingPayments);
  yield takeEvery(
    types.FETCH_PROCESSED_SCHEDULED_PAYMENTS,
    fetchProcessedAndScheduledPayments,
  );
  yield takeEvery(types.FETCH_FAMILY_MEMBERS, fetchFamilyMembers);
  yield takeEvery(types.REGISTER_BILLING_MEMBER, registerBillingMember);
  yield takeEvery(types.EDIT_PAYMENT_METHOD, editPaymentMethod);
  yield takeEvery(types.REFUND_TRANSACTION, refundTransaction);
  yield takeEvery(types.SYNC_BILLING_CUSTOMER, syncBillingCustomer);
  yield takeEvery(types.FETCH_NEW_CUSTOMERS, fetchNewCustomers);
  yield takeEvery(types.FETCH_DDR_STATUS, fetchDdrStatus);
  yield takeEvery(types.FETCH_ACTION_REQUESTS, fetchActionRequests);
  yield takeEvery(types.FETCH_VARIATION_CUSTOMERS, fetchVariationCustomers);
  yield takeEvery(types.FETCH_BILLING_CUSTOMERS, fetchBillingCustomers);
  yield takeEvery(types.CREATE_BILLING_MEMBERS, createBillingMembers);
  yield takeEvery(
    types.FETCH_INACTIVE_CUSTOMERS_COUNT,
    fetchInactiveCustomersCount,
  );
  yield takeEvery(types.PROMOTE_MEMBER, promoteMember);
}

export default function fetchMemberById(id) {
  const submission = CoreAPI.fetchSubmission({
    id: id,
    include: SUBMISSION_INCLUDES,
  });
  return submission;
}

export function updateBillingMember(options) {
  const submission = CoreAPI.updateSubmission({
    id: options.id,
    values: options.memberItem.values,
  });
  return submission;
}

export function updateBillingMembers(
  parentMemberId,
  membersToUpdate,
  membersToRemove,
) {
  membersToUpdate.forEach(member => {
    member.values['Billing Parent Member'] = parentMemberId;
    delete member.toBeUpdated;
    updateBillingMember({ id: member['id'], memberItem: member });
  });

  membersToRemove.forEach(member => {
    updateBillingMember({ id: member['id'], memberItem: member });
  });
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

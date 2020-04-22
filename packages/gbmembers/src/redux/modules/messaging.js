import { Record } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  SEND_SMS: namespace('messaging', 'SEND_SMS'),
  SEND_BULK_SMS: namespace('messaging', 'SEND_BULK_SMS'),
  GET_ACCOUNT_CREDIT: namespace('messaging', 'GET_ACCOUNT_CREDIT'),
  SET_ACCOUNT_CREDIT: namespace('messaging', 'SET_ACCOUNT_CREDIT'),
  CREATE_MEMBER_ACTIVITIES: namespace('messaging', 'CREATE_MEMBER_ACTIVITIES'),
  CREATE_LEAD_ACTIVITIES: namespace('messaging', 'CREATE_LEAD_ACTIVITIES'),
  GET_INDIVIDUAL_SMS: namespace('messaging', 'GET_INDIVIDUAL_SMS'),
  SET_INDIVIDUAL_SMS: namespace('messaging', 'SET_INDIVIDUAL_SMS'),
};

export const actions = {
  sendSms: withPayload(types.SEND_SMS),
  sendBulkSms: withPayload(types.SEND_BULK_SMS),
  getAccountCredit: withPayload(types.GET_ACCOUNT_CREDIT),
  setAccountCredit: withPayload(types.SET_ACCOUNT_CREDIT),
  createMemberActivities: withPayload(types.CREATE_MEMBER_ACTIVITIES),
  createLeadActivities: withPayload(types.CREATE_LEAD_ACTIVITIES),
  getIndividualSMS: withPayload(types.GET_INDIVIDUAL_SMS),
  setIndividualSMS: withPayload(types.SET_INDIVIDUAL_SMS),
};

export const State = Record({
  sendBulkSmsInProgress: true,
  smsAccountCredit: '0.0',
  smsAccountCreditLoading: true,
  individualSMS: [],
  individualSMSLoading: false,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SEND_SMS:
      return state.set('sendSmsInProgress', true);
    case types.SEND_BULK_SMS:
      return state.set('sendBulkSmsInProgress', true);
    case types.GET_ACCOUNT_CREDIT:
      return state.set('smsAccountCreditLoading', true);
    case types.GET_INDIVIDUAL_SMS:
      return state.set('individualSMSLoading', true);
    case types.SET_INDIVIDUAL_SMS: {
      return state
        .set('individualSMSLoading', false)
        .set('individualSMS', payload);
    }
    case types.SET_ACCOUNT_CREDIT:
      return state
        .set('smsAccountCreditLoading', false)
        .set('smsAccountCredit', payload);
    default:
      return state;
  }
};

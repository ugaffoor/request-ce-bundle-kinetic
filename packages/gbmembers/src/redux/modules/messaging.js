import { Record } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  SEND_SMS: namespace('messaging', 'SEND_SMS'),
  GET_ACCOUNT_CREDIT: namespace('messaging', 'GET_ACCOUNT_CREDIT'),
  SET_ACCOUNT_CREDIT: namespace('messaging', 'SET_ACCOUNT_CREDIT'),
};

export const actions = {
  sendSms: withPayload(types.SEND_SMS),
  getAccountCredit: withPayload(types.GET_ACCOUNT_CREDIT),
  setAccountCredit: withPayload(types.SET_ACCOUNT_CREDIT),
};

export const State = Record({
  sendSmsInProgress: true,
  smsAccountCredit: '0.0',
  smsAccountCreditLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SEND_SMS:
      return state.set('sendSmsInProgress', true);
    case types.GET_ACCOUNT_CREDIT:
      return state.set('smsAccountCreditLoading', true);
    case types.SET_ACCOUNT_CREDIT:
      return state
        .set('smsAccountCreditLoading', false)
        .set('smsAccountCredit', payload);
    default:
      return state;
  }
};

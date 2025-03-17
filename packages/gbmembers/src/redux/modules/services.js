import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_SERVICESBYDATE: namespace('services', 'FETCH_SERVICESBYDATE'),
  SET_SERVICES: namespace('services', 'SET_SERVICES'),
  SEND_RECEIPT: namespace('services', 'SEND_RECEIPT'),
  FETCH_BILLING_CHANGES_BY_BILLINGREFERENCE: namespace(
    'services',
    'FETCH_BILLING_CHANGES_BY_BILLINGREFERENCE',
  ),
  SET_BILLING_CHANGES_BY_BILLINGREFERENCE: namespace(
    'services',
    'SET_BILLING_CHANGES_BY_BILLINGREFERENCE',
  ),
  FETCH_CASH_REGISTRATIONS: namespace('services', 'FETCH_CASH_REGISTRATIONS'),
  SET_CASH_REGISTRATIONS: namespace('services', 'SET_CASH_REGISTRATIONS'),
};

export const actions = {
  fetchServicesByDate: withPayload(types.FETCH_SERVICESBYDATE),
  setServices: withPayload(types.SET_SERVICES),
  fetchCashRegistrations: withPayload(types.FETCH_CASH_REGISTRATIONS),
  setCashRegistrations: withPayload(types.SET_CASH_REGISTRATIONS),
  sendReceipt: withPayload(types.SEND_RECEIPT),
  fetchBillingChangeByBillingReference: withPayload(
    types.FETCH_BILLING_CHANGES_BY_BILLINGREFERENCE,
  ),
  setBillingChangeByBillingReference: withPayload(
    types.SET_BILLING_CHANGES_BY_BILLINGREFERENCE,
  ),
};

export const State = Record({
  servicesLoading: true,
  services: List(),
  membershipServicesLoading: true,
  membershipServices: List(),
  cashRegistrationsLoading: true,
  cashRegistrations: List(),
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_SERVICESBYDATE:
      return state.set('servicesLoading', true);
    case types.SET_SERVICES: {
      let services = payload;

      services.sort(function(a, b) {
        if (new Date(a.submittedAt) < new Date(b.submittedAt)) {
          return 1;
        }
        if (new Date(a.submittedAt) > new Date(b.submittedAt)) {
          return -1;
        }
        return 0;
      });
      return state.set('servicesLoading', false).set('services', services);
    }
    case types.FETCH_BILLING_CHANGES_BY_BILLINGREFERENCE:
      return state.set('membershipServicesLoading', true);
    case types.SET_BILLING_CHANGES_BY_BILLINGREFERENCE: {
      let services = payload;

      services.sort(function(a, b) {
        if (new Date(a.submittedAtDate) < new Date(b.submittedAtDate)) {
          return 1;
        }
        if (new Date(a.submittedAtDate) > new Date(b.submittedAtDate)) {
          return -1;
        }
        return 0;
      });

      return state
        .set('membershipServicesLoading', false)
        .set('membershipServices', services);
    }
    case types.FETCH_CASH_REGISTRATIONS:
      return state.set('cashRegistrationsLoading', true);
    case types.SET_CASH_REGISTRATIONS: {
      return state
        .set('cashRegistrationsLoading', false)
        .set('cashRegistrations', payload);
    }
    default:
      return state;
  }
};

export default reducer;

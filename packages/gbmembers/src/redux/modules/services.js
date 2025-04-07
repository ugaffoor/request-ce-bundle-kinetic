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
  FETCH_MEMBER_MIGRATIONS: namespace('services', 'FETCH_MEMBER_MIGRATIONS'),
  SET_MEMBER_MIGRATIONS: namespace('services', 'SET_MEMBER_MIGRATIONS'),
};

export const actions = {
  fetchServicesByDate: withPayload(types.FETCH_SERVICESBYDATE),
  setServices: withPayload(types.SET_SERVICES),
  fetchCashRegistrations: withPayload(types.FETCH_CASH_REGISTRATIONS),
  setCashRegistrations: withPayload(types.SET_CASH_REGISTRATIONS),
  fetchMemberMigrations: withPayload(types.FETCH_MEMBER_MIGRATIONS),
  setMemberMigrations: withPayload(types.SET_MEMBER_MIGRATIONS),
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
  memberMigrationsLoading: true,
  memberMigrations: [],
  migrationsLastFetchTime: undefined,
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
    case types.FETCH_MEMBER_MIGRATIONS:
      return state.set(
        'memberMigrationsLoading',
        payload.migrationsLastFetchTime === undefined ? true : false,
      );
    case types.SET_MEMBER_MIGRATIONS: {
      var memberMigrations = state.get('memberMigrations');
      if (memberMigrations.length === 0) {
        memberMigrations = payload;
      } else {
        for (var k = 0; k < payload.length; k++) {
          var mIdx = memberMigrations.findIndex(
            migration => migration.id === payload[k].id,
          );
          if (mIdx !== -1) {
            memberMigrations[mIdx] = payload[k];
          } else {
            memberMigrations.push(payload[k]);
          }
        }
      }
      return state
        .set('migrationsLastFetchTime', moment().format('YYYY-MM-DDTHH:mm:ssZ'))
        .set('memberMigrationsLoading', false)
        .set('memberMigrations', memberMigrations);
    }
    default:
      return state;
  }
};

export default reducer;

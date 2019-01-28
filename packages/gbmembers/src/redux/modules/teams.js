import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_BILLING_TEAM: namespace('teams', 'FETCH_BILLING_TEAM'),
  SET_BILLING_TEAM: namespace('teams', 'SET_BILLING_TEAM'),
  FETCH_IS_BILLING_USER: namespace('teams', 'FETCH_IS_BILLING_USER'),
  SET_IS_BILLING_USER: namespace('teams', 'SET_IS_BILLING_USER'),
};

export const actions = {
  fetchBillingTeam: withPayload(types.FETCH_BILLING_TEAM),
  setBillingTeam: withPayload(types.SET_BILLING_TEAM),
  fetchIsBillingUser: withPayload(types.FETCH_IS_BILLING_USER),
  setIsBillingUser: withPayload(types.SET_IS_BILLING_USER)
};

export const State = Record({
  billingTeam: {},
  billingTeamLoading: true,
  isBillingUser: false,
  isBillingUserLoading: true
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_BILLING_TEAM:
      return state.set('billingTeamLoading', true);
    case types.SET_BILLING_TEAM: {
      let billingTeam = payload.find(team => team.name === 'Billing');
      return state.set('billingTeamLoading', false).set('billingTeam', billingTeam ? billingTeam : {});
    }
    case types.FETCH_IS_BILLING_USER:
      return state.set('isBillingUserLoading', true);
    case types.SET_IS_BILLING_USER: {
      return state.set('isBillingUserLoading', false).set('isBillingUser', payload);
    }
    default:
      return state;
  }
};

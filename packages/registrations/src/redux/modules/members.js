import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_MEMBERS: namespace('members', 'FETCH_MEMBERS'),
  SET_MEMBERS: namespace('members', 'SET_MEMBERS'),
  UPDATE_MEMBER: namespace('members', 'UPDATE_MEMBER'),
  FETCH_BILLING_INFO: namespace('members', 'FETCH_BILLING_INFO'),
  FETCH_BILLING_INFO_AFTER_REGISTRATION: namespace(
    'members',
    'FETCH_BILLING_INFO_AFTER_REGISTRATION',
  ),
  SET_BILLING_INFO: namespace('members', 'SET_BILLING_INFO'),
  SET_DUMMY: namespace('members', 'SET_DUMMY'),
  REGISTER_BILLING_MEMBER: namespace('members', 'REGISTER_BILLING_MEMBER'),
};

export const actions = {
  fetchMembers: withPayload(types.FETCH_MEMBERS),
  setMembers: withPayload(types.SET_MEMBERS),
  updateMember: withPayload(types.UPDATE_MEMBER),
  fetchBillingInfo: withPayload(types.FETCH_BILLING_INFO),
  fetchBillingInfoAfterRegistration: withPayload(
    types.FETCH_BILLING_INFO_AFTER_REGISTRATION,
  ),
  setBillingInfo: withPayload(types.SET_BILLING_INFO),
  setDummy: withPayload(types.SET_DUMMY),
  registerBillingMember: withPayload(types.REGISTER_BILLING_MEMBER),
};

export const State = Record({
  allMembers: List(),
  membersLoading: true,
  billingInfoLoading: true,
  billingInfo: {},
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_MEMBERS:
      return state.set('membersLoading', true);
    case types.FETCH_BILLING_INFO:
      return state
        .set('billingInfoLoading', true)
        .set('completeMemberBilling', false);
    case types.SET_MEMBERS: {
      // Apply currentFilter
      var members = [];
      for (var i = 0; i < payload.length; i++) {
        if (payload[i].values['Status'] === 'Active')
          members[members.length] = payload[i];
      }
      return state.set('membersLoading', false).set('allMembers', members);
    }
    case types.SET_BILLING_INFO: {
      if (
        (state.currentMember.values['Billing Customer Id'] === null ||
          state.currentMember.values['Billing Customer Id'] === undefined) &&
        payload.customerBillingId !== undefined
      )
        state.currentMember.values['Billing Customer Id'] =
          payload.customerBillingId;
      return state.set('billingInfoLoading', false).set('billingInfo', payload);
    }
    default:
      return state;
  }
};

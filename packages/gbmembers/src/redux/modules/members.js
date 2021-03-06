import { Record, List } from 'immutable';
import moment from 'moment';
import { setMemberPromotionValues } from '../../components/Member/MemberUtils';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_MEMBERS: namespace('members', 'FETCH_MEMBERS'),
  SET_MEMBERS: namespace('members', 'SET_MEMBERS'),
  UPDATE_ALL_MEMBERS: namespace('members', 'UPDATE_ALL_MEMBERS'),
  SET_MEMBER_FILTER: namespace('members', 'SET_MEMBER_FILTER'),
  GET_MEMBER_FILTER: namespace('members', 'GET_MEMBER_FILTER'),
  FETCH_CURRENT_MEMBER: namespace('members', 'FETCH_CURRENT_MEMBER'),
  FETCH_MEMBER_PROMOTIONS: namespace('members', 'FETCH_MEMBER_PROMOTIONS'),
  SET_MEMBER_PROMOTIONS: namespace('members', 'SET_MEMBER_PROMOTIONS'),
  SET_CURRENT_MEMBER: namespace('members', 'SET_CURRENT_MEMBER'),
  UPDATE_MEMBER: namespace('members', 'UPDATE_MEMBER'),
  MEMBER_SAVED: namespace('members', 'MEMBER_SAVED'),
  CREATE_MEMBER: namespace('members', 'CREATE_MEMBER'),
  DELETE_MEMBER: namespace('members', 'DELETE_MEMBER'),
  DELETE_MEMBER_FILE: namespace('members', 'DELETE_MEMBER_FILE'),
  FETCH_NEW_MEMBER: namespace('members', 'FETCH_NEW_MEMBER'),
  SET_NEW_MEMBER: namespace('members', 'SET_NEW_MEMBER'),
  FETCH_BILLING_INFO: namespace('members', 'FETCH_BILLING_INFO'),
  FETCH_BILLING_INFO_AFTER_REGISTRATION: namespace(
    'members',
    'FETCH_BILLING_INFO_AFTER_REGISTRATION',
  ),
  SET_BILLING_INFO: namespace('members', 'SET_BILLING_INFO'),
  SET_DUMMY: namespace('members', 'SET_DUMMY'),
  EDIT_PAYMENT_AMOUNT: namespace('members', 'EDIT_PAYMENT_AMOUNT'),
  FETCH_PAYMENT_HISTORY: namespace('members', 'FETCH_PAYMENT_HISTORY'),
  SET_PAYMENT_HISTORY: namespace('members', 'SET_PAYMENT_HISTORY'),
  FETCH_OVERDUES: namespace('members', 'FETCH_OVERDUES'),
  SET_OVERDUES: namespace('members', 'SET_OVERDUES'),
  CLEAR_PAYMENT_SCHEDULE: namespace('members', 'CLEAR_PAYMENT_SCHEDULE'),
  CREATE_PAYMENT_SCHEDULE: namespace('members', 'CREATE_PAYMENT_SCHEDULE'),
  FETCH_BILLING_PAYMENTS: namespace('members', 'FETCH_BILLING_PAYMENTS'),
  SET_BILLING_PAYMENTS: namespace('members', 'SET_BILLING_PAYMENTS'),
  FETCH_PROCESSED_SCHEDULED_PAYMENTS: namespace(
    'members',
    'FETCH_PROCESSED_SCHEDULED_PAYMENTS',
  ),
  SET_PROCESSED_SCHEDULED_PAYMENTS: namespace(
    'members',
    'SET_PROCESSED_SCHEDULED_PAYMENTS',
  ),
  FETCH_FAMILY_MEMBERS: namespace('members', 'FETCH_FAMILY_MEMBERS'),
  SET_FAMILY_MEMBERS: namespace('members', 'SET_FAMILY_MEMBERS'),
  REGISTER_BILLING_MEMBER: namespace('members', 'REGISTER_BILLING_MEMBER'),
  EDIT_PAYMENT_METHOD: namespace('members', 'EDIT_PAYMENT_METHOD'),
  REFUND_TRANSACTION: namespace('members', 'REFUND_TRANSACTION'),
  SYNC_BILLING_CUSTOMER: namespace('members', 'SYNC_BILLING_CUSTOMER'),
  FETCH_NEW_CUSTOMERS: namespace('members', 'FETCH_NEW_CUSTOMERS'),
  SET_NEW_CUSTOMERS: namespace('members', 'SET_NEW_CUSTOMERS'),
  FETCH_DDR_STATUS: namespace('members', 'FETCH_DDR_STATUS'),
  FETCH_ACTION_REQUESTS: namespace('members', 'FETCH_ACTION_REQUESTS'),
  SET_ACTION_REQUESTS: namespace('members', 'SET_ACTION_REQUESTS'),
  FETCH_VARIATION_CUSTOMERS: namespace('members', 'FETCH_VARIATION_CUSTOMERS'),
  SET_VARIATION_CUSTOMERS: namespace('members', 'SET_VARIATION_CUSTOMERS'),
  FETCH_CUSTOMER_REFUNDS: namespace('members', 'FETCH_CUSTOMER_REFUNDS'),
  SET_CUSTOMER_REFUNDS: namespace('members', 'SET_CUSTOMER_REFUNDS'),
  FETCH_BILLING_CUSTOMERS: namespace('members', 'FETCH_BILLING_CUSTOMERS'),
  CREATE_BILLING_MEMBERS: namespace('members', 'CREATE_BILLING_MEMBERS'),
  SYNC_BILLING_MEMBERS: namespace('members', 'SYNC_BILLING_MEMBERS'),
  SET_BILLING_CUSTOMERS: namespace('members', 'SET_BILLING_CUSTOMERS'),
  CREATE_BILLING_STATISTICS: namespace('members', 'CREATE_BILLING_STATISTICS'),
  CREATE_STATISTIC: namespace('members', 'CREATE_STATISTIC'),
  FETCH_INACTIVE_CUSTOMERS_COUNT: namespace(
    'members',
    'FETCH_INACTIVE_CUSTOMERS_COUNT',
  ),
  SET_INACTIVE_CUSTOMERS_COUNT: namespace(
    'members',
    'SET_INACTIVE_CUSTOMERS_COUNT',
  ),
  PROMOTE_MEMBER: namespace('members', 'PROMOTE_MEMBER'),
  MEMBER_PROMOTED: namespace('members', 'MEMBER_PROMOTED'),
  CREATE_MEMBER_ACCOUNT: namespace('members', 'CREATE_MEMBER_ACCOUNT'),
  USER_ACCOUNT_CREATED: namespace('members', 'USER_ACCOUNT_CREATED'),
};

export const actions = {
  fetchMembers: withPayload(types.FETCH_MEMBERS),
  setMembers: withPayload(types.SET_MEMBERS),
  updateAllMembers: withPayload(types.UPDATE_ALL_MEMBERS),
  setMemberFilter: withPayload(types.SET_MEMBER_FILTER),
  getMemberFilter: withPayload(types.GET_MEMBER_FILTER),
  fetchCurrentMember: withPayload(types.FETCH_CURRENT_MEMBER),
  setCurrentMember: withPayload(types.SET_CURRENT_MEMBER),
  fetchMemberPromotions: withPayload(types.FETCH_MEMBER_PROMOTIONS),
  setMemberPromotions: withPayload(types.SET_MEMBER_PROMOTIONS),
  updateMember: withPayload(types.UPDATE_MEMBER),
  memberSaved: withPayload(types.MEMBER_SAVED),
  createMember: withPayload(types.CREATE_MEMBER),
  deleteMember: withPayload(types.DELETE_MEMBER),
  deleteMemberFile: withPayload(types.DELETE_MEMBER_FILE),
  fetchNewMember: withPayload(types.FETCH_NEW_MEMBER),
  setNewMember: withPayload(types.SET_NEW_MEMBER),
  fetchBillingInfo: withPayload(types.FETCH_BILLING_INFO),
  fetchBillingInfoAfterRegistration: withPayload(
    types.FETCH_BILLING_INFO_AFTER_REGISTRATION,
  ),
  setBillingInfo: withPayload(types.SET_BILLING_INFO),
  setDummy: withPayload(types.SET_DUMMY),
  editPaymentAmount: withPayload(types.EDIT_PAYMENT_AMOUNT),
  fetchPaymentHistory: withPayload(types.FETCH_PAYMENT_HISTORY),
  setPaymentHistory: withPayload(types.SET_PAYMENT_HISTORY),
  fetchOverdues: withPayload(types.FETCH_OVERDUES),
  setOverdues: withPayload(types.SET_OVERDUES),
  clearPaymentSchedule: withPayload(types.CLEAR_PAYMENT_SCHEDULE),
  createPaymentSchedule: withPayload(types.CREATE_PAYMENT_SCHEDULE),
  fetchBillingPayments: withPayload(types.FETCH_BILLING_PAYMENTS),
  setBillingPayments: withPayload(types.SET_BILLING_PAYMENTS),
  fetchProcessedAndScheduledPayments: withPayload(
    types.FETCH_PROCESSED_SCHEDULED_PAYMENTS,
  ),
  setProcessedAndScheduledPayments: withPayload(
    types.SET_PROCESSED_SCHEDULED_PAYMENTS,
  ),
  fetchFamilyMembers: withPayload(types.FETCH_FAMILY_MEMBERS),
  setFamilyMembers: withPayload(types.SET_FAMILY_MEMBERS),
  registerBillingMember: withPayload(types.REGISTER_BILLING_MEMBER),
  editPaymentMethod: withPayload(types.EDIT_PAYMENT_METHOD),
  refundTransaction: withPayload(types.REFUND_TRANSACTION),
  syncBillingCustomer: withPayload(types.SYNC_BILLING_CUSTOMER),
  fetchNewCustomers: withPayload(types.FETCH_NEW_CUSTOMERS),
  setNewCustomers: withPayload(types.SET_NEW_CUSTOMERS),
  fetchDdrStatus: withPayload(types.FETCH_DDR_STATUS),
  fetchActionRequests: withPayload(types.FETCH_ACTION_REQUESTS),
  setActionRequests: withPayload(types.SET_ACTION_REQUESTS),
  fetchVariationCustomers: withPayload(types.FETCH_VARIATION_CUSTOMERS),
  setVariationCustomers: withPayload(types.SET_VARIATION_CUSTOMERS),
  fetchCustomerRefunds: withPayload(types.FETCH_CUSTOMER_REFUNDS),
  setCustomerRefunds: withPayload(types.SET_CUSTOMER_REFUNDS),
  fetchBillingCustomers: withPayload(types.FETCH_BILLING_CUSTOMERS),
  createBillingMembers: withPayload(types.CREATE_BILLING_MEMBERS),
  syncBillingMembers: withPayload(types.SYNC_BILLING_MEMBERS),
  setBillingCustomers: withPayload(types.SET_BILLING_CUSTOMERS),
  createBillingStatistics: withPayload(types.CREATE_BILLING_STATISTICS),
  createStatistic: withPayload(types.CREATE_STATISTIC),
  fetchInactiveCustomersCount: withPayload(
    types.FETCH_INACTIVE_CUSTOMERS_COUNT,
  ),
  setInactiveCustomersCount: withPayload(types.SET_INACTIVE_CUSTOMERS_COUNT),
  promoteMember: withPayload(types.PROMOTE_MEMBER),
  memberPromoted: withPayload(types.MEMBER_PROMOTED),
  createMemberUserAccount: withPayload(types.CREATE_MEMBER_ACCOUNT),
  userAccountCreated: withPayload(types.USER_ACCOUNT_CREATED),
};

export const State = Record({
  allMembers: [],
  currentMember: {},
  newMember: {},
  initialLoad: true,
  currentMemberLoading: true,
  newMemberLoading: true,
  membersLoading: true,
  billingInfoLoading: true,
  completeMemberBilling: false,
  currentFilter: 'Active Members',
  billingInfo: {},
  paymentHistory: [],
  overdues: [],
  billingPayments: [],
  billingPaymentsLoading: false,
  paymentHistoryLoading: true,
  overduesLoading: true,
  processedAndScheduledPayments: {},
  processedAndScheduledPaymentsLoading: true,
  familyMembers: [],
  removedBillingMembers: [],
  newCustomers: [],
  newCustomersLoading: true,
  actionRequests: [],
  memberPromotions: [],
  actionRequestsLoading: true,
  variationCustomers: [],
  variationCustomersLoading: true,
  customerRefunds: [],
  customerRefundsLoading: true,
  billingCustomersLoading: false,
  importingBilling: false,
  synchingBilling: false,
  billingCustomers: [],
  inactiveCustomersCount: [],
  inactiveCustomersLoading: true,
  promotingMember: false,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_MEMBERS:
      return state.set('membersLoading', true);
    case types.FETCH_CURRENT_MEMBER:
      return state.set('currentMemberLoading', true);
    case types.FETCH_BILLING_INFO:
      return state
        .set('billingInfoLoading', true)
        .set('completeMemberBilling', false);
    case types.FETCH_NEW_MEMBER:
      return state.set('newMemberLoading', true);
    case types.SET_MEMBERS: {
      // Apply currentFilter
      var members = [];
      for (var k = 0; k < payload.members.length; k++) {
        setMemberPromotionValues(payload.members[k], payload.belts);
        payload.members[k].user = payload.users.find(
          user => user.username === payload.members[k].values['Member ID'],
        );
        members[members.length] = payload.members[k];
      }

      return state.set('membersLoading', false).set('allMembers', members);
    }
    case types.UPDATE_ALL_MEMBERS: {
      return state
        .set('membersLoading', false)
        .set('allMembers', payload.members);
    }
    case types.SET_MEMBER_FILTER: {
      return state.set('currentFilter', payload);
    }
    case types.GET_MEMBER_FILTER: {
      return state.get('currentFilter');
    }
    case types.SET_CURRENT_MEMBER: {
      if (payload.member.forBilling) {
        if (payload.member.values['Billing First Name'] === undefined)
          payload.member.values['Billing First Name'] =
            payload.member.values['First Name'];
        if (payload.member.values['Billing Last Name'] === undefined)
          payload.member.values['Billing Last Name'] =
            payload.member.values['Last Name'];
        if (payload.member.values['Billing Email'] === undefined)
          payload.member.values['Billing Email'] =
            payload.member.values['Email'];
        if (payload.member.values['Billing Phone Number'] === undefined)
          payload.member.values['Billing Phone Number'] =
            payload.member.values['Phone Number'];
        if (payload.member.values['Billing Address'] === undefined)
          payload.member.values['Billing Address'] =
            payload.member.values['Address'];
        if (payload.member.values['Billing Suburb'] === undefined)
          payload.member.values['Billing Suburb'] =
            payload.member.values['Suburb'];
        if (payload.member.values['Billing State'] === undefined)
          payload.member.values['Billing State'] =
            payload.member.values['State'];
        if (payload.member.values['Billing Postcode'] === undefined)
          payload.member.values['Billing Postcode'] =
            payload.member.values['Postcode'];
      }
      payload.member.user = payload.user;
      setMemberPromotionValues(payload.member, payload.belts);

      return state
        .set('initialLoad', false)
        .set('currentMemberLoading', false)
        .set('currentMember', payload.member);
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
    case types.SET_NEW_MEMBER: {
      return state.set('newMemberLoading', false).set('newMember', payload);
    }
    case types.SET_PAYMENT_HISTORY: {
      return state
        .set('paymentHistoryLoading', false)
        .set('paymentHistory', payload);
    }
    case types.SET_OVERDUES: {
      return state.set('overduesLoading', false).set('overdues', payload);
    }
    case types.SET_BILLING_PAYMENTS: {
      return state
        .set('billingPaymentsLoading', false)
        .set('billingPayments', payload);
    }
    case types.FETCH_BILLING_PAYMENTS: {
      return state.set('billingPaymentsLoading', true);
    }
    case types.FETCH_MEMBER_PROMOTIONS: {
      return state.set('memberPromotionsLoading', true);
    }
    case types.SET_MEMBER_PROMOTIONS: {
      return state.set('memberPromotionsLoading', false);
    }
    case types.FETCH_PAYMENT_HISTORY: {
      return state.set('paymentHistoryLoading', true);
    }
    case types.FETCH_OVERDUES: {
      return state.set('overduesLoading', true);
    }
    case types.FETCH_PROCESSED_SCHEDULED_PAYMENTS: {
      return state.set('processedAndScheduledPaymentsLoading', true);
    }
    case types.SET_PROCESSED_SCHEDULED_PAYMENTS: {
      return state
        .set('processedAndScheduledPaymentsLoading', false)
        .set('processedAndScheduledPayments', payload);
    }
    case types.SET_FAMILY_MEMBERS: {
      return state
        .set('familyMembers', payload)
        .set('removedBillingMembers', []);
    }
    case types.FETCH_NEW_CUSTOMERS: {
      return state.set('newCustomersLoading', true);
    }
    case types.SET_NEW_CUSTOMERS: {
      return state
        .set('newCustomersLoading', false)
        .set('newCustomers', payload);
    }
    case types.FETCH_ACTION_REQUESTS: {
      return state.set('actionRequestsLoading', true);
    }
    case types.SET_ACTION_REQUESTS: {
      return state
        .set('actionRequestsLoading', false)
        .set('actionRequests', payload);
    }
    case types.FETCH_VARIATION_CUSTOMERS: {
      return state.set('variationCustomersLoading', true);
    }
    case types.SET_VARIATION_CUSTOMERS: {
      return state
        .set('variationCustomersLoading', false)
        .set('variationCustomers', payload);
    }
    case types.FETCH_CUSTOMER_REFUNDS: {
      return state.set('customerRefundsLoading', true);
    }
    case types.SET_CUSTOMER_REFUNDS: {
      return state
        .set('customerRefundsLoading', false)
        .set('customerRefunds', payload);
    }
    case types.FETCH_BILLING_CUSTOMERS: {
      let importingBilling = false;
      let synchingBilling = false;

      if (payload.createBillingMembers !== undefined) {
        importingBilling = true;
      }
      if (payload.syncBillingMembers !== undefined) {
        synchingBilling = true;
      }
      return state
        .set('billingCustomersLoading', true)
        .set('importingBilling', importingBilling)
        .set('synchingBilling', synchingBilling);
    }
    case types.SET_BILLING_CUSTOMERS: {
      console.log('SET_BILLING_CUSTOMERS 11');

      return state
        .set('billingCustomersLoading', false)
        .set('billingCustomers', payload.billingCustomers)
        .set(
          'importingBilling',
          payload.createBillingMembers !== undefined ? false : undefined,
        )
        .set(
          'synchingBilling',
          payload.syncBillingMembers !== undefined ? false : undefined,
        );
    }
    case types.FETCH_INACTIVE_CUSTOMERS_COUNT: {
      return state.set('inactiveCustomersLoading', true);
    }
    case types.SET_INACTIVE_CUSTOMERS_COUNT: {
      return state
        .set('inactiveCustomersLoading', false)
        .set('inactiveCustomersCount', payload);
    }
    case types.PROMOTE_MEMBER: {
      return state.set('promotingMember', true);
    }
    case types.MEMBER_PROMOTED: {
      return state.set('promotingMember', false);
    }
    case types.MEMBER_SAVED: {
      var allMembers = payload.allMembers;
      for (var i = 0; i < allMembers.length; i++) {
        if (allMembers[i]['id'] === payload.memberItem.id) {
          allMembers[i] = payload.memberItem;
        }
      }

      return state.set('allMembers', allMembers);
    }
    default:
      return state;
  }
};

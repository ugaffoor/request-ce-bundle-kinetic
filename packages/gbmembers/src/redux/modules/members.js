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
  FETCH_CURRENT_MEMBER_ADDITIONAL: namespace(
    'members',
    'FETCH_CURRENT_MEMBER_ADDITIONAL',
  ),
  FETCH_MEMBER_PROMOTIONS: namespace('members', 'FETCH_MEMBER_PROMOTIONS'),
  SET_MEMBER_PROMOTIONS: namespace('members', 'SET_MEMBER_PROMOTIONS'),
  SET_CURRENT_MEMBER: namespace('members', 'SET_CURRENT_MEMBER'),
  SET_CURRENT_MEMBER_ADDITIONAL: namespace(
    'members',
    'SET_CURRENT_MEMBER_ADDITIONAL',
  ),
  ACTIVATE_BILLER: namespace('members', 'ACTIVATE_BILLER'),
  BILLER_ACTIVATED: namespace('members', 'BILLER_ACTIVATED'),
  UPDATE_MEMBER: namespace('members', 'UPDATE_MEMBER'),
  MEMBER_SAVED: namespace('members', 'MEMBER_SAVED'),
  MEMBER_DELETED: namespace('members', 'MEMBER_DELETED'),
  CREATE_MEMBER: namespace('members', 'CREATE_MEMBER'),
  DELETE_MEMBER: namespace('members', 'DELETE_MEMBER'),
  DELETE_MEMBER_FILE: namespace('members', 'DELETE_MEMBER_FILE'),
  CANCEL_ADDITIONAL_SERVICE: namespace('members', 'CANCEL_ADDITIONAL_SERVICE'),
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
  FETCH_ADDITIONAL_SERVICES: namespace('members', 'FETCH_ADDITIONAL_SERVICES'),
  FETCH_ACTIVE_ADDITIONAL_SERVICES: namespace(
    'members',
    'FETCH_ACTIVE_ADDITIONAL_SERVICES',
  ),
  SET_ADDITIONAL_SERVICES: namespace('members', 'SET_ADDITIONAL_SERVICES'),
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
  REFUND_TRANSACTION_COMPLETE: namespace(
    'members',
    'REFUND_TRANSACTION_COMPLETE',
  ),
  REFUND_POS_TRANSACTION: namespace('members', 'REFUND_POS_TRANSACTION'),
  REFUND_POS_TRANSACTION_COMPLETE: namespace(
    'members',
    'REFUND_POS_TRANSACTION_COMPLETE',
  ),
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
  ADD_CASH_PAYMENT: namespace('members', 'ADD_CASH_PAYMENT'),
  FETCH_MEMBER_CASH_PAYMENTS: namespace(
    'members',
    'FETCH_MEMBER_CASH_PAYMENTS',
  ),
  SET_MEMBER_CASH_PAYMENTS: namespace('members', 'SET_MEMBER_CASH_PAYMENTS'),
  FETCH_CASH_PAYMENTS_BYDATE: namespace(
    'attendance',
    'FETCH_CASH_PAYMENTS_BYDATE',
  ),
  SET_CASH_PAYMENTS_BYDATE: namespace('attendance', 'SET_CASH_PAYMENTS_BYDATE'),
};

export const actions = {
  fetchMembers: withPayload(types.FETCH_MEMBERS),
  setMembers: withPayload(types.SET_MEMBERS),
  updateAllMembers: withPayload(types.UPDATE_ALL_MEMBERS),
  setMemberFilter: withPayload(types.SET_MEMBER_FILTER),
  getMemberFilter: withPayload(types.GET_MEMBER_FILTER),
  fetchCurrentMember: withPayload(types.FETCH_CURRENT_MEMBER),
  setCurrentMember: withPayload(types.SET_CURRENT_MEMBER),
  fetchCurrentMemberAdditional: withPayload(
    types.FETCH_CURRENT_MEMBER_ADDITIONAL,
  ),
  setCurrentMemberAdditional: withPayload(types.SET_CURRENT_MEMBER_ADDITIONAL),
  fetchMemberPromotions: withPayload(types.FETCH_MEMBER_PROMOTIONS),
  setMemberPromotions: withPayload(types.SET_MEMBER_PROMOTIONS),
  activateBiller: withPayload(types.ACTIVATE_BILLER),
  updateMember: withPayload(types.UPDATE_MEMBER),
  memberSaved: withPayload(types.MEMBER_SAVED),
  memberDeleted: withPayload(types.MEMBER_DELETED),
  billerActivated: withPayload(types.BILLER_ACTIVATED),
  createMember: withPayload(types.CREATE_MEMBER),
  deleteMember: withPayload(types.DELETE_MEMBER),
  deleteMemberFile: withPayload(types.DELETE_MEMBER_FILE),
  cancelAdditionalService: withPayload(types.CANCEL_ADDITIONAL_SERVICE),
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
  fetchAdditionalServices: withPayload(types.FETCH_ADDITIONAL_SERVICES),
  fetchActiveAdditionalServices: withPayload(
    types.FETCH_ACTIVE_ADDITIONAL_SERVICES,
  ),
  setAdditionalServices: withPayload(types.SET_ADDITIONAL_SERVICES),
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
  refundTransactionComplete: withPayload(types.REFUND_TRANSACTION_COMPLETE),
  refundPOSTransaction: withPayload(types.REFUND_POS_TRANSACTION),
  refundPOSTransactionComplete: withPayload(
    types.REFUND_POS_TRANSACTION_COMPLETE,
  ),
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
  addCashPayment: withPayload(types.ADD_CASH_PAYMENT),
  fetchMemberCashPayments: withPayload(types.FETCH_MEMBER_CASH_PAYMENTS),
  setMemberCashPayments: withPayload(types.SET_MEMBER_CASH_PAYMENTS),
  fetchCashPaymentsByDate: withPayload(types.FETCH_CASH_PAYMENTS_BYDATE),
  setCashPaymentsByDate: withPayload(types.SET_CASH_PAYMENTS_BYDATE),
};

export const State = Record({
  allMembers: [],
  memberLastFetchTime: undefined,
  currentMember: {},
  currentMemberAdditional: {},
  newMember: {},
  initialLoad: true,
  currentMemberLoading: true,
  currentMemberAdditionalLoading: true,
  newMemberLoading: true,
  membersLoading: true,
  memberUpdating: true,
  activatingBiller: false,
  activatingBillerCompleted: false,
  billingInfoLoading: true,
  completeMemberBilling: false,
  currentFilter: 'Active Members',
  billingInfo: {},
  ALLpaymentHistory: [],
  FAILEDpaymentHistory: [],
  SUCCESSFULpaymentHistory: [],
  overdues: [],
  additionalServices: [],
  billingPayments: [],
  billingPaymentsLoading: false,
  ALLpaymentHistoryLoading: true,
  FAILEDpaymentHistoryLoading: true,
  SUCCESSFULpaymentHistoryLoading: true,
  overduesLoading: true,
  additionalServicesLoading: true,
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
  refundTransactionInProgress: false,
  refundTransactionID: {},
  refundPOSTransactionInProgress: false,
  refundPOSTransactionID: {},
  memberAttentionRequired: false,
  memberCashPayments: [],
  memberCashPaymentsLoading: true,
  cashPaymentsByDate: [],
  cashPaymentsByDateLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.REFUND_TRANSACTION:
      return state.set('refundTransactionInProgress', true);
    case types.REFUND_TRANSACTION_COMPLETE:
      return state
        .set('refundTransactionInProgress', false)
        .set('refundTransactionID', {
          id: payload.id,
          value: payload.value,
        });
    case types.REFUND_POS_TRANSACTION:
      return state.set('refundPOSTransactionInProgress', true);
    case types.REFUND_POS_TRANSACTION_COMPLETE:
      return state
        .set('refundPOSTransactionInProgress', false)
        .set('refundPOSTransactionID', {
          id: payload.id,
          value: payload.value,
        });
    case types.FETCH_MEMBERS:
      return state.set('membersLoading', true);
    case types.FETCH_CURRENT_MEMBER:
      var currentMemberAdditional = {
        emailsReceived: [],
        emailsSent: [],
        smsContent: [],
        requestContent: [],
        promotionContent: [],
        memberFiles: [],
        posOrders: [],
        posItems: [],
        additionalServices: [],
      };
      return state
        .set('currentMemberLoading', true)
        .set('currentMemberAdditional', currentMemberAdditional);
    case types.FETCH_CURRENT_MEMBER_ADDITIONAL:
      return state.set('currentMemberAdditionalLoading', true);
    case types.FETCH_BILLING_INFO:
      return state
        .set('billingInfoLoading', true)
        .set('completeMemberBilling', false);
    case types.FETCH_NEW_MEMBER:
      return state.set('newMemberLoading', true);
    case types.SET_MEMBERS: {
      var allMembers = state.get('allMembers');

      let attentionRequired = false;
      var members = [];
      for (var k = 0; k < payload.members.length; k++) {
        setMemberPromotionValues(payload.members[k], payload.belts);
        payload.members[k].user = payload.users.find(
          user =>
            payload.members[k].values['Member ID'] !== null &&
            user.username.toLowerCase() ===
              payload.members[k].values['Member ID'].toLowerCase(),
        );
        members[members.length] = payload.members[k];
      }

      if (allMembers.length === 0) {
        allMembers = members;
      } else {
        for (var k = 0; k < members.length; k++) {
          var mIdx = allMembers.findIndex(
            member => member.id === members[k].id,
          );
          if (mIdx !== -1) {
            allMembers[mIdx] = members[k];
          } else {
            allMembers.push(members[k]);
          }
        }
      }

      for (var k = 0; k < allMembers.length; k++) {
        if (allMembers[k].values['Is New Reply Received'] === 'true') {
          attentionRequired = true;
        }
      }
      return state
        .set('membersLoading', false)
        .set('allMembers', allMembers)
        .set('memberLastFetchTime', moment().format('YYYY-MM-DDTHH:mm:ssZ'))
        .set('memberAttentionRequired', attentionRequired);
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
      let allMembers = state.get('allMembers');

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
      setMemberPromotionValues(payload.member, payload.belts);

      payload.member.emailsReceived =
        state.currentMemberAdditional.emailReceivedContent;
      payload.member.emailsSent = state.currentMemberAdditional.emailsSent;
      payload.member.smsContent = state.currentMemberAdditional.smsContent;
      payload.member.requestContent =
        state.currentMemberAdditional.requestContent;
      payload.member.promotionContent =
        state.currentMemberAdditional.promotionContent;
      payload.member.memberFiles = state.currentMemberAdditional.memberFiles;
      payload.member.posOrders = state.currentMemberAdditional.posOrders;
      payload.member.posItems = state.currentMemberAdditional.posItems;
      payload.member.additionalServices =
        state.currentMemberAdditional.additionalServices;

      if (allMembers.length !== 0) {
        mIdx = allMembers.findIndex(member => member.id === payload.member.id);
        if (mIdx !== -1) {
          payload.member.user = allMembers[mIdx].user;
        }
      } else {
        payload.member.user = payload.user.user;
      }
      return state
        .set('initialLoad', false)
        .set('currentMemberLoading', false)
        .set('currentMember', payload.member);
    }
    case types.SET_CURRENT_MEMBER_ADDITIONAL: {
      state.currentMember.emailsReceived = payload.emailReceivedContent;
      state.currentMember.emailsSent = payload.emailsSent;
      state.currentMember.smsContent = payload.smsContent;
      state.currentMember.requestContent = payload.requestContent;
      state.currentMember.promotionContent = payload.promotionContent;
      state.currentMember.memberFiles = payload.memberFiles;
      state.currentMember.posOrders = payload.posOrders;
      state.currentMember.posItems = payload.posItems;
      state.currentMember.additionalServices = payload.additionalServices;

      return state
        .set('currentMemberAdditionalLoading', false)
        .set('currentMemberAdditional', payload)
        .set('currentMember', state.currentMember);
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
      let paymentHistory = payload.data.sort(function(a, b) {
        if (a.debitDate < b.debitDate) return 1;
        if (a.debitDate > b.debitDate) return -1;
        return 0;
      });

      return state
        .set(payload.paymentType + 'paymentHistoryLoading', false)
        .set(payload.paymentType + 'paymentHistory', paymentHistory);
    }
    case types.SET_OVERDUES: {
      return state.set('overduesLoading', false).set('overdues', payload);
    }
    case types.SET_ADDITIONAL_SERVICES: {
      return state
        .set('additionalServicesLoading', false)
        .set('additionalServices', payload);
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
      return state.set(payload.paymentType + 'paymentHistoryLoading', true);
    }
    case types.FETCH_OVERDUES: {
      return state.set('overduesLoading', true);
    }
    case types.FETCH_ADDITIONAL_SERVICES: {
      return state.set('additionalServicesLoading', true);
    }
    case types.FETCH_ACTIVE_ADDITIONAL_SERVICES: {
      return state.set('additionalServicesLoading', true);
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
      console.log('SET_CUSTOMER_REFUNDS:' + payload.length);
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
    case types.UPDATE_MEMBER: {
      return state.set('memberUpdating', true);
    }
    case types.MEMBER_SAVED: {
      var allMembers = payload.allMembers;
      for (var i = 0; i < allMembers.length; i++) {
        if (allMembers[i]['id'] === payload.memberItem.id) {
          allMembers[i] = payload.memberItem;
        }
      }
      let attentionRequired = false;
      if (
        allMembers.findIndex(
          member => member.values['Is New Reply Received'] === 'true',
        ) !== -1
      ) {
        attentionRequired = true;
      }

      return state
        .set('memberUpdating', false)
        .set('allMembers', allMembers)
        .set('memberAttentionRequired', attentionRequired);
    }
    case types.MEMBER_DELETED: {
      return state.set('allMembers', payload.allMembers);
    }
    case types.ACTIVATE_BILLER: {
      return state.set('activatingBiller', true);
    }
    case types.BILLER_ACTIVATED: {
      return state
        .set('activatingBiller', false)
        .set('activatingBillerCompleted', true);
    }
    case types.FETCH_MEMBER_CASH_PAYMENTS: {
      return state.set('memberCashPaymentsLoading', true);
    }
    case types.SET_MEMBER_CASH_PAYMENTS: {
      var payments = [];

      for (var k = 0; k < payload.length; k++) {
        payments[payments.length] = payload[k];
      }

      return state
        .set('memberCashPaymentsLoading', false)
        .set('memberCashPayments', payments);
    }
    case types.FETCH_CASH_PAYMENTS_BYDATE: {
      return state.set('cashPaymentsByDateLoading', true);
    }
    case types.SET_CASH_PAYMENTS_BYDATE: {
      var payments = [];

      for (var k = 0; k < payload.length; k++) {
        payments[payments.length] = payload[k];
      }

      return state
        .set('cashPaymentsByDateLoading', false)
        .set('cashPaymentsByDate', payments);
    }
    default:
      return state;
  }
};

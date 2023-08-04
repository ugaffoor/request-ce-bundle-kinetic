import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import {
  getCurrency,
  getTimezoneOff,
  memberStatusInDates,
} from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import {
  getLocalePreference,
  isBamboraFailedPayment,
} from '../Member/MemberUtils';
import { I18n } from '../../../../app/src/I18nProvider';
import { actions } from '../../redux/modules/members';
import { actions as posActions } from '../../redux/modules/pos';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import SVGInline from 'react-svg-inline';
import crossIcon from '../../images/cross.svg?raw';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as servicesActions } from '../../redux/modules/services';
import helpIcon from '../../images/help.svg?raw';

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  FINFAILEDpaymentHistory: state.member.members.FINFAILEDpaymentHistory,
  FINFAILEDpaymentHistoryLoading:
    state.member.members.FINFAILEDpaymentHistoryLoading,
  paymentHistory: state.member.members.FINSUCCESSFULpaymentHistory,
  FINSUCCESSFULpaymentHistoryLoading:
    state.member.members.FINSUCCESSFULpaymentHistoryLoading,
  space: state.member.app.space,
  billingReportCustomersLoading: state.member.members.billingCustomersLoading,
  billingCustomers: state.member.members.billingCustomers,
  posOrdersLoading: state.member.pos.posOrdersLoading,
  posOrders: state.member.pos.posOrders,
  customerRefunds: state.member.members.customerRefunds,
  customerRefundsLoading: state.member.members.customerRefundsLoading,
  additionalServices: state.member.members.additionalServices,
  additionalServicesLoading: state.member.members.additionalServicesLoading,
  cashPaymentsByDate: state.member.members.cashPaymentsByDate,
  cashPaymentsByDateLoading: state.member.members.cashPaymentsByDateLoading,
  services: state.member.services.services,
  servicesLoading: state.member.services.servicesLoading,
});

const mapDispatchToProps = {
  fetchLeads: leadsActions.fetchLeads,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
  fetchPOSOrders: posActions.fetchPOSOrders,
  fetchCustomerRefunds: actions.fetchCustomerRefunds,
  setCustomerRefunds: actions.setCustomerRefunds,
  fetchActiveAdditionalServices: actions.fetchActiveAdditionalServices,
  fetchAdditionalServices: actions.fetchAdditionalServices,
  setAdditionalServices: actions.setAdditionalServices,
  fetchCashPaymentsByDate: actions.fetchCashPaymentsByDate,
  fetchServicesByDate: servicesActions.fetchServicesByDate,
};

var compThis = undefined;

export class MemberFinancialReport extends Component {
  handleClose = () => {
    var lastActive = this.state.lastActive;
    $('.dateSettings button[active=true]').attr('active', 'false');
    $(lastActive).attr('active', 'true');
    this.setState({
      isShowCustom: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    compThis = this;
    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;

    moment.locale(this.locale);

    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let repFromDate = this.setFromDate
      .hour(0)
      .minute(0)
      .second(0)
      .millisecond(0);
    let repToDate = this.setToDate.hour(23).minute(59);
    this.paymentHistory = [];
    let memberData = this.getMemberData(undefined);
    this.state = {
      allMembers: this.props.members,
      repMemberData: memberData,
      repFromDate,
      repToDate,
      repBillingPeriod: 'monthly',
      repViewPeriod: 'this_period',
      showRepAccountHolders: false,
      showConcernedMembers: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.billingReportCustomersLoading &&
      !nextProps.FINFAILEDpaymentHistoryLoading &&
      !nextProps.FINSUCCESSFULpaymentHistoryLoading &&
      !nextProps.customerRefundsLoading &&
      !nextProps.posOrdersLoading &&
      !nextProps.additionalServicesLoading &&
      !nextProps.cashPaymentsByDateLoading &&
      !nextProps.leadsLoading &&
      !nextProps.membersLoading &&
      !nextProps.servicesLoading
    ) {
      this.failedPaymentHistory = [];
      nextProps.FINFAILEDpaymentHistory.forEach((item, i) => {
        this.failedPaymentHistory[this.failedPaymentHistory.length] = item;
      });
      this.paymentHistory = [];
      nextProps.paymentHistory.forEach((item, i) => {
        if (
          getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
        ) {
          var isRefunded = false;
          /*          var rIdx = nextProps.customerRefunds.findIndex(
            refund => refund.yourSystemReference === item.paymentID,
          );
          if (rIdx !== -1) {
            isRefunded = true;
          } */
        }

        // only keep period payments
        if (
          moment(item.debitDate, 'YYYY-MM-DD HH:mm:ss').isBetween(
            this.state.repFromDate,
            this.state.repToDate,
          ) &&
          !isRefunded
        ) {
          this.paymentHistory[this.paymentHistory.length] = item;
        }
      });
      this.paymentHistory = this.paymentHistory.sort(function(a, b) {
        if (a.debitDate > b.debitDate) {
          return -1;
        } else if (a.debitDate < b.debitDate) {
          return 1;
        }
        return 0;
      });

      if (
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
      ) {
        this.failedPaymentHistory = this.failedPaymentHistory.filter(payment =>
          isBamboraFailedPayment(payment),
        );
      }
      this.failedPaymentHistory = this.failedPaymentHistory.sort((a, b) => {
        if (a['debitDate'] < b['debitDate']) {
          return 1;
        }
        if (a['debitDate'] > b['debitDate']) {
          return -1;
        }
        return 0;
      });
      var uniqueFailed = [];
      this.failedPaymentHistory.forEach((failed, i) => {
        var idx = uniqueFailed.findIndex(
          unique =>
            unique.yourSystemReference === failed.yourSystemReference &&
            unique.paymentSource !== 'Manual Membership Payment' &&
            unique.paymentSource !== 'Overdue Payment',
        );
        if (idx === -1) {
          uniqueFailed[uniqueFailed.length] = failed;
        }
      });

      var uniqueFailedHistory = [];
      uniqueFailed.forEach((failed, i) => {
        var idx = this.paymentHistory.findIndex(successful => {
          return (
            failed.yourSystemReference === successful.yourSystemReference &&
            moment(successful.debitDate, 'YYYY-MM-DD').isAfter(
              moment(failed.debitDate, 'YYYY-MM-DD') &&
                successful.paymentSource !== 'Manual Membership Payment' &&
                successful.paymentSource !== 'Overdue Payment',
            )
          );
        });

        if (idx === -1) {
          uniqueFailedHistory[uniqueFailedHistory.length] = failed;
        }
      });

      if (
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
      ) {
        nextProps.billingCustomers.forEach((member, i) => {
          var hIdx = this.paymentHistory.findIndex(
            payment =>
              payment.yourSystemReference === member.customerId &&
              payment.paymentSource !== 'Manual Membership Payment' &&
              payment.paymentSource !== 'Overdue Payment',
          );
          if (hIdx !== -1) {
            let debitDate = moment(
              this.paymentHistory[hIdx].debitDate,
              'YYYY-MM-DD HH:mm:sss',
            );
            if (
              debitDate.isAfter(moment(member.contractStartDate, 'YYYY-MM-DD'))
            ) {
              member.contractStartDate = debitDate.format('YYYY-MM-DD');
            }
          }
        });
      }

      this.posOrders = [];
      nextProps.posOrders.forEach((item, i) => {
        this.posOrders[this.posOrders.length] = item;
      });

      this.refunds = [];
      console.log(
        'nextProps.customerRefunds:' + nextProps.customerRefunds.length,
      );
      nextProps.customerRefunds.forEach((item, i) => {
        if (
          moment(item.debitDate, 'YYYY-MM-DD HH:mm:ss').isBetween(
            this.state.repFromDate,
            this.state.repToDate,
          )
        ) {
          this.refunds[this.refunds.length] = item;
        }
      });

      var cashMemberRegistrations = [];
      nextProps.services.forEach((service, i) => {
        if (
          service.form.slug === 'cash-member-registration' &&
          moment(service.createdAt).isAfter(this.state.repFromDate) &&
          moment(service.createdAt).isBefore(this.state.repToDate)
        ) {
          cashMemberRegistrations.push(service);
        }
      });

      var cancellationRequests = [];
      nextProps.services.forEach((service, i) => {
        if (
          service.form.slug === 'bambora-member-cancellation' ||
          service.form.slug === 'paysmart-member-registration' ||
          service.form.slug === 'stripe-member-registration'
        ) {
          cancellationRequests.push(service);
        }
      });

      var freezeRequests = [];
      nextProps.services.forEach((service, i) => {
        if (
          service.form.slug === 'bambora-membership-freeze' ||
          service.form.slug === 'membership-freeze' ||
          service.form.slug === 'stripe-membership-freeze'
        ) {
          freezeRequests.push(service);
        }
      });
      var resumeFreezeRequests = [];
      nextProps.services.forEach((service, i) => {
        if (
          service.form.slug === 'bambora-resume-frozen-member' ||
          service.form.slug === 'paysmart-resume-frozen-member' ||
          service.form.slug === 'stripe-resume-frozen-member'
        ) {
          resumeFreezeRequests.push(service);
        }
      });

      let memberData = this.getMemberData(
        nextProps.members,
        nextProps.leads,
        nextProps.billingCustomers,
        uniqueFailedHistory,
        this.paymentHistory,
        nextProps.paymentHistory,
        this.posOrders,
        this.refunds,
        this.props.additionalServices,
        this.props.cashPaymentsByDate,
        cashMemberRegistrations,
        cancellationRequests,
        freezeRequests,
        resumeFreezeRequests,
        this.state.repFromDate,
        this.state.repToDate,
        this.state.repBillingPeriod,
        nextProps.leadsLoading,
        nextProps.membersLoading,
      );
      this.setState({
        allMembers: nextProps.members,
        billingCustomers: nextProps.billingCustomers,
        additionalServices: this.props.additionalServices,
        cashPayments: this.props.cashPaymentsByDate,
        repMemberData: memberData,
      });
    }
  }

  componentDidMount() {
    if (!this.props.billingReportCustomersLoading) {
      this.props.fetchBillingCustomers({
        setBillingCustomers: this.props.setBillingCustomers,
        allMembers: this.props.members,
        setSystemError: this.props.setSystemError,
        addNotification: this.props.addNotification,
      });
    }
    var dateFrom = moment(this.state.repFromDate).format('YYYY-MM-DD');
    //    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
    dateFrom = moment(this.state.repFromDate)
      .subtract('months', 6)
      .format('YYYY-MM-DD');
    //    }
    this.props.fetchPaymentHistory({
      paymentType: 'FINSUCCESSFUL',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: dateFrom,
      dateTo: this.state.repToDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_successful',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPaymentHistory({
      paymentType: 'FINFAILED',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: moment()
        .subtract(12, 'months')
        .format('YYYY-MM-DD'),
      dateTo: this.state.repToDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_failed',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPOSOrders({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
      timezoneOffset: getTimezoneOff(),
    });
    var additionalServicesFromDate = moment(this.state.repFromDate);
    /*    this.props.fetchAdditionalServices({
      dateFrom: additionalServicesFromDate.subtract(6, 'months'),
      dateTo: this.state.repToDate,
      additionalServiceForm:
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
          ? 'bambora-member-additional-services'
          : '',
    });
    */
    this.props.fetchActiveAdditionalServices({
      additionalServiceForm:
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
          ? 'bambora-member-additional-services'
          : '',
    });

    this.props.fetchCustomerRefunds({
      dateFrom: moment(this.state.repFromDate)
        .subtract(1, 'days')
        .format('YYYY-MM-DD'),
      dateTo: moment(this.state.repToDate)
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
      /*      timezoneOffset: getTimezoneOff(), */
    });
    this.props.fetchCashPaymentsByDate({
      dateFrom: this.state.repFromDate.format('YYYY-MM-DD'),
      dateTo: this.state.repToDate.format('YYYY-MM-DD'),
    });
    var servicesFromDate = moment(this.state.repFromDate);
    this.props.fetchServicesByDate({
      fromDate: servicesFromDate.subtract(12, 'months'),
      toDate: this.state.repToDate,
    });

    if (this.props.leads.length === 0) {
      this.props.fetchLeads();
    }
  }
  updateBillingDates(billingCustomers, FINSUCCESSFULpaymentHistory) {
    var payments = FINSUCCESSFULpaymentHistory.sort(function(a, b) {
      if (a.debitDate < b.debitDate) {
        return -1;
      } else if (a.debitDate > b.debitDate) {
        return 1;
      }
      return 0;
    });

    billingCustomers.forEach((member, i) => {
      // Find earliest payment date
      var idx = payments.findIndex(item => {
        return (
          member.customerId === item.yourSystemReference &&
          item.paymentSource !== 'Manual Membership Payment' &&
          item.paymentSource !== 'Overdue Payment'
        );
      });
      if (idx !== -1) {
        member.contractStartDate = moment(
          payments[idx]['debitDate'],
          'YYYY-MM-DD HH:mm:ss',
        ).format('YYYY-MM-DD');
      }
    });
  }
  isRecurringPayment(payment, members) {
    if (
      payment['paymentReference'] !== null &&
      payment['paymentReference'] !== undefined &&
      payment['paymentReference'].trim() !== ''
    )
      return undefined;
    var idx = members.findIndex(
      member =>
        member.values['Billing Customer Id'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }
  isAdditionalServicePayment(payment, members) {
    if (
      payment['paymentReference'] === null ||
      payment['paymentReference'] === undefined ||
      payment['paymentReference'] === ''
    )
      return undefined;
    var idx = members.findIndex(
      member => member.values['Member ID'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }
  refreshData(fromDate, toDate) {
    this.paymentHistory = [];

    var dateFrom = moment(fromDate).format('YYYY-MM-DD');
    //    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
    dateFrom = moment(fromDate)
      .subtract('months', 6)
      .format('YYYY-MM-DD');
    //    }
    this.props.fetchPaymentHistory({
      paymentType: 'FINSUCCESSFUL',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: dateFrom,
      dateTo: toDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_successful',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPaymentHistory({
      paymentType: 'FINFAILED',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: moment()
        .subtract(12, 'months')
        .format('YYYY-MM-DD'),
      dateTo: toDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_failed',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPOSOrders({
      dateFrom: fromDate,
      dateTo: toDate,
      timezoneOffset: getTimezoneOff(),
    });
    this.props.fetchActiveAdditionalServices({
      additionalServiceForm:
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
          ? 'bambora-member-additional-services'
          : '',
    });
    this.props.fetchCustomerRefunds({
      dateFrom: moment(fromDate)
        .subtract(1, 'days')
        .format('YYYY-MM-DD'),
      dateTo: moment(toDate)
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
      /*     timezoneOffset: getTimezoneOff(),*/
    });
    this.props.fetchCashPaymentsByDate({
      dateFrom: fromDate.format('YYYY-MM-DD'),
      dateTo: toDate.format('YYYY-MM-DD'),
    });
    var servicesFromDate = moment(fromDate);
    this.props.fetchServicesByDate({
      fromDate: servicesFromDate.subtract(12, 'months'),
      toDate: toDate,
    });
  }
  getTotalValue(item) {
    if (getAttributeValue(this.props.space, 'POS System') === 'Bambora') {
      if (
        item.values['Sales Tax'] !== undefined &&
        item.values['Sales Tax'] !== null
      ) {
        return (
          Number.parseFloat(item.values['Total']) -
          Number.parseFloat(item.values['Sales Tax'])
        );
      }
      return Number.parseFloat(item.values['Total']);
    } else {
      return Number.parseFloat(item.values['Total']);
    }
  }
  noCancellationRequests(cancellationRequests, member, nextBillingDate) {
    var datePrior = false;
    if (member.status === 'Pending Cancellation') {
      /*      cancellationRequests.forEach((request, i) => {
        if (member.id === request.values['Members']) {
          var startDate = moment(
            request.values['The last debit will be taken on'],
            'YYYY-MM-DD',
          );
          if (startDate.isSameOrBefore(nextBillingDate)) {
            datePrior = true;
          }
        }
      }); */
      datePrior = true;
    }
    return datePrior;
  }
  noFreezeRequests(
    freezeRequests,
    resumeFreezeRequests,
    member,
    nextBillingDate,
  ) {
    var datePrior = false;
    var status = '';
    if (member !== undefined && member.values !== undefined) {
      status = memberStatusInDates(
        member,
        nextBillingDate.startOf('day'),
        nextBillingDate.endOf('day'),
        true,
      );
    } else {
      status = member.status;
    }
    if (status === 'Pending Freeze' || status === 'Frozen') {
      freezeRequests.forEach((request, i) => {
        if (member.id === request.values['Members']) {
          var resumeDate = undefined;
          if (
            request.values['Date Payments Resume'] !== undefined &&
            request.values['Date Payments Resume'] !== null
          ) {
            resumeDate = moment(
              request.values['Date Payments Resume'],
              'YYYY-MM-DD',
            );
          }
          if (
            resumeDate !== undefined &&
            resumeDate.isSameOrAfter(nextBillingDate)
          ) {
            datePrior = true;
          }
        }
      });
    }

    if (datePrior) {
      // Check
    }
    return datePrior;
  }
  isConcernedMember(
    members,
    member,
    lastPayment,
    fullPaymentHistory,
    fromDate,
    concernedMembers,
  ) {
    if (lastPayment.isSameOrAfter(fromDate)) {
      return false;
    }
    concernedMembers[concernedMembers.length] = member;
    return true;
  }
  isCashMember(members, member, lastPayment) {
    var mIdx = members.findIndex(mem => mem.id === member.id);
    if (mIdx !== -1) {
      if (
        members[mIdx].values['Billing Payment Type'] !== undefined &&
        members[mIdx].values['Billing Payment Type'] === 'Cash'
      ) {
        var endTerm = moment(
          members[mIdx].values['Billing Cash Term End Date'],
        );

        return members[mIdx].values['Billing Payment Type'] === 'Cash' &&
          endTerm.isSameOrAfter(lastPayment)
          ? true
          : false;
      } else return false;
    } else return false;
  }
  getMemberData(
    members,
    leads,
    billingCustomers,
    failedPaymentHistory,
    paymentHistory,
    fullPaymentHistory,
    posOrders,
    customerRefunds,
    additionalServicesRecords,
    cashPaymentsByDate,
    cashMemberRegistrations,
    cancellationRequests,
    freezeRequests,
    resumeFreezeRequests,
    fromDate,
    toDate,
    repBillingPeriod,
    leadsLoading,
    membersLoading,
  ) {
    if (
      (leadsLoading === undefined || leadsLoading) &&
      (membersLoading === undefined || membersLoading)
    ) {
      //    if (!members || members.length <= 0) {
      return {
        accountHolders: { members: [], value: 0 },
        additionalServices: { members: [], value: 0 },
        cashPayments: { members: [], value: 0 },
        forecastHolders: { members: [], value: 0 },
        posPayments: { members: [], value: 0 },
        salesTax: { members: [], value: 0 },
        refundMembers: { members: [], value: 0 },
        refundPOS: { members: [], value: 0 },
      };
    }
    // billingAmount, repBillingPeriod
    let accountHolders = [];
    let accountHoldersValue = 0;
    let additionalServices = [];
    let additionalServicesValue = 0;
    let forecastHolders = [];
    let forecastHoldersValue = 0;
    let posPeople = [];
    let posPaymentsValue = 0;
    let refundMembers = [];
    let refundValue = 0;
    let refundPOS = [];
    let refundPOSValue = 0;
    let cashPayments = [];
    let cashPaymentsValue = 0;
    paymentHistory.forEach(payment => {
      var member = this.isRecurringPayment(payment, members);
      var additionalServiceMember = undefined;
      if (member === undefined) {
        additionalServiceMember = this.isAdditionalServicePayment(
          payment,
          members,
        );
      }
      if (member !== undefined) {
        // Needed for Bambora
        if (accountHolders.findIndex(item => item.id === member.id) === -1) {
          accountHolders[accountHolders.length] = member;
        }
        accountHoldersValue += payment.paymentAmount;
        console.log(
          '1 ' +
            member.values['First Name'] +
            ' ' +
            member.values['Last Name'] +
            ' - ' +
            member.values['Billing Customer Reference'] +
            ',' +
            Number(payment.paymentAmount).toFixed(2) +
            ',' +
            payment.paymentID +
            ',' +
            payment.debitDate +
            ',' +
            accountHoldersValue,
        );
      } else if (additionalServiceMember !== undefined) {
        var sIdx = additionalServices.findIndex(
          service =>
            service.id === additionalServiceMember.id &&
            service.values['Service Name'] === payment.paymentReference,
        );
        if (sIdx === -1) {
          var idx = additionalServices.length;
          additionalServices[idx] = {
            id: additionalServiceMember.id,
            values: additionalServiceMember.values,
          };
          additionalServices[idx]['Service Name'] = payment.paymentReference;
          additionalServices[idx]['Service Charge'] = payment.paymentAmount;
        } else {
          additionalServices[idx]['Service Charge'] =
            additionalServices[idx]['Service Charge'] + payment.paymentAmount;
        }
        additionalServicesValue += payment.paymentAmount;
        console.log(
          '1 ' +
            additionalServiceMember.values['First Name'] +
            ' ' +
            additionalServiceMember.values['Last Name'] +
            ' - ' +
            additionalServiceMember.values['Billing Customer Reference'] +
            ',' +
            Number(payment.paymentAmount).toFixed(2) +
            ',' +
            payment.paymentID +
            ',' +
            payment.debitDate,
        );
      } else if (
        getAttributeValue(this.props.space, 'POS System') === 'Bambora'
      ) {
        var order;
        var idx = posOrders.findIndex(
          item => item.values['Transaction ID'] === payment.paymentID,
        );
        if (idx !== -1) {
          order = posOrders[idx];
          idx = members.findIndex(
            item => item.id === order.values['Person ID'],
          );
          if (idx !== -1) {
            if (
              posPeople.findIndex(
                item => item.id === order.values['Person ID'],
              ) === -1
            ) {
              posPeople[posPeople.length] = members[idx];
            }
          } else {
            idx = leads.findIndex(
              item => item.id === order.values['Person ID'],
            );
            if (idx !== -1) {
              if (
                posPeople.findIndex(
                  item => item.id === order.values['Person ID'],
                ) === -1
              ) {
                posPeople[posPeople.length] = leads[idx];
              }
            }
          }
        } else {
          if (payment.paymentStatus !== 'Refund') {
            if (
              payment.paymentAmount !== 0 &&
              payment.paymentSource.indexOf('POS') === -1
            ) {
              // Needed for Bambora
              accountHolders[accountHolders.length] = {
                id: 'Orphan',
                values: {
                  'First Name': payment.paymentID,
                  'Last Name': '',
                },
                fee: payment.paymentAmount,
              };
              accountHoldersValue += payment.paymentAmount;
            }
            console.log(
              'ORPHANED,' +
                Number(payment.paymentAmount).toFixed(2) +
                ',' +
                payment.paymentID +
                ',' +
                payment.debitDate +
                ',' +
                accountHoldersValue,
            );
          }
        }
        /*      if (payment.paymentStatus === 'APPROVAL') {
          posPaymentsValue += payment.paymentAmount;
        } */
      }
    });

    cashMemberRegistrations.forEach(registration => {
      var pIdx = cashPayments.findIndex(
        item => item.member.id === registration.values['Members'],
      );
      if (pIdx === -1) {
        var mIdx = members.findIndex(
          member => member.id === registration.values['Members'],
        );
        cashPayments[cashPayments.length] = {
          member: members[mIdx],
          amount: Number(registration.values['Payment Required']),
          endPeriod: moment(registration.values['Term End Date']),
        };
      } else {
        cashPayments[pIdx].amount += Number(
          registration.values['Payment Required'],
        );
        cashPayments[pIdx].endPeriod = moment(
          registration.values['Term End Date'],
        );
      }
      cashPaymentsValue += Number(registration.values['Payment Required']);
    });
    cashPaymentsByDate.forEach((payment, i) => {
      var mIdx = members.findIndex(
        member => member.id === payment.values['Member GUID'],
      );
      payment['member'] = members[mIdx];
      var pIdx = cashPayments.findIndex(
        item => item.member.id === payment.values['Member GUID'],
      );
      if (pIdx === -1) {
        payment.amount = Number(payment.values['Amount']);
        cashPayments[cashPayments.length] = payment;
      } else {
        cashPayments[pIdx].amount += Number(payment.values['Amount']);
      }
      cashPaymentsValue += Number(payment.values['Amount']);
    });

    //    if (fromDate.month()>=moment().month() && toDate.month()>=moment().month()) {
    var concernedDate = moment(fromDate).subtract(1, 'month');
    if (
      paymentHistory.length > 0 &&
      moment(paymentHistory[0].debitDate).isAfter(concernedDate)
    ) {
      concernedDate = moment(paymentHistory[0].debitDate).subtract(1, 'month');
    } else if (moment(fromDate).isAfter(moment())) {
      concernedDate = moment().subtract(1, 'month');
    }
    var concernedMembers = [];

    billingCustomers.forEach((member, i) => {
      //Set id value of members
      members.forEach((item, i) => {
        if (
          (item.values['Member ID'] === member.memberId ||
            item.values['Member ID'] === member.customerId) &&
          item.values['Status'] === 'Active'
        ) {
          member.id = item.id;
          member.status = item.values['Status'];
          member.member = item;
        }
      });
      var status = member.status;

      if (member.member != undefined && member.member.values !== undefined) {
        status = memberStatusInDates(member.member, fromDate, toDate, true);
      }
      if (
        status === 'Active' ||
        status === 'Pending Freeze' ||
        status === 'Pending Cancellation' /*&&
        failedIdx === -1*/
      ) {
        // Find latest payment date
        var idx = fullPaymentHistory.findIndex(item => {
          if (
            member.customerId === item.yourSystemReference &&
            item.paymentSource !== 'Manual Membership Payment' &&
            item.paymentSource !== 'Overdue Payment'
          ) {
            //Ensure no refund was done
            var refundedIdx = customerRefunds.findIndex(
              refund => refund.yourSystemReference === item.paymentID,
            );
            if (refundedIdx !== -1) {
              return false;
            } else {
              return true;
            }
          } else {
            return false;
          }
        });
        var lastPayment;
        if (idx !== -1) {
          lastPayment = moment(
            fullPaymentHistory[idx]['debitDate'],
            'YYYY-MM-DD HH:mm:ss',
          );
          if (
            moment(member.contractStartDate, 'YYYY-MM-DD').isAfter(lastPayment)
          ) {
            lastPayment = moment(member.contractStartDate, 'YYYY-MM-DD');
          }
        } else {
          lastPayment = moment(member.contractStartDate, 'YYYY-MM-DD');
        }

        var failedIdx = failedPaymentHistory.findIndex(payment => {
          if (getAttributeValue(this.props.space, 'POS System') === 'Bambora')
            return (
              payment.yourSystemReference === member.customerId &&
              moment(payment.debitDate, 'YYYY-MM-DD HH:mm:sss').isAfter(
                lastPayment,
              )
            );
          else {
            return payment.yourSystemReference === member.customerId;
          }
        });
        var isConcerned = this.isConcernedMember(
          members,
          member,
          lastPayment,
          fullPaymentHistory,
          concernedDate,
          concernedMembers,
        );
        if (
          failedIdx === -1 &&
          !this.isCashMember(members, member, lastPayment, cashPayments) &&
          !isConcerned
        ) {
          var paymentPeriod = member.billingPeriod;
          var period = 'months';
          var periodCount = 1;
          if (paymentPeriod === 'Daily') {
            period = 'days';
          } else if (paymentPeriod === 'Weekly') {
            period = 'weeks';
          } else if (paymentPeriod === 'Fortnightly') {
            period = 'weeks';
            periodCount = 2;
          } else if (paymentPeriod === 'Monthly') {
            period = 'months';
          } else if (paymentPeriod === 'Yearly') {
            period = 'years';
          }
          if (lastPayment.isAfter(moment())) {
            lastPayment = lastPayment.subtract(period, periodCount);
          }

          // Find first billing date inside period
          var nextBillingDate = lastPayment.add(period, periodCount);
          while (nextBillingDate.isBefore(fromDate)) {
            nextBillingDate = nextBillingDate.add(period, periodCount);
          }
          // Only valid if period is in the future
          if (toDate.isAfter(moment())) {
            var count = 1;
            while (
              (nextBillingDate.isAfter(fromDate, 'day') ||
                nextBillingDate.isSame(fromDate, 'day')) &&
              (nextBillingDate.isBefore(toDate, 'day') ||
                nextBillingDate.isSame(toDate, 'day'))
            ) {
              // Need to check if a Cancellation or Freeze is valid
              // nextBillingDate must not be after and Cancellation start dates
              // or and Freeze start dates
              if (
                !this.noCancellationRequests(
                  cancellationRequests,
                  member,
                  nextBillingDate,
                ) &&
                !this.noFreezeRequests(
                  freezeRequests,
                  resumeFreezeRequests,
                  member.member !== undefined ? member.member : member,
                  nextBillingDate,
                )
              ) {
                forecastHolders[forecastHolders.length] = member;
                forecastHoldersValue += Number(member.billingAmount);
                console.log(
                  'Forecast,' +
                    count +
                    ' ' +
                    member['firstName'] +
                    ' ' +
                    member['lastName'] +
                    ' - ' +
                    member['billingId'] +
                    ',' +
                    Number(member.billingAmount).toFixed(2) +
                    ',' +
                    nextBillingDate.format('YYYY-MM-DD'),
                );

                nextBillingDate = nextBillingDate.add(period, periodCount);
                count += 1;
              } else {
                nextBillingDate = nextBillingDate.add(period, periodCount);
              }
            }
          }
        } else if (failedIdx !== -1) {
          console.log(
            'Overdue Member,' +
              member.customerId +
              ',' +
              member['firstName'] +
              ' ' +
              member['lastName'] +
              ',' +
              member.billingAmount,
          );
        } else if (isConcerned && parseFloat(member.billingAmount) !== 0) {
          console.log(
            'Concerned Member,' +
              member.customerId +
              ',' +
              member['firstName'] +
              ' ' +
              member['lastName'] +
              ',' +
              member.billingAmount,
          );
        }
      }
    });
    //  }

    additionalServicesRecords.forEach((service, i) => {
      // Find latest payment date
      var idx = paymentHistory.findIndex(item => {
        return service.values['Member ID'] === item.yourSystemReference;
      });
      var lastPayment;
      if (idx !== -1) {
        lastPayment = moment(
          paymentHistory[idx]['debitDate'],
          'YYYY-MM-DD HH:mm:ss',
        );
      } else {
        lastPayment = moment(service.values['Start Date'], 'YYYY-MM-DD');
      }
      var paymentPeriod = service.values['Payment Frequency'];
      var period = 'months';
      var periodCount = 1;
      if (paymentPeriod === 'Daily') {
        period = 'days';
      } else if (paymentPeriod === 'Weekly') {
        period = 'weeks';
      } else if (paymentPeriod === 'Fortnightly') {
        period = 'weeks';
        periodCount = 2;
      } else if (paymentPeriod === 'Monthly') {
        period = 'months';
      } else if (paymentPeriod === 'Yearly') {
        period = 'years';
      }
      if (lastPayment.isAfter(moment())) {
        lastPayment = lastPayment.subtract(period, periodCount);
      }

      var nextBillingDate = lastPayment.add(period, periodCount);
      while (nextBillingDate.isBefore(fromDate)) {
        nextBillingDate = nextBillingDate.add(period, periodCount);
      }
      if (toDate.isAfter(moment())) {
        var count = 1;
        while (
          (nextBillingDate.isAfter(fromDate) ||
            nextBillingDate.isSame(fromDate)) &&
          (nextBillingDate.isBefore(toDate) || nextBillingDate.isSame(toDate))
        ) {
          forecastHolders[forecastHolders.length] = service;
          forecastHoldersValue += Number(service.values['Fee']);
          console.log(
            'Additional Forecast,' +
              count +
              ' ' +
              service.values['Student First Name'] +
              ' ' +
              service.values['Student Last Name'] +
              ' - ' +
              service.values['Billing ID'] +
              ',' +
              Number(service.values['Fee']) +
              ',' +
              nextBillingDate.format('YYYY-MM-DD'),
          );

          nextBillingDate = nextBillingDate.add(period, periodCount);
          count += 1;
        }
      }
    });

    let salesTaxValue = 0;
    posOrders.forEach(pos => {
      //      if (getAttributeValue(this.props.space, 'POS System') === 'Square') {
      var idx = members.findIndex(item => item.id === pos.values['Person ID']);
      if (idx !== -1) {
        if (
          posPeople.findIndex(item => item.id === pos.values['Person ID']) ===
          -1
        ) {
          posPeople[posPeople.length] = members[idx];
        }
      } else {
        idx = leads.findIndex(item => item.id === pos.values['Person ID']);
        if (idx !== -1) {
          if (
            posPeople.findIndex(item => item.id === pos.values['Person ID']) ===
            -1
          ) {
            posPeople[posPeople.length] = leads[idx];
          }
        } else {
          var idx = members.findIndex(
            item =>
              item.values['Lead Submission ID'] === pos.values['Person ID'],
          );
          if (idx !== -1) {
            if (
              posPeople.findIndex(
                item =>
                  item.values['Lead Submission ID'] === pos.values['Person ID'],
              ) === -1
            ) {
              posPeople[posPeople.length] = members[idx];
            }
          }
        }
      }
      //      }
      if (
        pos.values['Sales Tax'] !== undefined &&
        pos.values['Sales Tax'] !== null &&
        pos.values['Sales Tax'] !== ''
      ) {
        salesTaxValue += Number.parseFloat(pos.values['Sales Tax']);
      }
    });

    posPeople.forEach(person => {
      posPaymentsValue += /*this.getTotalValue(pos);*/ this.getMemberPOS(
        members,
        person,
        posOrders,
      );
    });

    console.log('customerRefunds:' + customerRefunds.length);

    customerRefunds.forEach(refund => {
      console.log('customerRefunds refund:' + refund.paymentAmount);
      refundValue += refund.paymentAmount;
      var idx = members.findIndex(
        item =>
          item.values['Member ID'] === refund.yourSystemReference ||
          item.values['First Name'] + ' ' + item.values['Last Name'] ===
            refund.customerName,
      );
      if (idx !== -1) {
        var mIdx;
        mIdx = refundMembers.findIndex(
          item =>
            item.member.values['Member ID'] === refund.yourSystemReference ||
            item.member.values['First Name'] +
              ' ' +
              item.member.values['Last Name'] ===
              refund.customerName,
        );
        if (mIdx === -1) {
          refundMembers[refundMembers.length] = {
            member: members[idx],
            refundValue: refund.paymentAmount,
          };
        } else {
          refundMembers[mIdx]['refundValue'] += refund.paymentAmount;
        }
      } else {
        var pIdx = fullPaymentHistory.findIndex(
          payment => payment.paymentID === refund.yourSystemReference,
        );
        if (pIdx !== -1) {
          var mIdx = members.findIndex(
            member =>
              member.values['Billing Customer Id'] ===
              fullPaymentHistory[pIdx].yourSystemReference,
          );
          if (mIdx !== -1) {
            var rIdx = refundMembers.findIndex(
              item =>
                item.member.values['Member ID'] ===
                members[mIdx].values['Member ID'],
            );
            if (rIdx === -1) {
              refundMembers[refundMembers.length] = {
                member: members[mIdx],
                refundValue: refund.paymentAmount,
              };
            } else {
              refundMembers[rIdx]['refundValue'] += refund.paymentAmount;
            }
          }
        }
      }
      console.log(
        'Refund,' +
          ' ' +
          refund.yourSystemReference +
          ' ' +
          refund.paymentAmount,
      );
    });

    return {
      accountHolders: { members: accountHolders, value: accountHoldersValue },
      additionalServices: {
        members: additionalServices,
        value: additionalServicesValue,
      },
      forecastHolders: {
        members: forecastHolders,
        value: forecastHoldersValue,
      },
      posPayments: { members: posPeople, value: posPaymentsValue },
      salesTax: { members: [], value: salesTaxValue.toFixed(2) },
      refundMembers: { members: refundMembers, value: refundValue.toFixed(2) },
      cashPayments: {
        members: cashPayments,
        value: cashPaymentsValue,
      },
      concernedMembers: concernedMembers,
    };
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: moment(event.target.value),
    });
  }

  handleSubmit(event) {
    if (!this.state.repFromDate || !this.state.repToDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        isShowCustom: false,
        repFromDate: this.state.repFromDate
          .hour(0)
          .minute(0)
          .second(0)
          .millisecond(0),
        repToDate: this.state.repToDate
          .hour(23)
          .minute(59)
          .second(59),
      });
      this.refreshData(this.state.repFromDate, this.state.repToDate);
    }
  }
  setStatisticDates(e, repViewPeriod, repBillingPeriod) {
    let fromDate = moment();
    let toDate = moment();
    if (repViewPeriod === 'this_period') {
      if (repBillingPeriod === 'weekly') {
        fromDate.day(1);
      }
      if (repBillingPeriod === 'fortnightly') {
        fromDate.day(1);
      }
      if (repBillingPeriod === 'monthly') {
        fromDate.date(1);
      }

      fromDate
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
      if (repBillingPeriod === 'weekly') {
        toDate
          .day(1)
          .add(1, 'weeks')
          .subtract(1, 'days');
      }
      if (repBillingPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (repBillingPeriod === 'monthly') {
        toDate
          .date(1)
          .add(1, 'months')
          .subtract(1, 'days');
      }
      toDate
        .hour(23)
        .minute(59)
        .minute(59)
        .second(59);
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'next_period') {
      if (repBillingPeriod === 'weekly') {
        fromDate.add(1, 'weeks').day(1);
      }
      if (repBillingPeriod === 'fortnightly') {
        fromDate.add(2, 'weeks').day(1);
      }
      if (repBillingPeriod === 'monthly') {
        fromDate.add(1, 'months').date(1);
      }
      fromDate
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
      if (repBillingPeriod === 'weekly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (repBillingPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(4, 'weeks')
          .subtract(1, 'days');
      }
      if (repBillingPeriod === 'monthly') {
        toDate
          .date(1)
          .add(2, 'months')
          .subtract(1, 'days');
      }
      toDate
        .hour(23)
        .minute(59)
        .minute(59)
        .second(59);
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'last_period') {
      if (repBillingPeriod === 'weekly') {
        fromDate.subtract(1, 'weeks').day(1);
      }
      if (repBillingPeriod === 'fortnightly') {
        fromDate.subtract(2, 'weeks').day(1);
      }
      if (repBillingPeriod === 'monthly') {
        fromDate.subtract(1, 'months').date(1);
      }
      fromDate
        .hour(0)
        .minute(0)
        .second(0)
        .millisecond(0);
      if (repBillingPeriod === 'weekly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repBillingPeriod === 'fortnightly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repBillingPeriod === 'monthly') {
        toDate.date(1).subtract(1, 'days');
      }
      toDate
        .hour(23)
        .minute(59)
        .minute(59)
        .second(59);
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'custom') {
      var lastActive = $('.dateSettings button[active=true]');
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: true,
        lastDateRange: this.state.dateRange,
        lastActive: lastActive,
      });
    }
  }
  getMemberPOS(members, person, posOrders) {
    var pos = 0;
    posOrders.forEach((order, i) => {
      if (
        order.values['Person ID'] === person['id'] ||
        order.values['Person ID'] === person.values['Lead Submission ID']
      ) {
        pos += Number.parseFloat(order.values['Total']);
      }
    });
    return pos;
  }
  getMemberRefunds(members, member, refunds, paymentHistory) {
    /*    var payments = paymentHistory.filter(
      payment =>
        payment['yourSystemReference'] === member.values['Billing Customer Id'],
    );

    var refundVal = 0;
    refunds.forEach((refund, i) => {
      if (
        payments.findIndex(
          payment => payment.paymentID === refund.yourSystemReference,
        ) !== -1
      ) {
        refundVal += Number.parseFloat(refund.paymentAmount);
      }
    }); */
    return member.refundValue;
  }

  getAdditionalServicesFee(additionalServices, member) {
    /*    var fee = 0;
    additionalServices.forEach((service, i) => {
      if (
        service.values['Member ID'] === member.values['Member ID'] &&
        member['Service Name'] === service.values['Name']
      ) {
        fee = fee + parseFloat(service.values['Fee']);
      }
    });
*/
    return member['Service Charge'];
  }
  getCashPaymentAmount(payments, member) {
    var amount = 0;
    payments.forEach((payment, i) => {
      if (payment.member.values['Member ID'] === member.values['Member ID']) {
        amount = amount + parseFloat(payment.amount);
      }
    });

    return amount;
  }
  getAdditionalServiceName(additionalServices, member) {
    var name = '';
    additionalServices.forEach((service, i) => {
      if (
        service.values['Member ID'] === member.values['Member ID'] &&
        member['Service Name'] === service.values['Name']
      ) {
        name = member['Service Name'];
      }
    });

    return name;
  }
  getMemberFee(members, member) {
    if (
      member.values['Non Paying'] !== null &&
      member.values['Non Paying'] !== undefined &&
      member.values['Non Paying'] === 'YES'
    )
      return 'Non Paying';
    if (
      member.values['Family Fee Details'] !== null &&
      member.values['Family Fee Details'] !== undefined
    ) {
      let json = getJson(member.values['Family Fee Details']);
      for (var i = 0; i < json.length; i++) {
        if (json[i]['id'] === member.id) {
          return json[i]['fee'];
        }
      }
    }

    if (
      member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== undefined
    ) {
      let parent = members.findIndex(mem => {
        return mem.id === member.values['Billing Parent Member'];
      });
      if (parent !== -1) {
        let json = getJson(members[parent].values['Family Fee Details']);
        for (var i = 0; i < json.length; i++) {
          if (json[i]['id'] === member.id) {
            return json[i]['fee'];
          }
        }
      }
    }

    if (
      member.values['Membership Cost'] !== null &&
      member.values['Membership Cost'] !== undefined
    )
      return member.values['Membership Cost'];
    return '';
  }
  getMemberPeriod(members, member) {
    if (
      member.values['Billing Parent Member'] !== null &&
      member.values['Billing Parent Member'] !== undefined
    ) {
      let parent = members.findIndex(mem => {
        return mem.id === member.values['Billing Parent Member'];
      });
      if (
        parent !== -1 &&
        members[parent].values['Billing Payment Period'] !== null &&
        members[parent].values['Billing Payment Period'] !== undefined
      ) {
        return members[parent].values['Billing Payment Period'];
      }
    }

    if (
      member.values['Billing Payment Period'] !== null &&
      member.values['Billing Payment Period'] !== undefined
    )
      return member.values['Billing Payment Period'];
    return '';
  }
  getMembers(allMembers, members, billingCustomers, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      members_col[members_col.length] = {
        memberId: members[i].id,
        name:
          members[i].values['Last Name'] +
          ' ' +
          members[i].values['First Name'],
        fee:
          members[i].id !== 'Orphan'
            ? this.getMemberFee(allMembers, members[i])
            : members[i].fee,
        cost:
          members[i].id !== 'Orphan'
            ? this.getScheduledPayment(members[i], billingCustomers)
            : members[i].fee,
        period:
          members[i].id !== 'Orphan'
            ? this.getMemberPeriod(allMembers, members[i])
            : 'Unknown',
      };
    }

    return members_col;
  }
  getAdditionalServiceMembers(allMembers, members, additionalServices, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      var fee = this.getAdditionalServicesFee(additionalServices, members[i]);
      members_col[members_col.length] = {
        memberId: members[i].id,
        name:
          members[i].values['Last Name'] +
          ' ' +
          members[i].values['First Name'],
        fee: fee,
        cost: fee,
        period: this.getAdditionalServiceName(additionalServices, members[i]),
      };
    }

    return members_col;
  }
  getCashPaymentMembers(allMembers, members, cashPayments, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      var amount = this.getCashPaymentAmount(members, members[i].member);
      members_col[members_col.length] = {
        memberId: members[i].member.id,
        name:
          members[i].member.values['Last Name'] +
          ' ' +
          members[i].member.values['First Name'],
        fee: amount,
        cost: amount,
        period: 'Cash',
      };
    }

    return members_col;
  }
  getPOSMembers(allMembers, members, billingCustomers, posOrders, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      members_col[members_col.length] = {
        memberId: members[i].id,
        type:
          allMembers.findIndex(member => member.id === members[i].id) !== -1
            ? 'Member'
            : 'Lead',
        name:
          members[i].values['Last Name'] +
          ' ' +
          members[i].values['First Name'],
        pos: this.getMemberPOS(allMembers, members[i], posOrders),
      };
    }

    return members_col;
  }
  getRefundMembers(
    allMembers,
    members,
    billingCustomers,
    refunds,
    col,
    paymentHistory,
  ) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      members_col[members_col.length] = {
        memberId: members[i].member.id,
        type:
          allMembers.findIndex(member => member.id === members[i].id) !== -1
            ? 'Member'
            : 'Lead',
        name:
          members[i].member.values['Last Name'] +
          ' ' +
          members[i].member.values['First Name'],
        refund: this.getMemberRefunds(
          allMembers,
          members[i],
          refunds,
          paymentHistory,
        ),
      };
    }

    return members_col;
  }
  getScheduledPayment(member, billingCustomers) {
    if (
      member.values['Billing User'] !== null &&
      member.values['Billing User'] !== undefined &&
      member.values['Billing User'] === 'YES'
    ) {
      let billingIdx = billingCustomers.findIndex(
        element => element.customerId === member.values['Billing Customer Id'],
      );
      if (billingIdx === -1) return 0;
      let billing = billingCustomers[billingIdx];

      return billing.billingAmount;
    }

    return 0;
  }

  getMemberTableData(members, billingCustomers) {
    members.sort(function(a, b) {
      if (a.values['Last Name'] < b.values['Last Name']) {
        return -1;
      } else if (a.values['Last Name'] > b.values['Last Name']) {
        return 1;
      }
      return 0;
    });

    let members_col1 = this.getMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      1,
    );
    let members_col2 = this.getMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      2,
    );

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
        },
      },
    ];
  }
  getAdditionalServicesTableData(members, additionalServices) {
    members.sort(function(a, b) {
      if (a.values['Last Name'] < b.values['Last Name']) {
        return -1;
      } else if (a.values['Last Name'] > b.values['Last Name']) {
        return 1;
      }
      return 0;
    });

    let members_col1 = this.getAdditionalServiceMembers(
      this.state.allMembers,
      members,
      additionalServices,
      1,
    );
    let members_col2 = this.getAdditionalServiceMembers(
      this.state.allMembers,
      members,
      additionalServices,
      2,
    );

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
        },
      },
    ];
  }
  getCashPaymentsTableData(members, cashPayments) {
    members.sort(function(a, b) {
      if (a.member.values['Last Name'] < b.member.values['Last Name']) {
        return -1;
      } else if (a.member.values['Last Name'] > b.member.values['Last Name']) {
        return 1;
      }
      return 0;
    });

    let members_col1 = this.getCashPaymentMembers(
      this.state.allMembers,
      members,
      cashPayments,
      1,
    );
    let members_col2 = this.getCashPaymentMembers(
      this.state.allMembers,
      members,
      cashPayments,
      2,
    );

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
        },
      },
    ];
  }
  getMemberPOSTableData(members, billingCustomers, posOrders) {
    members.sort(function(a, b) {
      if (a.values['Last Name'] < b.values['Last Name']) {
        return -1;
      } else if (a.values['Last Name'] > b.values['Last Name']) {
        return 1;
      }
      return 0;
    });

    let members_col1 = this.getPOSMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      posOrders,
      1,
    );
    let members_col2 = this.getPOSMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      posOrders,
      2,
    );

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
        },
      },
    ];
  }
  getMemberRefundsTableData(
    members,
    billingCustomers,
    refunds,
    paymentHistory,
  ) {
    members.sort(function(a, b) {
      if (a.member.values['Last Name'] < b.member.values['Last Name']) {
        return -1;
      } else if (a.member.values['Last Name'] > b.member.values['Last Name']) {
        return 1;
      }
      return 0;
    });

    let members_col1 = this.getRefundMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      refunds,
      1,
      paymentHistory,
    );
    let members_col2 = this.getRefundMembers(
      this.state.allMembers,
      members,
      billingCustomers,
      refunds,
      2,
      paymentHistory,
    );

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
        },
      },
    ];
  }
  getMemberRowTableColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <div className="">
              {this.state.showAccountHolders === true ? (
                props.original.members_col1['cost'] === '' ||
                props.original.members_col1['cost'] === 'Non Paying' ? (
                  <div>{props.original.members_col1['cost']}</div>
                ) : (
                  new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(props.original.members_col1['cost'])
                )
              ) : props.original.members_col1['fee'] === '' ||
                props.original.members_col1['fee'] === 'Non Paying' ? (
                <div>{props.original.members_col1['fee']}</div>
              ) : (
                new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(props.original.members_col1['fee'])
              )}
            </div>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <div className="">
              <I18n>{props.original.members_col1['period']}</I18n>
            </div>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <div className="">
              {this.state.showAccountHolders === true ? (
                props.original.members_col2['cost'] === '' ||
                props.original.members_col2['cost'] === 'Non Paying' ? (
                  <div>{props.original.members_col2['cost']}</div>
                ) : (
                  new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(props.original.members_col2['cost'])
                )
              ) : props.original.members_col2['fee'] === '' ||
                props.original.members_col2['fee'] === 'Non Paying' ? (
                <div>{props.original.members_col2['fee']}</div>
              ) : (
                new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(props.original.members_col2['fee'])
              )}
            </div>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <div className="">
              <I18n>{props.original.members_col2['period']}</I18n>
            </div>
          );
        },
      },
    ];
  };
  getMemberPOSRowTableColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${
                props.original.members_col1['type'] === 'Member'
                  ? 'Member'
                  : 'LeadDetail'
              }/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <div className="">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.members_col1['pos'])}
            </div>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${
                props.original.members_col2['type'] === 'Member'
                  ? 'Member'
                  : 'LeadDetail'
              }/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <div className="">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.members_col2['pos'])}
            </div>
          );
        },
      },
    ];
  };
  getMemberRefundsRowTableColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col refund',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <div className="">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.members_col1['refund'])}
            </div>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col refund',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <div className="">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.members_col2['refund'])}
            </div>
          );
        },
      },
    ];
  };
  getMemberTableHeaderName() {
    if (this.state.showAccountHolders) return 'Memberships';
    if (this.state.showAdditionalServices) return 'Additional Services';
    if (this.state.showCashPayments) return 'Cash Payments';
    if (this.state.showPOSPeople) return 'ProShop Member/Lead';
    if (this.state.showRefundMembers) return 'Refunds';
  }
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: this.getMemberTableHeaderName(),
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this.getMemberRowTableColumns()}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
  getMemberPOSTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: this.getMemberTableHeaderName(),
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this.getMemberPOSRowTableColumns()}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
  getMemberRefundsTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: this.getMemberTableHeaderName(),
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this.getMemberRefundsRowTableColumns()}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
  render() {
    return (
      <span className="financialStats">
        {this.state.showConcernedMembers && (
          <div className="members concernedMembers">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showConcernedMembers: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <div className="concernedMembers">
              <span className="concernedMembersHelp">
                <table>
                  <tbody>
                    <tr>
                      <td className="col1" colSpan="2">
                        When calculating the forecast values for a period. These
                        members have data that needs to be reviewed. The member
                        has not been included in the forecast calculation.
                      </td>
                    </tr>
                  </tbody>
                </table>
              </span>
              <div className="concernedMembersInfo">
                <table>
                  <tbody>
                    <tr>
                      <th>Name</th>
                      <th>Last Billing Date</th>
                    </tr>
                    {this.state.repMemberData.concernedMembers
                      .filter(member => {
                        if (
                          member.member !== undefined &&
                          member.member.values['Billing Payment Type'] ===
                            'Cash'
                        ) {
                          return false;
                        }
                        return true;
                      })
                      .map((member, index) => (
                        <tr key={index}>
                          <td className="left">
                            {member.member !== undefined && (
                              <NavLink
                                to={`/Member/${member.member.id}`}
                                className=""
                              >
                                {member['firstName'] + ' ' + member['lastName']}
                              </NavLink>
                            )}
                            {member.member === undefined && (
                              <span>
                                {member['firstName'] + ' ' + member['lastName']}
                              </span>
                            )}
                          </td>
                          <td>{member.contractStartDate}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        {this.state.showAccountHolders && (
          <div className="members">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showAccountHolders: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getMemberTableData(
                this.state.repMemberData.accountHolders.members,
                this.state.billingCustomers,
              )}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {this.state.showAdditionalServices && (
          <div className="members">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showAdditionalServices: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getAdditionalServicesTableData(
                this.state.repMemberData.additionalServices.members,
                this.state.additionalServices,
              )}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {this.state.showCashPayments && (
          <div className="members">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showCashPayments: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getCashPaymentsTableData(
                this.state.repMemberData.cashPayments.members,
                this.state.cashPayments,
              )}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {this.state.showPOSPeople && (
          <div className="members">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showPOSPeople: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberPOSTableColumns()}
              data={this.getMemberPOSTableData(
                this.state.repMemberData.posPayments.members,
                this.state.billingCustomers,
                this.posOrders,
              )}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {this.state.showRefundMembers && (
          <div className="members">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showRefundMembers: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberRefundsTableColumns()}
              data={this.getMemberRefundsTableData(
                this.state.repMemberData.refundMembers.members,
                this.state.billingCustomers,
                this.refunds,
                this.paymentHistory,
              )}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}

        <span className="line">
          <div className="radioGroup">
            <br />
            <label htmlFor="repWeekly" className="radio">
              <input
                id="repWeekly"
                name="reportPeriod"
                type="radio"
                value="Weekly"
                onChange={e => {
                  this.setState({
                    repBillingPeriod: 'weekly',
                    repViewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'weekly');
                }}
                defaultChecked={
                  this.state.repBillingPeriod === 'weekly'
                    ? 'defaultChecked'
                    : ''
                }
              />
              Weekly
            </label>
            <label htmlFor="repFortnightly" className="radio">
              <input
                id="repFortnightly"
                name="reportPeriod"
                type="radio"
                value="Fortnightly"
                onChange={e => {
                  this.setState({
                    repBillingPeriod: 'fortnightly',
                    repViewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'fortnightly');
                }}
                defaultChecked={
                  this.state.repBillingPeriod === 'fortnightly'
                    ? 'defaultChecked'
                    : ''
                }
              />
              <I18n>Fortnightly</I18n>
            </label>
            <label htmlFor="repMonthly" className="radio">
              <input
                id="repMonthly"
                name="reportPeriod"
                type="radio"
                value="Monthly"
                onChange={e => {
                  this.setState({
                    repBillingPeriod: 'monthly',
                    repViewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'monthly');
                }}
                defaultChecked={
                  this.state.repBillingPeriod === 'monthly'
                    ? 'defaultChecked'
                    : ''
                }
              />
              Monthly
            </label>
          </div>
        </span>

        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'last_period',
                });
                this.setStatisticDates(
                  e,
                  'last_period',
                  this.state.repBillingPeriod,
                );
              }}
            >
              Last{' '}
              {this.state.repBillingPeriod === 'weekly'
                ? 'Week'
                : this.state.repBillingPeriod === 'fortnightly'
                ? 'Fortnights'
                : 'Month'}
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'this_period',
                });
                this.setStatisticDates(
                  e,
                  'this_period',
                  this.state.repBillingPeriod,
                );
              }}
            >
              This{' '}
              {this.state.repBillingPeriod === 'weekly'
                ? 'Week'
                : this.state.repBillingPeriod === 'fortnightly'
                ? 'Fortnight'
                : 'Month'}
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'custom',
                });
                this.setStatisticDates(
                  e,
                  'custom',
                  this.state.repBillingPeriod,
                );
              }}
            >
              Custom
            </button>
          </div>
          {this.state.isShowCustom && (
            <div
              className="stat_customDatesContainer"
              onClose={this.handleClose}
            >
              <div className="attendanceByDateDiv" onClose={this.handleClose}>
                <div className="col-md-8">
                  <div className="row">
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="fromDate" className="control-label">
                        From Date
                      </label>
                      <DayPickerInput
                        name="fromDate"
                        id="fromDate"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={this.state.repFromDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            repFromDate: moment(selectedDay),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="toDate" className="control-label">
                        To Date
                      </label>
                      <DayPickerInput
                        name="toDate"
                        id="toDate"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={this.state.repToDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            repToDate: moment(selectedDay),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group col-xs-2">
                      <label className="control-label">&nbsp;</label>
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleClose()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="form-group col-xs-2">
                      <label className="control-label">&nbsp;</label>
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleSubmit()}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <span className="label">
            {this.state.repFromDate.format('L')} to{' '}
            {this.state.repToDate.format('L')}
          </span>
        </div>
        {this.props.billingReportCustomersLoading ||
        this.props.FINSUCCESSFULpaymentHistoryLoading ||
        this.props.customerRefundsLoading ||
        this.props.servicesLoading ||
        this.props.posOrdersLoading ? (
          <div className="memberFinanceReport">Loading information ...</div>
        ) : (
          <div className="memberFinanceReport">
            <div className="row header1">
              <div className="column col1"></div>
              <div className="column col2">{this.currencySymbol} Amount</div>
              <div className="column col3">%</div>
              <div className="column col4">
                {getAttributeValue(
                  this.props.space,
                  'ProShop Sales Tax Label',
                ) === undefined ? (
                  <I18n>SALES TAX</I18n>
                ) : (
                  getAttributeValue(this.props.space, 'ProShop Sales Tax Label')
                )}
              </div>
            </div>
            <div className="row header2">
              <div className="column col1">REVENUE</div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
                      this.state.repMemberData.cashPayments.value +
                      this.state.repMemberData.posPayments.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header4">
              <div className="column col1">Membership</div>
              <div className="column col2">
                <div
                  className="dollarValue membersLink"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: true,
                      showAdditionalServices: false,
                      showCashPayments: false,
                      showPOSPeople: false,
                      showRefundMembers: false,
                    })
                  }
                >
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.accountHolders.value)}
                </div>
              </div>
              <div className="column col3">
                <div className="percentValue">
                  {(
                    (this.state.repMemberData.accountHolders.value /
                      (this.state.repMemberData.accountHolders.value +
                        this.state.repMemberData.posPayments.value)) *
                    100
                  ).toFixed(2)}
                  %
                </div>
              </div>
              <div className="column col4"></div>
            </div>
            <div className="row header4">
              <div className="column col1">Membership Cash Payments</div>
              <div className="column col2">
                <div
                  className="dollarValue membersLink"
                  onClick={e =>
                    this.setState({
                      showAdditionalServices: false,
                      showCashPayments: true,
                      showAccountHolders: false,
                      showPOSPeople: false,
                      showRefundMembers: false,
                    })
                  }
                >
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.cashPayments.value)}
                </div>
              </div>
              <div className="column col3">
                <div className="percentValue"></div>
              </div>
              <div className="column col4"></div>
            </div>
            {getAttributeValue(this.props.space, 'Billing Company') ===
              'Bambora' && (
              <div className="row header4">
                <div className="column col1">Additional Services</div>
                <div className="column col2">
                  <div
                    className="dollarValue membersLink"
                    onClick={e =>
                      this.setState({
                        showAdditionalServices: true,
                        showCashPayments: false,
                        showAccountHolders: false,
                        showPOSPeople: false,
                        showRefundMembers: false,
                      })
                    }
                  >
                    {new Intl.NumberFormat(this.locale, {
                      style: 'currency',
                      currency: this.currency,
                    }).format(
                      this.state.repMemberData.additionalServices.value,
                    )}
                  </div>
                </div>
                <div className="column col3">
                  <div className="percentValue"></div>
                </div>
                <div className="column col4"></div>
              </div>
            )}
            <div className="row header5">
              <div className="column col1">ProShop</div>
              <div className="column col2">
                <div
                  className="dollarValue  membersLink"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showAdditionalServices: false,
                      showCashPayments: false,
                      showPOSPeople: true,
                      showRefundMembers: false,
                    })
                  }
                >
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.posPayments.value)}
                </div>
              </div>
              <div className="column col3">
                <div className="percentValue">
                  {(
                    (this.state.repMemberData.posPayments.value /
                      (this.state.repMemberData.accountHolders.value +
                        this.state.repMemberData.posPayments.value)) *
                    100
                  ).toFixed(2)}
                  %
                </div>
              </div>
              <div className="column col4">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.salesTax.value)}
                </div>
              </div>
            </div>
            <div className="row header6">
              <div className="column col1">Refunds</div>
              <div className="column col2">
                <div
                  className="dollarValue  membersLink"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showAdditionalServices: false,
                      showCashPayments: false,
                      showPOSPeople: false,
                      showRefundMembers: true,
                    })
                  }
                >
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.refundMembers.value)}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header7">
              <div className="column col1">TOTAL</div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
                      this.state.repMemberData.cashPayments.value +
                      this.state.repMemberData.additionalServices.value +
                      this.state.repMemberData.posPayments.value -
                      this.state.repMemberData.refundMembers.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header8">
              <div className="column col1">
                Membership-Refunds+ProShop+Forecast
              </div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
                      this.state.repMemberData.cashPayments.value +
                      this.state.repMemberData.posPayments.value +
                      this.state.repMemberData.forecastHolders.value -
                      this.state.repMemberData.refundMembers.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header9">
              <div className="column col1">
                Forecast
                <SVGInline
                  svg={helpIcon}
                  className="icon help"
                  onClick={e => {
                    this.setState({
                      showConcernedMembers: true,
                    });
                  }}
                />
              </div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.repMemberData.forecastHolders.value)}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header10">
              <div className="column col1">Membership+Forecast</div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
                      this.state.repMemberData.cashPayments.value +
                      this.state.repMemberData.forecastHolders.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header10">
              <div className="column col1">Membership+Forecast-Refunds</div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
                      this.state.repMemberData.cashPayments.value +
                      this.state.repMemberData.forecastHolders.value -
                      this.state.repMemberData.refundMembers.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
          </div>
        )}
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const MemberFinancialReportContainer = enhance(MemberFinancialReport);

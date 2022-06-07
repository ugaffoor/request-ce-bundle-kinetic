import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import { getCurrency, getTimezoneOff } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { I18n } from '../../../../app/src/I18nProvider';
import { actions } from '../../redux/modules/members';
import { actions as posActions } from '../../redux/modules/pos';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import SVGInline from 'react-svg-inline';
import crossIcon from '../../images/cross.svg?raw';

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  FAILEDpaymentHistory: state.member.members.FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading: state.member.members.FALIEDpaymentHistoryLoading,
  paymentHistory: state.member.members.SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading:
    state.member.members.SUCCESSFULpaymentHistoryLoading,
  space: state.member.app.space,
  billingReportCustomersLoading: state.member.members.billingCustomersLoading,
  billingCustomers: state.member.members.billingCustomers,
  posOrdersLoading: state.member.pos.posOrdersLoading,
  posOrders: state.member.pos.posOrders,
  customerRefunds: state.member.members.customerRefunds,
  customerRefundsLoading: state.member.members.customerRefundsLoading,
});

const mapDispatchToProps = {
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
  fetchPOSOrders: posActions.fetchPOSOrders,
  fetchCustomerRefunds: actions.fetchCustomerRefunds,
  setCustomerRefunds: actions.setCustomerRefunds,
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

    let repFromDate = this.setFromDate.hour(0).minute(0);
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
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.billingReportCustomersLoading &&
      !nextProps.FAILEDpaymentHistoryLoading &&
      !nextProps.SUCCESSFULpaymentHistoryLoading &&
      !nextProps.customerRefundsLoading &&
      !nextProps.posOrdersLoading
    ) {
      this.failedPaymentHistory = [];
      nextProps.FAILEDpaymentHistory.forEach((item, i) => {
        this.failedPaymentHistory[this.failedPaymentHistory.length] = item;
      });
      this.paymentHistory = [];
      nextProps.paymentHistory.forEach((item, i) => {
        // only keep period payments
        if (
          moment(item.debitDate, 'YYYY-MM-DD HH:mm:ss').isBetween(
            this.state.repFromDate,
            this.state.repToDate,
          )
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
        nextProps.billingCustomers.forEach((member, i) => {
          var hIdx = this.paymentHistory.findIndex(
            payment => payment.yourSystemReference === member.customerId,
          );
          if (hIdx !== -1) {
            member.contractStartDate = moment(
              this.paymentHistory[hIdx].debitDate,
              'YYYY-MM-DD HH:mm:sss',
            ).format('YYYY-MM-DD');
          }
        });
      }

      this.failedPaymentHistory = this.failedPaymentHistory.filter(
        payment => payment.paymentStatus === 'DECLINED',
      );
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
          unique => unique.yourSystemReference === failed.yourSystemReference,
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
              moment(failed.debitDate, 'YYYY-MM-DD'),
            )
          );
        });

        if (idx === -1) {
          uniqueFailedHistory[uniqueFailedHistory.length] = failed;
        }
      });

      this.posOrders = [];
      nextProps.posOrders.forEach((item, i) => {
        this.posOrders[this.posOrders.length] = item;
      });

      this.refunds = [];
      nextProps.customerRefunds.forEach((item, i) => {
        this.refunds[this.refunds.length] = item;
      });

      let memberData = this.getMemberData(
        nextProps.members,
        nextProps.billingCustomers,
        uniqueFailedHistory,
        this.paymentHistory,
        this.posOrders,
        this.refunds,
        this.state.repFromDate,
        this.state.repToDate,
        this.state.repBillingPeriod,
      );
      this.setState({
        allMembers: nextProps.members,
        billingCustomers: nextProps.billingCustomers,
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
    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
      dateFrom = moment(this.state.repFromDate)
        .subtract('months', 1)
        .format('YYYY-MM-DD');
    }
    this.props.fetchPaymentHistory({
      paymentType: 'SUCCESSFUL',
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
      paymentType: 'FAILED',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: moment()
        .subtract(6, 'month')
        .format('YYYY-MM-DD'),
      dateTo: moment().format('YYYY-MM-DD'),
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
    this.props.fetchCustomerRefunds({
      dateFrom: this.state.repFromDate.format('YYYY-MM-DD'),
      dateTo: this.state.repToDate.format('YYYY-MM-DD'),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
      timezoneOffset: getTimezoneOff(),
    });
  }
  updateBillingDates(billingCustomers, SUCCESSFULpaymentHistory) {
    var payments = SUCCESSFULpaymentHistory.sort(function(a, b) {
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
        return member.customerId === item.yourSystemReference;
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
    var idx = members.findIndex(
      member =>
        member.values['Billing Customer Id'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }
  refreshData(fromDate, toDate) {
    this.paymentHistory = [];

    var dateFrom = moment(fromDate).format('YYYY-MM-DD');
    if (getAttributeValue(this.props.space, 'Billing Company') === 'Bambora') {
      dateFrom = moment(fromDate)
        .subtract('months', 1)
        .format('YYYY-MM-DD');
    }
    this.props.fetchPaymentHistory({
      paymentType: 'SUCCESSFUL',
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
    this.props.fetchPOSOrders({
      dateFrom: fromDate,
      dateTo: toDate,
      timezoneOffset: getTimezoneOff(),
    });
    this.props.fetchCustomerRefunds({
      dateFrom: fromDate.format('YYYY-MM-DD'),
      dateTo: toDate.format('YYYY-MM-DD'),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
      timezoneOffset: getTimezoneOff(),
    });
  }
  getMemberData(
    members,
    billingCustomers,
    failedPaymentHistory,
    paymentHistory,
    posOrders,
    customerRefunds,
    fromDate,
    toDate,
    repBillingPeriod,
  ) {
    if (!members || members.length <= 0) {
      return {
        accountHolders: { members: [], value: 0 },
        forecastHolders: { members: [], value: 0 },
        posPayments: { members: [], value: 0 },
        salesTax: { members: [], value: 0 },
        refundMembers: { members: [], value: 0 },
      };
    }
    // billingAmount, repBillingPeriod
    let accountHolders = [];
    let accountHoldersValue = 0;
    let forecastHolders = [];
    let forecastHoldersValue = 0;
    let posPeople = [];
    let posPaymentsValue = 0;
    let refundMembers = [];
    let refundValue = 0;
    paymentHistory.forEach(payment => {
      var member = this.isRecurringPayment(payment, members);
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
          }
        } else {
          if (payment.paymentStatus !== 'Refund') {
            console.log(
              'ORPHANED,' +
                Number(payment.paymentAmount).toFixed(2) +
                ',' +
                payment.paymentID +
                ',' +
                payment.debitDate,
            );
          }
        }
        /*      if (payment.paymentStatus === 'APPROVAL') {
          posPaymentsValue += payment.paymentAmount;
        } */
      }
    });

    //    if (fromDate.month()>=moment().month() && toDate.month()>=moment().month()) {
    billingCustomers.forEach((member, i) => {
      // Ignore failed payments
      var failedIdx = failedPaymentHistory.findIndex(payment => {
        if (getAttributeValue(this.props.space, 'POS System') === 'Bambora')
          return (
            payment.yourSystemReference === member.customerId &&
            moment(payment, 'YYYY-MM-DD HH:mm:sss').isAfter(
              moment(member.contractStartDate, 'YYYY-MM-DD'),
            )
          );
        else {
          return payment.yourSystemReference === member.customerId;
        }
      });
      if (
        (member.status === 'Active' ||
          member.status === 'Pending Freeze' ||
          member.status === 'Pending Cancellation') &&
        failedIdx === -1
      ) {
        // Find latest payment date
        var idx = paymentHistory.findIndex(item => {
          return member.customerId === item.yourSystemReference;
        });
        var lastPayment;
        if (idx !== -1) {
          lastPayment = moment(
            paymentHistory[idx]['debitDate'],
            'YYYY-MM-DD HH:mm:ss',
          );
        } else {
          lastPayment = moment(member.contractStartDate, 'YYYY-MM-DD');
        }
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

        var nextBillingDate = lastPayment.add(period, periodCount);
        while (nextBillingDate.isBefore(fromDate)) {
          nextBillingDate = nextBillingDate.add(period, periodCount);
        }
        var count = 1;
        while (
          (nextBillingDate.isAfter(fromDate) ||
            nextBillingDate.isSame(fromDate)) &&
          (nextBillingDate.isBefore(toDate) || nextBillingDate.isSame(toDate))
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
        }
      }
    });
    //  }
    let salesTaxValue = 0;
    posOrders.forEach(pos => {
      //      if (getAttributeValue(this.props.space, 'POS System') === 'Square') {
      posPaymentsValue += Number.parseFloat(pos.values['Total']);
      var idx = members.findIndex(item => item.id === pos.values['Person ID']);
      if (idx !== -1) {
        if (
          posPeople.findIndex(item => item.id === pos.values['Person ID']) ===
          -1
        ) {
          posPeople[posPeople.length] = members[idx];
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

    customerRefunds.forEach(refund => {
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
        var pIdx = paymentHistory.findIndex(
          payment => payment.paymentID === refund.yourSystemReference,
        );
        if (pIdx !== -1) {
          var mIdx = members.findIndex(
            member =>
              member.values['Billing Customer Id'] ===
              refund.yourSystemReference,
          );
          if (mIdx !== -1) {
            if (
              refundMembers.findIndex(
                item =>
                  item.member.values['Member ID'] ===
                  members[mIdx].member.values['Member ID'],
              ) === -1
            ) {
              refundMembers[refundMembers.length] = {
                member: members[idx],
                refundValue: refund.paymentAmount,
              };
            } else {
              refundMembers[mIdx]['refundValue'] += refund.paymentAmount;
            }
          }
        }
      }
    });

    return {
      accountHolders: { members: accountHolders, value: accountHoldersValue },
      forecastHolders: {
        members: forecastHolders,
        value: forecastHoldersValue,
      },
      posPayments: { members: posPeople, value: posPaymentsValue },
      salesTax: { members: [], value: salesTaxValue.toFixed(2) },
      refundMembers: { members: refundMembers, value: refundValue.toFixed(2) },
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
        repFromDate: this.state.repFromDate.hour(0).minute(0),
        repToDate: this.state.repToDate.hour(23).minute(59),
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

      fromDate.hour(0).minute(0);
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
      toDate.hour(23).minute(59);
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
      fromDate.hour(0).minute(0);
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
      toDate.hour(23).minute(59);
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
      fromDate.hour(0).minute(0);
      if (repBillingPeriod === 'weekly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repBillingPeriod === 'fortnightly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repBillingPeriod === 'monthly') {
        toDate.date(1).subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
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
  getMemberPOS(members, member, posOrders) {
    var pos = 0;
    posOrders.forEach((order, i) => {
      if (order.values['Person ID'] === member['id']) {
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
        fee: this.getMemberFee(allMembers, members[i]),
        cost: this.getScheduledPayment(members[i], billingCustomers),
        period: this.getMemberPeriod(allMembers, members[i]),
      };
    }

    return members_col;
  }
  getPOSMembers(allMembers, members, billingCustomers, posOrders, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 2) {
      members_col[members_col.length] = {
        memberId: members[i].id,
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
    if (this.state.showPOSPeople) return 'POS Member/Lead';
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
        this.props.SUCCESSFULpaymentHistoryLoading ||
        this.customerRefundsLoading ||
        this.props.posOrdersLoading ? (
          <div className="memberFinanceReport">Loading information ...</div>
        ) : (
          <div className="memberFinanceReport">
            <div className="row header1">
              <div className="column col1"></div>
              <div className="column col2">{this.currencySymbol} Amount</div>
              <div className="column col3">%</div>
              <div className="column col4">
                {getAttributeValue(this.props.space, 'POS Sales Tax Label') ===
                undefined ? (
                  <I18n>SALES TAX</I18n>
                ) : (
                  getAttributeValue(this.props.space, 'POS Sales Tax Label')
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
            <div className="row header5">
              <div className="column col1">POS</div>
              <div className="column col2">
                <div
                  className="dollarValue  membersLink"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
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
                      this.state.repMemberData.posPayments.value -
                      this.state.repMemberData.refundMembers.value,
                  )}
                </div>
              </div>
              <div className="column col3"></div>
              <div className="column col4"></div>
            </div>
            <div className="row header8">
              <div className="column col1">Membership-Refunds+POS+Forecast</div>
              <div className="column col2">
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(
                    this.state.repMemberData.accountHolders.value +
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
              <div className="column col1">Forecast</div>
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
                      this.state.repMemberData.forecastHolders.value,
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
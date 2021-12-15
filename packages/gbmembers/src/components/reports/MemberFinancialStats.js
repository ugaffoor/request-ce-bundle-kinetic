import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import {
  getJson,
  memberStatusInDates,
  memberPreviousStatus,
} from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { I18n } from '../../../../app/src/I18nProvider';

var compThis = undefined;

export class MemberFinancialStats extends Component {
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

    this._getMemberRowTableColumns = this.getMemberRowTableColumns();

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let fromDate = this.setFromDate;
    let toDate = this.setToDate;

    let memberData = this.getMemberData(undefined);
    this.state = {
      allMembers: this.props.members,
      memberData,
      fromDate,
      toDate,
      billingPeriod: 'monthly',
      viewPeriod: 'this_period',
      showTotalActiveMembers: false,
      showActiveMembers: false,
      showActiveCashMembers: false,
      showAccountHolders: false,
      showCancellationsMembers: false,
      showPendingCancellationsMembers: false,
      showFrozenMembers: false,
      showUnFrozenMembers: false,
      showRestoredMembers: false,
      showPendingFrozenMembers: false,
      showNewMembers: false,
      showVariations: false,
      showFailed: false,
      historyLoaded: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.billingCustomersLoading &&
      !nextProps.variationCustomersLoading &&
      /* !nextProps.customerRefundsLoading  && */
      !nextProps.FAILEDpaymentHistoryLoading &&
      !nextProps.SUCCESSFULpaymentHistoryLoading
    ) {
      if (getAttributeValue(nextProps.space, 'Billing Company') === 'Bambora') {
        this.updateBillingDates(
          nextProps.billingCustomers,
          nextProps.SUCCESSFULpaymentHistory,
        );
      }

      let memberData = this.getMemberData(
        nextProps.members,
        nextProps.billingCustomers,
        nextProps.variationCustomers,
        nextProps.FAILEDpaymentHistory,
        nextProps.SUCCESSFULpaymentHistory,
        this.state.fromDate,
        this.state.toDate,
        this.state.billingPeriod,
      );
      this.setState({
        allMembers: nextProps.members,
        billingCustomers: nextProps.billingCustomers,
        variationCustomers: nextProps.variationCustomers,
        FAILEDpaymentHistory: nextProps.FAILEDpaymentHistory,
        SUCCESSFULpaymentHistory: nextProps.SUCCESSFULpaymentHistory,
        memberData,
        historyLoaded: true,
      });
    }
  }

  UNSAFE_componentWillMount() {
    if (!this.props.billingCustomersLoading) {
      this.props.fetchBillingCustomers({
        setBillingCustomers: this.props.setBillingCustomers,
        allMembers: this.props.members,
      });
    }
    this.props.fetchVariationCustomers({
      setVariationCustomers: this.props.setVariationCustomers,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
    });
    /*    this.props.fetchCustomerRefunds({
      dateFrom: moment().subtract(1,"years").format("YYYY-MM-DD"),
      dateTo: moment().format("YYYY-MM-DD"),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
    });
*/
    if (!this.state.historyLoaded) {
      this.props.fetchPaymentHistory({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: this.state.fromDate.format('YYYY-MM-DD'),
        dateTo: this.state.toDate.format('YYYY-MM-DD'),
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
        dateTo: this.state.toDate.format('YYYY-MM-DD'),
        setPaymentHistory: this.props.setPaymentHistory,
        internalPaymentType: 'client_failed',
        addNotification: this.props.addNotification,
        setSystemError: this.props.setSystemError,
      });
    }
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
  getFailedAmount(
    member,
    FAILEDpaymentHistory,
    SUCCESSFULpaymentHistory,
    fromDate,
    toDate,
  ) {
    let total = 0;
    var uniqueHistory = [];
    FAILEDpaymentHistory.forEach((item, i) => {
      if (
        moment(item.debitDate, 'YYYY-MM-DD').isBetween(fromDate, toDate) &&
        member.values['Billing Customer Id'] === item.yourSystemReference
      ) {
        var idx = uniqueHistory.findIndex(
          item =>
            member.values['Billing Customer Id'] === item.yourSystemReference,
        );
        if (idx === -1) {
          uniqueHistory[uniqueHistory.length] = item;
        }
      }
    });

    uniqueHistory.forEach((failed, i) => {
      if (
        moment(failed.debitDate, 'YYYY-MM-DD').isBetween(fromDate, toDate) &&
        member.values['Billing Customer Id'] === failed.yourSystemReference
      ) {
        // Check if a payment was made since, if so don't include
        var idx = SUCCESSFULpaymentHistory.findIndex(successful => {
          return (
            member.values['Billing Customer Id'] ===
              successful.yourSystemReference &&
            moment(successful.debitDate, 'YYYY-MM-DD').isAfter(
              moment(failed.debitDate, 'YYYY-MM-DD'),
            )
          );
        });
        if (idx === -1) {
          total += failed.paymentAmount;
        }
      }
    });
    return -total;
  }
  getVariationAmount(
    member,
    billingCustomers,
    variationCustomer,
    fromDate,
    toDate,
  ) {
    let billingIdx = billingCustomers.findIndex(
      element => element.customerId === member.values['Billing Customer Id'],
    );
    let billing = billingCustomers[billingIdx];

    let varStart = moment(variationCustomer.startDate, 'DD-MM-YYYY');
    let varEnd =
      variationCustomer.resumeDate === '03-01-0001'
        ? moment('01-01-2500', 'DD-MM-YYYY')
        : moment(variationCustomer.resumeDate, 'DD-MM-YYYY');
    if (varStart.isSameOrBefore(toDate)) {
      let varAmount = variationCustomer.variationAmount;
      let varStartDate = varStart.isAfter(fromDate) ? varStart : fromDate;
      let varEndDate = varEnd.isBefore(toDate) ? varEnd : toDate;
      let varDays = varEndDate.diff(varStartDate, 'days') + 1;
      let paymentPeriod = billing.billingPeriod;
      let varDailyCost = 0;
      if (paymentPeriod === 'Daily') {
        varDailyCost = varAmount;
      } else if (paymentPeriod === 'Weekly') {
        varDailyCost = varAmount / 7;
      } else if (paymentPeriod === 'Fortnightly') {
        varDailyCost = varAmount / 2 / 7;
      } else if (paymentPeriod === 'Monthly') {
        varDailyCost = (varAmount * 12) / 52 / 7;
      }

      return billing.billingAmount > variationCustomer.variationAmount
        ? -(varDays * varDailyCost)
        : varDays * varDailyCost;
    }
    return 0;
  }
  getMemberPaymentsValue(
    member,
    billingCustomers,
    variationCustomers,
    successfulPaymentHistory,
    fromDate,
    toDate,
  ) {
    let scheduledPayment = parseFloat(
      member.values['Billing User'] !== null &&
        member.values['Billing User'] !== undefined &&
        member.values['Billing User'] === 'YES'
        ? this.getScheduledPayment(member, billingCustomers)
        : 0,
    );

    if (scheduledPayment === 0) return 0;

    if (member.values['Billing Payment Type'] === 'Cash') {
      return 0;
    }

    // Determine how many actual payments made in period.
    let billingIdx = billingCustomers.findIndex(
      element => element.customerId === member.values['Billing Customer Id'],
    );
    let billing = billingCustomers[billingIdx];
    var paymentsMade = 0;
    successfulPaymentHistory.forEach((item, i) => {
      if (member.customerId === item.yourSystemReference) {
        paymentsMade += item.billingAmount;
      }
    });

    return paymentsMade;
  }
  getMemberCost(
    member,
    billingCustomers,
    variationCustomers,
    fromDate,
    toDate,
  ) {
    let cost = parseFloat(
      member.values['Billing User'] !== null &&
        member.values['Billing User'] !== undefined &&
        member.values['Billing User'] === 'YES'
        ? this.getScheduledPayment(member, billingCustomers)
        : 0,
    );

    if (cost === 0) return 0;

    if (member.values['Billing Payment Type'] === 'Cash') {
      return 0;
    }
    // Determine Billing period for biller, such as Weekly or Fortnightly
    // Reduce to a weekly cost
    // Determine times billing happens in selected period.
    // Multiply weekly by times in period

    let billingIdx = billingCustomers.findIndex(
      element => element.customerId === member.values['Billing Customer Id'],
    );
    let billing = billingCustomers[billingIdx];
    let varCost = 0;

    let variationIdx = variationCustomers.findIndex(
      element => element.customerId === member.values['Billing Customer Id'],
    );
    if (variationIdx !== -1) {
      let variation = variationCustomers[variationIdx];
      let varStart = moment(variation.startDate, 'DD-MM-YYYY');
      let varEnd =
        variation.resumeDate === '03-01-0001'
          ? moment('01-01-2500', 'DD-MM-YYYY')
          : moment(variation.resumeDate, 'DD-MM-YYYY');
      if (varStart.isSameOrAfter(fromDate) && varEnd.isSameOrBefore(toDate)) {
        let varAmount = variation.variationAmount - billing.billingAmount;
        let varStartDate = varStart.isAfter(fromDate) ? varStart : fromDate;
        let varEndDate = varEnd.isBefore(toDate) ? varEnd : toDate;
        let varDays = varEndDate.diff(varStartDate, 'days') + 1;
        let paymentPeriod = billing.billingPeriod;
        let varDailyCost = 0;
        if (paymentPeriod === 'Daily') {
          varDailyCost = varAmount;
        } else if (paymentPeriod === 'Weekly') {
          varDailyCost = varAmount / 7;
        } else if (paymentPeriod === 'Fortnightly') {
          varDailyCost = varAmount / 2 / 7;
        } else if (paymentPeriod === 'Monthly') {
          varDailyCost = (varAmount * 12) / 52 / 7;
        }

        varCost = varDays * varDailyCost;
      }
    }
    let paymentPeriod = billing.billingPeriod;
    cost = billing.billingAmount;
    let dailyCost = 0;
    if (paymentPeriod === 'Daily') {
      dailyCost = cost;
    } else if (paymentPeriod === 'Weekly') {
      dailyCost = cost / 7;
    } else if (paymentPeriod === 'Fortnightly') {
      dailyCost = cost / 2 / 7;
    } else if (paymentPeriod === 'Monthly') {
      dailyCost = (cost * 12) / 52 / 7;
    }
    let startDate = moment(billing.contractStartDate).isAfter(fromDate)
      ? moment(billing.contractStartDate)
      : fromDate;
    let days = toDate.diff(startDate, 'days') + 1;

    return days * dailyCost + varCost;
  }

  getMemberCashCost(member, fromDate, toDate) {
    if (member.values['Billing Payment Type'] !== 'Cash') {
      return 0;
    }
    // Determine Billing period for biller, such as Weekly or Fortnightly
    // Reduce to a weekly cost
    // Determine times billing happens in selected period.
    // Multiply weekly by times in period

    return parseFloat(member.values['Membership Cost']);
  }

  getMemberWeeklyCost(
    member,
    billingCustomers,
    variationCustomers,
    fromDate,
    toDate,
  ) {
    if (member.values['Billing Payment Type'] === 'Cash') {
      var startTerm = moment(
        member.values['Billing Cash Term Start Date'],
        'YYYY-MM-DD',
      );
      var endTerm = moment(
        member.values['Billing Cash Term End Date'],
        'YYYY-MM-DD',
      );
      var totalAmount = parseFloat(member.values['Membership Cost']);
      var weeks = endTerm.diff(startTerm, 'weeks');

      return totalAmount / weeks;
    }

    let billingIdx = billingCustomers.findIndex(
      element => element.customerId === member.values['Billing Customer Id'],
    );
    if (billingIdx !== -1) {
      let billing = billingCustomers[billingIdx];
      let varCost = 0;

      let variationIdx = variationCustomers.findIndex(
        element => element.customerId === member.values['Billing Customer Id'],
      );
      if (variationIdx !== -1) {
        let variation = variationCustomers[variationIdx];
        let varStart = moment(variation.startDate, 'DD-MM-YYYY');
        let varEnd =
          variation.resumeDate === '03-01-0001'
            ? moment('01-01-2500', 'DD-MM-YYYY')
            : moment(variation.resumeDate, 'DD-MM-YYYY');
        if (varStart.isSameOrAfter(fromDate) && varEnd.isSameOrBefore(toDate)) {
          let varAmount = variation.variationAmount - billing.billingAmount;
          let varStartDate = varStart.isAfter(fromDate) ? varStart : fromDate;
          let varEndDate = varEnd.isBefore(toDate) ? varEnd : toDate;
          let paymentPeriod = billing.billingPeriod;
          let varWeeklyCost = 0;
          if (paymentPeriod === 'Weekly') {
            varWeeklyCost = varAmount * 1;
          } else if (paymentPeriod === 'Fortnightly') {
            varWeeklyCost = varAmount / 2;
          } else if (paymentPeriod === 'Monthly') {
            varWeeklyCost = (varAmount * 12) / 52;
          }

          varCost = varWeeklyCost;
        }
      }

      let paymentPeriod = billing.billingPeriod;
      let weeklyCost = 0;
      if (paymentPeriod === 'Daily') {
        weeklyCost = billing.billingAmount * 7;
      } else if (paymentPeriod === 'Weekly') {
        weeklyCost = billing.billingAmount * 1;
      } else if (paymentPeriod === 'Fortnightly') {
        weeklyCost = billing.billingAmount / 2;
      } else if (paymentPeriod === 'Monthly') {
        weeklyCost = (billing.billingAmount * 12) / 52;
      }
      return weeklyCost + varCost;
    }

    return 0;
  }
  getMemberData(
    members,
    billingCustomers,
    variationCustomers,
    FAILEDpaymentHistory,
    SUCCESSFULpaymentHistory,
    fromDate,
    toDate,
    billingPeriod,
  ) {
    if (!members || members.length <= 0) {
      return {
        billings: { members: [], value: 0 },
        accountHolders: { members: [], value: 0 },
        totalActiveMembers: { members: [], value: 0 },
        activeMembers: { members: [], value: 0 },
        activeCashMembers: { members: [], value: 0 },
        cancellations: { members: [], value: 0 },
        pendingCancellations: { members: [], value: 0 },
        frozen: { members: [], value: 0 },
        pendingFrozen: { members: [], value: 0 },
        unfrozen: { members: [], value: 0 },
        restored: { members: [], value: 0 },
        newMembers: { members: [], value: 0 },
        variations: { members: [], value: 0 },
        failed: { members: [], value: 0 },
      };
    }
    // billingAmount, billingPeriod
    let billings = [];
    let billingsValue = 0;
    let accountHolders = [];
    let accountHoldersValue = 0;
    let totalActiveMembers = [];
    let totalActiveMembersValue = 0;
    let aps = 0;
    let activeMembers = [];
    let activeMembersValue = 0;
    let activeCashMembers = [];
    let activeCashMembersValue = 0;
    let cancellations = [];
    let cancellationsValue = 0;
    let pendingCancellations = [];
    let pendingCancellationsValue = 0;
    let frozen = [];
    let frozenValue = 0;
    let pendingFrozen = [];
    let pendingFrozenValue = 0;
    let unfrozen = [];
    let unfrozenValue = 0;
    let restored = [];
    let restoredValue = 0;
    let newMembers = [];
    let newMembersValue = 0;
    let variations = [];
    let variationsValue = 0;
    let failed = [];
    let failedValue = 0;
    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate);
      let previousMemberStatus = memberPreviousStatus(member);
      console.log(
        'getMemberData Status:' +
          member.values['Member ID'] +
          ' ' +
          member.values['Status'] +
          ' ' +
          memberStatus,
      );

      if (memberStatus === 'Active') {
        if (previousMemberStatus === 'Frozen') {
          unfrozen[unfrozen.length] = member;
          unfrozenValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
        } else if (previousMemberStatus === 'Inactive') {
          restored[restored.length] = member;
          restoredValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
        } else if (
          member.values['Billing Payment Type'] !== 'Cash' &&
          moment(member.createdAt).isBetween(fromDate, toDate)
        ) {
          newMembers[newMembers.length] = member;
          newMembersValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
        } else {
          if (member.values['Billing Payment Type'] === 'Cash') {
            if (
              moment(member.values['Billing Cash Term Start Date']).isBetween(
                fromDate,
                toDate,
              )
            ) {
              activeCashMembers[activeCashMembers.length] = member;
              activeCashMembersValue += this.getMemberCashCost(
                member,
                fromDate,
                toDate,
              );
            }
          } else {
            activeMembers[activeMembers.length] = member;
            if (
              (member.values['Non Paying'] === null ||
                member.values['Non Paying'] === undefined) &&
              member.values['Non Paying'] !== 'YES'
            ) {
              activeMembersValue += this.getMemberCost(
                member,
                billingCustomers,
                variationCustomers,
                fromDate,
                toDate,
              );
              //console.log("Active: "+member.values["First Name"]+" "+member.values["Last Name"]+" - "+member.values['Membership Cost']);
            }
          }
        }
      }

      if (memberStatus === 'Frozen') {
        frozen[frozen.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          frozenValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
      }
      if (memberStatus === 'Pending Freeze') {
        pendingFrozen[pendingFrozen.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          pendingFrozenValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
      }
      if (memberStatus === 'Inactive') {
        cancellations[cancellations.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          cancellationsValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
      }
      if (memberStatus === 'Pending Cancellation') {
        pendingCancellations[pendingCancellations.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          pendingCancellationsValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
      }
      if (
        (memberStatus === 'Active' ||
          memberStatus === 'Pending Freeze' ||
          memberStatus === 'Pending Cancellation') &&
        member.values['Billing User'] === 'YES'
      ) {
        accountHolders[accountHolders.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          accountHoldersValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
      }
      if (
        memberStatus === 'Active' ||
        memberStatus === 'Pending Freeze' ||
        memberStatus === 'Pending Cancellation'
      ) {
        totalActiveMembers[totalActiveMembers.length] = member;
        if (
          (member.values['Non Paying'] === null ||
            member.values['Non Paying'] === undefined) &&
          member.values['Non Paying'] !== 'YES'
        )
          totalActiveMembersValue += this.getMemberCost(
            member,
            billingCustomers,
            variationCustomers,
            fromDate,
            toDate,
          );
        aps += this.getMemberWeeklyCost(
          member,
          billingCustomers,
          variationCustomers,
          fromDate,
          toDate,
        );
      }

      let varIdx = variationCustomers.findIndex(
        element => member.values['Billing Customer Id'] === element.customerId,
      );
      if (
        varIdx !== -1 &&
        moment(variationCustomers[varIdx].startDate, 'DD-MM-YYYY').isBetween(
          fromDate,
          toDate,
        )
      ) {
        variations[variations.length] = member;
        variationsValue += this.getVariationAmount(
          member,
          billingCustomers,
          variationCustomers[varIdx],
          fromDate,
          toDate,
        );
      }

      let failedIdx = FAILEDpaymentHistory.findIndex(
        element =>
          member.values['Billing Customer Id'] === element.yourSystemReference,
      );
      if (
        failedIdx !== -1 &&
        moment(
          FAILEDpaymentHistory[failedIdx].debitDate,
          'YYYY-MM-DD',
        ).isBetween(fromDate, toDate)
      ) {
        var failedAmount = this.getFailedAmount(
          member,
          FAILEDpaymentHistory,
          SUCCESSFULpaymentHistory,
          fromDate,
          toDate,
        );
        if (failedAmount !== 0) {
          failed[failed.length] = member;
          failedValue += failedAmount;
        }
      }
    });

    return {
      accountHolders: { members: accountHolders, value: accountHoldersValue },
      totalActiveMembers: {
        members: totalActiveMembers,
        value: totalActiveMembersValue,
      },
      activeMembers: { members: activeMembers, value: activeMembersValue },
      activeCashMembers: {
        members: activeCashMembers,
        value: activeCashMembersValue,
      },
      cancellations: { members: cancellations, value: cancellationsValue },
      pendingCancellations: {
        members: pendingCancellations,
        value: pendingCancellationsValue,
      },
      frozen: { members: frozen, value: frozenValue },
      pendingFrozen: { members: pendingFrozen, value: pendingFrozenValue },
      unfrozen: { members: unfrozen, value: unfrozenValue },
      restored: { members: restored, value: restoredValue },
      newMembers: { members: newMembers, value: newMembersValue },
      variations: { members: variations, value: variationsValue },
      failed: { members: failed, value: failedValue },
      aps: aps / totalActiveMembers.length,
    };
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: moment(event.target.value),
    });
  }

  handleSubmit(event) {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        isShowCustom: false,
      });

      this.loadNewPeriod(this.state.fromDate, this.state.toDate);
    }
  }
  setStatisticDates(e, viewPeriod, billingPeriod) {
    if (viewPeriod === 'this_period') {
      let fromDate = moment();
      if (billingPeriod === 'weekly') {
        fromDate.day(1);
      }
      if (billingPeriod === 'fortnightly') {
        fromDate.day(1);
      }
      if (billingPeriod === 'monthly') {
        fromDate.date(1);
      }

      fromDate.hour(0).minute(0);
      let toDate = moment();
      if (billingPeriod === 'weekly') {
        toDate
          .day(1)
          .add(1, 'weeks')
          .subtract(1, 'days');
      }
      if (billingPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (billingPeriod === 'monthly') {
        toDate
          .date(1)
          .add(1, 'months')
          .subtract(1, 'days');
      }
      toDate.hour(23).minute(59);

      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'next_period') {
      let fromDate = moment();
      if (billingPeriod === 'weekly') {
        fromDate.add(1, 'weeks').day(1);
      }
      if (billingPeriod === 'fortnightly') {
        fromDate.add(2, 'weeks').day(1);
      }
      if (billingPeriod === 'monthly') {
        fromDate.add(1, 'months').date(1);
      }
      fromDate.hour(0).minute(0);
      let toDate = moment();
      if (billingPeriod === 'weekly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (billingPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(4, 'weeks')
          .subtract(1, 'days');
      }
      if (billingPeriod === 'monthly') {
        toDate
          .date(1)
          .add(2, 'months')
          .subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'last_period') {
      let fromDate = moment();
      if (billingPeriod === 'weekly') {
        fromDate.subtract(1, 'weeks').day(1);
      }
      if (billingPeriod === 'fortnightly') {
        fromDate.subtract(2, 'weeks').day(1);
      }
      if (billingPeriod === 'monthly') {
        fromDate.subtract(1, 'months').date(1);
      }
      fromDate.hour(0).minute(0);
      let toDate = moment();
      if (billingPeriod === 'weekly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (billingPeriod === 'fortnightly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (billingPeriod === 'monthly') {
        toDate.date(1).subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'last_3_period') {
      let fromDate = moment();
      if (billingPeriod === 'weekly') {
        fromDate.subtract(3, 'weeks').day(1);
      }
      if (billingPeriod === 'fortnightly') {
        fromDate.subtract(9, 'weeks').day(1);
      }
      if (billingPeriod === 'monthly') {
        fromDate.subtract(3, 'months').date(1);
      }

      fromDate.hour(0).minute(0);
      let toDate = moment();
      if (billingPeriod === 'weekly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (billingPeriod === 'fortnightly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (billingPeriod === 'monthly') {
        toDate
          .subtract(3, 'months')
          .date(1)
          .add(3, 'months')
          .subtract(1, 'days');
      }

      toDate.hour(23).minute(59);
      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'custom') {
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
  loadNewPeriod(fromDate, toDate) {
    this.props.fetchPaymentHistory({
      paymentType: 'FAILED',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: fromDate.format('YYYY-MM-DD'),
      dateTo: toDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_failed',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPaymentHistory({
      paymentType: 'SUCCESSFUL',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: fromDate.format('YYYY-MM-DD'),
      dateTo: toDate.format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_successful',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.setState({
      isShowCustom: false,
      fromDate: fromDate,
      toDate: toDate,
      historyLoaded: false,
    });
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
  getMemberTableHeaderName() {
    if (this.state.showTotalActiveMembers) return 'Total Active';
    if (this.state.showActiveMembers) return 'Active';
    if (this.state.showActiveCashMembers) return 'Active Cash';
    if (this.state.showAccountHolders) return 'Active Account Holders';
    if (this.state.showCancellationsMembers) return 'Cancellations';
    if (this.state.showPendingCancellationsMembers)
      return 'Pending Cancellations';
    if (this.state.showFrozenMembers) return 'Frozen';
    if (this.state.showUnFrozenMembers) return 'UnFrozen';
    if (this.state.showRestoredMembers) return 'Restored';
    if (this.state.showPendingFrozenMembers) return 'Pending Freezes';
    if (this.state.showNewMembers) return 'New Members';
    if (this.state.showVariations) return 'Variations';
    if (this.state.showFailed) return 'Failed Payments';
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
              columns={this._getMemberRowTableColumns}
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
    return this.props.billingCustomersLoading ||
      this.props.variationCustomersLoading ||
      !this.state.historyLoaded ? (
      <div>Loading information ...</div>
    ) : (
      <span className="financialStats">
        <span className="line">
          <div className="radioGroup">
            <br />
            <label htmlFor="weekly" className="radio">
              <input
                id="weekly"
                name="period"
                type="radio"
                value="Weekly"
                onChange={e => {
                  this.setState({
                    billingPeriod: 'weekly',
                    viewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'weekly');
                }}
                defaultChecked={
                  this.state.billingPeriod === 'weekly' ? 'defaultChecked' : ''
                }
              />
              Weekly
            </label>
            <label htmlFor="fortnightly" className="radio">
              <input
                id="fortnightly"
                name="period"
                type="radio"
                value="Fortnightly"
                onChange={e => {
                  this.setState({
                    billingPeriod: 'fortnightly',
                    viewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'fortnightly');
                }}
                defaultChecked={
                  this.state.billingPeriod === 'fortnightly'
                    ? 'defaultChecked'
                    : ''
                }
              />
              <I18n>Fortnightly</I18n>
            </label>
            <label htmlFor="monthly" className="radio">
              <input
                id="monthly"
                name="period"
                type="radio"
                value="Monthly"
                onChange={e => {
                  this.setState({
                    billingPeriod: 'monthly',
                    viewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'monthly');
                }}
                defaultChecked={
                  this.state.billingPeriod === 'monthly' ? 'defaultChecked' : ''
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
                  viewPeriod: 'year',
                });
                this.setStatisticDates(e, 'year', this.state.billingPeriod);
              }}
            >
              Last Year
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  viewPeriod: 'last_3_period',
                });
                this.setStatisticDates(
                  e,
                  'last_3_period',
                  this.state.billingPeriod,
                );
              }}
            >
              Last 3{' '}
              {this.state.billingPeriod === 'weekly'
                ? 'Weeks'
                : this.state.billingPeriod === 'fortnightly'
                ? 'Fortnights'
                : 'Months'}
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  viewPeriod: 'last_period',
                });
                this.setStatisticDates(
                  e,
                  'last_period',
                  this.state.billingPeriod,
                );
              }}
            >
              Last{' '}
              {this.state.billingPeriod === 'weekly'
                ? 'Week'
                : this.state.billingPeriod === 'fortnightly'
                ? 'Fortnights'
                : 'Month'}
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  viewPeriod: 'this_period',
                });
                this.setStatisticDates(
                  e,
                  'this_period',
                  this.state.billingPeriod,
                );
              }}
            >
              This{' '}
              {this.state.billingPeriod === 'weekly'
                ? 'Week'
                : this.state.billingPeriod === 'fortnightly'
                ? 'Fortnight'
                : 'Month'}
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  viewPeriod: 'next_period',
                });
                this.setStatisticDates(
                  e,
                  'next_period',
                  this.state.billingPeriod,
                );
              }}
            >
              Next{' '}
              {this.state.billingPeriod === 'weekly'
                ? 'Week'
                : this.state.billingPeriod === 'fortnightly'
                ? 'Fortnight'
                : 'Month'}
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  viewPeriod: 'custom',
                });
                this.setStatisticDates(e, 'custom', this.state.billingPeriod);
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
                        value={this.state.fromDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            fromDate: moment(selectedDay),
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
                        value={this.state.toDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            toDate: moment(selectedDay),
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
            {this.state.fromDate.format('L')} to {this.state.toDate.format('L')}
          </span>
        </div>

        <div className="memberFinanceStatistics">
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Active Account Holders</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: true,
                      showTotalActiveMembers: false,
                      showActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.accountHolders.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.accountHolders.value)}
              </div>
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
                      this.state.memberData.accountHolders.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Total Active</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showTotalActiveMembers: true,
                      showActiveMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.totalActiveMembers.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.totalActiveMembers.value)}
              </div>
              {this.state.showTotalActiveMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showTotalActiveMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.totalActiveMembers.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Average Price per Student(weekly)</div>
                <div className="value"></div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.aps)}
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Active</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showActiveMembers: true,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.activeMembers.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.activeMembers.value)}
              </div>
              {this.state.showActiveMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showActiveMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.activeMembers.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            {getAttributeValue(this.props.space, 'Allow Cash Payments') !==
            'true' ? (
              <div />
            ) : (
              <div className="statItem">
                <div className="info">
                  <div className="label">Active Cash</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showActiveMembers: false,
                        showTotalActiveMembers: false,
                        showActiveCashMembers: true,
                        showAccountHolders: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showUnFrozenMembers: false,
                        showRestoredMembers: false,
                        showPendingFrozenMembers: false,
                        showNewMembers: false,
                        showVariations: false,
                        showFailed: false,
                      })
                    }
                  >
                    {this.state.memberData.activeCashMembers.members.length}
                  </div>
                </div>
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.memberData.activeCashMembers.value)}
                </div>
                {this.state.showActiveCashMembers && (
                  <div className="members">
                    <span
                      className="closeMembers"
                      onClick={e =>
                        this.setState({
                          showActiveCashMembers: false,
                        })
                      }
                    >
                      <SVGInline svg={crossIcon} className="icon" />
                    </span>
                    <ReactTable
                      columns={this.getMemberTableColumns()}
                      data={this.getMemberTableData(
                        this.state.memberData.activeCashMembers.members,
                        this.state.billingCustomers,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="statItem">
              <div className="info">
                <div className="label">Cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showCancellationsMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showActiveMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.cancellations.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.cancellations.value)}
              </div>
              {this.state.showCancellationsMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showCancellationsMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.cancellations.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: true,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.pendingCancellations.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.pendingCancellations.value)}
              </div>
              {this.state.showPendingCancellationsMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showPendingCancellationsMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingCancellations.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Frozen</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: true,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.frozen.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.frozen.value)}
              </div>
              {this.state.showFrozenMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showFrozenMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.frozen.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending freezes</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: true,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.pendingFrozen.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.pendingFrozen.value)}
              </div>
              {this.state.showPendingFrozenMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showPendingFrozenMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingFrozen.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">New Members</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: true,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.newMembers.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.newMembers.value)}
              </div>
              {this.state.showNewMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showNewMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.newMembers.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">UnFrozen</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: true,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.unfrozen.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.unfrozen.value)}
              </div>
              {this.state.showUnFrozenMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showUnFrozenMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.unfrozen.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Restored</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: true,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: false,
                    })
                  }
                >
                  {this.state.memberData.restored.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.restored.value)}
              </div>
              {this.state.showRestoredMembers && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showRestoredMembers: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.restored.members,
                      this.state.billingCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            {getAttributeValue(this.props.space, 'Billing Company') ===
              'PaySmart' && (
              <div className="statItem">
                <div className="info">
                  <div className="label">Variations</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showAccountHolders: false,
                        showTotalActiveMembers: false,
                        showActiveMembers: false,
                        showActiveCashMembers: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showPendingFrozenMembers: false,
                        showNewMembers: false,
                        showVariations: true,
                        showFailed: false,
                      })
                    }
                  >
                    {this.state.memberData.variations.members.length}
                  </div>
                </div>
                <div className="dollarValue">
                  {new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.memberData.variations.value)}
                </div>
                {this.state.showVariations && (
                  <div className="members">
                    <span
                      className="closeMembers"
                      onClick={e =>
                        this.setState({
                          showVariations: false,
                        })
                      }
                    >
                      <SVGInline svg={crossIcon} className="icon" />
                    </span>
                    <ReactTable
                      columns={this.getMemberTableColumns()}
                      data={this.getMemberTableData(
                        this.state.memberData.variations.members,
                        this.state.billingCustomers,
                        this.state.variationCustomers,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
            )}
            <div className="statItem">
              <div className="info">
                <div className="label">Failed Payments</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showActiveMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showVariations: false,
                      showFailed: true,
                    })
                  }
                >
                  {this.state.memberData.failed.members.length}
                </div>
              </div>
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.failed.value)}
              </div>
              {this.state.showFailed && (
                <div className="members">
                  <span
                    className="closeMembers"
                    onClick={e =>
                      this.setState({
                        showFailed: false,
                      })
                    }
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.failed.members,
                      this.state.billingCustomers,
                      this.state.variationCustomers,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </span>
    );
  }
}

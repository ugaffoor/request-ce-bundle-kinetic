import React, { Component } from 'react';
import moment from 'moment';
import {
  getJson,
  memberStatusInDates,
  memberPreviousStatus,
} from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import { ReactComponent as CrossIcon } from '../../images/cross.svg';
import { ReactComponent as HelpIcon } from '../../images/help.svg';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { I18n } from '@kineticdata/react';

var compThis = undefined;

export class MemberStatistics extends Component {
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

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let fromDate = this.setFromDate;
    fromDate
      .hour(0)
      .minute(0)
      .seconds(0)
      .millisecond(0);
    let toDate = this.setToDate;

    let memberData = this.getMemberData(undefined, fromDate, toDate);
    this.state = {
      allMembers: this.props.members,
      memberData,
      fromDate,
      toDate,
      billingPeriod: 'monthly',
      viewPeriod: 'this_period',
      showTotalActiveMembers: false,
      showMaleMembers: false,
      showFemaleMembers: false,
      showOtherMembers: false,
      showKidsMembers: false,
      showKidsMaleMembers: false,
      showKidsFemaleMembers: false,
      showKidsOtherMembers: false,
      showActiveMembers: false,
      showActiveNonPayingMembers: false,
      showActiveCashMembers: false,
      showActiveCasualMembers: false,
      showActiveOrphanMembers: false,
      showAccountHolders: false,
      showCancellationsMembers: false,
      showPendingCancellationsMembers: false,
      showPendingRegistrationsMembers: false,
      showFrozenMembers: false,
      showUnFrozenMembers: false,
      showRestoredMembers: false,
      showPendingFrozenMembers: false,
      showNewMembers: false,
      memberFilter: '',
      historyLoaded: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.servicesLoading) {
      let memberData = this.getMemberData(
        nextProps.members,
        this.state.fromDate,
        this.state.toDate,
      );
      this.setState({
        allMembers: nextProps.members,
        memberData,
        historyLoaded: true,
      });
    }
  }

  UNSAFE_componentWillMount() {
    if (!this.state.historyLoaded) {
      var servicesFromDate = moment(this.state.fromDate);
      this.props.fetchServicesByDate({
        fromDate: servicesFromDate.subtract(12, 'months'),
        toDate: this.state.toDate,
      });
    }
  }

  hasEarlierMembers(fromDate) {
    return this.props.members.some(member => {
      var dateJoined = member.values['Date Joined'];
      return (
        dateJoined &&
        dateJoined !== null &&
        moment(dateJoined, 'YYYY-MM-DD').isBefore(fromDate, 'day')
      );
    });
  }
  dateJoined(member, fromDate, toDate) {
    if (
      member['values']['Date Joined'] !== undefined &&
      member['values']['Date Joined'] !== null &&
      member['values']['Date Joined'] !== ''
    ) {
      if (
        moment(member['values']['Date Joined'], 'YYYY-MM-DD').isBetween(
          fromDate,
          toDate,
        )
      ) {
        return true;
      }
    }
    return false;
  }
  getFreezeDate(member, services, fromDate, toDate) {
    services.forEach((request, i) => {
      if (
        (request.form.slug === 'bambora-membership-freeze' ||
          request.form.slug === 'membership-freeze' ||
          request.form.slug === 'stripe-membership-freeze') &&
        member.id === request.values['Members']
      ) {
        if (
          moment(
            request.values['Date of Last Payment'],
            'YYYY-MM-DD',
          ).isSameOrAfter(fromDate, 'day') &&
          moment(
            request.values['Date of Last Payment'],
            'YYYY-MM-DD',
          ).isSameOrBefore(toDate, 'day')
        ) {
          toDate = moment(request.values['Date of Last Payment'], 'YYYY-MM-DD');
          return;
        }
      }
    });
    return toDate;
  }
  getCancellationDate(member, services, fromDate, toDate) {
    services.forEach((request, i) => {
      if (
        (request.form.slug === 'bambora-member-cancellation' ||
          request.form.slug === 'member-cancellation' ||
          request.form.slug === 'stripe-member-cancellation') &&
        member.id === request.values['Members']
      ) {
        if (
          moment(
            request.values['The last debit will be taken on'],
            'YYYY-MM-DD',
          ).isSameOrAfter(fromDate, 'day') &&
          moment(
            request.values['The last debit will be taken on'],
            'YYYY-MM-DD',
          ).isSameOrBefore(toDate, 'day')
        ) {
          toDate = moment(
            request.values['The last debit will be taken on'],
            'YYYY-MM-DD',
          );
          return;
        }
      }
    });
    return toDate;
  }
  getMemberData(members, fromDate, toDate) {
    if (!members || members.length <= 0) {
      return {
        accountHolders: { members: [] },
        totalActiveMembers: { members: [] }, // computed below, empty here
        activeMembers: { members: [] },
        nonpayingMembers: { members: [] },
        orphanMembers: { members: [] },
        activeCashMembers: { members: [] },
        cancellations: { members: [] },
        pendingCancellations: { members: [] },
        pendingRegistrations: { members: [] },
        frozen: { members: [] },
        pendingFrozen: { members: [] },
        unfrozen: { members: [] },
        restored: { members: [] },
        newMembers: { members: [] },
      };
    }
    let accountHolders = [];
    let activeMembers = [];
    let nonpayingMembers = [];
    let orphanMembers = [];
    let activeCashMembers = [];
    let casualMembers = [];
    let cancellations = [];
    let pendingCancellations = [];
    let pendingRegistrations = [];
    let frozen = [];
    let pendingFrozen = [];
    let unfrozen = [];
    let restored = [];
    let newMembers = [];
    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate, true);
      let previousMemberStatus = memberPreviousStatus(
        member,
        fromDate,
        toDate,
        true,
      );
      if (memberStatus === 'Active') {
        if (previousMemberStatus === 'Frozen') {
          unfrozen[unfrozen.length] = member;
        } else if (previousMemberStatus === 'Inactive') {
          restored[restored.length] = member;
        } else if (this.dateJoined(member, fromDate, toDate)) {
          newMembers[newMembers.length] = member;
        }
        if (
          member.values['Billing Payment Type'] === 'Cash' &&
          member.values['Non Paying'] !== 'YES' &&
          moment(member.values['Billing Cash Term Start Date']).isBefore(
            toDate,
          ) &&
          moment(member.values['Billing Cash Term End Date']).isAfter(fromDate)
        ) {
          activeCashMembers[activeCashMembers.length] = member;
        } else {
          const isOrphan =
            getAttributeValue(this.props.space, 'Billing Company') !==
              'No Billing' &&
            (member.values['Billing Parent Member'] === undefined ||
              member.values['Billing Parent Member'] === '' ||
              member.values['Billing Parent Member'] === null) &&
            member.values['Billing User'] !== 'YES' &&
            member.values['Non Paying'] !== 'YES';
          if (
            !isOrphan &&
            (member.values['Non Paying'] === null ||
              member.values['Non Paying'] === undefined) &&
            member.values['Non Paying'] !== 'YES'
          ) {
            activeMembers[activeMembers.length] = member;
          }
        }
      }
      if (memberStatus === 'Casual') {
        casualMembers[casualMembers.length] = member;
      }
      if (memberStatus === 'Frozen') {
        frozen[frozen.length] = member;
      }
      if (memberStatus === 'Pending Freeze') {
        pendingFrozen[pendingFrozen.length] = member;
      }
      if (memberStatus === 'Inactive') {
        cancellations[cancellations.length] = member;
      }
      if (memberStatus === 'Pending Cancellation') {
        pendingCancellations[pendingCancellations.length] = member;
      }
      if (memberStatus === 'Pending Registration') {
        pendingRegistrations[pendingRegistrations.length] = member;
      }
      if (
        (memberStatus === 'Active' ||
          memberStatus === 'Pending Freeze' ||
          memberStatus === 'Pending Cancellation') &&
        member.values['Non Paying'] === 'YES'
      ) {
        nonpayingMembers[nonpayingMembers.length] = member;
      }
      if (
        (memberStatus === 'Active' ||
          memberStatus === 'Pending Freeze' ||
          memberStatus === 'Pending Cancellation') &&
        member.values['Billing User'] === 'YES'
      ) {
        accountHolders[accountHolders.length] = member;
      }
      if (
        (memberStatus === 'Active' ||
          memberStatus === 'Pending Freeze' ||
          memberStatus === 'Pending Cancellation') &&
        getAttributeValue(this.props.space, 'Billing Company') !==
          'No Billing' &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '' ||
          member.values['Billing Parent Member'] === null) &&
        member.values['Billing User'] !== 'YES' &&
        member.values['Status'] === 'Active' &&
        member.values['Non Paying'] !== 'YES'
      ) {
        orphanMembers[orphanMembers.length] = member;
      }
    });
    const totalActiveMembers = [
      ...activeMembers,
      ...nonpayingMembers,
      ...activeCashMembers,
      ...orphanMembers,
      ...casualMembers,
      ...pendingFrozen,
      ...pendingCancellations,
      ...pendingRegistrations,
    ];
    const maleMembers = totalActiveMembers.filter(
      m => m.values['Gender'] === 'Male',
    );
    const femaleMembers = totalActiveMembers.filter(
      m => m.values['Gender'] === 'Female',
    );
    const otherMembers = totalActiveMembers.filter(
      m =>
        m.values['Gender'] === 'Other' ||
        m.values['Gender'] === 'Prefer not to answer',
    );
    const kidsMembers = totalActiveMembers.filter(
      m =>
        m.values['DOB'] &&
        moment().diff(moment(m.values['DOB'], 'YYYY-MM-DD'), 'years') <= 16,
    );
    const kidsMaleMembers = kidsMembers.filter(
      m => m.values['Gender'] === 'Male',
    );
    const kidsFemaleMembers = kidsMembers.filter(
      m => m.values['Gender'] === 'Female',
    );
    const kidsOtherMembers = kidsMembers.filter(
      m =>
        m.values['Gender'] === 'Other' ||
        m.values['Gender'] === 'Prefer not to answer',
    );
    return {
      accountHolders: { members: accountHolders },
      totalActiveMembers: {
        members: totalActiveMembers,
        maleMembers,
        femaleMembers,
        otherMembers,
        kidsMembers,
        kidsMaleMembers,
        kidsFemaleMembers,
        kidsOtherMembers,
      },
      activeMembers: { members: activeMembers },
      nonpayingMembers: { members: nonpayingMembers },
      orphanMembers: { members: orphanMembers },
      activeCashMembers: { members: activeCashMembers },
      casualMembers: { members: casualMembers },
      cancellations: { members: cancellations },
      pendingCancellations: { members: pendingCancellations },
      pendingRegistrations: { members: pendingRegistrations },
      frozen: { members: frozen },
      pendingFrozen: { members: pendingFrozen },
      unfrozen: { members: unfrozen },
      restored: { members: restored },
      newMembers: { members: newMembers },
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
      if (billingPeriod === 'quarterly') {
        fromDate.startOf('quarter');
      }

      fromDate
        .hour(0)
        .minute(0)
        .seconds(0)
        .millisecond(0);
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
      if (billingPeriod === 'quarterly') {
        toDate.endOf('quarter');
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
      if (billingPeriod === 'quarterly') {
        fromDate.add(1, 'quarters').startOf('quarter');
      }
      fromDate
        .hour(0)
        .minute(0)
        .seconds(0)
        .millisecond(0);
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
      if (billingPeriod === 'quarterly') {
        toDate.add(1, 'quarters').endOf('quarter');
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
      if (billingPeriod === 'quarterly') {
        fromDate.subtract(1, 'quarters').startOf('quarter');
      }
      fromDate
        .hour(0)
        .minute(0)
        .seconds(0)
        .millisecond(0);
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
      if (billingPeriod === 'quarterly') {
        toDate.subtract(1, 'quarters').endOf('quarter');
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
      if (billingPeriod === 'quarterly') {
        fromDate.subtract(3, 'quarters').startOf('quarter');
      }

      fromDate
        .hour(0)
        .minute(0)
        .seconds(0)
        .millisecond(0);
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
      if (billingPeriod === 'quarterly') {
        toDate.subtract(1, 'quarters').endOf('quarter');
      }

      toDate.hour(23).minute(59);
      this.loadNewPeriod(fromDate, toDate);

      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
    } else if (viewPeriod === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(1)
        .seconds(0);
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
  navigatePeriod(direction) {
    const { fromDate, toDate, billingPeriod } = this.state;
    let amount, unit;
    if (billingPeriod === 'weekly') {
      amount = 1;
      unit = 'weeks';
    } else if (billingPeriod === 'fortnightly') {
      amount = 2;
      unit = 'weeks';
    } else if (billingPeriod === 'quarterly') {
      amount = 1;
      unit = 'quarters';
    } else {
      amount = 1;
      unit = 'months';
    }
    const newFrom = moment(fromDate).add(direction * amount, unit);
    let newTo;
    if (unit === 'months') {
      newTo = moment(newFrom)
        .endOf('month')
        .hour(23)
        .minute(59);
    } else if (unit === 'quarters') {
      newTo = moment(newFrom)
        .endOf('quarter')
        .hour(23)
        .minute(59);
    } else {
      newTo = moment(toDate).add(direction * amount, unit);
    }
    this.loadNewPeriod(newFrom, newTo);
  }
  loadNewPeriod(fromDate, toDate) {
    let memberData = this.getMemberData(
      this.state.allMembers,
      fromDate,
      toDate,
    );
    this.setState({
      isShowCustom: false,
      fromDate,
      toDate,
      memberData,
      historyLoaded: true,
    });
  }
  getMemberTableHeaderName() {
    if (this.state.showTotalActiveMembers) return 'Total Active';
    if (this.state.showMaleMembers) return 'Male';
    if (this.state.showFemaleMembers) return 'Female';
    if (this.state.showOtherMembers) return 'Other';
    if (this.state.showKidsMembers) return 'Kids (≤16)';
    if (this.state.showKidsMaleMembers) return 'Kids - Male';
    if (this.state.showKidsFemaleMembers) return 'Kids - Female';
    if (this.state.showKidsOtherMembers) return 'Kids - Other';
    if (this.state.showActiveMembers) return 'Active';
    if (this.state.showActiveNonPayingMembers) return 'Active Non Paying';
    if (this.state.showActiveCasualMembers) return 'Active Casual';
    if (this.state.showActiveOrphanMembers) return 'Active Orphan';
    if (this.state.showActiveCashMembers) return 'Active Cash';
    if (this.state.showAccountHolders) return 'Active Account Holders';
    if (this.state.showCancellationsMembers) return 'Cancellations';
    if (this.state.showPendingCancellationsMembers)
      return 'Pending Cancellations';
    if (this.state.showPendingRegistrationsMembers)
      return 'Pending Registrations';
    if (this.state.showFrozenMembers) return 'Frozen';
    if (this.state.showUnFrozenMembers) return 'UnFrozen';
    if (this.state.showRestoredMembers) return 'Restored';
    if (this.state.showPendingFrozenMembers) return 'Pending Freezes';
    if (this.state.showNewMembers) return 'New Members';
  }
  getActiveMembersData() {
    const md = this.state.memberData;
    if (this.state.showTotalActiveMembers) return md.totalActiveMembers.members;
    if (this.state.showMaleMembers) return md.totalActiveMembers.maleMembers;
    if (this.state.showFemaleMembers)
      return md.totalActiveMembers.femaleMembers;
    if (this.state.showOtherMembers) return md.totalActiveMembers.otherMembers;
    if (this.state.showKidsMembers) return md.totalActiveMembers.kidsMembers;
    if (this.state.showKidsMaleMembers)
      return md.totalActiveMembers.kidsMaleMembers;
    if (this.state.showKidsFemaleMembers)
      return md.totalActiveMembers.kidsFemaleMembers;
    if (this.state.showKidsOtherMembers)
      return md.totalActiveMembers.kidsOtherMembers;
    if (this.state.showActiveMembers) return md.activeMembers.members;
    if (this.state.showActiveNonPayingMembers)
      return md.nonpayingMembers.members;
    if (this.state.showActiveCashMembers) return md.activeCashMembers.members;
    if (this.state.showActiveCasualMembers) return md.casualMembers.members;
    if (this.state.showActiveOrphanMembers) return md.orphanMembers.members;
    if (this.state.showPendingFrozenMembers) return md.pendingFrozen.members;
    if (this.state.showPendingCancellationsMembers)
      return md.pendingCancellations.members;
    if (this.state.showPendingRegistrationsMembers)
      return md.pendingRegistrations.members;
    if (this.state.showAccountHolders) return md.accountHolders.members;
    if (this.state.showNewMembers) return md.newMembers.members;
    if (this.state.showFrozenMembers) return md.frozen.members;
    if (this.state.showCancellationsMembers) return md.cancellations.members;
    if (this.state.showUnFrozenMembers) return md.unfrozen.members;
    if (this.state.showRestoredMembers) return md.restored.members;
    return null;
  }
  closeMembers() {
    this.setState({
      showTotalActiveMembers: false,
      showMaleMembers: false,
      showFemaleMembers: false,
      showOtherMembers: false,
      showKidsMembers: false,
      showKidsMaleMembers: false,
      showKidsFemaleMembers: false,
      showKidsOtherMembers: false,
      showActiveMembers: false,
      showActiveNonPayingMembers: false,
      showActiveCashMembers: false,
      showActiveOrphanMembers: false,
      showPendingFrozenMembers: false,
      showPendingCancellationsMembers: false,
      showPendingRegistrationsMembers: false,
      showAccountHolders: false,
      showNewMembers: false,
      showFrozenMembers: false,
      showCancellationsMembers: false,
      showUnFrozenMembers: false,
      showRestoredMembers: false,
      memberFilter: '',
    });
  }
  renderMembersPanel() {
    const members = this.getActiveMembersData();
    if (!members) return null;
    return (
      <div className="membersPanel" style={{ flex: 1, minWidth: 0 }}>
        <div
          className="membersPanelHeader"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px',
          }}
        >
          <span
            className="membersPanelTitle"
            style={{ fontSize: '14px', fontWeight: 600, color: '#4d5059' }}
          >
            {this.getMemberTableHeaderName()}
          </span>
          <span className="closeMembers" onClick={() => this.closeMembers()}>
            <CrossIcon className="icon icon-svg" /> Close
          </span>
        </div>
        <input
          type="text"
          className="form-control memberFilterInput"
          placeholder="Filter by name..."
          value={this.state.memberFilter}
          onChange={e => this.setState({ memberFilter: e.target.value })}
        />
        <ReactTable
          columns={this.getMemberTableColumns()}
          data={this.getFilteredMembers(members)}
          defaultPageSize={10}
          showPagination={true}
        />
      </div>
    );
  }
  getFilteredMembers(members) {
    if (!this.state.memberFilter) return members;
    const f = this.state.memberFilter.toLowerCase();
    return members.filter(
      m =>
        (m.values['First Name'] || '').toLowerCase().includes(f) ||
        (m.values['Last Name'] || '').toLowerCase().includes(f),
    );
  }
  exportAllCSV() {
    const fileDownload = require('js-file-download');
    const md = this.state.memberData;
    const allowCash =
      getAttributeValue(this.props.space, 'Allow Cash Payments') === 'true';
    const groups = [
      { label: 'Total Active', members: md.totalActiveMembers.members },
      { label: '---- Male', members: md.totalActiveMembers.maleMembers },
      { label: '---- Female', members: md.totalActiveMembers.femaleMembers },
      { label: '---- Other', members: md.totalActiveMembers.otherMembers },
      {
        label: '------ Kids Male',
        members: md.totalActiveMembers.kidsMaleMembers,
      },
      {
        label: '------ Kids Female',
        members: md.totalActiveMembers.kidsFemaleMembers,
      },
      {
        label: '------ Kids Other',
        members: md.totalActiveMembers.kidsOtherMembers,
      },
      { label: '-- Active', members: md.activeMembers.members },
      { label: '-- Active Non Paying', members: md.nonpayingMembers.members },
      ...(allowCash
        ? [{ label: '-- Active Cash', members: md.activeCashMembers.members }]
        : []),
      ...(md.casualMembers.members.length > 0
        ? [{ label: '-- Active Casual', members: md.casualMembers.members }]
        : []),
      { label: '-- Active Orphan', members: md.orphanMembers.members },
      { label: '-- Pending Freezes', members: md.pendingFrozen.members },
      {
        label: '-- Pending Cancellations',
        members: md.pendingCancellations.members,
      },
      {
        label: '-- Pending Registrations',
        members: md.pendingRegistrations.members,
      },
      { label: 'Active Account Holders', members: md.accountHolders.members },
      { label: 'New Members', members: md.newMembers.members },
      { label: 'Frozen', members: md.frozen.members },
      { label: 'Cancellations', members: md.cancellations.members },
      { label: 'UnFrozen', members: md.unfrozen.members },
      { label: 'Restored', members: md.restored.members },
    ];
    const header = [
      'Group',
      'Member Name',
      'Status',
      'Date Joined',
      'Created At',
      'Updated At',
      'Last Status Date',
    ];
    const rows = [];
    groups.forEach(({ label, members }) => {
      members.forEach(m => {
        const history = getJson(m.values['Status History'] || '[]');
        const sorted = [...history].sort(
          (a, b) => (moment(a.date).isBefore(moment(b.date)) ? -1 : 1),
        );
        const lastEntry = sorted.length > 0 ? sorted[sorted.length - 1] : null;
        const lastStatusDate = lastEntry
          ? moment(lastEntry.date).format('YYYY-MM-DD')
          : '';
        rows.push(
          [
            label,
            `${m.values['Last Name'] || ''} ${m.values['First Name'] ||
              ''}`.trim(),
            m.values['Status'] || '',
            m.values['Date Joined'] || '',
            m.createdAt ? moment(m.createdAt).format('YYYY-MM-DD') : '',
            m.updatedAt ? moment(m.updatedAt).format('YYYY-MM-DD') : '',
            lastStatusDate,
          ]
            .map(v => `"${String(v).replace(/"/g, '""')}"`)
            .join(','),
        );
      });
    });
    const csv = [header.join(','), ...rows].join('\n');
    fileDownload(csv, 'member-statistics.csv');
  }
  getMemberTableColumns() {
    return [
      {
        accessor: 'id',
        Header: this.getMemberTableHeaderName(),
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        Cell: props => (
          <NavLink to={`/Member/${props.original.id}`}>
            {props.original.values['Last Name']}{' '}
            {props.original.values['First Name']}
          </NavLink>
        ),
      },
    ];
  }
  render() {
    return !this.state.historyLoaded ? (
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
            <label htmlFor="quarterly" className="radio">
              <input
                id="quarterly"
                name="period"
                type="radio"
                value="Quarterly"
                onChange={e => {
                  this.setState({
                    billingPeriod: 'quarterly',
                    viewPeriod: 'this_period',
                  });
                  this.setStatisticDates(e, 'this_period', 'quarterly');
                }}
                defaultChecked={
                  this.state.billingPeriod === 'quarterly'
                    ? 'defaultChecked'
                    : ''
                }
              />
              Quarterly
            </label>
          </div>
        </span>

        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <div className="dateNavButtons">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={() => this.navigatePeriod(-1)}
                disabled={!this.hasEarlierMembers(this.state.fromDate)}
              >
                {'< Previous '}
                {this.state.billingPeriod === 'weekly'
                  ? 'Week'
                  : this.state.billingPeriod === 'fortnightly'
                    ? 'Fortnight'
                    : this.state.billingPeriod === 'quarterly'
                      ? 'Quarter'
                      : 'Month'}
              </button>
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={() => this.navigatePeriod(1)}
                disabled={this.state.toDate.isSameOrAfter(moment(), 'day')}
              >
                {'Next '}
                {this.state.billingPeriod === 'weekly'
                  ? 'Week'
                  : this.state.billingPeriod === 'fortnightly'
                    ? 'Fortnight'
                    : this.state.billingPeriod === 'quarterly'
                      ? 'Quarter'
                      : 'Month'}
                {' >'}
              </button>
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={e => {
                  this.setState({ viewPeriod: 'custom' });
                  this.setStatisticDates(e, 'custom', this.state.billingPeriod);
                }}
              >
                Custom
              </button>
            </div>
            <div className="dateRangeLabel">
              {this.state.fromDate.format('DD MMM YYYY')} –{' '}
              {this.state.toDate.format('DD MMM YYYY')}
            </div>
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
        </div>

        <div className="memberFinanceStatistics">
          <div className="statLinesToolbar">
            <span className="exportCsvLink" onClick={() => this.exportAllCSV()}>
              ↓ Export to CSV
            </span>
          </div>
          <div
            className="statLinesWrapper"
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <div className="statLines">
              <div className="statLine">
                <div className="statLabel">Total Active</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showTotalActiveMembers: true,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.totalActiveMembers.members.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">---- Male</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showMaleMembers: true,
                      showTotalActiveMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.totalActiveMembers.maleMembers.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">---- Female</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showFemaleMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {
                    this.state.memberData.totalActiveMembers.femaleMembers
                      .length
                  }
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">---- Other</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showOtherMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.totalActiveMembers.otherMembers.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">---- Kids (≤16)</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showKidsMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.totalActiveMembers.kidsMembers.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">------ Male</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showKidsMaleMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {
                    this.state.memberData.totalActiveMembers.kidsMaleMembers
                      .length
                  }
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">------ Female</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showKidsFemaleMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {
                    this.state.memberData.totalActiveMembers.kidsFemaleMembers
                      .length
                  }
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">------ Other</div>
                <div
                  className="statCount"
                  onClick={() =>
                    this.setState({
                      showKidsOtherMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {
                    this.state.memberData.totalActiveMembers.kidsOtherMembers
                      .length
                  }
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">-- Active</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showActiveMembers: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.activeMembers.members.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">-- Active Non Paying</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showActiveNonPayingMembers: true,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.nonpayingMembers.members.length}
                </div>
              </div>
              {getAttributeValue(this.props.space, 'Allow Cash Payments') ===
                'true' && (
                <div className="statLine statChild">
                  <div className="statLabel">-- Active Cash</div>
                  <div
                    className="statCount"
                    onClick={e =>
                      this.setState({
                        showActiveCashMembers: true,
                        showActiveMembers: false,
                        showTotalActiveMembers: false,
                        showMaleMembers: false,
                        showFemaleMembers: false,
                        showOtherMembers: false,
                        showKidsMembers: false,
                        showKidsMaleMembers: false,
                        showKidsFemaleMembers: false,
                        showKidsOtherMembers: false,
                        showActiveNonPayingMembers: false,
                        showActiveCasualMembers: false,
                        showActiveOrphanMembers: false,
                        showAccountHolders: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showPendingRegistrationsMembers: false,
                        showFrozenMembers: false,
                        showUnFrozenMembers: false,
                        showRestoredMembers: false,
                        showPendingFrozenMembers: false,
                        showNewMembers: false,
                      })
                    }
                  >
                    {this.state.memberData.activeCashMembers.members.length}
                  </div>
                </div>
              )}
              {this.state.memberData.casualMembers.members.length > 0 && (
                <div className="statLine statChild">
                  <div className="statLabel">-- Active Casual</div>
                  <div
                    className="statCount"
                    onClick={e =>
                      this.setState({
                        showActiveCasualMembers: true,
                        showActiveOrphanMembers: false,
                        showActiveMembers: false,
                        showTotalActiveMembers: false,
                        showMaleMembers: false,
                        showFemaleMembers: false,
                        showOtherMembers: false,
                        showKidsMembers: false,
                        showKidsMaleMembers: false,
                        showKidsFemaleMembers: false,
                        showKidsOtherMembers: false,
                        showActiveNonPayingMembers: false,
                        showActiveCashMembers: false,
                        showAccountHolders: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showPendingRegistrationsMembers: false,
                        showFrozenMembers: false,
                        showUnFrozenMembers: false,
                        showRestoredMembers: false,
                        showPendingFrozenMembers: false,
                        showNewMembers: false,
                      })
                    }
                  >
                    {this.state.memberData.casualMembers.members.length}
                  </div>
                </div>
              )}
              <div className="statLine statChild">
                <div className="statLabel">-- Active Orphan</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showActiveOrphanMembers: true,
                      showActiveCasualMembers: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.orphanMembers.members.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">-- Pending Freezes</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showPendingFrozenMembers: true,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.pendingFrozen.members.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">-- Pending Cancellations</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showPendingCancellationsMembers: true,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                      showPendingRegistrationsMembers: false,
                    })
                  }
                >
                  {this.state.memberData.pendingCancellations.members.length}
                </div>
              </div>
              <div className="statLine statChild">
                <div className="statLabel">-- Pending Registrations</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showPendingRegistrationsMembers: true,
                      showPendingCancellationsMembers: false,
                      showActiveMembers: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showAccountHolders: false,
                      showCancellationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.pendingRegistrations.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">Active Account Holders</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showAccountHolders: true,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.accountHolders.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">New Members</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showNewMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                    })
                  }
                >
                  {this.state.memberData.newMembers.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">Frozen</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showFrozenMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.frozen.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">Cancellations</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showCancellationsMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.cancellations.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">UnFrozen</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showUnFrozenMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showRestoredMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.unfrozen.members.length}
                </div>
              </div>
              <div className="statLine">
                <div className="statLabel">Restored</div>
                <div
                  className="statCount"
                  onClick={e =>
                    this.setState({
                      showRestoredMembers: true,
                      showAccountHolders: false,
                      showTotalActiveMembers: false,
                      showMaleMembers: false,
                      showFemaleMembers: false,
                      showOtherMembers: false,
                      showKidsMembers: false,
                      showKidsMaleMembers: false,
                      showKidsFemaleMembers: false,
                      showKidsOtherMembers: false,
                      showActiveMembers: false,
                      showActiveNonPayingMembers: false,
                      showActiveCasualMembers: false,
                      showActiveOrphanMembers: false,
                      showActiveCashMembers: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showPendingRegistrationsMembers: false,
                      showFrozenMembers: false,
                      showUnFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showNewMembers: false,
                    })
                  }
                >
                  {this.state.memberData.restored.members.length}
                </div>
              </div>
            </div>
            {this.renderMembersPanel()}
          </div>
        </div>
      </span>
    );
  }
}

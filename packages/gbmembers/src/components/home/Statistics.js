import React, { Component } from 'react';
import moment from 'moment';
import {
  getJson,
  memberStatusInDates,
  memberPreviousStatus,
  getLocalePreference,
} from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import { ReactComponent as CrossIcon } from '../../images/cross.svg';
import { ReactComponent as HelpIcon } from '../../images/help.svg';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import ReactTooltip from 'react-tooltip';

var compThis = undefined;
var twelveMonthRetentionRateData = undefined;
var retentionRateData = 0;
var apsData = 0;

export class Statistics extends Component {
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
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this._getLeadRowTableColumns = this.getLeadRowTableColumns();
    this._getLeadIntroRowTableColumns = this.getLeadIntroRowTableColumns();
    this._getMemberRowTableColumns = this.getMemberRowTableColumns();

    this.loadRententionRate = this.loadRententionRate.bind(this);

    this.setIsAssigning = this.props.setIsAssigning;
    this.datesChanged = this.props.datesChanged;
    this.setFromDate = this.props.setFromDate;
    this.setToDate = this.props.setToDate;

    let fromDate = moment().subtract(6, 'days');
    fromDate.hour(0).minute(0);

    let toDate = moment()
      .hour(23)
      .minute(59);

    let leads = this.props.leadsByDate;
    let leadData = this.getData(
      leads,
      this.props.allMembers,
      fromDate,
      toDate,
      false,
    );
    let memberData = this.getMemberData(
      this.props.allMembers,
      fromDate,
      toDate,
    );
    this.state = {
      leads,
      leadData,
      allMembers: this.props.allMembers,
      memberData,
      fromDate,
      toDate,
      LCTViewSwitch: false,
      showNewLeads: false,
      showScheduledLeads: false,
      showIntroLeads: false,
      showConvertedLeads: false,
      showCancellationsMembers: false,
      showPendingCancellationsMembers: false,
      showFrozenMembers: false,
      showPendingFrozenMembers: false,
      showOverdueMembers: false,
      showNewMembers: false,
      showRententionRates: false,
      retentionRate: retentionRateData,
      twelveMonthRetentionRate: twelveMonthRetentionRateData,
      retentionLoaded:
        twelveMonthRetentionRateData === undefined ? false : true,
      retentionLoading: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.leadsByDateLoading &&
      !nextProps.membersLoading &&
      !nextProps.monthlyStatisticsLoading
    ) {
      if (
        getAttributeValue(this.props.space, 'Billing Company') === 'PaySmart' &&
        !nextProps.overduesLoading
      ) {
        let leads = nextProps.leadsByDate;
        let leadData = this.getData(
          leads,
          nextProps.allMembers,
          this.state.fromDate,
          this.state.toDate,
          this.state.LCTViewSwitch,
        );
        let memberData = this.getMemberData(
          nextProps.allMembers,
          this.state.fromDate,
          this.state.toDate,
          nextProps.overdues,
        );
        this.setState({
          leads,
          allMembers: nextProps.allMembers,
          leadData,
          memberData,
        });
      } else if (
        getAttributeValue(this.props.space, 'Billing Company') !== 'PaySmart'
      ) {
        let leads = nextProps.leadsByDate;
        let leadData = this.getData(
          leads,
          nextProps.allMembers,
          this.state.fromDate,
          this.state.toDate,
          this.state.LCTViewSwitch,
        );
        let memberData = this.getMemberData(
          nextProps.allMembers,
          this.state.fromDate,
          this.state.toDate,
        );
        this.setState({
          leads,
          allMembers: nextProps.allMembers,
          leadData,
          memberData,
        });
      }
    }
  }

  UNSAFE_componentWillMount() {
    if (this.props.leadsByDate.length === 0) {
      this.props.fetchLeadsByDate();
    }

    if (
      getAttributeValue(this.props.space, 'Billing Company') === 'PaySmart' &&
      this.props.overdues.length === 0
    ) {
      this.props.getOverdues();
    }
  }
  loadRententionRate() {
    if (twelveMonthRetentionRateData === undefined) {
      /*      var monthlyStatisticsSorted = this.props.monthlyStatistics.sort(function(
        stat1,
        stat2,
      ) {
        try {
          if (
            stat1.values['Year'] + stat1.values['Month'] <
            stat2.values['Year'] + stat2.values['Month']
          )
            return -1;
          if (
            stat1.values['Year'] + stat1.values['Month'] >
            stat2.values['Year'] + stat2.values['Month']
          )
            return 1;
        } catch (error) {
          return 0;
        }
        return 0;
      }); */
      // Find oldest Member Month up to 12 months
      let oldestMonth = moment();
      this.props.allMembers.forEach(member => {
        var createdAt = moment(member['createdAt']);
        if (createdAt.isBefore(oldestMonth)) {
          oldestMonth = createdAt;
        }
      });

      if (moment().diff(oldestMonth, 'months') > 12) {
        oldestMonth = moment().subtract(12, 'months');
      }
      retentionRateData = this.getRetentionRate(
        this.props.allMembers,
        oldestMonth,
      );
      twelveMonthRetentionRateData = this.getTwelveMonthRetentionRate(
        this.props.allMembers,
        oldestMonth,
      );
      /*      apsData = this.getAPSRate(
        nextProps.allMembers,
        monthlyStatisticsSorted,
      ); */

      this.setState({
        apsData: apsData,
        retentionRate: retentionRateData,
        twelveMonthRetentionRate: twelveMonthRetentionRateData,
        retentionLoaded: true,
        retentionLoading: false,
      });
    }
  }
  getAPSRate(allMembers, monthlyStatistics) {
    if (monthlyStatistics.length > 1) {
      let month = monthlyStatistics[monthlyStatistics.length - 1];
      let lastDayOfMonth = moment(
        month.values['Year'] + '-' + month.values['Month'] + '-01',
      ).endOf('month');

      var billingAmount = month.values['Monthly Revenue'];
      var endOfMonth = this.getActiveMembers(allMembers, lastDayOfMonth);

      return parseFloat(billingAmount) / endOfMonth;
    } else {
      return 0;
    }
  }
  getNewMembers(allMembers, startOfMonth, endOfMonth) {
    var newMembers = 0;
    allMembers.forEach((member, i) => {
      if (
        member['values']['Date Joined'] !== undefined &&
        member['values']['Date Joined'] !== null &&
        member['values']['Date Joined'] !== ''
      ) {
        if (
          moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
            startOfMonth,
            'day',
          ) &&
          moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
            endOfMonth,
            'day',
          )
        ) {
          newMembers = newMembers + 1;
          if (startOfMonth.month() === 13) {
            console.log(
              startOfMonth.format('YYYY-MM-DD') +
                ',New Member,' +
                member['values']['Date Joined'] +
                ', ' +
                member['values']['First Name'] +
                ' ' +
                member['values']['Last Name'],
            );
          }
        }
      }
    });

    return newMembers;
  }
  getActiveMembers(allMembers, day) {
    var activeMembers = 0;
    allMembers.forEach((member, i) => {
      if (
        member['values']['Status History'] === undefined ||
        member['values']['Status History'] === ''
      ) {
        if (
          member['values']['Date Joined'] !== undefined &&
          member['values']['Date Joined'] !== null &&
          member['values']['Date Joined'] !== ''
        ) {
          if (
            moment(
              member['values']['Date Joined'],
              'YYYY-MM-DD',
            ).isSameOrBefore(day, 'day') &&
            member['values']['Status'] === 'Active'
          ) {
            //console.log(day+","+member['values']['First Name']+" "+member['values']['Last Name'])
            activeMembers = activeMembers + 1;
            if (day.month() === 13) {
              console.log(
                day.format('YYYY-MM-DD') +
                  ' 1, Active Member,' +
                  member['values']['Date Joined'] +
                  ', ' +
                  member['values']['First Name'] +
                  ' ' +
                  member['values']['Last Name'],
              );
            }
          }
        }
      } else {
        var statusHistory = JSON.parse(
          member['values']['Status History'] === null ||
          member['values']['Status History'] === undefined
            ? '[]'
            : member['values']['Status History'],
        );
        let oldestDate = undefined;

        var statusHistorySorted = statusHistory.sort(function(stat1, stat2) {
          var date1 = moment(stat1.date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);
          var date2 = moment(stat2.date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);

          try {
            if (date1.isBefore(date2)) return 1;
            if (date1.isAfter(date2)) return -1;
          } catch (error) {
            return 0;
          }
          return 0;
        });

        if (statusHistorySorted.length > 0) {
          moment(statusHistorySorted[statusHistorySorted.length - 1].date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);
        }
        if (oldestDate !== undefined && day.isSameOrBefore(oldestDate)) {
          if (
            member['values']['Date Joined'] !== undefined &&
            member['values']['Date Joined'] !== null &&
            member['values']['Date Joined'] !== ''
          ) {
            if (
              moment(
                member['values']['Date Joined'],
                'YYYY-MM-DD',
              ).isSameOrBefore(day, 'day')
            ) {
              activeMembers = activeMembers + 1;
              if (day.month() === 13) {
                console.log(
                  day.format('YYYY-MM-DD') +
                    '2, Active Member,' +
                    member['values']['Date Joined'] +
                    ', ' +
                    member['values']['First Name'] +
                    ' ' +
                    member['values']['Last Name'],
                );
              }
            }
          }
        } else {
          // Locate the Status of Member on this date
          for (var idx = statusHistorySorted.length - 1; idx >= 0; idx--) {
            let currentDate = moment(statusHistorySorted[idx].date, [
              'dd MMM DD YYYY hh:mm:ss Z',
              'YYYY-MM-DD hh:mm:ss Z',
            ]);
            let currentStatus = statusHistorySorted[idx].status;
            let nextStatus = undefined;
            let nextDate = undefined;

            if (idx > 0) {
              nextStatus = statusHistorySorted[idx - 1].status;
              nextDate = moment(statusHistorySorted[idx - 1].date, [
                'dd MMM DD YYYY hh:mm:ss Z',
                'YYYY-MM-DD hh:mm:ss Z',
              ]);
            }

            if (
              day.isSameOrAfter(currentDate, 'day') &&
              (nextDate === undefined || day.isSameOrBefore(nextDate, 'day'))
            ) {
              if (
                currentStatus === 'Active' ||
                currentStatus === 'Frozen' ||
                currentStatus === 'Pending Freeze' ||
                currentStatus === 'Pending Cancellation'
              ) {
                //console.log(day+","+member['values']['First Name']+" "+member['values']['Last Name'])
                activeMembers = activeMembers + 1;
                if (day.month() === 13) {
                  console.log(
                    day.format('YYYY-MM-DD') +
                      ' 3, Active Member,' +
                      member['values']['Date Joined'] +
                      ', ' +
                      member['values']['First Name'] +
                      ' ' +
                      member['values']['Last Name'],
                  );
                }
                idx = -1; //Break
              }
            }
          }
        }
      }
    });

    return activeMembers;
  }
  getFrozenMembers(allMembers, day) {
    var frozenMembers = 0;
    allMembers.forEach((member, i) => {
      if (
        member['values']['Status History'] === undefined ||
        member['values']['Status History'] === null ||
        member['values']['Status History'] === ''
      ) {
      } else {
        var statusHistory = JSON.parse(member['values']['Status History']);
        var statusHistorySorted = statusHistory.sort(function(stat1, stat2) {
          var date1 = moment(stat1.date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);
          var date2 = moment(stat2.date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);

          try {
            if (date1.isBefore(date2)) return 1;
            if (date1.isAfter(date2)) return -1;
          } catch (error) {
            return 0;
          }
          return 0;
        });

        // Locate the Status of Member on this date
        for (var idx = statusHistorySorted.length - 1; idx >= 0; idx--) {
          let currentDate = moment(statusHistorySorted[idx].date, [
            'dd MMM DD YYYY hh:mm:ss Z',
            'YYYY-MM-DD hh:mm:ss Z',
          ]);
          let currentStatus = statusHistorySorted[idx].status;
          let nextStatus = undefined;
          let nextDate = undefined;

          if (idx > 0) {
            nextStatus = statusHistorySorted[idx - 1].status;
            nextDate = moment(statusHistorySorted[idx - 1].date, [
              'dd MMM DD YYYY hh:mm:ss Z',
              'YYYY-MM-DD hh:mm:ss Z',
            ]);
          }

          if (
            day.isSameOrAfter(currentDate, 'day') &&
            (nextDate === undefined || day.isSameOrBefore(nextDate, 'day'))
          ) {
            if (currentStatus === 'Frozen') {
              frozenMembers = frozenMembers + 1;
              if (day.month() === 13) {
                console.log(
                  day.format('YYYY-MM-DD') +
                    ' 3, Frozen Member,' +
                    member['values']['Date Joined'] +
                    ', ' +
                    member['values']['First Name'] +
                    ' ' +
                    member['values']['Last Name'],
                );
              }
              idx = -1; //Break
            }
          }
        }
      }
    });

    return frozenMembers;
  }
  getRetentionRate(allMembers, oldestMonth) {
    if (moment().diff(oldestMonth, 'months') >= 1) {
      let month = moment().subtract(1, 'month');
      let firstDayOfMonth = moment(month).startOf('month');
      let lastDayOfMonth = moment(month).endOf('month');

      let newMembers = this.getNewMembers(
        allMembers,
        firstDayOfMonth,
        lastDayOfMonth,
      );
      var beginOfMonth = this.getActiveMembers(allMembers, firstDayOfMonth);
      var endOfMonth = this.getActiveMembers(allMembers, lastDayOfMonth);

      var rate = (endOfMonth - newMembers) / beginOfMonth;
      return rate > 1 ? 1 : rate;
    } else {
      return 0;
    }
  }
  getTwelveMonthRetentionRate(allMembers, oldestMonth) {
    var twelveMonthRates = [];
    var rententionRate = 0;
    var newMembersTotal = 0;
    var retentionTotal = 0;
    var periodStartCount = 0;
    var periodEndCount = 0;
    var retentionTotalMonths =
      moment().diff(oldestMonth, 'months') > 12
        ? 12
        : moment().diff(oldestMonth, 'months');

    for (var i = retentionTotalMonths; i > 0; i--) {
      //if (i === 0) continue;
      var periodMonth = moment().subtract(i, 'months');
      var firstDayOfMonth = moment(periodMonth).startOf('month');
      var lastDayOfMonth = moment(periodMonth).endOf('month');
      var beginOfMonth =
        i === 0 ? 0 : this.getActiveMembers(allMembers, firstDayOfMonth);
      //      console.log("XXX getActiveMembers day:"+firstDayOfMonth.format("YYYY-MM-DD")+" beginOfMonth:"+beginOfMonth);

      var beginOfMonthFrozen =
        i === 0 ? 0 : this.getFrozenMembers(allMembers, firstDayOfMonth);
      var endOfMonth = this.getActiveMembers(allMembers, lastDayOfMonth);
      //      console.log("XXX getActiveMembers day:"+lastDayOfMonth.format("YYYY-MM-DD")+" endOfMonth:"+endOfMonth);
      var endOfMonthFrozen = this.getFrozenMembers(allMembers, lastDayOfMonth);
      var newMembers = this.getNewMembers(
        allMembers,
        firstDayOfMonth,
        lastDayOfMonth,
      );

      if (periodStartCount === 0) {
        periodStartCount = i === 0 ? 0 : beginOfMonth;
      }
      newMembersTotal = newMembersTotal + newMembers;
      retentionTotal =
        retentionTotal + (endOfMonth - newMembers) / parseInt(beginOfMonth);

      var rate = (endOfMonth - newMembers) / parseInt(beginOfMonth);
      rate = rate > 1 ? 1 : rate;
      twelveMonthRates.push({
        month: periodMonth.format('MMMM'),
        beginOfMonth: beginOfMonth,
        beginOfMonthFrozen: beginOfMonthFrozen,
        endOfMonth: endOfMonth,
        endOfMonthFrozen: endOfMonthFrozen,
        newMembers: newMembers,
        rententionRate: rate.toLocaleString(undefined, {
          style: 'percent',
          minimumFractionDigits: 2,
        }),
      });
    }

    if (i === 0) {
      periodEndCount = endOfMonth;
    }
    return {
      values: twelveMonthRates,
      newMembersTotal: newMembersTotal,
      retentionTotalMonths: retentionTotalMonths,
      retentionTotal: (retentionTotal / retentionTotalMonths).toLocaleString(
        undefined,
        {
          style: 'percent',
          minimumFractionDigits: 2,
        },
      ),
      twelveMonthAverage: (
        (periodEndCount - newMembersTotal) /
        periodStartCount
      ).toLocaleString(undefined, {
        style: 'percent',
        minimumFractionDigits: 2,
      }),
    };
  }
  getData(leads, allMembers, fromDate, toDate, LCTViewSwitch) {
    if (!leads || leads.length <= 0) {
      return {
        leadsTotal: [],
        introsTotal: [],
        attendedTotal: [],
        convertedTotal: [],
        meetingTotal: [],
        meetingCompletedTotal: [],
        meetingNoAnswerTotal: [],
      };
    }

    let leadsTotal = [];
    let introsTotal = [];
    let attendedTotal = [];
    let noshowTotal = [];
    let convertedTotal = [];
    let meetingTotal = [];
    let meetingCompletedTotal = [];
    let meetingNoAnswerTotal = [];

    if (LCTViewSwitch) {
      let idx = 0;
      leads.forEach(lead => {
        if (moment(lead['createdAt']).isBetween(fromDate, toDate)) {
          leadsTotal[leadsTotal.length] = { lead: lead, idx: idx };
          idx = idx + 1;
          //      }
          //      if (moment(lead['updatedAt']).isBetween(fromDate, toDate)) {
          var history =
            lead.values['History'] !== undefined
              ? getJson(lead.values['History'])
              : {};
          for (var i = 0; i < history.length; i++) {
            if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'intro_class'
            ) {
              introsTotal[introsTotal.length] = { lead: lead, idx: i };
            } else if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'attended_class'
            ) {
              attendedTotal[attendedTotal.length] = { lead: lead, idx: i };
            } else if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'noshow_class'
            ) {
              noshowTotal[noshowTotal.length] = lead;
            } else if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'meeting'
            ) {
              meetingTotal[meetingTotal.length] = { lead: lead, idx: i };
            } else if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'meeting_completed'
            ) {
              meetingCompletedTotal[meetingCompletedTotal.length] = {
                lead: lead,
                idx: i,
              };
            } else if (
              moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
                fromDate,
                toDate,
              ) &&
              history[i]['contactMethod'] === 'meeting_noanswer'
            ) {
              meetingNoAnswerTotal[meetingNoAnswerTotal.length] = {
                lead: lead,
                idx: i,
              };
            }
          }
          if (lead.values['Lead State'] === 'Converted') {
            let memberIdx = allMembers.findIndex(
              member => member.values['Lead Submission ID'] === lead.id,
            );
            if (
              memberIdx !== -1 &&
              moment(allMembers[memberIdx]['createdAt']).isBetween(
                fromDate,
                toDate,
              )
            ) {
              convertedTotal[convertedTotal.length] = allMembers[memberIdx];
            }
          }
        }
      });
    } else {
      var idx = 0;
      leads.forEach(lead => {
        if (moment(lead['createdAt']).isBetween(fromDate, toDate)) {
          leadsTotal[leadsTotal.length] = { lead: lead, idx: idx };
          idx = idx + 1;
        }
        //        if (moment(lead['updatedAt']).isBetween(fromDate, toDate)) {
        var history =
          lead.values['History'] !== undefined
            ? getJson(lead.values['History'])
            : {};
        for (var i = 0; i < history.length; i++) {
          if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'intro_class'
          ) {
            introsTotal[introsTotal.length] = { lead: lead, idx: i };
          } else if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'attended_class'
          ) {
            attendedTotal[attendedTotal.length] = { lead: lead, idx: i };
          } else if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'noshow_class'
          ) {
            noshowTotal[noshowTotal.length] = { lead: lead, idx: i };
          } else if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'meeting'
          ) {
            meetingTotal[meetingTotal.length] = { lead: lead, idx: i };
          } else if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'meeting_completed'
          ) {
            meetingCompletedTotal[meetingCompletedTotal.length] = {
              lead: lead,
              idx: i,
            };
          } else if (
            moment(history[i]['contactDate'], 'YYYY-MM-DD HH:mm').isBetween(
              fromDate,
              toDate,
            ) &&
            history[i]['contactMethod'] === 'meeting_noanswer'
          ) {
            meetingNoAnswerTotal[meetingNoAnswerTotal.length] = {
              lead: lead,
              idx: i,
            };
          }
        }
        if (lead.values['Lead State'] === 'Converted') {
          let memberIdx = allMembers.findIndex(
            member => member.values['Lead Submission ID'] === lead.id,
          );
          if (
            memberIdx !== -1 &&
            moment(allMembers[memberIdx]['createdAt']).isBetween(
              fromDate,
              toDate,
            )
          ) {
            convertedTotal[convertedTotal.length] = allMembers[memberIdx];
          }
        }
      });
    }

    return {
      leadsTotal: leadsTotal,
      introsTotal: introsTotal,
      attendedTotal: attendedTotal,
      convertedTotal: convertedTotal,
      meetingTotal: meetingTotal,
      meetingCompletedTotal: meetingCompletedTotal,
      meetingNoAnswerTotal: meetingNoAnswerTotal,
    };
  }
  getMemberData(members, fromDate, toDate, overdueRecords) {
    if (!members || members.length <= 0) {
      return {
        active: [],
        newmembers: [],
        cancellations: [],
        pendingCancellations: [],
        frozen: [],
        pendingFrozen: [],
        overdues: [],
      };
    }
    let active = [];
    let newmembers = [];
    let cancellations = [];
    let pendingCancellations = [];
    let frozen = [];
    let pendingFrozen = [];
    let overdues = [];

    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate);
      if (memberStatus === 'Active') {
        var previousStatus = memberPreviousStatus(member, fromDate, toDate);
        if (previousStatus === 'Inactive') {
          newmembers[newmembers.length] = member;
        } else if (
          previousStatus === '' &&
          (member['values']['Lead Submission ID'] === undefined ||
            member['values']['Lead Submission ID'] === '') &&
          moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
            fromDate,
            'day',
          ) &&
          moment(member['values']['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
            toDate,
            'day',
          )
        ) {
          newmembers[newmembers.length] = member;
        }
      }
      if (memberStatus === 'Inactive') {
        cancellations[cancellations.length] = member;
      }
      if (memberStatus === 'Pending Cancellation') {
        pendingCancellations[pendingCancellations.length] = member;
      }
      if (memberStatus === 'Frozen' || memberStatus === 'Suspended') {
        frozen[frozen.length] = member;
      }
      if (
        memberStatus === 'Pending Freeze' ||
        memberStatus === 'Pending Suspension'
      ) {
        pendingFrozen[pendingFrozen.length] = member;
      }
    });
    members.forEach(member => {
      let memberStatus = memberStatusInDates(member, fromDate, toDate, true);
      if (
        memberStatus === 'Active' ||
        memberStatus === 'Pending Freeze' ||
        memberStatus === 'Pending Cancellation'
      ) {
        active[active.length] = member;
      }
      if (memberStatus === 'Frozen') {
        active[active.length] = member;
      }
    });
    if (overdueRecords !== undefined) {
      overdueRecords.forEach(payment => {
        var member = members.find(
          member =>
            member.values['Billing Customer Id'] === payment.customerReference,
        );
        if (member !== undefined) {
          overdues[overdues.length] = {
            payment: payment,
            member: member,
          };
        }
      });
    }
    return {
      active: active,
      newmembers: newmembers,
      cancellations: cancellations,
      pendingCancellations: pendingCancellations,
      frozen: frozen,
      pendingFrozen: pendingFrozen,
      overdues: overdues,
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
        leadData: this.getData(
          this.state.leads,
          this.state.allMembers,
          this.state.fromDate.hour(0).minute(0),
          this.state.toDate.hour(23).minute(59),
          this.state.LCTViewSwitch,
        ),
        memberData: this.getMemberData(
          this.state.allMembers,
          this.state.fromDate,
          this.state.toDate,
        ),
      });
      this.datesChanged(
        this.setFromDate,
        this.setToDate,
        this.state.fromDate,
        this.state.toDate,
      );
    }
  }
  setStatisticDates(e, type) {
    if (type === 'today') {
      let fromDate = moment()
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'last_7_days') {
      let fromDate = moment()
        .subtract(6, 'days')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'last_30_days') {
      let fromDate = moment()
        .subtract(29, 'days')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let data = this.getData(
        this.state.leads,
        this.state.allMembers,
        fromDate,
        toDate,
        this.state.LCTViewSwitch,
      );
      let memberData = this.getMemberData(
        this.state.allMembers,
        fromDate,
        toDate,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        leadData: data,
        memberData: memberData,
        fromDate: fromDate,
        toDate: toDate,
      });
      this.datesChanged(this.setFromDate, this.setToDate, fromDate, toDate);
    } else if (type === 'custom') {
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
  getLeads(leads, col) {
    var leads_col = [];

    for (var i = col - 1; i < leads.length; i = i + 4) {
      //if (i % (col-1) === 0){
      leads_col[leads_col.length] = {
        leadId: leads[i].lead.id,
        lead: leads[i].lead,
        idx: leads[i].idx,
        name:
          leads[i].lead.values['First Name'] +
          ' ' +
          leads[i].lead.values['Last Name'],
      };
      //}
    }

    return leads_col;
  }
  getLeadIntroInfo(lead, idx) {
    var info = '';
    var history =
      lead.values['History'] !== undefined
        ? getJson(lead.values['History'])
        : {};

    /*    if (idx>history.length || history[idx]['contactMethod'] !== 'intro_class'){
      for (var i = history.length - 1; i >= 0; i--) {
        if (history[i]['contactMethod'] === 'intro_class') {
          info = ' (' + moment(history[i]['contactDate']).format('L h:mmA') + ')';
          break;
        }
      } 
    } else { */
    info = ' (' + moment(history[idx]['contactDate']).format('L h:mmA') + ')';
    //    }
    return lead.values['First Name'] + ' ' + lead.values['Last Name'] + info;
  }
  getLeadTableData(leads) {
    leads = leads.sort(function(lead1, lead2) {
      try {
        if (
          (
            lead1.lead.values['First Name'] + lead1.lead.values['Last Name']
          ).toLowerCase() <
          (
            lead2.lead.values['First Name'] + lead2.lead.values['Last Name']
          ).toLowerCase()
        )
          return -1;
        if (
          (
            lead1.lead.values['First Name'] + lead1.lead.values['Last Name']
          ).toLowerCase() >
          (
            lead2.lead.values['First Name'] + lead2.lead.values['Last Name']
          ).toLowerCase()
        )
          return 1;
      } catch (error) {
        return 0;
      }
      return 0;
    });
    let leads_col1 = this.getLeads(leads, 1);
    let leads_col2 = this.getLeads(leads, 2);
    let leads_col3 = this.getLeads(leads, 3);
    let leads_col4 = this.getLeads(leads, 4);

    return [
      {
        leads: {
          leads_col1: leads_col1,
          leads_col2: leads_col2,
          leads_col3: leads_col3,
          leads_col4: leads_col4,
        },
      },
    ];
  }
  getLeadRowTableColumns = () => {
    return [
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col1['leadId']}`}
              className=""
            >
              {props.original.leads_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col2['leadId']}`}
              className=""
            >
              {props.original.leads_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col3['leadId']}`}
              className=""
            >
              {props.original.leads_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col4['leadId']}`}
              className=""
            >
              {props.original.leads_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getLeadIntroRowTableColumns = () => {
    return [
      {
        accessor: 'leads',
        Header: '',
        width: 300,
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col1['leadId']}`}
              className=""
            >
              {this.getLeadIntroInfo(
                props.original.leads_col1['lead'],
                props.original.leads_col1['idx'],
              )}
            </NavLink>
          );
        },
      },
      {
        accessor: 'leads',
        Header: '',
        width: 300,
        headerClassName: 'leads_col',
        className: 'leads_col',
        Cell: props => {
          return props.original.leads_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/LeadDetail/${props.original.leads_col2['leadId']}`}
              className=""
            >
              {this.getLeadIntroInfo(
                props.original.leads_col2['lead'],
                props.original.leads_col2['idx'],
              )}
            </NavLink>
          );
        },
      },
    ];
  };
  getLeadTableHeaderName() {
    if (this.state.showNewLeads) return 'Leads';
    if (this.state.showScheduledLeads) return 'Intro Scheduled';
    if (this.state.showIntroLeads) return 'Completed Intros';
    if (this.state.showMeetingLeads) return 'Meetings Scheduled';
    if (this.state.showMeetingCompletedLeads) return 'Meeting Completed';
    if (this.state.showMeetingNoAnswerLeads) return 'Meeting No Answer';
  }
  getLeadTableColumns(row) {
    return [
      {
        accessor: 'leads',
        Header: this.getLeadTableHeaderName(),
        headerClassName: 'leads_col',
        className: 'leads_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let leads_col1 = props.value.leads_col1;
          let leads_col2 = props.value.leads_col2;
          let leads_col3 = props.value.leads_col3;
          let leads_col4 = props.value.leads_col4;

          let leads = [];
          for (var i = 0; i < leads_col1.length; i++) {
            leads[leads.length] = {
              leads_col1: leads_col1[i],
              leads_col2: leads_col2.length > i ? leads_col2[i] : undefined,
              leads_col3: leads_col3.length > i ? leads_col3[i] : undefined,
              leads_col4: leads_col4.length > i ? leads_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getLeadRowTableColumns}
              pageSize={leads_col1.length > 20 ? 20 : leads_col1.length}
              showPagination={leads_col1.length > 20 ? true : false}
              data={leads}
            />
          );
        },
      },
    ];
  }
  getLeadIntroTableColumns(row) {
    return [
      {
        accessor: 'leads',
        Header: this.getLeadTableHeaderName(),
        headerClassName: 'leads_col',
        className: 'leads_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let leads_col1 = props.value.leads_col1;
          let leads_col2 = props.value.leads_col2;
          let leads_col3 = props.value.leads_col3;
          let leads_col4 = props.value.leads_col4;

          let leads = [];
          for (var i = 0; i < leads_col1.length; i++) {
            leads[leads.length] = {
              leads_col1: leads_col1[i],
              leads_col2: leads_col2.length > i ? leads_col2[i] : undefined,
            };
            leads[leads.length] = {
              leads_col1: leads_col3.length > i ? leads_col3[i] : undefined,
              leads_col2: leads_col4.length > i ? leads_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getLeadIntroRowTableColumns}
              pageSize={leads_col1.length * 2 > 20 ? 20 : leads_col1.length * 2}
              showPagination={leads_col1.length * 2 > 20 ? true : false}
              data={leads}
            />
          );
        },
      },
    ];
  }
  getMembers(members, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 4) {
      //if (i % (col-1) === 0){
      members_col[members_col.length] = {
        memberId: members[i].id,
        name:
          members[i].values['First Name'] +
          ' ' +
          members[i].values['Last Name'],
      };
      //}
    }

    return members_col;
  }
  getOverdueMembers(overdues, col) {
    var members_col = [];

    for (var i = col - 1; i < overdues.length; i = i + 4) {
      members_col[members_col.length] = {
        memberId: overdues[i].member.id,
        name:
          overdues[i].member.values['First Name'] +
          ' ' +
          overdues[i].member.values['Last Name'] +
          ' (' +
          new Intl.NumberFormat(this.props.locale, {
            style: 'currency',
            currency: this.props.currency,
          }).format(-parseInt(overdues[i].payment.amountOverdue)) +
          ')',
      };
    }

    return members_col;
  }

  getMemberTableData(members) {
    members = members.sort(function(member1, member2) {
      try {
        if (
          (
            member1.values['First Name'] + member1.values['Last Name']
          ).toLowerCase() <
          (
            member2.values['First Name'] + member2.values['Last Name']
          ).toLowerCase()
        )
          return -1;
        if (
          (
            member1.values['First Name'] + member1.values['Last Name']
          ).toLowerCase() >
          (
            member2.values['First Name'] + member2.values['Last Name']
          ).toLowerCase()
        )
          return 1;
      } catch (error) {
        return 0;
      }
      return 0;
    });

    let members_col1 = this.getMembers(members, 1);
    let members_col2 = this.getMembers(members, 2);
    let members_col3 = this.getMembers(members, 3);
    let members_col4 = this.getMembers(members, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
        },
      },
    ];
  }
  getOverdueMemberTableData(overdues) {
    overdues = overdues.sort(function(overdue1, overdue2) {
      try {
        if (
          (
            overdue1.member.values['First Name'] +
            overdue1.member.values['Last Name']
          ).toLowerCase() <
          (
            overdue2.member.values['First Name'] +
            overdue2.member.values['Last Name']
          ).toLowerCase()
        )
          return -1;
        if (
          (
            overdue1.member.values['First Name'] +
            overdue1.member.values['Last Name']
          ).toLowerCase() >
          (
            overdue2.member.values['First Name'] +
            overdue2.member.values['Last Name']
          ).toLowerCase()
        )
          return 1;
      } catch (error) {
        return 0;
      }
      return 0;
    });

    let members_col1 = this.getOverdueMembers(overdues, 1);
    let members_col2 = this.getOverdueMembers(overdues, 2);
    let members_col3 = this.getOverdueMembers(overdues, 3);
    let members_col4 = this.getOverdueMembers(overdues, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
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
        width: 200,
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
        width: 200,
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
        width: 200,
        Cell: props => {
          return props.original.members_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col3['memberId']}`}
              className=""
            >
              {props.original.members_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        width: 200,
        Cell: props => {
          return props.original.members_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col4['memberId']}`}
              className=""
            >
              {props.original.members_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getMemberTableHeaderName() {
    if (this.state.showCancellationsMembers) return 'Cancellations';
    if (this.state.showPendingCancellationsMembers)
      return 'Pending Cancellations';
    if (this.state.showFrozenMembers) return 'Frozen';
    if (this.state.showPendingFrozenMembers) return 'Pending Frozen';
    if (this.state.showConvertedLeads) return 'Converted Leads';
    if (this.state.showOverdueMembers) return 'Overdue';
    if (this.state.showNewMembers) return 'New Members';
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
          let members_col3 = props.value.members_col3;
          let members_col4 = props.value.members_col4;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
              members_col3:
                members_col3.length > i ? members_col3[i] : undefined,
              members_col4:
                members_col4.length > i ? members_col4[i] : undefined,
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
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading Statistics ...</p>
        {/*        <ReactSpinner />{' '} */}
      </div>
    ) : (
      <span>
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => this.setStatisticDates(e, 'today')}
            >
              Today
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'last_7_days')}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'last_30_days')}
            >
              Last 30 Days
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*    disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'year')}
            >
              Year
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              /*  disabled={moment().isBetween(
                this.state.fromDate,
                this.state.toDate,
              )} */
              onClick={e => this.setStatisticDates(e, 'custom')}
            >
              Custom
            </button>
          </div>
          {this.state.isShowCustom && (
            <div
              className="stat_customDatesContainer"
              onClose={this.handleClose}
            >
              <div className="" onClose={this.handleClose}>
                <div className="col-md-8">
                  <div className="row">
                    <div className="col-xs-2 mr-1">
                      <label
                        htmlFor="fromDate"
                        id="fromDate"
                        className="control-label"
                      >
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
                    <div className="col-xs-2 mr-1">
                      <label
                        htmlFor="toDate"
                        id="fromDate"
                        className="control-label"
                      >
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
                  </div>
                  <div className="row">
                    <div className="col-xs-2 mr-1">
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleClose()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="col-xs-2 mr-1">
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
        <div className="leadStatistics">
          <div className="statisticsHeader">Lead Conversion Tracker</div>
          <div className="lctView">
            <label htmlFor="lctMode">Switch LCT</label>
            <div className="checkboxFilter">
              <input
                id="lctMode"
                type="checkbox"
                value="1"
                onChange={e => {
                  this.setState({
                    LCTViewSwitch: !this.state.LCTViewSwitch,
                    leadData: this.getData(
                      this.state.leads,
                      this.state.allMembers,
                      this.state.fromDate.hour(0).minute(0),
                      this.state.toDate.hour(23).minute(59),
                      !this.state.LCTViewSwitch,
                    ),
                  });
                }}
              />
              <label htmlFor="lctMode" />
            </div>
            {}
          </div>
          <HelpIcon
            data-for="lctModeHelp"
            data-tip
            content=""
            className="icon help icon-svg"
          />
          <ReactTooltip id="lctModeHelp" place="bottom" variant="info">
            <span className="lctModeHelp">
              <ul>
                <li>
                  No - Displays all Leads created in the period, and all Lead
                  events created in the period for any Lead.
                </li>
                <li>
                  Yes - Displays all Leads created in the period, but only Lead
                  events created in the period for Leads created in the period.
                </li>
              </ul>
            </span>
          </ReactTooltip>
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Leads</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: true,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.leadData.leadsTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className="percent"
                    style={{
                      width: '100%',
                    }}
                  />
                </div>
                <div className="value">100%</div>
              </div>
              {this.state.showNewLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showNewLeads: false,
                      })
                    }
                  >
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(this.state.leadData.leadsTotal)}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Intro Scheduled</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showScheduledLeads: true,
                      showNewLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.leadData.introsTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.introsTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.introsTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  />
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.introsTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showScheduledLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showScheduledLeads: false,
                      })
                    }
                  >
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getLeadIntroTableColumns()}
                    data={this.getLeadTableData(
                      this.state.leadData.introsTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Completed Intros</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showIntroLeads: true,
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.leadData.attendedTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.attendedTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.attendedTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  />
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.attendedTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showIntroLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showIntroLeads: false,
                      })
                    }
                  >
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getLeadTableColumns()}
                    data={this.getLeadTableData(
                      this.state.leadData.attendedTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Converted Leads</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showConvertedLeads: true,
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.leadData.convertedTotal.length}
                </div>
              </div>
              <div className="barDiv">
                <div className="bar">
                  <div
                    className={
                      this.state.leadData.convertedTotal.length /
                        this.state.leadData.leadsTotal.length <
                      0.5
                        ? 'percent50'
                        : 'percent'
                    }
                    style={{
                      width:
                        (this.state.leadData.leadsTotal.length !== 0
                          ? (
                              (this.state.leadData.convertedTotal.length /
                                this.state.leadData.leadsTotal.length) *
                              100
                            ).toFixed(2)
                          : 0) + '%',
                    }}
                  />
                </div>
                <div className="value">
                  {this.state.leadData.leadsTotal.length !== 0
                    ? (
                        (this.state.leadData.convertedTotal.length /
                          this.state.leadData.leadsTotal.length) *
                        100
                      ).toFixed(2)
                    : 0}
                  %
                </div>
              </div>
              {this.state.showConvertedLeads && (
                <div className="leads">
                  <span
                    className="closeLeads"
                    onClick={e =>
                      this.setState({
                        showConvertedLeads: false,
                      })
                    }
                  >
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.leadData.convertedTotal,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
          </div>
          {getAttributeValue(this.props.space, 'Allow Meeting Calls') ===
            'YES' && (
            <div className="statItems">
              <div className="statItem" />
              <div className="statItem">
                <div className="info">
                  <div className="label">Meetings Scheduled</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showNewLeads: false,
                        showScheduledLeads: false,
                        showIntroLeads: false,
                        showConvertedLeads: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showPendingFrozenMembers: false,
                        showOverdueMembers: false,
                        showNewMembers: false,
                        showRententionRates: false,
                        showMeetingLeads: true,
                        showMeetingCompletedLeads: false,
                        showMeetingNoAnswerLeads: false,
                      })
                    }
                  >
                    {this.state.leadData.meetingTotal.length}
                  </div>
                </div>
                <div className="barDiv">
                  <div className="bar">
                    <div
                      className="percent"
                      style={{
                        width: '100%',
                      }}
                    />
                  </div>
                  <div className="value">100%</div>
                </div>
                {this.state.showMeetingLeads && (
                  <div className="leads">
                    <span
                      className="closeLeads"
                      onClick={e =>
                        this.setState({
                          showMeetingLeads: false,
                        })
                      }
                    >
                      <CrossIcon className="icon icon-svg" />
                    </span>
                    <ReactTable
                      columns={this.getLeadIntroTableColumns()}
                      data={this.getLeadTableData(
                        this.state.leadData.meetingTotal,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
              <div className="statItem">
                <div className="info">
                  <div className="label">Meeting Completed</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showScheduledLeads: false,
                        showNewLeads: false,
                        showIntroLeads: false,
                        showConvertedLeads: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showPendingFrozenMembers: false,
                        showOverdueMembers: false,
                        showNewMembers: false,
                        showRententionRates: false,
                        showMeetingLeads: false,
                        showMeetingCompletedLeads: true,
                        showMeetingNoAnswerLeads: false,
                      })
                    }
                  >
                    {this.state.leadData.meetingCompletedTotal.length}
                  </div>
                </div>
                <div className="barDiv">
                  <div className="bar">
                    <div
                      className={
                        this.state.leadData.meetingCompletedTotal.length /
                          this.state.leadData.meetingTotal.length <
                        0.5
                          ? 'percent50'
                          : 'percent'
                      }
                      style={{
                        width:
                          (this.state.leadData.meetingTotal.length !== 0
                            ? (
                                (this.state.leadData.meetingCompletedTotal
                                  .length /
                                  this.state.leadData.meetingTotal.length) *
                                100
                              ).toFixed(2)
                            : 0) + '%',
                      }}
                    />
                  </div>
                  <div className="value">
                    {this.state.leadData.meetingTotal.length !== 0
                      ? (
                          (this.state.leadData.meetingCompletedTotal.length /
                            this.state.leadData.meetingTotal.length) *
                          100
                        ).toFixed(2)
                      : 0}
                    %
                  </div>
                </div>
                {this.state.showMeetingCompletedLeads && (
                  <div className="leads">
                    <span
                      className="closeLeads"
                      onClick={e =>
                        this.setState({
                          showMeetingCompletedLeads: false,
                        })
                      }
                    >
                      <CrossIcon className="icon icon-svg" />
                    </span>
                    <ReactTable
                      columns={this.getLeadIntroTableColumns()}
                      data={this.getLeadTableData(
                        this.state.leadData.meetingCompletedTotal,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
              <div className="statItem">
                <div className="info">
                  <div className="label">Meeting Not Answered</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showIntroLeads: false,
                        showNewLeads: false,
                        showScheduledLeads: false,
                        showConvertedLeads: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showPendingFrozenMembers: false,
                        showOverdueMembers: false,
                        showNewMembers: false,
                        showRententionRates: false,
                        showMeetingLeads: false,
                        showMeetingCompletedLeads: false,
                        showMeetingNoAnswerLeads: true,
                      })
                    }
                  >
                    {this.state.leadData.meetingNoAnswerTotal.length}
                  </div>
                </div>
                <div className="barDiv">
                  <div className="bar">
                    <div
                      className={
                        this.state.leadData.meetingNoAnswerTotal.length /
                          this.state.leadData.meetingTotal.length <
                        0.5
                          ? 'percent50'
                          : 'percent'
                      }
                      style={{
                        width:
                          (this.state.leadData.meetingNoAnswerTotal.length !== 0
                            ? (
                                (this.state.leadData.meetingNoAnswerTotal
                                  .length /
                                  this.state.leadData.meetingTotal.length) *
                                100
                              ).toFixed(2)
                            : 0) + '%',
                      }}
                    />
                  </div>
                  <div className="value">
                    {this.state.leadData.meetingTotal.length !== 0
                      ? (
                          (this.state.leadData.meetingNoAnswerTotal.length /
                            this.state.leadData.meetingTotal.length) *
                          100
                        ).toFixed(2)
                      : 0}
                    %
                  </div>
                </div>
                {this.state.showMeetingNoAnswerLeads && (
                  <div className="leads">
                    <span
                      className="closeLeads"
                      onClick={e =>
                        this.setState({
                          showMeetingNoAnswerLeads: false,
                        })
                      }
                    >
                      <CrossIcon className="icon icon-svg" />
                    </span>
                    <ReactTable
                      columns={this.getLeadIntroTableColumns()}
                      data={this.getLeadTableData(
                        this.state.leadData.meetingNoAnswerTotal,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <div className="memberStatistics">
          <div className="statItems">
            <div className="statItem">
              <div className="info">
                <div className="label">Cancellations</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: true,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.memberData.cancellations.length}
                </div>
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
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.cancellations,
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
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: true,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.memberData.pendingCancellations.length}
                </div>
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
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingCancellations,
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
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: true,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.memberData.frozen.length}
                </div>
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
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(this.state.memberData.frozen)}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Pending frozen</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: true,
                      showOverdueMembers: false,
                      showNewMembers: false,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.memberData.pendingFrozen.length}
                </div>
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
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.pendingFrozen,
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            <div className="statItem">
              <div className="info percentage">
                <div className="label">Attrition</div>
                <div className="value">
                  {!Number.isNaN(
                    Number(
                      (this.state.memberData.cancellations.length /
                        this.state.memberData.active.length) *
                        100,
                    ),
                  ) && (
                    <span>
                      {Number(
                        (this.state.memberData.cancellations.length /
                          this.state.memberData.active.length) *
                          100,
                      ).toFixed(2)}
                      %
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">Growth</div>
                <div className="value">
                  {this.state.leadData.convertedTotal !== undefined &&
                    this.state.memberData.cancellations !== undefined && (
                      <span>
                        {this.state.leadData.convertedTotal.length +
                          this.state.memberData.newmembers.length -
                          this.state.memberData.cancellations.length}
                      </span>
                    )}
                </div>
              </div>
            </div>
            <div className="statItem">
              <div className="info">
                <div className="label">New Members</div>
                <div
                  className="value"
                  onClick={e =>
                    this.setState({
                      showNewLeads: false,
                      showScheduledLeads: false,
                      showIntroLeads: false,
                      showConvertedLeads: false,
                      showCancellationsMembers: false,
                      showPendingCancellationsMembers: false,
                      showFrozenMembers: false,
                      showPendingFrozenMembers: false,
                      showOverdueMembers: false,
                      showNewMembers: true,
                      showRententionRates: false,
                    })
                  }
                >
                  {this.state.memberData.newmembers.length +
                    this.state.leadData.convertedTotal.length}
                </div>
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
                    <CrossIcon className="icon icon-svg" />
                  </span>
                  <ReactTable
                    columns={this.getMemberTableColumns()}
                    data={this.getMemberTableData(
                      this.state.memberData.newmembers.concat(
                        this.state.leadData.convertedTotal,
                      ),
                    )}
                    defaultPageSize={1}
                    showPagination={false}
                  />
                </div>
              )}
            </div>
            {
              <div className="statItem">
                <div className="info percentage">
                  <div className="label">Retention Rate</div>
                  <div
                    className="value"
                    onClick={e => {
                      if (!this.state.retentionLoaded) {
                        this.setState({
                          retentionLoaded: false,
                          retentionLoading: true,
                        });

                        setTimeout(function() {
                          compThis.loadRententionRate();
                        }, 100);
                      } else {
                        this.setState({
                          showNewLeads: false,
                          showScheduledLeads: false,
                          showIntroLeads: false,
                          showConvertedLeads: false,
                          showCancellationsMembers: false,
                          showPendingCancellationsMembers: false,
                          showFrozenMembers: false,
                          showPendingFrozenMembers: false,
                          showOverdueMembers: false,
                          showNewMembers: false,
                          showRententionRates: true,
                        });
                      }
                    }}
                  >
                    {this.props.monthlyStatisticsLoading ||
                    this.state.retentionLoading ? (
                      <span className="rentention">Loading...</span>
                    ) : !this.state.retentionLoaded ? (
                      <span className="rentention">Load Now</span>
                    ) : (
                      <span className="rentention">
                        {this.state.retentionRate.toLocaleString(undefined, {
                          style: 'percent',
                          minimumFractionDigits: 2,
                        })}
                      </span>
                    )}
                  </div>
                </div>
                {this.state.showRententionRates && (
                  <div className="members retentionRates">
                    <span
                      className="closeMembers"
                      onClick={e =>
                        this.setState({
                          showRententionRates: false,
                        })
                      }
                    >
                      <CrossIcon className="icon icon-svg" />
                    </span>
                    <div className="retentionRates">
                      <HelpIcon
                        className="icon help icon-svg"
                        onClick={e => {
                          $('.retentionRateHelp').toggle('');
                        }}
                      />
                      <span className="retentionRateHelp">
                        <table>
                          <tbody>
                            <tr className="header">
                              <td colSpan="2">Student Retention Calculator</td>
                            </tr>
                            <tr>
                              <td className="col1">What is Rentention Rate?</td>
                              <td className="col2">
                                Student retention rate designates the percentage
                                of students a school has retained over a given
                                time period.
                              </td>
                            </tr>
                            <tr>
                              <td className="col1">Why is it important?</td>
                              <td className="col2">
                                A high retention rate is good and means that
                                you're keeping most of your students happy and
                                contributing to the mission of Gracie Barra.
                                Customer retention is the lifeblood of any
                                organization. It's no secret that it's cheaper
                                to keep an existing student than it is to get a
                                new one. Focus on keeping your retention rate as
                                high as possible.
                              </td>
                            </tr>
                            <tr>
                              <td className="col1">
                                Student Retention Rate Formula
                              </td>
                              <td className="col2">
                                Student Retention Rate = (Students at end of
                                time period - New Students acquired during time
                                period) / Students at start of time period
                              </td>
                            </tr>
                            <tr>
                              <td className="col1">Number of students</td>
                              <td className="col2">
                                The number of students are any student that
                                during the period has a status of Active or
                                Frozen(Identified as blue).
                              </td>
                            </tr>
                            {/*  <tr>
                          <td className="col1">Retention Rate vs. Cancellation Rate</td>
                          <td className="col2">While related, Student Cancellation Rate is the exact opposite of Retention Rate and is the percentage of Students who cancelled or did not renew during a given time period.</td>
                        </tr>
                        <tr>
                          <td className="col1">Cancellation Rate Formula</td>
                          <td className="col2">Student Cancellation Rate = Cancelled Students during Month / Students at Start of Month</td>
                        </tr> */}
                          </tbody>
                        </table>
                      </span>
                      <table>
                        <tbody>
                          <tr>
                            <th className="left">Month</th>
                            <th># students first day of month</th>
                            <th># students last day of month</th>
                            <th># of students added during the month</th>
                            <th>Monthly Rentention</th>
                          </tr>
                          {this.state.twelveMonthRetentionRate.values.map(
                            (monthStat, index) => (
                              <tr key={index}>
                                <td className="left">{monthStat.month}</td>
                                <td>
                                  {monthStat.beginOfMonth}
                                  <span className="frozenCount">
                                    ({monthStat.beginOfMonthFrozen})
                                  </span>
                                </td>
                                <td>
                                  {monthStat.endOfMonth}
                                  <span className="frozenCount">
                                    ({monthStat.endOfMonthFrozen})
                                  </span>
                                </td>
                                <td>{monthStat.newMembers}</td>
                                <td className="right">
                                  {monthStat.rententionRate}
                                </td>
                              </tr>
                            ),
                          )}
                          <tr className="footer">
                            <td className="left" colSpan="4">
                              Monthly Average
                            </td>
                            <td className="right">
                              {
                                this.state.twelveMonthRetentionRate
                                  .retentionTotal
                              }
                            </td>
                          </tr>
                          <tr className="footer">
                            <td className="left" colSpan="3">
                              {
                                this.state.twelveMonthRetentionRate
                                  .retentionTotalMonths
                              }
                              -month retention
                            </td>
                            <td>
                              {
                                this.state.twelveMonthRetentionRate
                                  .newMembersTotal
                              }
                            </td>
                            <td className="right">
                              {
                                this.state.twelveMonthRetentionRate
                                  .twelveMonthAverage
                              }
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            }
            {getAttributeValue(this.props.space, 'Billing Company') ===
              'PaySmart' && (
              <div className="statItem">
                <div className="info">
                  <div className="label">Overdues</div>
                  <div
                    className="value"
                    onClick={e =>
                      this.setState({
                        showNewLeads: false,
                        showScheduledLeads: false,
                        showIntroLeads: false,
                        showConvertedLeads: false,
                        showCancellationsMembers: false,
                        showPendingCancellationsMembers: false,
                        showFrozenMembers: false,
                        showPendingFrozenMembers: false,
                        showOverdueMembers: true,
                        showNewMembers: false,
                        showRententionRates: false,
                      })
                    }
                  >
                    {this.state.memberData.overdues !== undefined && (
                      <span>{this.state.memberData.overdues.length}</span>
                    )}
                  </div>
                </div>
                {this.state.showOverdueMembers && (
                  <div className="members">
                    <span
                      className="closeMembers"
                      onClick={e =>
                        this.setState({
                          showOverdueMembers: false,
                        })
                      }
                    >
                      <CrossIcon className="icon icon-svg" />
                    </span>
                    <ReactTable
                      columns={this.getMemberTableColumns()}
                      data={this.getOverdueMemberTableData(
                        this.state.memberData.overdues,
                      )}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </span>
    );
  }
}

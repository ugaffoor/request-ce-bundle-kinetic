import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import $ from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { Utils } from 'common';
import { BamboraOverdues } from './BamboraOverdues';
import { PaysmartOverdues } from './PaysmartOverdues';
import { StripeOverdues } from './StripeOverdues';
import { ActiveOrphans } from './ActiveOrphans';
import { DemographicChart } from './Demographic';
import { ProgramsChart } from './Programs';
import { Statistics } from './Statistics';
import { LeadsOriginChart } from './LeadsOrigin';
import { AttendancePerDay } from './AttendancePerDay';
import { Finances } from './Finances';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as monthlyStatisticsActions } from '../../redux/modules/monthlyStatistics';
import { actions as classActions } from '../../redux/modules/classes';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { getTimezone } from '../leads/LeadsUtils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  membersLoading: state.member.members.membersLoading,
  allMembers: state.member.members.allMembers,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
  billingPayments: state.member.members.billingPayments,
  billingPaymentsLoading: state.member.members.billingPaymentsLoading,
  billingCompany: state.member.app.billingCompany,
  programs: state.member.app.programs,
  profile: state.member.app.profile,
  space: state.member.app.space,
  leadsByDate: state.member.leads.leadsByDate,
  leadsByDateLoading: state.member.leads.leadsByDateLoading,
  fetchingAttendancesByDate: state.member.attendance.fetchingAttendancesByDate,
  attendancesByDate: state.member.attendance.attendancesByDate,
  classSchedules: state.member.classes.classSchedules,
  fetchingClassSchedules: state.member.classes.fetchingClassSchedules,
  monthlyStatistics: state.member.monthlyStatistics.monthlyStatistics,
  monthlyStatisticsLoading:
    state.member.monthlyStatistics.monthlyStatisticsLoading,
  FAILEDpaymentHistory: state.member.members.FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading: state.member.members.FAILEDpaymentHistoryLoading,
  SUCCESSFULpaymentHistory: state.member.members.SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading:
    state.member.members.SUCCESSFULpaymentHistoryLoading,
  overdues: state.member.members.overdues,
  overduesLoading: state.member.members.overduesLoading,
  cashPaymentsByDate: state.member.members.cashPaymentsByDate,
  cashPaymentsByDateLoading: state.member.members.cashPaymentsByDateLoading,
});

const mapDispatchToProps = {
  fetchMembers: actions.fetchMembers,
  fetchBillingPayments: actions.fetchBillingPayments,
  fetchLeadsByDate: leadsActions.fetchLeadsByDate,
  fetchAttendancesByDate: attendanceActions.fetchAttendancesByDate,
  fetchClassSchedules: classActions.fetchClassSchedules,
  setBillingPayments: actions.setBillingPayments,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchMonthlyStatistics: monthlyStatisticsActions.fetchMonthlyStatistics,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchOverdues: actions.fetchOverdues,
  setOverdues: actions.setOverdues,
  fetchCashPaymentsByDate: actions.fetchCashPaymentsByDate,
};

export const HomeView = ({
  memberItem,
  allMembers,
  membersLoading,
  billingPayments,
  getBillingPayments,
  billingPaymentsLoading,
  billingCompany,
  programs,
  profile,
  leadsByDate,
  fetchLeadsByDate,
  leadsByDateLoading,
  attendancesByDate,
  fetchAttendancesByDate,
  fetchingAttendancesByDate,
  fetchClassSchedules,
  classSchedules,
  fetchingClassSchedules,
  monthlyStatistics,
  fetchMonthlyStatistics,
  monthlyStatisticsLoading,
  datesChanged,
  setFromDate,
  setToDate,
  fromDate,
  toDate,
  setIsAssigning,
  space,
  currency,
  locale,
  getFailedPayments,
  FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading,
  getSuccessfulPayments,
  SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading,
  getOverdues,
  fetchOverdues,
  setOverdues,
  overdues,
  overduesLoading,
  fetchCashPaymentsByDate,
  cashPaymentsByDate,
  cashPaymentsByDateLoading,
  memberInitialLoadComplete,
  membersNextPageToken,
  memberLastFetchTime,
  fetchMembers,
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    {getAttributeValue(space, 'Franchisor') !== 'YES' && (
      <Statistics
        setIsAssigning={setIsAssigning}
        setFromDate={setFromDate}
        setToDate={setToDate}
        fromDate={fromDate}
        toDate={toDate}
        datesChanged={datesChanged}
        leadsByDate={leadsByDate}
        fetchLeadsByDate={fetchLeadsByDate}
        leadsByDateLoading={leadsByDateLoading}
        allMembers={allMembers}
        membersLoading={membersLoading}
        profile={profile}
        space={space}
        currency={currency}
        locale={locale}
        getOverdues={getOverdues}
        overdues={overdues}
        overduesLoading={overduesLoading}
        monthlyStatistics={monthlyStatistics}
        monthlyStatisticsLoading={monthlyStatisticsLoading}
        memberInitialLoadComplete={memberInitialLoadComplete}
        membersNextPageToken={membersNextPageToken}
        memberLastFetchTime={memberLastFetchTime}
        fetchMembers={fetchMembers}
      />
    )}
    {getAttributeValue(space, 'Franchisor') !== 'YES' &&
      getAttributeValue(space, 'Billing Company') === 'Bambora' &&
      (profile.username === 'unus@uniqconsulting.com.au' ||
        profile.username === 'software@graciebarra.com') && (
        <div className="activaeorphans">
          {memberInitialLoadComplete && (
            <div>
              <ActiveOrphans
                allMembers={allMembers}
                successfulPaymentHistory={SUCCESSFULpaymentHistory}
                SUCCESSFULpaymentHistoryLoading={
                  SUCCESSFULpaymentHistoryLoading
                }
                currency={currency}
                space={space}
                locale={locale}
                profile={profile}
              />
            </div>
          )}
        </div>
      )}
    {getAttributeValue(space, 'Franchisor') !== 'YES' &&
      getAttributeValue(space, 'Billing Company') === 'Bambora' &&
      Utils.isMemberOf(profile, 'Role::Program Managers') && (
        <div className="homeOverdues">
          {memberInitialLoadComplete && (
            <div>
              <BamboraOverdues
                allMembers={allMembers}
                getFailedPayments={getFailedPayments}
                paymentHistory={FAILEDpaymentHistory}
                FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                getSuccessfulPayments={getSuccessfulPayments}
                successfulPaymentHistory={SUCCESSFULpaymentHistory}
                SUCCESSFULpaymentHistoryLoading={
                  SUCCESSFULpaymentHistoryLoading
                }
                fetchCashPaymentsByDate={fetchCashPaymentsByDate}
                cashPaymentsByDate={cashPaymentsByDate}
                cashPaymentsByDateLoading={cashPaymentsByDateLoading}
                currency={currency}
                space={space}
                locale={locale}
                profile={profile}
              />
            </div>
          )}
        </div>
      )}
    {getAttributeValue(space, 'Billing Company') === 'Stripe' &&
      Utils.isMemberOf(profile, 'Role::Program Managers') && (
        <div className="homeOverdues">
          {memberInitialLoadComplete && (
            <div>
              <StripeOverdues
                allMembers={allMembers}
                membersLoading={membersLoading}
                getFailedPayments={getFailedPayments}
                paymentHistory={FAILEDpaymentHistory}
                FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                getSuccessfulPayments={getSuccessfulPayments}
                successfulPaymentHistory={SUCCESSFULpaymentHistory}
                SUCCESSFULpaymentHistoryLoading={
                  SUCCESSFULpaymentHistoryLoading
                }
                space={space}
                locale={locale}
                profile={profile}
              />
            </div>
          )}
        </div>
      )}
    {getAttributeValue(space, 'Franchisor') !== 'YES' && (
      <div className="charts">
        <div className="chart2Column">
          <div className="col1 chart5">
            <ProgramsChart allMembers={allMembers} programs={programs} />
          </div>
          <div className="col2 chart7">
            <AttendancePerDay
              fromDate={fromDate}
              toDate={toDate}
              attendancesByDate={attendancesByDate}
              fetchAttendancesByDate={fetchAttendancesByDate}
              fetchingAttendancesByDate={fetchingAttendancesByDate}
              fetchClassSchedules={fetchClassSchedules}
              classSchedules={classSchedules}
              fetchingClassSchedules={fetchingClassSchedules}
              allMembers={allMembers}
              space={space}
              locale={locale}
              profile={profile}
            />
          </div>
        </div>
        <div className="chart2Column">
          <div className="col1 chart4">
            <DemographicChart allMembers={allMembers} space={space} />
          </div>
          <div className="col2 chart6">
            <LeadsOriginChart
              fromDate={fromDate}
              toDate={toDate}
              leadsByDate={leadsByDate}
              fetchLeadsByDate={fetchLeadsByDate}
              leadsByDateLoading={leadsByDateLoading}
              space={space}
              locale={locale}
              profile={profile}
            />
            {/*      <KidsChart allMembers={allMembers} /> */}
          </div>
        </div>
        {!Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div className="chart1Column">
            <div className="col">
              <Finances
                monthlyStatistics={monthlyStatistics}
                fetchMonthlyStatistics={fetchMonthlyStatistics}
                monthlyStatisticsLoading={monthlyStatisticsLoading}
                currency={currency}
                locale={locale}
              />
            </div>
          </div>
        )}
      </div>
    )}
    {getAttributeValue(space, 'Franchisor') === 'YES' &&
      Utils.isMemberOf(profile, 'Billing') && (
        <div className="charts">
          <div className="chart1Column">
            <div className="col">
              <Finances
                monthlyStatistics={monthlyStatistics}
                fetchMonthlyStatistics={fetchMonthlyStatistics}
                monthlyStatisticsLoading={monthlyStatisticsLoading}
                currency={currency}
                locale={locale}
              />
            </div>
          </div>
        </div>
      )}
  </div>
);

export const HomeContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ memberItem, space, profile }) => {
    let currency = getAttributeValue(space, 'Currency');
    if (currency === undefined) currency = 'USD';

    let locale =
      profile.preferredLocale === null
        ? space.defaultLocale
        : profile.preferredLocale;

    return {
      currency: currency,
      locale: locale,
    };
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withState('fromDate', 'setFromDate', moment().subtract(6, 'days')),
  withState('toDate', 'setToDate', moment()),
  withHandlers({
    getOverdues: ({
      fetchOverdues,
      setOverdues,
      addNotification,
      setSystemError,
      space,
      profile,
    }) => () => {
      fetchOverdues({
        setOverdues: setOverdues,
        addNotification: addNotification,
        setSystemError: setSystemError,
        timezone: getTimezone(profile.timezone, space.defaultTimezone),
      });
    },
    getFailedPayments: ({
      fetchPaymentHistory,
      setPaymentHistory,
      addNotification,
      setSystemError,
      space,
      profile,
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'FAILED',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(6, 'month')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_failed',
        addNotification: addNotification,
        setSystemError: setSystemError,
        timezone: getTimezone(profile.timezone, space.defaultTimezone),
        useSubAccount:
          getAttributeValue(space, 'PaySmart SubAccount') === 'YES'
            ? true
            : false,
      });
    },
    getSuccessfulPayments: ({
      fetchPaymentHistory,
      setPaymentHistory,
      addNotification,
      setSystemError,
      space,
      profile,
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(3, 'month')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_successful',
        addNotification: addNotification,
        setSystemError: setSystemError,
        timezone: getTimezone(profile.timezone, space.defaultTimezone),
        useSubAccount:
          getAttributeValue(space, 'PaySmart SubAccount') === 'YES'
            ? true
            : false,
      });
    },
    getBillingPayments: ({
      memberItem,
      fetchBillingPayments,
      setBillingPayments,
      addNotification,
      setSystemError,
    }) => month => {
      let startDate, endDate;
      if (month === 'current_month') {
        startDate = moment
          .utc()
          .startOf('month')
          .format('YYYY-MM-DD');
        endDate = moment.utc().format('YYYY-MM-DD');
      } else if (month === 'previous_month') {
        startDate = moment
          .utc()
          .subtract(2, 'months')
          .startOf('month')
          .format('YYYY-MM-DD');
        endDate = moment
          .utc()
          .subtract(2, 'months')
          .endOf('month')
          .format('YYYY-MM-DD');
      }
      /*      fetchBillingPayments({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: startDate,
        dateTo: endDate,
        setBillingPayments: setBillingPayments,
        internalPaymentType: 'client_successful',
        addNotification: addNotification,
        setSystemError: setSystemError,
      });*/
    },
    datesChanged: () => (setFromDate, setToDate, fromDate, toDate) => {
      console.log('datesChanged');
      setFromDate(fromDate);
      setToDate(toDate);
    },
  }),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      if (
        Utils.isMemberOf(this.props.profile, 'Billing') &&
        getAttributeValue(this.props.space, 'Billing Company') !== 'No Billing'
      ) {
        if (
          !this.props.billingPayments ||
          this.props.billingPayments.length <= 0
        ) {
          this.props.getBillingPayments('current_month');
        }
      }
      //      this.props.fetchLeadsByDate();

      if (this.props.monthlyStatistics.length === 0) {
        this.props.fetchMonthlyStatistics();
      }
    },
    UNSAFE_componentWillUnmount() {},
  }),
)(HomeView);

function renderText(child, x, y, rotate, stroke, key) {
  if (child && child.content) {
    return (
      <text
        key={key}
        x={x}
        y={y}
        transform={`rotate(${rotate})`}
        textAnchor="middle"
        stroke={stroke}
        {...child.props}
      >
        {child.content}
      </text>
    );
  }

  return (
    <text
      key={key}
      x={x}
      y={y}
      transform={`rotate(${rotate})`}
      textAnchor="middle"
      stroke={stroke}
    >
      {child}
    </text>
  );
}

export default function AxisLabel({
  axisType,
  x,
  y,
  width,
  height,
  stroke,
  children,
}) {
  const isVert = axisType === 'yAxis';
  const cx = isVert ? x : x + width / 2;
  const cy = isVert ? height / 2 + y : y + height + 20;
  const rot = isVert ? `270 ${cx} ${cy}` : 0;
  const lineHeight = 20;

  if (children.length > 1 && children.map) {
    return (
      <g>
        {children.map((child, index) =>
          renderText(child, cx, cy + index * lineHeight, rot, stroke, index),
        )}
      </g>
    );
  }

  return renderText(children, cx, cy, rot, stroke);
}

AxisLabel.propTypes = {
  axisType: PropTypes.oneOf(['yAxis', 'xAxis']),
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  stroke: PropTypes.string,
  children: PropTypes.any,
};

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
import $ from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { Utils } from 'common';
import { ScheduledPaymentsBillingChart } from './ScheduledPaymentsBilling';
import { ProcessedPaymentsBillingChart } from './ProcessedPaymentsBilling';
import { DemographicChart } from './Demographic';
import { ProgramsChart } from './Programs';
import { Statistics } from './Statistics';
import { KidsChart } from './Kids';
import { LeadsOriginChart } from './LeadsOrigin';
import { AttendancePerDay } from './AttendancePerDay';
import { Finances } from './Finances';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as monthlyStatisticsActions } from '../../redux/modules/monthlyStatistics';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  billingPayments: state.member.members.billingPayments,
  billingPaymentsLoading: state.member.members.billingPaymentsLoading,
  processedAndScheduledPayments:
    state.member.members.processedAndScheduledPayments,
  processedAndScheduledPaymentsLoading:
    state.member.members.processedAndScheduledPaymentsLoading,
  billingCompany: state.member.app.billingCompany,
  programs: state.member.app.programs,
  profile: state.member.app.profile,
  leadsByDate: state.member.leads.leadsByDate,
  leadsLoading: state.member.leads.leadsLoading,
  leadsByDateLoading: state.member.leads.leadsByDateLoading,
  fetchingAttendancesByDate: state.member.attendance.fetchingAttendancesByDate,
  attendancesByDate: state.member.attendance.attendancesByDate,
  monthlyStatistics: state.member.monthlyStatistics.monthlyStatistics,
  monthlyStatisticsLoading:
    state.member.monthlyStatistics.monthlyStatisticsLoading,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
  fetchBillingPayments: actions.fetchBillingPayments,
  fetchLeadsByDate: leadsActions.fetchLeadsByDate,
  fetchAttendancesByDate: attendanceActions.fetchAttendancesByDate,
  setBillingPayments: actions.setBillingPayments,
  fetchProcessedAndScheduledPayments:
    actions.fetchProcessedAndScheduledPayments,
  setProcessedAndScheduledPayments: actions.setProcessedAndScheduledPayments,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchMonthlyStatistics: monthlyStatisticsActions.fetchMonthlyStatistics,
};

export const HomeView = ({
  memberItem,
  allMembers,
  billingPayments,
  getBillingPayments,
  billingPaymentsLoading,
  getProcessedAndScheduledPayments,
  processedAndScheduledPayments,
  processedAndScheduledPaymentsLoading,
  reloadCharts,
  billingCompany,
  programs,
  profile,
  leadsByDate,
  fetchLeadsByDate,
  leadsByDateLoading,
  attendancesByDate,
  fetchAttendancesByDate,
  fetchingAttendancesByDate,
  monthlyStatistics,
  fetchMonthlyStatistics,
  fetchingMonthlyStatistics,
  datesChanged,
  setFromDate,
  setToDate,
  fromDate,
  toDate,
  setIsAssigning,
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    {/*    <div className="buttons row" style={{ marginLeft: '10px' }}>
      <div className="col-xs-3">
        <button
          type="button"
          id="reloadCharts"
          className={'btn btn-primary'}
          style={{ borderRadius: '0', marginRight: '5px' }}
          onClick={e =>
            reloadCharts(
              profile,
              getBillingPayments,
              getProcessedAndScheduledPayments,
            )
          }
        >
          Reload Dashboard
        </button>
      </div>
    </div>
*/}
    {/*
    <div className="chart1">
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <ProcessedPaymentsBillingChart
          billingPayments={billingPayments}
          getBillingPayments={getBillingPayments}
          billingPaymentsLoading={billingPaymentsLoading}
        />
      )}
    </div>
    */}
    {/*billingCompany !== 'PaySmart' &&
      (!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <div className="chart2">
          <ScheduledPaymentsBillingChart
            processedAndScheduledPayments={processedAndScheduledPayments}
            getProcessedAndScheduledPayments={getProcessedAndScheduledPayments}
            processedAndScheduledPaymentsLoading={
              processedAndScheduledPaymentsLoading
            }
          />
        </div>
      ))*/}
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
    />
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
          />
        </div>
      </div>
      <div className="chart2Column">
        <div className="col1 chart4">
          <DemographicChart allMembers={allMembers} />
        </div>
        <div className="col2 chart6">
          <LeadsOriginChart
            fromDate={fromDate}
            toDate={toDate}
            leadsByDate={leadsByDate}
            fetchLeadsByDate={fetchLeadsByDate}
            leadsByDateLoading={leadsByDateLoading}
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
              fetchingMonthlyStatistics={fetchingMonthlyStatistics}
            />
          </div>
        </div>
      )}
    </div>
  </div>
);

export const HomeContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withState('fromDate', 'setFromDate', moment().subtract(7, 'days')),
  withState('toDate', 'setToDate', moment()),
  withHandlers({
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
      fetchBillingPayments({
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
      });
    },
    getProcessedAndScheduledPayments: ({
      fetchProcessedAndScheduledPayments,
      setProcessedAndScheduledPayments,
      billingCompany,
      addNotification,
      setSystemError,
    }) => () => {
      if (billingCompany === 'PaySmart') {
        return;
      }
      let startDate = moment
        .utc()
        .startOf('month')
        .format('YYYY-MM-DD');
      let endDate = moment
        .utc()
        .endOf('month')
        .format('YYYY-MM-DD');

      fetchProcessedAndScheduledPayments({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: startDate,
        dateTo: endDate,
        setProcessedAndScheduledPayments: setProcessedAndScheduledPayments,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    datesChanged: () => (setFromDate, setToDate, fromDate, toDate) => {
      console.log('datesChanged');
      setFromDate(fromDate);
      setToDate(toDate);
    },
    reloadCharts: () => (
      profile,
      getBillingPayments,
      getProcessedAndScheduledPayments,
    ) => {
      if (Utils.isMemberOf(profile, 'Billing')) {
        getBillingPayments('current_month');
        getProcessedAndScheduledPayments();
      }
      {
        console.log('Not a billing user');
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      if (Utils.isMemberOf(this.props.profile, 'Billing')) {
        if (
          !this.props.billingPayments ||
          this.props.billingPayments.length <= 0
        ) {
          this.props.getBillingPayments('current_month');
        }
        if (
          !this.props.processedAndScheduledPayments ||
          $.isEmptyObject(this.props.processedAndScheduledPayments)
        ) {
          this.props.getProcessedAndScheduledPayments();
        }
      }
      this.props.fetchLeadsByDate();
    },
    componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
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

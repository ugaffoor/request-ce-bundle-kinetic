import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, lifecycle, withHandlers } from 'recompose';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as reportingActions } from '../../redux/modules/reporting';
import { actions as leadsActions } from '../../redux/modules/leads';
import 'react-tabulator/lib/styles.css'; // default theme
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css'; // use Theme(s)
import { actions as appActions } from '../../redux/modules/memberApp';
import { MemberActivityReport } from './MemberActivity';
import { MemberFinancialStats } from './MemberFinancialStats';
import { LeadsActivityReport } from './LeadActivity';
import { PDDailyReport } from './PDDaily';
import { InactiveCustomersChart } from './PaysmartInactiveCustomers';
import { VariationCustomers } from './PaysmartVariations';
import { MemberBirthdays } from './MemberBirthdays';
import { MemberLastAttendance } from './MemberLastAttendance';
import { PaysmartMemberDescrepencies } from './PaysmartMemberDescrepencies';
import { InactiveMembersNoHistory } from './InactiveMembersNoHistory';
import { FailedPayments } from './PaysmartFailedPayments';
import { PaysmartOverdues } from './PaysmartOverdues';
import { actions } from '../../redux/modules/members';
import moment from 'moment';
import { Utils } from 'common';
import { CoreForm } from 'react-kinetic-core';

const mapStateToProps = state => ({
  reports: state.member.reporting.activityReport,
  activityReportLoading: state.member.reporting.activityReportLoading,
  members: state.member.members.allMembers,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  leadsByDate: state.member.leads.leadsByDate,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  leadsByDateLoading: state.member.leads.leadsByDateLoading,
  reportPreferences: state.member.app.reportPreferences,
  memberStatusValues: state.member.app.memberStatusValues,
  leadStatusValues: state.member.app.leadStatusValues,
  leadSourceValues: state.member.app.leadSourceValues,
  triggers: state.member.app.triggers,
  programs: state.member.app.programs,
  additionalPrograms: state.member.app.additionalPrograms,
  belts: state.member.app.belts,
  membershipTypes: state.member.app.membershipTypes,
  inactiveCustomersCount: state.member.members.inactiveCustomersCount,
  inactiveCustomersLoading: state.member.members.inactiveCustomersLoading,
  variationCustomers: state.member.members.variationCustomers,
  variationCustomersLoading: state.member.members.variationCustomersLoading,
  customerRefunds: state.member.members.customerRefunds,
  customerRefundsLoading: state.member.members.customerRefundsLoading,
  paymentHistory: state.member.members.paymentHistory,
  paymentHistoryLoading: state.member.members.paymentHistoryLoading,
  overdues: state.member.members.overdues,
  overduesLoading: state.member.members.overduesLoading,
  space: state.member.app.space,
  billingCustomersLoading: state.member.members.billingCustomersLoading,
  billingCustomers: state.member.members.billingCustomers,
});

const mapDispatchToProps = {
  fetchReport: reportingActions.fetchActivityReport,
  setReport: reportingActions.setActivityReport,
  fetchLeads: leadsActions.fetchLeads,
  fetchLeadsByDate: leadsActions.fetchLeadsByDate,
  updateReportPreferences: appActions.updateReportPreferences,
  fetchInactiveCustomersCount: actions.fetchInactiveCustomersCount,
  setInactiveCustomersCount: actions.setInactiveCustomersCount,
  fetchVariationCustomers: actions.fetchVariationCustomers,
  setVariationCustomers: actions.setVariationCustomers,
  fetchCustomerRefunds: actions.fetchCustomerRefunds,
  setCustomerRefunds: actions.setCustomerRefunds,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchOverdues: actions.fetchOverdues,
  setOverdues: actions.setOverdues,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
};

export const ReportsView = ({
  reports,
  activityReportLoading,
  members,
  leads,
  leadsByDate,
  profile,
  membersLoading,
  fetchLeads,
  fetchLeadsByDate,
  leadsLoading,
  leadsByDateLoading,
  showMemberActivityReport,
  setShowMemberActivityReport,
  showMemberFinancialStats,
  setShowMemberFinancialStats,
  showBirthdaysReport,
  setBirthdaysReport,
  showLastAttendance,
  setShowLastAttendance,
  showLeadActivityReport,
  setShowLeadActivityReport,
  showPDDailyReport,
  setShowPDDailyReport,
  updatePreferences,
  showInactiveChart,
  setShowInactiveChart,
  setShowInactiveMembers,
  showInactiveMembers,
  reportPreferences,
  memberStatusValues,
  leadStatusValues,
  leadSourceValues,
  programs,
  additionalPrograms,
  belts,
  membershipTypes,
  inactiveCustomersCount,
  getInactiveCustomersCount,
  inactiveCustomersLoading,
  variationCustomers,
  variationCustomersLoading,
  getVariationCustomers,
  customerRefunds,
  customerRefundsLoading,
  getCustomerRefunds,
  showVariationsReport,
  setShowVariationsReport,
  showDescrepenciesReport,
  setShowDescrepenciesReport,
  paymentHistory,
  paymentHistoryLoading,
  overdues,
  overduesLoading,
  showFailedPaymentsReport,
  setShowFailedPaymentsReport,
  getFailedPayments,
  showOverduesReport,
  setShowOverduesReport,
  getOverdues,
  fetchPaymentHistory,
  setPaymentHistory,
  fetchOverdues,
  setOverdues,
  space,
  billingCustomersLoading,
  billingCustomers,
  fetchBillingCustomers,
  setBillingCustomers,
  fetchVariationCustomers,
  setVariationCustomers,
  fetchCustomerRefunds,
  setCustomerRefunds,
  triggers,
}) => (
  <div className="reports">
    <StatusMessagesContainer />

    <div style={{ margin: '10px' }}>
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e =>
            setShowMemberActivityReport(showMemberActivityReport ? false : true)
          }
        >
          {showMemberActivityReport
            ? 'Hide Member Activity Report'
            : 'Show Member Activity Report'}
        </button>
      </div>
      {!showMemberActivityReport ? null : (
        <div className="row">
          <MemberActivityReport
            reports={reports}
            members={members}
            reportPreferences={reportPreferences}
            updatePreferences={updatePreferences}
            memberStatusValues={memberStatusValues}
            programs={programs}
            additionalPrograms={additionalPrograms}
            belts={belts}
            membershipTypes={membershipTypes}
            space={space}
            triggers={triggers}
            profile={profile}
          />
        </div>
      )}
    </div>
    <div style={{ margin: '20px 0px 0px 10px' }} id="birthdays-report">
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => {
            setBirthdaysReport(showBirthdaysReport ? false : true);
          }}
        >
          {showBirthdaysReport ? 'Hide Birthdays Due' : 'Show Birthdays Due'}
        </button>
      </div>
      {!showBirthdaysReport ? null : (
        <div className="row">
          <div className="birthdaysReport">
            <MemberBirthdays allMembers={members} />
          </div>
        </div>
      )}
    </div>
    <div style={{ margin: '20px 0px 0px 10px' }} id="attendance-report">
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => {
            setShowLastAttendance(showLastAttendance ? false : true);
          }}
        >
          {showLastAttendance ? 'Hide Last Attendance' : 'Show Last Attendance'}
        </button>
      </div>
      {!showLastAttendance ? null : (
        <div className="row">
          <div className="attendanceReport">
            <MemberLastAttendance allMembers={members} />
          </div>
        </div>
      )}
    </div>
    {!Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '10px' }}>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e =>
              setShowMemberFinancialStats(
                showMemberFinancialStats ? false : true,
              )
            }
          >
            {showMemberFinancialStats
              ? 'Hide Member Financial Statistics'
              : 'Show Member Financial Statistics'}
          </button>
        </div>
        {!showMemberFinancialStats ? null : (
          <div className="row">
            <MemberFinancialStats
              members={members}
              billingCustomersLoading={billingCustomersLoading}
              billingCustomers={billingCustomers}
              fetchBillingCustomers={fetchBillingCustomers}
              setBillingCustomers={setBillingCustomers}
              variationCustomers={variationCustomers}
              variationCustomersLoading={variationCustomersLoading}
              fetchVariationCustomers={fetchVariationCustomers}
              setVariationCustomers={setVariationCustomers}
              customerRefunds={customerRefunds}
              customerRefundsLoading={customerRefundsLoading}
              fetchCustomerRefunds={fetchCustomerRefunds}
              setCustomerRefunds={setCustomerRefunds}
              fetchPaymentHistory={fetchPaymentHistory}
              setPaymentHistory={setPaymentHistory}
              paymentHistory={paymentHistory}
              paymentHistoryLoading={paymentHistoryLoading}
              space={space}
              profile={profile}
            />
          </div>
        )}
      </div>
    )}
    {profile.username !== 'unus@uniqconsulting.com.au' ? (
      <div />
    ) : (
      <div style={{ margin: '10px' }}>
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e =>
              setShowInactiveMembers(showInactiveMembers ? false : true)
            }
          >
            {showInactiveMembers
              ? 'Hide Inactive Member with No History'
              : 'Show Inactive Member with No History'}
          </button>
        </div>
        {!showInactiveMembers ? null : (
          <div className="row">
            <InactiveMembersNoHistory members={members} space={space} />
          </div>
        )}
      </div>
    )}
    <div style={{ margin: '20px 0px 0px 10px' }} id="leads-report">
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => {
            setShowLeadActivityReport(showLeadActivityReport ? false : true);
            document.getElementById('leads-report').scrollIntoView();
          }}
        >
          {showLeadActivityReport
            ? 'Hide Leads Activity Report'
            : 'Show Leads Activity Report'}
        </button>
      </div>
      {!showLeadActivityReport ? null : (
        <div className="row">
          <LeadsActivityReport
            fetchLeads={fetchLeads}
            leads={leads}
            leadsLoading={leadsLoading}
            reportPreferences={reportPreferences}
            updatePreferences={updatePreferences}
            leadStatusValues={leadStatusValues}
            leadSourceValues={leadSourceValues}
            triggers={triggers}
            profile={profile}
            space={space}
          />
        </div>
      )}
    </div>
    <div style={{ margin: '20px 0px 0px 10px' }} id="pddaily-report">
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => {
            setShowPDDailyReport(showPDDailyReport ? false : true);
            document.getElementById('pddaily-report').scrollIntoView();
          }}
        >
          {showLeadActivityReport
            ? 'Hide PD Daily Report'
            : 'Show PD Daily Report'}
        </button>
      </div>
      {!showPDDailyReport ? null : (
        <div className="row">
          <PDDailyReport
            fetchLeadsByDate={fetchLeadsByDate}
            leadsByDate={leadsByDate}
            leadsByDateLoading={leadsByDateLoading}
            profile={profile}
            space={space}
          />
        </div>
      )}
    </div>
    {Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ||
    !Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '20px 0px 0px 10px' }} id="inactive-report">
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setShowInactiveChart(showInactiveChart ? false : true);
            }}
          >
            {showInactiveChart ? 'Hide Inactive Chart' : 'Show Inactive Chart'}
          </button>
        </div>
        {!showInactiveChart ? null : (
          <div className="row">
            <div className="inactiveChart">
              <InactiveCustomersChart
                inactiveCustomersCount={inactiveCustomersCount}
                getInactiveCustomersCount={getInactiveCustomersCount}
                inactiveCustomersLoading={inactiveCustomersLoading}
                profile={profile}
              />
            </div>
          </div>
        )}
      </div>
    )}
    {Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ||
    !Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '20px 0px 0px 10px' }} id="variations-report">
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setShowVariationsReport(showVariationsReport ? false : true);
              document.getElementById('variations-report').scrollIntoView();
            }}
          >
            {showVariationsReport
              ? 'Hide Variations Report'
              : 'Show Variations Report'}
          </button>
        </div>
        {!showVariationsReport ? null : (
          <div className="row">
            <div>
              <VariationCustomers
                members={members}
                getVariationCustomers={getVariationCustomers}
                variationCustomers={variationCustomers}
                variationCustomersLoading={variationCustomersLoading}
              />
            </div>
          </div>
        )}
      </div>
    )}
    {Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ||
    !Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '20px 0px 0px 10px' }} id="descrepencies-report">
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setShowDescrepenciesReport(
                showDescrepenciesReport ? false : true,
              );
              document.getElementById('descrepencies-report').scrollIntoView();
            }}
          >
            {showDescrepenciesReport
              ? 'Hide PaySmart Descrepencies Report'
              : 'Show PaySmart Descrepencies Report'}
          </button>
        </div>
        {!showDescrepenciesReport ? null : (
          <div className="row">
            <div>
              <PaysmartMemberDescrepencies
                members={members}
                billingCustomersLoading={billingCustomersLoading}
                billingCustomers={billingCustomers}
                fetchBillingCustomers={fetchBillingCustomers}
                setBillingCustomers={setBillingCustomers}
              />
            </div>
          </div>
        )}
      </div>
    )}
    {Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ||
    !Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '20px 0px 0px 10px' }} id="failed-report">
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setShowFailedPaymentsReport(
                showFailedPaymentsReport ? false : true,
              );
              document.getElementById('failed-report').scrollIntoView();
            }}
          >
            {showFailedPaymentsReport
              ? 'Hide Failed Payments Report'
              : 'Show Failed Payments Report'}
          </button>
        </div>
        {!showFailedPaymentsReport ? null : (
          <div className="row">
            <div>
              <FailedPayments
                getFailedPayments={getFailedPayments}
                paymentHistory={paymentHistory}
                paymentHistoryLoading={paymentHistoryLoading}
              />
            </div>
          </div>
        )}
      </div>
    )}
    {Utils.getAttributeValue(space, 'Billing Company') !== 'PaySmart' ||
    !Utils.isMemberOf(profile, 'Billing') ? (
      <div />
    ) : (
      <div style={{ margin: '20px 0px 0px 10px' }} id="failed-report">
        <div className="row">
          <button
            type="button"
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setShowOverduesReport(showOverduesReport ? false : true);
              document.getElementById('failed-report').scrollIntoView();
            }}
          >
            {showOverduesReport
              ? 'Hide Overdue Payments Report'
              : 'Show Overdue Payments Report'}
          </button>
        </div>
        {!showOverduesReport ? null : (
          <div className="row">
            <div>
              <PaysmartOverdues
                getOverdues={getOverdues}
                overdues={overdues}
                overduesLoading={overduesLoading}
              />
            </div>
          </div>
        )}
      </div>
    )}
    <CoreForm kapp="gbmembers" form="dummy-form" />
  </div>
);

export const ReportsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('showMemberActivityReport', 'setShowMemberActivityReport', false),
  withState('showBirthdaysReport', 'setBirthdaysReport', false),
  withState('showLastAttendance', 'setShowLastAttendance', false),
  withState('showMemberFinancialStats', 'setShowMemberFinancialStats', false),
  withState('showInactiveMembers', 'setShowInactiveMembers', false),
  withState('showLeadActivityReport', 'setShowLeadActivityReport', false),
  withState('showPDDailyReport', 'setShowPDDailyReport', false),
  withState('showInactiveChart', 'setShowInactiveChart', false),
  withState('showVariationsReport', 'setShowVariationsReport', false),
  withState('showDescrepenciesReport', 'setShowDescrepenciesReport', false),
  withState('showFailedPaymentsReport', 'setShowFailedPaymentsReport', false),
  withState('showOverduesReport', 'setShowOverduesReport', false),
  withHandlers({
    fetchLeads: ({ fetchLeads }) => () => {
      fetchLeads({});
    },
    updatePreferences: ({ updateReportPreferences }) => (key, value) => {
      updateReportPreferences({ key, reportPreferences: value });
    },
    getInactiveCustomersCount: ({
      fetchInactiveCustomersCount,
      setInactiveCustomersCount,
      addNotification,
      setSystemError,
    }) => (dateRange, fromDate, toDate) => {
      if (!dateRange) {
        dateRange = 'last_30_days';
      }

      if (dateRange === 'last_30_days') {
        fromDate = moment()
          .subtract(30, 'days')
          .format('DD-MM-YYYY');
        toDate = moment().format('DD-MM-YYYY');
      } else if (dateRange === 'last_month') {
        fromDate = moment()
          .subtract(1, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_3_months') {
        fromDate = moment()
          .subtract(3, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_6_months') {
        fromDate = moment()
          .subtract(6, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_year') {
        fromDate = moment()
          .subtract(1, 'years')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'custom') {
        fromDate = moment(fromDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
        toDate = moment(toDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
      }

      fetchInactiveCustomersCount({
        fromDate: fromDate,
        toDate: toDate,
        setInactiveCustomersCount: setInactiveCustomersCount,
        setSystemError: setSystemError,
        addNotification: addNotification,
      });
    },
    getVariationCustomers: ({
      fetchVariationCustomers,
      setVariationCustomers,
      addNotification,
      setSystemError,
    }) => () => {
      fetchVariationCustomers({
        setVariationCustomers: setVariationCustomers,
        setSystemError: setSystemError,
        addNotification: addNotification,
      });
    },
    getFailedPayments: ({
      fetchPaymentHistory,
      setPaymentHistory,
      addNotification,
      setSystemError,
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'FAILED',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(1, 'week')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_failed',
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    getOverdues: ({
      fetchOverdues,
      setOverdues,
      addNotification,
      setSystemError,
    }) => () => {
      fetchOverdues({
        setOverdues: setOverdues,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );
    },
    componentWillUnmount() {},
  }),
)(ReportsView);

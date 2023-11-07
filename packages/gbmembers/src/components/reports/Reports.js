import React from 'react';
import { connect } from 'react-redux';
import { compose, withState, lifecycle, withHandlers } from 'recompose';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as reportingActions } from '../../redux/modules/reporting';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as servicesActions } from '../../redux/modules/services';
import { actions as posActions } from '../../redux/modules/pos';
import 'react-tabulator/lib/styles.css'; // default theme
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css'; // use Theme(s)
import { actions as appActions } from '../../redux/modules/memberApp';
import { MemberActivityReport } from './MemberActivity';
import { MemberFinancialStats } from './MemberFinancialStats';
import { MemberFinancialReportContainer } from './MemberFinancialReport';
import { LeadsActivityReport } from './LeadActivity';
import { PDDailyReport } from './PDDaily';
import { Services } from './Services';
import { InactiveCustomersChart } from './PaysmartInactiveCustomers';
import { VariationCustomers } from './PaysmartVariations';
import { MemberBirthdays } from './MemberBirthdays';
import { MemberLastAttendance } from './MemberLastAttendance';
import { MemberMostAttendance } from './MemberMostAttendance';
import { PaysmartMemberDescrepencies } from './PaysmartMemberDescrepencies';
import { InactiveMembersNoHistory } from './InactiveMembersNoHistory';
import { PaysmartFailedPayments } from './PaysmartFailedPayments';
import { BamboraFailedPayments } from './BamboraFailedPayments';
import { StripeFailedPayments } from './StripeFailedPayments';
import { PaysmartOverdues } from './PaysmartOverdues';
import { StripeBillingTransactions } from './StripeBillingTransactions';
import { AdditionalServicesReportContainer } from './AdditionalServicesReport';
import { ResumingMembers } from './ResumingMembers';
import { actions } from '../../redux/modules/members';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import moment from 'moment';
import { Utils } from 'common';
import { CoreForm } from 'react-kinetic-core';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  reports: state.member.reporting.activityReport,
  activityReportLoading: state.member.reporting.activityReportLoading,
  members: state.member.members.allMembers,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  leadsByDate: state.member.leads.leadsByDate,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  leadsByDateLoading: state.member.leads.leadsByDateLoading,
  reportPreferences: state.member.app.reportPreferences,
  memberStatusValues: state.member.app.memberStatusValues,
  paymentPeriods: state.member.app.paymentPeriods,
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
  posOrdersLoading: state.member.pos.posOrdersLoading,
  posOrders: state.member.pos.posOrders,
  FAILEDpaymentHistory: state.member.members.FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading: state.member.members.FAILEDpaymentHistoryLoading,
  SUCCESSFULpaymentHistory: state.member.members.SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading:
    state.member.members.SUCCESSFULpaymentHistoryLoading,
  CHARGESpaymentHistory: state.member.members.CHARGESpaymentHistory,
  CHARGESpaymentHistoryLoading:
    state.member.members.CHARGESpaymentHistoryLoading,
  overdues: state.member.members.overdues,
  overduesLoading: state.member.members.overduesLoading,
  space: state.member.app.space,
  billingCustomersLoading: state.member.members.billingCustomersLoading,
  billingCustomers: state.member.members.billingCustomers,
  services: state.member.services.services,
  servicesLoading: state.member.services.servicesLoading,
  fetchingAttendancesByDate: state.member.attendance.fetchingAttendancesByDate,
  attendancesByDate: state.member.attendance.attendancesByDate,
});

const mapDispatchToProps = {
  fetchReport: reportingActions.fetchActivityReport,
  setReport: reportingActions.setActivityReport,
  fetchServicesByDate: servicesActions.fetchServicesByDate,
  fetchMembers: actions.fetchMembers,
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
  setSidebarDisplayType: appActions.setSidebarDisplayType,
  fetchAttendancesByDate: attendanceActions.fetchAttendancesByDate,
  fetchPOSOrders: posActions.fetchPOSOrders,
};

export const ReportsView = ({
  reports,
  activityReportLoading,
  members,
  leads,
  leadsByDate,
  profile,
  membersLoading,
  fetchServicesByDate,
  services,
  servicesLoading,
  fetchLeads,
  fetchLeadsByDate,
  leadsLoading,
  leadsByDateLoading,
  showMemberActivityReport,
  setShowMemberActivityReport,
  showMemberFinancialStats,
  setShowMemberFinancialStats,
  showMemberFinancialReport,
  setShowMemberFinancialReport,
  showBirthdaysReport,
  setBirthdaysReport,
  showLastAttendance,
  setShowLastAttendance,
  showMostAttendance,
  setShowMostAttendance,
  showLeadActivityReport,
  setShowLeadActivityReport,
  showPDDailyReport,
  setShowPDDailyReport,
  showServicesReport,
  setServicesReport,
  showResumingReport,
  setResumingReport,
  updatePreferences,
  showInactiveChart,
  setShowInactiveChart,
  setShowInactiveMembers,
  showInactiveMembers,
  reportPreferences,
  memberStatusValues,
  paymentPeriods,
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
  posOrders,
  posOrdersLoading,
  getCustomerRefunds,
  showVariationsReport,
  setShowVariationsReport,
  showDescrepenciesReport,
  setShowDescrepenciesReport,
  FAILEDpaymentHistory,
  FAILEDpaymentHistoryLoading,
  SUCCESSFULpaymentHistory,
  SUCCESSFULpaymentHistoryLoading,
  CHARGESpaymentHistory,
  CHARGESpaymentHistoryLoading,
  overdues,
  overduesLoading,
  showFailedPaymentsReport,
  setShowFailedPaymentsReport,
  getFailedPayments,
  getSuccessfulPayments,
  showOverduesReport,
  setShowOverduesReport,
  showStripeBillingTransactions,
  setShowStripeBillingTransactions,
  getOverdues,
  showAdditionalServicesReport,
  setShowAdditionalServicesReport,
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
  onDummyFormLoaded,
  setDummyFormLoaded,
  dummyFormLoaded,
  singleSetDummyFormLoaded,
  fetchAttendancesByDate,
  fetchingAttendancesByDate,
  attendancesByDate,
  fetchPOSOrders,
}) => (
  <div className="reports">
    {!membersLoading && (
      <div>
        <StatusMessagesContainer />
        <div style={{ margin: '10px' }}>
          <div className="row">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={!dummyFormLoaded}
              onClick={e =>
                setShowMemberActivityReport(
                  showMemberActivityReport ? false : true,
                )
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
                paymentPeriods={paymentPeriods}
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
              disabled={!dummyFormLoaded}
              onClick={e => {
                setBirthdaysReport(showBirthdaysReport ? false : true);
              }}
            >
              {showBirthdaysReport
                ? 'Hide Birthdays Due'
                : 'Show Birthdays Due'}
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
              disabled={!dummyFormLoaded}
              onClick={e => {
                setShowLastAttendance(showLastAttendance ? false : true);
              }}
            >
              {showLastAttendance
                ? 'Hide Last Attendance'
                : 'Show Last Attendance'}
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
        <div
          style={{ margin: '20px 0px 0px 10px' }}
          id="most-attendance-report"
        >
          <div className="row">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={!dummyFormLoaded}
              onClick={e => {
                setShowMostAttendance(showMostAttendance ? false : true);
              }}
            >
              {showMostAttendance
                ? 'Hide Most Attendance'
                : 'Show Most Attendance'}
            </button>
          </div>
          {!showMostAttendance ? null : (
            <div className="row">
              <div className="attendanceReport">
                <MemberMostAttendance
                  allMembers={members}
                  fetchAttendancesByDate={fetchAttendancesByDate}
                  fetchingAttendancesByDate={fetchingAttendancesByDate}
                  attendancesByDate={attendancesByDate}
                  space={space}
                  profile={profile}
                />
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
                disabled={true}
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
                  FAILEDpaymentHistory={FAILEDpaymentHistory}
                  FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                  SUCCESSFULpaymentHistory={SUCCESSFULpaymentHistory}
                  SUCCESSFULpaymentHistoryLoading={
                    SUCCESSFULpaymentHistoryLoading
                  }
                  fetchServicesByDate={fetchServicesByDate}
                  services={services}
                  servicesLoading={servicesLoading}
                  space={space}
                  profile={profile}
                />
              </div>
            )}
          </div>
        )}
        {!Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div style={{ margin: '10px' }}>
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
                onClick={e =>
                  setShowMemberFinancialReport(
                    showMemberFinancialReport ? false : true,
                  )
                }
              >
                {showMemberFinancialReport
                  ? 'Hide Member Financial Report'
                  : 'Show Member Financial Report'}
              </button>
            </div>
            {!showMemberFinancialReport ? null : (
              <div className="row">
                <MemberFinancialReportContainer
                  addNotification
                  setSystemError
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
                disabled={!dummyFormLoaded}
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
              disabled={!dummyFormLoaded}
              onClick={e => {
                setShowLeadActivityReport(
                  showLeadActivityReport ? false : true,
                );
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
              disabled={!dummyFormLoaded}
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
        <div style={{ margin: '20px 0px 0px 10px' }} id="services-report">
          <div className="row">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={!dummyFormLoaded}
              onClick={e => {
                setServicesReport(showServicesReport ? false : true);
                document.getElementById('services-report').scrollIntoView();
              }}
            >
              {showServicesReport
                ? 'Hide Services Report'
                : 'Show Services Report'}
            </button>
          </div>
          {!showServicesReport ? null : (
            <div className="row">
              <Services
                fetchServicesByDate={fetchServicesByDate}
                services={services}
                servicesLoading={servicesLoading}
                profile={profile}
                space={space}
              />
            </div>
          )}
        </div>
        <div style={{ margin: '20px 0px 0px 10px' }} id="resuming-report">
          <div className="row">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={!dummyFormLoaded}
              onClick={e => {
                setResumingReport(showResumingReport ? false : true);
                document.getElementById('resuming-report').scrollIntoView();
              }}
            >
              {showResumingReport
                ? 'Hide Resuming Members Report'
                : 'Show Resuming Members Report'}
            </button>
          </div>
          {!showResumingReport ? null : (
            <div className="row">
              <ResumingMembers allMembers={members} />
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
                disabled={!dummyFormLoaded}
                onClick={e => {
                  setShowInactiveChart(showInactiveChart ? false : true);
                }}
              >
                {showInactiveChart
                  ? 'Hide Inactive Chart'
                  : 'Show Inactive Chart'}
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
                disabled={!dummyFormLoaded}
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
          <div
            style={{ margin: '20px 0px 0px 10px' }}
            id="descrepencies-report"
          >
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
                onClick={e => {
                  setShowDescrepenciesReport(
                    showDescrepenciesReport ? false : true,
                  );
                  document
                    .getElementById('descrepencies-report')
                    .scrollIntoView();
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
                    space={space}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {Utils.getAttributeValue(space, 'Billing Company') !== 'Bambora' ||
        !Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div style={{ margin: '20px 0px 0px 10px' }} id="failed-report">
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
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
                  <BamboraFailedPayments
                    allMembers={members}
                    getFailedPayments={getFailedPayments}
                    paymentHistory={FAILEDpaymentHistory}
                    FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                    getSuccessfulPayments={getSuccessfulPayments}
                    successfulPaymentHistory={SUCCESSFULpaymentHistory}
                    SUCCESSFULpaymentHistoryLoading={
                      SUCCESSFULpaymentHistoryLoading
                    }
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {Utils.getAttributeValue(space, 'Billing Company') !== 'Bambora' ||
        !Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div
            style={{ margin: '20px 0px 0px 10px' }}
            id="additional-services-report"
          >
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
                onClick={e => {
                  setShowAdditionalServicesReport(
                    showAdditionalServicesReport ? false : true,
                  );
                  document.getElementById('failed-report').scrollIntoView();
                }}
              >
                {showAdditionalServicesReport
                  ? 'Hide Additional Services Report'
                  : 'Show Additional Services Report'}
              </button>
            </div>
            {!showAdditionalServicesReport ? null : (
              <div className="row">
                <div>
                  <AdditionalServicesReportContainer
                    allMembers={members}
                    profile={profile}
                    space={space}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {Utils.getAttributeValue(space, 'Billing Company') !== 'Stripe' ||
        !Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div style={{ margin: '20px 0px 0px 10px' }} id="failed-report">
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
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
                  <StripeFailedPayments
                    allMembers={members}
                    getFailedPayments={getFailedPayments}
                    paymentHistory={FAILEDpaymentHistory}
                    FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                    getSuccessfulPayments={getSuccessfulPayments}
                    successfulPaymentHistory={SUCCESSFULpaymentHistory}
                    SUCCESSFULpaymentHistoryLoading={
                      SUCCESSFULpaymentHistoryLoading
                    }
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
                disabled={!dummyFormLoaded}
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
                  <PaysmartFailedPayments
                    getFailedPayments={getFailedPayments}
                    paymentHistory={FAILEDpaymentHistory}
                    FAILEDpaymentHistoryLoading={FAILEDpaymentHistoryLoading}
                    allMembers={members}
                    getSuccessfulPayments={getSuccessfulPayments}
                    successfulPaymentHistory={SUCCESSFULpaymentHistory}
                    SUCCESSFULpaymentHistoryLoading={
                      SUCCESSFULpaymentHistoryLoading
                    }
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
                disabled={!dummyFormLoaded}
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
        {Utils.getAttributeValue(space, 'Billing Company') !== 'Stripe' ||
        !Utils.isMemberOf(profile, 'Billing') ? (
          <div />
        ) : (
          <div
            style={{ margin: '20px 0px 0px 10px' }}
            id="stripe-billing-transactions"
          >
            <div className="row">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                disabled={!dummyFormLoaded}
                onClick={e => {
                  setShowStripeBillingTransactions(
                    showStripeBillingTransactions ? false : true,
                  );
                  document
                    .getElementById('stripe-billing-transactions')
                    .scrollIntoView();
                }}
              >
                {showStripeBillingTransactions
                  ? 'Hide Stripe Billing Transactions'
                  : 'Show Stripe Billing Transactions'}
              </button>
            </div>
            {!showStripeBillingTransactions ? null : (
              <div className="row">
                <div>
                  <StripeBillingTransactions
                    allMembers={members}
                    profile={profile}
                    space={space}
                    fetchCustomerRefunds={fetchCustomerRefunds}
                    setCustomerRefunds={setCustomerRefunds}
                    fetchPaymentHistory={fetchPaymentHistory}
                    setPaymentHistory={setPaymentHistory}
                    SUCCESSFULpaymentHistory={SUCCESSFULpaymentHistory}
                    SUCCESSFULpaymentHistoryLoading={
                      SUCCESSFULpaymentHistoryLoading
                    }
                    CHARGESpaymentHistory={CHARGESpaymentHistory}
                    CHARGESpaymentHistoryLoading={CHARGESpaymentHistoryLoading}
                    fetchPOSOrders={fetchPOSOrders}
                    posOrdersLoading={posOrdersLoading}
                    posOrders={posOrders}
                    customerRefunds={customerRefunds}
                    customerRefundsLoading={customerRefundsLoading}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <CoreForm
          kapp="gbmembers"
          form="dummy-form"
          loaded={singleSetDummyFormLoaded(dummyFormLoaded, setDummyFormLoaded)}
        />
      </div>
    )}
  </div>
);

export const ReportsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('showMemberActivityReport', 'setShowMemberActivityReport', false),
  withState('showBirthdaysReport', 'setBirthdaysReport', false),
  withState('showLastAttendance', 'setShowLastAttendance', false),
  withState('showMostAttendance', 'setShowMostAttendance', false),
  withState('showMemberFinancialStats', 'setShowMemberFinancialStats', false),
  withState('showMemberFinancialReport', 'setShowMemberFinancialReport', false),
  withState('showInactiveMembers', 'setShowInactiveMembers', false),
  withState('showLeadActivityReport', 'setShowLeadActivityReport', false),
  withState('showPDDailyReport', 'setShowPDDailyReport', false),
  withState('showServicesReport', 'setServicesReport', false),
  withState('showResumingReport', 'setResumingReport', false),
  withState('showInactiveChart', 'setShowInactiveChart', false),
  withState('showVariationsReport', 'setShowVariationsReport', false),
  withState('showDescrepenciesReport', 'setShowDescrepenciesReport', false),
  withState('showFailedPaymentsReport', 'setShowFailedPaymentsReport', false),
  withState('showOverduesReport', 'setShowOverduesReport', false),
  withState(
    'showStripeBillingTransactions',
    'setShowStripeBillingTransactions',
    false,
  ),
  withState(
    'showAdditionalServicesReport',
    'setShowAdditionalServicesReport',
    false,
  ),
  withState('dummyFormLoaded', 'setDummyFormLoaded', false),
  withHandlers({
    singleSetDummyFormLoaded: () => (dummyFormLoaded, setDummyFormLoaded) => {
      if (!dummyFormLoaded) {
        setTimeout(function() {
          setDummyFormLoaded(true);
        }, 2000);
      }
    },
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
      space,
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'FAILED',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(7, 'month')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_failed',
        addNotification: addNotification,
        setSystemError: setSystemError,
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
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(1, 'month')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_successful',
        addNotification: addNotification,
        setSystemError: setSystemError,
        useSubAccount:
          getAttributeValue(space, 'PaySmart SubAccount') === 'YES'
            ? true
            : false,
      });
    },
    getOverdues: ({
      fetchOverdues,
      setOverdues,
      addNotification,
      setSystemError,
      space,
    }) => () => {
      fetchOverdues({
        setOverdues: setOverdues,
        addNotification: addNotification,
        setSystemError: setSystemError,
        useSubAccount:
          getAttributeValue(space, 'PaySmart SubAccount') === 'YES'
            ? true
            : false,
      });
    },
    getAdditionalServices: ({
      fetchAdditionalServices,
      setAdditionalServices,
      addNotification,
      setSystemError,
    }) => () => {
      fetchAdditionalServices({
        setAdditionalServices: setAdditionalServices,
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
      if (this.props.membersNextPageToken !== 'COMPLETE_LOADED') {
        this.props.fetchMembers({
          membersNextPageToken: 'LOAD_COMPLETE',
          memberInitialLoadComplete: this.props.memberInitialLoadComplete,
          memberLastFetchTime: this.props.memberLastFetchTime,
        });
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
    },
    componentWillUnmount() {},
  }),
)(ReportsView);

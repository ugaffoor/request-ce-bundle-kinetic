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
import { getCurrency } from '../Member/MemberUtils';
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
import { compose } from 'recompose';
import { connect } from 'react-redux';

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  paymentHistory: state.member.members.paymentHistory,
  paymentHistoryLoading: state.member.members.paymentHistoryLoading,
  space: state.member.app.space,
  billingReportCustomersLoading: state.member.members.billingCustomersLoading,
  billingCustomers: state.member.members.billingCustomers,
});

const mapDispatchToProps = {
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
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
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }

    this.locale = this.props.space.defaultLocale.split('-')[0];

    this._getMemberRowTableColumns = this.getMemberRowTableColumns();

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let repFromDate = this.setFromDate;
    let repToDate = this.setToDate;
    this.paymentHistory = [];
    let memberData = this.getMemberData(undefined);
    this.state = {
      allMembers: this.props.members,
      memberData,
      repFromDate,
      repToDate,
      repBillingPeriod: 'monthly',
      repViewPeriod: 'this_period',
      showRepAccountHolders: false,
      historyLoaded: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.billingReportCustomersLoading &&
      !nextProps.paymentReportHistoryLoading
    ) {
      if (!this.state.historyLoaded) {
        nextProps.paymentHistory.forEach((item, i) => {
          this.paymentHistory[this.paymentHistory.length] = item;
        });
      }

      let memberData = this.getMemberData(
        nextProps.members,
        nextProps.billingCustomers,
        this.paymentHistory,
        this.state.repFromDate,
        this.state.repToDate,
        this.state.repBillingPeriod,
      );
      this.setState({
        allMembers: nextProps.members,
        billingCustomers: nextProps.billingCustomers,
        paymentHistory: nextProps.paymentHistory,
        memberData,
        historyLoaded: true,
      });
    }
  }

  UNSAFE_componentWillMount() {
    if (this.props.billingCustomersLoading) {
      this.props.fetchBillingCustomers({
        setBillingCustomers: this.props.setBillingCustomers,
        allMembers: this.props.members,
      });
    }
    if (!this.state.historyLoaded) {
      this.props.fetchPaymentHistory({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: this.state.repFromDate.format('YYYY-MM-DD'),
        dateTo: this.state.repToDate.format('YYYY-MM-DD'),
        setPaymentHistory: this.props.setPaymentHistory,
        internalPaymentType: 'client_successful',
        addNotification: this.props.addNotification,
        setSystemError: this.props.setSystemError,
      });
    }
  }

  isRecurringPayment(payment, members) {
    var idx = members.findIndex(
      member =>
        member.values['Billing Customer Id'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }

  getMemberData(
    members,
    billingCustomers,
    paymentHistory,
    fromDate,
    toDate,
    billingPeriod,
  ) {
    if (!members || members.length <= 0) {
      return {
        accountHolders: { members: [], value: 0 },
        posPayments: { members: [], value: 0 },
        totalActiveMembers: { members: [], value: 0 },
        activeMembers: { members: [], value: 0 },
        activeCashMembers: { members: [], value: 0 },
        newMembers: { members: [], value: 0 },
      };
    }
    // billingAmount, billingPeriod
    let accountHolders = [];
    let accountHoldersValue = 0;
    let posPaymentsValue = 0;
    paymentHistory.forEach(payment => {
      var member = this.isRecurringPayment(payment, members);
      if (member !== undefined) {
        // Needed for Bambora
        if (accountHolders.findIndex(item => item.id === member.id) === -1) {
          accountHolders[accountHolders.length] = member;
        }
        accountHoldersValue += payment.paymentAmount;
      } else if (
        getAttributeValue(this.props.space, 'POS System') === 'Bambora'
      ) {
        posPaymentsValue += payment.paymentAmount;
      }
    });

    return {
      accountHolders: { members: accountHolders, value: accountHoldersValue },
      posPayments: { members: [], value: posPaymentsValue },
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
        memberData: this.getMemberData(
          this.state.allMembers,
          this.state.billingCustomers,
          this.state.paymentHistory,
          this.state.repFromDate,
          this.state.repToDate,
          this.state.repBillingPeriod,
        ),
      });
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
      let memberData = this.getMemberData(
        this.state.allMembers,
        this.state.billingCustomers,
        this.state.paymentHistory,
        fromDate,
        toDate,
        billingPeriod,
      );
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        repFromDate: fromDate,
        repToDate: toDate,
      });
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
      let memberData = this.getMemberData(
        this.state.allMembers,
        this.state.billingCustomers,
        this.state.paymentHistory,
        fromDate,
        toDate,
        billingPeriod,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        repFromDate: fromDate,
        repToDate: toDate,
      });
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
      let memberData = this.getMemberData(
        this.state.allMembers,
        this.state.billingCustomers,
        this.state.paymentHistory,
        fromDate,
        toDate,
        billingPeriod,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        repFromDate: fromDate,
        repToDate: toDate,
      });
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
      let memberData = this.getMemberData(
        this.state.allMembers,
        this.state.billingCustomers,
        this.state.paymentHistory,
        fromDate,
        toDate,
        billingPeriod,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        repFromDate: fromDate,
        repToDate: toDate,
      });
    } else if (viewPeriod === 'year') {
      let fromDate = moment()
        .subtract(1, 'years')
        .hour(0)
        .minute(0);
      let toDate = moment()
        .hour(23)
        .minute(59);
      let memberData = this.getMemberData(
        this.state.allMembers,
        this.state.billingCustomers,
        this.state.paymentHistory,
        fromDate,
        toDate,
        billingPeriod,
      );
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        memberData: memberData,
        repFromDate: fromDate,
        repToDate: toDate,
      });
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
            <div className="">{props.original.members_col1['period']}</div>
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
            <div className="">{props.original.members_col2['period']}</div>
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
    return this.props.billingReportCustomersLoading ||
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
                name="reportPeriod"
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
                name="reportPeriod"
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
              Fortnightly
            </label>
            <label htmlFor="monthly" className="radio">
              <input
                id="monthly"
                name="reportPeriod"
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
                        value={this.state.repFromDate.toDate()}
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
                        value={this.state.repToDate.toDate()}
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
            {this.state.repFromDate.format('L')} to{' '}
            {this.state.repToDate.format('L')}
          </span>
        </div>

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
            <div className="column col5">Total</div>
          </div>
          <div className="row header2">
            <div className="column col1">REVENUE</div>
            <div className="column col2">
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.accountHolders.value)}
              </div>
            </div>
            <div className="column col3"></div>
            <div className="column col4"></div>
            <div className="column col5"></div>
          </div>
          <div className="row header3">
            <div className="column col1">SUBTOTAL REVENUE</div>
            <div className="column col2">
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.accountHolders.value)}
              </div>
            </div>
            <div className="column col3"></div>
            <div className="column col4"></div>
            <div className="column col5"></div>
          </div>
          <div className="row header4">
            <div className="column col1">Membership</div>
            <div className="column col2">
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.accountHolders.value)}
              </div>
            </div>
            <div className="column col3"></div>
            <div className="column col4"></div>
            <div className="column col5"></div>
          </div>
          <div className="row header5">
            <div className="column col1">POS</div>
            <div className="column col2">
              <div className="dollarValue">
                {new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.memberData.posPayments.value)}
              </div>
            </div>
            <div className="column col3"></div>
            <div className="column col4"></div>
            <div className="column col5"></div>
          </div>
        </div>
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const MemberFinancialReportContainer = enhance(MemberFinancialReport);

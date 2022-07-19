import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';
import SVGInline from 'react-svg-inline';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:sss';

export class BamboraOverdues extends Component {
  constructor(props) {
    super(props);
    this.paymentHistory = this.props.paymentHistory;
    this.successfulPaymentHistory = this.props.successfulPaymentHistory;
    this.getColumns = this.getColumns.bind(this);
    let data = this.getData(this.paymentHistory, this.successfulPaymentHistory);
    let columns = this.getColumns();
    this.locale = this.props.locale;

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

    this.state = {
      data,
      total: 0,
      columns,
    };
  }

  UNSAFE_componentWillMount() {
    this.props.getFailedPayments();
    this.props.getSuccessfulPayments();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.FAILEDpaymentHistoryLoading &&
      !nextProps.SUCCESSFULpaymentHistory
    ) {
      this.paymentHistory = nextProps.paymentHistory;
      this.successfulPaymentHistory = nextProps.successfulPaymentHistory;

      var data = this.getData(
        this.paymentHistory,
        this.successfulPaymentHistory,
      );
      var totalOverdue = 0;
      data.forEach((item, i) => {
        totalOverdue = totalOverdue + item.overdueAmount;
      });

      this.setState({
        data: data,
        total: totalOverdue,
      });
    }
  }
  validOverdue(member, successfulPayments, payment) {
    var valid = false;

    if (
      (member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Penging Freeze' ||
        member.values['Status'] === 'Pending Cancellation') &&
      payment.debitDate !== null &&
      member.values['Non Paying'] !== 'YES' &&
      member.values['Billing Payment Type'] === 'Credit Card'
    ) {
      valid = true;
    }
    var billingStartDate = this.getLastBillingStartDate(
      member,
      successfulPayments,
    );
    if (
      billingStartDate.isAfter(moment(payment.debitDate, 'YYYY-MM-DD HH:mm:SS'))
    ) {
      valid = false;
    }
    return valid;
  }
  getLastBillingStartDate(member, successfulPayments) {
    var resumeDate = moment(member.values['Resume Date'], 'YYYY-MM-DD');
    var billingStartDate = moment(
      member.values['Billing Start Date'],
      'YYYY-MM-DD',
    );
    if (resumeDate.isAfter(billingStartDate)) {
      billingStartDate = resumeDate;
    }
    var idx = successfulPayments.findIndex(successful => {
      return (
        member.values['Member ID'] === successful.yourSystemReference &&
        moment(successful.debitDate, 'YYYY-MM-DD HH:mm:SS').isAfter(
          billingStartDate,
        )
      );
    });

    if (idx !== -1) {
      billingStartDate = moment(
        successfulPayments[idx].debitDate,
        'YYYY-MM-DD HH:mm:SS',
      );
    }
    return billingStartDate;
  }
  getData(failedPayments, successfulPayments) {
    failedPayments = failedPayments.filter(
      payment =>
        payment.paymentStatus === 'Transaction Declined' ||
        payment.paymentStatus === 'DECLINED' ||
        payment.paymentStatus === 'PIN RETRY EXCEEDED' ||
        payment.paymentStatus === 'SERV NOT ALLOWED' ||
        payment.paymentStatus === 'EXPIRED CARD',
    );
    failedPayments = failedPayments.sort((a, b) => {
      if (a['debitDate'] < b['debitDate']) {
        return 1;
      }
      if (a['debitDate'] > b['debitDate']) {
        return -1;
      }
      return 0;
    });
    var uniqueFailed = [];
    failedPayments.forEach((failed, i) => {
      var idx = uniqueFailed.findIndex(
        unique => unique.yourSystemReference === failed.yourSystemReference,
      );
      if (idx === -1) {
        uniqueFailed[uniqueFailed.length] = failed;
      }
    });

    var uniqueHistoryAll = [];
    uniqueFailed.forEach((failed, i) => {
      // Remove any failed that has a successful payment
      var idx = successfulPayments.findIndex(successful => {
        return (
          failed.yourSystemReference === successful.yourSystemReference &&
          moment(successful.debitDate, 'YYYY-MM-DD HH:mm:SS').isAfter(
            moment(failed.debitDate, 'YYYY-MM-DD HH:mm:SS'),
          )
        );
      });

      if (idx === -1) {
        uniqueHistoryAll[uniqueHistoryAll.length] = failed;
      }
    });

    var uniqueHistory = [];
    uniqueHistoryAll.map(payment => {
      // Keep only Recurring Billing failures
      var idx = this.props.allMembers.findIndex(
        member =>
          member.values['Member ID'] === payment.yourSystemReference ||
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      if (idx !== -1) {
        if (
          this.validOverdue(
            this.props.allMembers[idx],
            successfulPayments,
            payment,
          )
        ) {
          uniqueHistory[uniqueHistory.length] = payment;
        }
      }
    });
    const data = uniqueHistory.map(payment => {
      var idx = this.props.allMembers.findIndex(
        member =>
          member.values['Member ID'] === payment.yourSystemReference ||
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      var member = undefined;
      if (idx !== -1) {
        member = this.props.allMembers[idx];
      }
      var lastPayment;
      if (idx !== -1) {
        lastPayment = this.getLastBillingStartDate(
          this.props.allMembers[idx],
          successfulPayments,
        );
      }
      let nowDate = moment();
      var overdueAmount = 0;
      if (member !== undefined) {
        var paymentPeriod = member.values['Billing Payment Period'];
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
        }
        if (lastPayment.isAfter(moment())) {
          lastPayment = lastPayment.subtract(period, periodCount);
        }

        var nextBillingDate = lastPayment.add(period, periodCount);
        while (nextBillingDate.isBefore(nowDate)) {
          overdueAmount = overdueAmount + payment.paymentAmount;
          nextBillingDate = nextBillingDate.add(period, periodCount);
        }
        if (overdueAmount === 0) {
          overdueAmount = payment.paymentAmount;
        }
      }
      return {
        _id: payment.paymentID,
        paymentAmount: payment.paymentAmount,
        overdueAmount: overdueAmount,
        successDate: this.getLastBillingStartDate(member, successfulPayments),
        debitDate: payment.debitDate,
        memberGUID: member !== undefined ? member.id : '',
        name: member.values['First Name'] + ' ' + member.values['Last Name'],
      };
    });

    return data;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'memberGUID',
        Header: 'Name',
        width: 200,
        Cell: props => {
          return (
            <NavLink to={`/Member/${props.value}`} className="">
              {props.original.name}
            </NavLink>
          );
        },
      },
      {
        accessor: 'successDate',
        Header: 'Last Success Date',
        width: 150,
        Cell: props => moment(props.value, ezidebit_date_format).format('L'),
      },
      {
        accessor: 'debitDate',
        Header: 'Last Failed Date',
        width: 150,
        Cell: props => moment(props.value, ezidebit_date_format).format('L'),
      },
      {
        accessor: 'paymentAmount',
        Header: 'Payment Amount',
        width: 150,
        Cell: props => {
          return props.value === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.value)}
            </div>
          );
        },
      },
      {
        accessor: 'overdueAmount',
        Header: 'Overdue Value',
        width: 150,
        Cell: props => {
          return props.value === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.value)}
            </div>
          );
        },
        Footer: (
          <span>
            <strong>Total: </strong>
            {this.state !== undefined
              ? new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.total)
              : 0}
          </span>
        ),
      },
      {
        accessor: 'memberGUID',
        headerClassName: 'refund',
        className: 'refund',
        width: 200,
        Cell: props => (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => {
              window.location =
                '/#/kapps/services/categories/bambora-billing/bambora-change-credit-card-details?id=' +
                props.value +
                '&overdue=' +
                props.original.overdueAmount;
            }}
          >
            Update Credit Card
          </button>
        ),
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.FAILEDpaymentHistoryLoading ||
      this.props.SUCCESSFULpaymentHistoryLoading ? (
      <div>Loading Payment History ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <div>
            <div style={{ float: 'left' }}>
              <ReactToPrint
                trigger={() => (
                  <SVGInline svg={printerIcon} className="icon tablePrint" />
                )}
                content={() => this.tableComponentRef}
              />
            </div>
            <h6>Overdue Payments</h6>
          </div>
        </div>
        <ReactTable
          ref={el => (this.tableComponentRef = el)}
          columns={this.getColumns()}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
      </span>
    );
  }
}

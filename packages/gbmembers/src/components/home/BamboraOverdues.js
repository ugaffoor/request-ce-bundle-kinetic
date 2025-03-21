import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';
import SVGInline from 'react-svg-inline';
import {
  getCurrency,
  validOverdue,
  getLastBillingStartDate,
  isBamboraFailedPayment,
} from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class BamboraOverdues extends Component {
  constructor(props) {
    super(props);
    this.paymentHistory = this.props.paymentHistory;
    this.successfulPaymentHistory = this.props.successfulPaymentHistory;
    this.cashPaymentsByDate = this.props.cashPaymentsByDate;
    this.getColumns = this.getColumns.bind(this);
    let data = this.getData(
      this.paymentHistory,
      this.successfulPaymentHistory,
      this.cashPaymentsByDate,
    );
    let columns = this.getColumns();
    this.locale = this.props.locale;

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.state = {
      data,
      total: 0,
      columns,
    };
  }

  componentDidMount() {
    this.props.getFailedPayments();
    this.props.getSuccessfulPayments();
    this.props.fetchCashPaymentsByDate({
      dateFrom: moment()
        .subtract(6, 'months')
        .format('YYYY-MM-DD'),
      dateTo: moment().format('YYYY-MM-DD'),
    });
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      !nextProps.FAILEDpaymentHistoryLoading &&
      !nextProps.SUCCESSFULpaymentHistory &&
      !nextProps.cashPaymentsByDateLoading
    ) {
      this.paymentHistory = nextProps.paymentHistory;
      this.successfulPaymentHistory = nextProps.successfulPaymentHistory;
      this.cashPaymentsByDate = nextProps.cashPaymentsByDate;

      var data = this.getData(
        this.paymentHistory,
        this.successfulPaymentHistory,
        this.cashPaymentsByDate,
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

  getData(failedPayments, successfulPayments, cashPaymentsByDate) {
    failedPayments = failedPayments.filter(payment =>
      isBamboraFailedPayment(payment),
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
    let attemptsMap = new Map();
    var uniqueFailed = [];
    failedPayments.forEach((failed, i) => {
      var idx = successfulPayments.findIndex(successful => {
        return (
          failed.yourSystemReference === successful.yourSystemReference &&
          moment(successful.debitDate, 'YYYY-MM-DD HH:mm:SS').isAfter(
            moment(failed.debitDate, 'YYYY-MM-DD HH:mm:SS'),
          )
        );
      });

      if (idx === -1) {
        if (attemptsMap.get(failed.yourSystemReference) === undefined) {
          attemptsMap.set(failed.yourSystemReference, 1);
        } else {
          let count = attemptsMap.get(failed.yourSystemReference);
          if (count < 5) {
            attemptsMap.set(failed.yourSystemReference, count + 1);
          }
        }
      }
      var idx = uniqueFailed.findIndex(
        unique => unique.yourSystemReference === failed.yourSystemReference,
      );
      if (idx === -1) {
        uniqueFailed[uniqueFailed.length] = failed;
      }
    });

    var uniqueHistoryAll = [];
    uniqueFailed.forEach((failed, i) => {
      //      console.log("Failed:"+failed.yourSystemReference);
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
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      if (idx !== -1) {
        if (
          validOverdue(this.props.allMembers[idx], successfulPayments, payment)
        ) {
          uniqueHistory[uniqueHistory.length] = payment;
        }
      }
    });
    const data = uniqueHistory.map(payment => {
      var idx = this.props.allMembers.findIndex(
        member =>
          member.values['Billing Customer Id'] === payment.yourSystemReference,
      );
      var member = undefined;
      if (idx !== -1) {
        member = this.props.allMembers[idx];
      }
      var lastPayment;
      if (idx !== -1) {
        lastPayment = getLastBillingStartDate(
          this.props.allMembers[idx],
          successfulPayments,
        );
      }
      let nowDate = moment();
      var overdueAmount = 0;
      if (
        member !== undefined &&
        payment.paymentSource === 'AdditionalService' &&
        member.values['Status'] === 'Frozen'
      ) {
        overdueAmount = payment.paymentAmount;
      } else if (member !== undefined) {
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
        } else if (paymentPeriod === 'Quarterly') {
          periodCount = 3;
          period = 'months';
        } else if (paymentPeriod === '4 Months') {
          periodCount = 4;
          period = 'months';
        } else if (paymentPeriod === '6 Months') {
          periodCount = 6;
          period = 'months';
        } else if (paymentPeriod === 'Yearly') {
          period = 'years';
        }
        if (lastPayment.isAfter(moment())) {
          lastPayment = lastPayment.subtract(periodCount, period);
        }

        var nextBillingDate = lastPayment.add(periodCount, period);
        while (nextBillingDate.isBefore(nowDate)) {
          overdueAmount = overdueAmount + payment.paymentAmount;
          nextBillingDate = nextBillingDate.add(periodCount, period);
        }
        if (overdueAmount === 0) {
          overdueAmount = payment.paymentAmount;
        }
        // Deduct any cash payment made since lastPayment
        if (overdueAmount > 0) {
          lastPayment = getLastBillingStartDate(member, successfulPayments);
          cashPaymentsByDate.map(cash => {
            if (
              cash.values['Member GUID'] === member.id &&
              moment(cash.values['Date']).isAfter(lastPayment)
            ) {
              overdueAmount = overdueAmount - parseFloat(cash.values['Amount']);
            }
          });
        }
      }

      return {
        _id: payment.paymentID,
        paymentAmount: payment.paymentAmount,
        overdueAmount: overdueAmount,
        successDate: getLastBillingStartDate(member, successfulPayments),
        debitDate: payment.debitDate,
        memberGUID: member !== undefined ? member.id : '',
        name: member.values['First Name'] + ' ' + member.values['Last Name'],
        attemptCount: attemptsMap.get(payment.yourSystemReference),
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
        accessor: 'attemptCount',
        Header: 'Attempts',
        width: 100,
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
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
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
              {new Intl.NumberFormat(this.props.locale, {
                style: 'currency',
                currency: this.props.currency,
              }).format(props.value)}
            </div>
          );
        },
        Footer: (
          <span>
            <strong>Total: </strong>
            {this.state !== undefined
              ? new Intl.NumberFormat(this.props.locale, {
                  style: 'currency',
                  currency: this.props.currency,
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
            <span>
              When the payment attempts reach 5, the Bambora account is
              automatically placed On Hold and will no longer make any futher
              attempts for payment.
            </span>
            <br></br>
            <span>A payment attempt is made every second day.</span>
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

import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:sss';

export class StripeFailedPayments extends Component {
  constructor(props) {
    super(props);
    this.paymentHistory = this.props.paymentHistory;
    this.successfulPaymentHistory = this.props.successfulPaymentHistory;
    let data = this.getData(this.paymentHistory, this.successfulPaymentHistory);
    let columns = this.getColumns();
    this.state = {
      data,
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
      this.setState({
        data: this.getData(this.paymentHistory, this.successfulPaymentHistory),
      });
    }
  }

  getData(failedPayments, successfulPayments) {
    failedPayments = failedPayments.filter(
      payment => payment.paymentStatus === 'open',
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
      var idx = successfulPayments.findIndex(successful => {
        return (
          failed.yourSystemReference === successful.yourSystemReference &&
          moment(successful.debitDate, 'YYYY-MM-DD').isAfter(
            moment(failed.debitDate, 'YYYY-MM-DD'),
          )
        );
      });

      if (idx === -1) {
        uniqueHistoryAll[uniqueHistoryAll.length] = failed;
      }
    });

    var uniqueHistory = [];
    uniqueHistoryAll.map(payment => {
      var idx = this.props.allMembers.findIndex(
        member => member.values['Member ID'] === payment.yourSystemReference,
      );
      if (idx !== -1) {
        if (
          (this.props.allMembers[idx].values['Status'] === 'Active' ||
            this.props.allMembers[idx].values['Status'] === 'Penging Freeze' ||
            this.props.allMembers[idx].values['Status'] ===
              'Pending Cancellation') &&
          payment.debitDate !== null
        ) {
          uniqueHistory[uniqueHistory.length] = payment;
        }
      } else {
        uniqueHistory[uniqueHistory.length] = payment;
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
      return {
        _id: payment.paymentID,
        paymentAmount: Number(payment.scheduledAmount).toFixed(2),
        paymentMethod: payment.paymentMethod,
        paymentStatus: 'Failed',
        debitDate: payment.debitDate,
        memberGUID: member !== undefined ? member.id : '',
        name:
          member !== undefined
            ? member.values['First Name'] + ' ' + member.values['Last Name']
            : payment.customerName + ' POS',
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
        accessor: 'paymentAmount',
        Header: 'Payment Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'paymentStatus', Header: 'Payment Status' },
      {
        accessor: 'debitDate',
        Header: 'Debit Date',
        Cell: props => moment(props.value, ezidebit_date_format).format('L'),
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
          <h6>Failed Payments - Last 6 Months</h6>
        </div>
        <ReactTable
          columns={columns}
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

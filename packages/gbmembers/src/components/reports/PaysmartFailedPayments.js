import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import SVGInline from 'react-svg-inline';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class PaysmartFailedPayments extends Component {
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
      this.successfulPaymentHistory = nextProps.successfulPaymentHistory;
      this.setState({
        data: this.getData(this.paymentHistory, this.successfulPaymentHistory),
      });
    }
  }

  getData(failedPayments, successfulPayments) {
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
      return {
        _id: payment.paymentID,
        name: payment.firstName + ' ' + payment.lastName,
        scheduledAmount: payment.scheduledAmount,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        transactionFee: payment.transactionFeeCustomer,
        debitDate: payment.debitDate,
      };
    });

    var validFailed = [];
    data.map(payment => {
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
          validFailed[validFailed.length] = payment;
        }
      } else {
        validFailed[validFailed.length] = payment;
      }
    });

    return validFailed;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
      },
      {
        accessor: 'scheduledAmount',
        Header: 'Scheduled Amount',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'paymentAmount',
        Header: 'Payment Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'paymentMethod', Header: 'Payment Method' },
      { accessor: 'paymentStatus', Header: 'Payment Status' },
      {
        accessor: 'transactionFee',
        Header: 'Transaction Fee',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'debitDate',
        Header: 'Debit Date',
        Cell: props =>
          moment(props.value, ezidebit_date_format).format('YYYY-MM-DD'),
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
          <h6>Failed Payments - Last Week</h6>
        </div>
        <ReactToPrint
          trigger={() => (
            <SVGInline svg={printerIcon} className="icon tablePrint" />
          )}
          content={() => this.tableComponentRef}
        />
        <ReactTable
          ref={el => (this.tableComponentRef = el)}
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

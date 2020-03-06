import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class FailedPayments extends Component {
  constructor(props) {
    super(props);
    this.paymentHistory = this.props.paymentHistory;
    let data = this.getData(this.paymentHistory);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillMount() {
    this.props.getFailedPayments();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.paymentHistory) {
      this.paymentHistory = nextProps.paymentHistory;
      this.setState({
        data: this.getData(nextProps.paymentHistory),
      });
    }
  }

  getData(payments) {
    const data = payments.map(payment => {
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
    return data;
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
    return this.props.paymentHistoryLoading ? (
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

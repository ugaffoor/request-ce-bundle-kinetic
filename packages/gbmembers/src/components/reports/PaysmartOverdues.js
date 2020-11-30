import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class PaysmartOverdues extends Component {
  constructor(props) {
    super(props);
    this.overdues = this.props.overdues;
    let data = this.getData(this.overdues);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillMount() {
    this.props.getOverdues();
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.overdues) {
      this.overdues = nextProps.overdues;
      this.setState({
        data: this.getData(nextProps.overdues),
      });
    }
  }

  getData(payments) {
    const data = payments.map(payment => {
      return {
        _id: payment.paymentID,
        name: payment.firstName + ' ' + payment.lastName,
        amountOverdue: payment.amountOverdue,
        dateOverdue: payment.dateOverdue,
        reasonOverdue: payment.reasonOverdue,
        customerReference: payment.customerReference,
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
        accessor: 'amountOverdue',
        Header: 'Overdue Amount',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'dateOverdue',
        Header: 'Overdue Date',
        Cell: props =>
          moment(props.value, ezidebit_date_format).format('YYYY-MM-DD'),
      },
      { accessor: 'reasonOverdue', Header: 'Reason' },
      { accessor: 'customerReference', Header: 'customerReference' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.overduesLoading ? (
      <div>Loading Overdue Payments ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Overdue Payments - Last Week</h6>
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

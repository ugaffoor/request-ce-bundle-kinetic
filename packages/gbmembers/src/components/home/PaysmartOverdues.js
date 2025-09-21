import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class PaysmartOverdues extends Component {
  constructor(props) {
    super(props);
    this.overdues = this.props.overdues;
    let data = this.getData(this.overdues);
    let columns = this.getColumns();

    this.tableComponentRef = React.createRef();

    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillMount() {
    this.props.getOverdues();
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
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
        width: 150,
      },
      {
        accessor: 'amountOverdue',
        Header: 'Overdue Amount',
        Cell: props => '$' + props.value,
        width: 150,
      },
      {
        accessor: 'dateOverdue',
        Header: 'Overdue Date',
        width: 150,
        Cell: props =>
          moment(props.value, ezidebit_date_format).format('YYYY-MM-DD'),
      },
      {
        accessor: 'reasonOverdue',
        Header: 'Reason',
        width: 150,
      },
      {
        accessor: 'customerReference',
        Header: 'customerReference',
        width: 150,
      },
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
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon tablePrint icon-svg" />}
          content={() => this.tableComponentRef.current}
        />
        <ReactTable
          ref={this.tableComponentRef}
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

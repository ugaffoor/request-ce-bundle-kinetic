import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';

export class VariationCustomers extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.variationCustomers, this.props.members);
    let columns = this.getColumns();

    this.tableComponentRef = React.createRef();

    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.variationCustomers) {
      this.setState({
        data: this.getData(nextProps.variationCustomers, this.props.members),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.getVariationCustomers();
  }

  getData(variationCustomers, members) {
    if (!variationCustomers || variationCustomers.length <= 0) {
      return [];
    }

    const data = variationCustomers
      .filter(customer => {
        return (
          members.findIndex(
            member =>
              (member.values['Status'] === 'Active' ||
                member.values['Status'] === 'Frozen' ||
                member.values['Status'] === 'Pending Freeze' ||
                member.values['Status'] === 'Pending Cancellation') &&
              member.values['Billing Customer Id'] === customer.customerId,
          ) !== -1
        );
      })
      .map(variationCustomer => {
        let member =
          members[
            members.findIndex(
              member =>
                member.values['Billing Customer Id'] ===
                variationCustomer.customerId,
            )
          ];
        return {
          _id: variationCustomer.customerId,
          name: member.values['First Name'] + ' ' + member.values['Last Name'],
          customerId: variationCustomer.customerId,
          variationAmount: variationCustomer.variationAmount,
          startDate: variationCustomer.startDate,
          resumeDate: variationCustomer.resumeDate,
        };
      });
    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'name', Header: 'Name' },
      { accessor: 'customerId', Header: 'Customer Id' },
      {
        accessor: 'variationAmount',
        Header: 'Variation Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'startDate', Header: 'Start Date' },
      {
        accessor: 'resumeDate',
        Header: 'Resume Date',
        Cell: props => {
          return props.value === '03-01-0001' ? 'UFN' : props.value;
        },
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.variationCustomersLoading ? (
      <div>Loading variations ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Variation Customers</h6>
        </div>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg tablePrint" />}
          content={() => this.tableComponentRef.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
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
        <br />
      </span>
    );
  }
}

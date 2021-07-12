import React, { Component } from 'react';
import ReactTable from 'react-table';

export class VariationCustomers extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.variationCustomers);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.variationCustomers) {
      this.setState({
        data: this.getData(nextProps.variationCustomers),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.getVariationCustomers();
  }

  getData(variationCustomers) {
    if (!variationCustomers || variationCustomers.length <= 0) {
      return [];
    }

    const data = variationCustomers.map(variationCustomer => {
      return {
        _id: variationCustomer.customerId,
        firstName: variationCustomer.firstName,
        lastName: variationCustomer.lastName,
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
      { accessor: 'firstName', Header: 'First Name' },
      { accessor: 'lastName', Header: 'Last Name' },
      { accessor: 'customerId', Header: 'Customer Id' },
      {
        accessor: 'variationAmount',
        Header: 'Variation Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'startDate', Header: 'Start Date' },
      { accessor: 'resumeDate', Header: 'Resume Date' },
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
        <ReactTable
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

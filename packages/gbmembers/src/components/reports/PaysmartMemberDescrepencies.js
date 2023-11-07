import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactToPrint from 'react-to-print';
import SVGInline from 'react-svg-inline';
import printerIcon from '../../images/Print.svg?raw';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

export class PaysmartMemberDescrepencies extends Component {
  constructor(props) {
    super(props);
    let data = [];
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.billingCustomers) {
      this.setState({
        data: this.getData(this.props.members, nextProps.billingCustomers),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchBillingCustomers({
      setBillingCustomers: this.props.setBillingCustomers,
      useSubAccount:
        getAttributeValue(this.props.space, 'PaySmart SubAccount') === 'YES'
          ? true
          : false,
    });
  }

  getData(members, billingData) {
    if (
      !members ||
      members.length <= 0 ||
      !billingData ||
      billingData.length <= 0
    ) {
      return [];
    }

    const data = [];
    billingData.forEach(billingCustomer => {
      let member = members.find(member => {
        return (
          member.values['Billing Customer Id'] === billingCustomer.customerId
        );
      });
      if (
        member !== undefined &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Status'] !== billingCustomer.status
      ) {
        data[data.length] = {
          _id: billingCustomer.customerId,
          firstName: billingCustomer.firstName,
          lastName: billingCustomer.lastName,
          customerId: billingCustomer.customerId,
          memberStatus: member.values['Status'],
          paysmartStatus: billingCustomer.status,
          lastPaymentDate: member.values['Last Payment Date'],
          resumeDate: member.values['Resume Date'],
        };
      }
    });
    members.forEach(member => {
      if (
        member.values['Status'] !== 'Casual' &&
        member.values['Non Paying'] !== 'YES' &&
        member.values['Status'] !== 'Inactive' &&
        (member.values['Membership Cost'] === undefined ||
          member.values['Membership Cost'] === '') &&
        (member.values['Billing Parent Member'] === undefined ||
          member.values['Billing Parent Member'] === '')
      ) {
        data[data.length] = {
          _id: '',
          firstName: member.values['First Name'],
          lastName: member.values['Last Name'],
          customerId: '',
          memberStatus: member.values['Status'],
          paysmartStatus: 'Orphan',
          lastPaymentDate: '',
          resumeDate: '',
        };
      }
    });

    return data;
  }

  getColumns(data) {
    const columns = [
      { width: '150', accessor: 'firstName', Header: 'First Name' },
      { width: '150', accessor: 'lastName', Header: 'Last Name' },
      { width: '150', accessor: 'memberStatus', Header: 'Member Status' },
      { width: '150', accessor: 'paysmartStatus', Header: 'PaySmart Status' },
      {
        width: '170',
        accessor: 'lastPaymentDate',
        Header: 'Last Payment Date',
      },
      { width: '150', accessor: 'resumeDate', Header: 'Resume Date' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.billingCustomersLoading ? (
      <div>Loading information ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Member PaySmart Descrepencies</h6>
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
          width="100%"
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

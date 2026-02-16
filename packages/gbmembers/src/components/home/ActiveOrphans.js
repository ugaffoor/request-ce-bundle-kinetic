import React, { Component } from 'react';
import moment from 'moment';
import { KappNavLink as NavLink } from 'common';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import {
  validOverdue,
  getLastBillingStartDate,
  isBamboraFailedPayment,
} from '../Member/MemberUtils';
import ReactToPrint from 'react-to-print';
import ReactTable from 'react-table';

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class ActiveOrphans extends React.Component {
  constructor(props) {
    super(props);
    this.successfulPaymentHistory = this.props.successfulPaymentHistory;
    this.getColumns = this.getColumns.bind(this);
    let data = this.getData(
      this.successfulPaymentHistory,
      this.props.allMembers,
    );
    let columns = this.getColumns();
    this.locale = this.props.locale;

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );
    this.tableComponentRef = React.createRef();

    this.state = {
      data,
      total: 0,
      columns,
    };
  }

  componentDidMount() {}

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.SUCCESSFULpaymentHistory) {
      this.successfulPaymentHistory = nextProps.successfulPaymentHistory;

      var data = this.getData(
        this.successfulPaymentHistory,
        nextProps.allMembers,
      );

      this.setState({
        data: data,
      });
    }
  }
  isRecurringPayment(payment, members) {
    if (
      payment['paymentReference'] !== null &&
      payment['paymentReference'] !== undefined &&
      payment['paymentReference'].trim() !== ''
    )
      return undefined;
    var idx = members.findIndex(
      member =>
        member.values['Billing Customer Id'] !== undefined &&
        member.values['Billing Customer Id'] !== null &&
        member.values['Billing Customer Id'] !== '' &&
        member.values['Billing Customer Id'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }
  isAdditionalServicePayment(payment, members) {
    if (
      payment['paymentReference'] === null ||
      payment['paymentReference'] === undefined ||
      payment['paymentReference'] === ''
    )
      return undefined;
    var idx = members.findIndex(
      member =>
        member.values['Member ID'] === payment['yourSystemReference'] ||
        member.values['Billing Customer Id'] === payment['yourSystemReference'],
    );

    if (idx !== -1) return members[idx];
    return undefined;
  }
  isRegistrationFeePayment(payment, members) {
    if (
      payment['paymentSource'] === 'Member Registration Fee' ||
      payment['paymentSource'] === 'Manual Registration Fee'
    ) {
      var idx = members.findIndex(
        member =>
          member.values['Member ID'] === payment['yourSystemReference'] ||
          member.values['Billing Customer Id'] ===
            payment['yourSystemReference'],
      );

      if (idx !== -1) return members[idx];
    }
    return undefined;
  }
  getData(successfulPayments, members) {
    let orphanPayments = [];
    successfulPayments.forEach(payment => {
      if (
        !this.isRecurringPayment(payment, members) &&
        !this.isAdditionalServicePayment(payment, members) &&
        !this.isRegistrationFeePayment(payment, members) &&
        payment.paymentStatus !== 'Refund' &&
        payment.paymentSource?.indexOf('POS') === -1 &&
        payment.paymentAmount !== 0
      ) {
        orphanPayments.push(payment);
      }
    });

    return orphanPayments;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'paymentID',
        Header: 'paymentID',
        width: 200,
      },
      {
        accessor: 'debitDate',
        Header: 'Last Failed Date',
        width: 150,
        Cell: props => moment(props.value, ezidebit_date_format).format('L'),
      },
      {
        accessor: 'paymentStatus',
        Header: 'paymentStatus',
        width: 200,
      },
      {
        accessor: 'paymentReference',
        Header: 'paymentReference',
        width: 200,
      },
      {
        accessor: 'yourSystemReference',
        Header: 'yourSystemReference',
        width: 200,
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
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.SUCCESSFULpaymentHistoryLoading ? (
      <div>Loading Payment History ...</div>
    ) : (
      <div>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <div>
            <div style={{ float: 'left' }}>
              <ReactToPrint
                trigger={() => (
                  <PrinterIcon className="icon icon-svg tablePrint" />
                )}
                content={() => this.tableComponentRef.current}
                onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
              />
            </div>
            <h6>Orphan Payments</h6>
            <span>
              Payments that we need to investigate as likely orphaned.
            </span>
          </div>
          <ReactTable
            ref={this.tableComponentRef}
            columns={columns}
            data={data}
            className="-striped -highlight"
          />
        </div>
      </div>
    );
  }
}

import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment-timezone';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';
import downloadIcon from '../../images/download.svg?raw';
import SVGInline from 'react-svg-inline';
import { CSVLink } from 'react-csv';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference, getTimezoneOff } from '../Member/MemberUtils';
import { getTimezone } from '../leads/LeadsUtils';
import { Utils } from 'common';
import ReactSpinner from 'react16-spinjs';

var compThis = undefined;

export class StripeMembershipTransactions extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;

    moment.locale(this.locale);
    moment.tz.setDefault(this.props.space.defaultTimezone);

    var lastMembershipExportedEndDate = this.getCookie(
      'lastMembershipExportedEndDate',
    );
    if (lastMembershipExportedEndDate !== '') {
      lastMembershipExportedEndDate =
        'Lasted membership exported date: ' +
        moment(lastMembershipExportedEndDate, 'YYYY-MM-DD').format('L');
    }
    this.getData = this.getData.bind(this);
    this.getColumns = this.getColumns.bind(this);
    let data = [];

    let tax1Label = Utils.getAttributeValue(props.space, 'TAX 1 Label');
    let tax1Value = Utils.getAttributeValue(props.space, 'TAX 1 Value');
    if (tax1Value !== undefined) {
      tax1Value = parseFloat(tax1Value);
    }

    let tax2Label = Utils.getAttributeValue(props.space, 'TAX 2 Label');
    let tax2Value = Utils.getAttributeValue(props.space, 'TAX 2 Value');
    if (tax2Value !== undefined) {
      tax2Value = parseFloat(tax2Value);
    }

    this.state = {
      data,
      week: '1',
      startDate: undefined,
      lastMembershipExportedEndDate: lastMembershipExportedEndDate,
      currency: Utils.getAttributeValue(props.space, 'Currency'),
      loading: false,
      tax1Label: tax1Label,
      tax1Value: tax1Value,
      tax2Label: tax2Label,
      tax2Value: tax2Value,
    };
  }
  setCookie(c_name, value, exdays) {
    var exdate = new Date();
    exdate.setDate(exdate.getDate() + exdays);
    var c_value =
      value + (exdays == null ? '' : '; expires=' + exdate.toUTCString());
    document.cookie = c_name + '=' + c_value;
  }

  getCookie(c_name) {
    var i,
      x,
      y,
      ARRcookies = document.cookie.split(';');
    for (i = 0; i < ARRcookies.length; i++) {
      x = ARRcookies[i].substr(0, ARRcookies[i].indexOf('='));
      y = ARRcookies[i].substr(ARRcookies[i].indexOf('=') + 1);
      x = x.replace(/^\s+|\s+$/g, '');
      if (x == c_name) {
        return y;
      }
    }
    return '';
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.SUCCESSFULpaymentHistoryLoading) {
      let data = this.getData(
        nextProps.SUCCESSFULpaymentHistory,
        nextProps.allMembers,
      );

      this.setState({
        data: data,
        loading: false,
      });
    }
  }

  UNSAFE_componentWillMount() {}

  loadData(startDate) {
    var dateFrom = moment(startDate).format('YYYY-MM-DD');

    this.props.fetchPaymentHistory({
      paymentType: 'SUCCESSFUL',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: dateFrom,
      dateTo: moment()
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_successful',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
      timezone: getTimezone(
        this.props.profile.timezone,
        this.props.space.defaultTimezone,
      ),
    });

    this.setState({
      loading: true,
    });
  }
  getDate(dateVal) {
    // return dateVal.substring(0,10); Used to emulate results as being run in UK
    dateVal = dateVal.replace(' ', 'T').concat('T');
    var dt =
      dateVal !== undefined
        ? moment(dateVal, 'YYYY-MM-DDTHH:mm:ssZ').format('YYYY-MM-DD')
        : '';

    if (dt === 'Invalid date') {
      dt =
        dateVal !== undefined
          ? moment(dateVal, 'YYYY-MM-DDTHH:mm:sssZ').format('YYYY-MM-DD')
          : '';
    }
    return dt;
  }

  getData(paymentHistory, allMembers) {
    let data = [];

    paymentHistory.forEach((payment, idx) => {
      if (payment['paymentStatus'] === 'paid') {
        let date = this.getDate(payment['debitDate']);
        let amount = parseFloat(payment['paymentAmount'].toFixed(2));
        let subTotal =
          Number(payment['paymentAmount']) /
          (1 +
            (this.state.tax1Value !== undefined ? this.state.tax1Value : 0) +
            (this.state.tax2Value !== undefined ? this.state.tax2Value : 0));
        let fee = -parseFloat(payment['transactionFeeClient'].toFixed(2));
        let member = allMembers.find(
          member =>
            member.values['Billing Customer Id'] ===
            payment['yourSystemReference'],
        );
        if (member === undefined) {
          member = {
            values: {
              'First Name': 'Unknown',
              'Last Name': 'Unknown',
              Address: 'Unknown',
              Suburb: '',
              State: '',
              Postcode: '',
              'Billing Payment Type': '',
            },
          };
        }
        data.push({
          date: date,
          subTotal: subTotal,
          amount: amount,
          fee: fee,
          member: member,
        });
      }
    });

    data = data.sort((a, b) => {
      let aDate = moment(a.date, 'YYYY-MM-DD');
      let bDate = moment(b.date, 'YYYY-MM-DD');
      if (aDate.isBefore(bDate)) {
        return -1;
      } else if (aDate.isAfter(bDate)) {
        return 1;
      }
      return 0;
    });
    return data;
  }

  getColumns() {
    const columns = [
      {
        accessor: 'name',
        Header: 'Full name',
        Cell: props => {
          return (
            props.original.member.values['First Name'] +
            ' ' +
            props.original.member.values['Last Name']
          );
        },
        width: 100,
      },
      {
        accessor: 'address',
        Header: 'Address',
        Cell: props => {
          return (
            props.original.member.values['Address'] +
            ' ' +
            props.original.member.values['Suburb'] +
            ' ' +
            props.original.member.values['State'] +
            ' ' +
            props.original.member.values['Postcode']
          );
        },
        width: 100,
      },
      {
        accessor: 'date',
        Header: 'Date of transaction',
        Cell: props => {
          return moment(props.original.date).format('L');
        },
        width: 100,
      },
      {
        accessor: 'documentType',
        Header: 'Document Type',
        width: 0,
      },
      {
        accessor: 'paymentMethod',
        Header: 'Payment Method',
        Cell: props => {
          return props.original.member.values['Billing Payment Type'];
        },
        width: 100,
      },
      {
        accessor: 'description',
        Header: 'Description',
        Cell: props => {
          return (
            moment(props.original.date).format('MMMM YYYY') + ' Membership'
          );
        },
        width: 100,
      },
      {
        accessor: 'quantity',
        Header: 'Quantity',
        Cell: props => {
          return '1';
        },
        width: 100,
      },
      {
        accessor: 'unitPrice',
        Header: 'Unit Price',
        Cell: props => {
          let amount = props.original.subTotal;
          return Number(amount).toFixed(2);
        },
        width: 100,
      },
      this.state.tax1Value !== undefined && {
        accessor: 'tax1',
        Header: 'Tax 1 Rate',
        Cell: props => {
          return this.state.tax1Label;
        },
        width: 100,
      },
      this.state.tax1Value !== undefined && {
        accessor: 'tax1Amount',
        Header: 'Tax 1 Amount',
        Cell: props => {
          let amount = props.original.subTotal;
          return Number(amount * this.state.tax1Value).toFixed(2);
        },
        width: 100,
      },
      this.state.tax2Value !== undefined && {
        accessor: 'tax2',
        Header: 'Tax 2 Rate',
        Cell: props => {
          return this.state.tax2Label;
        },
        width: 100,
      },
      this.state.tax2Value !== undefined && {
        accessor: 'tax2Amount',
        Header: 'Tax 2 Amount',
        Cell: props => {
          let amount = props.original.subTotal;
          return Number(amount * this.state.tax2Value).toFixed(2);
        },
        width: 100,
      },
      {
        accessor: 'total',
        Header: 'Total',
        Cell: props => {
          let amount = Number(props.original.amount).toFixed(2);
          return amount;
        },
        width: 100,
      },
      {
        accessor: 'currency',
        Header: 'Currency',
        Cell: props => {
          return this.state.currency;
        },
        width: 100,
      },
    ].filter(Boolean);
    return columns;
  }

  getDownloadData() {
    let data = this.getData(
      this.props.SUCCESSFULpaymentHistory,
      this.props.allMembers,
    );

    let columns = [
      'Full name',
      'Address',
      'Date of transaction',
      'Document Type',
      'Payment Method',
      'Description',
      'Quantity',
      'Unit Price',
    ];
    if (this.state.tax1Value !== undefined) {
      columns = columns.concat(['Tax 1 Rate', 'Tax 1 Amount']);
    }
    if (this.state.tax2Value !== undefined) {
      columns = columns.concat(['Tax 2 Rate', 'Tax 2 Amount']);
    }
    columns = columns.concat(['Total', 'Currency']);

    let download = [columns];
    let lastDate;
    data.forEach(element => {
      let row = [];
      let amount = element.amount;
      amount = Number(amount).toFixed(2);

      row.push(
        element.member.values['First Name'] +
          ' ' +
          element.member.values['Last Name'],
        element.member.values['Address'] +
          ' ' +
          element.member.values['Suburb'] +
          ' ' +
          element.member.values['State'] +
          ' ' +
          element.member.values['Postcode'],
        moment(element.date).format('L'),
        '',
        element.member.values['Billing Payment Type'],
        moment(element.date).format('MMMM YYYY') + ' Membership',
        '1',
        amount,
      );
      if (this.state.tax1Value !== undefined) {
        row.push(this.state.tax1Label, this.state.tax1Value);
      }
      if (this.state.tax2Value !== undefined) {
        row.push(this.state.tax2Label, this.state.tax2Value);
      }
      row.push(element.amount, this.state.currency);
      download.push(row);
      if (
        lastDate === undefined ||
        lastDate.isBefore(moment(element['date']), 'day')
      ) {
        lastDate = moment(element['date']);
      }
    });

    if (lastDate !== undefined) {
      this.setCookie(
        'lastMembershipExportedEndDate',
        lastDate.format('YYYY-MM-DD'),
        365,
      );
    }
    return download;
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Membership Transactions By Day</h6>
        </div>
        <div className="lastMembershipExportedEndDate">
          <input
            name="lastMembershipExportedEndDate"
            type="text"
            disabled
            value={this.state.lastMembershipExportedEndDate}
          />
        </div>
        <div className="daysOut">
          <label htmlFor="fromDate" className="control-label">
            From Date
          </label>
          <DayPickerInput
            name="fromDate"
            id="fromDate"
            placeholder={moment(new Date())
              .locale(getLocalePreference(this.props.space, this.props.profile))
              .localeData()
              .longDateFormat('L')
              .toLowerCase()}
            formatDate={formatDate}
            parseDate={parseDate}
            value={
              this.state.startDate !== undefined
                ? this.state.startDate.toDate()
                : ''
            }
            onDayChange={function(selectedDay, modifiers, dayPickerInput) {
              compThis.setState({
                startDate: moment(selectedDay),
              });
              compThis.loadData(moment(selectedDay));
            }}
            dayPickerProps={{
              locale: getLocalePreference(this.props.space, this.props.profile),
              localeUtils: MomentLocaleUtils,
            }}
          />
        </div>
        <div>
          <div id="spinner-container">
            {this.state.loading &&
              this.props.SUCCESSFULpaymentHistoryLoading && <ReactSpinner />}
          </div>
          <ReactToPrint
            trigger={() => (
              <SVGInline svg={printerIcon} className="icon tablePrint" />
            )}
            content={() => this.tableComponentRef}
          />
          <CSVLink
            className="downloadbtn"
            filename={moment().format('L') + '-billing-transactions.csv'}
            data={this.getDownloadData()}
          >
            <SVGInline svg={downloadIcon} className="icon tableDownload" />
          </CSVLink>
          <ReactTable
            ref={el => (this.tableComponentRef = el)}
            columns={this.getColumns()}
            data={data}
            className="-striped -highlight"
            defaultPageSize={data.length > 0 ? data.length : 2}
            pageSize={data.length > 0 ? data.length : 2}
            showPagination={false}
          />
        </div>
      </span>
    );
  }
}

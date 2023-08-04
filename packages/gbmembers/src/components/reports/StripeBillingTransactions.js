import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
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
import { MOMENT_FORMATS } from 'common/src/constants';

var compThis = undefined;

export class StripeBillingTransactions extends Component {
  constructor(props) {
    super(props);
    compThis = this;

    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;

    moment.locale(this.locale);
    moment.tz.setDefault(this.props.space.defaultTimezone);

    var lastExportedEndDate = this.getCookie('lastExportedEndDate');
    if (lastExportedEndDate !== '') {
      lastExportedEndDate =
        'Lasted exported date: ' +
        moment(lastExportedEndDate, 'YYYY-MM-DD').format('L');
    }
    this.getData = this.getData.bind(this);
    let data = [];
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
      week: '1',
      startDate: undefined,
      lastExportedEndDate: lastExportedEndDate,
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
    if (
      !nextProps.SUCCESSFULpaymentHistoryLoading &&
      !nextProps.posOrdersLoading &&
      !nextProps.customerRefundsLoading
    ) {
      let data = this.getData(
        nextProps.SUCCESSFULpaymentHistory,
        nextProps.posOrders,
        nextProps.customerRefunds,
      );

      this.setState({
        data: data,
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
    });
    this.props.fetchPaymentHistory({
      paymentType: 'FAILED',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: dateFrom,
      dateTo: moment()
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setPaymentHistory: this.props.setPaymentHistory,
      internalPaymentType: 'client_failed',
      addNotification: this.props.addNotification,
      setSystemError: this.props.setSystemError,
    });
    this.props.fetchPOSOrders({
      dateFrom: moment(startDate),
      dateTo: moment(),
      timezoneOffset: getTimezoneOff(),
    });
    this.props.fetchCustomerRefunds({
      dateFrom: dateFrom,
      dateTo: moment()
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setCustomerRefunds: this.props.setCustomerRefunds,
      setSystemError: this.props.setSystemError,
      addNotification: this.props.addNotification,
      /*      timezoneOffset: getTimezoneOff(), */
    });
  }
  getDate(dateVal) {
    // return dateVal.substring(0,10); Used to emulate results as being run in UK
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

  getData(paymentHistory, posOrders, customerRefunds) {
    let dataMap = new Map();

    paymentHistory.forEach((payment, idx) => {
      let date = this.getDate(payment['debitDate']);
      let item = dataMap.get(date);
      let amount = payment['paymentAmount'].toFixed(2);
      //console.log(","+payment['debitDate']+","+date+","+amount+",");
      if (item === undefined) {
        dataMap.set(date, { fees: amount });
      } else {
        item.fees = item.fees + amount;
        dataMap.set(date, item);
      }
    });

    posOrders.forEach((order, idx) => {
      if (
        order['values']['Payment Type'] === 'capture' ||
        order['values']['Payment Type'] === 'creditcard'
      ) {
        let date = this.getDate(order['values']['Date time processed']);
        let item = dataMap.get(date);
        let amount = parseFloat(order['values']['Total']);
        let refund = parseFloat(
          order['values']['Refund'] !== undefined
            ? order['values']['Refund']
            : 0,
        );
        //console.log(","+order['values']['Date time processed']+","+date+","+amount+","+order['values']['Transaction ID']);
        amount = amount - refund;
        if (item === undefined) {
          dataMap.set(date, { pos: amount });
        } else {
          if (item.pos !== undefined) {
            item.pos = item.pos + amount;
          } else {
            item.pos = amount;
          }
          dataMap.set(date, item);
        }
      } else if (order['values']['Payment Type'] === 'cash') {
        let date = this.getDate(order['values']['Date time processed']);
        let amount = parseFloat(order['values']['Total']);
        let refund = parseFloat(
          order['values']['Refund'] !== undefined
            ? order['values']['Refund']
            : 0,
        );
        amount = amount - refund;
        let item = dataMap.get(date);
        if (item === undefined) {
          dataMap.set(date, { cash: amount });
        } else {
          if (item.cash !== undefined) {
            item.cash = item.cash + amount;
          } else {
            item.cash = amount;
          }
          dataMap.set(date, item);
        }
      }
    });

    let data = [];
    dataMap.forEach((value, key) => {
      let feesRow = [];
      if (value.fees !== undefined) {
        feesRow.push({
          date: key,
          description: 'Total value of fees',
          value: value.fees,
        });
      }
      let posRow = [];
      if (value.pos !== undefined) {
        posRow.push({
          date: key,
          description: 'Total card sales for day',
          value: value.pos,
        });
      }
      let cashRow = [];
      if (value.cash !== undefined) {
        cashRow.push({
          date: key,
          description: 'Total value of Cash',
          value: value.cash,
        });
      }
      if (feesRow.length > 0) {
        data.push(feesRow.flatten()[0]);
      }
      if (posRow.length > 0) {
        data.push(posRow.flatten()[0]);
      }
      if (cashRow.length > 0) {
        data.push(cashRow.flatten()[0]);
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

  getColumns(data) {
    const columns = [
      {
        accessor: 'date',
        Header: 'Date',
        Cell: props => {
          return moment(props.original.date).format('L');
        },
        width: 100,
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 300,
      },
      {
        accessor: 'value',
        Header: 'Value',
        Cell: props => {
          return parseFloat(props.original.value).toFixed(2);
        },
        width: 100,
      },
    ];
    return columns;
  }

  getDownloadData() {
    let data = this.getData(
      this.props.SUCCESSFULpaymentHistory,
      this.props.posOrders,
      this.props.customerRefunds,
    );

    let download = [['Date', 'Description', 'Value']];
    let lastDate;
    data.forEach(element => {
      let row = [];
      row.push(
        moment(element['date']).format('L'),
        element['description'],
        parseFloat(element['value']).toFixed(2),
      );
      download.push(row);
      if (
        lastDate === undefined ||
        lastDate.isBefore(moment(element['date']), 'day')
      ) {
        lastDate = moment(element['date']);
      }
    });

    if (lastDate !== undefined) {
      this.setCookie('lastExportedEndDate', lastDate.format('YYYY-MM-DD'), 365);
    }
    return download;
  }
  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Billing Transactions By Day</h6>
        </div>
        <div className="lastExportedEndDate">
          <input
            name="lastExportedEndDate"
            type="text"
            disabled
            value={this.state.lastExportedEndDate}
          ></input>
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

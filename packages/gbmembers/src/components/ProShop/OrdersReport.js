import React, { Component } from 'react';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import $ from 'jquery';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import { getCurrency } from '../Member/MemberUtils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { I18n } from '../../../../app/src/I18nProvider';
import { actions } from '../../redux/modules/members';
import { actions as posActions } from '../../redux/modules/pos';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import SVGInline from 'react-svg-inline';
import crossIcon from '../../images/cross.svg?raw';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';
import downloadIcon from '../../images/download.svg?raw';
import { CSVLink } from 'react-csv';

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  profile: state.member.app.profile,
  space: state.member.app.space,
  posOrdersLoading: state.member.pos.posOrdersLoading,
  posOrders: state.member.pos.posOrders,
});

const mapDispatchToProps = {
  fetchPOSOrders: posActions.fetchPOSOrders,
};

var compThis = undefined;

export class OrdersReport extends Component {
  handleClose = () => {
    var lastActive = this.state.lastActive;
    $('.dateSettings button[active=true]').attr('active', 'false');
    $(lastActive).attr('active', 'true');
    this.setState({
      isShowCustom: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    compThis = this;
    this.getColumns = this.getColumns.bind(this);
    this.getSalesTaxLabel = this.getSalesTaxLabel.bind(this);
    this.getSalesTaxLabel2 = this.getSalesTaxLabel2.bind(this);
    this.getPersonType = this.getPersonType.bind(this);
    this.getDownloadData = this.getDownloadData.bind(this);

    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;
    moment.locale(this.locale);

    this.currency = getAttributeValue(this.props.space, 'Currency');
    if (this.currency === undefined) this.currency = 'USD';
    if (this.currency === undefined) {
      this.currencySymbol = '$';
    } else {
      this.currencySymbol = getCurrency(this.currency)['symbol'];
    }

    this.setFromDate = moment().date(1);
    this.setToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let repFromDate = this.setFromDate;
    let repToDate = this.setToDate;
    this.paymentHistory = [];
    let data = this.getData([]);
    let columns = this.getColumns();

    this.state = {
      columns,
      allMembers: this.props.members,
      data,
      total: 0,
      discountTotal: 0,
      salestaxTotal: 0,
      salestax2Total: 0,
      refundTotal: 0,
      repFromDate,
      repToDate,
      repPeriod: 'monthly',
      repViewPeriod: 'this_period',
      showRepAccountHolders: false,
      expandedRows: {},
    };

    this.productColumns = [
      {
        Header: 'Name',
        accessor: 'name',
        width: 400,
      },
      {
        Header: 'Size',
        accessor: 'size',
      },
      {
        Header: 'Colour',
        accessor: 'colour',
      },
      {
        Header: 'Price',
        accessor: 'price',
        Cell: props => {
          return props.original.price === undefined ? (
            <div />
          ) : (
            <div
              className={
                props.original.status === 'refunded'
                  ? 'dollarValue'
                  : 'dollarValue'
              }
            >
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.price)}
            </div>
          );
        },
      },
      {
        Header: 'Quantity',
        accessor: 'quantity',
      },
    ];
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.posOrdersLoading) {
      this.posOrders = [];
      nextProps.posOrders.forEach((item, i) => {
        this.posOrders[this.posOrders.length] = item;
      });
      let data = this.getData(this.posOrders, this.props.posProducts);
      var total = 0;
      var discountTotal = 0;
      var salestaxTotal = 0;
      var salestax2Total = 0;
      var refundTotal = 0;
      data.forEach((item, i) => {
        total += item.total;
        discountTotal += item.discount;
        salestaxTotal += item.salestax;
        salestax2Total += item.salestax2;
        refundTotal += item.refund;
      });

      this.setState({
        allMembers: nextProps.members,
        data,
        total,
        discountTotal,
        salestaxTotal,
        salestax2Total,
        refundTotal,
      });
    }
  }

  componentDidMount() {
    this.props.fetchPOSOrders({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
    });
  }

  refreshData(fromDate, toDate) {
    this.props.fetchPOSOrders({
      dateFrom: fromDate,
      dateTo: toDate,
    });
  }
  getProductsOrdered(checkoutJSON) {
    var products = [];
    checkoutJSON.products.forEach((product, i) => {
      products[products.length] = {};
    });
  }
  getTotalValue(item) {
    if (getAttributeValue(this.props.space, 'POS System') === 'Bambora') {
      if (
        item.values['Sales Tax'] !== undefined &&
        item.values['Sales Tax'] !== null
      ) {
        return (
          Number.parseFloat(item.values['Total']) -
          Number.parseFloat(item.values['Sales Tax'])
        );
      }
      return Number.parseFloat(item.values['Total']);
    } else {
      return Number.parseFloat(item.values['Total']);
    }
  }
  getDate(dateVal) {
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

  getData(posOrders, posProducts) {
    if (!posOrders || posOrders.length <= 0) {
      return [];
    }
    var data = [];
    var products = [];
    posOrders.forEach((item, i) => {
      //    var idx = data.findIndex(
      //      dataItem => dataItem.key === item.values['Person ID'],
      //    );
      //    idx=-1;
      //    if (idx === -1) {
      products = JSON.parse(item.values['POS Checkout JSON'])['Checkout Items']
        .products;
      var changeProds =
        item.values['Status'] === 'Ordered'
          ? products !== undefined
            ? products
            : []
          : products !== undefined
          ? products.forEach((prod, i) => {
              prod['name'] = prod['name'];
              prod['status'] = 'refunded';
            })
          : [];

      data[data.length] = {
        key: item.values['Person ID'],
        date: this.getDate(item.values['Date time processed']),
        name: item.values['Person Name'],
        total: this.getTotalValue(item),
        discount:
          item.values['Discount'] !== undefined &&
          item.values['Discount'] !== null
            ? Number.parseFloat(item.values['Discount'])
            : 0,
        salestax:
          item.values['Sales Tax'] !== undefined &&
          item.values['Sales Tax'] !== null
            ? Number.parseFloat(item.values['Sales Tax'])
            : 0,
        salestax2:
          item.values['Sales Tax 2'] !== undefined &&
          item.values['Sales Tax 2'] !== null
            ? Number.parseFloat(item.values['Sales Tax 2'])
            : 0,
        refund:
          item.values['Refund'] !== undefined && item.values['Refund'] !== null
            ? Number.parseFloat(item.values['Refund'])
            : 0,
        paymenttype:
          item.values['Payment Type'] === 'cash' ? 'Cash' : 'Credit Card',
        products: products,
      };
    });

    data
      .sort((a, b) => {
        let aDate = moment(a.date, 'YYYY-MM-DD');
        let bDate = moment(b.date, 'YYYY-MM-DD');
        if (aDate.isBefore(bDate)) {
          return -1;
        } else if (aDate.isAfter(bDate)) {
          return 1;
        }
        return 0;
      })
      .map(item => {
        return {
          name: item.name,
          total: item.total,
        };
      });
    return data;
  }

  getDownloadData() {
    let data = this.state.data;

    let header = [];
    header.push('Date');
    header.push('Name');
    header.push('Total');
    header.push('Discount');
    header.push(this.getSalesTaxLabel());
    if (
      getAttributeValue(this.props.space, 'POS Sales Tax Label 2') !== undefined
    ) {
      header.push(this.getSalesTaxLabel2());
    }
    header.push('Refund');
    header.push('Payment Type');
    header.push('Product');
    header.push('Size');
    header.push('Colour');
    header.push('Price');
    header.push('Quantity');

    let download = [];
    download.push(header.flatten());

    let header2 = [];
    header2.push('');
    header2.push('Product');
    header2.push('Size');
    header2.push('Colour');
    header2.push('Price');
    header2.push('Quantity');
    //    download.push(header2.flatten());

    data.forEach(element => {
      let row = [];
      row.push(moment(element['date'], 'YYYY-MM-DD').format('L'));
      row.push(element['name']);
      row.push(
        element['total'] !== undefined
          ? parseFloat(element['total']).toFixed(2)
          : '',
      );
      row.push(
        element['discount'] !== undefined
          ? parseFloat(element['discount']).toFixed(2)
          : '',
      );
      row.push(
        element['salestax'] !== undefined
          ? parseFloat(element['salestax']).toFixed(2)
          : '',
      );
      if (
        getAttributeValue(this.props.space, 'POS Sales Tax Label 2') !==
        undefined
      ) {
        row.push(element['salestax2'].toFixed(2));
      }
      row.push(
        element['refund'] !== undefined
          ? parseFloat(element['refund']).toFixed(2)
          : '',
      );
      row.push(element['paymenttype']);
      if (element.products !== undefined && element.products.length > 0) {
        row.push(element.products[0]['name']);
        row.push(element.products[0]['size']);
        row.push(element.products[0]['colour']);
        row.push(element.products[0]['price']);
        row.push(element.products[0]['quantity']);
      }

      download.push(row.flatten());

      if (element.products !== undefined && element.products.length > 1) {
        element.products.forEach((prod, idx) => {
          if (idx > 0) {
            let pRow = [];
            pRow.push('');
            pRow.push('');
            pRow.push('');
            pRow.push('');
            pRow.push('');
            pRow.push('');
            pRow.push('');
            pRow.push(prod['name']);
            pRow.push(prod['size']);
            pRow.push(prod['colour']);
            pRow.push(prod['price']);
            pRow.push(prod['quantity']);
            download.push(pRow.flatten());
          }
        });
      }
    });

    return download;
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: moment(event.target.value),
    });
  }

  handleSubmit(event) {
    if (!this.state.repFromDate || !this.state.repToDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        isShowCustom: false,
        repFromDate: this.state.repFromDate,
        repToDate: this.state.repToDate,
      });
      this.refreshData(this.state.repFromDate, this.state.repToDate);
    }
  }
  setReportDates(e, repViewPeriod, repPeriod) {
    let fromDate = moment();
    let toDate = moment();
    if (repViewPeriod === 'this_period') {
      if (repPeriod === 'weekly') {
        fromDate.day(1);
      }
      if (repPeriod === 'fortnightly') {
        fromDate.day(1);
      }
      if (repPeriod === 'monthly') {
        fromDate.date(1);
      }

      fromDate.hour(0).minute(0);
      if (repPeriod === 'weekly') {
        toDate
          .day(1)
          .add(1, 'weeks')
          .subtract(1, 'days');
      }
      if (repPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (repPeriod === 'monthly') {
        toDate
          .date(1)
          .add(1, 'months')
          .subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'next_period') {
      if (repPeriod === 'weekly') {
        fromDate.add(1, 'weeks').day(1);
      }
      if (repPeriod === 'fortnightly') {
        fromDate.add(2, 'weeks').day(1);
      }
      if (repPeriod === 'monthly') {
        fromDate.add(1, 'months').date(1);
      }
      fromDate.hour(0).minute(0);
      if (repPeriod === 'weekly') {
        toDate
          .day(1)
          .add(2, 'weeks')
          .subtract(1, 'days');
      }
      if (repPeriod === 'fortnightly') {
        toDate
          .day(1)
          .add(4, 'weeks')
          .subtract(1, 'days');
      }
      if (repPeriod === 'monthly') {
        toDate
          .date(1)
          .add(2, 'months')
          .subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'last_period') {
      if (repPeriod === 'weekly') {
        fromDate.subtract(1, 'weeks').day(1);
      }
      if (repPeriod === 'fortnightly') {
        fromDate.subtract(2, 'weeks').day(1);
      }
      if (repPeriod === 'monthly') {
        fromDate.subtract(1, 'months').date(1);
      }
      fromDate.hour(0).minute(0);
      if (repPeriod === 'weekly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repPeriod === 'fortnightly') {
        toDate.day(1).subtract(1, 'days');
      }
      if (repPeriod === 'monthly') {
        toDate.date(1).subtract(1, 'days');
      }
      toDate.hour(23).minute(59);
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: false,
        repFromDate: fromDate,
        repToDate: toDate,
      });
      this.refreshData(fromDate, toDate);
    } else if (repViewPeriod === 'custom') {
      var lastActive = $('.dateSettings button[active=true]');
      $('.dateSettings button[active=true]').attr('active', 'false');
      $(e.target).attr('active', 'true');
      this.setState({
        isShowCustom: true,
        lastDateRange: this.state.dateRange,
        lastActive: lastActive,
      });
    }
  }
  getSalesTaxLabel() {
    return getAttributeValue(this.props.space, 'POS Sales Tax Label') ===
      undefined ? (
      <I18n>SALES TAX</I18n>
    ) : (
      getAttributeValue(this.props.space, 'POS Sales Tax Label')
    );
  }
  getSalesTaxLabel2() {
    return getAttributeValue(this.props.space, 'POS Sales Tax Label 2') ===
      undefined ? (
      <I18n>SALES TAX 2</I18n>
    ) : (
      getAttributeValue(this.props.space, 'POS Sales Tax Label 2')
    );
  }
  getPersonType(id) {
    if (this.props.members.findIndex(member => member['id'] === id) !== -1)
      return 'Member';

    return 'Lead';
  }
  getColumns() {
    const columns = [];
    columns.push({
      Header: 'Date',
      accessor: 'date',
      Cell: props => {
        return moment(props.original.date).format('L');
      },
    });
    columns.push({
      accessor: 'name',
      Header: 'Name',
      width: 300,
      Cell: props => {
        return props.original.key === undefined ? (
          <div />
        ) : (
          <NavLink
            to={
              this.getPersonType(props.original.key) === 'Member'
                ? `/Member/${props.original.key}`
                : `/LeadDetail/${props.original.key}`
            }
            className=""
          >
            {props.original.name}
          </NavLink>
        );
      },
    });
    columns.push({
      accessor: 'total',
      Header: 'Total',
      width: 150,
      Cell: props => {
        return props.original.total === undefined ? (
          <div />
        ) : (
          <div className="dollarValue">
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(props.original.total)}
          </div>
        );
      },
      Footer: (
        <span>
          <strong>Total: </strong>
          {this.state !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(this.state.total)
            : 0}
        </span>
      ),
    });
    columns.push({
      accessor: 'discount',
      Header: 'Discount',
      width: 150,
      Cell: props => {
        return props.original.discount === undefined ? (
          <div />
        ) : (
          <div className="dollarValue">
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(props.original.discount)}
          </div>
        );
      },
      Footer: (
        <span>
          <strong>Total: </strong>
          {this.state !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(this.state.discountTotal)
            : 0}
        </span>
      ),
    });
    columns.push({
      accessor: 'salestax',
      Header: this.getSalesTaxLabel(),
      width: 150,
      Cell: props => {
        return props.original.salestax === undefined ? (
          <div />
        ) : (
          <div className="dollarValue">
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(props.original.salestax)}
          </div>
        );
      },
      Footer: (
        <span>
          <strong>Total: </strong>
          {this.state !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(this.state.salestaxTotal)
            : 0}
        </span>
      ),
    });
    if (
      getAttributeValue(this.props.space, 'POS Sales Tax Label 2') !== undefined
    ) {
      columns.push({
        accessor: 'salestax2',
        Header: this.getSalesTaxLabel2(),
        className: 'hidden',
        width: 150,
        Cell: props => {
          return props.original.salestax2 === undefined ||
            props.original.salestax2 === '0' ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.salestax2)}
            </div>
          );
        },
        Footer: (
          <span>
            <strong>Total: </strong>
            {this.state !== undefined
              ? new Intl.NumberFormat(this.locale, {
                  style: 'currency',
                  currency: this.currency,
                }).format(this.state.salestax2Total)
              : 0}
          </span>
        ),
      });
    }
    columns.push({
      accessor: 'refund',
      Header: 'Refund',
      width: 150,
      Cell: props => {
        return props.original.refund === undefined ? (
          <div />
        ) : (
          <div className="dollarValue">
            {new Intl.NumberFormat(this.locale, {
              style: 'currency',
              currency: this.currency,
            }).format(props.original.refund)}
          </div>
        );
      },
      Footer: (
        <span>
          <strong>Total: </strong>
          {this.state !== undefined
            ? new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(this.state.refundTotal)
            : 0}
        </span>
      ),
    });
    columns.push({
      accessor: 'paymenttype',
      Header: 'Payment Type',
      width: 150,
    });

    return columns;
  }

  render() {
    return (
      <span className="purchaseItemsReport">
        <div className="page-header" style={{ textAlign: 'center' }}>
          <div className="dateSettings">
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'last_period',
                });
                this.setReportDates(e, 'last_period', this.state.repPeriod);
              }}
            >
              Last{' '}
              {this.state.repPeriod === 'weekly'
                ? 'Week'
                : this.state.repPeriod === 'fortnightly'
                ? 'Fortnights'
                : 'Month'}
            </button>
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'this_period',
                });
                this.setReportDates(e, 'this_period', this.state.repPeriod);
              }}
            >
              This{' '}
              {this.state.repPeriod === 'weekly'
                ? 'Week'
                : this.state.repPeriod === 'fortnightly'
                ? 'Fortnight'
                : 'Month'}
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                this.setState({
                  repViewPeriod: 'custom',
                });
                this.setReportDates(e, 'custom', this.state.repPeriod);
              }}
            >
              Custom
            </button>
          </div>
          {this.state.isShowCustom && (
            <div
              className="stat_customDatesContainer"
              onClose={this.handleClose}
            >
              <div
                className="purchaseItemsByDateDiv"
                onClose={this.handleClose}
              >
                <div className="col-md-8">
                  <div className="row">
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="fromDate" className="control-label">
                        From Date
                      </label>
                      <DayPickerInput
                        name="fromDate"
                        id="fromDate"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={this.state.repFromDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            repFromDate: moment(selectedDay),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group col-xs-2 mr-1">
                      <label htmlFor="toDate" className="control-label">
                        To Date
                      </label>
                      <DayPickerInput
                        name="toDate"
                        id="toDate"
                        placeholder={moment(new Date())
                          .locale(
                            getLocalePreference(
                              this.props.space,
                              this.props.profile,
                            ),
                          )
                          .localeData()
                          .longDateFormat('L')
                          .toLowerCase()}
                        formatDate={formatDate}
                        parseDate={parseDate}
                        value={this.state.repToDate.toDate()}
                        onDayChange={function(
                          selectedDay,
                          modifiers,
                          dayPickerInput,
                        ) {
                          compThis.setState({
                            repToDate: moment(selectedDay),
                          });
                        }}
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </div>
                    <div className="form-group col-xs-2">
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleClose()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="form-group col-xs-2 submit">
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={e => this.handleSubmit()}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <span className="label">
            {this.state.repFromDate.format('L')} to{' '}
            {this.state.repToDate.format('L')}
          </span>
        </div>
        {this.props.posPurchaseItemsLoading ? (
          <div className="purchaseItemsReport">Loading information ...</div>
        ) : (
          <div className="purchaseItemsReport">
            <div className="reportIcons">
              <ReactToPrint
                trigger={() => (
                  <SVGInline svg={printerIcon} className="icon tablePrint" />
                )}
                content={() => this.tableComponentRef}
              />
              <CSVLink
                className="downloadbtn"
                filename="orders.csv"
                data={this.getDownloadData()}
              >
                <SVGInline svg={downloadIcon} className="icon tableDownload" />
              </CSVLink>
            </div>
            <ReactTable
              ref={el => (this.tableComponentRef = el)}
              columns={this.getColumns()}
              groupBy="paymenttype"
              data={this.state.data}
              className="-striped -highlight"
              defaultPageSize={
                this.state.data.length > 0 ? this.state.data.length : 2
              }
              pageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              showPagination={false}
              expanded={this.state.expandedRows}
              onExpandedChange={(newExpanded, index) => {
                this.setState(oldState => {
                  const itemIndex = index[0];
                  const isExpanded = oldState.expandedRows[itemIndex];
                  const expandedList = [...this.state.expandedRows];
                  expandedList[itemIndex] = !isExpanded;
                  return {
                    expandedRows: expandedList,
                  };
                });
              }}
              SubComponent={row => {
                return (
                  <ReactTable
                    data={row.original.products}
                    columns={this.productColumns}
                    TheadComponent={() => null}
                    defaultPageSize={
                      row.original.products !== undefined &&
                      row.original.products.length > 0
                        ? row.original.products.length
                        : 2
                    }
                    showPagination={false}
                  />
                );
              }}
            />
            <br />
          </div>
        )}
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const OrdersReportContainer = enhance(OrdersReport);

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
    this.getPersonType = this.getPersonType.bind(this);

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
      var refundTotal = 0;
      data.forEach((item, i) => {
        total += item.total;
        discountTotal += item.discount;
        salestaxTotal += item.salestax;
        refundTotal += item.refund;
      });

      this.setState({
        allMembers: nextProps.members,
        data,
        total,
        discountTotal,
        salestaxTotal,
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
        date:
          item.values['Date time processed'] !== undefined
            ? moment(
                item.values['Date time processed'],
                'YYYY-MM-DDTHH:mm:sssZ',
              ).format('L HH:mm')
            : '',
        name: item.values['Person Name'],
        total: Number.parseFloat(item.values['Total']),
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
        refund:
          item.values['Refund'] !== undefined && item.values['Refund'] !== null
            ? Number.parseFloat(item.values['Refund'])
            : 0,
        paymenttype:
          item.values['Payment Type'] === 'cash' ? 'Cash' : 'Credit Card',
        products: products,
      };
      /*  } else {
        data[idx].total =
          data[idx].total + (item.values['Status']==="Ordered" ? Number.parseInt(item.values['Total']) : 0);
        data[idx].discount =
          data[idx].discount + (item.values['Status']==="Ordered" ? Number.parseInt(item.values['Discount']) : 0);
        data[idx].salestax =
          data[idx].salestax + (item.values['Status']==="Ordered" ?  Number.parseInt(item.values['Sales Tax']) : 0);
        data[idx].paymenttype = item.values['Payment Type']==="cash" ? "Cash" : "Credit Card";
        products=JSON.parse(item.values['POS Checkout JSON'])['Checkout Items'].products;
        changeProds=item.values['Status']==="Ordered" ?  (products !== undefined ? products : [])
          : (products !== undefined
                    ? products.forEach((prod, i) => {
                        prod['name']=prod['name']+"(Refunded)";
                        prod['status']='refunded'
                      })
                      : []
            );
        if (products!==undefined && products.length>0){
          products.forEach((prod, i) => {
            data[idx].products.push(prod);
          });
        }
        console.log(data[idx].products.length);

      } */
    });

    data
      .sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        }
        return 0;
      })
      .sort((a, b) => {
        if (a.total < b.total) {
          return -1;
        } else if (a.total > b.total) {
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
  getPersonType(id) {
    if (this.props.members.findIndex(member => member['id'] === id) !== -1)
      return 'Member';

    return 'Lead';
  }
  getColumns() {
    const columns = [
      {
        Header: 'Date',
        accessor: 'date',
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
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
      },
      {
        accessor: 'paymenttype',
        Header: 'Payment Type',
        width: 150,
      },
    ];
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
            <ReactToPrint
              trigger={() => (
                <SVGInline svg={printerIcon} className="icon tablePrint" />
              )}
              content={() => this.tableComponentRef}
            />
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

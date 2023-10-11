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
  leads: state.member.leads.allLeads,
  space: state.member.app.space,
  posPurchaseItemsLoading: state.member.pos.posItemsLoading,
  posPurchaseItems: state.member.pos.posItems,
  posOrdersPILoading: state.member.pos.posOrdersPILoading,
  posOrdersPI: state.member.pos.posOrdersPI,
});

const mapDispatchToProps = {
  fetchPOSPurchaseItems: posActions.fetchPOSItems,
  fetchPOSOrdersPI: posActions.fetchPOSOrdersPI,
};

var compThis = undefined;

export class PurchaseItemsReport extends Component {
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
    this.locale =
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale;

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

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
      costTotal: 0,
      profitTotal: 0,
      discountsTotal: 0,
      repFromDate,
      repToDate,
      repPeriod: 'monthly',
      repViewPeriod: 'this_period',
      showRepAccountHolders: false,
      personViewMode: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.posPurchaseItemsLoading && !nextProps.posOrdersPILoading) {
      this.posPurchaseItems = [];
      nextProps.posPurchaseItems.forEach((item, i) => {
        this.posPurchaseItems[this.posPurchaseItems.length] = item;
      });
      this.posOrders = [];
      nextProps.posOrdersPI.forEach((item, i) => {
        this.posOrders[this.posOrders.length] = item;
      });
      let data = this.getData(this.posPurchaseItems, this.props.posProducts);
      let discountsTotal = this.getDiscounts(this.posOrders);

      var total = 0;
      var costTotal = 0;
      var profitTotal = 0;
      data.forEach((item, i) => {
        total += item.value;
        costTotal += item.cost;
        profitTotal += item.profit;
      });

      this.setState({
        allMembers: nextProps.members,
        data,
        total,
        costTotal,
        profitTotal,
        discountsTotal,
        posPurchaseItems: this.posPurchaseItems,
        posProducts: this.props.posProducts,
      });
    }
  }

  componentDidMount() {
    this.props.fetchPOSPurchaseItems({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
    });
    this.props.fetchPOSOrdersPI({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
    });
  }

  refreshData(fromDate, toDate) {
    this.props.fetchPOSPurchaseItems({
      dateFrom: fromDate,
      dateTo: toDate,
    });
    this.props.fetchPOSOrdersPI({
      dateFrom: fromDate,
      dateTo: toDate,
    });
  }
  getItemPrice(item, posProducts) {
    if (item.values['Price'] !== null && item.values['Price'] !== '') {
      return Number.parseFloat(item.values['Price']);
    } else {
      var idx = posProducts.findIndex(
        product => product['id'] === item.values['Product ID'],
      );
      if (idx !== -1) {
        return Number.parseFloat(posProducts[idx].values['Price']);
      }
    }
    console.log('No product price found for :' + item['id']);
    return 0;
  }
  getItemColour(item, posProducts) {
    var colour = '';
    var idx = posProducts.findIndex(
      product => product['id'] === item.values['Product ID'],
    );
    if (idx !== -1) {
      colour = posProducts[idx].values['Colour'];
    }

    return colour;
  }
  getItemCost(item, posProducts) {
    if (
      item.values['Cost'] !== undefined &&
      item.values['Cost'] !== null &&
      item.values['Cost'] !== ''
    ) {
      return Number.parseFloat(item.values['Cost'].replace('$', ''));
    } else {
      var idx = posProducts.findIndex(
        product => product['id'] === item.values['Product ID'],
      );
      if (idx !== -1) {
        if (
          posProducts[idx].values['Cost'] !== undefined &&
          posProducts[idx].values['Cost'] !== null &&
          posProducts[idx].values['Cost'] !== ''
        ) {
          return Number.parseFloat(
            posProducts[idx].values['Cost'].replace('$', ''),
          );
        } else {
          return 0;
        }
      }
    }
    console.log('No product cost found for :' + item['id']);
    return 0;
  }
  getItemProfit(posProducts, item, cost, price) {
    var idx = posProducts.findIndex(
      product => product['id'] === item.values['Product ID'],
    );
    if (idx !== -1) {
      if (cost === 0 && posProducts[idx].values['Product Type'] === 'Apparel')
        return 0;
    }
    return price - cost;
  }
  getDiscounts(posOrders) {
    var discounts = 0;
    posOrders.forEach((order, i) => {
      discounts +=
        order.values['Discount'] !== undefined &&
        order.values['Discount'] !== null
          ? Number.parseFloat(order.values['Discount'])
          : 0;
    });

    return discounts;
  }
  getData(posPurchaseItems, posProducts) {
    if (!posPurchaseItems || posPurchaseItems.length <= 0) {
      return [];
    }
    var data = [];
    posPurchaseItems.forEach((item, i) => {
      var idx = data.findIndex(
        dataItem =>
          dataItem.key ===
          item.values['Product Name'] +
            (item.values['Size'] !== undefined ? item.values['Size'] : ''),
      );
      var price = this.getItemPrice(item, posProducts);
      var colour = this.getItemColour(item, posProducts);
      var cost = this.getItemCost(item, posProducts);
      var profit = this.getItemProfit(posProducts, item, cost, price);
      if (idx === -1) {
        data[data.length] = {
          key:
            item.values['Product Name'] +
            (item.values['Size'] !== undefined ? item.values['Size'] : ''),
          name: item.values['Product Name'],
          size: item.values['Size'],
          colour: colour,
          quantity: Number.parseInt(item.values['Quantity']),
          value: Number.parseInt(item.values['Quantity']) * price,
          cost: Number.parseInt(item.values['Quantity']) * cost,
          profit: Number.parseInt(item.values['Quantity']) * profit,
        };
      } else {
        data[idx].quantity =
          data[idx].quantity + Number.parseInt(item.values['Quantity']);
        data[idx].value =
          data[idx].value + Number.parseInt(item.values['Quantity']) * price;
        data[idx].cost =
          data[idx].cost + Number.parseInt(item.values['Quantity']) * cost;
        data[idx].profit =
          data[idx].profit + Number.parseInt(item.values['Quantity']) * profit;
      }
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
        if (a.size < b.size) {
          return -1;
        } else if (a.size > b.size) {
          return 1;
        }
        return 0;
      })
      .map(item => {
        return {
          name: item.name,
          size: item.size,
          colour: item.colour,
          quantity: item.quantity,
          value: item.value,
          cost: item.cost,
        };
      });
    return data;
  }
  getDataByPerson(posPurchaseItems, posProducts) {
    if (!posPurchaseItems || posPurchaseItems.length <= 0) {
      return [];
    }
    var data = [];
    posPurchaseItems.forEach((item, i) => {
      var idx = data.findIndex(
        dataItem =>
          dataItem.key ===
          item.values['Product Name'] +
            (item.values['Size'] !== undefined ? item.values['Size'] : ''),
      );
      var price = this.getItemPrice(item, posProducts);
      var colour = this.getItemColour(item, posProducts);
      var cost = this.getItemCost(item, posProducts);
      var profit = this.getItemProfit(posProducts, item, cost, price);

      data[data.length] = {
        key:
          item.values['Person Name'] +
          (item.values['Product Name'] !== undefined
            ? item.values['Product Name']
            : ''),
        person: item.values['Person Name'],
        name: item.values['Product Name'],
        size: item.values['Size'],
        colour: colour,
        quantity: Number.parseInt(item.values['Quantity']),
        value: Number.parseInt(item.values['Quantity']) * price,
        cost: Number.parseInt(item.values['Quantity']) * cost,
        profit: Number.parseInt(item.values['Quantity']) * profit,
      };
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
        if (a.person < b.person) {
          return -1;
        } else if (a.person > b.person) {
          return 1;
        }
        return 0;
      })
      .map(item => {
        return {
          person: item.person,
          name: item.name,
          size: item.size,
          colour: item.colour,
          quantity: item.quantity,
          value: item.value,
          cost: item.cost,
        };
      });
    return data;
  }

  getDownloadData() {
    let data = this.state.data;

    let header = [];
    header.push('Product');
    header.push('Size');
    header.push('Colour');
    header.push('Quantity');
    header.push('Cost');
    header.push('Value');
    header.push('Profit');

    let download = [];
    download.push(header.flatten());

    data.forEach(element => {
      let row = [];
      row.push(element['name']);
      row.push(element['size']);
      row.push(element['colour']);
      row.push(element['quantity']);
      row.push(
        element['cost'] !== undefined
          ? parseFloat(element['cost']).toFixed(2)
          : '',
      );
      row.push(
        element['value'] !== undefined
          ? parseFloat(element['value']).toFixed(2)
          : '',
      );
      row.push(
        element['profit'] !== undefined
          ? parseFloat(element['profit']).toFixed(2)
          : '',
      );
      download.push(row.flatten());
    });

    return download;
  }
  getDownloadDataByPerson() {
    let data = this.state.data;

    let header = [];
    header.push('Person');
    header.push('Product');
    header.push('Size');
    header.push('Colour');
    header.push('Quantity');
    header.push('Cost');
    header.push('Value');
    header.push('Profit');

    let download = [];
    download.push(header.flatten());

    data.forEach(element => {
      let row = [];
      row.push(element['person']);
      row.push(element['name']);
      row.push(element['size']);
      row.push(element['colour']);
      row.push(element['quantity']);
      row.push(
        element['cost'] !== undefined
          ? parseFloat(element['cost']).toFixed(2)
          : '',
      );
      row.push(
        element['value'] !== undefined
          ? parseFloat(element['value']).toFixed(2)
          : '',
      );
      row.push(
        element['profit'] !== undefined
          ? parseFloat(element['profit']).toFixed(2)
          : '',
      );
      download.push(row.flatten());
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

  getColumns() {
    const columns = [
      {
        accessor: 'name',
        Header: 'Product',
        width: 300,
      },
      {
        accessor: 'size',
        Header: 'Size',
        width: 100,
      },
      {
        accessor: 'colour',
        Header: 'Colour',
        width: 100,
      },
      {
        accessor: 'quantity',
        Header: 'Quantity',
        width: 100,
      },
      {
        accessor: 'cost',
        Header: 'Cost',
        width: 150,
        Cell: props => {
          return props.original.cost === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.cost)}
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
                }).format(this.state.costTotal)
              : 0}
          </span>
        ),
      },
      {
        accessor: 'value',
        Header: 'Value',
        width: 150,
        Cell: props => {
          return props.original.value === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.value)}
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
        accessor: 'profit',
        Header: 'Profit',
        width: 150,
        Cell: props => {
          return props.original.profit === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.profit)}
            </div>
          );
        },
        Footer: (
          <span className="totalsDetail">
            <span>
              <strong>Total: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.profitTotal)
                : 0}
            </span>
            <br />
            <span>
              <strong>Discounts: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.discountsTotal)
                : 0}
            </span>
            <br />
            <span>
              <strong>Profit: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.profitTotal - this.state.discountsTotal)
                : 0}
            </span>
          </span>
        ),
      },
    ];
    return columns;
  }
  getColumnsByPerson() {
    const columns = [
      {
        accessor: 'person',
        Header: 'Person',
        width: 200,
      },
      {
        accessor: 'name',
        Header: 'Product',
        width: 300,
      },
      {
        accessor: 'size',
        Header: 'Size',
        width: 100,
      },
      {
        accessor: 'colour',
        Header: 'Colour',
        width: 100,
      },
      {
        accessor: 'quantity',
        Header: 'Quantity',
        width: 100,
      },
      {
        accessor: 'cost',
        Header: 'Cost',
        width: 150,
        Cell: props => {
          return props.original.cost === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.cost)}
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
                }).format(this.state.costTotal)
              : 0}
          </span>
        ),
      },
      {
        accessor: 'value',
        Header: 'Value',
        width: 150,
        Cell: props => {
          return props.original.value === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.value)}
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
        accessor: 'profit',
        Header: 'Profit',
        width: 150,
        Cell: props => {
          return props.original.profit === undefined ? (
            <div />
          ) : (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.profit)}
            </div>
          );
        },
        Footer: (
          <span className="totalsDetail">
            <span>
              <strong>Total: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.profitTotal)
                : 0}
            </span>
            <br />
            <span>
              <strong>Discounts: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.discountsTotal)
                : 0}
            </span>
            <br />
            <span>
              <strong>Profit: </strong>
              {this.state !== undefined
                ? new Intl.NumberFormat(this.locale, {
                    style: 'currency',
                    currency: this.currency,
                  }).format(this.state.profitTotal - this.state.discountsTotal)
                : 0}
            </span>
          </span>
        ),
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
            <div className="reportIcons">
              <ReactToPrint
                trigger={() => (
                  <SVGInline svg={printerIcon} className="icon tablePrint" />
                )}
                content={() => this.tableComponentRef}
              />
              <CSVLink
                className="downloadbtn"
                filename="purchaseItems.csv"
                data={
                  this.state.personViewMode
                    ? this.getDownloadDataByPerson()
                    : this.getDownloadData()
                }
              >
                <SVGInline svg={downloadIcon} className="icon tableDownload" />
              </CSVLink>
              <div className="personView">
                <label htmlFor="personMode">Show By Person</label>
                <div className="checkboxFilter">
                  <input
                    id="personViewMode"
                    type="checkbox"
                    value="0"
                    onChange={e => {
                      var newMode = !this.state.personViewMode;

                      var data = this.getData(
                        this.state.posPurchaseItems,
                        this.state.posProducts,
                      );
                      var columns = this.getColumns();
                      if (newMode) {
                        data = this.getDataByPerson(
                          this.state.posPurchaseItems,
                          this.state.posProducts,
                        );
                        columns = this.getColumnsByPerson();
                      }
                      this.setState({
                        personViewMode: newMode,
                        data: data,
                        columns: columns,
                      });
                    }}
                  />
                  <label htmlFor="personViewMode"></label>
                </div>
                {}
              </div>
            </div>
            <ReactTable
              ref={el => (this.tableComponentRef = el)}
              columns={this.getColumns()}
              data={this.state.data}
              className="-striped -highlight"
              defaultPageSize={
                this.state.data.length > 0 ? this.state.data.length : 2
              }
              pageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              showPagination={false}
            />
            <br />
          </div>
        )}
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const PurchaseItemsReportContainer = enhance(PurchaseItemsReport);

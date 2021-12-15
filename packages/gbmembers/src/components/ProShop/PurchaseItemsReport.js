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

const mapStateToProps = state => ({
  members: state.member.members.allMembers,
  profile: state.member.app.profile,
  leads: state.member.leads.allLeads,
  space: state.member.app.space,
  posPurchaseItemsLoading: state.member.pos.posItemsLoading,
  posPurchaseItems: state.member.pos.posItems,
});

const mapDispatchToProps = {
  fetchPOSPurchaseItems: posActions.fetchPOSItems,
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
      repFromDate,
      repToDate,
      repPeriod: 'monthly',
      repViewPeriod: 'this_period',
      showRepAccountHolders: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.posPurchaseItemsLoading) {
      this.posPurchaseItems = [];
      nextProps.posPurchaseItems.forEach((item, i) => {
        this.posPurchaseItems[this.posPurchaseItems.length] = item;
      });
      let data = this.getData(this.posPurchaseItems, this.props.posProducts);
      var total = 0;
      data.forEach((item, i) => {
        total += item.value;
      });

      this.setState({
        allMembers: nextProps.members,
        data,
        total,
      });
    }
  }

  componentDidMount() {
    this.props.fetchPOSPurchaseItems({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
    });
  }

  refreshData(fromDate, toDate) {
    this.props.fetchPOSPurchaseItems({
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
      if (idx === -1) {
        data[data.length] = {
          key:
            item.values['Product Name'] +
            (item.values['Size'] !== undefined ? item.values['Size'] : ''),
          name: item.values['Product Name'],
          size: item.values['Size'],
          quantity: Number.parseInt(item.values['Quantity']),
          value:
            Number.parseInt(item.values['Quantity']) *
            this.getItemPrice(item, posProducts),
        };
      } else {
        data[idx].quantity =
          data[idx].quantity + Number.parseInt(item.values['Quantity']);
        data[idx].value =
          data[idx].value +
          Number.parseInt(item.values['Quantity']) *
            this.getItemPrice(item, posProducts);
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
          quantity: item.quantity,
          value: item.value,
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

  getColumns() {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
      },
      {
        accessor: 'size',
        Header: 'Size',
        width: 100,
      },
      {
        accessor: 'quantity',
        Header: 'Quantity',
        width: 100,
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
            <ReactTable
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

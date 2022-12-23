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
  additionalServices: state.member.members.additionalServices,
  additionalServicesLoading: state.member.members.additionalServicesLoading,
});

const mapDispatchToProps = {
  fetchAdditionalServices: actions.fetchAdditionalServices,
  setAdditionalServices: actions.setAdditionalServices,
};

var compThis = undefined;

export class AdditionalServicesReport extends Component {
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
      repFromDate,
      repToDate,
      repPeriod: 'monthly',
      repViewPeriod: 'this_period',
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (!nextProps.additionalServicesLoading) {
      this.additionalServices = [];
      nextProps.additionalServices.forEach((item, i) => {
        this.additionalServices[this.additionalServices.length] = item;
      });
      let data = this.getData(this.additionalServices, this.props.allMembers);

      this.setState({
        allMembers: nextProps.members,
        data,
      });
    }
  }

  componentDidMount() {
    this.props.fetchAdditionalServices({
      dateFrom: this.state.repFromDate,
      dateTo: this.state.repToDate,
      additionalServiceForm:
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
          ? 'bambora-member-additional-services'
          : '',
    });
  }

  refreshData(fromDate, toDate) {
    this.props.fetchAdditionalServices({
      dateFrom: fromDate,
      dateTo: toDate,
      additionalServiceForm:
        getAttributeValue(this.props.space, 'Billing Company') === 'Bambora'
          ? 'bambora-member-additional-services'
          : '',
    });
  }
  getData(additionalServices, allMembers) {
    if (!additionalServices || additionalServices.length <= 0) {
      return [];
    }

    additionalServices.forEach((service, i) => {
      var idx = allMembers.findIndex(
        member => member.id === service.values['Member GUID'],
      );

      if (idx !== -1) {
        service.values['Member Name'] =
          allMembers[idx].values['First Name'] +
          ' ' +
          allMembers[idx].values['Last Name'];
      }
    });

    return additionalServices;
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
        Header: 'Status',
        accessor: 'status',
        Cell: props => props.original.values['Status'],
      },
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
        Cell: props => props.original.values['Name'],
      },
      {
        accessor: 'memberName',
        Header: 'Member',
        width: 200,
        Cell: props => {
          return (
            <NavLink
              to={`/Member/${props.original.values['Member GUID']}`}
              className=""
            >
              {props.original.values['Member Name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'paymentFrequency',
        Header: 'Payment Frequency',
        width: 200,
        Cell: props => props.original.values['Display Payment Frequency'],
      },
      {
        accessor: 'fee',
        Header: 'Fee',
        width: 150,
        Cell: props => {
          return (
            <div className="dollarValue">
              {new Intl.NumberFormat(this.locale, {
                style: 'currency',
                currency: this.currency,
              }).format(props.original.values['Fee'])}
            </div>
          );
        },
      },
      {
        accessor: 'start',
        Header: 'Start',
        width: 100,
        Cell: props =>
          moment(props.original.values['Start Date']).format('D MMM YYYY'),
      },
      {
        accessor: 'end',
        Header: 'End',
        width: 100,
        Cell: props =>
          moment(props.original.values['End Date']).format('D MMM YYYY'),
      },
      {
        accessor: 'billingID',
        Header: 'Billing ID',
        width: 100,
        Cell: props => props.original.values['Billing ID'],
      },
    ];
    return columns;
  }

  render() {
    return (
      <span className="additionalServicesReport">
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
        {this.props.additionalServicesLoading ? (
          <div className="additionalServicesReport">
            Loading information ...
          </div>
        ) : (
          <div className="additionalServicesReport">
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
            />
            <br />
          </div>
        )}
      </span>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const AdditionalServicesReportContainer = enhance(
  AdditionalServicesReport,
);

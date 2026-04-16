import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import $ from 'jquery';
import { getLocalePreference } from '../Member/MemberUtils';
import { Utils } from 'common';
import { ReactComponent as CrossIcon } from '../../images/cross.svg';
import { KappNavLink as NavLink } from 'common';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';

var compThis = undefined;

export class Services extends Component {
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
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    const repFromDate = moment()
      .date(1)
      .hour(0)
      .minute(0);
    const repToDate = moment()
      .date(1)
      .add(1, 'months')
      .subtract(1, 'days')
      .hour(23)
      .minute(59);

    let services = this.props.services;
    let data = this.getData(services, repFromDate, repToDate, this.props.space);
    let columns = this.getColumns();

    this.tableComponentRef = React.createRef();

    this.state = {
      services,
      data,
      columns,
      repFromDate,
      repToDate,
      repPeriod: 'monthly',
      showServices: false,
      isShowCustom: false,
      servicesSlug: undefined,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let services = nextProps.services;
    let data = this.getData(
      services,
      this.state.repFromDate,
      this.state.repToDate,
      this.props.space,
    );
    this.setState({
      services,
      data: data,
    });
  }

  UNSAFE_componentWillMount() {
    this.props.fetchServicesByDate({
      fromDate: this.state.repFromDate,
      toDate: this.state.repToDate,
    });
  }

  navigateReportPeriod(direction) {
    const { repFromDate, repToDate, repPeriod } = this.state;
    let amount, unit;
    if (repPeriod === 'weekly') {
      amount = 1;
      unit = 'weeks';
    } else if (repPeriod === 'fortnightly') {
      amount = 2;
      unit = 'weeks';
    } else {
      amount = 1;
      unit = 'months';
    }
    const newFrom = moment(repFromDate).add(direction * amount, unit);
    const newTo = moment(repToDate).add(direction * amount, unit);
    this.setState({ repFromDate: newFrom, repToDate: newTo });
    this.loadNewServices(newFrom, newTo);
  }

  handleSubmit() {
    if (!this.state.repFromDate || !this.state.repToDate) {
      return;
    }
    this.setState({ isShowCustom: false });
    this.loadNewServices(this.state.repFromDate, this.state.repToDate);
  }

  getData(services, startOfMonth, endOfMonth, space) {
    if (!services || services.length <= 0) {
      return [];
    }
    var includedServices = [];
    var servicesData = [];

    var forms = [];
    var slugs = Utils.getAttributeValue(space, 'Services Slugs');
    if (slugs !== undefined) {
      forms = slugs.split(',');
    }

    services.forEach(service => {
      if (forms.includes(service.form.slug)) {
        includedServices[includedServices.length] = service;
      }
    });

    includedServices.forEach(service => {
      var idx = servicesData.findIndex(
        item => item['slug'] === service.form.slug,
      );
      if (idx === -1) {
        var data = {};
        data['slug'] = service.form.slug;
        data['name'] = service.form.name;
        data['submissions'] = [service];
        data['count'] = 1;
        servicesData[servicesData.length] = data;
      } else {
        servicesData[idx]['submissions'][
          servicesData[idx]['submissions'].length
        ] = service;
        servicesData[idx]['count'] = servicesData[idx]['count'] + 1;
      }
    });

    return servicesData;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Form Name',
        width: 300,
        Cell: props => {
          return (
            <span
              className="servicesLink"
              onClick={e => {
                this.setState({
                  showServices: true,
                  servicesSlug: props.original['slug'],
                });
              }}
            >
              {props.original['name']}
            </span>
          );
        },
      },
      { accessor: 'count', Header: 'Count' },
    ];
    return columns;
  }
  loadNewServices(fromDate, toDate) {
    this.props.fetchServicesByDate({
      fromDate: fromDate,
      toDate: toDate,
    });
    this.setState({
      repFromDate: fromDate,
      repToDate: toDate,
    });
  }
  getServicesTableColumns() {
    return [
      {
        accessor: 'submittedAt',
        Header: 'Date',
        maxWidth: '200',
        Cell: row => moment(row.original.submittedAt).format('L h:mm A'),
      },
      {
        accessor: 'name',
        Header: 'Student Name',
        maxWidth: '100%',
        Cell: props => {
          return (
            <NavLink
              to={`/requests/request/${props.original.id}/review`}
              currentKappSlug="gbmembers"
              kappSlug="services"
              className=""
            >
              {props.original.name}
            </NavLink>
          );
        },
      },
    ];
  }
  getServicesTableData(services, servicesSlug) {
    services = services.filter(service => service.form.slug === servicesSlug);

    var data = [];
    services.forEach((service, i) => {
      data[data.length] = {
        id: service.id,
        name:
          service.values['Student First Name'] !== undefined
            ? service.values['Student First Name'] +
              ' ' +
              service.values['Student Last Name']
            : service.values['First Name'] + ' ' + service.values['Last Name'],
        submittedAt: moment(service.submittedAt),
      };
    });

    return data;
  }
  render() {
    const { data, columns } = this.state;
    return (
      <span className="services">
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Services Report</h6>
          {this.state.showServices && (
            <div className="members">
              <span
                className="closeMembers"
                onClick={e =>
                  this.setState({
                    showServices: false,
                  })
                }
              >
                <CrossIcon className="icon icon-svg" />
              </span>
              <ReactTable
                columns={this.getServicesTableColumns()}
                data={this.getServicesTableData(
                  this.state.services,
                  this.state.servicesSlug,
                )}
                defaultPageSize={
                  this.getServicesTableData(
                    this.state.services,
                    this.state.servicesSlug,
                  ).length
                }
                showPagination={false}
              />
            </div>
          )}
          <div className="dateSettings">
            <div className="dateNavButtons">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={() => this.navigateReportPeriod(-1)}
              >
                {'< Previous '}
                {this.state.repPeriod === 'weekly'
                  ? 'Week'
                  : this.state.repPeriod === 'fortnightly'
                    ? 'Fortnight'
                    : 'Month'}
              </button>
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={() => this.navigateReportPeriod(1)}
                disabled={this.state.repToDate.isSameOrAfter(moment(), 'day')}
              >
                {'Next '}
                {this.state.repPeriod === 'weekly'
                  ? 'Week'
                  : this.state.repPeriod === 'fortnightly'
                    ? 'Fortnight'
                    : 'Month'}
                {' >'}
              </button>
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={() => this.setState({ isShowCustom: true })}
              >
                Custom
              </button>
            </div>
            <div className="dateRangeLabel">
              {this.state.repFromDate.format('DD MMM YYYY')} –{' '}
              {this.state.repToDate.format('DD MMM YYYY')}
            </div>
          </div>
          {this.state.isShowCustom && (
            <div className="stat_customDatesContainer">
              <div className="purchaseItemsByDateDiv">
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
                        onDayChange={function(selectedDay) {
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
                        onDayChange={function(selectedDay) {
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
                        onClick={() => this.handleClose()}
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="form-group col-xs-2 submit">
                      <button
                        className="btn btn-primary form-control input-sm"
                        onClick={() => this.handleSubmit()}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg tablePrint" />}
          content={() => this.tableComponentRef.current}
          onBeforePrint={() => new Promise(r => setTimeout(r, 1000))}
        />
        <ReactTable
          ref={this.tableComponentRef}
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

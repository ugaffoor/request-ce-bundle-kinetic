import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import { Utils } from 'common';
import { ReactComponent as CrossIcon } from '../../images/cross.svg';
import { KappNavLink as NavLink } from 'common';
import ReactToPrint from 'react-to-print';
import { ReactComponent as PrinterIcon } from '../../images/Print.svg';

export class Services extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let startOfMonth = moment().startOf('month');
    let endOfMonth = moment().endOf('month');
    let services = this.props.services;
    let data = this.getData(
      services,
      startOfMonth,
      endOfMonth,
      this.props.space,
    );
    let columns = this.getColumns();

    this.tableComponentRef = React.createRef();

    this.state = {
      services,
      data,
      columns,
      startOfMonth,
      endOfMonth,
      showServices: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let services = nextProps.services;
    let data = this.getData(
      services,
      this.state.startOfMonth,
      this.state.endOfMonth,
      this.props.space,
    );
    this.setState({
      services,
      data: data,
    });
  }

  UNSAFE_componentWillMount() {
    this.props.fetchServicesByDate({
      fromDate: this.state.startOfMonth,
      toDate: this.state.endOfMonth,
    });
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
      startOfMonth: fromDate,
      endOfMonth: toDate,
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
    return this.props.servicesLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading Services report ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
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
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                let startOfMonth = this.state.startOfMonth.subtract(1, 'month');
                let endOfMonth = this.state.endOfMonth.subtract(1, 'month');
                this.loadNewServices(startOfMonth, endOfMonth);
              }}
            >
              Previous Month
            </button>
            <h6>
              {this.state.startOfMonth.format('L')} to{' '}
              {this.state.endOfMonth.format('L')}
            </h6>
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={moment().isBetween(
                this.state.startOfMonth,
                this.state.endOfMonth,
              )}
              onClick={e => {
                let startOfMonth = this.state.startOfMonth.add(1, 'month');
                let endOfMonth = this.state.endOfMonth.add(1, 'month');
                this.loadNewServices(startOfMonth, endOfMonth);
              }}
            >
              Next Month
            </button>
          </div>
        </div>
        <ReactToPrint
          trigger={() => <PrinterIcon className="icon icon-svg tablePrint" />}
          content={() => this.tableComponentRef.current}
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

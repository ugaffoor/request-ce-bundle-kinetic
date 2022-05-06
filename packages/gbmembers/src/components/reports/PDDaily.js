import React, { Component } from 'react';
import ReactTable from 'react-table';
import ReactSpinner from 'react16-spinjs';
import moment from 'moment';
import { getJson } from '../Member/MemberUtils';
import SVGInline from 'react-svg-inline';
import ReactToPrint from 'react-to-print';
import printerIcon from '../../images/Print.svg?raw';

export class PDDailyReport extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let startOfWeek = moment().startOf('week');
    let endOfWeek = moment().endOf('week');
    let leads = this.props.leadsByDate;
    let data = this.getData(leads, startOfWeek, endOfWeek);
    let columns = this.getColumns();
    this.state = {
      leads,
      data,
      columns,
      startOfWeek,
      endOfWeek,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let leads = nextProps.leadsByDate;
    let data = this.getData(
      leads,
      this.state.startOfWeek,
      this.state.endOfWeek,
    );
    this.setState({
      leads,
      data: data,
    });
  }

  UNSAFE_componentWillMount() {
    if (this.props.leadsByDate.length === 0) {
      this.props.fetchLeadsByDate();
    }
  }

  getData(leads, startOfWeek, endOfWeek) {
    if (!leads || leads.length <= 0) {
      return [];
    }
    let leadsData = [];
    let newLeads = new Map();
    newLeads.set('label', 'Lead');
    newLeads.set('monday', 0);
    newLeads.set('tuesday', 0);
    newLeads.set('wednesday', 0);
    newLeads.set('thursday', 0);
    newLeads.set('friday', 0);
    newLeads.set('saturday', 0);
    newLeads.set('sunday', 0);
    let intros = new Map();
    intros.set('label', 'Intros Appointment');
    intros.set('monday', 0);
    intros.set('tuesday', 0);
    intros.set('wednesday', 0);
    intros.set('thursday', 0);
    intros.set('friday', 0);
    intros.set('saturday', 0);
    intros.set('sunday', 0);
    let taught = new Map();
    taught.set('label', 'Intros Taught');
    taught.set('monday', 0);
    taught.set('tuesday', 0);
    taught.set('wednesday', 0);
    taught.set('thursday', 0);
    taught.set('friday', 0);
    taught.set('saturday', 0);
    taught.set('sunday', 0);
    let noshow = new Map();
    noshow.set('label', 'Intros No Show');
    noshow.set('monday', 0);
    noshow.set('tuesday', 0);
    noshow.set('wednesday', 0);
    noshow.set('thursday', 0);
    noshow.set('friday', 0);
    noshow.set('saturday', 0);
    noshow.set('sunday', 0);
    let enrollment = new Map();
    enrollment.set('label', 'Enrollment');
    enrollment.set('monday', 0);
    enrollment.set('tuesday', 0);
    enrollment.set('wednesday', 0);
    enrollment.set('thursday', 0);
    enrollment.set('friday', 0);
    enrollment.set('saturday', 0);
    enrollment.set('sunday', 0);
    let newSales = new Map();
    newSales.set('label', 'New Sales');
    newSales.set('monday', 0);
    newSales.set('tuesday', 0);
    newSales.set('wednesday', 0);
    newSales.set('thursday', 0);
    newSales.set('friday', 0);
    newSales.set('saturday', 0);
    newSales.set('sunday', 0);
    let newSalesWeek = new Map();
    newSalesWeek.set('label', 'New Sales This Week');
    newSalesWeek.set('monday', 0);
    newSalesWeek.set('tuesday', 0);
    newSalesWeek.set('wednesday', 0);
    newSalesWeek.set('thursday', 0);
    newSalesWeek.set('friday', 0);
    newSalesWeek.set('saturday', 0);
    newSalesWeek.set('sunday', 0);

    leads.forEach(lead => {
      if (moment(lead['updatedAt']).isBetween(startOfWeek, endOfWeek)) {
        if (moment(lead['createdAt']).isBetween(startOfWeek, endOfWeek)) {
          switch (moment(lead['createdAt']).day()) {
            case 1:
              newLeads.set('monday', newLeads.get('monday') + 1);
              break;
            case 2:
              newLeads.set('tuesday', newLeads.get('tuesday') + 1);
              break;
            case 3:
              newLeads.set('wednesday', newLeads.get('wednesday') + 1);
              break;
            case 4:
              newLeads.set('thursday', newLeads.get('thursday') + 1);
              break;
            case 5:
              newLeads.set('friday', newLeads.get('friday') + 1);
              break;
            case 6:
              newLeads.set('saturday', newLeads.get('saturday') + 1);
              break;
            case 0:
              newLeads.set('sunday', newLeads.get('sunday') + 1);
              break;
            default:
              console.log('Something is wrong');
          }
        }
        var history =
          lead.values['History'] !== undefined
            ? getJson(lead.values['History'])
            : {};
        for (var i = 0; i < history.length; i++) {
          if (history[i]['contactMethod'] === 'intro_class') {
            switch (moment(history[i]['contactDate']).day()) {
              case 1:
                intros.set('monday', intros.get('monday') + 1);
                break;
              case 2:
                intros.set('tuesday', intros.get('tuesday') + 1);
                break;
              case 3:
                intros.set('wednesday', intros.get('wednesday') + 1);
                break;
              case 4:
                intros.set('thursday', intros.get('thursday') + 1);
                break;
              case 5:
                intros.set('friday', intros.get('friday') + 1);
                break;
              case 6:
                intros.set('saturday', intros.get('saturday') + 1);
                break;
              case 0:
                intros.set('sunday', intros.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
        for (i = 0; i < history.length; i++) {
          if (history[i]['contactMethod'] === 'attended_class') {
            switch (moment(history[i]['contactDate']).day()) {
              case 1:
                taught.set('monday', taught.get('monday') + 1);
                break;
              case 2:
                taught.set('tuesday', taught.get('tuesday') + 1);
                break;
              case 3:
                taught.set('wednesday', taught.get('wednesday') + 1);
                break;
              case 4:
                taught.set('thursday', taught.get('thursday') + 1);
                break;
              case 5:
                taught.set('friday', taught.get('friday') + 1);
                break;
              case 6:
                taught.set('saturday', taught.get('saturday') + 1);
                break;
              case 0:
                taught.set('sunday', taught.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
        for (i = 0; i < history.length; i++) {
          if (history[i]['contactMethod'] === 'noshow_class') {
            switch (moment(history[i]['contactDate']).day()) {
              case 1:
                noshow.set('monday', taught.get('monday') + 1);
                break;
              case 2:
                noshow.set('tuesday', taught.get('tuesday') + 1);
                break;
              case 3:
                noshow.set('wednesday', taught.get('wednesday') + 1);
                break;
              case 4:
                noshow.set('thursday', taught.get('thursday') + 1);
                break;
              case 5:
                noshow.set('friday', taught.get('friday') + 1);
                break;
              case 6:
                noshow.set('saturday', taught.get('saturday') + 1);
                break;
              case 0:
                noshow.set('sunday', taught.get('sunday') + 1);
                break;
              default:
                console.log('Something is wrong');
            }
          }
        }
        if (
          moment(lead['updatedAt']).isBetween(startOfWeek, endOfWeek) &&
          lead.values['Lead State'] === 'Converted'
        ) {
          switch (moment(lead['updatedAt']).day()) {
            case 1:
              enrollment.set('monday', enrollment.get('monday') + 1);
              break;
            case 2:
              enrollment.set('tuesday', enrollment.get('tuesday') + 1);
              break;
            case 3:
              enrollment.set('wednesday', enrollment.get('wednesday') + 1);
              break;
            case 4:
              enrollment.set('thursday', enrollment.get('thursday') + 1);
              break;
            case 5:
              enrollment.set('friday', enrollment.get('friday') + 1);
              break;
            case 6:
              enrollment.set('saturday', enrollment.get('saturday') + 1);
              break;
            case 0:
              enrollment.set('sunday', enrollment.get('sunday') + 1);
              break;
            default:
              console.log('Something is wrong');
          }
        }
      }
    });

    leadsData.push({
      label: newLeads.get('label'),
      monday: newLeads.get('monday'),
      tuesday: newLeads.get('tuesday'),
      wednesday: newLeads.get('wednesday'),
      thursday: newLeads.get('thursday'),
      friday: newLeads.get('friday'),
      saturday: newLeads.get('saturday'),
      sunday: newLeads.get('sunday'),
      total:
        newLeads.get('monday') +
        newLeads.get('tuesday') +
        newLeads.get('wednesday') +
        newLeads.get('thursday') +
        newLeads.get('friday') +
        newLeads.get('saturday') +
        newLeads.get('sunday'),
    });

    leadsData.push({
      label: intros.get('label'),
      monday: intros.get('monday'),
      tuesday: intros.get('tuesday'),
      wednesday: intros.get('wednesday'),
      thursday: intros.get('thursday'),
      friday: intros.get('friday'),
      saturday: intros.get('saturday'),
      sunday: intros.get('sunday'),
      total:
        intros.get('monday') +
        intros.get('tuesday') +
        intros.get('wednesday') +
        intros.get('thursday') +
        intros.get('friday') +
        intros.get('saturday') +
        intros.get('sunday'),
    });

    leadsData.push({
      label: taught.get('label'),
      monday: taught.get('monday'),
      tuesday: taught.get('tuesday'),
      wednesday: taught.get('wednesday'),
      thursday: taught.get('thursday'),
      friday: taught.get('friday'),
      saturday: taught.get('saturday'),
      sunday: taught.get('sunday'),
      total:
        taught.get('monday') +
        taught.get('tuesday') +
        taught.get('wednesday') +
        taught.get('thursday') +
        taught.get('friday') +
        taught.get('saturday') +
        taught.get('sunday'),
    });

    leadsData.push({
      label: noshow.get('label'),
      monday: noshow.get('monday'),
      tuesday: noshow.get('tuesday'),
      wednesday: noshow.get('wednesday'),
      thursday: noshow.get('thursday'),
      friday: noshow.get('friday'),
      saturday: noshow.get('saturday'),
      sunday: noshow.get('sunday'),
      total:
        noshow.get('monday') +
        noshow.get('tuesday') +
        noshow.get('wednesday') +
        noshow.get('thursday') +
        noshow.get('friday') +
        noshow.get('saturday') +
        noshow.get('sunday'),
    });

    leadsData.push({
      label: enrollment.get('label'),
      monday: enrollment.get('monday'),
      tuesday: enrollment.get('tuesday'),
      wednesday: enrollment.get('wednesday'),
      thursday: enrollment.get('thursday'),
      friday: enrollment.get('friday'),
      saturday: enrollment.get('saturday'),
      sunday: enrollment.get('sunday'),
      total:
        enrollment.get('monday') +
        enrollment.get('tuesday') +
        enrollment.get('wednesday') +
        enrollment.get('thursday') +
        enrollment.get('friday') +
        enrollment.get('saturday') +
        enrollment.get('sunday'),
    });
    /*
    leadsData.push({
      label: newSales.get("label"),
      monday: newSales.get("monday"),
      tuesday: newSales.get("tuesday"),
      wednesday: newSales.get("wednesday"),
      thursday: newSales.get("thursday"),
      friday: newSales.get("friday"),
      saturday: newSales.get("saturday"),
      sunday: newSales.get("sunday"),
      total: (newSales.get("monday")+newSales.get("tuesday")+newSales.get("wednesday")+newSales.get("thursday")+newSales.get("friday")+newSales.get("saturday")+newSales.get("sunday")),
    });
*/
    return leadsData;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'label', Header: 'Report' },
      { accessor: 'monday', Header: 'Monday' },
      { accessor: 'tuesday', Header: 'Tuesday' },
      { accessor: 'wednesday', Header: 'Wednesday' },
      { accessor: 'thursday', Header: 'Thursday' },
      { accessor: 'friday', Header: 'Friday' },
      { accessor: 'saturday', Header: 'Saturday' },
      { accessor: 'sunday', Header: 'Sunday' },
      { accessor: 'total', Header: 'Weekly Total' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading PD Daily report ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>PD Daily Report</h6>
          <div className="dateSettings">
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                let startOfWeek = this.state.startOfWeek.subtract(7, 'days');
                let endOfWeek = this.state.endOfWeek.subtract(7, 'days');
                let data = this.getData(
                  this.state.leads,
                  startOfWeek,
                  endOfWeek,
                );
                this.setState({
                  data: data,
                  startOfWeek: startOfWeek,
                  endOfWeek: endOfWeek,
                });
              }}
            >
              Previous Week
            </button>
            <h6>
              {this.state.startOfWeek.format('L')} to{' '}
              {this.state.endOfWeek.format('L')}
            </h6>
            <button
              type="button"
              className="btn btn-primary report-btn-default"
              disabled={moment().isBetween(
                this.state.startOfWeek,
                this.state.endOfWeek,
              )}
              onClick={e => {
                let startOfWeek = this.state.startOfWeek.add(7, 'days');
                let endOfWeek = this.state.endOfWeek.add(7, 'days');
                let data = this.getData(
                  this.state.leads,
                  startOfWeek,
                  endOfWeek,
                );
                this.setState({
                  data: data,
                  startOfWeek: startOfWeek,
                  endOfWeek: endOfWeek,
                });
              }}
            >
              Next Week
            </button>
          </div>
        </div>
        <ReactToPrint
          trigger={() => (
            <SVGInline svg={printerIcon} className="icon tablePrint" />
          )}
          content={() => this.tableComponentRef}
        />
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

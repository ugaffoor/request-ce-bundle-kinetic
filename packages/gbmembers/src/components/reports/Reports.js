import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import $ from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactSpinner from 'react16-spinjs';
import 'bootstrap/scss/bootstrap.scss';
import _ from 'lodash';
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { actions as reportingActions } from '../../redux/modules/reporting';
import { actions as leadsActions } from '../../redux/modules/leads';
import DateEditor from 'react-tabulator/lib/editors/DateEditor';
import 'react-tabulator/lib/styles.css'; // default theme
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css'; // use Theme(s)
import { ReactTabulator, reactFormatter } from 'react-tabulator';
import Select, { components } from "react-select";
import createClass from "create-react-class";

const mapStateToProps = state => ({
  reports: state.member.reporting.activityReport,
  activityReportLoading: state.member.reporting.activityReportLoading,
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
});

const mapDispatchToProps = {
  fetchReport: reportingActions.fetchActivityReport,
  setReport: reportingActions.setActivityReport,
  fetchLeads: leadsActions.fetchLeads,
};

const util = require('util');
const member_activities_url =
  'app/api/v1/kapps/gbmembers/forms/member-activities/submissions?include=details,values';
const lead_activities_url =
  'app/api/v1/kapps/gbmembers/forms/lead-activities/submissions?include=details,values';
const no_data_placeholder = 'No records found';

export const ReportsView = ({
  reports,
  activityReportLoading,
  members,
  leads,
  membersLoading,
  fetchLeads,
  leadsLoading,
  showMemberActivityReport,
  setShowMemberActivityReport,
  showLeadActivityReport,
  setShowLeadActivityReport
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    <div className="row" style={{ margin: '10px' }}>
      <button
        type="button"
        className="btn btn-primary report-btn-default"
        onClick={e => setShowMemberActivityReport(showMemberActivityReport ? false : true)}
      >
        {showMemberActivityReport ? "Hide Member Activity Report" : "Show Member Activity Report"}
      </button>
        {!showMemberActivityReport ? null : <MemberActivityReport reports={reports} members={members} />}
    </div>
    <div className="row" style={{ margin: '20px 10px 10px 10px' }}>
      <button
        type="button"
        className="btn btn-primary report-btn-default"
        onClick={e => setShowLeadActivityReport(showLeadActivityReport ? false : true)}
      >
        {showLeadActivityReport ? "Hide Leads Activity Report" : "Show Leads Activity Report"}
      </button>
      {!showLeadActivityReport ? null : <LeadsActivityReport fetchLeads={fetchLeads} leads={leads} leadsLoading={leadsLoading}/>}
    </div>
  </div>
);

export const ReportsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('showMemberActivityReport', 'setShowMemberActivityReport', false),
  withState('showLeadActivityReport', 'setShowLeadActivityReport', false),
  withHandlers({
    fetchLeads: ({ fetchLeads }) => () => {
      fetchLeads({});
    },
  }),
  lifecycle({
    componentWillReceiveProps(nextProps) {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(ReportsView);

export class MemberActivityReport extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.activityData = this.getGridData(this.props.members);
    this.handleCellClick = this.handleCellClick.bind(this);

    this.columns = [
      { title: 'Name', field: 'name', bottomCalc: function() {return 'Total'} },
      { title: 'Gender', field: 'gender' },
      { title: 'Email', field: 'email' },
      { title: 'Phone', field: 'phone' },
      { title: 'Address', field: 'address' },
      { title: 'Suburb', field: 'suburb' },
      { title: 'State', field: 'state' },
      { title: 'Age (Years)', field: 'age' },
      { title: 'Member Type', field: 'memberType' },
      { title: 'Billing User', field: 'billingUser' },
      {
        title: 'Emails Sent',
        field: 'emailsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'Emails Received',
        field: 'emailsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'SMS Sent',
        field: 'smsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'SMS Received',
        field: 'smsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
    ];

    this.emailsSentColumns = [
      { title: 'Subject', field: 'Subject' },
      { title: 'Sent Date', field: 'Sent Date' },
    ];
    this.emailsReceivedColumns = [
      { title: 'Subject', field: 'Subject' },
      { title: 'Received Date', field: 'Received Date' },
    ];
    this.smsSentColumns = [
      { title: 'Content', field: 'Content' },
      { title: 'Sent Date', field: 'Sent Date' },
    ];
    this.smsReceivedColumns = [
      { title: 'Content', field: 'Content' },
      { title: 'Received Date', field: 'Received Date' },
    ];

    this.columnsToHide = [
      { label: 'Name', value: 'name' },
      { label: 'Gender', value: 'gender' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Address', value: 'address' },
      { label: 'Suburb', value: 'suburb' },
      { label: 'State', value: 'state' },
      { label: 'Age (Years)', value: 'age' },
      { label: 'Member Type', value: 'memberType' },
      { label: 'Billing User', value: 'billingUser' },
      { label: 'Emails Sent', value: 'emailsSent' },
      { label: 'Emails Received', value: 'emailsReceived' },
      { label: 'SMS Sent', value: 'smsSent' },
      { label: 'SMS Received', value: 'smsReceived' }
    ];

    this.addedFiltersColumns = [
      { title: 'Filter Column', field: 'filterColumn'},
      { title: 'Filter Type', field: 'filterType'},
      { title: 'Filter Value', field: 'filterValue'},
      { headerSort: false, formatter:"buttonCross", width:40, align:"center", cellClick:(e, cell) => this.removeFilter(e, cell)}
    ];

    this.state = {
      filterColumns: this.columnsToHide,
      filters:[]
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentDidMount() {}

  removeFilter = (e, cell) => {
    cell.getRow().delete();
    const filterColumn = cell.getRow().getData()['filterColumn'];
    const filterType = cell.getRow().getData()['filterType'];
    const filterValue = cell.getRow().getData()['filterValue'];

    if (this.state.filters && this.state.filters.length > 0) {
      this.memberActivityGridref.table.removeFilter(filterColumn, filterType, filterValue);
    } else {
      this.memberActivityGridref.table.clearFilter(filterColumn, filterType, filterValue);
    }

    let newFilters = [...this.state.filters].filter(filter => !(filter.filterColumn ===  filterColumn && filter.filterType ===  filterType && filter.filterValue === filterValue));
    this.setState({
      filters: newFilters
    })
  }

  addFilter () {
    const filterColumn = $("#filter-field").val();
    const type = $("#filter-type").val();
    const value = $("#filter-value").val();

    if (!filterColumn || !type || !value) {
      return;
    }

    this.setState({
      filters: [...this.state.filters, {"filterColumn": filterColumn, "filterType": type, "filterValue": value}]
    }, function() {
      if (this.state.filters && this.state.filters.length > 0) {
        this.memberActivityGridref.table.addFilter(filterColumn, type, value);
      } else {
        this.memberActivityGridref.table.setFilter(filterColumn, type, value);
      }
    });

    $("#filter-field").val("");
    $("#filter-type").val("=");
    $("#filter-value").val("");
    //tableRef.table.clearFilter();
  }

  updateFilter = () => {
  }

  ExpandCellButton = (props: any) => {
    const cellData = props.cell._cell.row.data;
    const value = props.cell.getValue();
    return (
      <span>
        {value}{' '}
        <button
          className={value === 0 ? "grid-cell-expand show-sub-grid btn btn-xs disabled" : "grid-cell-expand show-sub-grid btn btn-xs"}
          onClick={() => this.handleCellClick(this, props.cell)}
        >
          Show
        </button>
      </span>
    );
  };

  getGridData(members) {
    if (!members || members.length <0) {
      return []
    }
    let memberActivityData = [];
    let emailsSent = 0,
      emailsReceived = 0,
      smsSent = 0,
      smsReceived = 0;
    members.forEach(member => {
      memberActivityData.push({
        id: member['id'],
        name: member.values['First Name'] + ' ' + member.values['Last Name'],
        gender: member.values['Gender'],
        email: member.values['Email'],
        phone: member.values['Phone Number'],
        address: member.values['Address'],
        suburb: member.values['Suburb'],
        state: member.values['State'],
        age: moment().diff(member.values['DOB'], 'years'),
        memberType: member.values['Member Type'],
        billingUser: member.values['Billing User'] && member.values['Billing User'] === 'YES' ? 'YES' : 'NO',
        emailsSent: isNaN(member.values['Emails Sent Count'])
          ? 0
          : parseInt(member.values['Emails Sent Count']),
        emailsReceived: isNaN(member.values['Emails Received Count'])
          ? 0
          : parseInt(member.values['Emails Received Count']),
        smsSent: isNaN(member.values['SMS Sent Count'])
          ? 0
          : parseInt(member.values['SMS Sent Count']),
        smsReceived: isNaN(member.values['SMS Received Count'])
          ? 0
          : parseInt(member.values['SMS Received Count']),
      });

      emailsSent += isNaN(member.values['Emails Sent Count'])
        ? 0
        : parseInt(member.values['Emails Sent Count']);
      emailsReceived += isNaN(member.values['Emails Received Count'])
        ? 0
        : parseInt(member.values['Emails Received Count']);
      smsSent += isNaN(member.values['SMS Sent Count'])
        ? 0
        : parseInt(member.values['SMS Sent Count']);
      smsReceived += isNaN(member.values['SMS Received Count'])
        ? 0
        : parseInt(member.values['SMS Received Count']);
    });
    return memberActivityData;
  }

  handleCellClick = (that, cell) => {
    var field = cell.getColumn().getField();
    if (
      field !== 'emailsSent' &&
      field !== 'emailsReceived' &&
      field !== 'smsSent' &&
      field !== 'smsReceived'
    ) {
      return;
    }
    var cellElement = cell.getElement();
    var row = cell.getRow();
    var btnElement = $(cellElement).find('.hide-sub-grid');
    if (btnElement.length > 0) {
      $(btnElement)
        .removeClass('hide-sub-grid')
        .addClass('show-sub-grid');
      $(btnElement).text('Show');
      $(row.getElement())
        .find('.report-sub-table')
        .remove();
      $(cellElement).css('background-color', 'white');
    } else {
      //that.setState({isGridLoading: true});
      $(row.getElement())
        .find('.report-sub-table')
        .remove();
      var cells = row.getCells();
      for (var i = 0; i < cells.length; i++) {
        var otherField = cells[i].getColumn().getField();
        if (otherField !== field) {
          $(cells[i].getElement()).css('background-color', 'white');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .text('Show');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .removeClass('hide-sub-grid')
            .addClass('show-sub-grid');
        }
      }
      $(cellElement).css('background-color', '#ced7e5');
      //$(cellElement).css("background-color", "#9dbae8");
      //$(cellElement).css("background-color", "#c0c6d6");
      var holderEl = document.createElement('div');
      var tableEl = document.createElement('div');
      $(holderEl).addClass('report-sub-table');
      holderEl.appendChild(tableEl);
      var memberId = row.getData()['id'];
      if (field === 'emailsSent') {
        var url =
          member_activities_url +
          '&q=values[Member ID]="' +
          memberId +
          '"+AND+values[Direction]="Outbound"+AND+values[Type]="Email"';
        var fetchEmails = this.fetchData(memberId, url);
        fetchEmails.then(emailsSent => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.emailsSentColumns}
              data={emailsSent}
              placeholder={no_data_placeholder}
              options={{
                height: emailsSent.length ? 30 + emailsSent.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'emailsReceived') {
        var url =
          member_activities_url +
          '&q=values[Member ID]="' +
          memberId +
          '"+AND+values[Direction]="Inbound"+AND+values[Type]="Email"';
        var fetchEmails = this.fetchData(memberId, url);
        fetchEmails.then(emailsReceived => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.emailsReceivedColumns}
              data={emailsReceived}
              placeholder={no_data_placeholder}
              options={{
                height: emailsReceived.length
                  ? 30 + emailsReceived.length * 50
                  : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'smsSent') {
        var url =
          member_activities_url +
          '&q=values[Member ID]="' +
          memberId +
          '"+AND+values[Direction]="Outbound"+AND+values[Type]="SMS"';
        var fetchSms = this.fetchData(memberId, url);
        fetchSms.then(smsSent => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.smsSentColumns}
              data={smsSent}
              placeholder={no_data_placeholder}
              options={{
                height: smsSent.length ? 30 + smsSent.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'smsReceived') {
        var url =
          member_activities_url +
          '&q=values[Member ID]="' +
          memberId +
          '"+AND+values[Direction]="Inbound"+AND+values[Type]="SMS"';
        var fetchSms = this.fetchData(memberId, url);
        fetchSms.then(smsReceived => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.smsReceivedColumns}
              data={smsReceived}
              placeholder={no_data_placeholder}
              options={{
                height: smsReceived.length ? 30 + smsReceived.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      }
      row.getElement().appendChild(holderEl);
      btnElement = $(cellElement).find('.show-sub-grid');
      $(btnElement)
        .removeClass('show-sub-grid')
        .addClass('hide-sub-grid');
      $(btnElement).text('Hide');
      //that.setState({isGridLoading: false});
    }
  };

  fetchData = (memberId, url) => {
    return fetch(url)
      .then(res => res.json())
      .then(
        result => {
          var data = result.submissions.map(submission =>
            JSON.parse(submission.values.Content),
          );
          return data ? data : [];
        },
        error => {
          console.log('error: ' + util.inspect(error));
          return [];
        },
      );
  };

  downLoadTableAsCsv() {
    this.memberActivityGridref.table.download("csv", "member-activity-report.csv");
  }

  onColumnDropdownChange = (e) => {
    this.columnsToHide.forEach(column => {
      this.memberActivityGridref.table.showColumn(column.value);
    });

    e.forEach(column => {
      this.memberActivityGridref.table.hideColumn(column.value);
    });

    this.setState({
      filterColumns: this.columnsToHide.filter(column => !e.some(elm => elm.value === column.value ))
    });
  }

  render() {
    const options = {
      height: 450,
      movableRows: true,
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      downloadDataFormatter: (data) => data,
      downloadReady: (fileContents, blob) => blob
    };
    return (
      <span>
        <div
          style={{
            textAlign: 'center',
            background: '#991b1e',
            color: 'white',
            fontSize: '10px',
          }}
        >
          <h6>Member Activity Report</h6>
        </div>
        <div className="table-controls">
            <span>
              <label>Field: </label>
              <select id="filter-field">
                  <option></option>
                  {this.state.filterColumns.map(column => <option key={column.value} value={column.value}>{column.label}</option>)}
              </select>
            </span>
            <span>
              <label>Type: </label>
              <select id="filter-type">
                  <option value="=">=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="!=">!=</option>
                  <option value="like">like</option>
              </select>
            </span>
              <span><label>Value: </label> <input id="filter-value" type="text" placeholder="value to filter" size="15"/></span>
              <button id="filter-add" onClick={(e) => this.addFilter(e)}>Create Filter</button>
              <span className="vl"></span>
              <button name="download" onClick={(e) => this.downLoadTableAsCsv(e)}><i className="fa fa-download"></i> Download Data as CSV</button>
              <div style={{display: 'inline-block', width: '350px'}}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                components={{ Option, MultiValue }}
                options={this.columnsToHide}
                hideSelectedOptions={false}
                backspaceRemovesValue={false}
                onChange={e => this.onColumnDropdownChange(e)}
                className="hide-columns-container"
                classNamePrefix="hide-columns"
                placeholder="Select columns to hide"
                style={{width: '350px'}}
              />
              </div>
        </div>
        {this.state.filters && this.state.filters.length > 0
            ? <div className="table-controls">
              <div style={{margin: '10px' }}>
              <ReactTabulator
                ref={ref => (this.filtersGridref = ref)}
                columns={this.addedFiltersColumns}
                data={this.state.filters}
                options={{width: '100%'}}
              />
            </div>
    		</div>
        : null}
        <div
          style={{ width: '100%', height: '420px', margin: '10px' }}
          className="row"
        >
          <ReactTabulator
            ref={ref => (this.memberActivityGridref = ref)}
            columns={this.columns}
            data={this.activityData}
            options={options}
          />
        </div>
      </span>
    );
  }
}

export class LeadsActivityReport extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.activityData = this.getGridData(this.props.leads);
    this.handleCellClick = this.handleCellClick.bind(this);

    this.columns = [
      { title: 'Name', field: 'name', bottomCalc: function() {return 'Total'} },
      { title: 'Gender', field: 'gender' },
      { title: 'Email', field: 'email' },
      { title: 'Phone', field: 'phone' },
      { title: 'Address', field: 'address' },
      { title: 'Suburb', field: 'suburb' },
      { title: 'State', field: 'state' },
      { title: 'Age (Years)', field: 'age' },
      { title: 'Source', field: 'source' },
      { title: 'Reminder Date', field: 'reminderDate' },
      { title: 'Emails Sent', field: 'emailsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'Emails Received',
        field: 'emailsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'SMS Sent',
        field: 'smsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
      {
        title: 'SMS Received',
        field: 'smsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum'
      },
    ];

    this.emailsSentColumns = [
      { title: 'Subject', field: 'Subject' },
      { title: 'Sent Date', field: 'Sent Date' },
    ];
    this.emailsReceivedColumns = [
      { title: 'Subject', field: 'Subject' },
      { title: 'Received Date', field: 'Received Date' },
    ];
    this.smsSentColumns = [
      { title: 'Content', field: 'Content' },
      { title: 'Sent Date', field: 'Sent Date' },
    ];
    this.smsReceivedColumns = [
      { title: 'Content', field: 'Content' },
      { title: 'Received Date', field: 'Received Date' },
    ];

    this.columnsToHide = [
      { label: 'Name', value: 'name' },
      { label: 'Gender', value: 'gender' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Address', value: 'address' },
      { label: 'Suburb', value: 'suburb' },
      { label: 'State', value: 'state' },
      { label: 'Age (Years)', value: 'age' },
      { label: 'Source', value: 'source' },
      { label: 'Reminder Date', value: 'reminderDate' },
      { label: 'Emails Sent', value: 'emailsSent' },
      { label: 'Emails Received', value: 'emailsReceived' },
      { label: 'SMS Sent', value: 'smsSent' },
      { label: 'SMS Received', value: 'smsReceived' }
    ];

    this.addedFiltersColumns = [
      { title: 'Filter Column', field: 'filterColumn'},
      { title: 'Filter Type', field: 'filterType'},
      { title: 'Filter Value', field: 'filterValue'},
      { headerSort: false, formatter:"buttonCross", width:40, align:"center", cellClick:(e, cell) => this.removeFilter(e, cell)}
    ];

    this.state = {
      filterColumns: this.columnsToHide,
      filters:[]
    };
  }

  componentWillReceiveProps(nextProps) {
    let data = this.getGridData(nextProps.leads);
    this.setState({
      activityData: data
    })
  }

  componentWillMount() {
    this.props.fetchLeads();
  }

  removeFilter = (e, cell) => {
    cell.getRow().delete();
    const filterColumn = cell.getRow().getData()['filterColumn'];
    const filterType = cell.getRow().getData()['filterType'];
    const filterValue = cell.getRow().getData()['filterValue'];

    if (this.state.filters && this.state.filters.length > 0) {
      this.leadsActivityGridref.table.removeFilter(filterColumn, filterType, filterValue);
    } else {
      this.leadsActivityGridref.table.clearFilter(filterColumn, filterType, filterValue);
    }

    let newFilters = [...this.state.filters].filter(filter => !(filter.filterColumn ===  filterColumn && filter.filterType ===  filterType && filter.filterValue === filterValue));
    this.setState({
      filters: newFilters
    })
  }

  addFilter () {
    const filterColumn = $("#filter-field-leads").val();
    const type = $("#filter-type-leads").val();
    const value = $("#filter-value-leads").val();

    if (!filterColumn || !type || !value) {
      return;
    }

    this.setState({
      filters: [...this.state.filters, {"filterColumn": filterColumn, "filterType": type, "filterValue": value}]
    }, function() {
      if (this.state.filters && this.state.filters.length > 0) {
        this.leadsActivityGridref.table.addFilter(filterColumn, type, value);
      } else {
        this.leadsActivityGridref.table.setFilter(filterColumn, type, value);
      }
    });

    $("#filter-field-leads").val("");
    $("#filter-type-leads").val("=");
    $("#filter-value-leads").val("");
    //tableRef.table.clearFilter();
  }

  ExpandCellButton = (props: any) => {
    const cellData = props.cell._cell.row.data;
    const value = props.cell.getValue();
    return (
      <span>
        {value}{' '}
        <button
          className={value === 0 ? "grid-cell-expand show-sub-grid btn btn-xs disabled" : "grid-cell-expand show-sub-grid btn btn-xs"}
          onClick={() => this.handleCellClick(this, props.cell)}
        >
          Show
        </button>
      </span>
    );
  };

  getGridData(leads) {
    if (!leads || leads.length <= 0) {
      return [];
    }
    let leadsActivityData = [];
    let emailsSent = 0,
      emailsReceived = 0,
      smsSent = 0,
      smsReceived = 0;
    leads.forEach(lead => {
      leadsActivityData.push({
        id: lead['id'],
        name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
        gender: lead.values['Gender'],
        email: lead.values['Email'],
        phone: lead.values['Phone Number'],
        address: lead.values['Address'],
        suburb: lead.values['Suburb'],
        state: lead.values['State'],
        age: moment().diff(lead.values['DOB'], 'years'),
        source: lead.values['Source'],
        reminderDate: lead.values['Reminder Date'],
        emailsSent: isNaN(lead.values['Emails Sent Count'])
          ? 0
          : parseInt(lead.values['Emails Sent Count']),
        emailsReceived: isNaN(lead.values['Emails Received Count'])
          ? 0
          : parseInt(lead.values['Emails Received Count']),
        smsSent: isNaN(lead.values['SMS Sent Count'])
          ? 0
          : parseInt(lead.values['SMS Sent Count']),
        smsReceived: isNaN(lead.values['SMS Received Count'])
          ? 0
          : parseInt(lead.values['SMS Received Count']),
      });

      emailsSent += isNaN(lead.values['Emails Sent Count'])
        ? 0
        : parseInt(lead.values['Emails Sent Count']);
      emailsReceived += isNaN(lead.values['Emails Received Count'])
        ? 0
        : parseInt(lead.values['Emails Received Count']);
      smsSent += isNaN(lead.values['SMS Sent Count'])
        ? 0
        : parseInt(lead.values['SMS Sent Count']);
      smsReceived += isNaN(lead.values['SMS Received Count'])
        ? 0
        : parseInt(lead.values['SMS Received Count']);
    });
    return leadsActivityData;
  }

  handleCellClick = (that, cell) => {
    var field = cell.getColumn().getField();
    if (
      field !== 'emailsSent' &&
      field !== 'emailsReceived' &&
      field !== 'smsSent' &&
      field !== 'smsReceived'
    ) {
      return;
    }
    var cellElement = cell.getElement();
    var row = cell.getRow();
    var btnElement = $(cellElement).find('.hide-sub-grid');
    if (btnElement.length > 0) {
      $(btnElement)
        .removeClass('hide-sub-grid')
        .addClass('show-sub-grid');
      $(btnElement).text('Show');
      $(row.getElement())
        .find('.report-sub-table')
        .remove();
      $(cellElement).css('background-color', 'white');
    } else {
      //that.setState({isGridLoading: true});
      $(row.getElement())
        .find('.report-sub-table')
        .remove();
      var cells = row.getCells();
      for (var i = 0; i < cells.length; i++) {
        var otherField = cells[i].getColumn().getField();
        if (otherField !== field) {
          $(cells[i].getElement()).css('background-color', 'white');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .text('Show');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .removeClass('hide-sub-grid')
            .addClass('show-sub-grid');
        }
      }
      $(cellElement).css('background-color', '#ced7e5');
      //$(cellElement).css("background-color", "#9dbae8");
      //$(cellElement).css("background-color", "#c0c6d6");
      var holderEl = document.createElement('div');
      var tableEl = document.createElement('div');
      $(holderEl).addClass('report-sub-table');
      holderEl.appendChild(tableEl);
      var leadId = row.getData()['id'];
      if (field === 'emailsSent') {
        var url =
          lead_activities_url +
          '&q=values[Lead ID]="' +
          leadId +
          '"+AND+values[Direction]="Outbound"+AND+values[Type]="Email"';
        var fetchEmails = this.fetchData(leadId, url);
        fetchEmails.then(emailsSent => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.emailsSentColumns}
              data={emailsSent}
              placeholder={no_data_placeholder}
              options={{
                height: emailsSent.length ? 30 + emailsSent.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'emailsReceived') {
        var url =
          lead_activities_url +
          '&q=values[Lead ID]="' +
          leadId +
          '"+AND+values[Direction]="Inbound"+AND+values[Type]="Email"';
        var fetchEmails = this.fetchData(leadId, url);
        fetchEmails.then(emailsReceived => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.emailsReceivedColumns}
              data={emailsReceived}
              placeholder={no_data_placeholder}
              options={{
                height: emailsReceived.length
                  ? 30 + emailsReceived.length * 50
                  : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'smsSent') {
        var url =
          lead_activities_url +
          '&q=values[Lead ID]="' +
          leadId +
          '"+AND+values[Direction]="Outbound"+AND+values[Type]="SMS"';
        var fetchSms = this.fetchData(leadId, url);
        fetchSms.then(smsSent => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.smsSentColumns}
              data={smsSent}
              placeholder={no_data_placeholder}
              options={{
                height: smsSent.length ? 30 + smsSent.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      } else if (field === 'smsReceived') {
        var url =
          lead_activities_url +
          '&q=values[Lead ID]="' +
          leadId +
          '"+AND+values[Direction]="Inbound"+AND+values[Type]="SMS"';
        var fetchSms = this.fetchData(leadId, url);
        fetchSms.then(smsReceived => {
          ReactDOM.render(
            <ReactTabulator
              ref={ref => (this.ref = ref)}
              columns={this.smsReceivedColumns}
              data={smsReceived}
              placeholder={no_data_placeholder}
              options={{
                height: smsReceived.length ? 30 + smsReceived.length * 50 : 80,
              }}
            />,
            tableEl,
          );
        });
      }
      row.getElement().appendChild(holderEl);
      btnElement = $(cellElement).find('.show-sub-grid');
      $(btnElement)
        .removeClass('show-sub-grid')
        .addClass('hide-sub-grid');
      $(btnElement).text('Hide');
      //that.setState({isGridLoading: false});
    }
  };

  fetchData = (leadId, url) => {
    return fetch(url)
      .then(res => res.json())
      .then(
        result => {
          var data = result.submissions.map(submission =>
            JSON.parse(submission.values.Content),
          );
          return data ? data : [];
        },
        error => {
          console.log('error: ' + util.inspect(error));
          return [];
        },
      );
  };

  downLoadTableAsCsv() {
    this.leadsActivityGridref.table.download("csv", "leads-activity-report.csv");
  }

  onColumnDropdownChange = (e) => {
    this.columnsToHide.forEach(column => {
      this.leadsActivityGridref.table.showColumn(column.value);
    });

    e.forEach(column => {
      this.leadsActivityGridref.table.hideColumn(column.value);
    });

    this.setState({
      filterColumns: this.columnsToHide.filter(column => !e.some(elm => elm.value === column.value ))
    });
  }

  render() {
    const options = {
      height: 450,
      movableRows: true,
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      downloadDataFormatter: (data) => data,
      downloadReady: (fileContents, blob) => blob
    };
    return this.props.leadsLoading ? (
        <div>
          <p>Loading leads activity report ...</p>
          <ReactSpinner />{' '}
        </div>
      ) :
      (<span>
        <div
          style={{
            textAlign: 'center',
            background: '#991b1e',
            color: 'white',
            fontSize: '10px',
          }}
        >
          <h6>Leads Activity Report</h6>
        </div>
        <div className="table-controls">
            <span>
              <label>Field: </label>
              <select id="filter-field-leads">
                  <option></option>
                  {this.state.filterColumns.map(column => <option key={column.value} value={column.value}>{column.label}</option>)}
              </select>
            </span>
            <span>
              <label>Type: </label>
              <select id="filter-type-leads">
                  <option value="=">=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="!=">!=</option>
                  <option value="like">like</option>
              </select>
            </span>
              <span><label>Value: </label> <input id="filter-value-leads" type="text" placeholder="value to filter" size="15"/></span>
              <button id="filter-add-leads" onClick={(e) => this.addFilter(e)}>Create Filter</button>
              <span className="vl"></span>
              <button name="download" onClick={(e) => this.downLoadTableAsCsv(e)}><i className="fa fa-download"></i> Download Data as CSV</button>
              <div style={{display: 'inline-block', width: '350px'}}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                components={{ Option, MultiValue }}
                options={this.columnsToHide}
                hideSelectedOptions={false}
                backspaceRemovesValue={false}
                onChange={e => this.onColumnDropdownChange(e)}
                className="hide-columns-container"
                classNamePrefix="hide-columns"
                placeholder="Select columns to hide"
                style={{width: '350px'}}
              />
              </div>
        </div>
        {this.state.filters && this.state.filters.length > 0
            ? <div className="table-controls">
              <div style={{margin: '10px' }}>
              <ReactTabulator
                ref={ref => (this.filtersGridref = ref)}
                columns={this.addedFiltersColumns}
                data={this.state.filters}
                options={{width: '100%'}}
              />
            </div>
    		</div>
        : null}
        <div
          style={{ width: '100%', height: '420px', margin: '10px' }}
          className="row"
        >
          <ReactTabulator
            ref={ref => (this.leadsActivityGridref = ref)}
            columns={this.columns}
            data={this.state.activityData}
            options={options}
          />
        </div>
      </span>);
  }
}

const Option = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <input
            type="checkbox"
            checked={this.props.isSelected}
            value={this.props.value}
            onChange={e => console.log()}
          />{" "}
          <label>{this.props.label}</label>
        </components.Option>
      </div>
    );
  }
});

const MultiValue = props => {
  return (
    <components.MultiValue {...props}>
      <span>{props.data.label}</span>
    </components.MultiValue>
  );
};

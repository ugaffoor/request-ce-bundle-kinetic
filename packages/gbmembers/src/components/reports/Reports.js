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
    this.data = this.getGridData(this.props.members);
    this.handleCellClick = this.handleCellClick.bind(this);
    this.activityData = this.data.memberActivity;

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
      { label: 'Emails Sent', value: 'emailsSent' },
      { label: 'Emails Received', value: 'emailsReceived' },
      { label: 'SMS Sent', value: 'smsSent' },
      { label: 'SMS Received', value: 'smsReceived' }
    ];

    this.state = {
      filterColumns: this.columnsToHide
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentDidMount() {
    //Update filters on value change
    let tableRef = this.memberActivityGridref;
    $("#filter-field, #filter-type").change(this.updateFilter);
    $("#filter-value").keyup(this.updateFilter);

    //Clear filters on "Clear Filters" button click
    $("#filter-clear").click(function(){
        $("#filter-field").val("");
        $("#filter-type").val("=");
        $("#filter-value").val("");

        tableRef.table.clearFilter();
    });
  }

  updateFilter = () => {
    var filter = $("#filter-field").val();
    if($("#filter-field").val() == "function" ){
        $("#filter-type").prop("disabled", true);
        $("#filter-value").prop("disabled", true);
    }else{
        $("#filter-type").prop("disabled", false);
        $("#filter-value").prop("disabled", false);
    }
    this.memberActivityGridref.table.setFilter(filter, $("#filter-type").val(), $("#filter-value").val());
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
    let memberActivity = [];
    let emailsSent = 0,
      emailsReceived = 0,
      smsSent = 0,
      smsReceived = 0;
    if (members) {
      members.forEach(member => {
        memberActivity.push({
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
    }
    return { memberActivity: memberActivity };
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

  onHideColumnCheckboxChange = (that, e) => {
    //console.log("event=" + util.inspect(e));
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
        {this.state.isGridLoading && <ReactSpinner />}
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
              <button id="filter-clear">Clear Filter</button>
              <span className="vl"></span>
              <button name="download" onClick={(e) => this.downLoadTableAsCsv(e)}><i className="fa fa-download"></i> Download Data as CSV</button>
              <div style={{display: 'inline-block'}}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                components={{ Option, MultiValue }}
                options={this.columnsToHide}
                hideSelectedOptions={false}
                backspaceRemovesValue={false}
                onChange={e => this.onColumnDropdownChange(e)}
                className="hide-columns-select"
                onHideColumnCheckboxChange={this.onHideColumnCheckboxChange}
                placeholder="Select columns to hide"
              />
              </div>
        </div>
        <div id="tabulator-controls" className="table-controls  hidden-xs row">
            <div className="col-md-3">

          </div>
    		</div>
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
    this.data = this.getGridData(this.props.leads);
    this.handleCellClick = this.handleCellClick.bind(this);
    this.activityData = this.data.leadsActivity;

    this.columns = [
      { title: 'Name', field: 'name', headerFilter: 'input', bottomCalc: function() {return 'Total'} },
      { title: 'Gender', field: 'gender', headerFilter: 'input' },
      { title: 'Email', field: 'email', headerFilter: 'input' },
      { title: 'Phone', field: 'phone', headerFilter: 'input' },
      { title: 'Address', field: 'address', headerFilter: 'input' },
      { title: 'Suburb', field: 'suburb', headerFilter: 'input' },
      { title: 'State', field: 'state', headerFilter: 'input' },
      { title: 'Age (Years)', field: 'age', headerFilter: 'input' },
      { title: 'Source', field: 'source', headerFilter: 'input' },
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
    this.state = {
      activityData: this.activityData
    };
  }

  componentWillReceiveProps(nextProps) {
    let data = this.getGridData(nextProps.leads);
    this.setState({
      activityData: data.leadsActivity
    })
  }

  componentWillMount() {
    this.props.fetchLeads();
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
      return { leadsActivity: [] };
    }
    let leadsActivity = [];
    let emailsSent = 0,
      emailsReceived = 0,
      smsSent = 0,
      smsReceived = 0;
      leads.forEach(lead => {
        leadsActivity.push({
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
    return { leadsActivity: leadsActivity };
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

  render() {
    const options = {
      height: 450,
      movableRows: true,
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
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
            onChange={e => this.props.selectProps.onHideColumnCheckboxChange(this, e)}
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

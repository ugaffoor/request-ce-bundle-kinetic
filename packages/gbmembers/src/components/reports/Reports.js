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
import { actions as appActions } from '../../redux/modules/memberApp';
import { Confirm } from 'react-confirm-bootstrap';
import { Creatable } from 'react-select';

const mapStateToProps = state => ({
  reports: state.member.reporting.activityReport,
  activityReportLoading: state.member.reporting.activityReportLoading,
  members: state.member.members.allMembers,
  leads: state.member.leads.allLeads,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  reportPreferences: state.member.app.reportPreferences,
  memberStatusValues: state.member.app.memberStatusValues,
  leadStatusValues: state.member.app.leadStatusValues,
  programs: state.member.app.programs,
  belts: state.member.app.belts,
  membershipTypes: state.member.app.membershipTypes
});

const mapDispatchToProps = {
  fetchReport: reportingActions.fetchActivityReport,
  setReport: reportingActions.setActivityReport,
  fetchLeads: leadsActions.fetchLeads,
  updateReportPreferences: appActions.updateReportPreferences
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
  setShowLeadActivityReport,
  updatePreferences,
  reportPreferences,
  memberStatusValues,
  leadStatusValues,
  programs,
  belts,
  membershipTypes
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    <div style={{ margin: '10px' }}>
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => setShowMemberActivityReport(showMemberActivityReport ? false : true)}
        >
          {showMemberActivityReport ? "Hide Member Activity Report" : "Show Member Activity Report"}
        </button>
      </div>
      <div className="row">
        {!showMemberActivityReport ? null :
          <MemberActivityReport
          reports={reports}
          members={members}
          reportPreferences={reportPreferences}
          updatePreferences={updatePreferences}
          memberStatusValues={memberStatusValues}
          programs={programs}
          belts={belts}
          membershipTypes={membershipTypes}
          />
        }
      </div>
    </div>
    <div style={{ margin: '20px 0px 0px 10px' }} id="leads-report">
      <div className="row">
        <button
          type="button"
          className="btn btn-primary report-btn-default"
          onClick={e => {setShowLeadActivityReport(showLeadActivityReport ? false : true); document.getElementById("leads-report").scrollIntoView()}}
        >
          {showLeadActivityReport ? "Hide Leads Activity Report" : "Show Leads Activity Report"}
        </button>
      </div>
      <div className="row">
        {!showLeadActivityReport ? null :
          <LeadsActivityReport
          fetchLeads={fetchLeads}
          leads={leads}
          leadsLoading={leadsLoading}
          reportPreferences={reportPreferences}
          updatePreferences={updatePreferences}
          leadStatusValues={leadStatusValues}
          />
        }
      </div>
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
    updatePreferences:({updateReportPreferences}) => (key, value) => {
      updateReportPreferences({key, reportPreferences: value});
    }
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
      { title: 'Name', field: 'name', tooltip: true, bottomCalc: function() {return 'Total'} },
      { title: 'Gender', field: 'gender' },
      { title: 'Status', field: 'status' },
      { title: 'Email', field: 'email', tooltip: true },
      { title: 'Phone', field: 'phone', tooltip: true },
      { title: 'Address', field: 'address', tooltip: true },
      { title: 'Suburb', field: 'suburb', tooltip: true },
      { title: 'State', field: 'state' },
      { title: 'Age (Years)', field: 'age' },
      { title: 'Member Type', field: 'memberType' },
      { title: 'Program', field: 'program' },
      { title: 'Belt', field: 'belt' },
      { title: 'Billing User', field: 'billingUser' },
      { title: 'Cost', field: 'cost', bottomCalc: 'sum' },
      { title: 'Average', field: 'average', bottomCalc: this.averageCostCalc },
      { title: 'Payment Period', field: 'paymentPeriod' },
      { title: 'Family Members', field: 'familyMembers' },
      {
        title: 'Emails Sent',
        field: 'emailsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'Emails Received',
        field: 'emailsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'SMS Sent',
        field: 'smsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'SMS Received',
        field: 'smsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
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
      { label: "Member Columns",
        options: [
        { label: 'Name', value: 'name' },
        { label: 'Gender', value: 'gender' },
        { label: 'Status', value: 'status' },
        { label: 'Email', value: 'email' },
        { label: 'Phone', value: 'phone' },
        { label: 'Address', value: 'address' },
        { label: 'Suburb', value: 'suburb' },
        { label: 'State', value: 'state' },
        { label: 'Age (Years)', value: 'age' },
        { label: 'Member Type', value: 'memberType' },
        { label: 'Program', value: 'program' },
        { label: 'Belt', value: 'belt' },
        { label: 'Emails Sent', value: 'emailsSent' },
        { label: 'Emails Received', value: 'emailsReceived' },
        { label: 'SMS Sent', value: 'smsSent' },
        { label: 'SMS Received', value: 'smsReceived' } ]
      },
        { label: "Billing Columns",
          options: [
          { label: 'Billing User', value: 'billingUser' },
          { label: 'Cost', value: 'cost' },
          { label: 'Average', value: 'average' },
          { label: 'Payment Period', value: 'paymentPeriod' },
          { label: 'Family Members', value: 'familyMembers' }]
        }
      ];

    this.addedFiltersColumns = [
      { title: 'Filter Column', field: 'filterColumn'},
      { title: 'Filter Type', field: 'filterType'},
      { title: 'Filter Value', field: 'filterValue'},
      { headerSort: false, formatter:"buttonCross", width:40, align:"center", cellClick:(e, cell) => this.removeFilter(e, cell)}
    ];

    this.filterColumns = [
      { label: 'Name', value: 'name' },
      { label: 'Gender', value: 'gender' },
      { label: 'Status', value: 'status' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Address', value: 'address' },
      { label: 'Suburb', value: 'suburb' },
      { label: 'State', value: 'state' },
      { label: 'Age (Years)', value: 'age' },
      { label: 'Member Type', value: 'memberType' },
      { label: 'Program', value: 'program' },
      { label: 'Belt', value: 'belt' },
      { label: 'Billing User', value: 'billingUser' },
      { label: 'Cost', value: 'cost', key: 'cost' },
      { label: 'Average', value: 'average', key: 'cost' },
      { label: 'Payment Period', value: 'paymentPeriod' },
      { label: 'Family Members', value: 'familyMembers' },
      { label: 'Emails Sent', value: 'emailsSent' },
      { label: 'Emails Received', value: 'emailsReceived' },
      { label: 'SMS Sent', value: 'smsSent' },
      { label: 'SMS Received', value: 'smsReceived' }
    ];

    this.memberPreferences = this.getTablePreferences(this.props.reportPreferences);
    this.visibleColumns = this.filterColumns.filter(column => !this.memberPreferences.hiddenCols.some(hc => hc.value === column.value));
    this.selectedColumns = this.visibleColumns;
    this.filterValueOptions = {
      'gender': ['Male', 'Female'],
     'status': this.props.memberStatusValues,
     'billingUser': ['YES', 'NO'],
     'memberType': this.props.membershipTypes.map(type => type.type),
     'program': this.props.programs.map(program => program.program),
     'belt': [...new Set(this.props.belts.map(belt => belt.belt))]
   };
   this.filterIds = {};

   this.state = {
      filterColumns: this.filterColumns,
      filters:[],
      selectedFilterValueOptions: [],
      selectedColumns: this.selectedColumns,
      hiddenColumns: this.memberPreferences.hiddenCols,
      preferences: this.memberPreferences.preferences,
      selectedPreference: this.memberPreferences.selectedPreference,
      key: Math.random(),
      includesOptions: [],
      includesValue: []
    };
  }

  componentWillReceiveProps(nextProps) {
    if(!this.props.reportPreferences.equals(nextProps.reportPreferences)) {
      let preferences = this.getTablePreferences(nextProps.reportPreferences);
      this.setState({
        preferences: preferences.preferences
      });
    }
  }

  averageCostCalc = (values, data, calcParams) => {
    //values - array of column values
    //data - all table data
    //calcParams - params passed from the column definition object
    var cost = 0;
    values.forEach(function(value){
      if(!isNaN(parseFloat(value))) {
        cost += parseFloat(value);
      }
    });
    return cost.toFixed(2);
  }

  getTablePreferences = (reportPreferences) => {
      let obj = null;
      let hiddenCols = [];
      if (reportPreferences && reportPreferences.size > 0) {
        obj = reportPreferences.find(x => x.hasOwnProperty("Member Activity Report"));
      }
      let preferences = [];
      let selectedPreference = '';
      if (obj) {
        obj["Member Activity Report"].forEach(pref => {
          preferences.push(pref['Preference Name']);
          if (pref['Is Default'] && pref['Is Default'] === true) {
            selectedPreference = pref['Preference Name'];
            hiddenCols = pref['Hidden Columns'];
          }
        });
      }
      return {hiddenCols: hiddenCols, preferences: preferences, selectedPreference: selectedPreference};
  }

  hideColumns = () => {
    if(this.state.hiddenColumns && this.memberActivityGridref) {
      this.state.hiddenColumns.forEach(column => {
        this.memberActivityGridref.table.hideColumn(column.value);
      });
    }
  }

  removeFilter = (e, cell) => {
    const filterColumn = cell.getRow().getData()['filterColumn'];
    const filterType = cell.getRow().getData()['filterType'];
    const filterValue = cell.getRow().getData()['filterValue'];
    const filterId = cell.getRow().getData()['filterId'];

    if (this.state.filters && this.state.filters.length > 0) {
      if (filterType === 'includes') {
        this.memberActivityGridref.table.removeFilter(this.includesFilter, this.filterIds[filterId]);
      } else {
        this.memberActivityGridref.table.removeFilter(filterColumn, filterType, filterValue);
      }
    } else {
      if (filterType === 'includes') {
        this.memberActivityGridref.table.clearFilter(this.includesFilter, this.filterIds[filterId]);
      } else {
        this.memberActivityGridref.table.clearFilter(filterColumn, filterType, filterValue);
      }
    }

    let newFilters = [...this.state.filters].filter(filter => !(filter.filterColumn ===  filterColumn && filter.filterType ===  filterType && filter.filterValue === filterValue));
    this.setState({
      filters: newFilters
    })
  }

  addFilter () {
    const filterColumn = $("#filter-field").val();
    const type = $("#filter-type").val();
    let value = $("#filter-value-text").val() ? $("#filter-value-text").val() : $("#filter-value-select").val();

    if (!value) {
      value = this.state.includesValue && this.state.includesValue.length > 0 ? this.state.includesValue : null;
    }

    if (!filterColumn || !type || !value) {
      return;
    }

    if (type === 'includes') {
      let values = this.state.includesValue.map(val => val.value);
      let filterId = Math.random();
      let filterParams = {field: filterColumn, includes: values};
      this.filterIds[filterId] = filterParams;
      this.setState({
        filters: [...this.state.filters, {"filterId": filterId, "filterColumn": filterColumn, "filterType": type, "filterValue": JSON.stringify(values)}],
        includesValue: []
      }, function(){
        if (this.state.filters && this.state.filters.length > 0) {
          this.memberActivityGridref.table.addFilter(this.includesFilter, filterParams);
        } else {
          this.memberActivityGridref.table.setFilter(this.includesFilter, filterParams);
        };
      });
    } else {
      this.setState({
        filters: [...this.state.filters, {"filterColumn": filterColumn, "filterType": type, "filterValue": value}]
      }, function() {
        if (this.state.filters && this.state.filters.length > 0) {
          this.memberActivityGridref.table.addFilter(filterColumn, type, value);
        } else {
          this.memberActivityGridref.table.setFilter(filterColumn, type, value);
        }
      });
    }

    $('.includes-container-member').attr('style','display:none !important');
    $('#filter-value-text').show();
    $("#filter-field").val("");
    $("#filter-type").val("=");
    $("#filter-value-text").val("");
    $("#filter-value-select").val("");
    //tableRef.table.clearFilter();
  }

  includesFilter = (data, params) => {
    const filterColumn = $("#filter-field").val();
    let result = params.includes.some(value => value === data[params.field]);
    return result;
  }

  onFilterFieldChange = (event) => {
    const type = $("#filter-type").val();
    let options = this.filterValueOptions[event.target.value];
    if (!options) {
      options = [];
    }
    this.setState({includesValue: null});
    if (type === 'includes') {
      let includesOptions = [];
      options.forEach(option => includesOptions.push({label: option, value: option}));
      this.setState({includesOptions: includesOptions});
      return;
    }

    $('.includes-container-member').attr('style','display:none !important');
    if(options && options.length > 0) {
      $('#filter-value-text').hide();
      $('#filter-value-select').show();
      this.setState({selectedFilterValueOptions: options});
    } else {
      $('#filter-value-text').show();
      $('#filter-value-select').hide();
      this.setState({selectedFilterValueOptions: []});
    }
  }

  onFilterTypeChange = (event) => {
    let options = this.filterValueOptions[$('#filter-field').val()];
    if (!options) {
      options = [];
    }
    this.setState({includesValue: null});
    if (event.target.value === 'includes') {
      let includesOptions = [];
      options.forEach(option => includesOptions.push({label: option, value: option}));
      this.setState({includesOptions: includesOptions});
      $('#filter-value-text').hide();
      $('#filter-value-select').hide();
      $('.includes-container-member').attr('style','display:inline-block !important');
    } else {
      $('.includes-container-member').attr('style','display:none !important');
      if(options && options.length > 0) {
        $('#filter-value-text').hide();
        $('#filter-value-select').show();
        this.setState({selectedFilterValueOptions: options});
      } else {
        $('#filter-value-text').show();
        $('#filter-value-select').hide();
        this.setState({selectedFilterValueOptions: []});
      }
    }
  }

  handlePreferenceChange = (event) => {
    this.setState({selectedPreference: event.target.value});
    if (!event.target.value) {
      this.setState({
        filterColumns: this.filterColumns,
        selectedColumns: this.filterColumns,
        hiddenColumns: [],
        filters: [],
        key: Math.random()
      });
      this.filterColumns.forEach(column => {
        this.memberActivityGridref.table.showColumn(column.value);
      });
      this.memberActivityGridref.table.redraw();
      this.memberActivityGridref.table.clearFilter();
      return;
    }

    let obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Member Activity Report"));

    let preference = obj['Member Activity Report'].find(preference => preference['Preference Name'] === event.target.value);
    let filters = preference['Filters'] ? preference['Filters'] : [];
    this.setState({
      filterColumns: this.filterColumns.filter(column => !preference['Hidden Columns'].some(elm => elm.value === column.value )),
      selectedColumns: this.filterColumns.filter(column => !preference['Hidden Columns'].some(elm => elm.value === column.value )),
      hiddenColumns: this.filterColumns.filter(column => preference['Hidden Columns'].some(elm => elm.value === column.value )),
      filters: filters,
      key: Math.random()
    }, function() {
      this.filterColumns.forEach(column => {
        this.memberActivityGridref.table.showColumn(column.value);
      });

      preference['Hidden Columns'].forEach(column => {
        this.memberActivityGridref.table.hideColumn(column.value);
      });
      this.memberActivityGridref.table.redraw();
      this.memberActivityGridref.table.clearFilter();
      filters.forEach((filter, index) => {
        if (index == 0) {
          this.memberActivityGridref.table.addFilter(filter.filterColumn, filter.filterType, filter.filterValue);
        } else {
          this.memberActivityGridref.table.setFilter(filter.filterColumn, filter.filterType, filter.filterValue);
        }
      });
    });
  }

  handleIncludesChange = (options) => {
    this.setState({ includesValue: options });
  };

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
        status: member.values['Status'],
        email: member.values['Email'],
        phone: member.values['Phone Number'],
        address: member.values['Address'],
        suburb: member.values['Suburb'],
        state: member.values['State'],
        age: moment().diff(member.values['DOB'], 'years'),
        memberType: member.values['Member Type'],
        program: member.values['Ranking Program'],
        belt: member.values['Ranking Belt'],
        billingUser: member.values['Billing User'] === 'YES' ? 'YES' : 'NO',
        cost: member.values['Billing User'] === 'YES' ? member.values['Membership Cost'] : '',
        average: member.values['Billing User'] === 'YES' && member.values['Billing Family Members'] ? (member.values['Membership Cost']/JSON.parse(member.values['Billing Family Members']).length).toFixed(2): '',
        paymentPeriod: member.values['Billing User'] === 'YES' ? member.values['Billing Payment Period'] : '',
        familyMembers: member.values['Billing User'] === 'YES' && member.values['Billing Family Members'] ? JSON.parse(member.values['Billing Family Members']).length : '',
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

  onColumnDropdownChange = (options) => {
    this.filterColumns.forEach(column => {
      this.memberActivityGridref.table.hideColumn(column.value);
    });

    options.forEach(column => {
      this.memberActivityGridref.table.showColumn(column.value);
    });

    this.setState({
      filterColumns: this.filterColumns.filter(column => options.some(elm => elm.value === column.value )),
      selectedColumns: options,
      hiddenColumns: this.filterColumns.filter(column => !options.some(elm => elm.value === column.value ))
    }, function(){
      this.memberActivityGridref.table.redraw();
    });
    //this.selectedColumns = options;
  }

  updateReportPreferences = () => {
    if (!$('#new-preference').val() && !this.state.selectedPreference) {
      console.log("Preference name is required to create or update preference");
      return;
    }
    if ($('#new-preference').val() && this.state.preferences.includes($('#new-preference').val())) {
      console.log("Preference name already exists. Please choose a different name.");
      return;
    }
    let memberActivityReport = null;
    let obj = null;
    if (this.props.reportPreferences && this.props.reportPreferences.size > 0) {
      obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Member Activity Report"));
    }

    if (obj) {
      memberActivityReport = _.cloneDeep(obj["Member Activity Report"]);
      if ($('#new-preference').val()) { // add new preference
          memberActivityReport.push({'Preference Name': $('#new-preference').val(), 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.filterColumns.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))});
      } else { // update existing preference
        let preferenceIndex = memberActivityReport.findIndex(x => x['Preference Name'] === this.state.selectedPreference);
        memberActivityReport[preferenceIndex] = {'Preference Name': this.state.selectedPreference, 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.filterColumns.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))};
      }
    } else {
      memberActivityReport = [];
      memberActivityReport.push({'Preference Name': $('#new-preference').val(), 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.filterColumns.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))});
    }
    this.props.updatePreferences("Member Activity Report", memberActivityReport);
  }

  deleteReportPreference = () => {
    if (!this.state.selectedPreference) {
      console.log("Please select a preference to delete");
      return;
    }

    let memberActivityReport = null;
    let obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Member Activity Report"));
    memberActivityReport = _.cloneDeep(obj["Member Activity Report"]);
    memberActivityReport = memberActivityReport.filter(preference => preference['Preference Name'] !== this.state.selectedPreference);
    this.props.updatePreferences("Member Activity Report", memberActivityReport);
    this.setState({
      filterColumns: this.filterColumns,
      selectedColumns: this.filterColumns,
      hiddenColumns: [],
      selectedPreference: '',
      filters: [],
      key: Math.random()
    });
    this.filterColumns.forEach(column => {
      this.memberActivityGridref.table.showColumn(column.value);
    });
    this.memberActivityGridref.table.clearFilter();
  }

  render() {
    const options = {
      height: 450,
      width: '100%',
      movableRows: true,
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      tooltipsHeader:true,
      downloadDataFormatter: (data) => data,
      downloadReady: (fileContents, blob) => blob,
      layout: 'fitColumns'
    };
    return (
      <span>
        <div
          style={{
            textAlign: 'center',
            background: '#991b1e',
            color: 'white',
            fontSize: '10px'
          }}
        >
          <h6>Member Activity Report</h6>
        </div>
        <div className="table-controls">
          <div className="col-md-12">
            <div className="row">
            <div className="col-md-12">
            <span>
              <label>Field: </label>
              <select id="filter-field" onChange={e => this.onFilterFieldChange(e)}>
                  <option></option>
                  {this.state.filterColumns.map(column => <option key={column.value} value={column.value}>{column.label}</option>)}
              </select>
            </span>
            <span>
              <label>Type: </label>
              <select id="filter-type" onChange={e => this.onFilterTypeChange(e)}>
                  <option value="=">=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="!=">!=</option>
                  <option value="like">like</option>
                  <option value="includes">includes</option>
              </select>
            </span>
              <span>
              <label>Value:</label>
              <input id="filter-value-text" type="text" placeholder="value to filter" size="15"/>
              <select id="filter-value-select" style={{display:'none', width: '134px'}} className="filter-value-select">
                {this.state.selectedFilterValueOptions.map((fo, index) => <option key={fo + index} value={fo}>{fo}</option>)}
              </select>
              <Creatable
                isMulti
                placeholder="Type and hit enter..."
                value={this.state.includesValue}
                options={this.state.includesOptions}
                onChange={e => this.handleIncludesChange(e)}
                closeMenuOnSelect={false}
                noOptionsMessage={() => null}
                className="includes-container includes-container-member"
                classNamePrefix="includes-container"
              />
              </span>
              <button id="filter-add" onClick={(e) => this.addFilter(e)}>Create Filter</button>
              <span className="vl"></span>
              <button name="download" onClick={(e) => this.downLoadTableAsCsv(e)}><i className="fa fa-download"></i> Download Data as CSV</button>
              </div>
              </div>
              <div className="row">
              <div className="col-md-12">
              <div style={{display: 'inline-block'}} key={this.state.key}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                components={{ Option, MultiValue }}
                options={this.columnsToHide}
                defaultValue={this.state.selectedColumns}
                hideSelectedOptions={true}
                backspaceRemovesValue={false}
                onChange={e => this.onColumnDropdownChange(e)}
                className="hide-columns-container"
                classNamePrefix="hide-columns"
                placeholder="Show/hide columns"
                style={{width: '300px'}}
                //defaultMenuIsOpen={true}
              />
              </div>
              <select id="preferences-list" value={this.state.selectedPreference} onChange={this.handlePreferenceChange}>
                <option key='' value=''>-- Select preference --</option>
                {this.state.preferences.map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
              <Confirm
                onConfirm={e => this.deleteReportPreference()}
                body="Are you sure you want to delete this preference?"
                confirmText="Confirm Delete"
                title="Deleting Preference"
              >
              <button className={this.state.selectedPreference ? "input-group-addon" : "input-group-addon disabled"} disabled={this.state.selectedPreference ? false : true} id="clear_addon">Delete</button>
              </Confirm>
              {!this.state.selectedPreference && <input id="new-preference" type="text" placeholder="New preference name" size="25"/>}
              <button name="updateMemberPereference" style={{whiteSpace: 'normal'}} onClick={(e) => this.updateReportPreferences(e)}>{this.state.selectedPreference ? 'Update ' : 'Create '}<br/>Preference</button>
            </div>
            </div>
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
          style={{height: '420px', margin: '10px', width: '99%' }}
          className="row"
        >
          <ReactTabulator
            columns={this.columns}
            data={this.activityData}
            options={options}
            renderComplete={(e) => this.hideColumns()}
            ref={ref => (this.memberActivityGridref = ref)}
            layout="fitColumns"
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
      { title: 'Name', field: 'name', tooltip: true, bottomCalc: function() {return 'Total'} },
      { title: 'Gender', field: 'gender' },
      { title: 'Status', field: 'status' },
      { title: 'Email', field: 'email', tooltip: true },
      { title: 'Phone', field: 'phone', tooltip: true },
      { title: 'Address', field: 'address', tooltip: true },
      { title: 'Suburb', field: 'suburb', tooltip: true },
      { title: 'State', field: 'state' },
      { title: 'Age (Years)', field: 'age' },
      { title: 'Source', field: 'source' },
      { title: 'Reminder Date', field: 'reminderDate' },
      { title: 'Emails Sent', field: 'emailsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'Emails Received',
        field: 'emailsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'SMS Sent',
        field: 'smsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
      },
      {
        title: 'SMS Received',
        field: 'smsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width:100
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
      { label: 'Status', value: 'status' },
      { label: 'Email', value: 'email' },
      { label: 'Phone', value: 'phone' },
      { label: 'Address', value: 'address' },
      { label: 'Suburb', value: 'suburb' },
      { label: 'State', value: 'state' },
      { label: 'Age (Years)', value: 'age' },
      { label: 'Source', value: 'source' },
      { label: 'Reminder Date', value: 'reminderDate', dataType: 'date' },
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

    this.leadsPreferences = this.getTablePreferences(this.props.reportPreferences);
    this.visibleColumns = this.columnsToHide.filter(column => !this.leadsPreferences.hiddenCols.some(hc => hc.value === column.value));
    this.selectedColumns = this.visibleColumns;
    this.filterValueOptions = {
     'gender': ['Male', 'Female'],
     'status': this.props.leadStatusValues
    };
    this.filterIds = {};
    this.dateFilterFormat = "";

    this.state = {
      activityData: this.activityData,
      filterColumns: this.columnsToHide,
      filters:[],
      selectedFilterValueOptions: [],
      selectedColumns: this.selectedColumns,
      hiddenColumns: this.leadsPreferences.hiddenCols,
      preferences: this.leadsPreferences.preferences,
      selectedPreference: this.leadsPreferences.selectedPreference,
      key: Math.random(),
      includesOptions: [],
      includesValue: []
    };
  }

  componentWillReceiveProps(nextProps) {
    let data = this.getGridData(nextProps.leads);
    this.setState({
      activityData: data
    });

    if(!this.props.reportPreferences.equals(nextProps.reportPreferences)) {
     let preferences = this.getTablePreferences(nextProps.reportPreferences);
     this.setState({
       preferences: preferences.preferences
     });
   }
  }

  componentWillMount() {
    this.props.fetchLeads();
  }

  getTablePreferences = (reportPreferences) => {
      let obj = null;
      let hiddenCols = [];
      if (reportPreferences && reportPreferences.size > 0) {
        obj = reportPreferences.find(x => x.hasOwnProperty("Leads Activity Report"));
      }
      let preferences = [];
      let selectedPreference = '';
      if (obj) {
        obj["Leads Activity Report"].forEach(pref => {
          preferences.push(pref['Preference Name']);
          if (pref['Is Default'] && pref['Is Default'] === true) {
            selectedPreference = pref['Preference Name'];
            hiddenCols = pref['Hidden Columns'];
          }
        });
      }
      return {hiddenCols: hiddenCols, preferences: preferences, selectedPreference: selectedPreference};
  }

  hideColumns = () => {
    if(this.state.hiddenColumns && this.leadsActivityGridref) {
      this.state.hiddenColumns.forEach(column => {
        this.leadsActivityGridref.table.hideColumn(column.value);
      });
    }
  }

  includesFilter = (data, params) => {
    let result = params.includes.some(value => value === data[params.field]);
    return result;
  }

  dateFilter = (data, params) => {
    let dateValue = moment(params.value).format('YYYY-MM-DD');
    switch(params.type) {
      case '=':
      return data[params.field] ? moment(data[params.field], 'YYYY-MM-DD').isSame(dateValue) : false;
      break;
    case '<':
      return data[params.field] ? moment(data[params.field], 'YYYY-MM-DD').isBefore(dateValue) : false;
      break;
    case '<=':
      return data[params.field] ? moment(data[params.field], 'YYYY-MM-DD').isSameOrBefore(dateValue) : false;
      break;
    case '>':
      return data[params.field] ? moment(data[params.field], 'YYYY-MM-DD').isAfter(dateValue) : false;
      break;
    case '>=':
      return data[params.field] ? moment(data[params.field], 'YYYY-MM-DD').isSameOrAfter(dateValue) : false;
      break;
    case '!=':
      return data[params.field] ? !moment(data[params.field], 'YYYY-MM-DD').isSame(dateValue) : false;
      break;
    case 'like':
      return data[params.field] ? data[params.field].includes(params.value) : false;
      break;
    case 'includes':
      if (!data[params.field]) {
        return false;
      }
      let dateVal = moment(data[params.field]).format('YYYY-MM-DD');
      return params.includes.some(value => moment(value, 'YYYY-MM-DD').isSame(dateVal));
      break;
    }
    return null;
  }

  removeFilter = (e, cell) => {
    const filterColumn = cell.getRow().getData()['filterColumn'];
    const filterType = cell.getRow().getData()['filterType'];
    const filterValue = cell.getRow().getData()['filterValue'];
    const filterId = cell.getRow().getData()['filterId'];

    let dataType = this.columnsToHide.filter(column => column.value === filterColumn)[0].dataType;

    if (this.state.filters && this.state.filters.length > 0) {
      if (dataType === 'date') {
        this.leadsActivityGridref.table.removeFilter(this.dateFilter, this.filterIds[filterId]);
      } else if (filterType === 'includes') {
        this.leadsActivityGridref.table.removeFilter(this.includesFilter, this.filterIds[filterId]);
      } else {
        this.leadsActivityGridref.table.removeFilter(filterColumn, filterType, filterValue);
      }
    } else {
      if (dataType === 'date') {
        this.leadsActivityGridref.table.clearFilter(this.dateFilter, this.filterIds[filterId]);
      } else if (filterType === 'includes') {
        this.leadsActivityGridref.table.clearFilter(this.includesFilter, this.filterIds[filterId]);
      } else {
        this.leadsActivityGridref.table.clearFilter(filterColumn, filterType, filterValue);
      }
    }

    let newFilters = [...this.state.filters].filter(filter => !(filter.filterColumn ===  filterColumn && filter.filterType ===  filterType && filter.filterValue === filterValue));
    this.setState({
      filters: newFilters
    })
  }

  addFilter () {
    const filterColumn = $("#filter-field-leads").val();
    const type = $("#filter-type-leads").val();
    let value = $("#filter-value-leads-text").val() ? $("#filter-value-leads-text").val() : $("#filter-value-leads-select").val();

    if (!value) {
      value = this.state.includesValue && this.state.includesValue.length > 0 ? this.state.includesValue : null;
    }

    if (!filterColumn || !type || !value) {
      return;
    }

    let dataType = this.columnsToHide.filter(column => column.value === filterColumn)[0].dataType;
    if (dataType === 'date') {
      let values = this.state.includesValue ? this.state.includesValue.map(val => val.value) : [];
      let filterId = Math.random();
      let filterParams = {field: filterColumn, type: type, value: (type !== 'includes' ? value : null), includes: values};
      this.filterIds[filterId] = filterParams;
      this.setState({
        filters: [...this.state.filters, {"filterId": filterId, "filterColumn": filterColumn, "filterType": type, "filterValue": (type !== 'includes' ? value : JSON.stringify(values))}]
      }, function(){
        if (this.state.filters && this.state.filters.length > 0) {
          this.leadsActivityGridref.table.addFilter(this.dateFilter, filterParams);
        } else {
          this.leadsActivityGridref.table.setFilter(this.dateFilter, filterParams);
        };
      });
    } else if (type === 'includes') {
      let values = this.state.includesValue.map(val => val.value);
      let filterId = Math.random();
      let filterParams = {field: filterColumn, includes: values};
      this.filterIds[filterId] = filterParams;
      this.setState({
        filters: [...this.state.filters, {"filterId": filterId, "filterColumn": filterColumn, "filterType": type, "filterValue": JSON.stringify(values)}],
        includesValue: []
      }, function(){
        if (this.state.filters && this.state.filters.length > 0) {
          this.leadsActivityGridref.table.addFilter(this.includesFilter, filterParams);
        } else {
          this.leadsActivityGridref.table.setFilter(this.includesFilter, filterParams);
        };
      });
    } else {
        this.setState({
        filters: [...this.state.filters, {"filterColumn": filterColumn, "filterType": type, "filterValue": value}]
      }, function() {
        if (this.state.filters && this.state.filters.length > 0) {
          this.leadsActivityGridref.table.addFilter(filterColumn, type, value);
        } else {
          this.leadsActivityGridref.table.setFilter(filterColumn, type, value);
        }
      });
    }

    $('.includes-container-leads').attr('style','display:none !important');
    $('#filter-value-leads-text').show();
    $("#filter-field-leads").val("");
    $("#filter-type-leads").val("=");
    $("#filter-value-leads-text").val("");
    $("#filter-value-leads-select").val("");
    //tableRef.table.clearFilter();
  }

  onFilterFieldChange = (event) => {
    const type = $("#filter-type-leads").val();
    let options = this.filterValueOptions[event.target.value];
    if (!options) {
      options = [];
    }

    this.setState({includesValue: null});
    if (type === 'includes') {
      let includesOptions = [];
      options.forEach(option => includesOptions.push({label: option, value: option}));
      this.setState({includesOptions: includesOptions});
      return;
    }

    $('.includes-container-leads').attr('style','display:none !important');
    if(options && options.length > 0) {
      $('#filter-value-leads-text').hide();
      $('#filter-value-leads-select').show();
      this.setState({selectedFilterValueOptions: options});
    } else {
      $('#filter-value-leads-text').show();
      $('#filter-value-leads-select').hide();
      this.setState({selectedFilterValueOptions: []});
    }
  }

  onFilterTypeChange = (event) => {
    let options = this.filterValueOptions[$('#filter-field-leads').val()];
    if (!options) {
      options = [];
    }
    this.setState({includesValue: null});
    if (event.target.value === 'includes') {
      let includesOptions = [];
      options.forEach(option => includesOptions.push({label: option, value: option}));
      this.setState({includesOptions: includesOptions});
      $('#filter-value-leads-text').hide();
      $('#filter-value-leads-select').hide();
      $('.includes-container-leads').attr('style','display:inline-block !important');
    } else {
      $('.includes-container-leads').attr('style','display:none !important');
      if(options && options.length > 0) {
        $('#filter-value-leads-text').hide();
        $('#filter-value-leads-select').show();
        this.setState({selectedFilterValueOptions: options});
      } else {
        $('#filter-value-leads-text').show();
        $('#filter-value-leads-select').hide();
        this.setState({selectedFilterValueOptions: []});
      }
    }
  }

  handlePreferenceChange = (event) => {
    this.setState({selectedPreference: event.target.value});
    if (!event.target.value) {
      this.setState({
        filterColumns: this.columnsToHide,
        selectedColumns: this.columnsToHide,
        hiddenColumns: [],
        filters: [],
        key: Math.random()
      });
      this.columnsToHide.forEach(column => {
        this.leadsActivityGridref.table.showColumn(column.value);
      });
      this.leadsActivityGridref.table.redraw();
      this.leadsActivityGridref.table.clearFilter();
      return;
    }

    let obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Leads Activity Report"));
    let preference = obj['Leads Activity Report'].find(preference => preference['Preference Name'] === event.target.value);
    let filters = preference['Filters'] ? preference['Filters'] : [];
    this.setState({
      filterColumns: this.columnsToHide.filter(column => !preference['Hidden Columns'].some(elm => elm.value === column.value )),
      selectedColumns: this.columnsToHide.filter(column => !preference['Hidden Columns'].some(elm => elm.value === column.value )),
      hiddenColumns: this.columnsToHide.filter(column => preference['Hidden Columns'].some(elm => elm.value === column.value )),
      filters: filters,
      key: Math.random()
    }, function() {
      this.columnsToHide.forEach(column => {
        this.leadsActivityGridref.table.showColumn(column.value);
      });

      preference['Hidden Columns'].forEach(column => {
        this.leadsActivityGridref.table.hideColumn(column.value);
      });
      this.leadsActivityGridref.table.redraw();
      this.leadsActivityGridref.table.clearFilter();
      filters.forEach((filter, index) => {
        if (index == 0) {
          this.leadsActivityGridref.table.addFilter(filter.filterColumn, filter.filterType, filter.filterValue);
        } else {
          this.leadsActivityGridref.table.setFilter(filter.filterColumn, filter.filterType, filter.filterValue);
        }
      });
    });
  }

  handleIncludesChange = (options) => {
    this.setState({ includesValue: options });
  };

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
        status: lead.values['Status'],
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

  onColumnDropdownChange = (options) => {
    this.columnsToHide.forEach(column => {
      this.leadsActivityGridref.table.hideColumn(column.value);
    });

    options.forEach(column => {
      this.leadsActivityGridref.table.showColumn(column.value);
    });

    this.setState({
      filterColumns: this.columnsToHide.filter(column => options.some(elm => elm.value === column.value )),
      selectedColumns: options,
      hiddenColumns: this.columnsToHide.filter(column => !options.some(elm => elm.value === column.value ))
    }, function() {
      this.leadsActivityGridref.table.redraw();
    });
  }

  updateReportPreferences = () => {
    if (!$('#new-preference-leads').val() && !this.state.selectedPreference) {
      console.log("Preference name is required to create or update preference");
      return;
    }
    if ($('#new-preference-leads').val() && this.state.preferences.includes($('#new-preference-leads').val())) {
      console.log("Preference name already exists. Please choose a different name.");
      return;
    }
    let leadsActivityReport = null;
    let obj = null;
    if (this.props.reportPreferences && this.props.reportPreferences.size > 0) {
      obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Leads Activity Report"));
    }

    if (obj) {
      leadsActivityReport = _.cloneDeep(obj["Leads Activity Report"]);
      if ($('#new-preference-leads').val()) { // add new preference
          leadsActivityReport.push({'Preference Name': $('#new-preference-leads').val(), 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.columnsToHide.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))});
      } else { // update existing preference
        let preferenceIndex = leadsActivityReport.findIndex(x => x['Preference Name'] === this.state.selectedPreference);
        leadsActivityReport[preferenceIndex] = {'Preference Name': this.state.selectedPreference, 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.columnsToHide.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))};
      }
    } else {
      leadsActivityReport = [];
      leadsActivityReport.push({'Preference Name': $('#new-preference-leads').val(), 'Filters': (this.state.filters ? this.state.filters : []), 'Hidden Columns': this.columnsToHide.filter(column => !this.state.selectedColumns.some(elm => elm.value === column.value ))});
    }
    this.props.updatePreferences("Leads Activity Report", leadsActivityReport);
  }

  deleteReportPreference = () => {
    if (!this.state.selectedPreference) {
      console.log("Please select a preference to delete");
      return;
    }

    let leadsActivityReport = null;
    let obj = this.props.reportPreferences.find(x => x.hasOwnProperty("Leads Activity Report"));
    leadsActivityReport = _.cloneDeep(obj["Leads Activity Report"]);
    this.setState({
      filterColumns: this.columnsToHide,
      selectedColumns: this.columnsToHide,
      hiddenColumns: [],
      selectedPreference: '',
      filters: [],
      key: Math.random()
    });
    this.columnsToHide.forEach(column => {
      this.leadsActivityGridref.table.showColumn(column.value);
    });
    this.leadsActivityGridref.table.clearFilter();
    this.props.updatePreferences("Leads Activity Report", leadsActivityReport);
    leadsActivityReport = leadsActivityReport.filter(preference => preference['Preference Name'] !== this.state.selectedPreference);
  }

  render() {
    const options = {
      height: 450,
      movableRows: true,
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100],
      tooltipsHeader:true,
      downloadDataFormatter: (data) => data,
      downloadReady: (fileContents, blob) => blob,
      layout: "fitColumns"
    };
    return this.props.leadsLoading ? (
        <div style={{margin: '10px'}}>
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
          <div className="col-md-12">
            <div className="row">
            <div className="col-md-12">
            <span>
              <label>Field: </label>
              <select id="filter-field-leads" onChange={e => this.onFilterFieldChange(e)}>
                  <option></option>
                  {this.state.filterColumns.map(column => <option key={column.value} value={column.value}>{column.label}</option>)}
              </select>
            </span>
            <span>
              <label>Type: </label>
              <select id="filter-type-leads" onChange={e => this.onFilterTypeChange(e)}>
                  <option value="=">=</option>
                  <option value="<">&lt;</option>
                  <option value="<=">&lt;=</option>
                  <option value=">">&gt;</option>
                  <option value=">=">&gt;=</option>
                  <option value="!=">!=</option>
                  <option value="like">like</option>
                  <option value="includes">includes</option>
              </select>
            </span>
              <span>
              <label>Value:</label>
              <input id="filter-value-leads-text" type="text" placeholder="value to filter" size="15"/>
              <select id="filter-value-leads-select" style={{display:'none', width: '134px'}} className="filter-value-select">
                {this.state.selectedFilterValueOptions.map(fo => <option key={fo} value={fo}>{fo}</option>)}
              </select>
              <Creatable
                isMulti
                placeholder="Type and hit enter..."
                value={this.state.includesValue}
                options={this.state.includesOptions}
                onChange={e => this.handleIncludesChange(e)}
                closeMenuOnSelect={false}
                noOptionsMessage={() => null}
                className="includes-container includes-container-leads"
                classNamePrefix="includes-container"
              />
              </span>
              <button id="filter-add-leads" onClick={(e) => this.addFilter(e)}>Create Filter</button>
              <span className="vl"></span>
              <button name="download" onClick={(e) => this.downLoadTableAsCsv(e)}><i className="fa fa-download"></i> Download Data as CSV</button>
              </div>
              </div>
              <div className="row">
              <div className="col-md-12">
              <div style={{display: 'inline-block'}} key={this.state.key}>
              <Select
                closeMenuOnSelect={false}
                isMulti
                components={{ Option, MultiValue }}
                options={this.columnsToHide}
                defaultValue={this.state.selectedColumns}
                hideSelectedOptions={true}
                backspaceRemovesValue={false}
                onChange={e => this.onColumnDropdownChange(e)}
                className="hide-columns-container"
                classNamePrefix="hide-columns"
                placeholder="Show/hide columns"
                style={{width: '300px'}}
                //defaultMenuIsOpen={true}
              />
              </div>
              <select id="preferences-list-leads" value={this.state.selectedPreference} onChange={this.handlePreferenceChange}>
                <option key='' value=''>-- Select preference --</option>
                {this.state.preferences.map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
              <Confirm
                onConfirm={e => this.deleteReportPreference()}
                body="Are you sure you want to delete this preference?"
                confirmText="Confirm Delete"
                title="Deleting Preference"
              >
              <button className={this.state.selectedPreference ? "input-group-addon" : "input-group-addon disabled"} disabled={this.state.selectedPreference ? false : true} id="clear_addon">Delete</button>
              </Confirm>
              {!this.state.selectedPreference && <input id="new-preference-leads" type="text" placeholder="New preference name" size="25"/>}
              <button name="updateLeadsPereference" style={{whiteSpace: 'normal'}} onClick={(e) => this.updateReportPreferences(e)}>{this.state.selectedPreference ? 'Update ' : 'Create '}<br/>Preference</button>
            </div>
            </div>
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
          style={{height: '420px', margin: '10px', width: '99%' }}
          className="row"
        >
          <ReactTabulator
            columns={this.columns}
            data={this.state.activityData}
            options={options}
            renderComplete={(e) => this.hideColumns()}
            ref={ref => (this.leadsActivityGridref = ref)}
            layout="fitColumns"
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

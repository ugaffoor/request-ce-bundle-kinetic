import React, { Component } from 'react';
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
import {AgGridReact} from 'ag-grid-react';
import 'ag-grid-community/dist/styles/ag-grid.css';
import 'ag-grid-community/dist/styles/ag-theme-balham.css';
import { actions as reportingActions} from '../../redux/modules/reporting';

const mapStateToProps = state => ({
  reports: state.member.reporting.activityReport,
  activityReportLoading: state.member.reporting.activityReportLoading
});

const mapDispatchToProps = {
  fetchReport : reportingActions.fetchActivityReport,
  setReport : reportingActions.setActivityReport
};

export const ReportsView = ({
  reports,
  activityReportLoading
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    {activityReportLoading ? <div><p>Loading reports ...</p> <ReactSpinner /> </div> :
    <div>
    <div className="chart1">
       <MemberActivityReport
        reports={reports}
      />
    </div>
    <div className="chart1">
      <LeadsActivityReport
        reports={reports}
      />
    </div>
  </div>}
  </div>
);

export const ReportsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    getReportData: ({
      fetchReport,
    }) => () => {
      fetchReport({
      });
    }
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchReport({setReport: this.props.setReport});
    },
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
    this.data = this.getGridData(this.props.reports);
    const topOptions = {alignedGrids: [], suppressHorizontalScroll: true};
    const bottomOptions = {alignedGrids: []};
    topOptions.alignedGrids.push(bottomOptions);
    bottomOptions.alignedGrids.push(topOptions);

    this.state = {
      topOptions,
      bottomOptions,
      columnDefs: [
				{headerName: "Name", field: "name"},
				{headerName: "Gender", field: "gender"},
				{headerName: "Email", field: "email"},
        {headerName: "Phone", field: "phone"},
        {headerName: "Address", field: "address"},
        {headerName: "Suburb", field: "suburb"},
        {headerName: "State", field: "state"},
        {headerName: "Age (Years)", field: "age"},
        {headerName: "Member Type", field: "memberType"},
        {headerName: "Emails Sent", field: "emailsSent"},
        {headerName: "Emails Received", field: "emailsReceived"},
        {headerName: "SMS Sent", field: "smsSent"},
        {headerName: "SMS Received", field: "smsReceived"}

			],
			rowData: this.data.memberActivity,
      defaultColDef: {
        editable: false,
        resizable: true,
        filter: true,
        sortable: true
      },
      bottomData : this.data.bottomData
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  getGridData(reports) {
    let memberActivity = [];
    let emailsSent = 0, emailsReceived = 0, smsSent = 0, smsReceived = 0;
    if (reports && reports.members) {
      reports.members.forEach(member => {
        memberActivity.push({name: member.values['First Name'] + " " + member.values['Last Name'],
                gender: member.values['Gender'],
                email: member.values['Email'],
                phone: member.values['Phone Number'],
                address: member.values['Address'],
                suburb: member.values['Suburb'],
                state: member.values['State'],
                age: moment().diff(member.values['DOB'], 'years'),
                memberType: member.values['Member Type'],
                emailsSent: isNaN(member.values['Emails Sent Count']) ? 0 : parseInt(member.values['Emails Sent Count']),
                emailsReceived: isNaN(member.values['Emails Received Count']) ? 0 : parseInt(member.values['Emails Received Count']),
                smsSent: isNaN(member.values['SMS Sent Count']) ? 0 : parseInt(member.values['SMS Sent Count']),
                smsReceived: isNaN(member.values['SMS Received Count']) ? 0 : parseInt(member.values['SMS Received Count'])
              });

          emailsSent += isNaN(member.values['Emails Sent Count']) ? 0 : parseInt(member.values['Emails Sent Count']);
          emailsReceived += isNaN(member.values['Emails Received Count']) ? 0 : parseInt(member.values['Emails Received Count']);
          smsSent += isNaN(member.values['SMS Sent Count']) ? 0 : parseInt(member.values['SMS Sent Count']);
          smsReceived += isNaN(member.values['SMS Received Count']) ? 0 : parseInt(member.values['SMS Received Count']);
      });
    }

    let bottomData = [
          {
              name: 'Total:',
              emailsSent: emailsSent,
              emailsReceived: emailsReceived,
              smsSent: smsSent,
              smsReceived: smsReceived
          }
      ];

    return {memberActivity: memberActivity, bottomData: bottomData}
  }

  render() {
    return (
      <span>
        <div style={{textAlign: 'left', background: '#991b1e', color: 'white', fontSize: '10px'}}>
          <h6>Member Activity Report</h6>
        </div>
        <div style={{width: '100%', height: '420px'}} className="ag-theme-balham">
            <AgGridReact
            rowData={this.state.rowData}
            gridOptions={this.state.topOptions}
            columnDefs={this.state.columnDefs}
            defaultColDef={this.state.defaultColDef}
            />
        </div>
        <div style={{width: '100%', height: '40px'}} className="ag-theme-balham">
            <AgGridReact
                rowData={this.state.bottomData}
                gridOptions={this.state.bottomOptions}
                columnDefs={this.state.columnDefs}
                headerHeight="0"
                rowStyle={{fontWeight: 'bold'}}
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
    this.data = this.getGridData(this.props.reports);
    const topOptions = {alignedGrids: [], suppressHorizontalScroll: true};
    const bottomOptions = {alignedGrids: []};
    topOptions.alignedGrids.push(bottomOptions);
    bottomOptions.alignedGrids.push(topOptions);

    this.state = {
      topOptions,
      bottomOptions,
      columnDefs: [
				{headerName: "Name", field: "name"},
				{headerName: "Gender", field: "gender"},
				{headerName: "Email", field: "email"},
        {headerName: "Phone", field: "phone"},
        {headerName: "Address", field: "address"},
        {headerName: "Suburb", field: "suburb"},
        {headerName: "State", field: "state"},
        {headerName: "Age (Years)", field: "age"},
        {headerName: "Source", field: "source"},
        {headerName: "Reminder Date", field: "reminderDate"},
        {headerName: "Emails Sent", field: "emailsSent"},
        {headerName: "Emails Received", field: "emailsReceived"},
        {headerName: "SMS Sent", field: "smsSent"},
        {headerName: "SMS Received", field: "smsReceived"}

			],
			rowData: this.data.leadsActivity,
      defaultColDef: {
        editable: false,
        resizable: true,
        filter: true,
        sortable: true
      },
      bottomData : this.data.bottomData
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  getGridData(reports) {
    let leadsActivity = [];
    let emailsSent = 0, emailsReceived = 0, smsSent = 0, smsReceived = 0;
    if (reports && reports.leads) {
      reports.leads.forEach(lead => {
        leadsActivity.push({name: lead.values['First Name'] + " " + lead.values['Last Name'],
                gender: lead.values['Gender'],
                email: lead.values['Email'],
                phone: lead.values['Phone Number'],
                address: lead.values['Address'],
                suburb: lead.values['Suburb'],
                state: lead.values['State'],
                age: moment().diff(lead.values['DOB'], 'years'),
                source: lead.values['Source'],
                reminderDate: lead.values['Reminder Date'],
                emailsSent: isNaN(lead.values['Emails Sent Count']) ? 0 : parseInt(lead.values['Emails Sent Count']),
                emailsReceived: isNaN(lead.values['Emails Received Count']) ? 0 : parseInt(lead.values['Emails Received Count']),
                smsSent: isNaN(lead.values['SMS Sent Count']) ? 0 : parseInt(lead.values['SMS Sent Count']),
                smsReceived: isNaN(lead.values['SMS Received Count']) ? 0 : parseInt(lead.values['SMS Received Count'])
              });

          emailsSent += isNaN(lead.values['Emails Sent Count']) ? 0 : parseInt(lead.values['Emails Sent Count']);
          emailsReceived += isNaN(lead.values['Emails Received Count']) ? 0 : parseInt(lead.values['Emails Received Count']);
          smsSent += isNaN(lead.values['SMS Sent Count']) ? 0 : parseInt(lead.values['SMS Sent Count']);
          smsReceived += isNaN(lead.values['SMS Received Count']) ? 0 : parseInt(lead.values['SMS Received Count']);
      });
    }

    let bottomData = [
          {
              name: 'Total:',
              emailsSent: emailsSent,
              emailsReceived: emailsReceived,
              smsSent: smsSent,
              smsReceived: smsReceived
          }
      ];

    return {leadsActivity: leadsActivity, bottomData: bottomData}
  }

  render() {
    return (
      <span>
        <div style={{textAlign: 'left', background: '#991b1e', color: 'white', fontSize: '10px'}}>
          <h6>Leads Activity Report</h6>
        </div>
        <div style={{width: '100%', height: '420px'}} className="ag-theme-balham">
            <AgGridReact
            rowData={this.state.rowData}
            gridOptions={this.state.topOptions}
            columnDefs={this.state.columnDefs}
            defaultColDef={this.state.defaultColDef}
            />
        </div>
        <div style={{width: '100%', height: '40px'}} className="ag-theme-balham">
            <AgGridReact
                rowData={this.state.bottomData}
                gridOptions={this.state.bottomOptions}
                columnDefs={this.state.columnDefs}
                headerHeight="0"
                rowStyle={{fontWeight: 'bold'}}
            />
        </div>
      </span>
    );
  }
}

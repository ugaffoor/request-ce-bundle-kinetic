import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import _ from 'lodash';
import 'react-tabulator/lib/styles.css'; // default theme
import 'react-tabulator/css/bootstrap/tabulator_bootstrap.min.css'; // use Theme(s)
import { ReactTabulator, reactFormatter } from 'react-tabulator';
import Select, { components } from 'react-select';
import createClass from 'create-react-class';
import { Confirm } from 'react-confirm-bootstrap';
import { Creatable } from 'react-select';

const util = require('util');

const member_activities_url =
  'app/api/v1/kapps/gbmembers/forms/member-activities/submissions?include=details,values';
const no_data_placeholder = 'No records found';

export class MemberActivityReport extends Component {
  constructor(props) {
    super(props);
    this.getGridData = this.getGridData.bind(this);
    this.activityData = this.getGridData(this.props.members);
    this.handleCellClick = this.handleCellClick.bind(this);

    this.columns = [
      { title: 'Last Modified Date', field: 'lastModifiedDate' },
      { title: 'Name', field: 'name', tooltip: true, bottomCalc: 'count' },
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
      { title: 'Additional Program 1', field: 'additionalProgram1' },
      { title: 'Additional Program 2', field: 'additionalProgram2' },
      { title: 'Last Attendance Date', field: 'lastAttendanceDate' },
      { title: 'Billing User', field: 'billingUser' },
      { title: 'Non Paying', field: 'nonPaying' },
      { title: 'Account Created', field: 'accountCreated' },
      { title: 'Covid19 Waiver', field: 'covid19Waiver' },
      { title: 'Cost', field: 'cost', bottomCalc: 'sum' },
      { title: 'Average', field: 'average', bottomCalc: this.averageCostCalc },
      { title: 'Payment Period', field: 'paymentPeriod' },
      { title: 'Family Members', field: 'familyMembers' },
      {
        title: 'Notes',
        field: 'history',
        formatter: reactFormatter(<this.ExpandNotesCellButton />),
      },
      {
        title: 'Emails Sent',
        field: 'emailsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width: 100,
      },
      {
        title: 'Emails Received',
        field: 'emailsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width: 100,
      },
      {
        title: 'SMS Sent',
        field: 'smsSent',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width: 100,
      },
      {
        title: 'SMS Received',
        field: 'smsReceived',
        formatter: reactFormatter(<this.ExpandCellButton />),
        bottomCalc: 'sum',
        width: 100,
      },
    ];
    this.hiddenColumns = [
      { label: 'Address', value: 'address' },
      { label: 'Suburb', value: 'suburb' },
      { label: 'State', value: 'state' },
      { label: 'Age (Years)', value: 'age' },
      { label: 'Member Type', value: 'memberType' },
      { label: 'Program', value: 'program' },
      { label: 'Belt', value: 'belt' },
      { label: 'Additional Program 1', value: 'additionalProgram1' },
      { label: 'Additional Program 2', value: 'additionalProgram2' },
      { label: 'Last Attendance Date', value: 'lastAttendanceDate' },
      { label: 'Billing User', value: 'billingUser' },
      { label: 'Non Paying', value: 'nonPaying' },
      { label: 'Account Created', value: 'accountCreated' },
      { label: 'Covid19 Waiver', value: 'covid19Waiver' },
      { label: 'Cost', value: 'cost', key: 'cost' },
      { label: 'Average', value: 'average', key: 'cost' },
      { label: 'Payment Period', value: 'paymentPeriod' },
      { label: 'Family Members', value: 'familyMembers' },
    ];
    this.notesColumns = [
      { title: 'Submitter', field: 'submitter' },
      { title: 'Date', field: 'contactDate', type: 'date' },
      { title: 'Note', field: 'note' },
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
      {
        label: 'Member Columns',
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
          { label: 'Account Created', value: 'accountCreated' },
          { label: 'Covid19 Waiver', value: 'covid19Waiver' },
          { label: 'Belt', value: 'belt' },
          { label: 'Additional Program 1', value: 'additionalProgram1' },
          { label: 'Additional Program 2', value: 'additionalProgram2' },
          { label: 'Notes', value: 'history' },
          { label: 'Emails Sent', value: 'emailsSent' },
          { label: 'Emails Received', value: 'emailsReceived' },
          { label: 'SMS Sent', value: 'smsSent' },
          { label: 'SMS Received', value: 'smsReceived' },
          { label: 'Last Attendance Date', value: 'lastAttendanceDate' },
        ],
      },
      {
        label: 'Billing Columns',
        options: [
          { label: 'Billing User', value: 'billingUser' },
          { label: 'Non Paying', value: 'nonPaying' },
          { label: 'Last Payment Date', value: 'lastPaymentDate' },
          { label: 'Cost', value: 'cost' },
          { label: 'Average', value: 'average' },
          { label: 'Payment Period', value: 'paymentPeriod' },
          { label: 'Family Members', value: 'familyMembers' },
        ],
      },
    ];

    this.addedFiltersColumns = [
      { title: 'Filter Column', field: 'filterColumn' },
      { title: 'Filter Type', field: 'filterType' },
      { title: 'Filter Value', field: 'filterValue' },
      {
        headerSort: false,
        formatter: 'buttonCross',
        width: 40,
        align: 'center',
        cellClick: (e, cell) => this.removeFilter(e, cell),
      },
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
      { label: 'Additional Program 1', value: 'additionalProgram1' },
      { label: 'Additional Program 2', value: 'additionalProgram2' },
      { label: 'Billing User', value: 'billingUser' },
      { label: 'Non Paying', value: 'nonPaying' },
      { label: 'Account Created', value: 'accountCreated' },
      { label: 'Covid19 Waiver', value: 'covid19Waiver' },
      { label: 'Notes', value: 'history' },
      { label: 'Cost', value: 'cost', key: 'cost' },
      { label: 'Average', value: 'average', key: 'cost' },
      { label: 'Payment Period', value: 'paymentPeriod' },
      { label: 'Family Members', value: 'familyMembers' },
      { label: 'Emails Sent', value: 'emailsSent' },
      { label: 'Emails Received', value: 'emailsReceived' },
      { label: 'SMS Sent', value: 'smsSent' },
      { label: 'SMS Received', value: 'smsReceived' },
    ];

    this.memberPreferences = this.getTablePreferences(
      this.props.reportPreferences,
    );
    this.visibleColumns = this.filterColumns.filter(
      column => !this.hiddenColumns.some(hc => hc.value === column.value),
    );
    //    this.visibleColumns.push({ label: 'Notes', value: 'history' });
    this.selectedColumns = this.visibleColumns;
    this.filterValueOptions = {
      gender: ['Male', 'Female'],
      status: this.props.memberStatusValues,
      billingUser: ['YES', 'NO'],
      nonPaying: ['YES'],
      accountCreated: ['YES', 'NO'],
      covid19Waiver: ['Agreed', 'NOT Agreed', ''],
      memberType: this.props.membershipTypes.map(type => type.type),
      program: this.props.programs.map(program => program.program),
      additionalProgram1: this.props.additionalPrograms.map(
        program => program.program,
      ),
      additionalProgram2: this.props.additionalPrograms.map(
        program => program.program,
      ),
      belt: [...new Set(this.props.belts.map(belt => belt.belt))],
    };
    this.filterIds = {};

    this.state = {
      filterColumns: this.filterColumns,
      filters: [],
      selectedFilterValueOptions: [],
      selectedColumns: this.selectedColumns,
      hiddenColumns: this.hiddenColumns,
      preferences: this.memberPreferences.preferences,
      selectedPreference: this.memberPreferences.selectedPreference,
      key: Math.random(),
      includesOptions: [],
      includesValue: [],
    };
  }

  componentWillReceiveProps(nextProps) {
    if (!this.props.reportPreferences.equals(nextProps.reportPreferences)) {
      let preferences = this.getTablePreferences(nextProps.reportPreferences);
      this.setState({
        preferences: preferences.preferences,
      });
    }
  }

  averageCostCalc = (values, data, calcParams) => {
    //values - array of column values
    //data - all table data
    //calcParams - params passed from the column definition object
    var cost = 0;
    values.forEach(function(value) {
      if (!isNaN(parseFloat(value))) {
        cost += parseFloat(value);
      }
    });
    return cost.toFixed(2);
  };

  getTablePreferences = reportPreferences => {
    let obj = null;
    let hiddenCols = [];
    if (reportPreferences && reportPreferences.size > 0) {
      obj = reportPreferences.find(x =>
        x.hasOwnProperty('Member Activity Report'),
      );
    }
    let preferences = [];
    let selectedPreference = '';
    if (obj) {
      obj['Member Activity Report'].forEach(pref => {
        preferences.push(pref['Preference Name']);
        if (pref['Is Default'] && pref['Is Default'] === true) {
          selectedPreference = pref['Preference Name'];
          hiddenCols = pref['Hidden Columns'];
        }
      });
    }
    return {
      hiddenCols: hiddenCols,
      preferences: preferences,
      selectedPreference: selectedPreference,
    };
  };

  hideColumns = () => {
    if (this.state.hiddenColumns && this.memberActivityGridref) {
      this.state.hiddenColumns.forEach(column => {
        this.memberActivityGridref.table.hideColumn(column.value);
      });
    }
  };

  removeFilter = (e, cell) => {
    const filterColumn = cell.getRow().getData()['filterColumn'];
    const filterType = cell.getRow().getData()['filterType'];
    const filterValue = cell.getRow().getData()['filterValue'];
    const filterId = cell.getRow().getData()['filterId'];

    if (this.state.filters && this.state.filters.length > 0) {
      if (
        filterColumn === 'createdDate' ||
        filterColumn === 'lastModifiedDate' ||
        filterColumn === 'lastPaymentDate' ||
        filterColumn === 'lastAttendanceDate'
      ) {
        this.memberActivityGridref.table.removeFilter(
          this.dateRangeFilter,
          this.filterIds[filterId],
        );
      } else if (filterType === 'includes') {
        this.memberActivityGridref.table.removeFilter(
          this.includesFilter,
          this.filterIds[filterId],
        );
      } else {
        this.memberActivityGridref.table.removeFilter(
          filterColumn,
          filterType,
          filterValue,
        );
      }
    } else {
      if (
        filterColumn === 'createdDate' ||
        filterColumn === 'lastModifiedDate' ||
        filterColumn === 'lastPaymentDate' ||
        filterColumn === 'lastAttendanceDate'
      ) {
        this.memberActivityGridref.table.clearFilter(
          this.dateRangeFilter,
          this.filterIds[filterId],
        );
      } else if (filterType === 'includes') {
        this.memberActivityGridref.table.clearFilter(
          this.includesFilter,
          this.filterIds[filterId],
        );
      } else {
        this.memberActivityGridref.table.clearFilter(
          filterColumn,
          filterType,
          filterValue,
        );
      }
    }

    let newFilters = [...this.state.filters].filter(
      filter =>
        !(
          filter.filterColumn === filterColumn &&
          filter.filterType === filterType &&
          filter.filterValue === filterValue
        ),
    );
    this.setState({
      filters: newFilters,
    });
  };

  addFilter() {
    const filterColumn = $('#filter-field').val();
    const type = $('#filter-type').val();

    if (!filterColumn) {
      console.log('Please select column to filter');
      return;
    }

    if (
      filterColumn !== 'createdDate' &&
      filterColumn !== 'lastModifiedDate' &&
      filterColumn !== 'lastPaymentDate' &&
      filterColumn !== 'lastAttendanceDate'
    ) {
      if (!type) {
        console.log('Please select filter type');
        return;
      }
    } else {
      if (!$('#filter-start-date').val() || !$('#filter-end-date').val()) {
        console.log('Please provide start and end date');
        return;
      }
    }

    if (
      filterColumn === 'createdDate' ||
      filterColumn === 'lastModifiedDate' ||
      filterColumn === 'lastPaymentDate' ||
      filterColumn === 'lastAttendanceDate'
    ) {
      let filterId = Math.random();
      let filterParams = {
        field: filterColumn,
        startDate: $('#filter-start-date').val(),
        endDate: $('#filter-end-date').val(),
      };
      this.filterIds[filterId] = filterParams;
      let filterVal =
        '[ startDate:' +
        $('#filter-start-date').val() +
        ', endDate:' +
        $('#filter-end-date').val() +
        ']';
      this.setState(
        {
          filters: [
            ...this.state.filters,
            {
              filterId: filterId,
              filterColumn: filterColumn,
              filterType: 'Date Range',
              filterValue: filterVal,
            },
          ],
          includesValue: [],
        },
        function() {
          if (this.state.filters && this.state.filters.length > 0) {
            this.memberActivityGridref.table.addFilter(
              this.dateRangeFilter,
              filterParams,
            );
          } else {
            this.memberActivityGridref.table.setFilter(
              this.dateRangeFilter,
              filterParams,
            );
          }
        },
      );
    } else if (type === 'includes') {
      if (!this.state.includesValue || this.state.includesValue.length <= 0) {
        console.log('Please provide values to include');
        return;
      }
      let values = this.state.includesValue.map(val => val.value);
      let filterId = Math.random();
      let filterParams = { field: filterColumn, includes: values };
      this.filterIds[filterId] = filterParams;
      this.setState(
        {
          filters: [
            ...this.state.filters,
            {
              filterId: filterId,
              filterColumn: filterColumn,
              filterType: type,
              filterValue: JSON.stringify(values),
            },
          ],
          includesValue: [],
        },
        function() {
          if (this.state.filters && this.state.filters.length > 0) {
            this.memberActivityGridref.table.addFilter(
              this.includesFilter,
              filterParams,
            );
          } else {
            this.memberActivityGridref.table.setFilter(
              this.includesFilter,
              filterParams,
            );
          }
        },
      );
    } else {
      let value = $('#filter-value-text').val()
        ? $('#filter-value-text').val()
        : $('#filter-value-select').val();
      if (!value) {
        console.log('Please provide value to filter');
        return;
      }
      this.setState(
        {
          filters: [
            ...this.state.filters,
            {
              filterColumn: filterColumn,
              filterType: type,
              filterValue: value,
            },
          ],
        },
        function() {
          if (this.state.filters && this.state.filters.length > 0) {
            this.memberActivityGridref.table.addFilter(
              filterColumn,
              type,
              value,
            );
          } else {
            this.memberActivityGridref.table.setFilter(
              filterColumn,
              type,
              value,
            );
          }
        },
      );
    }

    $('.includes-container-member').attr('style', 'display:none !important');
    $('#filter-value-container').show();
    $('#filter-type-container').show();
    $('#filter-date-range-container').hide();
    $('#filter-value-text').show();
    $('#filter-field').val('');
    $('#filter-type').val('=');
    $('#filter-value-text').val('');
    $('#filter-value-select').val('');
    //tableRef.table.clearFilter();
  }

  includesFilter = (data, params) => {
    let result = params.includes.some(value => value === data[params.field]);
    return result;
  };

  dateRangeFilter = (data, params) => {
    let startDate = moment(params.startDate, 'YYYY-MM-DD');
    let endDate = moment(params.endDate, 'YYYY-MM-DD');
    let dateVal = moment(data[params.field], 'DD-MM-YYYY HH:mm');
    return (
      dateVal.isSameOrAfter(startDate, 'day') &&
      dateVal.isSameOrBefore(endDate, 'day')
    );
  };

  onFilterFieldChange = event => {
    const type = $('#filter-type').val();
    let options = this.filterValueOptions[event.target.value];
    if (!options) {
      options = [];
    }

    this.setState({ includesValue: null });
    if (
      type === 'includes' &&
      !event.target.value === 'createdDate' &&
      !event.target.value === 'lastModifiedDate' &&
      !event.target.value === 'lastPaymentDate' &&
      !event.target.value === 'lastAttendanceDate'
    ) {
      let includesOptions = [];
      options.forEach(option =>
        includesOptions.push({ label: option, value: option }),
      );
      this.setState({ includesOptions: includesOptions });
      return;
    }

    if (
      event.target.value === 'createdDate' ||
      event.target.value === 'lastModifiedDate' ||
      event.target.value === 'lastPaymentDate' ||
      event.target.value === 'lastAttendanceDate'
    ) {
      $('#filter-value-container').hide();
      $('#filter-type-container').hide();
      $('#filter-date-range-container').show();
      return;
    }

    $('.includes-container-member').attr('style', 'display:none !important');
    $('#filter-value-container').show();
    $('#filter-type-container').show();
    $('#filter-date-range-container').hide();
    $('#filter-type').val('=');
    if (options && (options.length > 0 || options.size > 0)) {
      $('#filter-value-text').hide();
      $('#filter-value-select').show();
      this.setState({ selectedFilterValueOptions: options });
    } else {
      $('#filter-value-text').show();
      $('#filter-value-select').hide();
      this.setState({ selectedFilterValueOptions: [] });
    }
  };

  onFilterTypeChange = event => {
    let options = this.filterValueOptions[$('#filter-field').val()];
    if (!options) {
      options = [];
    }
    this.setState({ includesValue: null });
    if (event.target.value === 'includes') {
      let includesOptions = [];
      options.forEach(option =>
        includesOptions.push({ label: option, value: option }),
      );
      this.setState({ includesOptions: includesOptions });
      $('#filter-value-text').hide();
      $('#filter-value-select').hide();
      $('.includes-container-member').attr(
        'style',
        'display:inline-block !important',
      );
    } else {
      $('.includes-container-member').attr('style', 'display:none !important');
      if (options && options.length > 0) {
        $('#filter-value-text').hide();
        $('#filter-value-select').show();
        this.setState({ selectedFilterValueOptions: options });
      } else {
        $('#filter-value-text').show();
        $('#filter-value-select').hide();
        this.setState({ selectedFilterValueOptions: [] });
      }
    }
  };

  handlePreferenceChange = event => {
    this.setState({ selectedPreference: event.target.value });
    if (!event.target.value) {
      this.setState({
        filterColumns: this.filterColumns,
        selectedColumns: this.filterColumns,
        hiddenColumns: this.hiddenColumns,
        filters: [],
        key: Math.random(),
      });
      this.filterColumns.forEach(column => {
        this.memberActivityGridref.table.showColumn(column.value);
      });
      this.memberActivityGridref.table.redraw();
      this.memberActivityGridref.table.clearFilter();
      return;
    }

    let obj = this.props.reportPreferences.find(x =>
      x.hasOwnProperty('Member Activity Report'),
    );

    let preference = obj['Member Activity Report'].find(
      preference => preference['Preference Name'] === event.target.value,
    );
    let filters = preference['Filters'] ? preference['Filters'] : [];
    this.setState(
      {
        filterColumns: this.filterColumns.filter(
          column =>
            !preference['Hidden Columns'].some(
              elm => elm.value === column.value,
            ),
        ),
        selectedColumns: this.filterColumns.filter(
          column =>
            !preference['Hidden Columns'].some(
              elm => elm.value === column.value,
            ),
        ),
        hiddenColumns: this.filterColumns.filter(column =>
          preference['Hidden Columns'].some(elm => elm.value === column.value),
        ),
        filters: filters,
        key: Math.random(),
      },
      function() {
        this.filterColumns.forEach(column => {
          this.memberActivityGridref.table.showColumn(column.value);
        });

        preference['Hidden Columns'].forEach(column => {
          this.memberActivityGridref.table.hideColumn(column.value);
        });
        this.memberActivityGridref.table.redraw();
        this.memberActivityGridref.table.clearFilter();
        filters.forEach((filter, index) => {
          if (index === 0) {
            this.memberActivityGridref.table.addFilter(
              filter.filterColumn,
              filter.filterType,
              filter.filterValue,
            );
          } else {
            this.memberActivityGridref.table.setFilter(
              filter.filterColumn,
              filter.filterType,
              filter.filterValue,
            );
          }
        });
      },
    );
  };

  handleIncludesChange = options => {
    this.setState({ includesValue: options });
  };

  ExpandNotesCellButton = (props: any) => {
    if (props.cell.getValue() === undefined) {
      return <span />;
    }
    var notes = JSON.parse(props.cell.getValue());
    notes.sort(function(a, b) {
      if (a['contactDate'] > b['contactDate']) {
        return -1;
      } else if (a['contactDate'] < b['contactDate']) {
        return 1;
      }
      return 0;
    });
    const value = notes.length > 0 ? notes[0]['note'] : '';
    return (
      <span className="firstNote">
        <div
          className="rt-expander closed"
          onClick={() => this.handleNotesCellClick(this, props.cell)}
        >
          •
        </div>
        <span className="note">{value}</span>{' '}
      </span>
    );
  };

  ExpandCellButton = (props: any) => {
    const cellData = props.cell._cell.row.data;
    const value = props.cell.getValue();
    return (
      <span>
        {value}{' '}
        <button
          className={
            value === 0
              ? 'grid-cell-expand show-sub-grid btn btn-xs disabled'
              : 'grid-cell-expand show-sub-grid btn btn-xs'
          }
          onClick={() => this.handleCellClick(this, props.cell)}
        >
          Show
        </button>
      </span>
    );
  };

  getGridData(members) {
    if (!members || members.length < 0) {
      return [];
    }
    let memberActivityData = [];
    let emailsSent = 0,
      emailsReceived = 0,
      smsSent = 0,
      smsReceived = 0;
    members.forEach(member => {
      memberActivityData.push({
        id: member['id'],
        createdDate: moment(member['createdAt']).format('DD-MM-YYYY HH:mm'),
        lastModifiedDate: moment(member['updatedAt']).format(
          'DD-MM-YYYY HH:mm',
        ),
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
        additionalProgram1: member.values['Additional Program 1'],
        additionalProgram2: member.values['Additional Program 2'],
        lastAttendanceDate:
          member.values['Last Attendance Date'] !== undefined
            ? moment(member.values['Last Attendance Date']).format('DD-MM-YYYY')
            : '',
        billingUser: member.values['Billing User'] === 'YES' ? 'YES' : 'NO',
        nonPaying: member.values['Non Paying'] === 'YES' ? 'YES' : '',
        accountCreated: member.user !== undefined ? 'YES' : 'NO',
        covid19Waiver: member.values['Covid19 Waiver'],
        cost:
          member.values['Billing User'] === 'YES'
            ? member.values['Membership Cost']
            : '',
        average:
          member.values['Billing User'] === 'YES' &&
          member.values['Billing Family Members']
            ? (
                member.values['Membership Cost'] /
                JSON.parse(member.values['Billing Family Members']).length
              ).toFixed(2)
            : '',
        paymentPeriod:
          member.values['Billing User'] === 'YES'
            ? member.values['Billing Payment Period']
            : '',
        familyMembers:
          member.values['Billing User'] === 'YES' &&
          member.values['Billing Family Members']
            ? JSON.parse(member.values['Billing Family Members']).length
            : '',
        history: member.values['Notes History'],
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
        if (otherField !== field && otherField !== 'history') {
          $(cells[i].getElement()).css('background-color', 'white');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .text('Show');
          $(cells[i].getElement())
            .find('.hide-sub-grid')
            .removeClass('hide-sub-grid')
            .addClass('show-sub-grid');
        } else if (otherField !== field && otherField === 'history') {
          $(cells[i].getElement()).css('background-color', 'white');
          $(cells[i].getElement())
            .find('.opened')
            .removeClass('opened')
            .addClass('closed');
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

  handleNotesCellClick = (that, cell) => {
    var field = cell.getColumn().getField();

    var cellElement = cell.getElement();
    var row = cell.getRow();
    var btnElement = $(cellElement).find('.rt-expander.opened');
    if (btnElement.length > 0) {
      $(btnElement)
        .removeClass('opened')
        .addClass('closed');
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
      var history = JSON.parse(row.getData()['history']);
      history.sort(function(a, b) {
        if (a['contactDate'] > b['contactDate']) {
          return -1;
        } else if (a['contactDate'] < b['contactDate']) {
          return 1;
        }
        return 0;
      });
      for (var i = 0; i < history.length; i++) {
        history[i]['contactDate'] = moment(history[i]['contactDate']).format(
          'DD-MM-YYYY HH:mm',
        );
      }
      ReactDOM.render(
        <ReactTabulator
          ref={ref => (this.ref = ref)}
          columns={this.notesColumns}
          data={history}
          placeholder={no_data_placeholder}
        />,
        tableEl,
      );

      row.getElement().appendChild(holderEl);
      btnElement = $(cellElement).find('.rt-expander.closed');
      $(btnElement)
        .removeClass('closed')
        .addClass('opened');
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
    this.memberActivityGridref.table.download(
      'csv',
      'member-activity-report.csv',
    );
  }

  onColumnDropdownChange = options => {
    this.filterColumns.forEach(column => {
      this.memberActivityGridref.table.hideColumn(column.value);
    });

    options.forEach(column => {
      this.memberActivityGridref.table.showColumn(column.value);
    });

    this.setState(
      {
        filterColumns: this.filterColumns.filter(column =>
          options.some(elm => elm.value === column.value),
        ),
        selectedColumns: options,
        hiddenColumns: this.filterColumns.filter(
          column => !options.some(elm => elm.value === column.value),
        ),
      },
      function() {
        this.memberActivityGridref.table.redraw();
      },
    );
    //this.selectedColumns = options;
  };

  updateReportPreferences = () => {
    if (!$('#new-preference').val() && !this.state.selectedPreference) {
      console.log('Preference name is required to create or update preference');
      return;
    }
    if (
      $('#new-preference').val() &&
      this.state.preferences.includes($('#new-preference').val())
    ) {
      console.log(
        'Preference name already exists. Please choose a different name.',
      );
      return;
    }
    let memberActivityReport = null;
    let obj = null;
    if (this.props.reportPreferences && this.props.reportPreferences.size > 0) {
      obj = this.props.reportPreferences.find(x =>
        x.hasOwnProperty('Member Activity Report'),
      );
    }

    if (obj) {
      memberActivityReport = _.cloneDeep(obj['Member Activity Report']);
      if ($('#new-preference').val()) {
        // add new preference
        memberActivityReport.push({
          'Preference Name': $('#new-preference').val(),
          Filters: this.state.filters ? this.state.filters : [],
          'Hidden Columns': this.filterColumns.filter(
            column =>
              !this.state.selectedColumns.some(
                elm => elm.value === column.value,
              ),
          ),
        });
      } else {
        // update existing preference
        let preferenceIndex = memberActivityReport.findIndex(
          x => x['Preference Name'] === this.state.selectedPreference,
        );
        memberActivityReport[preferenceIndex] = {
          'Preference Name': this.state.selectedPreference,
          Filters: this.state.filters ? this.state.filters : [],
          'Hidden Columns': this.filterColumns.filter(
            column =>
              !this.state.selectedColumns.some(
                elm => elm.value === column.value,
              ),
          ),
        };
      }
    } else {
      memberActivityReport = [];
      memberActivityReport.push({
        'Preference Name': $('#new-preference').val(),
        Filters: this.state.filters ? this.state.filters : [],
        'Hidden Columns': this.filterColumns.filter(
          column =>
            !this.state.selectedColumns.some(elm => elm.value === column.value),
        ),
      });
    }
    this.props.updatePreferences(
      'Member Activity Report',
      memberActivityReport,
    );
  };

  deleteReportPreference = () => {
    if (!this.state.selectedPreference) {
      console.log('Please select a preference to delete');
      return;
    }

    let memberActivityReport = null;
    let obj = this.props.reportPreferences.find(x =>
      x.hasOwnProperty('Member Activity Report'),
    );
    memberActivityReport = _.cloneDeep(obj['Member Activity Report']);
    memberActivityReport = memberActivityReport.filter(
      preference =>
        preference['Preference Name'] !== this.state.selectedPreference,
    );
    this.props.updatePreferences(
      'Member Activity Report',
      memberActivityReport,
    );
    this.setState({
      filterColumns: this.filterColumns,
      selectedColumns: this.filterColumns,
      hiddenColumns: this.hiddenColumns,
      selectedPreference: '',
      filters: [],
      key: Math.random(),
    });
    this.filterColumns.forEach(column => {
      this.memberActivityGridref.table.showColumn(column.value);
    });
    this.memberActivityGridref.table.clearFilter();
  };

  render() {
    const options = {
      height: 450,
      width: '100%',
      pagination: 'local',
      paginationSize: 10,
      paginationSizeSelector: [10, 20, 50, 100, 1000],
      tooltipsHeader: true,
      downloadDataFormatter: data => data,
      downloadReady: (fileContents, blob) => blob,
      layout: 'fitColumns',
    };
    return (
      <span className="reportContent">
        <div className="header">
          <h6>Member Activity Report</h6>
        </div>
        <div className="table-controls">
          <div className="col-md-12">
            <div className="row">
              <div className="col-md-12">
                <span>
                  <label>Field: </label>
                  <select
                    id="filter-field"
                    onChange={e => this.onFilterFieldChange(e)}
                  >
                    <option></option>
                    {this.state.filterColumns.map(column => (
                      <option key={column.value} value={column.value}>
                        {column.label}
                      </option>
                    ))}
                    <option key="createdDate" value="createdDate">
                      Created Date
                    </option>
                    <option key="lastModifiedDate" value="lastModifiedDate">
                      Last Modified Date
                    </option>
                    <option key="lastPaymentDate" value="lastPaymentDate">
                      Last Payment Date
                    </option>
                    <option key="lastAttendanceDate" value="lastAttendanceDate">
                      Last Attendance Date
                    </option>
                  </select>
                </span>
                <span id="filter-type-container">
                  <label>Type: </label>
                  <select
                    id="filter-type"
                    onChange={e => this.onFilterTypeChange(e)}
                  >
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
                <span id="filter-value-container">
                  <label>Value:</label>
                  <input
                    id="filter-value-text"
                    type="text"
                    placeholder="value to filter"
                    size="15"
                  />
                  <select
                    id="filter-value-select"
                    className="filter-value-select"
                  >
                    {this.state.selectedFilterValueOptions.map((fo, index) => (
                      <option key={fo + index} value={fo}>
                        {fo}
                      </option>
                    ))}
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
                <span
                  id="filter-date-range-container"
                  style={{ display: 'none' }}
                >
                  <label>Start: </label>
                  <input
                    type="date"
                    name="filter-start-date"
                    id="filter-start-date"
                  />
                  <label>End: </label>
                  <input
                    type="date"
                    name="filter-end-date"
                    id="filter-end-date"
                  />
                </span>
                <button id="filter-add" onClick={e => this.addFilter(e)}>
                  Create Filter
                </button>
                <span className="vl"></span>
                <button
                  name="download"
                  onClick={e => this.downLoadTableAsCsv(e)}
                >
                  <i className="fa fa-download"></i> Download Data as CSV
                </button>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div style={{ display: 'inline-block' }} key={this.state.key}>
                  <Select
                    closeMenuOnSelect={false}
                    isMulti
                    components={{ OptionClass, MultiValue }}
                    options={this.columnsToHide}
                    defaultValue={this.state.selectedColumns}
                    hideSelectedOptions={true}
                    backspaceRemovesValue={false}
                    onChange={e => this.onColumnDropdownChange(e)}
                    className="hide-columns-container"
                    classNamePrefix="hide-columns"
                    placeholder="Show/hide columns"
                    style={{ width: '300px' }}
                    //defaultMenuIsOpen={true}
                  />
                </div>
                <select
                  id="preferences-list"
                  value={this.state.selectedPreference}
                  onChange={this.handlePreferenceChange}
                >
                  <option key="" value="">
                    -- Select preference --
                  </option>
                  {this.state.preferences.map(pref => (
                    <option key={pref} value={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
                <Confirm
                  onConfirm={e => this.deleteReportPreference()}
                  body="Are you sure you want to delete this preference?"
                  confirmText="Confirm Delete"
                  title="Deleting Preference"
                >
                  <button
                    className={
                      this.state.selectedPreference
                        ? 'input-group-addon'
                        : 'input-group-addon disabled'
                    }
                    disabled={this.state.selectedPreference ? false : true}
                    id="clear_addon"
                  >
                    Delete
                  </button>
                </Confirm>
                {!this.state.selectedPreference && (
                  <input
                    id="new-preference"
                    type="text"
                    placeholder="New preference name"
                    size="25"
                  />
                )}
                <button
                  name="updateMemberPereference"
                  style={{ whiteSpace: 'normal' }}
                  onClick={e => this.updateReportPreferences(e)}
                >
                  {this.state.selectedPreference ? 'Update ' : 'Create '}
                  <br />
                  Preference
                </button>
              </div>
            </div>
          </div>
        </div>
        {this.state.filters && this.state.filters.length > 0 ? (
          <div className="table-controls">
            <div style={{ margin: '10px' }}>
              <ReactTabulator
                ref={ref => (this.filtersGridref = ref)}
                columns={this.addedFiltersColumns}
                data={this.state.filters}
                options={{ width: '100%' }}
              />
            </div>
          </div>
        ) : null}
        <div className="row tableData">
          <ReactTabulator
            columns={this.columns}
            data={this.activityData}
            options={options}
            renderComplete={e => this.hideColumns()}
            ref={ref => (this.memberActivityGridref = ref)}
            layout="fitColumns"
          />
        </div>
      </span>
    );
  }
}

const OptionClass = createClass({
  render() {
    return (
      <div>
        <components.Option {...this.props}>
          <input
            type="checkbox"
            checked={this.props.isSelected}
            value={this.props.value}
            onChange={e => console.log()}
          />{' '}
          <label>{this.props.label}</label>
        </components.Option>
      </div>
    );
  },
});

const MultiValue = props => {
  return (
    <components.MultiValue {...props}>
      <span>{props.data.label}</span>
    </components.MultiValue>
  );
};

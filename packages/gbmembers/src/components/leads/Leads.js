import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/leads';
import { actions as memberActions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import 'bootstrap/scss/bootstrap.scss';
import { KappNavLink as NavLink } from 'common';
import { getJson } from '../Member/MemberUtils';
import download from '../../images/download.png';
import sort1 from '../../images/sort1.png';
import sort2 from '../../images/sort2.png';
import { contact_date_format, reminder_date_format } from './LeadsUtils';
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  allLeads: state.member.leads.allLeads,
  allMembers: state.member.members.allMembers,
});

const mapDispatchToProps = {
  fetchCurrentLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  fetchMembers: memberActions.fetchMembers,
};

function getLatestHistory(history) {
  //console.log("# history = " + util.inspect(history));
  let sortedHistory = getJson(history)
    .slice()
    .sort(function(a, b) {
      if (
        moment(a['contactDate'], contact_date_format).isBefore(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return 1;
      if (
        moment(a['contactDate'], contact_date_format).isAfter(
          moment(b['contactDate'], contact_date_format),
        )
      )
        return -1;
      return 0;
    });

  return sortedHistory[0];
}

export class TasksDetail extends Component {
  constructor(props) {
    super(props);
    let leadSearchvalue = '';
    let tasks = this.getData(
      this.props.allLeads,
      'Todays Tasks',
      leadSearchvalue,
    );
    this._columns = this.getColumns();
    let showTasksSelectValue = 'Todays Tasks';

    let memberTasksData = this.getMemberTasksData(
      this.props.allMembers,
      'Todays Tasks',
      leadSearchvalue,
    );
    this._memberTasksColumns = this.getMemberTasksColumns();

    this.state = {
      tasks,
      showTasksSelectValue,
      leadSearchvalue,
      memberTasksData,
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      tasks: this.getData(
        nextProps.allLeads,
        this.state.showTasksSelectValue,
        this.state.leadsearchvalue,
      ),
    });
    this.setState({
      memberTasksData: this.getMemberTasksData(
        nextProps.allMembers,
        this.state.showTasksSelectValue,
        this.state.leadSearchvalue,
      ),
    });
  }

  onShowTasksSelectChange(event) {
    console.log('onShowTasksSelectChange # ' + event.target.value);
    let tasks = this.sort(
      this.getData(
        this.props.allLeads,
        event.target.value,
        this.state.leadSearchvalue,
      ),
      'date',
    );
    let memberTasksData = this.sort(
      this.getMemberTasksData(
        this.props.allMembers,
        event.target.value,
        this.state.leadSearchvalue,
      ),
      'date',
    );
    this.setState({
      showTasksSelectValue: event.target.value,
      tasks: tasks,
      memberTasksData: memberTasksData,
    });
  }

  sort(array, key) {
    var len = array.length;
    if (len < 2) {
      return array;
    }
    var pivot = Math.ceil(len / 2);
    return this.mergeSort(
      this.sort(array.slice(0, pivot), key),
      this.sort(array.slice(pivot), key),
      key,
    );
  }

  mergeSort(left, right, key) {
    var result = [];
    while (left.length > 0 && right.length > 0) {
      if (key === 'date') {
        //Desc
        if (
          moment(new Date(left[0][key]), reminder_date_format).isAfter(
            new Date(right[0][key]),
            reminder_date_format,
          )
        ) {
          result.push(left.shift());
        } else {
          result.push(right.shift());
        }
      }
    }
    result = result.concat(left, right);
    return result;
  }
  getData(allLeads, duration, searchString) {
    //console.log("#### In get data");
    if (!allLeads) {
      return [];
    }

    const date_format = 'YYYY-MM-DD';
    let leads = [];

    if (duration === 'Todays Tasks') {
      const today = moment().startOf('day');
      allLeads.forEach(lead => {
        if (lead.values['Status'] === 'Open' && lead.values['Reminder Date']) {
          if (
            moment(lead.values['Reminder Date'], date_format).isBefore(
              today,
              'd',
            ) ||
            moment(lead.values['Reminder Date'], date_format).isSame(today, 'd')
          ) {
            leads.push({
              _id: lead['id'],
              date: lead.values['Reminder Date'],
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
              note: getLatestHistory(lead.values['History']).note,
            });
          }
        }
      });
    } else if (duration === 'This Weeks Tasks') {
      const startDate = moment().startOf('day');
      const endDate = startDate
        .clone()
        .add(1, 'weeks')
        .startOf('day');
      allLeads.forEach(lead => {
        if (lead.values['Status'] === 'Open' && lead.values['Reminder Date']) {
          if (
            moment(lead.values['Reminder Date'], date_format).isBefore(
              startDate,
              'd',
            ) ||
            moment(lead.values['Reminder Date'], date_format).isBetween(
              startDate,
              endDate,
              'days',
              '[]',
            )
          ) {
            leads.push({
              _id: lead['id'],
              date: lead.values['Reminder Date'],
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
              note: getLatestHistory(lead.values['History']).note,
            });
          }
        }
      });
    } else if (duration === 'This Months Tasks') {
      const startDate = moment().startOf('day');
      const endDate = startDate
        .clone()
        .add(1, 'months')
        .startOf('day');
      allLeads.forEach(lead => {
        if (lead.values['Status'] === 'Open' && lead.values['Reminder Date']) {
          if (
            moment(lead.values['Reminder Date'], date_format).isBefore(
              startDate,
              'd',
            ) ||
            moment(lead.values['Reminder Date'], date_format).isBetween(
              startDate,
              endDate,
              'days',
              '[]',
            )
          ) {
            leads.push({
              _id: lead['id'],
              date: lead.values['Reminder Date'],
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
              note: getLatestHistory(lead.values['History']).note,
            });
          }
        }
      });
    } else if (duration === 'All Tasks') {
      allLeads.forEach(lead => {
        if (lead.values['Status'] === 'Open' && lead.values['Reminder Date']) {
          leads[leads.length] = {
            _id: lead['id'],
            date: lead.values['Reminder Date'],
            name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
            note: getLatestHistory(lead.values['History']).note,
          };
        }
      });
    }

    return leads;
  }

  getColumns = () => {
    return [
      {
        accessor: 'date',
        width: 60,
        Cell: row => (
          <div id="dateDiv">
            <span style={{ fontSize: '14px' }}>
              {this.getDay(row.original.date)}
            </span>
            <br />
            <span
              style={{ display: 'block', marginTop: '-4px', fontSize: '14px' }}
            >
              {this.getMonth(row.original.date)}
            </span>
          </div>
        ),
      },
      { accessor: 'name', width: 150 },
      { accessor: 'note', width: 300 },
      {
        accessor: '$followup',
        width: 120,
        Cell: row => (
          <NavLink
            to={`/LeadDetail/${row.original['_id']}`}
            className="btn btn-primary"
            style={{
              borderRadius: '0',
              backgroundColor: '#991B1E',
              height: '30px',
              width: '90px',
            }}
          >
            Follow Up
          </NavLink>
        ),
      },
      {
        accessor: '$skip',
        width: 100,
        Cell: row => (
          <NavLink
            to={`/FollowUp/${row.original['_id']}`}
            className="btn btn-primary"
            style={{
              borderRadius: '0',
              backgroundColor: '#991B1E',
              height: '30px',
              width: '90px',
            }}
          >
            Skip
          </NavLink>
        ),
      },
    ];
  };

  getMemberTasksData(allMembers, duration, searchString) {
    if (!allMembers) {
      return;
    }

    const date_format = 'YYYY-MM-DD';
    let members = [];

    if (duration === 'Todays Tasks') {
      const today = moment().startOf('day');
      allMembers.forEach(member => {
        if (member.values['Reminder Date']) {
          if (
            moment(member.values['Reminder Date'], date_format).isBefore(
              today,
              'd',
            ) ||
            moment(member.values['Reminder Date'], date_format).isSame(
              today,
              'd',
            )
          ) {
            members.push({
              _id: member['id'],
              date: moment(member.values['Reminder Date']).format('L LT'),
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
              note: getLatestHistory(member.values['Notes History'])
                ? getLatestHistory(member.values['Notes History']).note
                : '',
            });
          }
        }
      });
    } else if (duration === 'This Weeks Tasks') {
      const startDate = moment().startOf('day');
      const endDate = startDate
        .clone()
        .add(1, 'weeks')
        .startOf('day');
      allMembers.forEach(member => {
        if (member.values['Reminder Date']) {
          if (
            moment(member.values['Reminder Date'], date_format).isBefore(
              startDate,
              'd',
            ) ||
            moment(member.values['Reminder Date'], date_format).isBetween(
              startDate,
              endDate,
              'days',
              '[]',
            )
          ) {
            members.push({
              _id: member['id'],
              date: moment(member.values['Reminder Date']).format('L LT'),
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
              note: getLatestHistory(member.values['Notes History'])
                ? getLatestHistory(member.values['Notes History']).note
                : '',
            });
          }
        }
      });
    } else if (duration === 'This Months Tasks') {
      const startDate = moment().startOf('day');
      const endDate = startDate
        .clone()
        .add(1, 'months')
        .startOf('day');
      allMembers.forEach(member => {
        if (member.values['Reminder Date']) {
          if (
            moment(member.values['Reminder Date'], date_format).isBefore(
              startDate,
              'd',
            ) ||
            moment(member.values['Reminder Date'], date_format).isBetween(
              startDate,
              endDate,
              'days',
              '[]',
            )
          ) {
            members.push({
              _id: member['id'],
              date: member.values['Reminder Date'],
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
              note: getLatestHistory(member.values['Notes History'])
                ? getLatestHistory(member.values['Notes History']).note
                : '',
            });
          }
        }
      });
    } else if (duration === 'All Tasks') {
      allMembers.forEach(member => {
        if (member.values['Reminder Date']) {
          members[members.length] = {
            _id: member['id'],
            date: member.values['Reminder Date'],
            name:
              member.values['First Name'] + ' ' + member.values['Last Name'],
            note: getLatestHistory(member.values['Notes History'])
              ? getLatestHistory(member.values['Notes History']).note
              : '',
          };
        }
      });
    }

    return members;
  }

  getMemberTasksColumns(allMembers) {
    return [
      {
        accessor: 'date',
        width: 60,
        Cell: row => (
          <div id="dateDiv">
            <span style={{ fontSize: '14px' }}>
              {this.getDay(row.original.date)}
            </span>
            <br />
            <span
              style={{ display: 'block', marginTop: '-4px', fontSize: '14px' }}
            >
              {this.getMonth(row.original.date)}
            </span>
          </div>
        ),
      },
      { accessor: 'name', width: 150 },
      { accessor: 'note', width: 300 },
      {
        accessor: '$followup',
        width: 120,
        Cell: row => (
          <NavLink
            to={`/MemberNotesDetail/${row.original['_id']}`}
            className="btn btn-primary"
            style={{
              borderRadius: '0',
              backgroundColor: '#991B1E',
              height: '30px',
              width: '90px',
            }}
          >
            Follow Up
          </NavLink>
        ),
      },
      {
        accessor: '$skip',
        width: 100,
        Cell: row => (
          <NavLink
            to={`/MemberFollowUp/${row.original['_id']}`}
            className="btn btn-primary"
            style={{
              borderRadius: '0',
              backgroundColor: '#991B1E',
              height: '30px',
              width: '90px',
            }}
          >
            Skip
          </NavLink>
        ),
      },
    ];
  }

  getDay(date) {
    if (!date) {
      return undefined;
    }
    return moment(date).date();
  }

  getMonth(date) {
    if (!date) {
      return undefined;
    }
    return moment(date)
      .format('MMM')
      .toUpperCase();
  }

  render() {
    let tasks = this.state.tasks;
    let memberTasks = this.state.memberTasksData;
    if (this.state.leadSearchvalue) {
      tasks = tasks.filter(row => {
        return (
          row.name
            .toUpperCase()
            .includes(this.state.leadSearchvalue.toUpperCase()) ||
          row.date.includes(this.state.leadSearchvalue) ||
          row.note
            .toUpperCase()
            .includes(this.state.leadSearchvalue.toUpperCase())
        );
      });
      memberTasks = memberTasks.filter(row => {
        return (
          row.name
            .toUpperCase()
            .includes(this.state.leadSearchvalue.toUpperCase()) ||
          row.date.includes(this.state.leadSearchvalue) ||
          row.note
            .toUpperCase()
            .includes(this.state.leadSearchvalue.toUpperCase())
        );
      });
    }
    return (
      <div>
        <div className="row headerPanel">
          <div className="col">
            <div className="form-group">
              <label htmlFor="allTasks">Show Tasks</label>
              <select
                id="allTasks"
                className="form-control"
                style={{ width: '50%' }}
                value={this.state.showTasksSelectValue}
                onChange={e => this.onShowTasksSelectChange(e)}
              >
                <option value="Todays Tasks">Todays Tasks</option>
                <option value="This Weeks Tasks">This Weeks Tasks</option>
                <option value="This Months Tasks">This Months Tasks</option>
                <option value="All Tasks">All Tasks</option>
              </select>
            </div>
            <div className="form-group">
              <input
                type="text"
                className="form-control"
                style={{ width: '50%' }}
                id="leadSearch"
                value={this.state.leadSearchvalue}
                placeholder="Lead Search"
                onChange={e =>
                  this.setState({ leadSearchvalue: e.target.value })
                }
              />
            </div>
          </div>
        </div>
        <div className="row">
          <div className="pageHeader">
            <h3>Lead Tasks</h3>
          </div>
        </div>
        <div id="tasksListGrid1" className="row" style={{ marginTop: '10px' }}>
          <div className="col">
            <ReactTable
              columns={this._columns}
              data={tasks}
              defaultPageSize={tasks.length > 0 ? tasks.length : 2}
              pageSize={tasks.length > 0 ? tasks.length : 2}
              showPagination={false}
              style={{
                /*height: '500px',*/
                borderLeft: '0 !important',
              }}
              ref="tasksGrid"
            />
          </div>
        </div>

        <div className="row">
          <div className="pageHeader">
            <h3>Member Tasks</h3>
          </div>
        </div>
        <div id="memberTasksGrid" className="row" style={{ marginTop: '10px' }}>
          <div className="col">
            <ReactTable
              columns={this._memberTasksColumns}
              data={memberTasks}
              defaultPageSize={memberTasks.length > 0 ? memberTasks.length : 2}
              pageSize={memberTasks.length > 0 ? memberTasks.length : 2}
              showPagination={false}
              style={{
                /*height: '500px',*/
                borderLeft: '0 !important',
              }}
              ref="memberTasksGrid"
            />
          </div>
        </div>
      </div>
    );
  }
}

export class LeadsDetail extends Component {
  constructor(props) {
    super(props);
    let leads = this.getData(this.props.allLeads);
    this._columns = this.getColumns();

    let nameSortOrder = 'desc';
    let lastContactSortOrder = 'desc';

    this.state = {
      leads,
      nameSortOrder,
      lastContactSortOrder,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads !== undefined && nextProps.allLeads !== null) {
      this.setState({
        leads: this.getData(nextProps.allLeads),
      });
    }
  }

  getData(allLeads) {
    let leads = [];
    allLeads.forEach(lead => {
      if (lead.values['Status'] === 'Open') {
        leads.push({
          _id: lead['id'],
          name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
          lastContact: moment(lead.values['Last Contact']).format('L LT'),
        });
      }
    });
    return leads;
  }

  getColumns = () => {
    return [
      {
        accessor: 'name',
        Header: 'All Leads',
        width: 150,
        sortable: false,
        Cell: row => (
          <NavLink
            to={`/LeadDetail/${row.original['_id']}`}
            className="leadDetailAnchor"
          >
            {row.original.name}
          </NavLink>
        ),
      },
      {
        accessor: 'lastContact',
        Header: 'Last Contact',
        width: 300,
        sortable: false,
        Cell: row => row.original.lastContact,
      },
    ];
  };

  sortGrid(key) {
    let sortedData = this.sort(this.state.leads, key);
    this.setState({
      leads: sortedData,
    });

    if (key === 'name') {
      this.setState((prevState, props) => ({
        nameSortOrder: prevState.nameSortOrder === 'desc' ? 'asc' : 'desc',
      }));
    }

    if (key === 'lastContact') {
      this.setState((prevState, props) => ({
        lastContactSortOrder:
          prevState.lastContactSortOrder === 'desc' ? 'asc' : 'desc',
      }));
    }
  }

  sort(array, key) {
    var len = array.length;
    if (len < 2) {
      return array;
    }
    var pivot = Math.ceil(len / 2);
    return this.mergeSort(
      this.sort(array.slice(0, pivot), key),
      this.sort(array.slice(pivot), key),
      key,
    );
  }

  mergeSort(left, right, key) {
    var result = [];
    while (left.length > 0 && right.length > 0) {
      if (key === 'name') {
        if (
          this.state.nameSortOrder === 'desc'
            ? left[0][key] > right[0][key]
            : left[0][key] < right[0][key]
        ) {
          result.push(left.shift());
        } else {
          result.push(right.shift());
        }
      } else {
        if (key === 'lastContact') {
          if (
            this.state.lastContactSortOrder === 'desc'
              ? moment(left[0][key], contact_date_format).isAfter(
                  right[0][key],
                  contact_date_format,
                )
              : moment(left[0][key], contact_date_format).isBefore(
                  right[0][key],
                  contact_date_format,
                )
          ) {
            result.push(left.shift());
          } else {
            result.push(right.shift());
          }
        }
      }
    }

    result = result.concat(left, right);
    return result;
  }

  downloadLeads() {
    let fileDownload = require('js-file-download');
    let csvData =
      'First Name, Last Name, Gender, Address, Suburb, State, Postcode, Email, Phone, DOB, Source, Status, Date\n';
    this.props.allLeads.forEach(lead => {
      csvData = csvData.concat(
        '"' +
          lead.values['First Name'] +
          '","' +
          lead.values['Last Name'] +
          '","' +
          lead.values['Gender'] +
          '","' +
          lead.values['Address'] +
          '","' +
          lead.values['Suburb'] +
          '","' +
          lead.values['State'] +
          '","' +
          lead.values['Postcode'] +
          '","' +
          lead.values['Email'] +
          '","' +
          lead.values['Phone'] +
          '","' +
          lead.values['DOB'] +
          '","' +
          lead.values['Source'] +
          '","' +
          lead.values['Status'] +
          '","' +
          lead.values['Date'] +
          '"\n',
      );
    });
    fileDownload(csvData, 'leads.csv');
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="col">
            <span style={{ margin: '10px' }}>Leads</span>
            <a className="cursorPointer">
              <img
                style={{ border: 'none', margin: '10px' }}
                src={download}
                title="Export Leads to CSV"
                alt="Export Leads to CSV"
                onClick={e => this.downloadLeads()}
              />
            </a>
            <a className="cursorPointer">
              <img
                style={{ border: 'none', margin: '10px' }}
                src={sort1}
                title="Sort Alphabetically"
                alt="Sort Alphabetically"
                onClick={e => this.sortGrid('name')}
              />
            </a>
            <a className="cursorPointer">
              <img
                style={{ border: 'none', margin: '10px' }}
                src={sort2}
                title="Sort by Date of last contact"
                alt="Sort by Date of last contact"
                onClick={e => this.sortGrid('lastContact')}
              />
            </a>
            <NavLink to={`/NewLead`} className="btn btn-primary addNewLead">
              Add New Lead
            </NavLink>
          </div>
        </div>
        <div id="leadsListGrid1" className="row" style={{ marginTop: '20px' }}>
          <ReactTable
            columns={this._columns}
            data={this.state.leads}
            defaultPageSize={this.state.leads.length}
            pageSize={this.state.leads.length}
            showPagination={false}
            style={{
              /*height: '500px',*/
              borderLeft: '0 !important',
            }}
          />
        </div>
      </div>
    );
  }
}

export class LeadsCreatedChart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allLeads);
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads) {
      this.setState({
        data: this.getData(nextProps.allLeads),
      });
    }
  }

  getData(allLeads) {
    if (!allLeads || allLeads.length <= 0) {
      return [];
    }

    let data = [];
    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();

    allLeads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
        let objFound = data.find(
          obj => obj['Date Created'] === createdDate.format('DD-MM-YYYY'),
        );
        if (objFound) {
          objFound['Leads Created'] = objFound['Leads Created'] + 1;
        } else {
          data.push({
            'Date Created': createdDate.format('DD-MM-YYYY'),
            'Leads Created': 1,
          });
        }
      }
    });
    return data;
  }

  yAxisTickFormatter(leadsCount) {
    return leadsCount;
  }

  xAxisTickFormatter(date) {
    return date;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(label) {
    return label;
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Leads Created - Last 30 Days</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Date Created"
              tickFormatter={this.xAxisTickFormatter}
            />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{
                value: 'Leads Count',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend />
            <Bar dataKey="Leads Created" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

const COLORS = [
  '#800000',
  '#D2691E',
  '#DAA520',
  '#BC8F8F',
  '#2F4F4F',
  '#708090',
  '#A9A9A9',
  '#DB7093',
  '#FFB6C1',
  '#9932CC',
  '#8A2BE2',
  '#1E90FF',
  '#6495ED',
  '#ADD8E6',
  '#48D1CC',
  '#6B8E23',
  '#00FF00',
  '#F08080',
];
const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
  index,
  name,
  tooltipPayload,
}) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const chartLabels = {
  last_30_days: 'Last 30 Days',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_year: 'Last Year',
  custom: 'Custom Dates',
};

export class LeadsConversionChart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allLeads, 'last_30_days');
    this.onPieEnter = this.onPieEnter.bind(this);
    this.calculateConversion = this.calculateConversion.bind(this);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      data,
      totalLeads: 0,
      leadsConverted: 0,
      conversionPercent: 0.0,
      activeIndex: 0,
      leadType: 'All Types',
      dateRange: 'last_30_days',
      fromDate: '',
      toDate: '',
      chartLabel: 'Last 30 Days',
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads) {
      this.setState({
        data: this.getData(nextProps.allLeads, this.state.dateRange),
      });
    }
  }

  getData(allLeads, dateRange) {
    if (!allLeads || allLeads.length <= 0) {
      return [];
    }

    let leadsByType = [];
    let fromDate = null;
    let toDate = null;
    let totalLeads = 0;
    let leadsConverted = 0;

    dateRange = dateRange ? dateRange : 'last_30_days';

    if (dateRange === 'last_30_days') {
      fromDate = moment().subtract('30', 'days');
      toDate = moment();
    } else if (dateRange === 'last_month') {
      fromDate = moment()
        .subtract(1, 'months')
        .startOf('month');
      toDate = moment()
        .subtract(1, 'months')
        .endOf('month');
    } else if (dateRange === 'last_3_months') {
      fromDate = moment()
        .subtract(3, 'months')
        .startOf('month');
      toDate = moment()
        .subtract(1, 'months')
        .endOf('month');
    } else if (dateRange === 'last_6_months') {
      fromDate = moment()
        .subtract(6, 'months')
        .startOf('month');
      toDate = moment()
        .subtract(1, 'months')
        .endOf('month');
    } else if (dateRange === 'last_year') {
      fromDate = moment()
        .subtract(1, 'years')
        .startOf('month');
      toDate = moment()
        .subtract(1, 'months')
        .endOf('month');
    } else if (dateRange === 'custom') {
      fromDate = moment(this.state.fromDate, 'YYYY-MM-DD');
      toDate = moment(this.state.toDate, 'YYYY-MM-DD');
    }

    allLeads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
        totalLeads++;
        if (lead.values['Converted Member ID']) {
          leadsConverted++;
        }
        let objFound = leadsByType.find(
          obj => obj['name'] === lead.values['Source'],
        );
        if (objFound) {
          objFound['value'] = objFound['value'] + 1;
          if (lead.values['Converted Member ID']) {
            objFound['leadsConverted'] = objFound['leadsConverted'] + 1;
          }
        } else {
          leadsByType.push({
            name: lead.values['Source'],
            value: 1,
            key: lead.values['Source'],
            leadsConverted: lead.values['Converted Member ID'] ? 1 : 0,
          });
        }
      }
    });

    this.setState({
      totalLeads: totalLeads,
      leadsConverted: leadsConverted,
      conversionPercent:
        totalLeads === 0 || leadsConverted === 0
          ? 0.0
          : (leadsConverted * 100) / totalLeads,
    });
    return leadsByType;
  }

  calculateConversion(entry, index) {
    this.setState({
      leadType: entry.name,
      totalLeads: entry.value,
      leadsConverted: entry.leadsConverted,
      conversionPercent:
        entry.value === 0 || entry.leadsConverted === 0
          ? 0
          : (entry.leadsConverted * 100) / entry.value,
    });
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if (event.target.name === 'dateRange') {
      this.setState({
        chartLabel: chartLabels[event.target.value],
      });
    }
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      this.setState({
        data: this.getData(this.props.allLeads, event.target.value),
      });
    }
  }

  handleSubmit() {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        data: this.getData(this.props.allLeads, this.state.dateRange),
      });
    }
  }

  onPieEnter(data, index) {
    this.setState({
      activeIndex: index,
    });
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Leads Conversion - {this.state.chartLabel}</h6>
          <h6>
            Lead Type -{' '}
            <span style={{ color: '#086A87', fontWeight: 'bold' }}>
              {this.state.leadType}
            </span>
          </h6>
        </div>
        <div className="row leadConversion">
          <div className="chart1">
            <div>
              <ResponsiveContainer minHeight={250}>
                <PieChart width={300} height={250}>
                  <Pie
                    isAnimationActive={true}
                    activeIndex={this.state.activeIndex}
                    onMouseEnter={this.onPieEnter}
                    data={data}
                    dataKey="value"
                    cx={140}
                    cy={120}
                    labelLine={false}
                    label={renderCustomizedLabel}
                    outerRadius={120}
                    fill="#8884d8"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        fill={COLORS[index % COLORS.length]}
                        key={entry.id}
                        onClick={e => {
                          this.calculateConversion(entry, index);
                        }}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="arrow">
            <i className="fa fa-chevron-right" />
            <i className="fa fa-chevron-down" />
          </div>
          <div className="chart2">
            <div className="circle">
              <span className="info">
                <span className="leadsCount">
                  {this.state.totalLeads} LEAD/S
                </span>
                <br />
                <span className="convertedTo">CONVERTED TO</span>
                <br />
                <span style={{ color: 'black', fontWeight: 'bold' }}>
                  {this.state.leadsConverted} STUDENT/S
                </span>
                <br />
                <span className="students">
                  {this.state.conversionPercent.toFixed(0)}%
                </span>
              </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div className="row" style={{ width: '50%', margin: '0 auto' }}>
            <div
              className={
                this.state.dateRange !== 'custom' ? 'col-md-12' : 'col-md-4'
              }
            >
              <div className="col-xs-2 mr-1">
                <label htmlFor="dateRange" className="control-label">
                  Date Range
                </label>
                <select
                  name="dateRange"
                  id="dateRange"
                  className="form-control input-sm"
                  value={this.state.dateRange}
                  onChange={e => this.handleInputChange(e)}
                >
                  <option value="last_30_days">Last 30 Days</option>
                  <option value="last_month">Last Month</option>
                  <option value="last_3_months">Last 3 Months</option>
                  <option value="last_6_months">Last 6 Months</option>
                  <option value="last_year">Last Year</option>
                  <option value="custom">Custom</option>
                </select>
                <div className="droparrow" />
              </div>
            </div>
            {this.state.dateRange === 'custom' && (
              <div className="col-md-8">
                <div className="row">
                  <div className="form-group col-xs-2 mr-1">
                    <label htmlFor="fromDate" className="control-label">
                      From Date
                    </label>
                    <input
                      type="date"
                      name="fromDate"
                      id="fromDate"
                      className="form-control input-sm"
                      required
                      defaultValue={this.state.fromDate}
                      onChange={e => this.handleInputChange(e)}
                    />
                  </div>
                  <div className="form-group col-xs-2 mr-1">
                    <label htmlFor="toDate" className="control-label">
                      To Date
                    </label>
                    <input
                      type="date"
                      name="toDate"
                      id="toDate"
                      className="form-control input-sm"
                      required
                      defaultValue={this.state.toDate}
                      onChange={e => this.handleInputChange(e)}
                    />
                  </div>
                  <div className="form-group col-xs-2">
                    <label className="control-label">&nbsp;</label>
                    <button
                      className="btn btn-primary form-control input-sm"
                      onClick={e => this.handleSubmit()}
                    >
                      Go
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </span>
    );
    circle1;
  }
}

export class SourceReference3Chart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allLeads);
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads) {
      this.setState({
        data: this.getData(nextProps.allLeads),
      });
    }
  }

  getData(allLeads) {
    if (!allLeads || allLeads.length <= 0) {
      return [];
    }

    let data = [
      { 'Source Reference 3': 'Adult', Count: 0 },
      { 'Source Reference 3': 'Kids', Count: 0 },
      { 'Source Reference 3': 'Unknown', Count: 0 },
    ];
    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();
    allLeads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
        if (lead.values['Source Reference 3'] === 'Adult') {
          let objFound = data.find(
            obj => obj['Source Reference 3'] === 'Adult',
          );
          objFound['Count'] = objFound['Count'] + 1;
        } else if (lead.values['Source Reference 3'] === 'Kids') {
          let objFound = data.find(obj => obj['Source Reference 3'] === 'Kids');
          objFound['Count'] = objFound['Count'] + 1;
        } else {
          let objFound = data.find(
            obj => obj['Source Reference 3'] === 'Unknown',
          );
          objFound['Count'] = objFound['Count'] + 1;
        }
      }
    });
    return data;
  }

  yAxisTickFormatter(leadsCount) {
    return leadsCount;
  }

  xAxisTickFormatter(date) {
    return date;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(label) {
    return label;
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Adults/Kids - Last 30 Days</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="Source Reference 3"
              tickFormatter={this.xAxisTickFormatter}
            />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend />
            <Bar dataKey="Count" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export class SourceReferenceChart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allLeads);
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads) {
      this.setState({
        data: this.getData(nextProps.allLeads),
      });
    }
  }

  getData(allLeads) {
    if (!allLeads || allLeads.length <= 0) {
      return [];
    }

    let data = [];
    let fromDate = moment().subtract('30', 'days');
    let toDate = moment();
    allLeads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
        let objFound = data.find(
          obj => obj['date'] === createdDate.format('DD-MM-YYYY'),
        );
        if (
          !objFound &&
          (lead.values['Source Reference 1'] ||
            lead.values['Source Reference 2'] ||
            lead.values['Source Reference 3'])
        ) {
          objFound = { date: createdDate.format('DD-MM-YYYY') };
          data.push(objFound);
        }
        if (lead.values['Source Reference 1']) {
          if (objFound['Source Reference 1']) {
            objFound['Source Reference 1'] = objFound['Source Reference 1'] + 1;
          } else {
            objFound['Source Reference 1'] = 1;
          }
        }
        if (lead.values['Source Reference 2']) {
          if (objFound['Source Reference 2']) {
            objFound['Source Reference 2'] = objFound['Source Reference 2'] + 1;
          } else {
            objFound['Source Reference 2'] = 1;
          }
        }
        if (lead.values['Source Reference 3']) {
          if (objFound['Source Reference 3']) {
            objFound['Source Reference 3'] = objFound['Source Reference 3'] + 1;
          } else {
            objFound['Source Reference 3'] = 1;
          }
        }
      }
    });
    return data;
  }

  yAxisTickFormatter(leadsCount) {
    return leadsCount;
  }

  xAxisTickFormatter(date) {
    return date;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(label) {
    return label;
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Source Reference - Last 30 Days</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tickFormatter={this.xAxisTickFormatter} />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{ value: 'Count', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend />
            <Bar dataKey="Source Reference 1" fill="#8884d8" />
            <Bar dataKey="Source Reference 2" fill="#82ca9d" />
            <Bar dataKey="Source Reference 3" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export const LeadsView = ({ allLeads, saveLead, fetchLeads, allMembers }) => (
  <div className="container-fluid leads">
    <StatusMessagesContainer />
    <div className="row">
      <div className="taskContents">
        <TasksDetail
          allLeads={allLeads}
          saveLead={saveLead}
          allMembers={allMembers}
        />
      </div>
      <div className="leadContents">
        <LeadsDetail allLeads={allLeads} />
      </div>
    </div>
    <div>
      <LeadsCreatedChart allLeads={allLeads} />
    </div>
    <div>
      <LeadsConversionChart allLeads={allLeads} />
    </div>
    <div>
      <SourceReference3Chart allLeads={allLeads} />
    </div>
    <div>{/*      <SourceReferenceChart allLeads={allLeads} /> */}</div>
  </div>
);
function tick(mythis) {
  console.log('Ticking ...' + mythis);
  mythis.props.fetchLeads();
}
export const LeadsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withHandlers({
    saveLead: ({ updateLead, fetchLeads }) => (leadItem, reminderDate) => {
      leadItem.values['Reminder Date'] = reminderDate;
      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        //history: leadItem.history,
        fetchLeads: fetchLeads,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchLeads();
      this.props.fetchMembers();
      let timer = setInterval(tick, 60 * 1000 * 2, this); // refresh every 2 minutes
      this.setState({ timer: timer });
    },
    componentWillReceiveProps(nextProps) {},
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {
      clearInterval(this.state.timer);
    },
  }),
)(LeadsView);
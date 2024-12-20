import React, { Component } from 'react';
import { connect } from 'react-redux';
import SVGInline from 'react-svg-inline';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/leads';
import { actions as memberActions } from '../../redux/modules/members';
import { actions as appActions } from '../../redux/modules/memberApp';
import $ from 'jquery';
import 'bootstrap/scss/bootstrap.scss';
import { KappNavLink as NavLink } from 'common';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import in_person from '../../images/in_person.png';
import intro_class from '../../images/intro_class.png';
import free_class from '../../images/free_class.png';
import attended_class from '../../images/user-check.png';
import noshow_class from '../../images/no-show.png';
import { getJson } from '../Member/MemberUtils';
import download from '../../images/download.png';
import sort1 from '../../images/sort1.png';
import sort2 from '../../images/sort2.png';
import attentionRequired from '../../images/flag.svg?raw';
import {
  contact_date_format,
  reminder_date_format,
  gmt_format,
  getLocalePreference,
  formatDateValue,
} from './LeadsUtils';
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
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { matchesLeadFilter } from '../../utils/utils';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  allLeads: state.member.leads.allLeads,
  leadLastFetchTime: state.member.leads.leadLastFetchTime,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
  memberNotesLoading: state.member.members.memberNotesLoading,
  memberNotesLoaded: state.member.members.memberNotesLoaded,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
  leadLists: state.member.app.leadLists,
});

const mapDispatchToProps = {
  fetchCurrentLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
  fetchMembers: memberActions.fetchMembers,
  setBulkSkipIds: actions.setBulkSkipIds,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
const date_format = ['YYYY-MM-DD', 'YYYY-MM-DDTHH:mm:ssZ'];

function getLatestHistory(history) {
  //console.log("# history = " + util.inspect(history));
  let histJson = getJson(history);
  if (
    histJson.length > 0 &&
    typeof histJson[0] === 'string' &&
    histJson[0].indexOf('. User Comment:') !== -1
  ) {
    histJson[0] = histJson[0].replace('[{', '{').replace('}]', '}');
    histJson[0] = getJson(histJson[0].replace(/\n/g, ' '));
  }
  let sortedHistory = histJson;
  //  let sortedHistory = getJson(history)
  sortedHistory.sort(function(a, b) {
    if (
      moment(a['contactDate'], [
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DDTHH:mm:ss',
      ]).isBefore(
        moment(b['contactDate'], [
          'YYYY-MM-DD HH:mm',
          'YYYY-MM-DDTHH:mm:ss',
          'YYYY-MM-DDTHH:mm:ssZ',
        ]),
      )
    ) {
      return 1;
    }
    if (
      moment(a['contactDate'], [
        'YYYY-MM-DD HH:mm',
        'YYYY-MM-DDTHH:mm:ss',
      ]).isAfter(
        moment(b['contactDate'], [
          'YYYY-MM-DD HH:mm',
          'YYYY-MM-DDTHH:mm:ss',
          'YYYY-MM-DDTHH:mm:ssZ',
        ]),
      )
    ) {
      return -1;
    }
    return 0;
  });

  return sortedHistory[0];
}

export class TasksDetail extends Component {
  constructor(props) {
    super(props);
    let leadSearchValue = '';
    let attentionRequiredOnly = false;
    let allLeads = this.getLeadsData(this.props.allLeads);
    let tasks = this.getLeadTasksData(this.props.allLeads, 'Todays Tasks');
    this._columns = this.getLeadColumns();
    let showTasksSelectValue = 'Todays Tasks';
    this.setBulkLeadIds = this.setBulkLeadIds.bind(this);

    let memberTasksData = this.getMemberTasksData(
      this.props.allMembers,
      'Todays Tasks',
    );
    this._memberTasksColumns = this.getMemberTasksColumns();
    this.leadLists = this.props.leadLists;

    this.state = {
      allLeads,
      tasks,
      showTasksSelectValue,
      memberTasksData,
      leadSearchValue,
      attentionRequiredOnly,
      filters: [],
      bulkSkip: false,
      selectAll: false,
      bulkSkipIds: [],
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    let tasks = this.sort(
      this.getLeadTasksData(
        nextProps.allLeads,
        this.state.showTasksSelectValue,
      ),
      'date',
    );
    let memberTasksData = this.sort(
      this.getMemberTasksData(
        nextProps.allMembers,
        this.state.showTasksSelectValue,
      ),
      'date',
    );

    this.setState({
      tasks: tasks,
      memberTasksData: memberTasksData,
      allLeads: this.getLeadsData(nextProps.allLeads),
    });
    let attentionRequiredOnly = false;
    // Determine if there are any Leads that requireAttention
    /*    nextProps.allLeads.forEach(lead => {
      if (lead.values['Is New Reply Received'] === 'true') {
        attentionRequiredOnly = true;
      }
    });
*/
    // Determine if there are any Leads that requireAttention
    /*
    nextProps.allMembers.forEach(member => {
      if (member.values['Is New Reply Received'] === 'true') {
        attentionRequiredOnly = true;
      }
    });
    this.setState({
      attentionRequiredOnly: attentionRequiredOnly,
    });
*/
  }

  onShowTasksSelectChange(event) {
    console.log('onShowTasksSelectChange # ' + event.target.value);
    let tasks = this.sort(
      this.getLeadTasksData(this.props.allLeads, event.target.value),
      'date',
    );
    let memberTasksData = this.sort(
      this.getMemberTasksData(this.props.allMembers, event.target.value),
      'date',
    );
    this.setState({
      showTasksSelectValue: event.target.value,
      tasks: tasks,
      memberTasksData: memberTasksData,
    });
  }
  onShowTasksSelectLeadsListChange(event) {
    var list = this.leadLists.find(item => item.name === event.target.value);

    this.setState({
      filters: list !== undefined ? list.filters : [],
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
  getLeadTasksData(allLeads, duration) {
    //console.log("#### In get data");
    if (!allLeads) {
      return [];
    }

    const date_format = 'YYYY-MM-DDTHH:mm:ssZ';
    let leads = [];

    if (duration === 'Todays Tasks') {
      const today = moment().startOf('day');
      allLeads.forEach(lead => {
        if (
          lead.values['Status'] !== 'Converted' &&
          lead.values['Status'] !== 'Deleted'
        ) {
          if (
            lead.values['Reminder Date'] !== undefined &&
            moment(lead.values['Reminder Date']).isValid()
          ) {
            if (
              moment(lead.values['Reminder Date'], date_format).isBefore(
                today,
                'day',
              ) ||
              moment(lead.values['Reminder Date'], date_format).isSame(
                today,
                'day',
              )
            ) {
              var latestHistory = getLatestHistory(lead.values['History']);
              leads.push({
                _id: lead['id'],
                date: lead.values['Reminder Date'],
                name:
                  lead.values['First Name'] + ' ' + lead.values['Last Name'],
                contactMethod:
                  latestHistory !== undefined
                    ? latestHistory.contactMethod
                    : '',
                contactDate:
                  latestHistory !== undefined ? latestHistory.contactDate : '',
                note: latestHistory !== undefined ? latestHistory.note : '',
                attentionRequired: lead.values['Is New Reply Received'],
              });
            }
          }
        }
      });
    } else if (duration === 'This Weeks Tasks') {
      const startDate = moment().startOf('week');
      const endDate = startDate
        .clone()
        .add(1, 'weeks')
        .startOf('day');
      allLeads.forEach(lead => {
        if (
          lead.values['Status'] !== 'Converted' &&
          lead.values['Status'] !== 'Deleted'
        ) {
          if (
            lead.values['Reminder Date'] !== undefined &&
            moment(lead.values['Reminder Date']).isValid()
          ) {
            if (
              moment(lead.values['Reminder Date'], date_format).isBefore(
                endDate,
                'd',
              ) ||
              moment(lead.values['Reminder Date'], date_format).isBetween(
                startDate,
                endDate,
                'days',
                '[]',
              )
            ) {
              var latestHistory = getLatestHistory(lead.values['History']);
              leads.push({
                _id: lead['id'],
                date: lead.values['Reminder Date'],
                name:
                  lead.values['First Name'] + ' ' + lead.values['Last Name'],
                contactMethod:
                  latestHistory !== undefined
                    ? latestHistory.contactMethod
                    : '',
                contactDate:
                  latestHistory !== undefined ? latestHistory.contactDate : '',
                note: latestHistory !== undefined ? latestHistory.note : '',
                attentionRequired: lead.values['Is New Reply Received'],
              });
            }
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
        if (
          lead.values['Status'] !== 'Converted' &&
          lead.values['Status'] !== 'Deleted'
        ) {
          if (
            lead.values['Reminder Date'] !== undefined &&
            moment(lead.values['Reminder Date']).isValid()
          ) {
            if (
              moment(lead.values['Reminder Date'], date_format).isBefore(
                endDate,
                'day',
              ) ||
              moment(lead.values['Reminder Date'], date_format).isBetween(
                startDate,
                endDate,
                'days',
                '[]',
              )
            ) {
              var latestHistory = getLatestHistory(lead.values['History']);
              leads.push({
                _id: lead['id'],
                date: lead.values['Reminder Date'],
                name:
                  lead.values['First Name'] + ' ' + lead.values['Last Name'],
                contactMethod:
                  latestHistory !== undefined
                    ? latestHistory.contactMethod
                    : '',
                contactDate:
                  latestHistory !== undefined ? latestHistory.contactDate : '',
                note: latestHistory !== undefined ? latestHistory.note : '',
                attentionRequired: lead.values['Is New Reply Received'],
              });
            }
          }
        }
      });
    } else if (duration === 'All Tasks') {
      allLeads.forEach(lead => {
        if (
          lead.values['Status'] !== 'Converted' &&
          lead.values['Status'] !== 'Deleted'
        ) {
          if (
            lead.values['Reminder Date'] !== undefined &&
            lead.values['Reminder Date'] !== null
          ) {
            var latestHistory = getLatestHistory(lead.values['History']);
            leads[leads.length] = {
              _id: lead['id'],
              date: lead.values['Reminder Date'],
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
              contactMethod:
                latestHistory !== undefined ? latestHistory.contactMethod : '',
              contactDate:
                latestHistory !== undefined ? latestHistory.contactDate : '',
              note: latestHistory !== undefined ? latestHistory.note : '',
              attentionRequired: lead.values['Is New Reply Received'],
            };
          }
        }
      });
    }

    return leads;
  }
  formatContactMethodCell(row) {
    if (row.original.contactMethod === 'phone') {
      return (
        <span className="notesCell phone">
          <img src={phone} alt="Phone Call" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'email') {
      return (
        <span className="notesCell email">
          <img src={mail} alt="Email" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'in_person') {
      return (
        <span className="notesCell in-person">
          <img src={in_person} alt="In Person" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'intro_class') {
      return (
        <span className="notesCell intro_class">
          <img src={intro_class} alt="Intro Class" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'free_class') {
      return (
        <span className="notesCell free_class">
          <img src={free_class} alt="Free Class" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'attended_class') {
      return (
        <span className="notesCell attended_class">
          <img src={attended_class} alt="Attended Class" title="Phone Call" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else if (row.original.contactMethod === 'noshow_class') {
      return (
        <span className="notesCell noshow_class">
          <img src={noshow_class} alt="Class No Show" title="Class No Show" />
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    } else {
      return (
        <span className="notesCell">
          {moment(row.original.contactDate, [
            'YYYY-MM-DD HH:mm',
            'YYYY-MM-DDTHH:mm:ss',
            'YYYY-MM-DDTHH:mm:ssZ',
          ]).format('L LT')}
        </span>
      );
    }
  }

  getLeadColumns = () => {
    return [
      {
        width: 30,
        Cell: row => (
          <SVGInline
            svg={attentionRequired}
            className={
              row.original.attentionRequired === 'true'
                ? 'attention icon'
                : 'attention icon hide'
            }
          />
        ),
      },
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
      {
        accessor: 'contactMethod',
        width: 200,
        Cell: row => this.formatContactMethodCell(row),
      },
      { accessor: 'note', width: 300 },
      {
        accessor: '$followup',
        width: 120,
        Cell: row => (
          <NavLink
            to={`/LeadDetail/${row.original['_id']}`}
            className="btn btn-primary"
          >
            Follow Up
          </NavLink>
        ),
      },
      {
        accessor: '$skip',
        width: 100,
        Cell: row =>
          !this.state.bulkSkip ? (
            <NavLink
              to={`/FollowUp/${row.original['_id']}`}
              className="btn btn-primary"
            >
              Skip
            </NavLink>
          ) : (
            <span className="skipLead">
              <input
                key={row.original['_id']}
                type="checkbox"
                id={`${row.original['_id']}`}
                value={row.original['_id']}
                onChange={e => {
                  this.setBulkLeadIds();
                }}
              />
            </span>
          ),
      },
    ];
  };

  getMemberTasksData(allMembers, duration) {
    if (!allMembers) {
      return;
    }

    let members = [];

    if (duration === 'Todays Tasks') {
      const today = moment().startOf('day');
      allMembers.forEach(member => {
        if (
          member.values['Reminder Date'] &&
          member.values['Reminder Date'].indexOf('Invalid date') === -1
        ) {
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
              date: member.values['Reminder Date'],
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
              note: getLatestHistory(member.values['Notes History'])
                ? getLatestHistory(member.values['Notes History']).note
                : '',
              attentionRequired: member.values['Is New Reply Received'],
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
        if (
          member.values['Reminder Date'] &&
          member.values['Reminder Date'].indexOf('Invalid date') === -1
        ) {
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
              attentionRequired: member.values['Is New Reply Received'],
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
        if (
          member.values['Reminder Date'] &&
          member.values['Reminder Date'].indexOf('Invalid date') === -1
        ) {
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
              attentionRequired: member.values['Is New Reply Received'],
            });
          }
        }
      });
    } else if (duration === 'All Tasks') {
      allMembers.forEach(member => {
        if (
          member.values['Reminder Date'] !== undefined &&
          member.values['Reminder Date'] !== null &&
          member.values['Reminder Date'].indexOf('Invalid date') === -1
        ) {
          members[members.length] = {
            _id: member['id'],
            date: member.values['Reminder Date'],
            name:
              member.values['First Name'] + ' ' + member.values['Last Name'],
            note: getLatestHistory(member.values['Notes History'])
              ? getLatestHistory(member.values['Notes History']).note
              : '',
            attentionRequired: member.values['Is New Reply Received'],
          };
        }
      });
    }

    return members;
  }

  getMemberTasksColumns(allMembers) {
    return [
      {
        width: 30,
        Cell: row => (
          <SVGInline
            svg={attentionRequired}
            className={
              row.original.attentionRequired === 'true'
                ? 'attention icon'
                : 'attention icon hide'
            }
          />
        ),
      },
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
          >
            Skip
          </NavLink>
        ),
      },
    ];
  }
  getLeadsData(allLeads) {
    let leads = [];
    allLeads.forEach(lead => {
      if (
        lead.values['Status'] !== 'Converted' &&
        lead.values['Status'] !== 'Deleted'
      ) {
        leads.push({
          _id: lead['id'],
          name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
          lastContact: moment(lead.values['Last Contact']).format('L LT'),
          attentionRequired: lead.values['Is New Reply Received'],
        });
      }
    });
    return leads;
  }

  getDay(date) {
    if (!date) {
      return undefined;
    }
    return moment(date, date_format).date();
  }

  getMonth(date) {
    if (!date) {
      return undefined;
    }
    return moment(date, date_format)
      .format('MMM')
      .toUpperCase();
  }
  setBulkLeadIds() {
    let ids = [];

    $('.skipLead :checked').each((idx, elem) => ids.push($(elem).prop('id')));
    this.setState({ bulkSkipIds: ids });
  }
  render() {
    let tasks = this.state.tasks;
    let memberTasks = this.state.memberTasksData;
    let allLeads = this.state.allLeads;
    let filters = this.state.filters;

    if (this.state.attentionRequiredOnly) {
      tasks = tasks.filter(row => {
        return row.attentionRequired === 'true' ? true : false;
      });
      memberTasks = memberTasks.filter(row => {
        return row.attentionRequired === 'true' ? true : false;
      });
      allLeads = allLeads.filter(row => {
        return row.attentionRequired === 'true' ? true : false;
      });
    }

    if (filters.length > 0) {
      let filteredLeads = matchesLeadFilter(this.props.allLeads, filters);

      tasks = tasks.filter(row => {
        return filteredLeads.findIndex(lead => row._id === lead.id) !== -1
          ? true
          : false;
      });
      allLeads = allLeads.filter(row => {
        return filteredLeads.findIndex(lead => row._id === lead.id) !== -1
          ? true
          : false;
      });
    }

    if (this.state.leadSearchValue) {
      tasks = tasks.filter(row => {
        return (
          row.name
            .toUpperCase()
            .includes(this.state.leadSearchValue.toUpperCase()) ||
          (row.note !== undefined
            ? row.note
                .toUpperCase()
                .includes(this.state.leadSearchValue.toUpperCase())
            : false)
        );
      });
      memberTasks = memberTasks.filter(row => {
        return (
          row.name
            .toUpperCase()
            .includes(this.state.leadSearchValue.toUpperCase()) ||
          (row.note !== undefined
            ? row.note
                .toUpperCase()
                .includes(this.state.leadSearchValue.toUpperCase())
            : false)
        );
      });
      allLeads = allLeads.filter(row => {
        return row.name
          .toUpperCase()
          .includes(this.state.leadSearchValue.toUpperCase());
      });
    }
    return (
      <div>
        <div className="headerPanel">
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label htmlFor="allTasks">Show Tasks</label>
                <select
                  id="allTasks"
                  className="form-control showTasks"
                  value={this.state.showTasksSelectValue}
                  onChange={e => this.onShowTasksSelectChange(e)}
                >
                  <option value="Todays Tasks">Today's Tasks</option>
                  <option value="This Weeks Tasks">This Week's Tasks</option>
                  <option value="This Months Tasks">This Month's Tasks</option>
                  <option value="All Tasks">All Tasks</option>
                </select>
              </div>
            </div>
            <div className="col filters">
              <div className="form-group">
                <label htmlFor="leadLists">Lead List Filters</label>
                <select
                  id="leadLists"
                  className="form-control showTasks"
                  onChange={e => this.onShowTasksSelectLeadsListChange(e)}
                >
                  <option value=""></option>
                  {this.leadLists.map(item => (
                    <option key={item.name} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <input
                  type="text"
                  className="form-control leadSearch"
                  id="leadSearch"
                  value={this.state.leadSearchValue}
                  placeholder="Lead/Member Search"
                  onChange={e => {
                    this.setState({ leadSearchValue: e.target.value });
                  }}
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <button
                  id="attentionRequiredOnly"
                  type="button"
                  className={
                    this.state.attentionRequiredOnly
                      ? 'attentionRequiredOnly Active'
                      : 'attentionRequiredOnly'
                  }
                  onClick={e => {
                    this.setState({
                      attentionRequiredOnly: this.state.attentionRequiredOnly
                        ? false
                        : true,
                    });
                  }}
                >
                  <SVGInline
                    svg={attentionRequired}
                    className={'attention icon'}
                  />
                  Show Attention Required
                </button>
              </div>
            </div>
            <div className="col">
              <div className="form-group"></div>
            </div>
          </div>
        </div>
        <div className="row">
          <div className="pageHeader">
            <h3>Lead Tasks</h3>
            <span className="bulkSkipButton">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={e => {
                  $('.bulkSkipButton button').attr(
                    'active',
                    this.state.bulkSkip,
                  );
                  this.setState({ bulkSkip: !this.state.bulkSkip });
                }}
              >
                {this.state.bulkSkip ? 'Disable Bulk Skip' : 'Enable Bulk Skip'}
              </button>
              {this.state.bulkSkip && (
                <div className="selectBulkSkip">
                  <button
                    type="button"
                    active="false"
                    className="btn btn-primary"
                    onClick={e => {
                      if (!this.state.selectAll) {
                        $('.skipLead input').prop('checked', true);
                      } else {
                        $('.skipLead input').prop('checked', false);
                      }
                      this.setState({ selectAll: !this.state.selectAll });
                      this.setBulkLeadIds();
                    }}
                  >
                    {!this.state.selectAll ? 'Select All' : 'Unselect All'}
                  </button>
                  <span
                    className="selectBulkSkip"
                    onClick={async e => {
                      this.props.setBulkSkipIds(this.state.bulkSkipIds);
                    }}
                  >
                    <NavLink
                      to="/FollowUp/bulkSkip"
                      state={{ leadIDs: this.state.bulkSkipIds }}
                      className="btn btn-primary"
                    >
                      Skip
                    </NavLink>
                  </span>
                </div>
              )}
            </span>
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
        {/*        <div className="leadContents">
          <LeadsDetail
            allLeads={allLeads}
            fullLeads={this.props.allLeads}
            leadSearchValue={this.state.leadSearchValue}
          />
        </div> */}
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
    let leadSearchValue = this.props.leadSearchValue;
    this.state = {
      leads,
      fullLeads: this.props.fullLeads,
      nameSortOrder,
      lastContactSortOrder,
      leadSearchValue,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads !== undefined && nextProps.allLeads !== null) {
      this.setState({
        leads: this.getData(nextProps.allLeads),
        fullLeads: this.props.fullLeads,
      });
    }
  }

  getData(allLeads) {
    /*    let leads = [];
    allLeads.forEach(lead => {
       if (lead.values['Status'] === 'Open') {
        leads.push({
          _id: lead['id'],
          name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
          lastContact: moment(lead.values['Last Contact']).format('L LT'),
        });
      }
    });
*/
    return allLeads;
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
            className={
              (row.original.isNewReplyReceived === 'true'
                ? 'newReplyReceived '
                : '') + 'leadDetailAnchor'
            }
          >
            <SVGInline
              svg={attentionRequired}
              className={
                row.original.attentionRequired === 'true'
                  ? 'attention icon'
                  : 'attention icon hide'
              }
            />
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
    this.state.fullLeads.forEach(lead => {
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
          lead.values['Phone Number'] +
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
    let leads = this.state.leads;
    if (this.state.leadSearchValue) {
      leads = leads.filter(row => {
        return row.name
          .toUpperCase()
          .includes(this.state.leadSearchValue.toUpperCase());
      });
    }
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
          </div>
        </div>
        <div id="leadsListGrid1" className="row" style={{ marginTop: '20px' }}>
          <ReactTable
            columns={this._columns}
            data={leads}
            defaultPageSize={leads.length}
            pageSize={leads.length}
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

  UNSAFE_componentWillReceiveProps(nextProps) {
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
          obj => obj['Date Created'] === createdDate.format('L'),
        );
        if (objFound) {
          objFound['Leads Created'] = objFound['Leads Created'] + 1;
        } else {
          data.push({
            date: createdDate,
            'Date Created': createdDate.format('L'),
            'Leads Created': 1,
          });
        }
      }
    });
    return data.sort(this.compare);
  }
  compare(a, b) {
    if (moment(a['date']).isAfter(b['date'])) return 1;
    if (moment(a['date']).isBefore(b['date'])) return -1;
    return 0;
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
  let x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  if (x === cx) {
    x = x + 40;
    cx = cx + 40;
  } else {
    x > cx ? (x = x - 29) : (x = x + 30);
  }
  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
    >
      {`${name} ${(percent * 100).toFixed(0)}%`}
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
    let data = this.getData(
      this.props.allLeads,
      this.props.allMembers,
      'last_30_days',
    );
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

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.allLeads && nextProps.allMembers) {
      this.setState({
        data: this.getData(
          nextProps.allLeads,
          nextProps.allMembers,
          this.state.dateRange,
        ),
      });
    }
  }

  getData(allLeads, allMembers, dateRange) {
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
        let objFound = leadsByType.find(
          obj => obj['name'] === lead.values['Source'],
        );
        if (objFound) {
          objFound['value'] = objFound['value'] + 1;
        } else {
          leadsByType.push({
            name: lead.values['Source'],
            value: 1,
            key: lead.values['Source'],
            leadsConverted: 0,
          });
        }
      }
    });
    allMembers.forEach(member => {
      let createdDate = moment(member.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate) &&
        member.values['Lead Submission ID'] !== undefined
      ) {
        totalLeads++;
        leadsConverted++;
        let objFound = leadsByType.find(
          obj => obj['name'] === member.values['Lead Source'],
        );
        if (objFound) {
          objFound['value'] = objFound['value'] + 1;
          if (member.values['Lead Submission ID']) {
            objFound['leadsConverted'] = objFound['leadsConverted'] + 1;
          }
        } else {
          leadsByType.push({
            name: member.values['Lead Source'],
            value: 1,
            key: member.values['Lead Source'],
            leadsConverted: member.values['Lead Submission ID'] ? 1 : 0,
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

  handleDateChange() {
    var value = $('#' + this.id)
      .children('.DayPickerInput')
      .find('input')
      .val();
    console.log('Date value:' + value.trim());
    var dateValue = value.trim() === '' ? '' : formatDateValue(value);
    if (value.trim() !== '' && dateValue === 'Invalid Date') return;
    if (value.trim() === '') dateValue = '';

    if (this.fieldName === 'fromDate') {
      this.leadsThis.setState({
        fromDate:
          moment(dateValue)
            .hour(12)
            .format('YYYY-MM-DDTHH:mm:ss') + 'Z',
      });
    }
    if (this.fieldName === 'toDate') {
      this.leadsThis.setState({
        toDate:
          moment(dateValue)
            .hour(12)
            .format('YYYY-MM-DDTHH:mm:ss') + 'Z',
      });
    }
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
        data: this.getData(
          this.props.allLeads,
          this.props.allMembers,
          event.target.value,
        ),
      });
    }
  }

  handleSubmit() {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        data: this.getData(
          this.props.allLeads,
          this.props.allMembers,
          this.state.dateRange,
        ),
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
                    midAngle={400}
                    fill="#8884d8"
                  >
                    {data.map((entry, index) => (
                      <Cell
                        fill={COLORS[index % COLORS.length]}
                        key={index}
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
                  {this.state.totalLeads} LEAD(S)
                </span>
                <br />
                <span className="convertedTo">CONVERTED TO</span>
                <br />
                <span style={{ color: 'black', fontWeight: 'bold' }}>
                  {this.state.leadsConverted} STUDENT(S)
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
                    <span id="fromDate" className="form-control input-sm">
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
                        onDayPickerHide={this.handleDateChange}
                        leadsThis={this}
                        fieldName="fromDate"
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </span>
                  </div>
                  <div className="form-group col-xs-2 mr-1">
                    <label htmlFor="toDate" className="control-label">
                      To Date
                    </label>
                    <span id="toDate" className="form-control input-sm">
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
                        onDayPickerHide={this.handleDateChange}
                        leadsThis={this}
                        fieldName="toDate"
                        dayPickerProps={{
                          locale: getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                          localeUtils: MomentLocaleUtils,
                        }}
                      />
                    </span>
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

  UNSAFE_componentWillReceiveProps(nextProps) {
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

  UNSAFE_componentWillReceiveProps(nextProps) {
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
          obj => obj['date'] === createdDate.format('L'),
        );
        if (
          !objFound &&
          (lead.values['Source Reference 1'] ||
            lead.values['Source Reference 2'] ||
            lead.values['Source Reference 3'])
        ) {
          objFound = { date: createdDate.format('L') };
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

export const LeadsView = ({
  allLeads,
  saveLead,
  fetchLeads,
  allMembers,
  profile,
  space,
  leadLists,
  memberNotesLoaded,
  leadsLoading,
  setBulkSkipIds,
}) => (
  <div className="container-fluid leads">
    <StatusMessagesContainer />
    <div className="row">
      <div className="taskContents">
        {!memberNotesLoaded && <span>....Loading Lead and Member Tasks</span>}
        {memberNotesLoaded && (
          <TasksDetail
            allLeads={allLeads}
            saveLead={saveLead}
            allMembers={allMembers}
            leadLists={leadLists}
            setBulkSkipIds={setBulkSkipIds}
          />
        )}
      </div>
    </div>
    <div>
      <LeadsCreatedChart allLeads={allLeads} />
    </div>
    <div>
      <LeadsConversionChart
        allLeads={allLeads}
        allMembers={allMembers}
        profile={profile}
        space={space}
      />
    </div>
    {getAttributeValue(space, 'Franchisor') !== 'YES' && (
      <div>
        <SourceReference3Chart allLeads={allLeads} />
      </div>
    )}
  </div>
);
function tick(mythis) {
  console.log('Ticking ...' + mythis);
  mythis.props.fetchLeads({
    leadLastFetchTime: mythis.props.leadLastFetchTime,
  });
  mythis.props.fetchMembers({
    membersNextPageToken: mythis.props.membersNextPageToken,
    memberInitialLoadComplete: mythis.props.memberInitialLoadComplete,
    memberLastFetchTime: mythis.props.memberLastFetchTime,
  });
}
export const LeadsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
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
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      this.props.fetchLeads({
        leadLastFetchTime: this.props.leadLastFetchTime,
      });
      if (!this.props.memberNotesLoaded && !this.props.membersLoading) {
        this.props.fetchMembers({
          membersNextPageToken: this.props.membersNextPageToken,
          memberInitialLoadComplete: this.props.memberInitialLoadComplete,
          memberLastFetchTime: this.props.memberLastFetchTime,
          loadMemberNotes: true,
        });
      }
      //      let timer = setInterval(tick, 60 * 1000 * 2, this); // refresh every 2 minutes
      //      this.setState({ timer: timer });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (!nextProps.memberNotesLoaded && !nextProps.membersLoading) {
        this.props.fetchMembers({
          membersNextPageToken: nextProps.membersNextPageToken,
          memberInitialLoadComplete: nextProps.memberInitialLoadComplete,
          memberLastFetchTime: nextProps.memberLastFetchTime,
          loadMemberNotes: true,
        });
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('leads');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {
      //      clearInterval(this.state.timer);
    },
  }),
)(LeadsView);

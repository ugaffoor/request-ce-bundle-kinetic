import React, { Component } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import { actions as classActions } from '../../redux/modules/classes';

const chartLabels = {
  this_week: 'This Week',
  last_week: 'Last Week',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_year: 'Last Year',
  custom: 'Custom Dates',
};

export class AttendancePerDay extends Component {
  handleClose = () => {
    this.setState({
      isShowCustom: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    let fromDate = this.props.fromDate;
    let toDate = this.props.toDate;
    let attendances = this.props.attendancesByDate;
    let data = this.getData(attendances, this.props.allMembers);
    this.attendanceOnClick = this.attendanceOnClick.bind(this);
    this.renderAttendancesCustomizedLabel = this.renderAttendancesCustomizedLabel.bind(
      this,
    );
    this.classInfo = this.classInfo.bind(this);
    this._getMemberColumns = this.getMemberColumns();
    this.classColumns = [
      { Header: 'Class Time', accessor: 'classTime' },
      {
        Header: 'Program',
        accessor: 'program',
        width: 400,
        Cell: props => {
          return (
            <span>
              {props.original['program']}
              {props.original['title'] !== ''
                ? '-' + props.original['title']
                : ''}
            </span>
          );
        },
      },
    ];
    this.membersColumns = [
      {
        Header: 'Name',
        accessor: 'memberID',
        Cell: this.renderNameCell,
        Footer: info => {
          return (
            <span>
              <strong>Total: {info.data.length}</strong>
            </span>
          );
        },
      },
    ];

    this.state = {
      data: data,
      dateRange: 'this_week',
      fromDate: fromDate,
      toDate: toDate,
      chartLabel: 'This Week',
      showAttendances: false,
      attendanceClasses: [],
      expandedRows: [],
      classSchedules: [],
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.classSchedules) {
      this.classSchedules = nextProps.classSchedules;
    }
    if (nextProps.attendancesByDate) {
      this.setState({
        data: this.getData(nextProps.attendancesByDate, this.props.allMembers),
      });
    }
    if (nextProps.allMembers.length !== this.props.allMembers.length) {
      this.setState({
        data: this.getData(nextProps.attendancesByDate, nextProps.allMembers),
      });
    }
    if (
      nextProps.fromDate !== this.state.fromDate ||
      nextProps.toDate !== this.state.toDate
    ) {
      this.setState({
        fromDate: nextProps.fromDate,
        toDate: nextProps.toDate,
      });
      this.props.fetchAttendancesByDate({
        fromDate: nextProps.fromDate,
        toDate: nextProps.toDate,
      });
    }
  }
  componentWillMount() {
    this.props.fetchAttendancesByDate({
      fromDate: this.state.fromDate,
      toDate: this.state.toDate,
    });
    this.props.fetchClassSchedules();
  }
  getProgramBackgroundColor(program) {
    if (program === 'GB1') {
      return '#4472c4';
    } else if (program === 'GB2') {
      return '#7030a0';
    } else if (program === 'GB3') {
      return 'black';
    } else if (program === 'Tiny Champions') {
      return '#bdd7ee';
    } else if (program === 'Little Champions 1') {
      return '#ffc001';
    } else if (program === 'Little Champions 2') {
      return '#ed7d32';
    } else if (program === 'Juniors') {
      return '#a9d18d';
    } else if (program === 'Teens') {
      return '#70ad46';
    } else if (program === 'Advanced Kids') {
      return '#48d1cc';
    } else if (program === 'Kids Competition Team') {
      return '#D0021B';
    } else {
      return 'white';
    }
  }
  getClassBackgroundColor(classInfo, classSchedules) {
    var schedule = classSchedules.find(schedule => {
      return (
        schedule.program === classInfo.program &&
        moment(schedule.start).day() ===
          moment(classInfo.classDate, 'YYYY-MM-DD').day() &&
        moment(schedule.start).format('HH:mm') === classInfo.classTime
      );
    });
    return schedule !== undefined && schedule.colour !== undefined
      ? schedule.colour
      : this.getProgramBackgroundColor(classInfo.program);
  }
  getClassColor(classInfo, classSchedules) {
    var schedule = classSchedules.find(
      schedule =>
        schedule.program === classInfo.program &&
        moment(schedule.start).day() ===
          moment(classInfo.classDate, 'ddd Do MMM').day() &&
        moment(schedule.start).format('LT') === classInfo.classTime,
    );
    return schedule !== undefined && schedule.textColour !== undefined
      ? schedule.textColour
      : 'white';
  }
  classInfo(state, rowInfo, column) {
    if (rowInfo === undefined) {
      return {};
    }
    return {
      style: {
        background: this.getClassBackgroundColor(
          rowInfo.original,
          this.classSchedules,
        ),
        color: this.getClassColor(rowInfo.original, this.classSchedules),
      },
    };
  }
  getData(attendances, allMembers) {
    if (!attendances || attendances.size <= 0) {
      return [];
    }

    let attendanceByType = new Map();

    attendances.forEach(attendance => {
      var type = '';
      switch (attendance.values['Ranking Program']) {
        case 'GB1':
          type = 'Adult';
          break;
        case 'GB2':
          type = 'Adult';
          break;
        case 'GB3':
          type = 'Adult';
          break;
        default:
          type = 'Kids';
      }
      var dayAttendances =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? []
          : attendanceByType.get(attendance.values['Class Date'])[
              'attendances'
            ];
      dayAttendances.push({
        attendanceStatus: attendance.values['Attendance Status'],
        class: attendance.values['Class'],
        classDate: attendance.values['Class Date'],
        classTime: attendance.values['Class Time'],
        memberGUID: attendance.values['Member GUID'],
        memberID: attendance.values['Member ID'],
        program: attendance.values['Ranking Program'],
        belt: attendance.values['Ranking Belt'],
      });
      var members =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? []
          : attendanceByType.get(attendance.values['Class Date'])['members'];
      var member = allMembers.find(
        member => member.id === attendance.values['Member GUID'],
      );
      if (member !== undefined) {
        members[members.length] = {
          id: member.id,
          name: member.values['First Name'] + ' ' + member.values['Last Name'],
        };
      }
      var adultCount =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? 0
          : attendanceByType.get(attendance.values['Class Date'])['adults'];
      var kidCount =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? 0
          : attendanceByType.get(attendance.values['Class Date'])['kids'];
      if (type === 'Adult') {
        adultCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])['adults'];
      }
      if (type === 'Kids') {
        kidCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])['kids'];
      }
      attendanceByType.set(attendance.values['Class Date'], {
        date: attendance.values['Class Date'],
        adults: adultCount,
        kids: kidCount,
        members: members,
        attendances: dayAttendances,
      });
    });

    let attendancesValues = [];
    attendanceByType.forEach(attendanceInfo => {
      attendancesValues.push({
        date: attendanceInfo.date,
        adults: attendanceInfo.adults,
        kids: attendanceInfo.kids,
        members: attendanceInfo.members,
        attendances: attendanceInfo.attendances,
      });
    });

    return attendancesValues;
  }
  renderAttendancesCustomizedLabel = props => {
    const { x, y, width, height, value } = props;
    const offset = 20;

    return (
      <g>
        <text
          x={x + width / 2}
          y={y + offset}
          fill="#fff"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {value}
        </text>
      </g>
    );
  };

  xAxisTickFormatter(date) {
    return moment(date).format('ddd');
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(label) {
    return 'Date: ' + label;
  }
  attendanceOnClick(e) {
    console.log(e.attendances.length);
    this.setState({
      attendances: e.attendances,
      showAttendances: true,
      attendanceClasses: this.getAttendanceTableData(
        e.attendances,
        this.props.allMembers,
        this.props.classSchedules,
      ),
    });
  }
  renderNameCell(cellInfo) {
    return (
      <NavLink
        to={`/Member/${cellInfo.original.memberGUID}`}
        className="nameValue"
      >
        {cellInfo.original.name}
      </NavLink>
    );
  }
  getMembers(members, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 4) {
      //if (i % (col-1) === 0){
      members_col[members_col.length] = {
        memberId: members[i].id,
        name: members[i].name,
      };
      //}
    }
    return members_col;
  }
  matchesSchedule(schedule, attendanceProgram) {
    if (schedule.allowedPrograms === undefined) return false;
    let programs = JSON.parse(schedule.allowedPrograms);
    let idx = programs.findIndex(
      element => element.value === attendanceProgram,
    );
    if (idx !== -1) return true;
    else return false;
  }
  getClassSchedule(classSchedules, attendance) {
    let classSchedule = classSchedules.find(schedule => {
      return (
        moment(schedule.start).day() ===
          moment(attendance.classDate, 'YYYY-MM-DD').day() &&
        moment(schedule.start).format('HH:mm') === attendance.classTime &&
        this.matchesSchedule(schedule, attendance.program)
      );
    });
    return classSchedule !== undefined ? classSchedule : undefined;
  }
  getAttendanceTableData(attendances, allMembers, classSchedules) {
    if (!attendances || attendances.length < 0) {
      return [];
    }

    let classesDataMap = new Map();
    attendances.forEach(attendance => {
      var classSchedule = this.getClassSchedule(classSchedules, attendance);
      var key =
        attendance.classTime +
        '-' +
        (classSchedule !== undefined
          ? classSchedule.program
          : attendance.program);
      var membersArr = [];
      var member = allMembers.find(
        member => member.values['Member ID'] === attendance.memberID,
      );
      if (classesDataMap.get(key) === undefined) {
        membersArr[0] = {
          memberGUID: attendance.memberGUID,
          memberID: attendance.memberID,
          name:
            member !== undefined
              ? member.values['First Name'] + ' ' + member.values['Last Name']
              : attendance.memberID,
        };
        classesDataMap.set(key, {
          sortVal: key,
          classDate: attendance.classDate,
          classTime: attendance.classTime,
          program:
            classSchedule !== undefined
              ? classSchedule.program
              : attendance.program,
          title: classSchedule !== undefined ? classSchedule.title : '',
          members: membersArr,
        });
      } else {
        membersArr = classesDataMap.get(key).members;
        membersArr[membersArr.length] = {
          memberGUID: attendance.memberGUID,
          memberID: attendance.memberID,
          name:
            member !== undefined
              ? member.values['First Name'] + ' ' + member.values['Last Name']
              : attendance.memberID,
        };
        classesDataMap.set(key, {
          sortVal: key,
          classDate: attendance.classDate,
          classTime: attendance.classTime,
          program:
            classSchedule !== undefined
              ? classSchedule.program
              : attendance.program,
          title: classSchedule !== undefined ? classSchedule.title : '',
          members: membersArr,
        });
      }
    });
    let classesData = [];
    classesDataMap.forEach((value, key, map) => {
      classesData.push({
        classDate: value.classDate,
        classTime: value.classTime,
        program: value.program,
        title: value.title,
        members: value.members,
      });
    });
    classesData = classesData.sort(function(a, b) {
      return a['sortVal'] > b['sortVal']
        ? 1
        : b['sortVal'] > a['sortVal']
        ? -1
        : 0;
    });

    return classesData;
  }

  getMemberColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col3['memberId']}`}
              className=""
            >
              {props.original.members_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col4['memberId']}`}
              className=""
            >
              {props.original.members_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  render() {
    const { data } = this.state;
    return this.props.fetchingAttendancesByDate ? (
      <div className="attendancesLoading">
        <p>Loading Attendances ...</p>
      </div>
    ) : (
      <span>
        <div className="page-header attendancePerDay">
          <span className="header">
            <span className="label">Attendances</span>
          </span>
        </div>
        {this.state.showAttendances && (
          <div className="memberChartDetails">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showAttendances: false,
                  expandedRows: [],
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.classColumns}
              data={this.state.attendanceClasses}
              defaultPageSize={
                this.state.attendanceClasses.length > 0
                  ? this.state.attendanceClasses.length
                  : 2
              }
              pageSize={
                this.state.attendanceClasses.length > 0
                  ? this.state.attendanceClasses.length
                  : 2
              }
              showPagination={false}
              expanded={this.state.expandedRows}
              getTrProps={this.classInfo}
              onExpandedChange={(newExpanded, index) => {
                this.setState(oldState => {
                  const itemIndex = index[0];
                  const isExpanded = oldState.expandedRows[itemIndex];
                  const expandedList = [...this.state.expandedRows];
                  expandedList[itemIndex] = !isExpanded;
                  return {
                    expandedRows: expandedList,
                  };
                });
              }}
              ref={ref => (this.attendancesGridref = ref)}
              SubComponent={row => {
                return (
                  <ReactTable
                    data={row.original.members}
                    columns={this.membersColumns}
                    TheadComponent={() => null}
                    defaultPageSize={
                      row.original.members.length > 0
                        ? row.original.members.length
                        : 2
                    }
                    pageSize={
                      row.original.members.length > 0
                        ? row.original.members.length
                        : 2
                    }
                    showPagination={false}
                  />
                );
              }}
            />
          </div>
        )}
        {!this.state.showAttendances && (
          <div className="attendancesByDate">
            <ResponsiveContainer minHeight={370}>
              <BarChart
                width={600}
                height={370}
                data={data}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tickFormatter={this.xAxisTickFormatter} />
                <YAxis tickFormatter={this.yAxisTickFormatter} />
                <Tooltip
                  labelFormatter={this.toolTipLabelFormatter}
                  formatter={this.toolTipFormatter}
                />
                <Legend content={this.renderCusomizedLegend} />
                <Bar
                  dataKey="adults"
                  fill="#0070c0"
                  style={{ cursor: 'pointer' }}
                  onClick={this.attendanceOnClick}
                >
                  <LabelList
                    dataKey="adults"
                    content={this.renderAttendancesCustomizedLabel}
                  />
                </Bar>
                <Bar
                  dataKey="kids"
                  fill="#92d050"
                  style={{ cursor: 'pointer' }}
                  onClick={this.attendanceOnClick}
                >
                  <LabelList
                    dataKey="kids"
                    content={this.renderAttendancesCustomizedLabel}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </span>
    );
  }
}

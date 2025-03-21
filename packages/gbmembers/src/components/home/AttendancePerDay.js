import React, { Component } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceArea,
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
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

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

    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    let fromDate = moment(new Date(this.props.fromDate));
    let toDate = moment(new Date(this.props.toDate));
    let attendances = this.props.attendancesByDate;
    let data = this.getData(attendances, this.props.allMembers, false);
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
      refAreaLeft: '',
      refAreaRight: '',
      left: 'dataMin',
      right: 'dataMax',
      dateRange: 'this_week',
      fromDate: fromDate,
      toDate: toDate,
      chartLabel: 'This Week',
      showAttendances: false,
      attendanceClasses: [],
      expandedRows: [],
      classSchedules: [],
      isBarraFIT: false,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.classSchedules !== this.props.classSchedules) {
      this.classSchedules = nextProps.classSchedules;
      var isBarraFIT = false;
      this.classSchedules.forEach((schedule, i) => {
        if (schedule.program === 'BarraFIT') {
          isBarraFIT = true;
        }
      });

      this.setState({
        isBarraFIT: isBarraFIT,
      });
    }
    if (nextProps.attendancesByDate !== this.props.attendancesByDate) {
      this.setState({
        data: this.getData(
          nextProps.attendancesByDate,
          this.props.allMembers,
          this.state.isBarraFIT,
        ),
      });
    }
    if (nextProps.allMembers.length !== this.props.allMembers.length) {
      this.setState({
        data: this.getData(
          nextProps.attendancesByDate,
          nextProps.allMembers,
          this.state.isBarraFIT,
        ),
      });
    }
    if (
      nextProps.fromDate !== this.props.fromDate ||
      nextProps.toDate !== this.props.toDate
    ) {
      this.setState({
        fromDate: moment(new Date(nextProps.fromDate)),
        toDate: moment(new Date(nextProps.toDate)),
      });
      this.props.fetchAttendancesByDate({
        fromDate: nextProps.fromDate,
        toDate: nextProps.toDate,
      });
    }
  }
  componentDidMount() {
    this.props.fetchAttendancesByDate({
      fromDate: this.state.fromDate,
      toDate: this.state.toDate,
    });
    if (this.props.classSchedules.size === 0) {
      this.props.fetchClassSchedules();
    } else {
      this.classSchedules = this.props.classSchedules;
    }
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
        schedule.title === classInfo.title &&
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
        schedule.title === classInfo.title &&
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
  getData(attendances, allMembers, isBarraFIT) {
    if (!attendances || attendances.size <= 0) {
      return [];
    }

    let attendanceByType = new Map();

    attendances.forEach(attendance => {
      var type = '';

      if (isBarraFIT) {
        switch (attendance.values['Ranking Program']) {
          case 'GB1':
            type = 'Jiu Jitsu';
            break;
          case 'GB2':
            type = 'Jiu Jitsu';
            break;
          case 'GB3':
            type = 'Jiu Jitsu';
            break;
          case 'GBF':
            type = 'Jiu Jitsu';
            break;
          case 'BarraFIT':
            type = 'BarraFIT';
            break;
          default:
            type = 'Jiu Jitsu';
        }
      } else {
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
          case 'GBF':
            type = 'Adult';
            break;
          default:
            type = 'Kids';
        }
      }
      var dayAttendances =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? []
          : attendanceByType.get(attendance.values['Class Date'])[
              'attendances'
            ];
      dayAttendances.push({
        attendanceStatus: attendance.values['Attendance Status'],
        title: attendance.values['Title'],
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
      var jiuJitsuCount =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? 0
          : attendanceByType.get(attendance.values['Class Date'])['jiujitsu'];
      var kidCount =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? 0
          : attendanceByType.get(attendance.values['Class Date'])['kids'];
      var barraFITCount =
        attendanceByType.get(attendance.values['Class Date']) === undefined
          ? 0
          : attendanceByType.get(attendance.values['Class Date'])['barraFIT'];
      if (type === 'Adult') {
        adultCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])['adults'];
      }
      if (type === 'Jiu Jitsu') {
        jiuJitsuCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])[
                'jiujitsu'
              ];
      }
      if (type === 'Kids') {
        kidCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])['kids'];
      }
      if (type === 'BarraFIT') {
        barraFITCount =
          attendanceByType.get(attendance.values['Class Date']) === undefined
            ? 1
            : ++attendanceByType.get(attendance.values['Class Date'])[
                'barraFIT'
              ];
      }
      attendanceByType.set(attendance.values['Class Date'], {
        date: attendance.values['Class Date'],
        adults: adultCount,
        jiujitsu: jiuJitsuCount,
        kids: kidCount,
        barraFIT: barraFITCount,
        members: members,
        attendances: dayAttendances,
      });
    });

    let attendancesValues = [];
    attendanceByType.forEach(attendanceInfo => {
      attendancesValues.push({
        date: attendanceInfo.date,
        adults: attendanceInfo.adults,
        jiujitsu: attendanceInfo.jiujitsu,
        kids: attendanceInfo.kids,
        barraFIT: attendanceInfo.barraFIT,
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
    return 'Date: ' + moment(label).format('L');
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
        (schedule.title === undefined ||
          schedule.title === '' ||
          schedule.title === attendance.title) &&
        schedule.program === attendance.class
      );
    });
    if (classSchedule === undefined) {
      classSchedule = classSchedules.find(schedule => {
        return (
          moment(schedule.start).day() ===
            moment(attendance.classDate, 'YYYY-MM-DD').day() &&
          moment(schedule.start).format('HH:mm') === attendance.classTime &&
          this.matchesSchedule(schedule, attendance.class)
        );
      });
    }
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
          ? classSchedule.program + classSchedule.title
          : attendance.program);
      var membersArr = [];
      var member = allMembers.find(
        member => member.id === attendance.memberGUID,
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
        sortVal: key,
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
  zoom() {
    let { refAreaLeft, refAreaRight } = this.state;
    const { data } = this.state;

    if (refAreaLeft === refAreaRight || refAreaRight === '') {
      this.setState(() => ({
        refAreaLeft: '',
        refAreaRight: '',
      }));
      return;
    }

    // xAxis domain
    if (refAreaLeft > refAreaRight)
      [refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft];

    this.setState(() => ({
      refAreaLeft: '',
      refAreaRight: '',
      data: data.slice(
        data.findIndex(item => item['date'] === refAreaLeft),
        data.findIndex(item => item['date'] === refAreaRight) + 1,
      ),
      left: refAreaLeft,
      right: refAreaRight,
    }));
  }
  zoomOut() {
    const { data } = this.state;
    this.setState(() => ({
      data: this.getData(
        this.props.attendancesByDate,
        this.props.allMembers,
        this.state.isBarraFIT,
      ),
      refAreaLeft: '',
      refAreaRight: '',
      left: 'dataMin',
      right: 'dataMax',
    }));
  }
  render() {
    const { data, refAreaLeft, refAreaRight, left, right } = this.state;
    return this.props.fetchingAttendancesByDate ? (
      <div className="attendancesLoading">
        <p>Loading Attendances ...</p>
      </div>
    ) : (
      <span>
        <div className="page-header attendancePerDay">
          <span className="header">
            <span className="label">
              Attendances {this.state.fromDate.format('L')} to{' '}
              {this.state.toDate.format('L')}
            </span>
            <button
              type="button"
              className="btn zoom"
              onClick={this.zoomOut.bind(this)}
            >
              Zoom Out
            </button>
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
                onMouseDown={e => this.setState({ refAreaLeft: e.activeLabel })}
                onMouseMove={e =>
                  this.state.refAreaLeft &&
                  this.setState({ refAreaRight: e.activeLabel })
                }
                // eslint-disable-next-line react/jsx-no-bind
                onMouseUp={this.zoom.bind(this)}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tickFormatter={this.xAxisTickFormatter}
                  domain={[left, right]}
                />
                <YAxis yAxisId="1" tickFormatter={this.yAxisTickFormatter} />
                <Tooltip
                  labelFormatter={this.toolTipLabelFormatter}
                  formatter={this.toolTipFormatter}
                />
                <Legend content={this.renderCusomizedLegend} />
                <Bar
                  yAxisId="1"
                  dataKey={this.state.isBarraFIT ? 'jiujitsu' : 'adults'}
                  fill="#0070c0"
                  style={{ cursor: 'pointer' }}
                  onClick={this.attendanceOnClick}
                >
                  <LabelList content={this.renderAttendancesCustomizedLabel} />
                </Bar>
                <Bar
                  yAxisId="1"
                  dataKey={this.state.isBarraFIT ? 'barraFIT' : 'kids'}
                  fill="#92d050"
                  style={{ cursor: 'pointer' }}
                  onClick={this.attendanceOnClick}
                >
                  <LabelList content={this.renderAttendancesCustomizedLabel} />
                </Bar>
                {refAreaLeft && refAreaRight ? (
                  <ReferenceArea
                    yAxisId="1"
                    x1={refAreaLeft}
                    x2={refAreaRight}
                    strokeOpacity={0.3}
                  />
                ) : null}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </span>
    );
  }
}

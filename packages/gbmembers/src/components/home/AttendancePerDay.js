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
    this.membersOnClick = this.membersOnClick.bind(this);
    this.renderAttendancesCustomizedLabel = this.renderAttendancesCustomizedLabel.bind(
      this,
    );
    this._getMemberColumns = this.getMemberColumns();

    this.state = {
      data: data,
      dateRange: 'this_week',
      fromDate: fromDate,
      toDate: toDate,
      chartLabel: 'This Week',
      showMembers: false,
    };
  }
  componentWillReceiveProps(nextProps) {
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
      });
    });

    let attendancesValues = [];
    attendanceByType.forEach(attendanceInfo => {
      attendancesValues.push({
        date: attendanceInfo.date,
        adults: attendanceInfo.adults,
        kids: attendanceInfo.kids,
        members: attendanceInfo.members,
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
  membersOnClick(e) {
    console.log(e.members.length);
    this.setState({
      members: e.members,
      showMembers: true,
    });
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

  getMemberTableData(members) {
    let members_col1 = this.getMembers(members, 1);
    let members_col2 = this.getMembers(members, 2);
    let members_col3 = this.getMembers(members, 3);
    let members_col4 = this.getMembers(members, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
        },
      },
    ];
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
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: 'Members',
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;
          let members_col3 = props.value.members_col3;
          let members_col4 = props.value.members_col4;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
              members_col3:
                members_col3.length > i ? members_col3[i] : undefined,
              members_col4:
                members_col4.length > i ? members_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getMemberColumns}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
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
        {this.state.showMembers && (
          <div className="memberChartDetails">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showMembers: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getMemberTableData(this.state.members)}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {!this.state.showMembers && (
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
                  onClick={this.membersOnClick}
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
                  onClick={this.membersOnClick}
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

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
    let data = this.getData(attendances);

    this.renderAttendancesCustomizedLabel = this.renderAttendancesCustomizedLabel.bind(
      this,
    );

    this.state = {
      data: data,
      dateRange: 'this_week',
      fromDate: fromDate,
      toDate: toDate,
      chartLabel: 'This Week',
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.attendancesByDate) {
      this.setState({
        data: this.getData(nextProps.attendancesByDate),
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

  getData(attendances) {
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
      });
    });

    let attendancesValues = [];
    attendanceByType.forEach(attendanceInfo => {
      attendancesValues.push({
        date: attendanceInfo.date,
        adults: attendanceInfo.adults,
        kids: attendanceInfo.kids,
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
              <Bar dataKey="adults" fill="#0070c0">
                <LabelList
                  dataKey="adults"
                  content={this.renderAttendancesCustomizedLabel}
                />
              </Bar>
              <Bar dataKey="kids" fill="#92d050">
                <LabelList
                  dataKey="kids"
                  content={this.renderAttendancesCustomizedLabel}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </span>
    );
  }
}

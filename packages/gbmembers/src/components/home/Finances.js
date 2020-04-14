import React, { Component } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from 'recharts';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';

export class Finances extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(props.monthlyStatistics);

    this.CustomizedDot = this.CustomizedDot.bind(this);

    this.state = {
      data: data,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.monthlyStatistics) {
      this.setState({
        data: this.getData(nextProps.monthlyStatistics),
      });
    }
  }
  componentWillMount() {
    this.props.fetchMonthlyStatistics();
  }

  getData(statistics) {
    if (!statistics || statistics.size <= 0) {
      return [];
    }

    let statisticValues = [];

    statistics.forEach(statistic => {
      statisticValues.push({
        date: statistic.values['Year'] + '-' + statistic.values['Month'],
        memberCount:
          statistic.values['All Member Count'] !== null
            ? statistic.values['All Member Count']
            : '',
        activeMemberCount:
          statistic.values['Active Member Count'] !== null
            ? statistic.values['Active Member Count']
            : '',
        inactiveMemberCount:
          statistic.values['Inactive Member Count'] !== null
            ? statistic.values['Inactive Member Count']
            : '',
        frozenMemberCount:
          statistic.values['Frozen Member Count'] !== null
            ? statistic.values['Frozen Member Count']
            : '',
        billingMemberCount:
          statistic.values['Billing Member Count'] !== null
            ? statistic.values['Billing Member Count']
            : '',
        nonBillingMemberCount:
          statistic.values['Non Billing Member Count'] !== null
            ? statistic.values['Non Billing Member Count']
            : '',
        Income: statistic.values['Monthly Revenue'],
        averagePricePerStudent:
          statistic.values['Average Price Per Student'] !== null
            ? Number(statistic.values['Average Price Per Student']).toFixed(2)
            : '',
      });
    });

    statisticValues.sort(function(a, b) {
      if (a['date'] < b['date']) {
        return -1;
      } else if (a['date'] > b['date']) {
        return 1;
      }
      return 0;
    });
    return statisticValues;
  }
  CustomizedDot = props => {
    const { cx, cy, stroke, payload, value } = props;
    return (
      <text
        x={cx - 10}
        y={cy - 10}
        fill="gray"
        textAnchor={'start'}
        dominantBaseline="central"
      >
        {`$${parseInt(value).toLocaleString()}`}
      </text>
    );
  };
  xAxisTickFormatter(date) {
    return moment(date).format('MMM');
  }
  yAxisTickFormatter(amount) {
    return '$' + amount.toLocaleString();
  }

  financeToolTipFormatter(value, name, payload) {
    return (
      <span className="tooltipDetail">
        <span className="tooltipLabel">Total Population:</span>
        <span className="tooltipValue">{payload.payload.memberCount}</span>
        <span className="tooltipLabel">Active Students:</span>
        <span className="tooltipValue">
          {payload.payload.activeMemberCount}
        </span>
        <span className="tooltipLabel">APS:</span>
        <span className="tooltipValue">
          {payload.payload.averagePricePerStudent !== ''
            ? '$' + payload.payload.averagePricePerStudent.toLocaleString()
            : ''}
        </span>
        <span className="tooltipLabel">Frozen:</span>
        <span className="tooltipValue">
          {payload.payload.frozenMemberCount}
        </span>
        <span className="tooltipLabel">Non Paying:</span>
        <span className="tooltipValue">
          {payload.payload.nonBillingMemberCount}
        </span>
      </span>
    );
  }

  financeToolTipLabelFormatter(label) {
    return (
      <span className="tooltipHeader">{moment(label).format('MMM YYYY')}</span>
    );
  }

  render() {
    const { data } = this.state;
    return this.props.fetchingMonthlyStatistics ? (
      <div className="financesLoading">
        <p>Loading Finances ...</p>
      </div>
    ) : (
      <span>
        <div className="page-header">Finances</div>
        <div className="finances">
          <ResponsiveContainer minHeight={370}>
            <LineChart
              width={600}
              height={370}
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={this.xAxisTickFormatter}
                padding={{ left: 30, right: 30 }}
              />
              <YAxis
                tickFormatter={this.yAxisTickFormatter}
                padding={{ top: 30 }}
              />
              <Tooltip
                labelFormatter={this.financeToolTipLabelFormatter}
                formatter={this.financeToolTipFormatter}
              />
              <Legend />
              <Line
                dataKey="Income"
                stroke="darkorange"
                fill="darkorange"
                dot={<this.CustomizedDot />}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </span>
    );
  }
}

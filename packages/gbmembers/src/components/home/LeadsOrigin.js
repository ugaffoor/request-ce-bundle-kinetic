import React, { Component } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import $ from 'jquery';

const chartLabels = {
  last_30_days: 'Last 30 Days',
  last_month: 'Last Month',
  last_3_months: 'Last 3 Months',
  last_6_months: 'Last 6 Months',
  last_year: 'Last Year',
  custom: 'Custom Dates',
};
const RADIAN = Math.PI / 180;
const COLORS = [
  '#5a9ad5',
  '#70ad46',
  '#264478',
  '#8cc167',
  '#4472c4',
  '#ed7d32',
  '#a5a5a5',
  '#ffc001',
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

export class LeadsOriginChart extends Component {
  handleClose = () => {
    this.setState({
      isShowingModal: false,
      dateRange: this.state.lastDateRange,
    });
  };
  constructor(props) {
    super(props);
    let fromDate = this.props.fromDate;
    let toDate = this.props.toDate;
    let leads = this.props.leadsByDate;
    this.state = {
      fromDate: fromDate,
      toDate: toDate,
    };

    let data = this.getData(leads);

    this.renderLeadsOriginCustomizedLabel = this.renderLeadsOriginCustomizedLabel.bind(
      this,
    );

    this.state = {
      data: data,
      fromDate: fromDate,
      toDate: toDate,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.leadsByDate) {
      this.setState({
        data: this.getData(nextProps.leadsByDate),
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
      this.setState({
        data: this.getData(nextProps.leadsByDate),
      });
    }
  }
  componentWillMount() {
    this.setState({
      data: this.getData(this.state.leadsByDate),
    });
  }

  getData(leads, dateRange) {
    if (!leads || leads.length <= 0) {
      return [];
    }

    let leadsByType = [];

    let fromDate = moment(this.state.fromDate, 'YYYY-MM-DD');
    let toDate = moment(this.state.toDate, 'YYYY-MM-DD');

    leads.forEach(lead => {
      let createdDate = moment(lead.createdAt, 'YYYY-MM-DDTHH:mm:ssZ');
      if (
        createdDate.isSameOrAfter(fromDate) &&
        createdDate.isSameOrBefore(toDate)
      ) {
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
          });
        }
      }
    });
    return leadsByType;
  }
  renderLeadsOriginCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    name,
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

  render() {
    const { data } = this.state;
    return this.props.leadsByDateLoading ? (
      <div style={{ margin: '10px' }}>
        <p>Loading Leads Origins ...</p>
        <ReactSpinner />{' '}
      </div>
    ) : (
      <span>
        <div className="page-header leadsOrigin">
          <span className="header">
            <span className="label">Leads Conversion</span>
          </span>
        </div>
        <ResponsiveContainer minHeight={370}>
          <PieChart maxWidth={600} height={370}>
            <Pie
              data={data}
              nameKey="name"
              dataKey="value"
              cx={'50%'}
              label={this.renderLeadsOriginCustomizedLabel}
              labelLine={false}
              outerRadius={120}
              fill="#8884d8"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell fill={COLORS[index % COLORS.length]} key={entry.key} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

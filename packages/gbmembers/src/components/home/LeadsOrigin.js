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
    let fromDate = moment().subtract(30, 'days');
    let toDate = moment();
    let leads = this.props.leadsByDate;
    let data = this.getData(leads, 'last_30_days');

    this.renderLeadsOriginCustomizedLabel = this.renderLeadsOriginCustomizedLabel.bind(
      this,
    );
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      data: data,
      leadType: 'All Types',
      dateRange: 'last_30_days',
      fromDate: fromDate,
      toDate: toDate,
      chartLabel: 'Last 30 Days',
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.leadsByDate) {
      this.setState({
        data: this.getData(nextProps.leadsByDate, this.state.dateRange),
      });
    }
  }

  getData(leads, dateRange) {
    if (!leads || leads.length <= 0) {
      return [];
    }

    let leadsByType = [];
    let fromDate = null;
    let toDate = null;

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

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if (event.target.name === 'dateRange') {
      this.setState({
        chartLabel: chartLabels[event.target.value],
      });
    }
    if (event.target.name === 'dateRange' && event.target.value === 'custom') {
      this.setState({
        isShowingModal: true,
        lastDateRange: this.state.dateRange,
      });
    }
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      this.setState({
        data: this.getData(this.props.leadsByDate, event.target.value),
      });
    }
  }

  handleSubmit() {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.setState({
        data: this.getData(this.props.leadsByDate, this.state.dateRange),
        isShowingModal: false,
        chartLabel:
          moment(this.state.fromDate, 'YYYY-MM-DD').format('DD/MM/YYYY') +
          '-' +
          moment(this.state.toDate, 'YYYY-MM-DD').format('DD/MM/YYYY'),
      });
    }
  }

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
            <span className="label">
              Leads Conversion - {this.state.chartLabel}
            </span>
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
          </span>
        </div>
        {this.state.isShowingModal && (
          <div className="customDatesContainer" onClose={this.handleClose}>
            <div className="leadsOriginDiv" onClose={this.handleClose}>
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
                      onClick={e => this.handleClose()}
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="form-group col-xs-2">
                    <label className="control-label">&nbsp;</label>
                    <button
                      className="btn btn-primary form-control input-sm"
                      onClick={e => this.handleSubmit()}
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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

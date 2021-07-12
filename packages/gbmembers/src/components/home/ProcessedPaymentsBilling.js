import React, { Component } from 'react';
import moment from 'moment';
import _ from 'lodash';
import ReactSpinner from 'react16-spinjs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export class ProcessedPaymentsBillingChart extends Component {
  constructor(props) {
    super(props);
    this.billingPayments = this.props.billingPayments;
    this.getBillingPayments = this.props.getBillingPayments;
    this.billingPaymentsLoading = this.props.billingPaymentsLoading;

    let data = this.getData(this.billingPayments);
    let currentPreviousBtnLable = 'Click For Last Month Data';
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);
    let total = this.getTotalAmount(data);
    let chartHeader = this.getChartHeader('current_month');

    this.state = {
      data,
      total,
      currentPreviousBtnLable,
      chartHeader,
    };

    //this.getBillingPayments('current_month');
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    //console.log(" billing chart data = " + util.inspect(nextProps));
    if (nextProps.billingPaymentsLoading) {
      this.billingPaymentsLoading = nextProps.billingPaymentsLoading;
      this.setState({
        billingPaymentsLoading: nextProps.billingPaymentsLoading,
      });
    }

    if (nextProps.billingPayments) {
      this.billingPayments = nextProps.billingPayments;
      this.setState({
        data: this.getData(nextProps.billingPayments),
        total: this.getTotalAmount(this.getData(nextProps.billingPayments)),
      });
    }
  }
  UNSAFE_componentWillMount() {
    this.props.getBillingPayments('current_month');
  }
  getData(billingPayments) {
    let totalAmt = 0;
    const data = billingPayments.map(payment => {
      totalAmt += Number(payment.paymentAmount);
      return {
        Amount: Number(payment.paymentAmount),
        DebitDate: moment(payment.debitDate, ezidebit_date_format).format(
          'YYYY-MM-DD',
        ),
      };
    });

    var result = _.chain(data)
      .groupBy('DebitDate')
      .map((group, DebitDate) => ({
        DebitDate,
        Amount: _.sumBy(group, 'Amount'),
      }))
      .value();

    return result.sort(this.compare);
  }

  getTotalAmount(data) {
    let amt = 0;
    data.forEach(payment => {
      amt += payment.Amount;
    });
    return amt;
  }

  compare(a, b) {
    if (moment(a['DebitDate']).isAfter(b['DebitDate'])) return 1;
    if (moment(a['DebitDate']).isBefore(b['DebitDate'])) return -1;
    return 0;
  }

  getChartHeader(month) {
    if (month === 'current_month') {
      let start = moment.utc().startOf('month');
      let firstDay = start.date();
      let month = start.format('MMMM');
      let lastDay = moment.utc().date();
      return (
        'Billing Data: ' +
        firstDay +
        ' ' +
        month +
        ' - ' +
        lastDay +
        ' ' +
        month
      );
    } else if (month === 'previous_month') {
      let start = moment
        .utc()
        .subtract(2, 'months')
        .startOf('month');
      let firstDay = start.date();
      let month = start.format('MMMM');
      let lastDay = moment
        .utc()
        .subtract(2, 'months')
        .endOf('month')
        .date();
      return (
        'Billing Data: ' +
        firstDay +
        ' ' +
        month +
        ' - ' +
        lastDay +
        ' ' +
        month
      );
    }
  }

  showBillingChart() {
    if (this.state.currentPreviousBtnLable === 'Click For Last Month Data') {
      this.getBillingPayments('previous_month');
      this.setState({
        currentPreviousBtnLable: 'Click For Current Month Data',
        chartHeader: this.getChartHeader('previous_month'),
      });
    } else if (
      this.state.currentPreviousBtnLable === 'Click For Current Month Data'
    ) {
      this.getBillingPayments('current_month');
      this.setState({
        currentPreviousBtnLable: 'Click For Last Month Data',
        chartHeader: this.getChartHeader('current_month'),
      });
    }
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
        {/*<li className="recharts-legend-item legend-item-0" style={{display: 'inline-block', marginRight: '10px'}}>
          <svg className="recharts-surface" viewBox="0 0 32 32" version="1.1" style={{display: 'inline-block', verticalAlign: 'middle', marginRight: '4px', width: '14px', height: '14px'}}>
            <path stroke="none" fill="#8884d8" d="M0,4h32v24h-32z" className="recharts-legend-icon"></path>
          </svg>
          <span className="recharts-legend-item-text">Current Month Billing</span>
        </li>*/}
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          >
            <path
              stroke="none"
              fill="#8884d8"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Billing Total: ${this.state.total}
          </span>
        </li>
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          >
            <path
              stroke="none"
              fill="#8884d8"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            <a href="javascript:;" onClick={() => this.showBillingChart()}>
              {this.state.currentPreviousBtnLable}
            </a>
          </span>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(Amount) {
    return '$' + Amount;
  }

  xAxisTickFormatter(DebitDate) {
    //return debitDate.substr(debitDate.length - 2);
    return DebitDate;
  }

  render() {
    const { data, total } = this.state;
    return this.props.billingPaymentsLoading ? (
      <div style={{ height: '50vh', width: '50vw' }}>
        <p>Loading Processed Payments Billing Chart ...</p>
        <ReactSpinner />
      </div>
    ) : (
      <span>
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <br />
          <h6>{this.state.chartHeader}</h6>
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
              dataKey="DebitDate"
              tickFormatter={this.xAxisTickFormatter}
            />
            {/*<YAxis label={({ viewBox }) => <AxisLabel axisType='yAxis' {...viewBox}>Amount</AxisLabel>} tickFormatter={this.xAxisTickFormatter}/>*/}
            <YAxis tickFormatter={this.yAxisTickFormatter} />
            <Tooltip />
            <Legend content={this.renderCusomizedLegend} />
            <Bar dataKey="Amount" fill="#8884d8" /> {/*label*/}
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

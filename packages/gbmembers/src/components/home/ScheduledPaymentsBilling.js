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

export class ScheduledPaymentsBillingChart extends Component {
  constructor(props) {
    super(props);
    this.getProcessedAndScheduledPayments = this.props.getProcessedAndScheduledPayments;
    this.processedAndScheduledPayments = this.props.processedAndScheduledPayments;
    this.processedAndScheduledPaymentsLoading = this.props.processedAndScheduledPaymentsLoading;

    let data = this.getData(this.processedAndScheduledPayments);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);
    let total = this.getTotalAmount(data);

    this.state = {
      data,
      total,
    };

    //this.getProcessedAndScheduledPayments();
  }

  componentWillReceiveProps(nextProps) {
    //console.log(" billing chart data = " + util.inspect(nextProps));
    if (nextProps.processedAndScheduledPayments) {
      this.processedAndScheduledPayments =
        nextProps.processedAndScheduledPayments;
      this.setState({
        data: this.getData(nextProps.processedAndScheduledPayments),
        total: this.getTotalAmount(
          this.getData(nextProps.processedAndScheduledPayments),
        ),
      });
    }
  }

  componentWillMount() {}

  getData(allPayments) {
    if (
      !allPayments ||
      (!allPayments.processedPayments && !allPayments.scheduledPayments)
    ) {
      return [];
    }
    let payments = [];
    if (allPayments.processedPayments) {
      payments = allPayments.processedPayments.map(payment => {
        return {
          Amount: Number(payment.scheduledAmount),
          PaymentDate: moment(payment.debitDate, ezidebit_date_format).format(
            'YYYY-MM-DD',
          ),
        };
      });
    }

    let scheduledPayments = [];
    if (allPayments.scheduledPayments) {
      scheduledPayments = allPayments.scheduledPayments.map(payment => {
        return {
          Amount: Number(payment.paymentAmount),
          PaymentDate: moment(payment.paymentDate, ezidebit_date_format).format(
            'YYYY-MM-DD',
          ),
        };
      });
    }

    payments.push(...scheduledPayments);

    var result = _.chain(payments)
      .groupBy('PaymentDate')
      .map((group, PaymentDate) => ({
        PaymentDate,
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
    if (moment(a['PaymentDate']).isAfter(b['PaymentDate'])) return 1;
    if (moment(a['PaymentDate']).isBefore(b['PaymentDate'])) return -1;
    return 0;
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
      </ul>
    );
  }

  yAxisTickFormatter(amount) {
    return '$' + amount;
  }

  xAxisTickFormatter(paymentDate) {
    //return debitDate.substr(debitDate.length - 2);
    return paymentDate;
  }

  render() {
    const { data, total } = this.state;
    return this.props.processedAndScheduledPaymentsLoading ? (
      <div style={{ height: '50vh', width: '50vw' }}>
        <p>Loading Scheduled Payments Billing Chart ...</p>
        <ReactSpinner />
      </div>
    ) : (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Estimated Billing For Current Month</h6>
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
              dataKey="PaymentDate"
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

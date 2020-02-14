import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactSpinner from 'react16-spinjs';
import 'bootstrap/scss/bootstrap.scss';
import _ from 'lodash';
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
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { Utils } from 'common';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  billingPayments: state.member.members.billingPayments,
  billingPaymentsLoading: state.member.members.billingPaymentsLoading,
  processedAndScheduledPayments:
    state.member.members.processedAndScheduledPayments,
  processedAndScheduledPaymentsLoading:
    state.member.members.processedAndScheduledPaymentsLoading,
  paymentHistory: state.member.members.paymentHistory,
  paymentHistoryLoading: state.member.members.paymentHistoryLoading,
  billingCompany: state.member.app.billingCompany,
  variationCustomers: state.member.members.variationCustomers,
  variationCustomersLoading: state.member.members.variationCustomersLoading,
  programs: state.member.app.programs,
  inactiveCustomersCount: state.member.members.inactiveCustomersCount,
  inactiveCustomersLoading: state.member.members.inactiveCustomersLoading,
  profile: state.member.app.profile,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
  fetchBillingPayments: actions.fetchBillingPayments,
  setBillingPayments: actions.setBillingPayments,
  fetchProcessedAndScheduledPayments:
    actions.fetchProcessedAndScheduledPayments,
  setProcessedAndScheduledPayments: actions.setProcessedAndScheduledPayments,
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchVariationCustomers: actions.fetchVariationCustomers,
  setVariationCustomers: actions.setVariationCustomers,
  fetchInactiveCustomersCount: actions.fetchInactiveCustomersCount,
  setInactiveCustomersCount: actions.setInactiveCustomersCount,
};

const ezidebit_date_format = 'YYYY-MM-DD HH:mm:ss';

export const HomeView = ({
  memberItem,
  allMembers,
  billingPayments,
  getBillingPayments,
  billingPaymentsLoading,
  getProcessedAndScheduledPayments,
  processedAndScheduledPayments,
  processedAndScheduledPaymentsLoading,
  reloadCharts,
  paymentHistory,
  paymentHistoryLoading,
  getFailedPayments,
  billingCompany,
  variationCustomers,
  variationCustomersLoading,
  getVariationCustomers,
  programs,
  getInactiveCustomersCount,
  inactiveCustomersCount,
  inactiveCustomersLoading,
  profile,
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    <div className="buttons row" style={{ marginLeft: '10px' }}>
      <div className="col-xs-3">
        <button
          type="button"
          id="reloadCharts"
          className={'btn btn-primary'}
          style={{ borderRadius: '0', marginRight: '5px' }}
          onClick={e =>
            reloadCharts(
              profile,
              getBillingPayments,
              getProcessedAndScheduledPayments,
              getFailedPayments,
              getVariationCustomers,
              getInactiveCustomersCount,
            )
          }
        >
          Reload Dashboard
        </button>
      </div>
    </div>
    <div className="chart1">
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <ProcessedPaymentsBillingChart
          billingPayments={billingPayments}
          getBillingPayments={getBillingPayments}
          billingPaymentsLoading={billingPaymentsLoading}
        />
      )}
    </div>
    {billingCompany !== 'PaySmart' &&
      (!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <div className="chart2">
          <ScheduledPaymentsBillingChart
            processedAndScheduledPayments={processedAndScheduledPayments}
            getProcessedAndScheduledPayments={getProcessedAndScheduledPayments}
            processedAndScheduledPaymentsLoading={
              processedAndScheduledPaymentsLoading
            }
          />
        </div>
      ))}
    <div className="chart3">
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <InactiveCustomersChart
          inactiveCustomersCount={inactiveCustomersCount}
          getInactiveCustomersCount={getInactiveCustomersCount}
          inactiveCustomersLoading={inactiveCustomersLoading}
        />
      )}
    </div>
    <div className="chart4">
      <DemographicChart allMembers={allMembers} />
    </div>
    <div className="chart5">
      <ProgramsChart allMembers={allMembers} programs={programs} />
    </div>
    <div className="chart6">
      <KidsChart allMembers={allMembers} />
    </div>
    <div>
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <PaymentHistory
          paymentHistory={paymentHistory}
          paymentHistoryLoading={paymentHistoryLoading}
        />
      )}
    </div>
    <div>
      {!Utils.isMemberOf(profile, 'Billing') ? (
        <div />
      ) : (
        <VariationCustomers
          variationCustomers={variationCustomers}
          variationCustomersLoading={variationCustomersLoading}
        />
      )}
    </div>
  </div>
);

export const HomeContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withHandlers({
    getBillingPayments: ({
      memberItem,
      fetchBillingPayments,
      setBillingPayments,
      addNotification,
      setSystemError,
    }) => month => {
      let startDate, endDate;
      if (month === 'current_month') {
        startDate = moment
          .utc()
          .startOf('month')
          .format('YYYY-MM-DD');
        endDate = moment.utc().format('YYYY-MM-DD');
      } else if (month === 'previous_month') {
        startDate = moment
          .utc()
          .subtract(1, 'months')
          .startOf('month')
          .format('YYYY-MM-DD');
        endDate = moment
          .utc()
          .subtract(1, 'months')
          .endOf('month')
          .format('YYYY-MM-DD');
      }
      fetchBillingPayments({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: startDate,
        dateTo: endDate,
        setBillingPayments: setBillingPayments,
        internalPaymentType: 'client_successful',
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    getProcessedAndScheduledPayments: ({
      fetchProcessedAndScheduledPayments,
      setProcessedAndScheduledPayments,
      billingCompany,
      addNotification,
      setSystemError,
    }) => () => {
      if (billingCompany === 'PaySmart') {
        return;
      }
      let startDate = moment
        .utc()
        .startOf('month')
        .format('YYYY-MM-DD');
      let endDate = moment
        .utc()
        .endOf('month')
        .format('YYYY-MM-DD');

      fetchProcessedAndScheduledPayments({
        paymentType: 'SUCCESSFUL',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: startDate,
        dateTo: endDate,
        setProcessedAndScheduledPayments: setProcessedAndScheduledPayments,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    reloadCharts: () => (
      profile,
      getBillingPayments,
      getProcessedAndScheduledPayments,
      getFailedPayments,
      getVariationCustomers,
      getInactiveCustomersCount,
    ) => {
      if (Utils.isMemberOf(profile, 'Billing')) {
        getBillingPayments('current_month');
        getProcessedAndScheduledPayments();
        getFailedPayments();
        getVariationCustomers();
        getInactiveCustomersCount();
      }
      {
        console.log('Not a billing user');
      }
    },
    getFailedPayments: ({
      fetchPaymentHistory,
      setPaymentHistory,
      addNotification,
      setSystemError,
    }) => () => {
      fetchPaymentHistory({
        paymentType: 'FAILED',
        paymentMethod: 'ALL',
        paymentSource: 'ALL',
        dateField: 'PAYMENT',
        dateFrom: moment()
          .subtract(1, 'week')
          .format('YYYY-MM-DD'),
        dateTo: moment().format('YYYY-MM-DD'),
        setPaymentHistory: setPaymentHistory,
        internalPaymentType: 'client_failed',
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    getVariationCustomers: ({
      fetchVariationCustomers,
      setVariationCustomers,
      addNotification,
      setSystemError,
    }) => () => {
      fetchVariationCustomers({
        setVariationCustomers: setVariationCustomers,
        setSystemError: setSystemError,
        addNotification: addNotification,
      });
    },
    getInactiveCustomersCount: ({
      fetchInactiveCustomersCount,
      setInactiveCustomersCount,
      addNotification,
      setSystemError,
    }) => (dateRange, fromDate, toDate) => {
      if (!dateRange) {
        dateRange = 'last_30_days';
      }

      if (dateRange === 'last_30_days') {
        fromDate = moment()
          .subtract(30, 'days')
          .format('DD-MM-YYYY');
        toDate = moment().format('DD-MM-YYYY');
      } else if (dateRange === 'last_month') {
        fromDate = moment()
          .subtract(1, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_3_months') {
        fromDate = moment()
          .subtract(3, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_6_months') {
        fromDate = moment()
          .subtract(6, 'months')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'last_year') {
        fromDate = moment()
          .subtract(1, 'years')
          .startOf('month')
          .format('DD-MM-YYYY');
        toDate = moment()
          .subtract(1, 'months')
          .endOf('month')
          .format('DD-MM-YYYY');
      } else if (dateRange === 'custom') {
        fromDate = moment(fromDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
        toDate = moment(toDate, 'YYYY-MM-DD').format('DD-MM-YYYY');
      }

      fetchInactiveCustomersCount({
        fromDate: fromDate,
        toDate: toDate,
        setInactiveCustomersCount: setInactiveCustomersCount,
        setSystemError: setSystemError,
        addNotification: addNotification,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      if (
        !this.props.billingPayments ||
        this.props.billingPayments.length <= 0
      ) {
        this.props.getBillingPayments('current_month');
      }
      if (
        !this.props.processedAndScheduledPayments ||
        $.isEmptyObject(this.props.processedAndScheduledPayments)
      ) {
        this.props.getProcessedAndScheduledPayments();
      }
      if (
        !this.props.paymentHistory ||
        $.isEmptyObject(this.props.paymentHistory)
      ) {
        this.props.getFailedPayments();
      }
      if (
        !this.props.variationCustomers ||
        this.props.variationCustomers.length <= 0
      ) {
        this.props.getVariationCustomers();
      }
      if (
        !this.props.inactiveCustomersCount ||
        this.props.inactiveCustomersCount.length <= 0
      ) {
        this.props.getInactiveCustomersCount();
      }
    },
    componentWillReceiveProps(nextProps) {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(HomeView);

export class DemographicChart extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;

    let data = this.getData(this.props.allMembers);
    let malePercent = this.getMalePercent(this.props.allMembers);
    let femalePercent = this.getFemalePercent(this.props.allMembers);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);

    this.state = {
      data,
      malePercent,
      femalePercent,
    };
  }

  componentWillReceiveProps(nextProps) {
    //console.log(" billing chart data = " + util.inspect(nextProps));
    if (nextProps.allMembers) {
      this.allMembers = nextProps.allMembers;
      this.setState({
        data: this.getData(nextProps.allMembers),
        malePercent: this.getMalePercent(nextProps.allMembers),
        femalePercent: this.getFemalePercent(nextProps.allMembers),
      });
    }
  }

  getData(allMembers) {
    if (!allMembers) {
      return [];
    }

    let demographicData = [];
    let totalMembers = allMembers.length;
    let maleTotal = 0,
      femaleTotal = 0;
    let m_age_less_than_6 = 0,
      m_age_7_12 = 0,
      m_age_13_17 = 0,
      m_age_18_24 = 0,
      m_age_25_34 = 0,
      m_age_35_44 = 0,
      m_age_45_54 = 0,
      m_age_55_plus = 0;
    let f_age_less_than_6 = 0,
      f_age_7_12 = 0,
      f_age_13_17 = 0,
      f_age_18_24 = 0,
      f_age_25_34 = 0,
      f_age_35_44 = 0,
      f_age_45_54 = 0,
      f_age_55_plus = 0;
    allMembers.forEach(member => {
      let gender = member.values['Gender'];
      let age = getAgeInYears(member.values['DOB']);
      if (gender === 'Male') {
        maleTotal++;
      } else if (gender === 'Female') {
        femaleTotal++;
      }

      if (age <= 6) {
        if (gender === 'Male') {
          m_age_less_than_6++;
        } else if (gender === 'Female') {
          f_age_less_than_6++;
        }
      }

      if (age >= 7 && age <= 12) {
        if (gender === 'Male') {
          m_age_7_12++;
        } else if (gender === 'Female') {
          f_age_7_12++;
        }
      }

      if (age >= 13 && age <= 17) {
        if (gender === 'Male') {
          m_age_13_17++;
        } else if (gender === 'Female') {
          f_age_13_17++;
        }
      }

      if (age >= 18 && age <= 24) {
        if (gender === 'Male') {
          m_age_18_24++;
        } else if (gender === 'Female') {
          f_age_18_24++;
        }
      }

      if (age >= 25 && age <= 34) {
        if (gender === 'Male') {
          m_age_25_34++;
        } else if (gender === 'Female') {
          f_age_25_34++;
        }
      }

      if (age >= 35 && age <= 44) {
        if (gender === 'Male') {
          m_age_35_44++;
        } else if (gender === 'Female') {
          f_age_35_44++;
        }
      }

      if (age >= 45 && age <= 54) {
        if (gender === 'Male') {
          m_age_45_54++;
        } else if (gender === 'Female') {
          f_age_45_54++;
        }
      }

      if (age >= 55) {
        if (gender === 'Male') {
          m_age_55_plus++;
        } else if (gender === 'Female') {
          f_age_55_plus++;
        }
      }
    });

    demographicData.push({
      ageGroup: '< 6',
      Male: getPercent(m_age_less_than_6, totalMembers),
      Female: getPercent(f_age_less_than_6, totalMembers),
    });
    demographicData.push({
      ageGroup: '7-12',
      Male: getPercent(m_age_7_12, totalMembers),
      Female: getPercent(f_age_7_12, totalMembers),
    });
    demographicData.push({
      ageGroup: '13-17',
      Male: getPercent(m_age_13_17, totalMembers),
      Female: getPercent(f_age_13_17, totalMembers),
    });
    demographicData.push({
      ageGroup: '18-24',
      Male: getPercent(m_age_18_24, totalMembers),
      Female: getPercent(f_age_18_24, totalMembers),
    });
    demographicData.push({
      ageGroup: '25-34',
      Male: getPercent(m_age_25_34, totalMembers),
      Female: getPercent(f_age_25_34, totalMembers),
    });
    demographicData.push({
      ageGroup: '35-44',
      Male: getPercent(m_age_35_44, totalMembers),
      Female: getPercent(f_age_35_44, totalMembers),
    });
    demographicData.push({
      ageGroup: '45-54',
      Male: getPercent(m_age_45_54, totalMembers),
      Female: getPercent(f_age_45_54, totalMembers),
    });
    demographicData.push({
      ageGroup: '55+',
      Male: getPercent(m_age_55_plus, totalMembers),
      Female: getPercent(f_age_55_plus, totalMembers),
    });

    return demographicData;
  }

  getMalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let maleTotal = 0;
    allMembers.forEach(member => {
      let gender = member.values['Gender'];
      if (gender === 'Male') {
        maleTotal++;
      }
    });

    return Math.round((maleTotal * 100) / allMembers.length);
  }

  getFemalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let femaleTotal = 0;
    allMembers.forEach(member => {
      let gender = member.values['Gender'];
      if (gender === 'Female') {
        femaleTotal++;
      }
    });

    return Math.round((femaleTotal * 100) / allMembers.length);
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
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
            Male {this.state.malePercent}%
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
              fill="#82ca9d"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Female {this.state.femalePercent}%
          </span>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(value) {
    return value + '%';
  }

  xAxisTickFormatter(ageGroup) {
    return ageGroup;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value + '%';
  }

  toolTipLabelFormatter(label) {
    return 'Age Group: ' + label;
  }

  render() {
    const { data, malePercent, femalePercent } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Demographics</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" tickFormatter={this.xAxisTickFormatter} />
            <YAxis tickFormatter={this.yAxisTickFormatter} />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend content={this.renderCusomizedLegend} />
            <Bar dataKey="Male" fill="#8884d8" />
            <Bar dataKey="Female" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export class ProgramsChart extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;
    let data = this.getData(this.props.allMembers, this.props.programs);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allMembers) {
      this.allMembers = nextProps.allMembers;
      this.setState({
        data: this.getData(nextProps.allMembers, nextProps.programs),
      });
    }
  }

  getData(allMembers, programs) {
    if (!allMembers || allMembers.size <= 0) {
      return [];
    }

    let data = [];
    programs.forEach(program => {
      data.push({ Program: program.program, 'Member Count': 0 });
    });

    allMembers.forEach(member => {
      let program = data.find(
        obj => obj['Program'] === member.values['Ranking Program'],
      );
      if (program) {
        program['Member Count'] = program['Member Count'] + 1;
      }
    });

    return data;
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
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
          <span className="recharts-legend-item-text">Programs</span>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(memberCount) {
    return memberCount;
  }

  xAxisTickFormatter(program) {
    return program;
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
          <h6>Programs</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Program" tickFormatter={this.xAxisTickFormatter} />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{
                value: 'Member Count',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend content={this.renderCusomizedLegend} />
            <Bar dataKey="Member Count" fill="#8884d8" stackId="a" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export class KidsChart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allMembers);
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allMembers) {
      this.setState({
        data: this.getData(nextProps.allMembers),
      });
    }
  }

  getData(allMembers) {
    if (!allMembers || allMembers.size <= 0) {
      return [];
    }

    let data = [];
    let totalMembers = allMembers.length;
    let m_tiny_champions = 0,
      m_lc1 = 0,
      m_lc2 = 0,
      m_juniors = 0,
      m_teens = 0;
    let f_tiny_champions = 0,
      f_lc1 = 0,
      f_lc2 = 0,
      f_juniors = 0,
      f_teens = 0;

    allMembers.forEach(member => {
      let gender = member.values['Gender'];
      let age = getAgeInYears(member.values['DOB']);

      if (age >= 3 && age <= 4) {
        if (gender === 'Male') {
          m_tiny_champions++;
        } else if (gender === 'Female') {
          f_tiny_champions++;
        }
      }

      if (age >= 4 && age <= 6) {
        if (gender === 'Male') {
          m_lc1++;
        } else if (gender === 'Female') {
          f_lc1++;
        }
      }

      if (age >= 7 && age <= 9) {
        if (gender === 'Male') {
          m_lc2++;
        } else if (gender === 'Female') {
          f_lc2++;
        }
      }

      if (age >= 10 && age <= 12) {
        if (gender === 'Male') {
          m_juniors++;
        } else if (gender === 'Female') {
          f_juniors++;
        }
      }

      if (age >= 13 && age <= 15) {
        if (gender === 'Male') {
          m_teens++;
        } else if (gender === 'Female') {
          f_teens++;
        }
      }
    });

    data.push({
      ageGroup: 'Tiny Champions (3-4 yrs)',
      Male: m_tiny_champions,
      Female: f_tiny_champions,
    });
    data.push({
      ageGroup: 'LC1 (4-6 yrs)',
      Male: m_lc1,
      Female: f_lc1,
    });
    data.push({
      ageGroup: 'LC2 (7-9 yrs)',
      Male: m_lc2,
      Female: f_lc2,
    });
    data.push({
      ageGroup: 'Juniors (10-12 yrs)',
      Male: m_juniors,
      Female: f_juniors,
    });
    data.push({
      ageGroup: 'Teens (13-15 yrs)',
      Male: m_teens,
      Female: f_teens,
    });

    return data;
  }

  yAxisTickFormatter(memberCount) {
    return memberCount;
  }

  xAxisTickFormatter(ageGroup) {
    return ageGroup;
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
          <h6>Kids</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <BarChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" tickFormatter={this.xAxisTickFormatter} />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{
                value: 'Member Count',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend />
            <Bar dataKey="Male" fill="#8884d8" />
            <Bar dataKey="Female" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export class InactiveCustomersChart extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.inactiveCustomersCount);
    this.showChart = this.showChart.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      data,
      dateRange: 'last_30_days',
      fromDate: '',
      toDate: '',
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.inactiveCustomersCount) {
      this.setState({
        data: this.getData(nextProps.inactiveCustomersCount),
      });
    }
  }

  componentWillMount() {}

  componentDidUpdate() {}

  getData(inactiveCustomersCount) {
    return inactiveCustomersCount;
  }

  showChart(dateRange, fromDate, toDate) {
    this.props.getInactiveCustomersCount(dateRange, fromDate, toDate);
  }

  handleInputChange(event) {
    this.setState({
      [event.target.name]: event.target.value,
    });
    if (event.target.name === 'dateRange' && event.target.value !== 'custom') {
      this.showChart(event.target.value, null, null);
    }
  }

  handleSubmit() {
    if (!this.state.fromDate || !this.state.toDate) {
      console.log('From and To dates are required');
      return;
    } else {
      this.showChart(
        this.state.dateRange,
        this.state.fromDate,
        this.state.toDate,
      );
    }
  }

  yAxisTickFormatter(memberCount) {
    return memberCount;
  }

  xAxisTickFormatter(date) {
    return date;
  }

  render() {
    const { data } = this.state;
    return this.props.inactiveCustomersLoading ? (
      <div style={{ height: '50vh', width: '50vw' }}>
        <p>Loading Inactive Customers Chart ...</p>
        <ReactSpinner />
      </div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <br />
          <h6>Inactive Customers</h6>
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
            <YAxis tickFormatter={this.yAxisTickFormatter} />
            <Tooltip />
            <Legend />
            <Bar dataKey="suspendedCount" fill="#8884d8" />
            <Bar dataKey="cancelledCount" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
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
  }
}

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

  componentWillReceiveProps(nextProps) {
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

  getData(billingPayments) {
    let totalAmt = 0;
    const data = billingPayments.map(payment => {
      totalAmt += Number(payment.scheduledAmount);
      return {
        Amount: Number(payment.scheduledAmount),
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
        .subtract(1, 'months')
        .startOf('month');
      let firstDay = start.date();
      let month = start.format('MMMM');
      let lastDay = moment
        .utc()
        .subtract(1, 'months')
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

function renderText(child, x, y, rotate, stroke, key) {
  if (child && child.content) {
    return (
      <text
        key={key}
        x={x}
        y={y}
        transform={`rotate(${rotate})`}
        textAnchor="middle"
        stroke={stroke}
        {...child.props}
      >
        {child.content}
      </text>
    );
  }

  return (
    <text
      key={key}
      x={x}
      y={y}
      transform={`rotate(${rotate})`}
      textAnchor="middle"
      stroke={stroke}
    >
      {child}
    </text>
  );
}

export default function AxisLabel({
  axisType,
  x,
  y,
  width,
  height,
  stroke,
  children,
}) {
  const isVert = axisType === 'yAxis';
  const cx = isVert ? x : x + width / 2;
  const cy = isVert ? height / 2 + y : y + height + 20;
  const rot = isVert ? `270 ${cx} ${cy}` : 0;
  const lineHeight = 20;

  if (children.length > 1 && children.map) {
    return (
      <g>
        {children.map((child, index) =>
          renderText(child, cx, cy + index * lineHeight, rot, stroke, index),
        )}
      </g>
    );
  }

  return renderText(children, cx, cy, rot, stroke);
}

AxisLabel.propTypes = {
  axisType: PropTypes.oneOf(['yAxis', 'xAxis']),
  x: PropTypes.number,
  y: PropTypes.number,
  width: PropTypes.number,
  height: PropTypes.number,
  stroke: PropTypes.string,
  children: PropTypes.any,
};

function getAgeInYears(dob) {
  let date = moment(dob, 'YYYY-MM-DD').toDate();
  return moment().diff(date, 'years');
}

function getPercent(members, totalMembers) {
  if (!members) {
    return 0;
  }
  return Math.round((members * 100) / totalMembers);
}

export class PaymentHistory extends Component {
  constructor(props) {
    super(props);
    this.paymentHistory = this.props.paymentHistory;
    let data = this.getData(this.paymentHistory);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.paymentHistory) {
      this.paymentHistory = nextProps.paymentHistory;
      this.setState({
        data: this.getData(nextProps.paymentHistory),
      });
    }
  }

  getData(payments) {
    const data = payments.map(payment => {
      return {
        _id: payment.paymentID,
        name: payment.firstName + ' ' + payment.lastName,
        scheduledAmount: payment.scheduledAmount,
        paymentAmount: payment.paymentAmount,
        paymentMethod: payment.paymentMethod,
        paymentStatus: payment.paymentStatus,
        transactionFee: payment.transactionFeeCustomer,
        debitDate: payment.debitDate,
      };
    });
    return data;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
      },
      {
        accessor: 'scheduledAmount',
        Header: 'Scheduled Amount',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'paymentAmount',
        Header: 'Payment Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'paymentMethod', Header: 'Payment Method' },
      { accessor: 'paymentStatus', Header: 'Payment Status' },
      {
        accessor: 'transactionFee',
        Header: 'Transaction Fee',
        Cell: props => '$' + props.value,
      },
      {
        accessor: 'debitDate',
        Header: 'Debit Date',
        Cell: props =>
          moment(props.value, ezidebit_date_format).format('YYYY-MM-DD'),
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.paymentHistoryLoading ? (
      <div>Loading Payment History ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Failed Payments - Last Week</h6>
        </div>
        <ReactTable
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
      </span>
    );
  }
}

export class VariationCustomers extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.variationCustomers);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.variationCustomers) {
      this.setState({
        data: this.getData(nextProps.variationCustomers),
      });
    }
  }

  getData(variationCustomers) {
    if (!variationCustomers || variationCustomers.length <= 0) {
      return [];
    }

    const data = variationCustomers.map(variationCustomer => {
      return {
        _id: variationCustomer.customerId,
        firstName: variationCustomer.firstName,
        lastName: variationCustomer.lastName,
        customerId: variationCustomer.customerId,
        variationAmount: variationCustomer.variationAmount,
        startDate: variationCustomer.startDate,
        resumeDate: variationCustomer.resumeDate,
      };
    });
    return data;
  }

  getColumns(data) {
    const columns = [
      { accessor: 'firstName', Header: 'First Name' },
      { accessor: 'lastName', Header: 'Last Name' },
      { accessor: 'customerId', Header: 'Customer Id' },
      {
        accessor: 'variationAmount',
        Header: 'Variation Amount',
        Cell: props => '$' + props.value,
      },
      { accessor: 'startDate', Header: 'Start Date' },
      { accessor: 'resumeDate', Header: 'Resume Date' },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return this.props.variationCustomersLoading ? (
      <div>Loading variations ...</div>
    ) : (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Variation Customers</h6>
        </div>
        <ReactTable
          columns={columns}
          data={data}
          className="-striped -highlight"
          defaultPageSize={data.length > 0 ? data.length : 2}
          pageSize={data.length > 0 ? data.length : 2}
          showPagination={false}
        />
        <br />
      </span>
    );
  }
}

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
} from 'recharts';
import moment from 'moment';

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
  componentWillMount() {}

  getData(allMembers) {
    if (!allMembers) {
      return [];
    }

    let demographicData = [];
    let totalMembers = 0;
    let maleTotal = 0,
      femaleTotal = 0;
    let m_age_less_than_6 = 0,
      m_age_7_9 = 0,
      m_age_10_12 = 0,
      m_age_13_15 = 0,
      m_age_16_17 = 0,
      m_age_18_29 = 0,
      m_age_30_35 = 0,
      m_age_36_40 = 0,
      m_age_41_45 = 0,
      m_age_46_50 = 0,
      m_age_51_plus = 0;
    let f_age_less_than_6 = 0,
      f_age_7_9 = 0,
      f_age_10_12 = 0,
      f_age_13_15 = 0,
      f_age_16_17 = 0,
      f_age_18_29 = 0,
      f_age_30_35 = 0,
      f_age_36_40 = 0,
      f_age_41_45 = 0,
      f_age_46_50 = 0,
      f_age_51_plus = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        totalMembers++;
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

        if (age >= 7 && age <= 9) {
          if (gender === 'Male') {
            m_age_7_9++;
          } else if (gender === 'Female') {
            f_age_7_9++;
          }
        }

        if (age >= 10 && age <= 12) {
          if (gender === 'Male') {
            m_age_10_12++;
          } else if (gender === 'Female') {
            f_age_10_12++;
          }
        }

        if (age >= 13 && age <= 15) {
          if (gender === 'Male') {
            m_age_13_15++;
          } else if (gender === 'Female') {
            f_age_13_15++;
          }
        }

        if (age >= 16 && age <= 17) {
          if (gender === 'Male') {
            m_age_16_17++;
          } else if (gender === 'Female') {
            f_age_16_17++;
          }
        }

        if (age >= 18 && age <= 29) {
          if (gender === 'Male') {
            m_age_18_29++;
          } else if (gender === 'Female') {
            f_age_18_29++;
          }
        }

        if (age >= 30 && age <= 35) {
          if (gender === 'Male') {
            m_age_30_35++;
          } else if (gender === 'Female') {
            f_age_30_35++;
          }
        }
        if (age >= 36 && age <= 40) {
          if (gender === 'Male') {
            m_age_36_40++;
          } else if (gender === 'Female') {
            f_age_36_40++;
          }
        }
        if (age >= 41 && age <= 45) {
          if (gender === 'Male') {
            m_age_41_45++;
          } else if (gender === 'Female') {
            f_age_41_45++;
          }
        }
        if (age >= 46 && age <= 50) {
          if (gender === 'Male') {
            m_age_46_50++;
          } else if (gender === 'Female') {
            f_age_46_50++;
          }
        }

        if (age >= 51) {
          if (gender === 'Male') {
            m_age_51_plus++;
          } else if (gender === 'Female') {
            f_age_51_plus++;
          }
        }
      }
    });

    demographicData.push({
      ageGroup: '< 6',
      Male: getPercent(m_age_less_than_6, totalMembers),
      Female: getPercent(f_age_less_than_6, totalMembers),
    });
    demographicData.push({
      ageGroup: '7-9',
      Male: getPercent(m_age_7_9, totalMembers),
      Female: getPercent(f_age_7_9, totalMembers),
    });
    demographicData.push({
      ageGroup: '10-12',
      Male: getPercent(m_age_10_12, totalMembers),
      Female: getPercent(f_age_10_12, totalMembers),
    });
    demographicData.push({
      ageGroup: '12-15',
      Male: getPercent(m_age_13_15, totalMembers),
      Female: getPercent(f_age_13_15, totalMembers),
    });
    demographicData.push({
      ageGroup: '16-17',
      Male: getPercent(m_age_16_17, totalMembers),
      Female: getPercent(f_age_16_17, totalMembers),
    });
    demographicData.push({
      ageGroup: '18-29',
      Male: getPercent(m_age_18_29, totalMembers),
      Female: getPercent(f_age_18_29, totalMembers),
    });
    demographicData.push({
      ageGroup: '30-35',
      Male: getPercent(m_age_30_35, totalMembers),
      Female: getPercent(f_age_30_35, totalMembers),
    });
    demographicData.push({
      ageGroup: '36-40',
      Male: getPercent(m_age_36_40, totalMembers),
      Female: getPercent(f_age_36_40, totalMembers),
    });
    demographicData.push({
      ageGroup: '41-45',
      Male: getPercent(m_age_41_45, totalMembers),
      Female: getPercent(f_age_41_45, totalMembers),
    });
    demographicData.push({
      ageGroup: '46-50',
      Male: getPercent(m_age_46_50, totalMembers),
      Female: getPercent(f_age_46_50, totalMembers),
    });
    demographicData.push({
      ageGroup: '51+',
      Male: getPercent(m_age_51_plus, totalMembers),
      Female: getPercent(f_age_51_plus, totalMembers),
    });

    return demographicData;
  }

  getMalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let maleTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Male') {
          maleTotal++;
        }
      }
    });

    //return Math.round((maleTotal * 100) / allMembers.length);
    return maleTotal;
  }

  getFemalePercent(allMembers) {
    if (!allMembers || allMembers.length <= 0) {
      return 0;
    }
    let femaleTotal = 0;
    allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        let gender = member.values['Gender'];
        if (gender === 'Female') {
          femaleTotal++;
        }
      }
    });

    //  return Math.round((femaleTotal * 100) / allMembers.length);
    return femaleTotal;
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
              fill="#4472c4"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Male {this.state.malePercent}
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
              fill="#ff99cc"
              d="M0,4h32v24h-32z"
              className="recharts-legend-icon"
            />
          </svg>
          <span className="recharts-legend-item-text">
            Female {this.state.femalePercent}
          </span>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(value) {
    return value + '';
  }

  xAxisTickFormatter(ageGroup) {
    return ageGroup;
  }

  toolTipFormatter(value, name, payload) {
    return payload.value + '';
  }

  toolTipLabelFormatter(label) {
    return 'Age Group: ' + label;
  }

  render() {
    const { data, malePercent, femalePercent } = this.state;
    return (
      <span>
        <div className="page-header"> Demographics</div>
        <ResponsiveContainer minHeight={370}>
          <BarChart
            width={600}
            height={370}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            isAnimationActive={false}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ageGroup" tickFormatter={this.xAxisTickFormatter} />
            <YAxis tickFormatter={this.yAxisTickFormatter} />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend content={this.renderCusomizedLegend} />
            <Bar dataKey="Male" fill="#4472c4" />
            <Bar dataKey="Female" fill="#ff99cc" />
          </BarChart>
        </ResponsiveContainer>
      </span>
    );
  }
}
function getAgeInYears(dob) {
  let date = moment(dob, 'YYYY-MM-DD').toDate();
  return moment().diff(date, 'years');
}

function getPercent(members, totalMembers) {
  if (!members) {
    return 0;
  }
  //  return Math.round((members * 100) / totalMembers);
  return members;
}

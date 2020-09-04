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

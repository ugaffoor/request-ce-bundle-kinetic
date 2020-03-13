import React, { Component } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';

export class ProgramsChart extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;
    let data = this.getData(this.props.allMembers, this.props.programs);
    this.renderProgramsCustomizedLabel = this.renderProgramsCustomizedLabel.bind(
      this,
    );
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
      data.push({ Program: program.program, MemberCount: 0 });
    });

    allMembers.forEach(member => {
      let program = data.find(
        obj => obj['Program'] === member.values['Ranking Program'],
      );
      if (program) {
        program['MemberCount'] = program['MemberCount'] + 1;
      }
    });

    return data;
  }

  renderProgramsCustomizedLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    MemberCount,
  }) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x - (x > cx ? 25 : -25)}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
      >
        {`${MemberCount}-${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  render() {
    const { data } = this.state;
    return (
      <span>
        <div className="page-header">Programs</div>
        <ResponsiveContainer minHeight={370}>
          <PieChart width={300} height={370}>
            <Pie
              data={data}
              nameKey="Program"
              dataKey="MemberCount"
              cx={'50%'}
              label={this.renderProgramsCustomizedLabel}
              labelLine={false}
              outerRadius={120}
              innerRadius={60}
              fill="#8884d8"
            >
              {data.map((entry, index) => (
                <Cell fill={COLORS[index % COLORS.length]} key={index} />
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
const RADIAN = Math.PI / 180;

const COLORS = [
  'black',
  '#c00101',
  '#bdd7ee',
  '#ffc001',
  '#ed7d32',
  '#a9d18d',
  '#70ad46',
  '#4472c4',
  '#7030a0',
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

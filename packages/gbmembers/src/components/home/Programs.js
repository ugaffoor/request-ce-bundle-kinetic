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
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell
                  fill={
                    COLORS[entry.Program] !== undefined
                      ? COLORS[entry.Program]
                      : OTHER_COLORS[index % OTHER_COLORS.length]
                  }
                  key={index}
                />
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
const COLORS = {
  GB1: '#4472c4',
  GB2: '#7030a0',
  GB3: 'black',
  'Tiny Champions': '#bdd7ee',
  'Little Champions 1': '#ffc001',
  'Little Champions 2': '#ed7d32',
  Juniors: '#a9d18d',
  Teens: '#70ad46',
  'Kids Competition Team': '#48D1CC',
};
const OTHER_COLORS = [
  '#c00101',
  '#9932CC',
  '#8A2BE2',
  '#1E90FF',
  '#6495ED',
  '#ADD8E6',
  '#6B8E23',
  '#00FF00',
  '#F08080',
];

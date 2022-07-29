import React, { Component } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Tooltip,
  Cell,
  Legend,
} from 'recharts';
import { KappNavLink as NavLink } from 'common';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import ReactTable from 'react-table';

export class ProgramsChart extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;
    this.membersOnClick = this.membersOnClick.bind(this);
    this._getMemberColumns = this.getMemberColumns();

    let data = this.getData(this.props.allMembers, this.props.programs);
    let totalMembers = 0;
    data.forEach(function(element) {
      totalMembers += element.MemberCount;
    });
    this.renderProgramsCustomizedLabel = this.renderProgramsCustomizedLabel.bind(
      this,
    );
    this.state = {
      data,
      totalMembers,
      showMembers: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.allMembers) {
      this.allMembers = nextProps.allMembers;
      let data = this.getData(nextProps.allMembers, nextProps.programs);
      let totalMembers = 0;
      data.forEach(function(element) {
        totalMembers += element.MemberCount;
      });

      this.setState({
        data,
        totalMembers,
      });
    }
  }

  getData(allMembers, programs) {
    if (!allMembers || allMembers.size <= 0) {
      return [];
    }

    let programInfo = new Map();

    programs.forEach(program => {
      programInfo.set(program.program, {
        Program: program.program,
        MemberCount: 0,
        members: [],
      });
    });

    allMembers.forEach(member => {
      let program = programInfo.get(member.values['Ranking Program']);
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Casual' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        if (program) {
          program['MemberCount'] = program['MemberCount'] + 1;
          program['members'][program['members'].length] = {
            id: member.id,
            name:
              member.values['First Name'] + ' ' + member.values['Last Name'],
          };
        }
      }
    });

    let data = [];
    programInfo.forEach(programInfo => {
      data.push({
        Program: programInfo['Program'],
        MemberCount: programInfo['MemberCount'],
        members: programInfo['members'],
      });
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
  membersOnClick(e) {
    console.log(e.members.length);
    this.setState({
      members: e.members,
      showMembers: true,
    });
  }
  getMembers(members, col) {
    var members_col = [];

    for (var i = col - 1; i < members.length; i = i + 4) {
      //if (i % (col-1) === 0){
      members_col[members_col.length] = {
        memberId: members[i].id,
        name: members[i].name,
      };
      //}
    }

    return members_col;
  }

  getMemberTableData(members) {
    let members_col1 = this.getMembers(members, 1);
    let members_col2 = this.getMembers(members, 2);
    let members_col3 = this.getMembers(members, 3);
    let members_col4 = this.getMembers(members, 4);

    return [
      {
        members: {
          members_col1: members_col1,
          members_col2: members_col2,
          members_col3: members_col3,
          members_col4: members_col4,
        },
      },
    ];
  }
  getMemberColumns = () => {
    return [
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col1['memberId']}`}
              className=""
            >
              {props.original.members_col1['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col2['memberId']}`}
              className=""
            >
              {props.original.members_col2['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col3['memberId']}`}
              className=""
            >
              {props.original.members_col3['name']}
            </NavLink>
          );
        },
      },
      {
        accessor: 'members',
        Header: '',
        headerClassName: 'members_col',
        className: 'members_col',
        Cell: props => {
          return props.original.members_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/Member/${props.original.members_col4['memberId']}`}
              className=""
            >
              {props.original.members_col4['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getMemberTableColumns(row) {
    return [
      {
        accessor: 'members',
        Header: 'Members',
        headerClassName: 'members_col',
        className: 'members_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let members_col1 = props.value.members_col1;
          let members_col2 = props.value.members_col2;
          let members_col3 = props.value.members_col3;
          let members_col4 = props.value.members_col4;

          let members = [];
          for (var i = 0; i < members_col1.length; i++) {
            members[members.length] = {
              members_col1: members_col1[i],
              members_col2:
                members_col2.length > i ? members_col2[i] : undefined,
              members_col3:
                members_col3.length > i ? members_col3[i] : undefined,
              members_col4:
                members_col4.length > i ? members_col4[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getMemberColumns}
              pageSize={members_col1.length > 20 ? 20 : members_col1.length}
              showPagination={members_col1.length > 20 ? true : false}
              data={members}
            />
          );
        },
      },
    ];
  }
  render() {
    const { data } = this.state;
    return (
      <span>
        <div className="page-header">
          Programs - Total {this.state.totalMembers}
        </div>
        {this.state.showMembers && (
          <div className="memberChartDetails">
            <span
              className="closeMembers"
              onClick={e =>
                this.setState({
                  showMembers: false,
                })
              }
            >
              <SVGInline svg={crossIcon} className="icon" />
            </span>
            <ReactTable
              columns={this.getMemberTableColumns()}
              data={this.getMemberTableData(this.state.members)}
              defaultPageSize={1}
              showPagination={false}
            />
          </div>
        )}
        {!this.state.showMembers && (
          <div className="programsChart">
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
                  onClick={this.membersOnClick}
                  style={{ cursor: 'pointer' }}
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
          </div>
        )}
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

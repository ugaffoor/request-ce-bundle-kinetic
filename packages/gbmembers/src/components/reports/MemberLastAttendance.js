import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';

export class MemberLastAttendance extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allMembers, 3);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
      week: '3',
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {}

  getData(allMembers, week) {
    if (!allMembers || allMembers.length <= 0) {
      return [];
    }
    let toWeek = moment().subtract(week, 'weeks');
    let members = allMembers.filter(member => {
      let lastAttendance = moment(member.values['Last Attendance Date']);
      return lastAttendance.isBefore(toWeek) ? true : false;
    });
    const data = members
      .sort((a, b) => {
        let aDt = moment(a.values['Last Attendance Date']);
        let bDt = moment(b.values['Last Attendance Date']);
        if (aDt.isBefore(bDt)) {
          return -1;
        } else if (aDt.isAfter(bDt)) {
          return 1;
        }
        return 0;
      })
      .map(member => {
        return {
          name: member.values['First Name'] + ' ' + member.values['Last Name'],
          memberID: member.id,
          lastAttendance: member.values['Last Attendance Date'],
        };
      });
    return data;
  }

  getColumns(data) {
    const columns = [
      {
        accessor: 'name',
        Header: 'Name',
        width: 300,
        Cell: props => {
          return props.original.memberID === undefined ? (
            <div />
          ) : (
            <NavLink to={`/Member/${props.original.memberID}`} className="">
              {props.original.name}
            </NavLink>
          );
        },
      },
      {
        accessor: 'lastAttendance',
        Header: 'Last Attendance Date',
        width: 300,
        Cell: props => {
          return moment(props.original.lastAttendance).format('Do MMM');
        },
      },
      {
        accessor: 'lastAttendance',
        Header: 'Weeks Ago',
        Cell: props => {
          return moment().diff(moment(props.original.lastAttendance), 'weeks');
        },
      },
    ];
    return columns;
  }

  render() {
    const { data, columns } = this.state;
    return (
      <span>
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Member Last Attendance</h6>
        </div>
        <div className="daysOut">
          <label htmlFor="days">Days Before</label>
          <select
            name="days"
            id="days"
            ref={input => (this.input = input)}
            defaultValue={2}
            onChange={e => {
              let data = this.getData(
                this.props.allMembers,
                parseInt(e.target.value),
              );
              this.setState({
                week: e.target.value,
                data: data,
              });
            }}
          >
            <option value="2">2 Week</option>
            <option value="3">3 Week</option>
            <option value="4">4 Week</option>
            <option value="5">5 Week</option>
            <option value="6">6 Week</option>
            <option value="7">7 Week</option>
            <option value="8">8 Week</option>
          </select>
          <div className="droparrow" />
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

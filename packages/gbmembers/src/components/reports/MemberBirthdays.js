import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';

export class MemberBirthdays extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.allMembers, 1);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
      week: '1',
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {}

  getData(allMembers, week) {
    if (!allMembers || allMembers.length <= 0) {
      return [];
    }
    let year = moment().year();
    let now = moment();
    let toWeek = moment().add(week, 'weeks');
    let members = allMembers.filter(member => {
      let dob = moment(member.values['DOB']).year(year);
      return dob.isBetween(now, toWeek) ? true : false;
    });
    const data = members
      .sort((a, b) => {
        let aDt = moment(a.values['DOB']).year(year);
        let bDt = moment(b.values['DOB']).year(year);
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
          dob: member.values['DOB'],
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
        accessor: 'dob',
        Header: 'Birthday',
        Cell: props => {
          return moment(props.original.dob).format('Do MMM');
        },
      },
      {
        accessor: 'dob',
        Header: 'Age',
        Cell: props => {
          return moment().year() - moment(props.original.dob).year();
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
          <h6>Member Birthdays</h6>
        </div>
        <div className="daysOut">
          <label htmlFor="days">Days Before</label>
          <select
            name="days"
            id="days"
            ref={input => (this.input = input)}
            defaultValue={1}
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
            <option value="1">1 Week</option>
            <option value="2">2 Week</option>
            <option value="3">3 Week</option>
            <option value="4">4 Week</option>
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

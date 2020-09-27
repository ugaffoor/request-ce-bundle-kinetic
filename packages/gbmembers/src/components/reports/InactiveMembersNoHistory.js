import React, { Component } from 'react';
import ReactTable from 'react-table';
import { KappNavLink as NavLink } from 'common';
import moment from 'moment';

export class InactiveMembersNoHistory extends Component {
  constructor(props) {
    super(props);
    let data = this.getData(this.props.members);
    let columns = this.getColumns();
    this.state = {
      data,
      columns,
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {}

  getData(allMembers, week) {
    if (!allMembers || allMembers.length <= 0) {
      return [];
    }

    const data = allMembers
      .filter(member => {
        return member.values['Status'] === 'Inactive' &&
          (member.values['Status History'] === undefined ||
            member.values['Status History'] === '' ||
            member.values['Status History'] === null)
          ? true
          : false;
      })
      .map(member => {
        return {
          name: member.values['First Name'] + ' ' + member.values['Last Name'],
          memberID: member.id,
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
          <h6>Inactive Members with No Status History</h6>
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

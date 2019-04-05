import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';

export class ListMembers extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: this.getData(props.allMembers, props.memberLists, props.listName),
    };
    this.actions = props.actions;
    this.toggleSidebarOpen = props.toggleSidebarOpen;
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      data: this.getData(
        nextProps.allMembers,
        nextProps.memberLists,
        nextProps.listName,
      ),
    });
  }

  getData(allMembers, memberLists, listName) {
    if (!allMembers || allMembers.length <= 0 || !memberLists || !listName) {
      return [];
    }

    let selectedList = memberLists
      .filter(list => list.name === listName)
      .get(0);

    if (!selectedList) {
      return [];
    }

    let members = allMembers.filter(member => {
      return selectedList.members.some(memberId => memberId === member['id']);
    });

    let data = members.map(member => {
      return {
        id: member.id,
        ...member.values,
      };
    });
    return data.sort(this.compare);
  }

  compare(member1, member2) {
    if (member1['Last Name'] < member2['Last Name']) return -1;
    if (member1['Last Name'] > member2['Last Name']) return 1;
    return 0;
  }

  renderCell(cellInfo) {
    return (
      <NavLink
        to={`/Member/${cellInfo.original.id}`}
        className={cellInfo.original['Status'] + ' nav-link icon-wrapper' + (cellInfo.original['Is New Reply Received'] === 'true' ? ' newReplyReceived' : '')}
        activeClassName="active"
      >
        {cellInfo.original['Last Name']}
        &nbsp;
        {cellInfo.original['First Name']}
      </NavLink>
    );
  }
  render() {
    const { data } = this.state;
    return (
      <div>
        <ReactTable
          data={data}
          filterable
          showPagination={false}
          minRows="0"
          defaultFilterMethod={(filter, row, column) => {
            const id = filter.pivotId || filter.id;
            return row[id] !== undefined
              ? String(row[id]).startsWith(filter.value)
              : true;
          }}
          getTdProps={(state, rowInfo, column, instance) => {
            console.log('rowInfo:' + rowInfo);
            return {};
          }}
          columns={[
            {
              Header: 'Name',
              id: 'id',
              accessor: d => d.id,
              Cell: this.renderCell,
              Footer: (
                <span>
                  <strong>Total: </strong>
                  {data.length}
                </span>
              ),
              filterMethod: (filter, row) =>
                row._original['First Name']
                  .toLowerCase()
                  .includes(filter.value.toLowerCase()) ||
                row._original['Last Name']
                  .toLowerCase()
                  .includes(filter.value.toLowerCase()),
            },
          ]}
          defaultPageSize={100}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

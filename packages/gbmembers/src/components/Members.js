import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';

export class Members extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: this.getData(props.allMembers),
    };
    this.actions = props.actions;
    this.toggleSidebarOpen = props.toggleSidebarOpen;
  }

  getData(allMembers) {
    let data = allMembers.map(member => {
      return {
        id: member.id,
        ...member.values,
      };
    });
    return data.sort(this.compare);
  }

  compare(member1, member2) {
    if ((member1['Last Name']+member1['First Name']).toLowerCase() < (member2['Last Name']+member2['First Name']).toLowerCase()) return -1;
    if ((member1['Last Name']+member1['First Name']).toLowerCase() > (member2['Last Name']+member2['First Name']).toLowerCase()) return 1;
    return 0;
  }

  renderCell(cellInfo) {
    return (
      <NavLink
        to={`/Member/${cellInfo.original.id}`}
        className={cellInfo.original['Status'] + ' nav-link icon-wrapper' + (cellInfo.original['Is New Reply Received'] === 'true' ? ' newReplyReceived' : '')}
        activeClassName="active"
      >
        <SVGInline svg={attentionRequired}
        className={
          cellInfo.original['Is New Reply Received'] === 'true' ? 'attention icon' : 'attention icon hide'
        }
        />
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
          defaultPageSize={1000}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

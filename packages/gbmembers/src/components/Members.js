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
    this.actions = props.actions;
    this.state = {
      data: this.getData(props.allMembers, props.currentFilter),
    };
    this.toggleSidebarOpen = props.toggleSidebarOpen;
  }
  addFilterPlaceholder = () => {
    const filters = document.querySelectorAll('div.rt-th > input');
    for (let filter of filters) {
      filter.placeholder = 'Search..';
    }
  };

  componentDidMount() {
    this.addFilterPlaceholder();
  }
  getData(allMembers, currentFilter) {
    let members = allMembers.filter(member => {
      let match = false;
      if (currentFilter === 'Active Members') {
        if (
          member.values['Status'] !== 'Inactive' &&
          member.values['Status'] !== 'Suspended'
        )
          match = true;
      } else if (currentFilter === 'Inactive Members') {
        if (
          member.values['Status'] === undefined ||
          member.values['Status'] === 'Inactive' ||
          member.values['Status'] === 'Suspended'
        )
          match = true;
      } else if (currentFilter === 'All Members') {
        match = true;
      }
      return match;
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
    if (
      (member1['Last Name'] + member1['First Name']).toLowerCase() <
      (member2['Last Name'] + member2['First Name']).toLowerCase()
    )
      return -1;
    if (
      (member1['Last Name'] + member1['First Name']).toLowerCase() >
      (member2['Last Name'] + member2['First Name']).toLowerCase()
    )
      return 1;
    return 0;
  }

  renderCell(cellInfo) {
    return (
      <NavLink
        to={`/Member/${cellInfo.original.id}`}
        className={
          cellInfo.original['Status'] +
          ' nav-link icon-wrapper' +
          (cellInfo.original['Is New Reply Received'] === 'true'
            ? ' newReplyReceived'
            : '')
        }
        activeClassName="active"
      >
        <SVGInline
          svg={attentionRequired}
          className={
            cellInfo.original['Is New Reply Received'] === 'true'
              ? 'attention icon'
              : 'attention icon hide'
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
            return {};
          }}
          columns={[
            {
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

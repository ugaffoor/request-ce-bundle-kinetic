import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';
import noBilling from '../images/credit-card.svg?raw';
import $ from 'jquery';
import { matchesMemberFilter } from '../utils/utils';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';

export class ListMembers extends React.Component {
  constructor(props) {
    super();
    this.state = {
      data: this.getData(
        props.space,
        props.allMembers,
        props.memberLists,
        props.listName,
      ),
    };
    this.actions = props.actions;
    this.toggleSidebarOpen = props.toggleSidebarOpen;
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      data: this.getData(
        this.props.space,
        nextProps.allMembers,
        nextProps.memberLists,
        nextProps.listName,
      ),
    });
  }
  isOrphan(space, allMembers, member) {
    if (getAttributeValue(space, 'Billing Company') === 'No Billing')
      return false;
    return (member.values['Billing Parent Member'] === undefined ||
      member.values['Billing Parent Member'] === '' ||
      member.values['Billing Parent Member'] === null) &&
      member.values['Billing User'] !== 'YES' &&
      member.values['Status'] === 'Active' &&
      member.values['Non Paying'] !== 'YES'
      ? true
      : false;
  }
  getData(space, allMembers, memberLists, listName) {
    if (!allMembers || allMembers.length <= 0 || !memberLists || !listName) {
      return [];
    }

    let selectedList = memberLists
      .filter(list => list.name === listName)
      .get(0);

    if (!selectedList) {
      return [];
    }

    let members = matchesMemberFilter(allMembers, selectedList.filters);

    let data = members.map(member => {
      return {
        id: member.id,
        orphan: this.isOrphan(space, allMembers, member),
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
        <SVGInline
          svg={noBilling}
          className={
            cellInfo.original.orphan ? 'noBilling icon' : 'noBilling icon hide'
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
          ref={r => {
            this.selectTable = r;
          }}
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
          onFilteredChange={(filtered, column) => {
            this.setState({ dummy: true });
          }}
          columns={[
            {
              id: 'id',
              placeholder: 'Search',
              accessor: d => d.id,
              Cell: this.renderCell,
              Header: (
                <span>
                  <strong>Total: </strong>
                  {this.selectTable !== undefined
                    ? this.selectTable.state.sortedData.length
                    : data.length}
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

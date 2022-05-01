import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';
import noBilling from '../images/credit-card.svg?raw';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';

var membersThis;
export class Members extends React.Component {
  constructor(props) {
    super();
    this.actions = props.actions;
    this.state = {
      data: this.getData(props.space, props.allMembers, props.currentFilter),
      filtered: [],
      filterAll: '',
      attentionRequiredOnly: false,
    };
    this.toggleSidebarOpen = props.toggleSidebarOpen;
    this.filterAll = this.filterAll.bind(this);

    membersThis = this;
  }
  addFilterPlaceholder = () => {
    const filters = document.querySelectorAll('div.rt-th > input');
    for (let filter of filters) {
      //filter.placeholder = 'Search [Name,Number,Email]';
      $(filter).hide();
    }
  };

  componentDidMount() {
    this.addFilterPlaceholder();
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    var data = this.getData(
      this.props.space,
      nextProps.allMembers,
      this.props.currentFilter,
    );
    this.setState({
      data: data,
      filteredCount: data.length,
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
  getData(space, allMembers, currentFilter) {
    let members = allMembers.filter(member => {
      let match = false;
      if (currentFilter === 'Active Members') {
        if (
          member.values['Status'] !== 'Inactive' &&
          member.values['Status'] !== 'Frozen'
        )
          match = true;
      } else if (currentFilter === 'Frozen Members') {
        if (member.values['Status'] === 'Frozen') match = true;
      } else if (currentFilter === 'Inactive Members') {
        if (
          member.values['Status'] === undefined ||
          member.values['Status'] === 'Inactive'
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
        orphan: this.isOrphan(space, allMembers, member),
        ...member.values,
      };
    });
    return data.sort(this.compare);
  }

  compare(member1, member2) {
    try {
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
    } catch (error) {
      return 0;
    }
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
  filterAll(e) {
    const { value } = e.target;
    const filterAll = value;
    const filtered = [{ id: 'id', value: filterAll }];
    // NOTE: this completely clears any COLUMN filters
    this.setState({ filterAll, filtered });
  }
  render() {
    const { data } = this.state;
    return (
      <div>
        <button
          id="attentionRequiredOnly"
          type="button"
          className={
            this.state.attentionRequiredOnly
              ? 'attentionRequiredOnly Active'
              : 'attentionRequiredOnly'
          }
          onClick={e => {
            const filterAll = '';
            const filtered = [{ id: 'id', value: filterAll }];
            // NOTE: this completely clears any COLUMN filters
            this.setState({
              attentionRequiredOnly: !this.state.attentionRequiredOnly,
              filterAll,
              filtered,
            });
          }}
        >
          <SVGInline svg={attentionRequired} className={'attention icon'} />
        </button>
        <input
          value={this.state.filterAll}
          placeholder="Search [Name,Number,Email]"
          onChange={this.filterAll}
          className="searchInput"
        />
        <ReactTable
          ref={r => {
            this.selectTable = r;
          }}
          data={data}
          showPagination={false}
          minRows="0"
          filterable
          filtered={this.state.filtered}
          onFilteredChange={(filtered, column) => {
            this.setState({ dummy: true });
          }}
          getTdProps={(state, rowInfo, column, instance) => {
            return {};
          }}
          columns={[
            {
              id: 'names',
              Cell: this.renderCell,
              Header: (
                <span>
                  <strong>Total: </strong>
                  {/*this.selectTable !== undefined
                    ? this.selectTable.state.sortedData.length
                    : data.length*/}
                  {this.state.filteredCount}
                </span>
              ),
            },
            {
              id: 'id',
              width: 0,
              resizable: false,
              sortable: false,
              filterAll: true,
              filterMethod: (filter, rows) => {
                var filteredRows = rows.filter(row => {
                  return this.state.attentionRequiredOnly
                    ? ((row._original['First Name'] !== undefined &&
                        row._original['First Name'] !== null &&
                        row._original['First Name']
                          .toLowerCase()
                          .includes(filter.value.toLowerCase())) ||
                        (row._original['First Name'] !== undefined &&
                          row._original['First Name'] !== null &&
                          row._original['First Name']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Last Name'] !== undefined &&
                          row._original['Last Name'] !== null &&
                          row._original['Last Name']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Phone Number'] !== undefined &&
                          row._original['Phone Number'] !== null &&
                          row._original['Phone Number']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Additional Phone Number'] !==
                          undefined &&
                          row._original['Additional Phone Number'] !== null &&
                          row._original['Additional Phone Number']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Email'] !== undefined &&
                          row._original['Email'] !== null &&
                          row._original['Email']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Additional Email'] !== undefined &&
                          row._original['Additional Email'] !== null &&
                          row._original['Additional Email']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Billing Customer Reference'] !==
                          undefined &&
                          row._original['Billing Customer Reference'] !==
                            null &&
                          row._original['Billing Customer Reference']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase()))) &&
                        this.state.attentionRequiredOnly &&
                          row._original['Is New Reply Received'] === 'true'
                    : (row._original['First Name'] !== undefined &&
                        row._original['First Name'] !== null &&
                        row._original['First Name']
                          .toLowerCase()
                          .includes(filter.value.toLowerCase())) ||
                        (row._original['First Name'] !== undefined &&
                          row._original['First Name'] !== null &&
                          row._original['First Name']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Last Name'] !== undefined &&
                          row._original['Last Name'] !== null &&
                          row._original['Last Name']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Phone Number'] !== undefined &&
                          row._original['Phone Number'] !== null &&
                          row._original['Phone Number']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Additional Phone Number'] !==
                          undefined &&
                          row._original['Additional Phone Number'] !== null &&
                          row._original['Additional Phone Number']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Email'] !== undefined &&
                          row._original['Email'] !== null &&
                          row._original['Email']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Additional Email'] !== undefined &&
                          row._original['Additional Email'] !== null &&
                          row._original['Additional Email']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase())) ||
                        (row._original['Billing Customer Reference'] !==
                          undefined &&
                          row._original['Billing Customer Reference'] !==
                            null &&
                          row._original['Billing Customer Reference']
                            .toLowerCase()
                            .includes(filter.value.toLowerCase()));
                });
                setTimeout(function() {
                  membersThis.setState({ filteredCount: filteredRows.length });
                }, 100);
                return filteredRows;
              },
            },
          ]}
          defaultPageSize={1000}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

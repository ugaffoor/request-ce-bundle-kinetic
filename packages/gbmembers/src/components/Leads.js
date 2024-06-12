import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';

var leadsThis;
export class Leads extends React.Component {
  constructor(props) {
    super();
    this.actions = props.actions;
    this.state = {
      data: this.getData(props.allLeads),
      filtered: [],
      filterAll: '',
      attentionRequiredOnly: false,
    };
    this.toggleSidebarOpen = props.toggleSidebarOpen;
    this.filterAll = this.filterAll.bind(this);
    this.renderCell = this.renderCell.bind(this);

    leadsThis = this;
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
    var data = this.getData(nextProps.allLeads);
    this.setState({
      data: data,
      filteredCount: data.length,
    });
  }

  getData(allLeads) {
    let data = allLeads
      .filter(lead => lead.values['Status'] !== 'Converted')
      .map(lead => {
        return {
          id: lead.id,
          ...lead.values,
        };
      });
    return data.sort(this.compare);
  }

  compare(lead1, lead2) {
    try {
      if (
        (lead1['Last Name'] + lead1['First Name']).toLowerCase() <
        (lead2['Last Name'] + lead2['First Name']).toLowerCase()
      )
        return -1;
      if (
        (lead1['Last Name'] + lead1['First Name']).toLowerCase() >
        (lead2['Last Name'] + lead2['First Name']).toLowerCase()
      )
        return 1;
    } catch (error) {
      return 0;
    }
    return 0;
  }
  isLongNameClass(original) {
    if ((original['First Name'] + original['Last Name']).length >= 25) {
      return ' longName';
    }

    return '';
  }

  renderCell(cellInfo) {
    return (
      <NavLink
        to={`/LeadDetail/${cellInfo.original.id}`}
        className={
          cellInfo.original['Status'] +
          ' nav-link icon-wrapper' +
          (cellInfo.original['Is New Reply Received'] === 'true'
            ? ' newReplyReceived'
            : '') +
          this.isLongNameClass(cellInfo.original)
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
          showPagination={true}
          defaultPageSize={150}
          pageSizeOptions={[150, 500, 1000]}
          defaultPage={0}
          usePagination
          minRows="0"
          filterable
          filtered={this.state.filtered}
          onFilteredChange={(filtered, column) => {
            this.setState({ dummy: true });
          }}
          getTdProps={(state, rowInfo, column, instance) => {
            if (rowInfo !== undefined) {
              return {
                onClick: (event, handleOriginal) => {
                  event.stopPropagation();

                  this.setState({
                    selectedRow: rowInfo.index,
                  });
                  if (handleOriginal) handleOriginal();
                },
              };
            }
          }}
          getTrProps={(state, rowInfo, column) => {
            if (
              rowInfo !== undefined &&
              rowInfo.index === this.state.selectedRow
            ) {
              return {
                className: 'selected-row',
              };
            }
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
                            .includes(filter.value.toLowerCase()))) &&
                        this.state.attentionRequiredOnly &&
                        row._original['Is New Reply Received'] === 'true'
                    : (row._original['First Name'] !== undefined &&
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
                            .includes(filter.value.toLowerCase()));
                });
                if (leadsThis.state.filteredCount !== filteredRows.length) {
                  setTimeout(function() {
                    leadsThis.setState({ filteredCount: filteredRows.length });
                  }, 100);
                }
                return filteredRows;
              },
            },
          ]}
          className="-striped -highlight"
        />
      </div>
    );
  }
}

import React from 'react';
// Import React Table
import ReactTable from 'react-table';
import 'react-table/react-table.css';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';

export class Leads extends React.Component {
  constructor(props) {
    super();
    this.actions = props.actions;
    this.state = {
      data: this.getData(props.allLeads),
    };
    this.toggleSidebarOpen = props.toggleSidebarOpen;
  }
  addFilterPlaceholder = () => {
    const filters = document.querySelectorAll('div.rt-th > input');
    for (let filter of filters) {
      filter.placeholder = 'Search [Name,Number,Email]';
    }
  };

  componentDidMount() {
    this.addFilterPlaceholder();
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      data: this.getData(nextProps.allLeads),
    });
  }

  getData(allLeads) {
    let data = allLeads.map(lead => {
      return {
        id: lead.id,
        ...lead.values,
      };
    });
    return data.sort(this.compare);
  }

  compare(lead1, lead2) {
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
    return 0;
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
              filterMethod: (filter, row) => {
                return (
                  row._original['First Name']
                    .toLowerCase()
                    .includes(filter.value.toLowerCase()) ||
                  row._original['Last Name']
                    .toLowerCase()
                    .includes(filter.value.toLowerCase()) ||
                  (row._original['Phone Number'] !== undefined &&
                    row._original['Phone Number'] !== null &&
                    row._original['Phone Number']
                      .toLowerCase()
                      .includes(filter.value.toLowerCase())) ||
                  (row._original['Additional Phone Number'] !== undefined &&
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
                      .includes(filter.value.toLowerCase()))
                );
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

import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';

export class MemberViewNotes extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
      });
    }
  }

  componentWillMount() {}

  getColumns() {
    return [
      {
        accessor: 'note',
        Header: 'Note',
        width: 800,
        style: { whiteSpace: 'unset' },
      },
      {
        accessor: 'contactDate',
        Header: 'Created Date',
        Cell: row =>
          moment(row.original.contactDate).format('DD-MM-YYYY h:hh A'),
      },
      {
        accessor: 'submitter',
        Header: 'Submitter',
        style: { whiteSpace: 'unset' },
      },
    ];
  }

  getData(memberItem) {
    let histories = memberItem.values['Notes History'];
    if (!histories) {
      return [];
    } else if (typeof histories !== 'object') {
      histories = JSON.parse(histories);
    }

    return histories.sort(function(history1, history2) {
      if (
        moment(history1.contactDate, contact_date_format).isAfter(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(history1.contactDate, contact_date_format).isBefore(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  render() {
    return (
      <div className="row">
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>All Notes</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
            />
          </span>
        </div>
      </div>
    );
  }
}

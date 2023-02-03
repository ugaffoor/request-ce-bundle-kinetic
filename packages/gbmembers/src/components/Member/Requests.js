import React, { Component } from 'react';
import ReactTable from 'react-table';
import { email_received_date_format } from '../leads/LeadsUtils';
import moment from 'moment';

export class Requests extends Component {
  constructor(props) {
    super(props);
    const data = this.props.requestContent;
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.requestContent) {
      this.setState({
        data: this.getData(nextProps.requestContent),
      });
    }
  }

  UNSAFE_componentWillMount() {}

  getColumns() {
    return [
      {
        accessor: 'Date',
        Header: 'Submitted Date',
        Cell: props => moment(props.value).format('L hh:mm A'),
      },
      { accessor: 'Form', Header: 'Form Name' },
      {
        accessor: 'url',
        Cell: props => <a href={props.value}>Review</a>,
      },
    ];
  }

  getData(requestContent) {
    let requests = requestContent;
    if (!requests || requests.length === 0) {
      return [];
    } else if (typeof requests !== 'object') {
      requests = JSON.parse(requests);
    }

    return requests.sort(function(request1, request2) {
      if (
        moment(request1['Date'], email_received_date_format).isAfter(
          moment(request2['Date'], email_received_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(request1['Date'], email_received_date_format).isBefore(
          moment(request2['Date'], email_received_date_format),
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
        <div className="col-sm-12">
          <span style={{ width: '100%' }}>
            <h3>Requests</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={
                this.state.data.length > 0 ? this.state.data.length : 2
              }
              pageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              showPagination={false}
              width={500}
            />
          </span>
        </div>
      </div>
    );
  }
}

export default Requests;

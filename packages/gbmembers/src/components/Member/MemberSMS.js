import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';

export class MemberSMS extends Component {
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
        Header: 'Direction',
        width: 150,
        className: 'direction',
        Cell: row => <span>{row.original['Direction']}</span>,
      },
      {
        Header: 'Date',
        width: 200,
        className: 'date',
        Cell: row => <span>{row.original['Date']}</span>,
      },
      {
        Header: 'Text',
        className: 'text',
        Cell: row => <span className="nowrap">{row.original['Content']}</span>,
      },
    ];
  }

  getData(memberItem) {
    let sms = memberItem.smsContent;
    if (!sms) {
      return [];
    } else if (typeof sms !== 'object') {
      sms = JSON.parse(sms);
    }
    let smsValues = [];
    sms.forEach(value => {
      let content = JSON.parse(value.values['Content']);
      smsValues[smsValues.length] = {
        Direction: value.values['Direction'],
        Date:
          value.values['Direction'] === 'Outbound'
            ? content['Sent Date']
            : content['Received Date'],
        Content: content['Content'],
      };
    });

    return smsValues;
    /*    return sms.sort(function(sms1, sms2) {
      if (
        moment(sms1.createAt, email_sent_date_format).isAfter(
          moment(sms2.createdAt, email_sent_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(sms1.createAt, email_sent_date_format).isBefore(
          moment(sms2.createdAt, email_sent_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
*/
  }

  render() {
    return (
      <div className="row smsTable">
        <div className="col-sm-12">
          <span style={{ width: '100%' }}>
            <h3>SMS</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
            />
          </span>
        </div>
      </div>
    );
  }
}

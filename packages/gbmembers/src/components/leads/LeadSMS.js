import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';

const email_date_format = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ'];

export class LeadSMS extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.leadItem);
    this._columns = this.getColumns();
    this.state = {
      data,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.leadItem) {
      this.setState({
        data: this.getData(nextProps.leadItem),
      });
    }
  }

  UNSAFE_componentWillMount() {}

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

  getData(leadItem) {
    let sms = leadItem.smsContent;
    if (!sms) {
      return [];
    } else if (typeof sms !== 'object') {
      sms = JSON.parse(sms);
    }
    let smsValues = [];
    sms.forEach(value => {
      let content = JSON.parse(value.values['Content']);
      var dt =
        value.values['Direction'] === 'Outbound'
          ? /*content['Sent Date']*/ value['createdAt']
          : /*content['Received Date'];*/ value['createdAt'];

      dt = moment(dt, email_date_format);

      smsValues[smsValues.length] = {
        Direction: value.values['Direction'],
        Date: dt.format('L h:mm A'),
        Content: content['Content'],
      };
    });
    smsValues.sort(function(sms1, sms2) {
      if (
        moment(sms1['Date'], 'L hh:mm A').isAfter(
          moment(sms2['Date'], 'L hh:mm A'),
        )
      ) {
        return -1;
      } else if (
        moment(sms1['Date'], 'L hh:mm A').isBefore(
          moment(sms2['Date'], 'L hh:mm A'),
        )
      ) {
        return 1;
      }
      if (
        sms1['Content'] !== null &&
        sms1['Content'][0] === '[' &&
        sms2['Content'][0] === '['
      ) {
        var page1 = sms1['Content'].substring(1, sms1['Content'].indexOf('/'));
        var page2 = sms2['Content'].substring(1, sms2['Content'].indexOf('/'));
        if (parseInt(page1) > parseInt(page2)) {
          return 1;
        } else if (parseInt(page1) < parseInt(page2)) {
          return -1;
        }
      }
      return 0;
    });

    var smsResult = [];

    smsValues.forEach(element => {
      if (element['Content'] !== null) {
        var idx = smsResult.findIndex(el => el['Date'] === element['Date']);
        if (idx === -1) {
          if (element['Content'][0] === '[')
            element['Content'] = element['Content'].split(']')[1].trim();
          smsResult.push(element);
        } else {
          smsResult[idx]['Content'] =
            smsResult[idx]['Content'] +
            (element['Content'][0] === '['
              ? element['Content'].split(']')[1]
              : element['Content']
            ).trim();
        }
      }
    });

    return smsResult;
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

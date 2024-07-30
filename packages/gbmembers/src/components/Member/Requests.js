import React, { Component } from 'react';
import ReactTable from 'react-table';
import { email_received_date_format } from '../leads/LeadsUtils';
import moment from 'moment';
import mail from '../../images/mail.png';
import { confirm } from '../helpers/Confirmation';

var compThis = undefined;

export class Requests extends Component {
  constructor(props) {
    super(props);

    this.formatEmailCell = this.formatEmailCell.bind(this);
    this.getData = this.getData.bind(this);
    this.getDate = this.getDate.bind(this);
    compThis = this;

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
  formatEmailCell(cellInfo) {
    return cellInfo.original['Form'] === 'Bambora Member Registration' ||
      cellInfo.original['Form'] === 'PaySmart Member Registration' ||
      cellInfo.original['Form'] === 'Cash Member Registration' ||
      cellInfo.original['Form'] === 'Member Self Sign Up' ||
      cellInfo.original['Form'] === 'Stripe Member Registration' ? (
      <span
        className="registrationEmail"
        onClick={async e => {
          if (
            await confirm(
              <span>
                <span>Are you sure you want to send a receipt email?</span>
              </span>,
            )
          ) {
            var request = cellInfo.original['url'];
            var id = request.split('/')[request.split('/').length - 2];
            var values = {};
            values['Form Slug'] = cellInfo.original['Form'];
            values['Submission ID'] = id;
            values['Currency Symbol'] = new Intl.NumberFormat(
              this.props.locale,
              {
                style: 'currency',
                currency: this.props.currency,
              },
            )
              .format('0')
              .replace(/\d+(?:\.?\d+)?/g, '')
              .trim();

            this.props.sendReceipt({
              values: values,
              addNotification: this.props.addNotification,
              setSystemError: this.props.setSystemError,
            });
          }
        }}
      >
        <img src={mail} alt="Email" />
        {cellInfo.original['receiptSender'] !== undefined && (
          <span className="sendTimes" placeholder="Send Receipt Times">
            {cellInfo.original['receiptSender'].map(date => (
              <span className="sendTime">{date.format('L hh:mmA')}</span>
            ))}
          </span>
        )}
      </span>
    ) : (
      <div />
    );
  }

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
      {
        accessor: 'emailReceipt',
        Header: '',
        Cell: this.formatEmailCell,
      },
    ];
  }

  getDate(dateVal) {
    var dt =
      dateVal !== undefined ? moment(dateVal, 'YYYY-MM-DDTHH:mm:ssZ') : '';

    if (dt === 'Invalid date') {
      dt =
        dateVal !== undefined ? moment(dateVal, 'YYYY-MM-DDTHH:mm:sssZ') : '';
    }
    return dt;
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
        compThis
          .getDate(request1['Date'])
          .isAfter(compThis.getDate(request2['Date']))
      ) {
        return -1;
      } else if (
        compThis
          .getDate(request1['Date'])
          .isBefore(compThis.getDate(request2['Date']))
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

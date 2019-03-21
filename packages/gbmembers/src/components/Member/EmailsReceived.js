import React, { Component } from 'react';
import ReactTable from 'react-table';
import { email_received_date_format } from '../leads/LeadsUtils';

export class EmailsReceived extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.submission);
    this._columns = this.getColumns();
    this.substituteFields = this.substituteFields.bind(this);
    this.escapeRegExp = this.escapeRegExp.bind(this);

    this.state = {
      data
    };
  }

  componentWillReceiveProps(nextProps) {
  }

  componentWillMount() {
  }

  getColumns() {
    return [
      { accessor: 'Content', Header: 'Content' },
      { accessor: 'Subject', Header: 'Subject' },
      { accessor: 'Received Date', Header: 'Received Date' }
    ];
  }

  getData(submission) {
    let emails = submission.values['Emails Received'];
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    return emails.sort(function(email1, email2) {
      if (
        moment(email1['Received Date'], email_received_date_format).isAfter(
          moment(email2['Received Date'], email_received_date_format)
        )
      ) {
        return -1;
      } else if (
        moment(email1['Received Date'], email_received_date_format).isBefore(
          moment(email2['Received Date'], email_received_date_format)
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }
  substituteFields(body) {
    if (body === undefined) return '';
    body = body.replace(
      /member\('First Name'\)/g,
      this.props.submission.values['First Name'],
    );
    body = body.replace(
      /member\('Last Name'\)/g,
      this.props.submission.values['Last Name'],
    );
    var matches = body.match(/\$\{.*?\('(.*?)'\)\}/g);
    var self = this;
    if (matches !== null) {
      matches.forEach(function(value, index) {
        console.log(value);
        if (value.indexOf('spaceAttributes') !== -1) {
          body = body.replace(
            new RegExp(this.escapeRegExp(value), 'g'),
            self.props.space.attributes[value.split("'")[1]][0],
          );
        }
      });
    }
    return body;
  }
  render() {
    return (
      <div className="row">
        <div className="col-sm-12">
          <span style={{ width: '100%' }}>
            <h3>Emails Received</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              pageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              showPagination={false}
              width={500}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    {this.substituteFields(row.original.Content)}
                  </div>
                );
              }}
            />
          </span>
        </div>
      </div>
    );
  }
}

export default EmailsReceived;

import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { email_sent_date_format } from '../leads/LeadsUtils';

export class MemberEmails extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.getCampaign = this.getCampaign.bind(this);
    let attachments = '';

    this.substituteFields = this.substituteFields.bind(this);
    this.state = {
      data,
      attachments,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      let attachments = '';

      if (nextProps.campaignItem.values['Attachments'] !== undefined) {
        JSON.parse(nextProps.campaignItem.values['Attachments']).forEach(
          attachment => {
            attachments +=
              decodeURI(
                attachment.split('/')[attachment.split('/').length - 1],
              ) + ' ';
          },
        );
      }

      this.setState({
        data: this.getData(nextProps.memberItem),
        attachments: attachments,
      });
    }
  }

  componentWillMount() {
    this.props.fetchCampaign({ setDummy: true });
  }

  getColumns() {
    return [
      {
        accessor: 'Subject',
        Header: 'Subject',
        width: 600,
        className: 'emailSentSubject',
        style: { whiteSpace: 'unset' },
        Cell: row => (
          <span>
            <a onClick={() => this.getCampaign(row.original['Campaign Id'])}>
              {row.original['Subject']}
            </a>
          </span>
        ),
      },
      { accessor: 'Sent Date', Header: 'Sent Date' },
    ];
  }

  getData(memberItem) {
    let emails = memberItem.emailsSent;
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    return emails.sort(function(email1, email2) {
      if (
        moment(email1['Sent Date'], email_sent_date_format).isAfter(
          moment(email2['Sent Date'], email_sent_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(email1['Sent Date'], email_sent_date_format).isBefore(
          moment(email2['Sent Date'], email_sent_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  getCampaign(campaignId) {
    this.props.fetchCampaign({ id: campaignId, history: this.props.history });
  }
  escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }
  substituteFields(body) {
    if (body === undefined) return '';
    body = body.replace(
      /member\('First Name'\)/g,
      this.props.memberItem.values['First Name'],
    );
    body = body.replace(
      /member\('Last Name'\)/g,
      this.props.memberItem.values['Last Name'],
    );
    var matches = body.match(/\$\{.*?\('(.*?)'\)\}/g);
    var self = this;
    if (matches !== null) {
      matches.forEach(function(value, index) {
        console.log(value);
        if (value.indexOf('spaceAttributes') !== -1) {
          body = body.replace(
            new RegExp(self.escapeRegExp(value), 'g'),
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
        <div className="col-sm-6">
          <span style={{ width: '100%' }}>
            <h3>Emails Sent</h3>
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
        <div className="col-sm-6">
          <h3>&nbsp;</h3>
          {this.props.campaignLoading ? (
            <div>Loading... </div>
          ) : (
            <div style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}>
              <div className="row">
                <div className="col-sm-2">
                  <label>Viewed:</label>
                </div>
                <div className="col-sm-8">
                  {this.props.campaignItem !== undefined &&
                  this.props.campaignItem.values['Opened By Members'] !==
                    undefined
                    ? this.props.campaignItem.values[
                        'Opened By Members'
                      ].indexOf(this.props.memberItem.id) !== -1
                      ? 'Yes'
                      : 'No'
                    : 'No'}
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2">
                  <label>Subject:</label>
                </div>
                <div className="col-sm-8">
                  {this.props.campaignItem !== undefined
                    ? this.props.campaignItem.values['Subject']
                    : ''}
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2">
                  <label>Sent Date:</label>
                </div>
                <div className="col-sm-8">
                  {this.props.campaignItem !== undefined
                    ? this.props.campaignItem.values['Sent Date']
                    : ''}
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2">
                  <label>Attachments:</label>
                </div>
                <div className="col-sm-8">
                  {this.props.campaignItem !== undefined
                    ? this.state.attachments
                    : ''}
                </div>
              </div>
              <div className="row">
                <div className="col-sm-2">
                  <label>Content:</label>
                </div>
                <div
                  className="col-sm-8"
                  style={{ border: 'solid 1px rgba(0,0,0,0.05)' }}
                >
                  <span
                    dangerouslySetInnerHTML={{
                      __html: this.substituteFields(
                        this.props.campaignItem !== undefined
                          ? this.props.campaignItem.values['Body']
                          : '',
                      ),
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
}

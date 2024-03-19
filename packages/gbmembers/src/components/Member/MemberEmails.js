import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';

const email_date_format = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ'];

export class MemberEmails extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.getCampaign = this.getCampaign.bind(this);
    let attachments = [];

    this.substituteFields = this.substituteFields.bind(this);
    this.state = {
      data,
      attachments,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      let attachments = [];

      if (nextProps.campaignItem.values['Attachments'] !== undefined) {
        JSON.parse(nextProps.campaignItem.values['Attachments']).forEach(
          attachment => {
            let name = decodeURI(
              attachment.split('/')[attachment.split('/').length - 1],
            );
            let url = attachment;
            while (url[0] === '/') {
              url = url.substring(1);
            }
            attachments.push({ name: name, url: url });
          },
        );
      }

      this.setState({
        data: this.getData(nextProps.memberItem),
        attachments: attachments,
      });
    }
  }

  UNSAFE_componentWillMount() {
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
      },
      { accessor: 'Sent Date Formatted', Header: 'Sent Date' },
    ];
  }

  getData(memberItem) {
    let emails = memberItem.emailsSent;
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    emails = emails.sort(function(email1, email2) {
      if (
        moment(email1['Sent Date'], email_date_format).isAfter(
          moment(email2['Sent Date'], email_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(email1['Sent Date'], email_date_format).isBefore(
          moment(email2['Sent Date'], email_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });

    emails.forEach(email => {
      email['Sent Date Formatted'] = moment(
        email['Sent Date'],
        email_date_format,
      ).format('L HH:mm');
    });
    return emails;
  }

  getCampaign(campaignId) {
    this.setState({
      campaignLoaded: campaignId,
    });
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
        <div className="col-sm-10">
          <span style={{ width: '100%' }}>
            <h3>Emails Sent</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={this.state.data.length}
              pageSize={this.state.data.length}
              showPagination={false}
              width={500}
              expanded={this.state.expandedRows}
              onExpandedChange={(newExpanded, index) => {
                let rows = [];
                if (newExpanded[index]) {
                  rows[index] = true;
                  this.getCampaign(this.state.data[index]['Campaign Id']);
                }
                this.setState({
                  expandedRows: rows,
                });
              }}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    <div id={row.original['Campaign Id']}>
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
                              this.props.campaignItem.values[
                                'Opened By Members'
                              ] !== undefined
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
                                ? this.props.campaignItem.values[
                                    'Sent Date Formatted'
                                  ]
                                : ''}
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Attachments:</label>
                            </div>
                            <div className="col-sm-8">
                              {this.props.campaignItem !== undefined
                                ? this.state.attachments.map((entry, index) => (
                                    <a target="_blank" href={entry.url}>
                                      {entry.name}
                                    </a>
                                  ))
                                : ''}
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-sm-2">
                              <label>Content:</label>
                            </div>
                          </div>
                          <div className="row">
                            <div
                              className=""
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
              }}
            />
          </span>
        </div>
      </div>
    );
  }
}

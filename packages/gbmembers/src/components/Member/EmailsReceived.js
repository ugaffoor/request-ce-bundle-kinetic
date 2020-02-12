import React, { Component } from 'react';
import ReactTable from 'react-table';
import { email_received_date_format } from '../leads/LeadsUtils';
import moment from 'moment';
import mail from '../../images/mail.png';
import { KappNavLink as NavLink } from 'common';

export class EmailsReceived extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.submission);
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.submission) {
      this.setState({
        data: this.getData(nextProps.submission),
      });
    }
  }

  componentWillMount() {}

  getColumns() {
    return [
      { accessor: 'Subject', Header: 'Subject' },
      { accessor: 'Received Date', Header: 'Received Date' },
      {
        accessor: 'replyEmail',
        Header: 'Reply',
        Cell: row => (
          <NavLink
            className="replyIcon"
            to={`/NewEmailCampaign/${row.original['User ID']}/${row.original['User Type']}/activity/${row.original['Activity ID']}`}
          >
            <img src={mail} alt="Email" />
          </NavLink>
        ),
      },
    ];
  }

  getData(submission) {
    let emails = submission.emailsReceived;
    if (!emails) {
      return [];
    } else if (typeof emails !== 'object') {
      emails = JSON.parse(emails);
    }

    // Convert date to Locale date, Received date is bbeing stored as utc
    for (var i = 0; i < emails.length; i++) {
      var dt = moment(emails[i]['Received Date'], 'DD-MM-YYYY HH:mm');
      dt = dt.add(moment().utcOffset() * 60, 'seconds');
      emails[i]['Received Date'] = dt.format(email_received_date_format);
      emails[i]['User Type'] = submission.form.slug;
      emails[i]['User ID'] = submission.id;
      emails[i]['Campaign ID'] = submission.id;
    }

    return emails.sort(function(email1, email2) {
      if (
        moment(email1['Received Date'], email_received_date_format).isAfter(
          moment(email2['Received Date'], email_received_date_format),
        )
      ) {
        return -1;
      } else if (
        moment(email1['Received Date'], email_received_date_format).isBefore(
          moment(email2['Received Date'], email_received_date_format),
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
            <h3>Emails Received</h3>
            <ReactTable
              columns={this._columns}
              data={this.state.data}
              defaultPageSize={
                this.state.data.length > 0 ? this.state.data.length : 2
              }
              pageSize={this.state.data.length > 0 ? this.state.data.length : 2}
              showPagination={false}
              width={500}
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px', textAlign: 'left' }}>
                    <div
                      dangerouslySetInnerHTML={{ __html: row.original.Content }}
                    />
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

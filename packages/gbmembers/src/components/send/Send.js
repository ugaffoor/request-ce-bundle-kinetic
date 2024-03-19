import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/campaigns';
import { actions as messageActions } from '../../redux/modules/messaging';
import { actions as leadActions } from '../../redux/modules/leads';
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import ReactSpinner from 'react16-spinjs';
import 'react-datetime/css/react-datetime.css';
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';
import { email_received_date_format } from '../leads/LeadsUtils';
import moment from 'moment';
import { actions as appActions } from '../../redux/modules/memberApp';
import crossIcon from '../../images/cross.svg?raw';
import SVGInline from 'react-svg-inline';
import { confirm } from '../helpers/Confirmation';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  pathname: state.router.location.pathname,
  emailCampaigns: state.member.campaigns.allEmailCampaigns,
  emailCampaignsLoading: state.member.campaigns.emailCampaignsLoading,
  smsCampaigns: state.member.campaigns.allSmsCampaigns,
  smsCampaignsLoading: state.member.campaigns.smsCampaignsLoading,
  individualSMS: state.member.messaging.individualSMS,
  individualSMSLoading: state.member.messaging.individualSMSLoading,
  allLeads: state.member.leads.allLeads,
  leadsLoading: state.member.leads.leadsLoading,
  profile: state.app.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  fetchEmailCampaigns: actions.fetchEmailCampaigns,
  setEmailCampaigns: actions.setEmailCampaigns,
  updateCampaign: actions.updateEmailCampaign,
  fetchSmsCampaigns: actions.fetchSmsCampaigns,
  setSmsCampaigns: actions.setSmsCampaigns,
  updateSmsCampaign: actions.updateSmsCampaign,
  getIndividualSMS: messageActions.getIndividualSMS,
  setIndividualSMS: messageActions.setIndividualSMS,
  fetchLeads: leadActions.fetchLeads,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
const email_date_format = ['DD-MM-YYYY HH:mm', 'YYYY-MM-DDTHH:mm:ssZ'];
var myThis;
var mySMSThis;

export class EmailCampaignsList extends Component {
  constructor(props) {
    super(props);

    let emailCampaigns = this.getData(this.props.emailCampaigns.submissions);
    this._columns = this.getColumns();
    this.getNestedTableData = this.getNestedTableData.bind(this);
    this._nestedTableColumns = this.getNestedTableColumns();
    this._getRecipientColumns = this.getRecipientColumns();
    this._getOpenedColumns = this.getOpenedColumns();
    this._getClickedColumns = this.getClickedColumns();
    this.state = {
      emailCampaigns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.emailCampaigns) {
      this.setState({
        emailCampaigns: this.getData(nextProps.emailCampaigns.submissions),
        emailNextPageToken: nextProps.emailCampaigns.nextPageToken,
      });
    }
  }

  getColumns = () => {
    return [
      { accessor: 'subject', Header: 'Subject', width: '90%' },
      { accessor: 'sentDate', Header: 'Sent On', maxWidth: 200 },
      {
        accessor: 'status',
        Header: 'Status',
        headerClassName: 'status_col',
        className: 'status_col',
        maxWidth: 300,
        Cell: props => {
          return (
            <span>
              {props.original.status['Status'] === 'Sent' && <span>Sent</span>}
              {props.original.status['Status'] === 'Cancelling' && (
                <span>Cancelling</span>
              )}
              {props.original.status['Status'] === 'Sending' && (
                <span>
                  Sending ({props.original.status['Emails_Sent']} of{' '}
                  {JSON.parse(props.original.recipients).length})
                  <span
                    className="cancelEmails"
                    onClick={async e => {
                      if (
                        await confirm(
                          <span>
                            <span>
                              Are you sure you want to CANCEL the selected Email
                              Campaign?
                            </span>
                            <table>
                              <tbody>
                                <tr>
                                  <td>{props.original.subject}</td>
                                </tr>
                              </tbody>
                            </table>
                          </span>,
                        )
                      ) {
                        this.props.updateCampaign({
                          id: props.original._id,
                          values: { 'Cancel Campaign': 'YES' },
                        });

                        if (this.reloadTimeout !== undefined) {
                          clearTimeout(this.reloadTimeout);
                          this.reloadTimeout = undefined;
                        }
                        props.original.status['Status'] = 'Cancelling';
                        this.setState({ dummy: true });
                        setTimeout(function() {
                          myThis.props.fetchEmailCampaigns({
                            setEmailCampaigns: myThis.props.setEmailCampaigns,
                          });
                        }, 1000 * 5);
                      }
                    }}
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                </span>
              )}
              {props.original.status['Status'] === 'Cancelled' && (
                <span>Cancelled ({props.original.status['Emails_Sent']})</span>
              )}
              {props.original.status['Status'] === 'Scheduled' && (
                <span>
                  Scheduled ({props.original.status['Scheduled_Time']})
                  <span
                    className="cancelEmails"
                    onClick={async e => {
                      if (
                        await confirm(
                          <span>
                            <span>
                              Are you sure you want to CANCEL the selected Email
                              Campaign?
                            </span>
                            <table>
                              <tbody>
                                <tr>
                                  <td>{props.original.subject}</td>
                                </tr>
                              </tbody>
                            </table>
                          </span>,
                        )
                      ) {
                        this.props.updateCampaign({
                          id: props.original._id,
                          values: { 'Cancel Campaign': 'YES' },
                        });

                        if (this.reloadTimeout !== undefined) {
                          clearTimeout(this.reloadTimeout);
                          this.reloadTimeout = undefined;
                        }
                        props.original.status['Status'] = 'Cancelling';
                        this.setState({ dummy: true });
                        setTimeout(function() {
                          myThis.props.fetchEmailCampaigns({
                            setEmailCampaigns: myThis.props.setEmailCampaigns,
                          });
                        }, 1000 * 5);
                      }
                    }}
                  >
                    <SVGInline svg={crossIcon} className="icon" />
                  </span>
                </span>
              )}
              {props.original.status['Status'] === 'Completed' && (
                <span>Sent ({props.original.status['Emails_Sent']})</span>
              )}
            </span>
          );
        },
      },
      {
        accessor: 'recipients',
        Header: 'Recipients',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        maxWidth: 100,
        Cell: props =>
          props.value ? JSON.parse(props.value).length : undefined,
      },
      {
        accessor: 'attachments',
        Header: '',
        headerClassName: 'attachments_col',
        className: 'attachments_col',
        maxWidth: 75,
        Cell: props => {
          return props.value ? JSON.parse(props.value).length : 0;
        },
      },
      {
        accessor: 'opened',
        Header: 'Opened',
        headerClassName: 'opened_col',
        className: 'opened_col',
        maxWidth: 75,
        Cell: props => (props.value ? JSON.parse(props.value).length : 0),
      },
      {
        accessor: 'clicked',
        Header: 'Clicked',
        headerClassName: 'clicked_col',
        className: 'clicked_col',
        maxWidth: 70,
        Cell: props => (props.value ? JSON.parse(props.value).length : 0),
      },
    ];
  };

  getData(emailCampaigns) {
    if (!emailCampaigns) {
      return [];
    }
    myThis = this;
    var hasInProgress = false;
    const data = emailCampaigns.map(campaign => {
      let status = this.getEmailStatus(campaign);
      if (status['Status'] === 'Scheduled' || status['Status'] === 'Sending') {
        hasInProgress = true;
      }

      return {
        _id: campaign['id'],
        subject: campaign.values['Subject'],
        sentDate: moment(
          campaign.values['Sent Date'],
          email_date_format,
        ).format('L h:mm A'),
        status: status,
        recipients: campaign.values['Recipients'],
        body: campaign.values['Body'],
        opened: campaign.values['Opened By Members'],
        clicked: campaign.values['Clicked By Members'],
        attachments: campaign.values['Attachments'],
      };
    });
    if (hasInProgress && this.reloadTimeout === undefined) {
      console.log('ReloadTimeout set');
      this.reloadTimeout = setTimeout(function() {
        myThis.reloadTimeout = undefined;
        myThis.props.fetchEmailCampaigns({
          setEmailCampaigns: myThis.props.setEmailCampaigns,
        });
      }, 1000 * 30); // 30 seconds
    }
    return data;
  }
  getEmailStatus(campaign) {
    var status = { Status: 'Sent' };
    if (campaign.values['Cancel Campaign'] === 'YES') {
      return {
        Status: 'Cancelled',
        Emails_Sent: campaign.values['Emailed Count'],
      };
    }

    var recipients = JSON.parse(campaign.values['Recipients']);
    if (
      Number.parseInt(campaign.values['Emailed Count']) === recipients.length
    ) {
      return {
        Status: 'Completed',
        Emails_Sent: campaign.values['Emailed Count'],
      };
    }

    if (
      campaign.values['Emailed Count'] !== undefined &&
      campaign.values['Emailed Count'] !== '0' &&
      Number.parseInt(campaign.values['Emailed Count']) !== recipients.length
    ) {
      return {
        Status: 'Sending',
        Emails_Sent: campaign.values['Emailed Count'],
      };
    }

    if (
      campaign.values['Scheduled Time'] !== null &&
      campaign.values['Scheduled Time'] !== undefined &&
      campaign.values['Scheduled Time'] !== ''
    ) {
      return {
        Status: 'Scheduled',
        Scheduled_Time: moment(campaign.values['Scheduled Time']).format(
          'L hh:mmA',
        ),
      };
    }

    return status;
  }
  getRecipientColumns = () => {
    return [
      {
        accessor: 'recipients',
        Header: '',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return (
            <NavLink
              to={`/${props.original['type']}/${props.original['id']}`}
              className=""
            >
              {props.original['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getOpenedColumns = () => {
    return [
      {
        accessor: 'opened',
        Header: '',
        headerClassName: 'opened_col',
        className: 'opened_col',
        Cell: props => {
          return (
            <NavLink
              to={`/${props.original['type']}/${props.original['id']}`}
              className=""
            >
              {props.original['name']}
            </NavLink>
          );
        },
      },
    ];
  };
  getClickedColumns = () => {
    return [
      {
        accessor: 'clicked',
        Header: '',
        headerClassName: 'clicked_col',
        className: 'clicked_col',
        Cell: props => {
          return (
            <NavLink
              to={`/${props.original['type']}/${props.original['id']}`}
              className=""
            >
              {props.original['name']}
            </NavLink>
          );
        },
      },
    ];
  };

  getNestedTableColumns(row) {
    return [
      {
        accessor: 'body',
        Header: 'Content',
        headerClassName: 'body_col',
        className: 'body_col',
        style: { whiteSpace: 'unset', overflow: 'scroll' },
      },
      {
        accessor: 'recipients',
        Header: 'Recipients',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        style: { whiteSpace: 'unset' },
        width: 300,
        Cell: props => {
          let values = props.value;
          values.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['id'] === member['id']) {
                value['type'] = 'Member';
                return;
              }
            });

            this.props.allLeads.forEach(lead => {
              if (value['id'] === lead['id']) {
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          return (
            <ReactTable
              columns={this._getRecipientColumns}
              pageSize={values.length > 20 ? 20 : values.length}
              showPagination={values.length > 20 ? true : false}
              data={values}
            />
          );
        },
      },
      {
        accessor: 'opened',
        Header: 'Opened By',
        headerClassName: 'opened_col',
        className: 'opened_col',
        style: { whiteSpace: 'unset' },
        width: 300,
        Cell: props => {
          let values = props.value;
          values.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['id'] === member['id']) {
                value['type'] = 'Member';
                return;
              }
            });

            this.props.allLeads.forEach(lead => {
              if (value['id'] === lead['id']) {
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          return (
            <ReactTable
              columns={this._getOpenedColumns}
              pageSize={values.length > 20 ? 20 : values.length}
              showPagination={values.length > 20 ? true : false}
              data={values}
            />
          );
        },
      },
      {
        accessor: 'clicked',
        Header: 'Clicked By',
        headerClassName: 'clicked_col',
        className: 'clicked_col',
        style: { whiteSpace: 'unset' },
        width: 300,
        Cell: props => {
          let values = props.value;
          values.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['id'] === member['id']) {
                value['type'] = 'Member';
                return;
              }
            });

            this.props.allLeads.forEach(lead => {
              if (value['id'] === lead['id']) {
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          return (
            <ReactTable
              columns={this._getClickedColumns}
              pageSize={values.length > 20 ? 20 : values.length}
              showPagination={values.length > 20 ? true : false}
              data={values}
            />
          );
        },
      },
      {
        accessor: 'attachments',
        Header: 'Attachments',
        headerClassName: 'attachments_col',
        className: 'attachments_col',
        width: 150,
        style: { whiteSpace: 'unset' },
      },
    ];
  }

  getNestedTableData(row) {
    //let members = [];
    let members = [];
    this.props.allMembers.forEach(member => {
      JSON.parse(row['recipients']).forEach(recipient => {
        if (recipient === member['id']) {
          members[members.length] = {
            id: member.id,
            name:
              member.values['First Name'] + ' ' + member.values['Last Name'],
          };
          return;
        }
      });
    });
    this.props.allLeads.forEach(lead => {
      JSON.parse(row['recipients']).forEach(recipient => {
        if (recipient === lead['id']) {
          members[members.length] = {
            id: lead.id,
            name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
          };
          return;
        }
      });
    });
    let opened = [];
    if (row['opened'] !== undefined) {
      this.props.allMembers.forEach(member => {
        JSON.parse(row['opened']).forEach(recipient => {
          if (recipient === member['id']) {
            opened[opened.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
            return;
          }
        });
      });
      this.props.allLeads.forEach(lead => {
        JSON.parse(row['opened']).forEach(recipient => {
          if (recipient === lead['id']) {
            opened[opened.length] = {
              id: lead.id,
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
            };
            return;
          }
        });
      });
    }
    let clicked = [];
    if (row['clicked'] !== undefined) {
      this.props.allMembers.forEach(member => {
        JSON.parse(row['clicked']).forEach(recipient => {
          if (recipient === member['id']) {
            clicked[clicked.length] = {
              id: member.id,
              name:
                member.values['First Name'] + ' ' + member.values['Last Name'],
            };
            return;
          }
        });
      });
      this.props.allLeads.forEach(lead => {
        JSON.parse(row['clicked']).forEach(recipient => {
          if (recipient === lead['id']) {
            clicked[clicked.length] = {
              id: lead.id,
              name: lead.values['First Name'] + ' ' + lead.values['Last Name'],
            };
            return;
          }
        });
      });
    }
    let attachments = '';
    if (row['attachments'] !== undefined) {
      JSON.parse(row['attachments']).forEach(attachment => {
        attachments +=
          decodeURI(attachment.split('/')[attachment.split('/').length - 1]) +
          '<br>';
      });
    }
    return [
      {
        body: <span dangerouslySetInnerHTML={{ __html: row['body'] }} />,
        recipients: members,
        opened: opened,
        clicked: clicked,
        attachments: <span dangerouslySetInnerHTML={{ __html: attachments }} />,
      },
    ];
  }

  render() {
    return (
      <div>
        <div className="">
          <div className="pageHeader">
            <h3>Emails Sent</h3>
          </div>
        </div>
        <div
          id="campaignsListGrid"
          className="row"
          style={{ marginTop: '10px' }}
        >
          <div className="col">
            <ReactTable
              columns={this._columns}
              data={this.state.emailCampaigns}
              defaultPageSize={
                this.state.emailCampaigns.length
                  ? this.state.emailCampaigns.length
                  : 2
              }
              pageSize={
                this.state.emailCampaigns.length
                  ? this.state.emailCampaigns.length
                  : 2
              }
              showPagination={false}
              style={{
                /*height: '500px',*/
                borderLeft: '0 !important',
              }}
              ref="campaignsListGrid"
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px' }}>
                    <ReactTable
                      data={this.getNestedTableData(row.original)}
                      columns={this._nestedTableColumns}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                );
              }}
            />
            {
              <a
                onClick={e => {
                  console.log('Show More..');
                  this.props.fetchEmailCampaigns({
                    setEmailCampaigns: this.props.setEmailCampaigns,
                    nextPageToken: this.state.emailNextPageToken,
                  });
                }}
                className="btn btn-primary showMore"
                disabled={this.state.emailNextPageToken === undefined}
                style={{ marginLeft: '10px', color: 'white' }}
              >
                Show More
              </a>
            }
          </div>
        </div>
      </div>
    );
  }
}

export class SmsCampaignsList extends Component {
  constructor(props) {
    super(props);
    let smsCampaigns = this.getData(this.props.smsCampaigns.submissions);
    this._columns = this.getColumns();
    this.getNestedTableData = this.getNestedTableData.bind(this);
    this._getNestedTableColumns = this.getNestedTableColumns;
    this._getRecipientColumns = this.getRecipientColumns();
    this.state = {
      smsCampaigns,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.smsCampaigns) {
      this.setState({
        smsCampaigns: this.getData(nextProps.smsCampaigns.submissions),
        smsNextPageToken: nextProps.smsCampaigns.nextPageToken,
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.fetchSmsCampaigns({
      setSmsCampaigns: this.props.setSmsCampaigns,
      nextPageToken: undefined,
    });
  }

  getColumns = () => {
    return [
      { accessor: 'content', Header: 'Content', width: '90%' },
      {
        accessor: 'sentDate',
        Header: 'Sent On',
        maxWidth: 270,
        Cell: props => {
          let sentTime = moment(props.original.sentDate, email_date_format);
          let scheduleTime =
            props.original.scheduledTime === '' ||
            props.original.scheduledTime === undefined
              ? undefined
              : moment(props.original.scheduledTime, email_date_format);
          return (
            <span>
              {scheduleTime === undefined && (
                <span>
                  {moment(props.original.sentDate, email_date_format).format(
                    'L h:mm A',
                  )}
                </span>
              )}
              {props.original.cancelled === 'YES' && <span>Cancelled</span>}
              {scheduleTime !== undefined && sentTime.isAfter(scheduleTime) && (
                <span>Sent {sentTime.format('L h:mm A')} </span>
              )}
              {scheduleTime !== undefined &&
                scheduleTime.isAfter(sentTime) &&
                props.original.cancelled !== 'YES' && (
                  <span>
                    Scheduled {scheduleTime.format('L h:mm A')}
                    <span
                      className="cancelEmails"
                      onClick={async e => {
                        if (
                          await confirm(
                            <span>
                              <span>
                                Are you sure you want to CANCEL the selected SMS
                                Campaign?
                              </span>
                              <table>
                                <tbody>
                                  <tr>
                                    <td>{props.original.content}</td>
                                  </tr>
                                </tbody>
                              </table>
                            </span>,
                          )
                        ) {
                          this.props.updateSmsCampaign({
                            id: props.original._id,
                            values: { 'Cancel Campaign': 'YES' },
                          });

                          if (this.reloadSmsTimeout !== undefined) {
                            clearTimeout(this.reloadSmsTimeout);
                            this.reloadSmsTimeout = undefined;
                          }
                          props.original['Cancel Campaign'] = 'Cancelled';
                          this.setState({ dummy: true });
                          setTimeout(function() {
                            mySMSThis.props.fetchSmsCampaigns({
                              setSmsCampaigns: mySMSThis.props.setSmsCampaigns,
                            });
                          }, 1000 * 5);
                        }
                      }}
                    >
                      <SVGInline svg={crossIcon} className="icon" />
                    </span>
                  </span>
                )}
            </span>
          );
        },
      },
      {
        accessor: 'recipients',
        Header: 'Recipients',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        maxWidth: 100,
        Cell: props =>
          props.value ? JSON.parse(props.value).length : undefined,
      },
    ];
  };

  getData(smsCampaigns) {
    if (!smsCampaigns) {
      return [];
    }
    mySMSThis = this;
    var hasInProgress = false;

    const data = smsCampaigns
      .sort((a, b) => {
        let aDate = moment(a.values['Sent Date'], email_date_format);
        let bDate = moment(b.values['Sent Date'], email_date_format);
        if (aDate.isBefore(bDate)) {
          return 1;
        } else if (aDate.isAfter(bDate)) {
          return -1;
        }
        return 0;
      })
      .map(campaign => {
        let sentTime = moment(campaign.values['Sent Date'], email_date_format);
        let scheduleTime =
          campaign.values['Scheduled Time'] === '' ||
          campaign.values['Scheduled Time'] === undefined
            ? undefined
            : moment(campaign.values['Scheduled Time'], email_date_format);
        if (
          scheduleTime !== undefined &&
          scheduleTime.isAfter(sentTime) &&
          campaign.values['Cancel Campaign'] !== 'YES'
        ) {
          hasInProgress = true;
        }
        return {
          _id: campaign['id'],
          content: campaign.values['SMS Content'],
          sentDate: campaign.values['Sent Date'],
          scheduledTime: campaign.values['Scheduled Time'],
          cancelled: campaign.values['Cancel Campaign'],
          recipients: campaign.values['Recipients'],
        };
      });

    if (hasInProgress && this.reloadSmsTimeout === undefined) {
      console.log('ReloadSmsTimeout set');
      this.reloadSmsTimeout = setTimeout(function() {
        mySMSThis.reloadSmsTimeout = undefined;
        mySMSThis.props.fetchSmsCampaigns({
          setSmsCampaigns: mySMSThis.props.setSmsCampaigns,
        });
      }, 1000 * 300); // 5 minutes
    }

    return data;
  }
  getRecipientColumns = () => {
    return [
      {
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return props.original.recipients_col1 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${props.original.recipients_col1['type']}/${props.original.recipients_col1['memberId']}`}
              className=""
            >
              {props.original.recipients_col1['name']}
            </NavLink>
          );
        },
      },
      {
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return props.original.recipients_col2 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${props.original.recipients_col2['type']}/${props.original.recipients_col2['memberId']}`}
              className=""
            >
              {props.original.recipients_col2['name']}
            </NavLink>
          );
        },
      },
      {
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return props.original.recipients_col3 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${props.original.recipients_col3['type']}/${props.original.recipients_col3['memberId']}`}
              className=""
            >
              {props.original.recipients_col3['name']}
            </NavLink>
          );
        },
      },
      {
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return props.original.recipients_col4 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${props.original.recipients_col4['type']}/${props.original.recipients_col4['memberId']}`}
              className=""
            >
              {props.original.recipients_col4['name']}
            </NavLink>
          );
        },
      },
      {
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        Cell: props => {
          return props.original.recipients_col5 === undefined ? (
            <div />
          ) : (
            <NavLink
              to={`/${props.original.recipients_col5['type']}/${props.original.recipients_col5['memberId']}`}
              className=""
            >
              {props.original.recipients_col5['name']}
            </NavLink>
          );
        },
      },
    ];
  };

  getNestedTableColumns(row) {
    return [
      {
        accessor: 'recipients',
        Header: 'Recipients',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
        Cell: props => {
          let recipients_col1 = props.value.recipients_col1;
          let recipients_col2 = props.value.recipients_col2;
          let recipients_col3 = props.value.recipients_col3;
          let recipients_col4 = props.value.recipients_col4;
          let recipients_col5 = props.value.recipients_col5;
          recipients_col1.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['memberId'] === member.values['Member ID']) {
                value['memberId'] = member.id;
                value['name'] =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                value['type'] = 'Member';
                return;
              }
            });
            this.props.allLeads.forEach(lead => {
              if (value['memberId'] === lead.id) {
                value['memberId'] = lead.id;
                value['name'] =
                  lead.values['First Name'] + ' ' + lead.values['Last Name'];
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          recipients_col2.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['memberId'] === member.values['Member ID']) {
                value['memberId'] = member.id;
                value['name'] =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                value['type'] = 'Member';
                return;
              }
            });
            this.props.allLeads.forEach(lead => {
              if (value['memberId'] === lead.id) {
                value['memberId'] = lead.id;
                value['name'] =
                  lead.values['First Name'] + ' ' + lead.values['Last Name'];
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          recipients_col3.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['memberId'] === member.values['Member ID']) {
                value['memberId'] = member.id;
                value['name'] =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                value['type'] = 'Member';
                return;
              }
            });
            this.props.allLeads.forEach(lead => {
              if (value['memberId'] === lead.id) {
                value['memberId'] = lead.id;
                value['name'] =
                  lead.values['First Name'] + ' ' + lead.values['Last Name'];
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          recipients_col4.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['memberId'] === member.values['Member ID']) {
                value['memberId'] = member.id;
                value['name'] =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                value['type'] = 'Member';
                return;
              }
            });
            this.props.allLeads.forEach(lead => {
              if (value['memberId'] === lead.id) {
                value['memberId'] = lead.id;
                value['name'] =
                  lead.values['First Name'] + ' ' + lead.values['Last Name'];
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          recipients_col5.forEach(value => {
            this.props.allMembers.forEach(member => {
              if (value['memberId'] === member.values['Member ID']) {
                value['memberId'] = member.id;
                value['name'] =
                  member.values['First Name'] +
                  ' ' +
                  member.values['Last Name'];
                value['type'] = 'Member';
                return;
              }
            });
            this.props.allLeads.forEach(lead => {
              if (value['memberId'] === lead.id) {
                value['memberId'] = lead.id;
                value['name'] =
                  lead.values['First Name'] + ' ' + lead.values['Last Name'];
                value['type'] = 'LeadDetail';
                return;
              }
            });
          });
          let recipients = [];
          for (var i = 0; i < recipients_col1.length; i++) {
            recipients[recipients.length] = {
              recipients_col1: recipients_col1[i],
              recipients_col2:
                recipients_col2.length > i ? recipients_col2[i] : undefined,
              recipients_col3:
                recipients_col3.length > i ? recipients_col3[i] : undefined,
              recipients_col4:
                recipients_col4.length > i ? recipients_col4[i] : undefined,
              recipients_col5:
                recipients_col5.length > i ? recipients_col5[i] : undefined,
            };
          }
          return (
            <ReactTable
              columns={this._getRecipientColumns}
              pageSize={
                recipients_col1.length > 20 ? 20 : recipients_col1.length
              }
              showPagination={recipients_col1.length > 20 ? true : false}
              data={recipients}
            />
          );
        },
      },
    ];
  }

  getRecipients(recipients, col) {
    var items = recipients.split(',');
    var recipients_col = [];

    for (var i = col - 1; i < items.length; i = i + 5) {
      //if (i % (col-1) === 0){
      recipients_col[recipients_col.length] = {
        memberId: items[i].trim(),
        name: '',
      };
      //}
    }

    return recipients_col;
  }

  getNestedTableData(row) {
    //let members = [];
    let members = '';
    this.props.allMembers.forEach(member => {
      JSON.parse(row['recipients']).forEach(recipient => {
        if (recipient === member['id']) {
          //members.push(member.values['Member ID']);
          members += member.values['Member ID'] + ', ';
        }
      });
    });
    this.props.allLeads.forEach(lead => {
      JSON.parse(row['recipients']).forEach(recipient => {
        if (recipient === lead['id']) {
          //members.push(member.values['Member ID']);
          members += lead['id'] + ', ';
        }
      });
    });

    let recipients_col1 = this.getRecipients(members, 1);
    let recipients_col2 = this.getRecipients(members, 2);
    let recipients_col3 = this.getRecipients(members, 3);
    let recipients_col4 = this.getRecipients(members, 4);
    let recipients_col5 = this.getRecipients(members, 5);

    return [
      {
        recipients: {
          recipients_col1: recipients_col1,
          recipients_col2: recipients_col2,
          recipients_col3: recipients_col3,
          recipients_col4: recipients_col4,
          recipients_col5: recipients_col5,
        },
      },
    ];
  }

  render() {
    return (
      <div>
        <div className="row">
          <div className="pageHeader">
            <h3>SMSes Sent</h3>
          </div>
        </div>
        <div
          id="campaignsListGrid"
          className="row"
          style={{ marginTop: '10px' }}
        >
          <div className="col">
            <ReactTable
              columns={this._columns}
              data={this.state.smsCampaigns}
              defaultPageSize={
                this.state.smsCampaigns.length
                  ? this.state.smsCampaigns.length
                  : 2
              }
              pageSize={
                this.state.smsCampaigns.length
                  ? this.state.smsCampaigns.length
                  : 2
              }
              showPagination={false}
              style={{
                /*height: '500px',*/
                borderLeft: '0 !important',
              }}
              ref="smsCampaignsListGrid"
              SubComponent={row => {
                return (
                  <div style={{ padding: '20px' }}>
                    <ReactTable
                      data={this.getNestedTableData(row.original)}
                      columns={this._getNestedTableColumns(row)}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                );
              }}
            />
            {
              <a
                onClick={e => {
                  console.log('Show More..');
                  this.props.fetchSmsCampaigns({
                    setSmsCampaigns: this.props.setSmsCampaigns,
                    nextPageToken: this.state.smsNextPageToken,
                  });
                }}
                className="btn btn-primary showMore"
                disabled={this.state.smsNextPageToken === undefined}
                style={{ marginLeft: '10px', color: 'white' }}
              >
                Show More
              </a>
            }
          </div>
        </div>
      </div>
    );
  }
}

export class IndividualSmsList extends Component {
  constructor(props) {
    super(props);
    let individualSMS = this.getData(this.props.individualSMS);
    this._columns = this.getColumns();

    this.state = {
      individualSMS,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.individualSMS) {
      this.setState({
        individualSMS: this.getData(nextProps.individualSMS),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.getIndividualSMS({
      setIndividualSMS: this.props.setIndividualSMS,
    });
  }

  getColumns = () => {
    return [
      { accessor: 'content', Header: 'Content', width: '90%' },
      { accessor: 'sentDate', Header: 'Date', maxWidth: 150 },
      {
        accessor: 'to',
        Header: 'Recipient',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        maxWidth: 150,
        Cell: props => {
          let values = props.value.split(',');
          let value = values[1];
          let type = values[2] === 'Member' ? 'Member' : 'LeadDetail';
          this.props.allMembers.forEach(member => {
            if (values[0] === member['id']) {
              value =
                member.values['First Name'] + ' ' + member.values['Last Name'];
              return;
            }
          });

          this.props.allLeads.forEach(lead => {
            if (values[0] === lead['id']) {
              value =
                lead.values['First Name'] + ' ' + lead.values['Last Name'];
              return;
            }
          });
          return (
            <NavLink to={`/${type}/${values[0]}`} className="">
              {value}
            </NavLink>
          );
        },
      },
    ];
  };

  getData(individualSms) {
    if (!individualSms) {
      return [];
    }

    const data = individualSms
      .sort((a, b) => {
        let aDate = moment(a['Date'], email_received_date_format);
        let bDate = moment(b['Date'], email_received_date_format);
        if (aDate.isBefore(bDate)) {
          return 1;
        } else if (aDate.isAfter(bDate)) {
          return -1;
        }
        return 0;
      })
      .map(sms => {
        return {
          content: sms['Content'],
          sentDate: moment(sms['Date'], email_received_date_format).format(
            'L h:mm A',
          ),
          to: sms['id'] + ',' + sms['To'] + ',' + sms['Type'],
        };
      });
    return data;
  }

  render() {
    return this.props.individualSMSLoading ? (
      <div />
    ) : (
      <div>
        <div className="row">
          <div className="pageHeader">
            <h3>Individual SMS Sent</h3>
          </div>
        </div>
        <div
          id="campaignsListGrid"
          className="row"
          style={{ marginTop: '10px' }}
        >
          <div className="col">
            <ReactTable
              columns={this._columns}
              data={this.state.individualSMS}
              defaultPageSize={
                this.state.individualSMS.length
                  ? this.state.individualSMS.length
                  : 2
              }
              pageSize={
                this.state.individualSMS.length
                  ? this.state.individualSMS.length
                  : 2
              }
              showPagination={false}
              style={{
                /*height: '500px',*/
                borderLeft: '0 !important',
              }}
              ref="individualSmsListGrid"
            />
          </div>
        </div>
      </div>
    );
  }
}

export class CreateCampaign extends Component {
  render() {
    return (
      <div className="options">
        <div className="memberOptions">
          <h4 className="title">Members</h4>
          <div className="row">
            <div className="col-md-2">
              <NavLink
                to={`/NewEmailCampaign/member`}
                className="btn btn-primary"
              >
                Email Send
              </NavLink>
            </div>
            <div className="col-md-1">OR</div>
            <div className="col-md-2">
              <NavLink
                to={`/NewSmsCampaign/member`}
                className="btn btn-primary"
              >
                SMS Send
              </NavLink>
            </div>
          </div>
        </div>
        <div className="leadOptions">
          <h4 className="title">Leads</h4>
          <div className="row">
            <div className="col-md-2">
              <NavLink
                to={`/NewEmailCampaign/lead`}
                disabled={
                  this.props.allLeads.length === 0 && !this.props.leadsLoading
                }
                className="btn btn-primary"
              >
                Email Send
              </NavLink>
            </div>
            <div className="col-md-1">OR</div>
            <div className="col-md-2">
              <NavLink
                to={`/NewSmsCampaign/lead`}
                disabled={
                  this.props.allLeads.length === 0 && !this.props.leadsLoading
                }
                className="btn btn-primary"
              >
                SMS Send
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const CampaignView = ({
  emailCampaigns,
  emailCampaignsLoading,
  smsCampaigns,
  fetchEmailCampaigns,
  setEmailCampaigns,
  updateCampaign,
  fetchSmsCampaigns,
  setSmsCampaigns,
  updateSmsCampaign,
  smsCampaignLoading,
  allMembers,
  allLeads,
  leadsLoading,
  individualSMS,
  individualSMSLoading,
  getIndividualSMS,
  setIndividualSMS,
}) => (
  <div className="container-fluid leads">
    <StatusMessagesContainer />
    <div className="">
      <div className="leadContents">
        <CreateCampaign allLeads={allLeads} leadsLoading={leadsLoading} />
      </div>
      <div className="taskContents">
        <EmailCampaignsList
          emailCampaignsLoading={emailCampaignsLoading}
          fetchEmailCampaigns={fetchEmailCampaigns}
          setEmailCampaigns={setEmailCampaigns}
          emailCampaigns={emailCampaigns}
          updateCampaign={updateCampaign}
          allMembers={allMembers}
          allLeads={allLeads}
        />
      </div>
      <div className="taskContents">
        <SmsCampaignsList
          smsCampaigns={smsCampaigns}
          fetchSmsCampaigns={fetchSmsCampaigns}
          setSmsCampaigns={setSmsCampaigns}
          updateSmsCampaign={updateSmsCampaign}
          allMembers={allMembers}
          allLeads={allLeads}
        />
      </div>
      <div className="taskContents">
        <IndividualSmsList
          individualSMSLoading={individualSMSLoading}
          individualSMS={individualSMS}
          getIndividualSMS={getIndividualSMS}
          setIndividualSMS={setIndividualSMS}
          allMembers={allMembers}
          allLeads={allLeads}
        />
      </div>
    </div>
  </div>
);

export const CampaignContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({}) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({}),
  lifecycle({
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      if (this.props.allLeads.length === 0) {
        this.props.fetchLeads();
      }
      this.props.fetchEmailCampaigns({
        setEmailCampaigns: this.props.setEmailCampaigns,
        nextPageToken: undefined,
      });
      this.props.getIndividualSMS({
        setIndividualSMS: this.props.setIndividualSMS,
        nextPageToken: undefined,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      /*      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchEmailCampaigns({
          setEmailCampaigns: this.props.setEmailCampaigns,
        });
        this.props.getIndividualSMS({setIndividualSMS: this.props.setIndividualSMS});
      }
*/
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(CampaignView);

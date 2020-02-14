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
import { KappNavLink as NavLink } from 'common';
import $ from 'jquery';
import ReactSpinner from 'react16-spinjs';
import 'react-datetime/css/react-datetime.css';
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  allMembers: state.member.members.allMembers,
  pathname: state.router.location.pathname,
  emailCampaigns: state.member.campaigns.allEmailCampaigns,
  emailCampaignsLoading: state.member.campaigns.emailCampaignsLoading,
  smsCampaigns: state.member.campaigns.allSmsCampaigns,
  smsCampaignsLoading: state.member.campaigns.smsCampaignsLoading,
});
const mapDispatchToProps = {
  fetchEmailCampaigns: actions.fetchEmailCampaigns,
  setEmailCampaigns: actions.setEmailCampaigns,
  fetchSmsCampaigns: actions.fetchSmsCampaigns,
  setSmsCampaigns: actions.setSmsCampaigns,
};

export class EmailCampaignsList extends Component {
  constructor(props) {
    super(props);
    let emailCampaigns = this.getData(this.props.emailCampaigns);
    this._columns = this.getColumns();
    this.getNestedTableData = this.getNestedTableData.bind(this);
    this._nestedTableColumns = this.getNestedTableColumns();

    this.state = {
      emailCampaigns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.emailCampaigns) {
      this.setState({
        emailCampaigns: this.getData(nextProps.emailCampaigns),
      });
    }
  }

  getColumns = () => {
    return [
      { accessor: 'subject', Header: 'Subject', width: '90%' },
      { accessor: 'sentDate', Header: 'Sent On', maxWidth: 150 },
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
        Header: 'Attachments',
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

    const data = emailCampaigns.map(campaign => {
      return {
        _id: campaign['id'],
        subject: campaign.values['Subject'],
        sentDate: campaign.values['Sent Date'],
        recipients: campaign.values['Recipients'],
        body: campaign.values['Body'],
        opened: campaign.values['Opened By Members'],
        clicked: campaign.values['Clicked By Members'],
        attachments: campaign.values['Attachments'],
      };
    });
    return data;
  }

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
        maxWidth: 200,
      },
      {
        accessor: 'attachments',
        Header: 'Attachments',
        headerClassName: 'attachments_col',
        className: 'attachments_col',
        style: { whiteSpace: 'unset' },
      },
    ];
  }

  getNestedTableData(row) {
    //let members = [];
    let members = '';
    this.props.allMembers.forEach(member => {
      JSON.parse(row['recipients']).forEach(recipient => {
        if (recipient === member['id']) {
          if (members !== '') members += ', ';
          members += member.values['Email'];
        }
      });
    });
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
          </div>
        </div>
      </div>
    );
  }
}

export class SmsCampaignsList extends Component {
  constructor(props) {
    super(props);
    let smsCampaigns = this.getData(this.props.smsCampaigns);
    this._columns = this.getColumns();
    this.getNestedTableData = this.getNestedTableData.bind(this);
    this._nestedTableColumns = this.getNestedTableColumns();

    this.state = {
      smsCampaigns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.smsCampaigns) {
      this.setState({
        smsCampaigns: this.getData(nextProps.smsCampaigns),
      });
    }
  }

  componentWillMount() {
    this.props.fetchSmsCampaigns({
      setSmsCampaigns: this.props.setSmsCampaigns,
    });
  }

  getColumns = () => {
    return [
      { accessor: 'content', Header: 'Content', width: '90%' },
      { accessor: 'sentDate', Header: 'Sent On', maxWidth: 150 },
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

    const data = smsCampaigns.map(campaign => {
      return {
        _id: campaign['id'],
        content: campaign.values['SMS Content'],
        sentDate: campaign.values['Sent Date'],
        recipients: campaign.values['Recipients'],
      };
    });
    return data;
  }

  getNestedTableColumns(row) {
    return [
      {
        accessor: 'recipients',
        Header: 'Recipients',
        headerClassName: 'recipients_col',
        className: 'recipients_col',
        style: { whiteSpace: 'unset' },
        maxWidth: '100%',
      },
    ];
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
    return [
      {
        recipients: members,
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
                      columns={this._nestedTableColumns}
                      defaultPageSize={1}
                      showPagination={false}
                    />
                  </div>
                );
              }}
            />
          </div>
        </div>
      </div>
    );
  }
}

export class CreateCampaign extends Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="">
        <div className="row">
          <div className="col-md-2">
            <NavLink
              to={`/NewEmailCampaign`}
              className="btn btn-primary"
              style={{
                borderRadius: '0',
                backgroundColor: '#991B1E',
                height: '30px',
                width: 'auto',
              }}
            >
              Email Send
            </NavLink>
          </div>
          <div className="col-md-1">OR</div>
          <div className="col-md-2">
            <NavLink
              to={`/NewSmsCampaign`}
              className="btn btn-primary"
              style={{
                borderRadius: '0',
                backgroundColor: '#991B1E',
                height: '30px',
                width: 'auto',
              }}
            >
              SMS Send
            </NavLink>
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
  fetchSmsCampaigns,
  setSmsCampaigns,
  smsCampaignLoading,
  allMembers,
}) =>
  emailCampaignsLoading ? (
    <ReactSpinner />
  ) : (
    <div className="container-fluid leads">
      <StatusMessagesContainer />
      <div className="">
        <div className="leadContents">
          <CreateCampaign />
        </div>
        <div className="taskContents">
          <EmailCampaignsList
            emailCampaigns={emailCampaigns}
            allMembers={allMembers}
          />
        </div>
        <div className="taskContents">
          <SmsCampaignsList
            smsCampaigns={smsCampaigns}
            fetchSmsCampaigns={fetchSmsCampaigns}
            setSmsCampaigns={setSmsCampaigns}
            allMembers={allMembers}
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
    componentWillMount() {
      this.props.fetchEmailCampaigns({
        setEmailCampaigns: this.props.setEmailCampaigns,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchEmailCampaigns({
          setEmailCampaigns: this.props.setEmailCampaigns,
        });
      }
    },
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(CampaignView);

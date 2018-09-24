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
  allCampaigns: state.member.campaigns.allCampaigns,
  campaignsLoading: state.member.campaigns.campaignsLoading,
});
const mapDispatchToProps = {
  fetchCampaigns: actions.fetchCampaigns,
  setCampaigns: actions.setCampaigns,
};

export class CampaignsList extends Component {
  constructor(props) {
    super(props);
    let campaigns = this.getData(this.props.allCampaigns);
    this._columns = this.getColumns();
    this.getNestedTableData = this.getNestedTableData.bind(this);
    this._nestedTableColumns = this.getNestedTableColumns();

    this.state = {
      campaigns,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allCampaigns) {
      this.setState({
        campaigns: this.getData(nextProps.allCampaigns),
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

  getData(campaigns) {
    if (!campaigns) {
      return [];
    }

    const data = campaigns.map(campaign => {
      return {
        _id: campaign['id'],
        subject: campaign.values['Subject'],
        sentDate: campaign.values['Sent Date'],
        recipients: campaign.values['Recipients'],
        body: campaign.values['Body'],
        opened: campaign.values['Opened By Members'],
        clicked: campaign.values['Clicked By Members'],
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
        body: <span dangerouslySetInnerHTML={{ __html: row['body'] }} />,
        recipients: members,
      },
    ];
  }

  render() {
    return (
      <div>
        <div className="row">
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
              data={this.state.campaigns}
              defaultPageSize={
                this.state.campaigns.length ? this.state.campaigns.length : 2
              }
              pageSize={
                this.state.campaigns.length ? this.state.campaigns.length : 2
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
              to={`/NewManualCampaign`}
              className="btn btn-primary"
              style={{
                borderRadius: '0',
                backgroundColor: '#991B1E',
                height: '30px',
                width: 'auto',
              }}
            >
              Manual Send
            </NavLink>
          </div>
          <div className="col-md-1">OR</div>
          <div className="col-md-2">
            <NavLink
              to={`/NewAutomaticCampaign`}
              className="btn btn-primary"
              style={{
                borderRadius: '0',
                backgroundColor: '#991B1E',
                height: '30px',
                width: 'auto',
              }}
            >
              Automatic Send
            </NavLink>
          </div>
        </div>
      </div>
    );
  }
}

export const CampaignView = ({ allCampaigns, campaignsLoading, allMembers }) =>
  campaignsLoading ? (
    <ReactSpinner />
  ) : (
    <div className="container-fluid leads">
      <StatusMessagesContainer />
      <div className="row">
        <div className="leadContents">
          <CreateCampaign allCampaigns={allCampaigns} />
        </div>
        <div className="taskContents">
          <CampaignsList allCampaigns={allCampaigns} allMembers={allMembers} />
        </div>
      </div>
    </div>
  );

export const CampaignContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({}) => {
    return {};
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({}),
  lifecycle({
    componentWillMount() {
      this.props.fetchCampaigns({ setCampaigns: this.props.setCampaigns });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCampaigns({ setCampaigns: this.props.setCampaigns });
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(CampaignView);

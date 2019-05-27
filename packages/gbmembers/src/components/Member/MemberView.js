import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import phoneIcon from '../../images/phone.svg?raw';
import emailIcon from '../../images/envelop.svg?raw';
import dobIcon from '../../images/reddit.svg?raw';
import aidIcon from '../../images/aid-kit.svg?raw';
import viewNotes from '../../images/view_notes.png?raw';
import SVGInline from 'react-svg-inline';
import { KappNavLink as NavLink } from 'common';
import { PaymentPeriod, PaymentType } from './BillingUtils';
import NumberFormat from 'react-number-format';
import $ from 'jquery';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import ReactTable from 'react-table';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import ReactSpinner from 'react16-spinjs';
import { actions as teamActions } from '../../redux/modules/teams';
import { CallScriptModalContainer } from './CallScriptModalContainer';
import { SMSModalContainer } from './SMSModalContainer';
import { EmailsReceived } from './EmailsReceived';
import { MemberEmails } from './MemberEmails';
import { Requests } from './Requests';
import { actions as campaignActions } from '../../redux/modules/campaigns';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  currentMemberLoading: state.member.members.currentMemberLoading,
  allMembers: state.member.members.allMembers,
  campaignItem: state.member.campaigns.campaignItem,
  campaignLoading: state.member.campaigns.campaignLoading,
  newCustomers: state.member.members.newCustomers,
  newCustomersLoading: state.member.members.newCustomersLoading,
  space: state.member.app.space,
  isBillingUser: state.member.teams.isBillingUser,
  isBillingUserLoading: state.member.teams.isBillingUserLoading,
  isSmsEnabled: state.member.app.isSmsEnabled,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  updateMember: actions.updateMember,
  fetchCampaign: campaignActions.fetchCampaign,
  syncBillingCustomer: actions.syncBillingCustomer,
  setBillingInfo: actions.setBillingInfo,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchNewCustomers: actions.fetchNewCustomers,
  setNewCustomers: actions.setNewCustomers,
  fetchMembers: actions.fetchMembers,
  fetchIsBillingUser: teamActions.fetchIsBillingUser,
};

export class NewCustomers extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowNewCustomers(false);
  };
  constructor(props) {
    super(props);
    this.getData = this.getData.bind(this);
    this.syncCustomer = this.syncCustomer.bind(this);
    let data = this.getData(this.props.newCustomers);
    this.columns = this.getColumns();
    this.state = {
      data,
    };
  }
  componentWillReceiveProps(nextProps) {
    if (nextProps.newCustomers.length !== this.props.newCustomers.length) {
      this.setState({
        data: this.getData(nextProps.newCustomers),
      });
    }
  }
  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }
  componentDidMount() {
    this.props.getNewCustomers();
  }
  syncCustomer(billingId) {
    this.props.syncBilling(billingId);
    this.props.setShowNewCustomers(false);
  }
  getData(newCustomers) {
    if (!newCustomers || newCustomers.length <= 0) {
      return [];
    }
    let data = newCustomers.map(customer => {
      return {
        _id: customer['customerBillingId'],
        firstName: customer.customerFirstName,
        lastName: customer.customerName,
        email: customer.email,
        customerReference: customer.customerReference,
      };
    });
    return data;
  }
  getColumns(data) {
    const columns = [
      { accessor: 'firstName', Header: 'First Name' },
      { accessor: 'lastName', Header: 'Last Name' },
      { accessor: 'email', Header: 'Email' },
      { accessor: 'customerReference', Header: 'Billing Reference' },
      {
        accessor: '$sync',
        Cell: row => (
          <button
            type="button"
            className="btn btn-primary"
            onClick={e => this.syncCustomer(row.original['customerReference'])}
          >
            Sync Customer
          </button>
        ),
      },
    ];
    return columns;
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog className="newCustomers" onClose={this.handleClose}>
            {this.props.newCustomersLoading ? (
              <div>
                Loading... <ReactSpinner />
              </div>
            ) : (
              <span>
                <h1>New Customers</h1>
                <div>
                  <ReactTable
                    columns={this.columns}
                    data={this.state.data}
                    className="-striped -highlight"
                    defaultPageSize={this.state.data.length}
                    pageSize={this.state.data.length}
                    showPagination={false}
                  />
                </div>
              </span>
            )}
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

export class BillingParentInfo extends Component {
  constructor(props) {
    super(props);
    this.memberId = this.props.memberId;
    this.allMembers = this.props.allMembers;
    this.member = undefined;
    for (var j = 0; j < this.props.allMembers.length; j++) {
      if (this.props.allMembers[j].id === this.memberId) {
        this.member = this.props.allMembers[j];
        break;
      }
    }
  }

  render() {
    return this.member ? (
      <p>
        Family Member of
        <NavLink
          to={`/Member/${this.props.memberId}`}
          className={'nav-link icon-wrapper'}
          activeClassName="active"
          style={{ display: 'inline' }}
        >
          {this.member.values['First Name']} {this.member.values['Last Name']}
        </NavLink>
      </p>
    ) : null;
  }
}

export const MemberView = ({
  memberItem,
  allMembers,
  saveMember,
  showViewNotes,
  setShowViewNotes,
  isDirty,
  setIsDirty,
  currentMemberLoading,
  fetchCampaign,
  campaignItem,
  campaignLoading,
  syncBilling,
  newCustomers,
  getNewCustomers,
  showNewCustomers,
  setShowNewCustomers,
  newCustomersLoading,
  space,
  isBillingUser,
  setShowCallScriptModal,
  showCallScriptModal,
  setShowSMSModal,
  showSMSModal,
  isSmsEnabled,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <div className="memberDetails">
      <StatusMessagesContainer />
      <div className="general">
        <div className="userDetails">
          <img
            src={memberItem.values['Photo']}
            alt="Member Photograph"
            className="photo"
          />
          <span className="details1">
            <h1>
              {memberItem.values['First Name']} {memberItem.values['Last Name']}
            </h1>
            <h1>
              &nbsp;(
              {memberItem.values['Member Type']}
              )&nbsp;
            </h1>
            <h1>
              {memberItem.values['Status'] === 'Active'
                ? 'ACTIVE'
                : memberItem.values['Status']}
            </h1>
            <span className="buttons">
              <NavLink
                to={`/NewManualCampaign/${memberItem.id}/member`}
                className="btn btn-primary"
              >
                Send Email
              </NavLink>
              <a
                onClick={e => setShowSMSModal(true)}
                className="btn btn-primary"
                style={{ marginLeft: '10px', color: 'white' }}
                disabled={!isSmsEnabled}
              >
                Send SMS
              </a>
              {showSMSModal && (
                <SMSModalContainer
                  submission={memberItem}
                  target="Member"
                  setShowSMSModal={setShowSMSModal}
                />
              )}
              <NavLink
                to={`/Edit/${memberItem.id}`}
                className="btn btn-primary"
              >
                Edit
              </NavLink>
            </span>
            <p className="address">
              {memberItem.values['Address']}, {memberItem.values['Suburb']},{' '}
              {memberItem.values['State']} {memberItem.values['Postcode']}
            </p>
          </span>
          <span className="details2">
            <div className="iconItem">
              <SVGInline svg={emailIcon} className="icon" />
              <span className="value">
                <NavLink to={`/NewManualCampaign/${memberItem.id}/member`}>
                  {memberItem.values['Email']}
                </NavLink>
              </span>
            </div>
            <div className="iconItem">
              <SVGInline svg={phoneIcon} className="icon" />
              <span className="value">
                <a href={'tel:' + memberItem.values['Phone Number']}>
                  <NumberFormat
                    value={memberItem.values['Phone Number']}
                    displayType={'text'}
                    format="+1 (###) ###-####"
                  />
                </a>
              </span>
            </div>
            <div className="iconItem">
              <SVGInline svg={dobIcon} className="icon" />
              <span className="value">
                {new Date(memberItem.values['DOB']).toLocaleDateString()}
              </span>
            </div>
          </span>
        </div>
      </div>
      <div className="emergency">
        <div className="iconItem">
          <SVGInline svg={aidIcon} className="icon" />
          <span className="value">
            {memberItem.values['Emergency Contact Name']} (
            {memberItem.values['Emergency Contact Relationship']}){' '}
            <NumberFormat
              className="emergencyNumber"
              value={memberItem.values['Emergency Contact Phone']}
              displayType={'text'}
              format="+1 (###) ###-####"
            />
          </span>
        </div>
      </div>
      <div className="userDetails2">
        <div className="ranking">
          <h4>Rank</h4>
          <div className="program">
            <p>
              {memberItem.values['Ranking Program']}-
              {memberItem.values['Ranking Belt']}
            </p>
          </div>
          <div className="row">
            <div className="form-group col-xs-6 col-md-6">
              <h6>Last Promotion</h6>
              <p>
                {new Date(
                  memberItem.values['Last Promotion'],
                ).toLocaleDateString()}
              </p>
            </div>
            <div className="form-group col-xs-6 col-md-6">
              <h6>Next Scheduled Promotion</h6>
              <p>
                {new Date(
                  memberItem.values['Next Schedule Promotion'],
                ).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
        <div className="billing">
          <h4>Billing</h4>
          <div
            className={
              memberItem.values['Billing Customer Id'] !== undefined &&
              memberItem.values['Billing Customer Id'] !== ''
                ? 'billingInfo show'
                : 'hide'
            }
          >
            <p>
              Recurring{' '}
              <PaymentPeriod
                period={memberItem.values['Billing Payment Period']}
              />
              &nbsp; plan with{' '}
              <PaymentType type={memberItem.values['Billing Payment Type']} />
            </p>
            <NavLink
              to={`/Billing/${memberItem.id}`}
              className="btn btn-primary"
            >
              Edit Billing
            </NavLink>
          </div>
          <div
            className={
              memberItem.values['Billing Customer Id'] === undefined ||
              memberItem.values['Billing Customer Id'] === ''
                ? 'billingInfo show'
                : 'hide'
            }
          >
            <BillingParentInfo
              memberId={memberItem.values['Billing Parent Member']}
              allMembers={allMembers}
            />
            <NavLink
              to={`/Billing/${memberItem.id}`}
              className="btn btn-primary"
            >
              Edit Billing
            </NavLink>
          </div>
          <div>
            <br />
            <button
              type="button"
              className={'btn btn-primary'}
              onClick={e => setShowNewCustomers(true)}
            >
              Show New Customers
            </button>
            {showNewCustomers && (
              <NewCustomers
                getNewCustomers={getNewCustomers}
                setShowNewCustomers={setShowNewCustomers}
                newCustomersLoading={newCustomersLoading}
                syncBilling={syncBilling}
                newCustomers={newCustomers}
              />
            )}
          </div>
          <div
            style={{
              display: isBillingUser ? 'block' : 'none',
            }}
          >
            <br />
            <button
              type="button"
              className={'btn btn-primary'}
              onClick={e => syncBilling()}
            >
              Sync Billing Info
            </button>
            <input
              type="text"
              name="customerBillingId"
              id="customerBillingId"
            />
            <label htmlFor="customerBillingId">Billing Id</label>
          </div>
          <div>
            <br />
            <button
              type="button"
              className={'btn btn-primary'}
              onClick={e => setShowCallScriptModal(true)}
            >
              View Call Scripts
            </button>
            {showCallScriptModal && (
              <CallScriptModalContainer
                scriptTarget="Members"
                setShowCallScriptModal={setShowCallScriptModal}
              />
            )}
          </div>
        </div>
      </div>
      <div className="row">
        <div className="notesLabel">
          <label
            htmlFor="notes"
            style={{ fontSize: '24px', fontWeight: '700' }}
          >
            Notes
          </label>
        </div>
        <div className="viewNotes">
          <a className="cursorPointer">
            <img
              style={{ border: 'none', width: '127px', height: '23px' }}
              src={viewNotes}
              alt="View Notes"
              title="View notes"
              onClick={e => setShowViewNotes(true)}
            />
          </a>
        </div>
      </div>
      <div className="row">
        <div className="col-sm-10 notes">
          <div className="form-group">
            <textarea
              rows="6"
              style={{ width: '100%' }}
              id="memberNote"
              className="form-control"
              ref={input => (this.input = input)}
              placeholder="Start Typing for notes"
              onChange={e => setIsDirty(true)}
            />
          </div>
        </div>
        <div className="col-sm-2 notesButton">
          <button
            type="button"
            className={
              isDirty
                ? 'btn btn-primary dirty notesButton'
                : 'btn btn-primary notDirty notesButton'
            }
            onClick={e => saveMember()}
          >
            Save Notes
          </button>
          <NavLink
            to={`/MemberFollowUp/${memberItem.id}`}
            className="btn btn-primary float-left followup_button followup_image notesButton"
          >
            Set Follow Up
          </NavLink>
        </div>
      </div>
      <div className="row">
        {showViewNotes && (
          <ViewNotes
            memberItem={memberItem}
            setShowViewNotes={setShowViewNotes}
            space={space}
          />
        )}
      </div>
      <div>
        <MemberEmails
          memberItem={memberItem}
          fetchCampaign={fetchCampaign}
          campaignItem={campaignItem}
          campaignLoading={campaignLoading}
          space={space}
        />
      </div>
      <div>
        <EmailsReceived submission={memberItem} />
      </div>
      <div>
        <Requests submission={memberItem} />
      </div>
    </div>
  );

export const MemberViewContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withState('isDirty', 'setIsDirty', false),
  withState('showViewNotes', 'setShowViewNotes', false),
  withState('showNewCustomers', 'setShowNewCustomers', false),
  withState('showCallScriptModal', 'setShowCallScriptModal', false),
  withState('showSMSModal', 'setShowSMSModal', false),
  withHandlers({
    saveMember: ({ memberItem, updateMember, setIsDirty }) => () => {
      let note = $('#memberNote').val();
      if (!note) {
        return;
      }

      let notesHistory = memberItem.values['Notes History'];
      if (!notesHistory) {
        notesHistory = [];
      } else if (typeof notesHistory !== 'object') {
        notesHistory = JSON.parse(notesHistory);
      }

      notesHistory.push({
        note: note,
        contactDate: moment().format(contact_date_format),
      });
      memberItem.values['Notes History'] = notesHistory;
      updateMember({
        id: memberItem.id,
        memberItem,
      });
      $('#memberNote').val('');
      setIsDirty(false);
    },
    syncBilling: ({
      memberItem,
      updateMember,
      syncBillingCustomer,
      setBillingInfo,
      fetchCurrentMember,
      fetchMembers,
      addNotification,
      setSystemError,
    }) => billingId => {
      let billingRef = null;
      if (billingId) {
        billingRef = billingId;
      } else {
        billingRef = $('#customerBillingId').val();
      }
      if (!billingRef) {
        console.log('Customer billing Id is required for syncing member');
        return;
      }
      syncBillingCustomer({
        billingRef: billingRef,
        memberItem: memberItem,
        myThis: this,
        updateMember: updateMember,
        setBillingInfo: setBillingInfo,
        fetchCurrentMember: fetchCurrentMember,
        fetchMembers: fetchMembers,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    getNewCustomers: ({
      fetchNewCustomers,
      setNewCustomers,
      addNotification,
      setSystemError,
    }) => () => {
      console.log('#### in getNewCustomers ');
      fetchNewCustomers({
        setNewCustomers: setNewCustomers,
        addNotification: addNotification,
        setSystemError: setSystemError,
      });
    },
    updateIsNewReplyReceived: ({
      memberItem,
      updateMember,
      fetchMembers,
      addNotification,
      setSystemError,
    }) => () => {
      memberItem.values['Is New Reply Received'] = false;
      updateMember({
        id: memberItem.id,
        memberItem,
        fetchMembers,
        addNotification,
        setSystemError,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchCurrentMember({ id: this.props.match.params.id });
      this.props.fetchIsBillingUser();
    },
    componentWillReceiveProps(nextProps) {
      //$('#mainContent').offset({ top: 98});
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({ id: nextProps.match.params.id });
      }
      if (
        nextProps.memberItem.values &&
        nextProps.memberItem.values['Is New Reply Received'] === 'true'
      ) {
        this.props.updateIsNewReplyReceived();
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(MemberView);

class ViewNotes extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowViewNotes(false);
  };

  constructor(props) {
    super(props);
    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();

    this.state = {
      data,
    };
  }

  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  getColumns() {
    return [
      { accessor: 'note', Header: 'Note', style: { whiteSpace: 'unset' } },
      { accessor: 'contactDate', Header: 'Created Date' },
    ];
  }

  getData(memberItem) {
    let histories = memberItem.values['Notes History'];
    if (!histories) {
      return [];
    } else if (typeof histories !== 'object') {
      histories = JSON.parse(histories);
    }

    return histories.sort(function(history1, history2) {
      if (
        moment(history1.contactDate, contact_date_format).isAfter(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return -1;
      }
      if (
        moment(history1.contactDate, contact_date_format).isBefore(
          moment(history2.contactDate, contact_date_format),
        )
      ) {
        return 1;
      }
      return 0;
    });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose} style={{ width: '90vw' }}>
            <ModalDialog style={{ width: '50%' }} onClose={this.handleClose}>
              <h1>
                Notes for {this.props.memberItem.values['First Name']}{' '}
                {this.props.memberItem.values['Last Name']}
              </h1>
              <ReactTable
                columns={this._columns}
                data={this.state.data}
                defaultPageSize={this.state.data.length}
                pageSize={this.state.data.length}
                showPagination={false}
                style={{
                  height: '60vh',
                }}
              />
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

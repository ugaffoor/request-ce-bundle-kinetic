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
import printerIcon from '../../images/printer.svg?raw';
import statsBarIcon from '../../images/stats-bars.svg?raw';
import SVGInline from 'react-svg-inline';
import html2canvas from 'html2canvas';
import { KappNavLink as NavLink } from 'common';
import { PaymentPeriod, PaymentType } from './BillingUtils';
import NumberFormat from 'react-number-format';
import $ from 'jquery';
import moment from 'moment';
import { contact_date_format } from '../leads/LeadsUtils';
import ReactTable from 'react-table';
import Barcode from 'react-barcode';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import ReactSpinner from 'react16-spinjs';
import { CallScriptModalContainer } from './CallScriptModalContainer';
import { SMSModalContainer } from './SMSModalContainer';
import { EmailsReceived } from './EmailsReceived';
import { MemberEmails } from './MemberEmails';
import { MemberViewNotes } from './MemberViewNotes';
import { GradingStatus } from '../attendance/GradingStatus';
import { AttendanceDialogContainer } from '../attendance/AttendanceDialog';
import { Requests } from './Requests';
import { MemberAttendanceContainer } from './MemberAttendance';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Utils } from 'common';
import { getProgramSVG, getBeltSVG } from './MemberUtils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  initialLoad: state.member.members.initialLoad,
  currentMemberLoading: state.member.members.currentMemberLoading,
  allMembers: state.member.members.allMembers,
  campaignItem: state.member.campaigns.emailCampaignItem,
  campaignLoading: state.member.campaigns.emailCampaignLoading,
  newCustomers: state.member.members.newCustomers,
  newCustomersLoading: state.member.members.newCustomersLoading,
  space: state.member.app.space,
  profile: state.member.app.profile,
  isSmsEnabled: state.member.app.isSmsEnabled,
  belts: state.member.app.belts,
  attendances: state.member.attendance.memberAttendances,
  attendancesLoading: state.member.attendance.fetchingMemberAttendances,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  updateMember: actions.updateMember,
  setCurrentMember: actions.setCurrentMember,
  fetchCampaign: campaignActions.fetchEmailCampaign,
  syncBillingCustomer: actions.syncBillingCustomer,
  setBillingInfo: actions.setBillingInfo,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchNewCustomers: actions.fetchNewCustomers,
  setNewCustomers: actions.setNewCustomers,
  fetchMembers: actions.fetchMembers,
  fetchMemberAttendances: attendanceActions.fetchMemberAttendances,
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
  }
  componentWillReceiveProps(nextProps) {
    //    if (this.member===undefined /*|| this.allMembers.length!==nextProps.allMembers.length){
    if (nextProps.memberId !== undefined) {
      for (var j = 0; j < nextProps.allMembers.length; j++) {
        if (nextProps.allMembers[j].id === nextProps.memberId) {
          this.member = nextProps.allMembers[j];
          break;
        }
      }
    } else {
      this.member = undefined;
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

export class AttendanceChart extends Component {
  constructor(props) {
    super(props);
    const data = this.getData(this.props.attendances);
    this.renderCusomizedLegend = this.renderCusomizedLegend.bind(this);
    let average = 0;
    this.state = {
      data,
      average,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.id !== nextProps.id) {
      this.props.fetchMemberAttendances({
        id: nextProps.id,
        fromDate: moment()
          .subtract(90, 'days')
          .format('YYYY-MM-DD'),
        toDate: moment().format('YYYY-MM-DD'),
      });
    }
    let data = this.getData(nextProps.attendances);
    let average = this.getAverage(data);
    this.setState({
      data: data,
      average: average,
    });
  }

  componentWillMount() {
    this.props.fetchMemberAttendances({
      id: this.props.id,
      fromDate: moment()
        .subtract(90, 'days')
        .format('YYYY-MM-DD'),
      toDate: moment().format('YYYY-MM-DD'),
    });
  }
  getAverage(data) {
    let total = 0;
    data.forEach((value, key) => {
      total += value['Count'];
    });
    return total / data.length;
  }

  getData(attendances) {
    if (!attendances || attendances.size === 0) {
      return [];
    }

    let attendanceMap = new Map();
    attendances.forEach(attendance => {
      let week = moment(attendance.values['Class Date']).week();
      if (attendanceMap.get(week) === undefined) {
        attendanceMap.set(week, 1);
      } else {
        let count = attendanceMap.get(week);
        attendanceMap.set(week, count + 1);
      }
    });

    let data = [];
    attendanceMap.forEach((value, key, map) => {
      data.push({ Week: key, Count: value });
    });
    data = data.sort(function(a, b) {
      return a['Week'] > b['Week'] ? 1 : b['Week'] > a['Week'] ? -1 : 0;
    });
    return data;
  }

  renderCusomizedLegend(props) {
    return (
      <ul
        className="recharts-default-legend"
        style={{ padding: '0px', margin: '0px', textAlign: 'center' }}
      >
        <li
          className="recharts-legend-item legend-item-0"
          style={{ display: 'inline-block', marginRight: '10px' }}
        >
          <svg
            className="recharts-surface"
            viewBox="0 0 32 32"
            version="1.1"
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              marginRight: '4px',
              width: '14px',
              height: '14px',
            }}
          ></svg>
        </li>
      </ul>
    );
  }

  yAxisTickFormatter(count) {
    return count;
  }

  xAxisTickFormatter(week) {
    let sunday = moment()
      .day('Sunday')
      .week(week);
    let saturday = moment()
      .day('Saturday')
      .week(week);

    return sunday.format('D MMM') + '-' + saturday.format('D MMM');
  }

  toolTipFormatter(value, name, payload) {
    return payload.value;
  }

  toolTipLabelFormatter(week) {
    let sunday = moment()
      .day('Sunday')
      .week(week);
    let saturday = moment()
      .day('Saturday')
      .week(week);

    return sunday.format('D MMM') + '-' + saturday.format('D MMM');
  }

  render() {
    const { data } = this.state;
    return (
      <span>
        {' '}
        <hr />
        <div
          className="page-header"
          style={{ textAlign: 'center', marginBottom: '3%' }}
        >
          <h6>Attendance {this.state.average} PER WEEK</h6>
        </div>
        <ResponsiveContainer minHeight={300}>
          <LineChart
            width={600}
            height={300}
            data={data}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="Week" tickFormatter={this.xAxisTickFormatter} />
            <YAxis
              tickFormatter={this.yAxisTickFormatter}
              label={{
                value: 'Count',
                angle: -90,
                position: 'insideLeft',
              }}
            />
            <Tooltip
              labelFormatter={this.toolTipLabelFormatter}
              formatter={this.toolTipFormatter}
            />
            <Legend content={this.renderCusomizedLegend} />
            <Line
              type="monotone"
              strokeWidth={2}
              dataKey="Count"
              fill="#8884d8"
              stackId="a"
            />
          </LineChart>
        </ResponsiveContainer>
      </span>
    );
  }
}

export const MemberView = ({
  memberItem,
  allMembers,
  saveMember,
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
  profile,
  setShowCallScriptModal,
  showCallScriptModal,
  setShowSMSModal,
  showSMSModal,
  isSmsEnabled,
  printBarcode,
  attendClasses,
  durationPeriod,
  initialLoad,
  belts,
  attendances,
  fetchMemberAttendances,
  showAttendanceDialog,
  setShowAttendanceDialog,
}) =>
  initialLoad ? (
    <div className="loading">
      <ReactSpinner />
    </div>
  ) : (
    <span>
      {currentMemberLoading ? (
        <div className="loading">
          <ReactSpinner />
        </div>
      ) : (
        <div />
      )}
      <div className="memberDetails">
        <StatusMessagesContainer />
        <div className="memberHeader">
          <div className="name">
            {memberItem.values['First Name']} {memberItem.values['Last Name']}
            &nbsp;({memberItem.values['Member Type']})
          </div>
          <div className="rankingImages">
            <div className="program">
              {getProgramSVG(memberItem.values['Ranking Program'])}
            </div>
            <div className="belt">
              {getBeltSVG(memberItem.values['Ranking Belt'])}
            </div>
          </div>
        </div>
        <div className="general">
          <div className="userDetails">
            {memberItem.values['Photo'] === undefined &&
            memberItem.values['First Name'] !== undefined ? (
              <span className="noPhoto">
                {memberItem.values['First Name'][0]}
                {memberItem.values['Last Name'][0]}
              </span>
            ) : (
              <img
                src={memberItem.values['Photo']}
                alt="Member Photograph"
                className="photo"
              />
            )}
            <span className="details1">
              <h1>
                {memberItem.values['First Name']}{' '}
                {memberItem.values['Last Name']}
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
                  to={`/NewEmailCampaign/${memberItem.id}/member`}
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
                {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
                  <div />
                ) : (
                  <NavLink
                    to={`/Edit/${memberItem.id}`}
                    className="btn btn-primary"
                  >
                    Edit
                  </NavLink>
                )}
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
                  <NavLink to={`/NewEmailCampaign/${memberItem.id}/member`}>
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
                      format="####-###-###"
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
                format="####-###-###"
              />
            </span>
          </div>
          <div className="memberBarcode">
            <Barcode
              value={memberItem.id.split('-')[4].substring(6, 12)}
              width={1.3}
              height={30}
              displayValue={false}
              type={'CODE128'}
            />
          </div>
          <SVGInline
            svg={printerIcon}
            className="icon barcodePrint"
            onClick={e => printBarcode()}
          />
        </div>
        <div
          className={
            memberItem.values['Lead Submission ID'] === undefined
              ? 'hide'
              : 'leadInfo'
          }
        >
          <NavLink
            to={`/LeadDetail/${memberItem.values['Lead Submission ID']}`}
            className="value"
          >
            Converted Lead
          </NavLink>
        </div>
        <div className="userDetails2">
          <div className="ranking">
            <h4>Rank</h4>
            <div className="program">
              <p>{memberItem.values['Ranking Program']}</p>
              <span placeholder="View Attendance">
                <SVGInline
                  svg={statsBarIcon}
                  className="icon statsbar"
                  onClick={e => setShowAttendanceDialog(true)}
                />
              </span>
              {showAttendanceDialog && (
                <AttendanceDialogContainer
                  setShowAttendanceDialog={setShowAttendanceDialog}
                  memberItem={memberItem}
                />
              )}
            </div>
            {memberItem.values['Last Promotion'] === undefined ? (
              <div className="nolastPromotion"> No Last promotion date set</div>
            ) : (
              <div className="beltProgress">
                <p>
                  <b>{memberItem.values['Ranking Belt']}</b> SINCE{' '}
                  <b>
                    {new Date(
                      memberItem.values['Last Promotion'],
                    ).toLocaleDateString()}
                  </b>
                </p>
                <GradingStatus
                  setIsDirty={setIsDirty}
                  memberItem={memberItem}
                  belts={belts}
                  allMembers={allMembers}
                />
                <div></div>
              </div>
            )}
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
              {!Utils.isMemberOf(profile, 'Billing') ? (
                <div />
              ) : (
                <NavLink
                  to={`/Billing/${memberItem.id}`}
                  className="btn btn-primary"
                >
                  Billing
                </NavLink>
              )}
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
            </div>
            <div
              style={{
                display: Utils.isMemberOf(profile, 'Billing')
                  ? 'block'
                  : 'none',
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
        <div>
          <MemberViewNotes memberItem={memberItem} />
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
        {/*      <div>
        <AttendanceChart
          id={memberItem.id}
          attendances={attendances}
          fetchMemberAttendances={fetchMemberAttendances}
        />
      </div>
      <div>
        <MemberAttendanceContainer id={memberItem.id} />
      </div>
*/}
      </div>
    </span>
  );

export const MemberViewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withState('isDirty', 'setIsDirty', false),
  withState('showNewCustomers', 'setShowNewCustomers', false),
  withState('showCallScriptModal', 'setShowCallScriptModal', false),
  withState('showAttendanceDialog', 'setShowAttendanceDialog', false),
  withState('showSMSModal', 'setShowSMSModal', false),
  withState('attendClasses', 'setAttendClasses', 0),
  withState('durationPeriod', 'setDurationPeriod', 0),
  withHandlers({
    saveMember: ({ memberItem, updateMember, setIsDirty, profile }) => () => {
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
        submitter: profile.displayName,
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
      setCurrentMember,
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
        setCurrentMember: setCurrentMember,
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
    printBarcode: () => () => {
      console.log('Printing');
      const opt = {
        scale: 4,
      };

      html2canvas($('.memberBarcode')[0], opt).then(canvas => {
        var iframe = null;
        if ($('#printf').length > 0) {
          iframe = $('#printf')[0];
        } else {
          iframe = document.createElement('iframe');
        }
        iframe.name = 'printf';
        iframe.id = 'printf';
        //           iframe.height = '1100px';
        //           iframe.width = '2000px';
        document.body.appendChild(iframe);

        var newWin = window.frames['printf'];
        newWin.document.write(
          '<body onload="window.print()">' +
            $('.memberBarcode').html() +
            '</body>',
        );
        newWin.document.close();
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.memberItem.values = [];
      this.props.memberItem.id = 'xx-xx-xx-xx-xx';
      this.props.fetchCurrentMember({ id: this.props.match.params.id });
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
      if (
        nextProps.memberItem.values !== undefined &&
        nextProps.memberItem.values['Ranking Program'] !== undefined &&
        nextProps.memberItem.values['Ranking Belt'] !== undefined
      ) {
        let belt = nextProps.belts.find(
          obj =>
            obj['program'] === nextProps.memberItem.values['Ranking Program'] &&
            obj['belt'] === nextProps.memberItem.values['Ranking Belt'],
        );
        if (belt !== undefined) {
          this.setState({
            attendClasses: belt.attendClasses,
            durationPeriod: belt.durationPeriod,
          });
        } else {
          this.setState({ attendClasses: 0, durationPeriod: 0 });
        }
      }
      /*      if (this.props.initialLoad && this.props.memberItem.id!=="xx-xx-xx-xx-xx") {
        console.log("setInitialLoad");
        this.props.setInitialLoad(false);
      } else {
        console.log("setInitialLoad XXX:"+this.props.initialLoad+" "+this.props.memberItem.id);
      }
*/
    },
    componentDidMount() {
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(MemberView);

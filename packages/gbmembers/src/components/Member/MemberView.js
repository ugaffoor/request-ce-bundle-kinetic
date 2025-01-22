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
import addressIcon from '../../images/Address.svg?raw';
import phoneIcon from '../../images/phone.svg?raw';
import emailIcon from '../../images/E-mail.svg?raw';
import dobIcon from '../../images/Birthday.svg?raw';
import aidIcon from '../../images/Emergency.svg?raw';
import printerIcon from '../../images/Print.svg?raw';
import waiverIcon from '../../images/clipboard.svg?raw';
import statsBarIcon from '../../images/stats-bars.svg?raw';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';
import in_person from '../../images/in_person.png';
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
import { ChangeStatusModalContainer } from './ChangeStatusModalContainer';
import { BamboraActivateContainer } from './BamboraActivate';
import { EmailsReceived } from './EmailsReceived';
import { MemberEmails } from './MemberEmails';
import { MemberSMS } from './MemberSMS';
import { MemberViewNotes } from './MemberViewNotes';
import { MemberAdditionalServices } from './MemberAdditionalServices';
import { MemberFiles } from './MemberFiles';
import { MemberOrders } from './MemberOrders';
import { GradingStatus } from '../attendance/GradingStatus';
import { AttendanceDialogContainer } from '../attendance/AttendanceDialog';
import { SwitchBillingMemberContainer } from './SwitchBillingMemberContainer';
import { Requests } from './Requests';
import { MemberAttendanceContainer } from './MemberAttendance';
import { actions as posActions } from '../../redux/modules/pos';
import { actions as campaignActions } from '../../redux/modules/campaigns';
import { actions as attendanceActions } from '../../redux/modules/attendance';
import { actions as serviceActions } from '../../redux/modules/services';
import { actions as appActions } from '../../redux/modules/memberApp';
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
import {
  getProgramSVG,
  getBeltSVG,
  isBillingParent,
  isNewMember,
  getPhoneNumberFormat,
} from './MemberUtils';
import ReactToPrint from 'react-to-print';
import css from 'css';
import attentionRequired from '../../images/flag.svg?raw';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import styled from 'styled-components';
import { confirm } from '../helpers/Confirmation';
import 'react-datetime/css/react-datetime.css';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  initialLoad: state.member.members.initialLoad,
  currentMemberLoading: state.member.members.currentMemberLoading,
  currentMemberAdditionalLoading:
    state.member.members.currentMemberAdditionalLoading,
  allMembers: state.member.members.allMembers,
  campaignItem: state.member.campaigns.emailCampaignItem,
  campaignLoading: state.member.campaigns.emailCampaignLoading,
  newCustomers: state.member.members.newCustomers,
  newCustomersLoading: state.member.members.newCustomersLoading,
  refundPOSTransactionInProgress:
    state.member.members.refundPOSTransactionInProgress,
  refundPOSTransactionID: state.member.members.refundPOSTransactionID,
  space: state.member.app.space,
  snippets: state.member.app.snippets,
  profile: state.member.app.profile,
  isSmsEnabled: state.member.app.isSmsEnabled,
  belts: state.member.app.belts,
  attendances: state.member.attendance.memberAttendances,
  attendancesLoading: state.member.attendance.fetchingMemberAttendances,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchCurrentMemberAdditional: actions.fetchCurrentMemberAdditional,
  updateMember: actions.updateMember,
  deleteMemberFile: actions.deleteMemberFile,
  cancelAdditionalService: actions.cancelAdditionalService,
  setCurrentMember: actions.setCurrentMember,
  fetchCampaign: campaignActions.fetchEmailCampaign,
  syncBillingCustomer: actions.syncBillingCustomer,
  clearBillingCustomer: actions.clearBillingCustomer,
  setBillingInfo: actions.setBillingInfo,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchNewCustomers: actions.fetchNewCustomers,
  setNewCustomers: actions.setNewCustomers,
  refundTransaction: actions.refundTransaction,
  refundPOSTransaction: actions.refundPOSTransaction,
  refundCashTransaction: actions.refundCashTransaction,
  refundPOSTransactionComplete: actions.refundPOSTransactionComplete,
  updatePOSOrder: posActions.updatePOSOrder,
  incrementPOSStock: posActions.incrementPOSStock,
  deletePOSPurchasedItem: posActions.deletePOSPurchasedItem,
  updatePOSOrder: posActions.updatePOSOrder,
  sendReceipt: serviceActions.sendReceipt,
  fetchMemberAttendances: attendanceActions.fetchMemberAttendances,
  createMemberUserAccount: actions.createMemberUserAccount,
  getAttributeValue: getAttributeValue,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
const Datetime = require('react-datetime');

function getClassNames(node) {
  return [
    node.className,
    ...Array.from(node.children).map(getClassNames),
  ].flat();
}

function extractCSS(node) {
  // Collect class names for a DOM subtree
  // Works for styled-components and CSS modules (anything based on CSS classes)
  const classNames = getClassNames(node)
    .map(name => {
      return name instanceof String ? name.split(' ') : [];
    })
    .flat()
    .map(name => `.${name}`);

  // Gets embedded CSS for the entire page
  const cssStyles = Array.from(document.head.getElementsByTagName('style'))
    .map(style => style.innerHTML)
    .join('');

  // Filters CSS for our classes
  const parsedCSS = css.parse(cssStyles);
  parsedCSS.stylesheet.rules = parsedCSS.stylesheet.rules
    .filter(rule => rule.type === 'rule')
    .filter(rule =>
      rule.selectors.some(selector =>
        classNames.some(name => name === selector),
      ),
    );

  return css.stringify(parsedCSS);
}

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
    this.parentMemberId = this.props.parentMemberId;
    this.allMembers = this.props.allMembers;
    this.member = this.props.member;
    this.parentMember = undefined;
  }
  componentWillReceiveProps(nextProps) {
    //    if (this.member===undefined /*|| this.allMembers.length!==nextProps.allMembers.length){
    if (
      nextProps.parentMemberId !== undefined &&
      nextProps.parentMemberId !== null
    ) {
      for (var j = 0; j < nextProps.allMembers.length; j++) {
        if (nextProps.allMembers[j].id === nextProps.parentMemberId) {
          this.parentMember = nextProps.allMembers[j];
          break;
        }
      }
    } else {
      this.parentMember = undefined;
    }
  }
  render() {
    return this.parentMember ? (
      <div>
        <p>
          Family Member of
          <NavLink
            to={`/Member/${this.props.parentMemberId}`}
            className={'nav-link icon-wrapper'}
            activeClassName="active"
            style={{ display: 'inline' }}
          >
            {this.parentMember.values['First Name']}{' '}
            {this.parentMember.values['Last Name']}
          </NavLink>
        </p>
        <button
          className="btn btn-primary"
          style={{ textTransform: 'unset' }}
          onClick={async e => {
            console.log(
              e.currentTarget.getAttribute('noteDate') +
                ' ' +
                e.currentTarget.getAttribute('noteType'),
            );
            if (
              await confirm(
                <span>
                  <span>
                    Are you sure you want to REMOVE{' '}
                    {this.member.values['First Name']}{' '}
                    {this.member.values['Last Name']} as a Family member?
                  </span>
                  <table>
                    <tbody>
                      <tr>
                        <td>Parent Member:</td>
                        <td>
                          {this.parentMember.values['First Name']}{' '}
                          {this.parentMember.values['Last Name']}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </span>,
              )
            ) {
              this.props.removeFamilyMember();
            }
          }}
        >
          Remove as Family Member
        </button>
      </div>
    ) : null;
  }
}
export class SwitchBillingParent extends Component {
  constructor(props) {
    super(props);
    this.allMembers = this.props.allMembers;
    this.member = this.props.member;
    this.parentMember = undefined;
  }
  componentWillReceiveProps(nextProps) {
    //    if (this.member===undefined /*|| this.allMembers.length!==nextProps.allMembers.length){
  }
  render() {
    return (
      <div>
        <br />
        <button
          type="button"
          className={'btn btn-primary'}
          onClick={e => this.props.setSwitchBillingMemberDialog(true)}
        >
          Switch Billing Member
        </button>
      </div>
    );
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

const PageBreakWrapper = styled.div`
  && {
    page-break-after: always;
  }
`;

class AttendanceCardToPrint extends React.Component {
  render() {
    return this.props.memberItem.values['Ranking Program'] === undefined ||
      this.props.memberItem.values['Ranking Program'] === null ? (
      <div />
    ) : (
      <div
        className={
          'attendanceCard ' +
          (getAttributeValue(this.props.space, 'Card Region') === undefined
            ? ''
            : getAttributeValue(this.props.space, 'Card Region'))
        }
      >
        <div
          id="attendanceCard_p1"
          className={
            'card1 ' +
            this.props.memberItem.values['Ranking Program']
              .replace(/ /g, '_')
              .replace(/\+/g, '_')
          }
        >
          <div className="photoDiv">
            {this.props.memberItem.values['Photo'] === undefined &&
            this.props.memberItem.values['First Name'] !== undefined ? (
              <span className="noPhotoDiv">
                <span className="name">
                  {this.props.memberItem.values['First Name'][0]}
                  {this.props.memberItem.values['Last Name'][0]}
                </span>
              </span>
            ) : (
              <img
                src={this.props.memberItem.values['Photo']}
                alt="Member Photograph"
                className="photoImg"
              />
            )}
          </div>
          <div
            className={
              'attendanceBarcode ' +
              this.props.memberItem.values['Ranking Program']
                .replace(/ /g, '_')
                .replace(/\+/g, '_')
            }
          >
            <Barcode
              value={
                this.props.memberItem.values['Alternate Barcode'] ===
                  undefined ||
                this.props.memberItem.values['Alternate Barcode'] === '' ||
                this.props.memberItem.values['Alternate Barcode'] === null
                  ? this.props.memberItem.id.split('-')[4].substring(6, 12)
                  : this.props.memberItem.values['Alternate Barcode']
              }
              width={1.3}
              height={30}
              displayValue={false}
              type={'CODE128'}
            />
          </div>
          <div
            className={
              'attendanceName ' +
              this.props.memberItem.values['Ranking Program']
                .replace(/ /g, '_')
                .replace(/\+/g, '_')
            }
          >
            <p>
              {this.props.memberItem.values['First Name']}{' '}
              {this.props.memberItem.values['Last Name']}
            </p>
          </div>
          {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
            <div
              className={
                'ranking ' +
                this.props.memberItem.values['Ranking Program'].replace(
                  / /g,
                  '_',
                )
              }
            >
              <p></p>
            </div>
          )*/}
          {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
            <div
              className={
                'lastpromotion ' +
                this.props.memberItem.values['Ranking Program'].replace(
                  / /g,
                  '_',
                )
              }
            >
              <p>{this.props.memberItem.values['Last Promotion']}</p>
            </div>
          )*/}
          {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
            <div
              className={
                'program ' +
                this.props.memberItem.values['Ranking Program'].replace(
                  / /g,
                  '_',
                )
              }
            >
              <p>{this.props.memberItem.values['Ranking Program']}</p>
            </div>
          )*/}
        </div>
        <PageBreakWrapper>&nbsp;</PageBreakWrapper>
        {this.props.memberItem.values['Ranking Program'].indexOf('Combo') ===
          -1 && (
          <div
            id="attendanceCard_p2"
            className={
              'card2 ' +
              this.props.memberItem.values['Ranking Program']
                .replace(/ /g, '_')
                .replace(/\+/g, '_')
            }
          ></div>
        )}
        {this.props.memberItem.values['Ranking Program'].indexOf('Combo') !==
          -1 && (
          <div
            id="attendanceCard_p2"
            className={
              'card2 ' +
              this.props.memberItem.values['Ranking Program']
                .replace(/ /g, '_')
                .replace(/\+/g, '_') +
              ' BarraFIT'
            }
          >
            <div
              className={
                'attendanceBarcode ' +
                this.props.memberItem.values['Ranking Program']
                  .replace(/ /g, '_')
                  .replace(/\+/g, '_') +
                ' BarraFIT'
              }
            >
              <Barcode
                value={
                  this.props.memberItem.values['Alternate Barcode'] ===
                    undefined ||
                  this.props.memberItem.values['Alternate Barcode'] === '' ||
                  this.props.memberItem.values['Alternate Barcode'] === null
                    ? this.props.memberItem.id.split('-')[4].substring(6, 12)
                    : this.props.memberItem.values['Alternate Barcode']
                }
                width={1.3}
                height={30}
                displayValue={false}
                type={'CODE128'}
              />
            </div>
            <div className="photoDiv">
              {this.props.memberItem.values['Photo'] === undefined &&
              this.props.memberItem.values['First Name'] !== undefined ? (
                <span className="noPhotoDiv">
                  <span className="name">
                    {this.props.memberItem.values['First Name'][0]}
                    {this.props.memberItem.values['Last Name'][0]}
                  </span>
                </span>
              ) : (
                <img
                  src={this.props.memberItem.values['Photo']}
                  alt="Member Photograph"
                  className="photoImg"
                />
              )}
            </div>
            <div
              className={
                'attendanceName ' +
                this.props.memberItem.values['Ranking Program']
                  .replace(/ /g, '_')
                  .replace(/\+/g, '_') +
                ' BarraFIT'
              }
            >
              <p>
                {this.props.memberItem.values['First Name']}{' '}
                {this.props.memberItem.values['Last Name']}
              </p>
            </div>
            {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
              <div
                className={
                  'ranking ' +
                  this.props.memberItem.values['Ranking Program'].replace(
                    / /g,
                    '_',
                  )
                }
              >
                <p></p>
              </div>
            )*/}
            {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
              <div
                className={
                  'lastpromotion ' +
                  this.props.memberItem.values['Ranking Program'].replace(
                    / /g,
                    '_',
                  )
                }
              >
                <p>{this.props.memberItem.values['Last Promotion']}</p>
              </div>
            )*/}
            {/*this.props.memberItem.values['Ranking Program'].indexOf("BarraFIT")!==-1 && (
              <div
                className={
                  'program ' +
                  this.props.memberItem.values['Ranking Program'].replace(
                    / /g,
                    '_',
                  )
                }
              >
                <p>{this.props.memberItem.values['Ranking Program']}</p>
              </div>
            )*/}
          </div>
        )}
      </div>
    );
  }
}
class VisitorCardToPrint extends React.Component {
  render() {
    return (
      <div
        className={
          'visitorCard ' +
          (getAttributeValue(this.props.space, 'Card Region') === undefined
            ? ''
            : getAttributeValue(this.props.space, 'Card Region'))
        }
      >
        <div id="visitorCard_p1" className={'card1 visitorCard'}>
          <div className={'schoolName'}>
            <p>{getAttributeValue(this.props.space, 'School Name')}</p>
          </div>
          <div className={'memberName'}>
            <p>
              {this.props.memberItem.values['First Name']}{' '}
              {this.props.memberItem.values['Last Name']}
            </p>
          </div>
          <div className="photoDiv">
            {this.props.memberItem.values['Photo'] === undefined &&
            this.props.memberItem.values['First Name'] !== undefined ? (
              <span className="noPhotoDiv">
                <span className="name">
                  {this.props.memberItem.values['First Name'][0]}
                  {this.props.memberItem.values['Last Name'][0]}
                </span>
              </span>
            ) : (
              <img
                src={this.props.memberItem.values['Photo']}
                alt="Member Photograph"
                className="photoImg"
              />
            )}
          </div>
        </div>
        <div className={'filler'}></div>
      </div>
    );
  }
}
class CoachCardToPrint extends React.Component {
  render() {
    return (
      <div
        className={
          'coachCard ' +
          (getAttributeValue(this.props.space, 'Card Region') === undefined
            ? ''
            : getAttributeValue(this.props.space, 'Card Region'))
        }
      >
        <div id="coachCard_p1" className={'card1 coachCard'}>
          <div className={'schoolName'}>
            <p>{getAttributeValue(this.props.space, 'School Name')}</p>
          </div>
          <div className={'memberName'}>
            <p>
              {this.props.memberItem.values['First Name']}{' '}
              {this.props.memberItem.values['Last Name']}
            </p>
          </div>
          <div className="photoDiv">
            {this.props.memberItem.values['Photo'] === undefined &&
            this.props.memberItem.values['First Name'] !== undefined ? (
              <span className="noPhotoDiv">
                <span className="name">
                  {this.props.memberItem.values['First Name'][0]}
                  {this.props.memberItem.values['Last Name'][0]}
                </span>
              </span>
            ) : (
              <img
                src={this.props.memberItem.values['Photo']}
                alt="Member Photograph"
                className="photoImg"
              />
            )}
          </div>
        </div>
        <div className={'filler'}></div>
        <PageBreakWrapper>&nbsp;</PageBreakWrapper>
        <div id="coachCard_p2" className={'card2 coachCard'}></div>
      </div>
    );
  }
}

export const MemberView = ({
  memberItem,
  allMembers,
  removeFamilyMember,
  switchBillingMember,
  saveMember,
  saveRemoveMemberNote,
  isDirty,
  setIsDirty,
  currentMemberLoading,
  currentMemberAdditionalLoading,
  fetchCampaign,
  campaignItem,
  campaignLoading,
  syncBilling,
  clearBillingInfo,
  newCustomers,
  getNewCustomers,
  showNewCustomers,
  setShowNewCustomers,
  newCustomersLoading,
  space,
  snippets,
  profile,
  setShowCallScriptModal,
  showCallScriptModal,
  setShowSMSModal,
  showSMSModal,
  setShowChangeStatusModal,
  showChangeStatusModal,
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
  showSwitchBillingMemberDialog,
  setSwitchBillingMemberDialog,
  showBamboraActivate,
  setShowBamboraActivate,
  createUserAccount,
  createMemberUserAccount,
  creatingUserAccount,
  setCreatingUserAccount,
  updateAttentionRequired,
  updateMemberItem,
  locale,
  deleteMemberFile,
  cancelAdditionalService,
  currency,
  updateMember,
  sendReceipt,
  refundPayment,
  refundPOSPayment,
  refundPOSTransactionInProgress,
  refundPOSTransactionID,
  handleContactMethodChange,
  contactLabel,
  setContactLabel,
  handleDateChange,
  setContactDate,
  contactDate,
  addNotification,
  setSystemError,
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
          {getAttributeValue(space, 'BarraFIT') === 'TRUE' ? (
            <div />
          ) : (
            <div className="rankingImages">
              <div className="program">
                {getProgramSVG(memberItem.values['Ranking Program'])}
              </div>
              <div className="belt">
                {getBeltSVG(memberItem.values['Ranking Belt'])}
              </div>
            </div>
          )}
        </div>
        <div className="viewContent">
          <div className="general">
            <div className="userDetails">
              {memberItem.values['Photo'] === undefined &&
              memberItem.values['First Name'] !== undefined ? (
                <span className="noPhoto">
                  {memberItem.values['First Name'][0]}
                  {memberItem.values['Last Name'][0]}
                </span>
              ) : (
                <div className="viewPhotoDiv">
                  <img
                    src={memberItem.values['Photo']}
                    alt="Member Photograph"
                    className="photo"
                  />
                </div>
              )}
              <span className="details1">
                <div className="iconItem">
                  <SVGInline svg={addressIcon} className="icon" />
                  <span className="value">
                    <p className="address">
                      {memberItem.values['Address']},{' '}
                      {memberItem.values['Suburb']},{' '}
                      {memberItem.values['State']}{' '}
                      {memberItem.values['Postcode']}
                    </p>
                  </span>
                </div>
                <div className="iconItem">
                  <SVGInline svg={emailIcon} className="icon" />
                  <span className="value">
                    <NavLink to={`/NewEmailCampaign/member/${memberItem.id}`}>
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
                        format={
                          getAttributeValue(space, 'PhoneNumber Format') !==
                          undefined
                            ? getAttributeValue(space, 'PhoneNumber Format')
                            : space.slug === 'europe' ||
                              space.slug === 'unitedkingdom'
                            ? getPhoneNumberFormat(memberItem)
                            : '####-###-###'
                        }
                      />
                    </a>
                  </span>
                </div>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div className="iconItem">
                    <SVGInline svg={dobIcon} className="icon" />
                    <span className="value">
                      {moment(memberItem.values['DOB'], 'YYYY-MM-DD').format(
                        'L',
                      )}{' '}
                      ({moment().diff(memberItem.values['DOB'], 'years')} yrs
                      old)
                    </span>
                  </div>
                )}
                <div className="iconItem">
                  <SVGInline svg={aidIcon} className="icon" />
                  <span className="value">
                    {memberItem.values['Emergency Contact Name']} (
                    {memberItem.values['Emergency Contact Relationship']}){' '}
                    <NumberFormat
                      className="emergencyNumber"
                      value={memberItem.values['Emergency Contact Phone']}
                      displayType={'text'}
                      format={
                        getAttributeValue(space, 'PhoneNumber Format') !==
                        undefined
                          ? getAttributeValue(space, 'PhoneNumber Format')
                          : space.slug === 'europe' ||
                            space.slug === 'unitedkingdom'
                          ? getPhoneNumberFormat(memberItem)
                          : '####-###-###'
                      }
                    />
                  </span>
                  <span className="value">
                    <span className="medicalValue">
                      {memberItem.values['Medical Allergies']}
                    </span>
                  </span>
                </div>
                {/*getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div className="iconItem">
                    <SVGInline svg={waiverIcon} className="icon" />
                    <span className="value">
                      {memberItem.values['Covid19 Waiver'] === null ||
                      memberItem.values['Covid19 Waiver'] === undefined ||
                      memberItem.values['Covid19 Waiver'] === ''
                        ? 'Incomplete'
                        : memberItem.values['Covid19 Waiver']}
                    </span>
                  </div>
                )*/}
                {/*Utils.getAttributeValue(space, 'Covid Check Required') ===
                  'TRUE' && (
                  <div className="iconItem">
                    <label htmlFor="studentcovidcheck">
                      Student Covid Check
                    </label>
                    <div className="checkboxFilter">
                      <input
                        id="studentcovidcheck"
                        type="checkbox"
                        checked={
                          memberItem.values['Student Covid Check'] === 'YES'
                            ? true
                            : false
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            memberItem.values['Student Covid Check'] = 'YES';
                          } else {
                            memberItem.values['Student Covid Check'] = '';
                          }
                          var values = {};
                          values['Student Covid Check'] =
                            memberItem.values['Student Covid Check'];
                          setIsDirty(true);
                          updateMemberItem(values);
                        }}
                      />
                      <label htmlFor="studentcovidcheck"></label>
                    </div>
                  </div>
                      )*/}
                {/*Utils.getAttributeValue(space, 'Covid Check Required') ===
                  'TRUE' && (
                  <div className="iconItem">
                    <label htmlFor="mothercovidcheck">Mother Covid Check</label>
                    <div className="checkboxFilter">
                      <input
                        id="mothercovidcheck"
                        type="checkbox"
                        checked={
                          memberItem.values['Mother Covid Check'] === 'YES'
                            ? true
                            : false
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            memberItem.values['Mother Covid Check'] = 'YES';
                          } else {
                            memberItem.values['Mother Covid Check'] = '';
                          }
                          setIsDirty(true);
                          var values = {};
                          values['Mother Covid Check'] =
                            memberItem.values['Mother Covid Check'];
                          updateMemberItem(values);
                        }}
                      />
                      <label for="mothercovidcheck"></label>
                    </div>
                  </div>
                )*/}
                {/*Utils.getAttributeValue(space, 'Covid Check Required') ===
                  'TRUE' && (
                  <div className="iconItem">
                    <label htmlFor="fathercovidcheck">Father Covid Check</label>
                    <div className="checkboxFilter">
                      <input
                        id="fathercovidcheck"
                        type="checkbox"
                        checked={
                          memberItem.values['Father Covid Check'] === 'YES'
                            ? true
                            : false
                        }
                        onChange={e => {
                          if (e.target.checked) {
                            memberItem.values['Father Covid Check'] = 'YES';
                          } else {
                            memberItem.values['Father Covid Check'] = '';
                          }
                          setIsDirty(true);
                          var values = {};
                          values['Father Covid Check'] =
                            memberItem.values['Father Covid Check'];
                          updateMemberItem(values);
                        }}
                      />
                      <label for="fathercovidcheck"></label>
                    </div>
                  </div>
                )*/}
              </span>
              <span className="details2">
                <div className="status">
                  <p>
                    {memberItem.values['Status'] === 'Active'
                      ? 'ACTIVE'
                      : memberItem.values['Status']}
                  </p>
                  <div
                    className={
                      memberItem.values['Status'] === 'Active'
                        ? 'green'
                        : memberItem.values['Status'] === 'Inactive'
                        ? 'red'
                        : 'blue'
                    }
                  ></div>
                </div>
                <span className="buttons">
                  {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                    <span>
                      {!Utils.isMemberOf(profile, 'Role::Program Managers') ||
                      (Utils.getAttributeValue(space, 'Billing Company') !==
                        'Bambora' &&
                        Utils.getAttributeValue(space, 'Billing Company') !==
                          'Stripe') ? (
                        <div />
                      ) : isNewMember(memberItem) ? (
                        <span>
                          {Utils.getAttributeValue(space, 'Billing Company') ===
                            'Bambora' && (
                            <a
                              href={
                                Utils.getAttributeValue(
                                  space,
                                  'Web Server Url',
                                ) +
                                '/#/kapps/services/categories/bambora-billing/bambora-member-registration?id=' +
                                memberItem.id
                              }
                              className="btn btn-primary"
                              style={{ marginLeft: '10px', color: 'white' }}
                            >
                              Register
                            </a>
                          )}
                          {Utils.getAttributeValue(space, 'Billing Company') ===
                            'Stripe' && (
                            <a
                              href={
                                Utils.getAttributeValue(
                                  space,
                                  'Web Server Url',
                                ) +
                                '/#/kapps/services/categories/stripe-billing/stripe-member-registration?id=' +
                                memberItem.id
                              }
                              className="btn btn-primary"
                              style={{ marginLeft: '10px', color: 'white' }}
                            >
                              Register
                            </a>
                          )}
                        </span>
                      ) : (
                        <span>
                          <a
                            onClick={e => setShowChangeStatusModal(true)}
                            className="btn btn-primary"
                            style={{ marginLeft: '10px', color: 'white' }}
                          >
                            Change Status
                          </a>
                          {showChangeStatusModal && (
                            <ChangeStatusModalContainer
                              memberItem={memberItem}
                              allMembers={allMembers}
                              target="Member"
                              space={space}
                              profile={profile}
                              setShowChangeStatusModal={
                                setShowChangeStatusModal
                              }
                              billingCompany={Utils.getAttributeValue(
                                space,
                                'Billing Company',
                              )}
                            />
                          )}
                        </span>
                      )}
                    </span>
                  )}
                  <NavLink
                    to={`/NewEmailCampaign/member/${memberItem.id}`}
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
                      space={space}
                      profile={profile}
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
                  <span>
                    {memberItem.values['Status'] === 'Inactive' ||
                    memberItem.values['Status'] === 'Frozen' ? (
                      <div />
                    ) : (
                      <span>
                        {memberItem.user === undefined ? (
                          <button
                            className="btn btn-primary"
                            style={{ textTransform: 'unset' }}
                            onClick={async e => {
                              console.log(
                                e.currentTarget.getAttribute('noteDate') +
                                  ' ' +
                                  e.currentTarget.getAttribute('noteType'),
                              );
                              if (
                                await confirm(
                                  <span>
                                    <span>
                                      Are your sure you want to CREATE a User
                                      Account?
                                    </span>
                                    <table>
                                      <tbody>
                                        <tr>
                                          <td>User Name:</td>
                                          <td>
                                            {memberItem.values['Member ID']}
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </span>,
                                )
                              ) {
                                createUserAccount();
                              }
                            }}
                          >
                            {creatingUserAccount
                              ? 'Creating...'
                              : 'Create Account as ' +
                                memberItem.values['Member ID']}
                          </button>
                        ) : (
                          <div className="username">
                            <div className="label">Username:</div>{' '}
                            <div className="value">
                              {memberItem.user.username}
                            </div>
                          </div>
                        )}
                      </span>
                    )}
                  </span>
                  {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                    <div
                      type="button"
                      className="attentionRequired"
                      onClick={e => {
                        updateAttentionRequired();
                      }}
                    >
                      <SVGInline
                        svg={attentionRequired}
                        className={'attention icon'}
                      />
                    </div>
                  )}
                </span>
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div className="emergency">
                    <div className="memberBarcode">
                      <Barcode
                        value={
                          memberItem.values['Alternate Barcode'] ===
                            undefined ||
                          memberItem.values['Alternate Barcode'] === '' ||
                          memberItem.values['Alternate Barcode'] === null
                            ? memberItem.id.split('-')[4].substring(6, 12)
                            : memberItem.values['Alternate Barcode']
                        }
                        width={1.3}
                        height={30}
                        displayValue={false}
                        type={'CODE128'}
                      />
                    </div>
                    <ReactToPrint
                      trigger={() => (
                        <SVGInline
                          svg={printerIcon}
                          className="icon barcodePrint"
                        />
                      )}
                      content={() => this.componentRef}
                    />
                  </div>
                )}
                {getAttributeValue(space, 'Franchisor') !== 'YES' && (
                  <div className="emergency">
                    <div className="visitorCard">
                      <p>Visitor Card</p>
                    </div>
                    <ReactToPrint
                      trigger={() => (
                        <SVGInline
                          svg={printerIcon}
                          className="icon visitorCardPrint"
                        />
                      )}
                      content={() => this.visitorCardComponentRef}
                    />
                  </div>
                )}
                {memberItem['values']['Member Type'] !== undefined &&
                  memberItem['values']['Member Type'] !== null &&
                  memberItem['values']['Member Type'].indexOf('Coach') !==
                    -1 && (
                    <div className="emergency">
                      <div className="coachCard">
                        <p>Coach Card</p>
                      </div>
                      <ReactToPrint
                        trigger={() => (
                          <SVGInline
                            svg={printerIcon}
                            className="icon coachCardPrint"
                          />
                        )}
                        content={() => this.coachCardComponentRef}
                      />
                    </div>
                  )}
              </span>
            </div>
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
          <div style={{ display: 'none' }}>
            <AttendanceCardToPrint
              ref={el => (this.componentRef = el)}
              memberItem={memberItem}
              space={space}
            />
          </div>
          <div style={{ display: 'none' }}>
            <VisitorCardToPrint
              ref={el => (this.visitorCardComponentRef = el)}
              memberItem={memberItem}
              space={space}
            />
          </div>
          <div style={{ display: 'none' }}>
            <CoachCardToPrint
              ref={el => (this.coachCardComponentRef = el)}
              memberItem={memberItem}
              space={space}
            />
          </div>
          <div className="userDetails2">
            {getAttributeValue(space, 'Franchisor') !== 'YES' && (
              <div className="ranking">
                <h4>
                  Rank (Member since:{' '}
                  {moment(
                    memberItem.values['Date Joined'],
                    'YYYY-MM-DD',
                  ).format('MMM Do YYYY')}
                  )
                </h4>
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
                      space={space}
                      profile={profile}
                    />
                  )}
                </div>
                {memberItem.values['Last Promotion'] === undefined ? (
                  <div className="nolastPromotion">
                    {' '}
                    No Last promotion date set
                  </div>
                ) : (
                  <div className="beltProgress">
                    <p>
                      <b>{memberItem.values['Ranking Belt']}</b> SINCE{' '}
                      <b>
                        {moment(
                          memberItem.values['Last Promotion'],
                          'YYYY-MM-DD',
                        ).format('L')}
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
            )}
            <div className="billing">
              <h4>Billing</h4>
              <div
                className={
                  memberItem.values['Non Paying'] !== 'YES' &&
                  memberItem.values['Billing Payment Type'] === 'Cash'
                    ? 'billingInfo show'
                    : 'hide'
                }
              >
                <p>
                  Cash paid for period{' '}
                  {moment(
                    memberItem.values['Billing Cash Term Start Date'],
                  ).format('L')}{' '}
                  to{' '}
                  {moment(
                    memberItem.values['Billing Cash Term End Date'],
                  ).format('L')}
                </p>
                <p>
                  Payment:{' '}
                  {new Intl.NumberFormat(locale, {
                    style: 'currency',
                    currency: currency,
                  }).format(memberItem.values['Membership Cost'])}
                </p>
                {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
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
                  memberItem.values['Non Paying'] === 'YES'
                    ? 'billingInfo show'
                    : 'hide'
                }
              >
                <p>Non Paying</p>
              </div>
              <div
                className={
                  memberItem.values['Billing Payment Type'] !== 'Cash' &&
                  memberItem.values['Non Paying'] !== 'YES' &&
                  ((memberItem.values['Billing Customer Id'] !== undefined &&
                    memberItem.values['Billing Customer Id'] !== '' &&
                    memberItem.values['Billing Customer Id'] !== null) ||
                    (memberItem.values['Billing Setup Fee Id'] !== undefined &&
                      memberItem.values['Billing Setup Fee Id'] !== '' &&
                      memberItem.values['Billing Setup Fee Id'] !== null))
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
                  <PaymentType
                    type={memberItem.values['Billing Payment Type']}
                  />
                </p>
                {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
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
                  memberItem.values['Non Paying'] !== 'YES' &&
                  isBillingParent(memberItem)
                    ? 'billingInfo show'
                    : 'hide'
                }
              >
                <SwitchBillingParent
                  setSwitchBillingMemberDialog={setSwitchBillingMemberDialog}
                />
                {showSwitchBillingMemberDialog && (
                  <SwitchBillingMemberContainer
                    memberItem={memberItem}
                    allMembers={allMembers}
                    setSwitchBillingMemberDialog={setSwitchBillingMemberDialog}
                    switchBillingMember={switchBillingMember}
                    setIsDirty={setIsDirty}
                  />
                )}
              </div>
              <div
                className={
                  memberItem.values['Billing Payment Type'] !== 'Cash' &&
                  memberItem.values['Non Paying'] !== 'YES' &&
                  (memberItem.values['Billing Customer Id'] === undefined ||
                    memberItem.values['Billing Customer Id'] === '' ||
                    memberItem.values['Billing Customer Id'] === null)
                    ? 'billingInfo show'
                    : 'hide'
                }
              >
                <BillingParentInfo
                  parentMemberId={memberItem.values['Billing Parent Member']}
                  member={memberItem}
                  allMembers={allMembers}
                  removeFamilyMember={removeFamilyMember}
                  setIsDirty={setIsDirty}
                />
              </div>
              {Utils.getAttributeValue(space, 'Billing Company') ===
                'PaySmart' &&
                memberItem.values['Non Paying'] !== 'YES' &&
                memberItem.values['Billing Payment Type'] !== 'Cash' && (
                  <div
                    style={{
                      display: Utils.isMemberOf(
                        profile,
                        'Role::Program Managers',
                      )
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
                )}
              {Utils.getAttributeValue(space, 'Billing Company') ===
                'PaySmart' &&
                memberItem.values['Non Paying'] !== 'YES' &&
                memberItem.values['Billing Payment Type'] !== 'Cash' && (
                  <div
                    style={{
                      display: Utils.isMemberOf(
                        profile,
                        'Role::Program Managers',
                      )
                        ? 'block'
                        : 'none',
                    }}
                  >
                    <br />
                    <button
                      type="button"
                      className={'btn btn-primary'}
                      onClick={e => clearBillingInfo()}
                    >
                      CLEAR Billing Info
                    </button>
                  </div>
                )}
              {Utils.getAttributeValue(space, 'Billing Company') ===
                'Bambora' &&
                memberItem.values['Billing User'] === 'YES' &&
                memberItem.values['Non Paying'] !== 'YES' &&
                memberItem.values['Billing Payment Type'] !== 'Cash' &&
                (memberItem.values['Biller Migrated'] === null ||
                  memberItem.values['Biller Migrated'] === undefined ||
                  memberItem.values['Biller Migrated'] !== 'YES') &&
                  (memberItem.values['Billing Customer Reference'] === null ||
                    memberItem.values['Billing Customer Reference'] ===
                      undefined ||
                    memberItem.values['Billing Customer Reference'] === '') && (
                  <div>
                    <button
                      onClick={e => setShowBamboraActivate(true)}
                      className="btn btn-primary"
                      style={{ marginTop: '6px', color: 'white' }}
                    >
                      Activate Bambora Account
                    </button>
                    {showBamboraActivate && (
                      <BamboraActivateContainer
                        memberItem={memberItem}
                        allMembers={allMembers}
                        target="Member"
                        setShowBamboraActivate={setShowBamboraActivate}
                      />
                    )}
                  </div>
                )}
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
            <div id="notesDiv" className="">
              <div className="card-header ">
                <ul
                  className="nav nav-tabs card-header-tabs contact-methods"
                  role="tablist"
                >
                  <li className="nav-item label">Method:</li>
                  <li className="nav-item icon phone">
                    <a
                      className="nav-link active"
                      title="Phone Contact"
                      data-toggle="tab"
                      href="#method"
                      id="phone_tab"
                      role="tab"
                      aria-controls="contact_method"
                      aria-selected="true"
                      onClick={() => handleContactMethodChange('phone')}
                    >
                      <img
                        src={phone}
                        alt="Phone Call"
                        style={{ border: 'none' }}
                      />
                    </a>
                  </li>
                  <li className="nav-item icon email">
                    <a
                      className="nav-link"
                      title="Email Contact"
                      data-toggle="tab"
                      href="#method"
                      id="mail_tab"
                      role="tab"
                      aria-controls="contact_method"
                      onClick={() => handleContactMethodChange('email')}
                    >
                      <img src={mail} alt="Email" style={{ border: 'none' }} />
                    </a>
                  </li>
                  <li className="nav-item icon sms">
                    <a
                      className="nav-link"
                      title="SMS Contact"
                      data-toggle="tab"
                      href="#method"
                      id="sms_tab"
                      role="tab"
                      aria-controls="contact_method"
                      onClick={() => handleContactMethodChange('sms')}
                    >
                      <img src={sms} alt="SMS" style={{ border: 'none' }} />
                    </a>
                  </li>
                  <li className="nav-item icon person">
                    <a
                      className="nav-link"
                      title="In Person Contact"
                      data-toggle="tab"
                      href="#method"
                      id="person_tab"
                      role="tab"
                      aria-controls="contact_method"
                      onClick={() => handleContactMethodChange('in_person')}
                    >
                      <img
                        src={in_person}
                        alt="In Person"
                        style={{ border: 'none' }}
                      />
                    </a>
                  </li>
                </ul>
                <ul
                  className="nav nav-tabs card-header-tabs pull-left contact-method-select"
                  role="tablist"
                >
                  <li className="nav-item label">{contactLabel}</li>
                  <li className="nav-item date">
                    <Datetime
                      className="float-right"
                      dateFormat="L"
                      onChange={handleDateChange}
                      defaultValue={moment()}
                    />
                    {contactDate === 'Invalid date' && (
                      <span className="invaliddate">Invalid Date</span>
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-sm-9 notes">
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
          {(currentMemberLoading || currentMemberAdditionalLoading) && (
            <p>... Loading Additional Details</p>
          )}

          {!currentMemberLoading && !currentMemberAdditionalLoading && (
            <div className="additionalDetails">
              <div>
                <MemberViewNotes
                  saveRemoveMemberNote={saveRemoveMemberNote}
                  space={space}
                  profile={profile}
                  memberItem={memberItem}
                />
              </div>
              <div>
                {(Utils.getAttributeValue(space, 'Billing Company') ===
                  'Bambora' ||
                  Utils.getAttributeValue(space, 'Billing Company') ===
                    'Stripe') && (
                  <MemberAdditionalServices
                    memberItem={memberItem}
                    allMembers={allMembers}
                    space={space}
                    profile={profile}
                    cancelAdditionalService={cancelAdditionalService}
                    locale={locale}
                    currency={currency}
                  />
                )}
              </div>
              <div>
                <MemberFiles
                  memberItem={memberItem}
                  space={space}
                  profile={profile}
                  deleteMemberFile={deleteMemberFile}
                />
              </div>
              <div>
                <MemberEmails
                  memberItem={memberItem}
                  fetchCampaign={fetchCampaign}
                  campaignItem={campaignItem}
                  campaignLoading={campaignLoading}
                  space={space}
                  profile={profile}
                />
              </div>
              <div>
                <EmailsReceived
                  submission={memberItem}
                  space={space}
                  profile={profile}
                />
              </div>
              <div>
                <MemberSMS
                  memberItem={memberItem}
                  space={space}
                  profile={profile}
                />
              </div>
              <div>
                <Requests
                  requestContent={
                    memberItem.leadRequestContent === undefined
                      ? memberItem.requestContent
                      : memberItem.leadRequestContent.concat(
                          memberItem.requestContent,
                        )
                  }
                  space={space}
                  profile={profile}
                  locale={locale}
                  currency={currency}
                  sendReceipt={sendReceipt}
                  addNotification={addNotification}
                  setSystemError={setSystemError}
                />
              </div>
              <div>
                <MemberOrders
                  memberItem={memberItem}
                  allMembers={allMembers}
                  space={space}
                  profile={profile}
                  sendReceipt={sendReceipt}
                  snippets={snippets}
                  refundPOSPayment={refundPOSPayment}
                  refundPOSTransactionInProgress={
                    refundPOSTransactionInProgress
                  }
                  refundPOSTransactionID={refundPOSTransactionID}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </span>
  );

export const MemberViewContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ memberItem }) => {}),
  withState('isAssigning', 'setIsAssigning', false),
  withState('isDirty', 'setIsDirty', false),
  withState(
    'contactDate',
    'setContactDate',
    moment().format(contact_date_format),
  ),
  withState('contactMethod', 'setContactMethod', ''),
  withState('contactLabel', 'setContactLabel', ''),
  withState('showNewCustomers', 'setShowNewCustomers', false),
  withState('showCallScriptModal', 'setShowCallScriptModal', false),
  withState('showBamboraActivate', 'setShowBamboraActivate', false),
  withState('showAttendanceDialog', 'setShowAttendanceDialog', false),
  withState('showSMSModal', 'setShowSMSModal', false),
  withState('showChangeStatusModal', 'setShowChangeStatusModal', false),
  withState('attendClasses', 'setAttendClasses', 0),
  withState('durationPeriod', 'setDurationPeriod', 0),
  withState('creatingUserAccount', 'setCreatingUserAccount', false),
  withState(
    'showSwitchBillingMemberDialog',
    'setSwitchBillingMemberDialog',
    false,
  ),
  withHandlers({
    handleDateChange: ({ setContactDate }) => date => {
      setContactDate(moment(date).format(contact_date_format));
    },
    handleContactMethodChange: ({
      setContactMethod,
      setContactLabel,
    }) => method => {
      var label = method;
      switch (method) {
        case 'phone':
          label = 'Phone Call';
          break;
        case 'email':
          label = 'Email';
          break;
        case 'sms':
          label = 'SMS';
          break;
        case 'in_person':
          label = 'In Person';
          break;
        default:
      }
      setContactMethod(method);
      setContactLabel(label);
    },
    switchBillingMember: ({
      memberItem,
      setIsDirty,
      updateMember,
      allMembers,
      profile,
    }) => (oldBiller, newBiller) => {
      var otherFamilyMembers = JSON.parse(
        oldBiller.values['Billing Family Members'],
      );

      newBiller.values['Billing Customer Reference'] =
        oldBiller.values['Billing Customer Reference'];
      newBiller.values['Billing Customer Id'] =
        oldBiller.values['Billing Customer Id'];
      newBiller.values['Billing User'] = oldBiller.values['Billing User'];
      newBiller.values['Biller Migrated'] = oldBiller.values['Biller Migrated'];
      newBiller.values['Billing Payment Type'] =
        oldBiller.values['Billing Payment Type'];
      newBiller.values['Billing Payment Period'] =
        oldBiller.values['Billing Payment Period'];
      newBiller.values['Billing Period'] = oldBiller.values['Billing Period'];
      newBiller.values['Billing Parent Member'] = newBiller.id;
      newBiller.values['Billing Family Members'] =
        oldBiller.values['Billing Family Members'];
      newBiller.values['Billing Start Date'] =
        oldBiller.values['Billing Start Date'];
      newBiller.values['Payment Schedule'] =
        oldBiller.values['Payment Schedule'];
      newBiller.values['Family Fee Details'] =
        oldBiller.values['Family Fee Details'];
      newBiller.values['Membership Cost'] = oldBiller.values['Membership Cost'];
      newBiller.values['First Payment'] = oldBiller.values['First Payment'];
      newBiller.values['Payment'] = oldBiller.values['Payment'];
      newBiller.values['Admin Fee'] = oldBiller.values['Admin Fee'];
      newBiller.values['Setup Fee'] = oldBiller.values['Setup Fee'];
      newBiller.values['Payment Method'] = oldBiller.values['Payment Method'];
      newBiller.values['Credit Card Expiry Year'] =
        oldBiller.values['Credit Card Expiry Year'];
      newBiller.values['Credit Card Expiry Month'] =
        oldBiller.values['Credit Card Expiry Month'];
      newBiller.values['POS Profile ID'] = oldBiller.values['POS Profile ID'];
      newBiller.values['Billing Cash Term Start Date'] =
        oldBiller.values['Billing Cash Term Start Date'];
      newBiller.values['Billing Cash Term End Date'] =
        oldBiller.values['Billing Cash Term End Date'];

      let changes = newBiller.values['Billing Changes'];
      if (!changes) {
        changes = [];
      } else if (typeof changes !== 'object') {
        changes = JSON.parse(changes);
      }
      changes.push({
        date: moment().format(contact_date_format),
        user: profile.username,
        action:
          'Switched Biller Member from ' +
          oldBiller.values['First Name'] +
          ' ' +
          oldBiller.values['Last Name'],
        from: oldBiller.values['Member ID'],
        to: newBiller.values['Member ID'],
      });
      newBiller.values['Billing Changes'] = changes;

      updateMember({
        id: newBiller.id,
        memberItem: newBiller,
        allMembers,
      });

      oldBiller.values['Billing Parent Member'] = newBiller.id;
      oldBiller.values['Billing Customer Reference'] = null;
      oldBiller.values['Billing Customer Id'] = null;
      oldBiller.values['Billing User'] = null;
      oldBiller.values['Biller Migrated'] = null;
      oldBiller.values['Billing Payment Type'] = null;
      oldBiller.values['Billing Payment Period'] = null;
      oldBiller.values['Billing Period'] = null;
      oldBiller.values['Billing Family Members'] = null;
      oldBiller.values['Billing Start Date'] = null;
      oldBiller.values['Payment Schedule'] = null;
      oldBiller.values['Family Fee Details'] = null;
      oldBiller.values['Membership Cost'] = null;
      oldBiller.values['First Payment'] = null;
      oldBiller.values['Payment'] = null;
      oldBiller.values['Admin Fee'] = null;
      oldBiller.values['Setup Fee'] = null;
      oldBiller.values['Payment Method'] = null;
      oldBiller.values['Credit Card Expiry Year'] = null;
      oldBiller.values['Credit Card Expiry Month'] = null;
      oldBiller.values['Billing Cash Term Start Date'] = null;
      oldBiller.values['Billing Cash Term End Date'] = null;

      changes = oldBiller.values['Billing Changes'];
      if (!changes) {
        changes = [];
      } else if (typeof changes !== 'object') {
        changes = JSON.parse(changes);
      }
      changes.push({
        date: moment().format(contact_date_format),
        user: profile.username,
        action:
          'Switched Biller Member to ' +
          newBiller.values['First Name'] +
          ' ' +
          newBiller.values['Last Name'],
        from: newBiller.values['Member ID'],
        to: oldBiller.values['Member ID'],
      });
      oldBiller.values['Billing Changes'] = changes;

      updateMember({
        id: oldBiller.id,
        memberItem: oldBiller,
        allMembers,
      });

      // Find other family members to change parent Member
      otherFamilyMembers = otherFamilyMembers.filter(
        member => member !== newBiller.id && member !== oldBiller.id,
      );
      otherFamilyMembers.forEach((memberid, i) => {
        var idx = allMembers.findIndex(member => memberid === member.id);
        if (idx !== -1) {
          var dependantMember = allMembers[idx];
          dependantMember.values['Billing Parent Member'] = newBiller.id;
          updateMember({
            id: dependantMember.id,
            memberItem: dependantMember,
            allMembers,
          });
        }
      });

      setIsDirty(false);
    },
    removeFamilyMember: ({
      memberItem,
      setIsDirty,
      profile,
      updateMember,
      allMembers,
    }) => () => {
      memberItem.values['Billing Parent Member'] = null;
      var values = {};
      values['Billing Parent Member'] = null;
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
      });
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values['Billing Parent Member'] = null;
          break;
        }
      }
      setIsDirty(false);
    },
    saveMember: ({
      memberItem,
      updateMember,
      setIsDirty,
      profile,
      allMembers,
      contactDate,
      contactMethod,
    }) => () => {
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
        contactDate: contactDate,
        contactMethod: contactMethod,
        submitter: profile.displayName,
      });
      memberItem.values['Notes History'] = notesHistory;
      var values = {};
      values['Notes History'] = notesHistory;
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
      });
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values['Notes History'] = JSON.stringify(notesHistory);
          break;
        }
      }

      $('#memberNote').val('');
      setIsDirty(false);
    },
    saveRemoveMemberNote: ({
      memberItem,
      updateMember,
      setIsDirty,
      profile,
      allMembers,
    }) => newHistory => {
      memberItem.values['Notes History'] = newHistory;
      var values = {};
      values['Notes History'] = newHistory;
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
      });
      /*      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values['Notes History'] = JSON.stringify(newHistory);
          break;
        }
      }*/

      $('#memberNote').val('');
      setIsDirty(false);
    },
    syncBilling: ({
      memberItem,
      allMembers,
      updateMember,
      setCurrentMember,
      syncBillingCustomer,
      setBillingInfo,
      fetchCurrentMember,
      fetchCurrentMemberAdditional,
      fetchMembers,
      addNotification,
      setSystemError,
      setIsDirty,
      space,
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
        allMembers: allMembers,
        myThis: this,
        updateMember: updateMember,
        setCurrentMember: setCurrentMember,
        setBillingInfo: setBillingInfo,
        fetchCurrentMember: fetchCurrentMember,
        fetchCurrentMemberAdditional: fetchCurrentMemberAdditional,
        fetchMembers: fetchMembers,
        addNotification: addNotification,
        setSystemError: setSystemError,
        useSubAccount:
          getAttributeValue(space, 'PaySmart SubAccount') === 'YES'
            ? true
            : false,
      });
      setTimeout(function() {
        setIsDirty(false);
      }, 3000);
    },
    clearBillingInfo: ({
      memberItem,
      updateMember,
      setIsDirty,
      profile,
      allMembers,
    }) => () => {
      let customerId = memberItem.values['Billing Customer Id'];
      // Update memberItem values from billingInfo
      memberItem.values['Billing Customer Reference'] = null;
      memberItem.values['Billing Customer Id'] = null;
      memberItem.values['Billing User'] = null;
      memberItem.values['Billing Payment Type'] = null;
      memberItem.values['Billing Payment Period'] = null;
      memberItem.values['Payment Schedule'] = null;
      memberItem.values['Membership Cost'] = null;

      let changes = memberItem.values['Billing Changes'];
      if (!changes) {
        changes = [];
      } else if (typeof changes !== 'object') {
        changes = JSON.parse(changes);
      }
      changes.push({
        date: moment().format(contact_date_format),
        user: profile.username,
        action: 'Clear Billing Customer',
        from: customerId,
        to: '',
      });
      memberItem.values['Billing Changes'] = changes;
      var values = {};
      values['Billing Customer Reference'] = null;
      values['Billing Customer Id'] = null;
      values['Billing User'] = null;
      values['Billing Payment Type'] = null;
      values['Billing Payment Period'] = null;
      values['Payment Schedule'] = null;
      values['Membership Cost'] = null;
      if (memberItem.values['useSubAccount'] === 'YES') {
        values['useSubAccount'] = null;
      }
      values['Billing Changes'] = changes;
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
      });
      setIsDirty(false);
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
      allMembers,
      fetchMembers,
      addNotification,
      setSystemError,
    }) => () => {
      memberItem.values['Is New Reply Received'] = 'false';
      var values = {};
      values['Is New Reply Received'] = 'false';
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
        addNotification,
        setSystemError,
      });
      /*    for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values = memberItem.values;
          break;
        }
      } */
    },
    updateAttentionRequired: ({
      memberItem,
      updateMember,
      allMembers,
      fetchMember,
      fetchMembers,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => () => {
      memberItem.values['Is New Reply Received'] = 'true';
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values = memberItem.values;
          break;
        }
      }
      let values = {};
      values['Is New Reply Received'] = 'true';
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
        addNotification,
        setSystemError,
      });
    },
    updateMemberItem: ({
      memberItem,
      updateMember,
      allMembers,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => values => {
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values = memberItem.values;
          break;
        }
      }
      updateMember({
        id: memberItem.id,
        memberItem,
        values,
        allMembers,
        addNotification,
        setSystemError,
      });
    },
    refundPayment: ({
      memberItem,
      refundTransaction,
      updateMember,
      fetchCurrentMember,
      fetchCurrentMemberAdditional,
      fetchMembers,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => (billingThis, paymentId, paymentAmount, billingChangeReason) => {
      console.log('### paymentId = ' + paymentId);
      let args = {};
      args.transactionId = paymentId;
      args.refundAmount = paymentAmount;
      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.fetchCurrentMember = fetchCurrentMember;
      args.fetchCurrentMemberAdditional = fetchCurrentMemberAdditional;
      args.fetchMembers = fetchMembers;
      args.myThis = memberItem.myThis;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;
      args.billingThis = billingThis;

      refundTransaction(args);
    },
    refundPOSPayment: ({
      memberItem,
      refundCashTransaction,
      refundPOSTransaction,
      refundPOSTransactionComplete,
      updatePOSOrder,
      incrementPOSStock,
      deletePOSPurchasedItem,
      updateMember,
      fetchMembers,
      addNotification,
      setSystemError,
      setIsDirty,
    }) => (
      billingThis,
      orderid,
      paymentId,
      paymentAmount,
      billingChangeReason,
    ) => {
      console.log('### paymentId = ' + paymentId);
      let args = {};
      args.orderid = orderid;
      args.transactionId = paymentId;
      args.refundAmount = paymentAmount;
      args.memberItem = memberItem;
      args.updateMember = updateMember;
      args.fetchMembers = fetchMembers;
      args.myThis = memberItem.myThis;
      args.billingChangeReason = billingChangeReason;
      args.addNotification = addNotification;
      args.setSystemError = setSystemError;
      args.billingThis = billingThis;
      args.updatePOSOrder = updatePOSOrder;
      args.incrementPOSStock = incrementPOSStock;
      args.deletePOSPurchasedItem = deletePOSPurchasedItem;
      args.refundPOSTransactionComplete = refundPOSTransactionComplete;

      if (paymentId.indexOf('cash') === 0) {
        refundCashTransaction(args);
      } else {
        refundPOSTransaction(args);
      }
    },
    createUserAccount: ({
      allMembers,
      memberItem,
      updateMember,
      createMemberUserAccount,
      addNotification,
      setSystemError,
      setCreatingUserAccount,
    }) => () => {
      setCreatingUserAccount(true);

      createMemberUserAccount({
        allMembers,
        memberItem,
        updateMember,
        addNotification,
        setSystemError,
        setCreatingUserAccount,
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
      //      this.props.memberItem.values = [];
      //      this.props.memberItem.id = 'xx-xx-xx-xx-xx';
      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        billingService: getAttributeValue(this.props.space, 'Billing Company'),
        allMembers: this.props.allMembers,
      });
      this.props.fetchCurrentMemberAdditional({
        id: this.props.match.params.id,
        billingService: getAttributeValue(this.props.space, 'Billing Company'),
        allMembers: this.props.allMembers,
      });

      let currency = getAttributeValue(this.props.space, 'Currency');
      if (currency === undefined) currency = 'USD';

      this.locale =
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale;

      this.setState({
        currency: currency,
        locale: this.locale,
      });
    },
    componentWillReceiveProps(nextProps) {
      //$('#mainContent').offset({ top: 98});
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: nextProps.match.params.id,
          billingService: getAttributeValue(
            this.props.space,
            'Billing Company',
          ),
          allMembers: this.props.allMembers,
        });
        this.props.fetchCurrentMemberAdditional({
          id: nextProps.match.params.id,
          billingService: getAttributeValue(
            this.props.space,
            'Billing Company',
          ),
          allMembers: nextProps.allMembers,
        });
        this.props.setShowChangeStatusModal(false);
      }
      if (
        nextProps.memberItem.values &&
        nextProps.memberItem['id'] !== this.props.memberItem['id'] &&
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
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(MemberView);

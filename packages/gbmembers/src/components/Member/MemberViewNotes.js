import React, { Component } from 'react';
import ReactTable from 'react-table';
import moment from 'moment';
import { compose } from 'recompose';
import { connect } from 'react-redux';
import { contact_date_format } from '../leads/LeadsUtils';
import { ReactComponent as BinIcon } from '../../images/bin.svg';
import { ReactComponent as ReviewIcon } from '../../images/review.svg';
import { confirm } from '../helpers/Confirmation';
import { getJson } from '../Member/MemberUtils';
import { PaymentHistory } from './Billing';
import { actions } from '../../redux/modules/members';
import { actions as errorActions } from '../../redux/modules/errors';
import phone from '../../images/phone.png';
import mail from '../../images/mail.png';
import sms from '../../images/sms.png';
import in_person from '../../images/in_person.png';
import { actions as servicesActions } from '../../redux/modules/services';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';
import { getTimezone } from '../leads/LeadsUtils';

const mapStateToProps = state => ({
  paymentHistory: state.member.members.ALLpaymentHistory,
  paymentHistoryLoading: state.member.members.ALLpaymentHistoryLoading,
  setupPaymentHistory: state.member.members.SETUPpaymentHistory,
  setupPaymentHistoryLoading: state.member.members.SETUPpaymentHistoryLoading,
  memberCashPayments: state.member.members.memberCashPayments,
  memberCashPaymentsLoading: state.member.members.memberCashPaymentsLoading,
  refundTransactionID: state.member.members.refundTransactionID,
  refundTransactionInProgress: state.member.members.refundTransactionInProgress,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  profile: state.member.app.profile,
  snippets: state.member.app.snippets,
});

const mapDispatchToProps = {
  fetchPaymentHistory: actions.fetchPaymentHistory,
  setPaymentHistory: actions.setPaymentHistory,
  fetchMemberCashPayments: actions.fetchMemberCashPayments,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  sendReceipt: servicesActions.sendReceipt,
  refundTransaction: actions.refundTransaction,
  refundTransactionComplete: actions.refundTransactionComplete,
  updateMember: actions.updateMember,
  fetchCurrentMember: actions.fetchCurrentMember,
};

export class MemberViewNotes extends Component {
  constructor(props) {
    super(props);
    this.formatDeleteCell = this.formatDeleteCell.bind(this);

    const data = this.getData(this.props.memberItem);
    this._columns = this.getColumns();
    this.state = {
      data,
      memberIten: this.props.memberItem,
      showBillingHistoryModal: false,
      billingHistoryCustomerId: null,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (nextProps.memberItem) {
      this.setState({
        data: this.getData(nextProps.memberItem),
        memberItem: nextProps.memberItem,
      });
    }
  }

  UNSAFE_componentWillMount() {}

  openBillingHistory(billingCustomerId) {
    this.setState({
      showBillingHistoryModal: true,
      billingHistoryCustomerId: billingCustomerId,
    });
    const {
      space,
      profile,
      fetchPaymentHistory,
      setPaymentHistory,
      fetchMemberCashPayments,
      addNotification,
      setSystemError,
    } = this.props;
    fetchMemberCashPayments({ id: this.props.memberItem.id });
    fetchPaymentHistory({
      billingService: getAttributeValue(space, 'Billing Company'),
      billingRef: billingCustomerId,
      paymentType: 'ALL',
      paymentMethod: 'ALL',
      paymentSource: 'ALL',
      dateField: 'PAYMENT',
      dateFrom: moment
        .utc()
        .subtract(2, 'years')
        .format('YYYY-MM-DD'),
      dateTo: moment
        .utc()
        .add(1, 'days')
        .format('YYYY-MM-DD'),
      setPaymentHistory: setPaymentHistory,
      internalPaymentType: 'customer',
      addNotification: addNotification,
      setSystemError: setSystemError,
      timezone: getTimezone(profile.timezone, space.defaultTimezone),
      bamboraCutoverDate: getAttributeValue(space, 'Bambora Cutoff Date'),
      useSubAccount: false,
    });
  }

  getColumns() {
    return [
      {
        accessor: 'note',
        Header: 'Note',
        width: 800,
        style: { whiteSpace: 'unset' },
      },
      {
        accessor: 'contactMethod',
        width: 160,
        Cell: row => this.formatContactMethodCell(row),
      },
      {
        accessor: 'contactDate',
        Header: 'Created Date',
        Cell: row => moment(row.original.contactDate).format('L h:mm A'),
      },
      {
        accessor: 'submitter',
        Header: 'Submitter',
        style: { whiteSpace: 'unset' },
      },
      {
        accessor: 'submitter',
        Header: '',
        width: 50,
        Cell: this.formatDeleteCell,
      },
    ];
  }

  getData(memberItem) {
    let histories = memberItem.values['Notes History'];
    if (!histories) {
      return [];
    } else if (typeof histories !== 'object') {
      histories = JSON.parse(histories);
    }

    return histories
      .filter(note => !note.note.includes('Journey Event:'))
      .sort(function(history1, history2) {
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
  formatContactMethodCell(row) {
    if (row.original.contactMethod === 'phone') {
      return (
        <span className="notesCell phone">
          <img src={phone} alt="Phone Call" />
          Phone Call
        </span>
      );
    } else if (row.original.contactMethod === 'email') {
      return (
        <span className="notesCell email">
          <img src={mail} alt="Email" />
          Email
        </span>
      );
    } else if (row.original.contactMethod === 'sms') {
      return (
        <span className="notesCell sms">
          <img src={sms} alt="SMS" />
          SMS
        </span>
      );
    } else if (row.original.contactMethod === 'in_person') {
      return (
        <span className="notesCell in-person">
          <img src={in_person} alt="In Person" />
          In Person
        </span>
      );
    } else if (row.original.contactMethod === 'ClearBilling') {
      const note = row.original.note || '';
      const match = note.match(/Billing Customer Id:\s*([^,]+)/);
      const billingCustomerId = match ? match[1].trim() : null;
      return (
        <button
          type="button"
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() =>
            billingCustomerId && this.openBillingHistory(billingCustomerId)
          }
        >
          Payment History
        </button>
      );
    } else {
      return <span className="notesCell" />;
    }
  }

  formatDeleteCell(cellInfo) {
    return (
      <span
        className="deleteNote"
        onClick={async e => {
          console.log(
            e.currentTarget.getAttribute('noteDate') +
              ' ' +
              e.currentTarget.getAttribute('noteType'),
          );
          if (
            await confirm(
              <span>
                <span>Are your sure you want to DELETE this Note?</span>
                <table>
                  <tbody>
                    <tr>
                      <td>Date:</td>
                      <td>
                        {moment(
                          cellInfo.original.contactDate,
                          'YYYY-MM-DD HH:mm',
                        ).format('lll')}
                      </td>
                    </tr>
                    <tr>
                      <td>Note:</td>
                      <td>{cellInfo.original.note}</td>
                    </tr>
                  </tbody>
                </table>
              </span>,
            )
          ) {
            let history = getJson(
              this.props.memberItem.values['Notes History'],
            );
            history = history.filter(element => {
              return !(
                element.contactDate === cellInfo.original.contactDate &&
                element.contactMethod === cellInfo.original.contactMethod &&
                element.note === cellInfo.original.note
              );
            });
            console.log(history);
            this.props.saveRemoveMemberNote(history);
            this.setState({
              data: this.state.data.filter(
                element =>
                  !(
                    element.contactDate === cellInfo.original.contactDate &&
                    element.contactMethod === cellInfo.original.contactMethod &&
                    element.note === cellInfo.original.note
                  ),
              ),
            });
          }
        }}
      >
        <BinIcon className="icon icon-svg" />
      </span>
    );
  }
  render() {
    const {
      paymentHistory,
      paymentHistoryLoading,
      setupPaymentHistory,
      setupPaymentHistoryLoading,
      memberCashPayments,
      memberCashPaymentsLoading,
      refundTransactionID,
      refundTransactionInProgress,
      space,
      profile,
      memberItem,
      snippets,
      sendReceipt,
    } = this.props;
    const { showBillingHistoryModal, billingHistoryCustomerId } = this.state;

    return (
      <div className="row">
        <div className="col-sm-10 notesTable">
          <span style={{ width: '100%' }}>
            <h3>All Notes</h3>
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

        {showBillingHistoryModal && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1040,
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'center',
              paddingTop: '60px',
            }}
            onClick={e => {
              if (e.target === e.currentTarget)
                this.setState({ showBillingHistoryModal: false });
            }}
          >
            <div
              style={{
                background: '#fff',
                borderRadius: '6px',
                padding: '24px',
                width: '90%',
                maxWidth: '1100px',
                maxHeight: '80vh',
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}
              >
                <h4 style={{ margin: 0 }}>
                  Billing History — {billingHistoryCustomerId}
                </h4>
                <button
                  type="button"
                  className="btn btn-default btn-sm"
                  onClick={() =>
                    this.setState({ showBillingHistoryModal: false })
                  }
                >
                  Close
                </button>
              </div>
              {paymentHistoryLoading && (
                <div style={{ marginBottom: '8px', color: '#555' }} />
              )}
              <PaymentHistory
                paymentHistory={paymentHistory || []}
                memberCashPayments={memberCashPayments || []}
                setupPaymentHistory={setupPaymentHistory || []}
                paymentHistoryLoading={paymentHistoryLoading}
                setupPaymentHistoryLoading={false}
                memberCashPaymentsLoading={memberCashPaymentsLoading}
                membershipServicesLoading={false}
                cashRegistrationsLoading={false}
                membershipServices={[]}
                memberItem={memberItem}
                space={space}
                profile={profile}
                locale={profile.preferredLocale || space.defaultLocale}
                currency={
                  space.attributes && space.attributes['Currency']
                    ? space.attributes['Currency'][0]
                    : 'USD'
                }
                refundTransactionID={refundTransactionID || {}}
                refundTransactionInProgress={
                  refundTransactionInProgress || false
                }
                refundPayment={(
                  billingThis,
                  paymentId,
                  paymentAmount,
                  billingChangeReason,
                ) => {
                  this.props.refundTransaction({
                    transactionId: paymentId,
                    refundAmount: paymentAmount,
                    memberItem,
                    updateMember: this.props.updateMember,
                    fetchCurrentMember: this.props.fetchCurrentMember,
                    myThis: memberItem.myThis,
                    billingChangeReason,
                    addNotification: this.props.addNotification,
                    setSystemError: this.props.setSystemError,
                    billingThis,
                    refundTransactionComplete: this.props
                      .refundTransactionComplete,
                    useSubAccount: memberItem.values['useSubAccount'] === 'YES',
                  });
                }}
                sendReceipt={this.props.sendReceipt}
                snippets={snippets}
                addNotification={this.props.addNotification}
                setSystemError={this.props.setSystemError}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export const MemberViewNotesContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(MemberViewNotes);

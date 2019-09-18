import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import ReactSpinner from 'react16-spinjs';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import Select from 'react-select';
import { actions } from '../../redux/modules/members';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as messagingActions } from '../../redux/modules/messaging';
import memberAvatar from '../../images/member_avatar.png';
import { actions as errorActions } from '../../redux/modules/errors';

const mapStateToProps = state => ({
  memberItem: state.member.members.currentMember,
  leadItem: state.member.leads.currentLead,
  currentMemberLoading: state.member.members.currentMemberLoading,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  smsAccountCredit: state.member.messaging.smsAccountCredit,
  smsAccountCreditLoading: state.member.messaging.smsAccountCreditLoading,
});
const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  updateMember: actions.updateMember,
  updateLead: leadsActions.updateLead,
  fetchLead: leadsActions.fetchCurrentLead,
  sendSms: messagingActions.sendSms,
  getAccountCredit: messagingActions.getAccountCredit,
  setAccountCredit: messagingActions.setAccountCredit,
  createMemberActivities: messagingActions.createMemberActivities,
  createLeadActivities: messagingActions.createLeadActivities,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

const util = require('util');
export class SMSModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowSMSModal(false);
  };
  constructor(props) {
    super(props);
    this.getMessages = this.getMessages.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.sendSms = this.sendSms.bind(this);
    this.state = {
      messages: this.getMessages(this.props.submission),
      smsText: '',
    };
  }

  componentWillReceiveProps(nextProps) {}

  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  sendSms() {
    if (!this.state.smsText) {
      console.log('SMS text is required to send SMS');
      return;
    }

    this.props.sendSmsMessage({
      type: 'outbound',
      status: 'sent',
      to: this.props.submission.values['Phone Number'] + (this.props.submission.values['Additional Phone Number'] ? "," + this.props.submission.values['Additional Phone Number'] : ''),
      text: this.state.smsText,
      datetime: moment().format('DD-MM-YYYY hh:mm A'),
    });
  }

  handleChange(event) {
    this.setState({ smsText: event.target.value });
  }

  getMessages(submission) {
    let sms_msgs = [];
    if (!submission.smsContent) {
      return null;
    }
    let messageHistory = [];
    if (typeof submission.smsContent !== 'object') {
      messageHistory = JSON.parse(submission.smsContent);
    } else {
      messageHistory = submission.smsContent;
    }

    messageHistory.forEach((msg, index) => {
      let content = JSON.parse(msg.values.Content);

      if (msg.values.Direction === 'Outbound') {
        var dt = moment(content['Sent Date'], 'DD-MM-YYYY HH:mm');
        dt = dt.add(moment().utcOffset() * 60, 'seconds');
        content['Sent Date'] = dt.format('DD-MM-YYYY HH:mm');
        sms_msgs.push(
          <div className="outgoing_msg" key={index}>
            <div className="sent_msg">
              <p>{content['Content']}</p>
              <span className="time_date">{content['Sent Date']}</span>{' '}
            </div>
          </div>,
        );
      } else if (msg.values.Direction === 'Inbound') {
        var dt = moment(content['Received Date'], 'DD-MM-YYYY HH:mm');
        dt = dt.add(moment().utcOffset() * 60, 'seconds');
        content['Received Date'] = dt.format('DD-MM-YYYY HH:mm');
        sms_msgs.push(
          <div className="incoming_msg" key={index}>
            <div className="incoming_msg_img">
              {' '}
              <img src={memberAvatar} alt="Person" />{' '}
            </div>
            <div className="received_msg">
              <div className="received_withd_msg">
                <p>{content['Content']}</p>
                <span className="time_date">{content['Received Date']}</span>
              </div>
            </div>
          </div>,
        );
      }
    });
    return sms_msgs;
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog onClose={this.handleClose} className="sms-modal">
            <div>
              <div className="row">
                <div className="col-md-12" style={{ textAlign: 'center' }}>
                  {this.props.target} -{' '}
                  {this.props.submission.values['First Name']}{' '}
                  {this.props.submission.values['Last Name']}
                </div>
              </div>
              <div className="row">
                <div
                  className="col-md-6 form-inline"
                  style={{ margin: '10px 0px 10px 0px' }}
                >
                  <label htmlFor="phone_number" className="label label-default">
                    Phone Number
                  </label>
                  <span
                    className="form-control"
                    style={{ marginLeft: '10px', width: '70%' }}
                  >
                    {this.props.submission.values['Phone Number']}
                  </span>
                </div>
                <div
                  className="col-md-6 form-inline"
                  style={{ margin: '10px 0px 10px 0px' }}
                >
                  <label
                    htmlFor="account_credit"
                    className="label label-default"
                  >
                    Account Credit
                  </label>
                  <span
                    className="form-control"
                    style={{ marginLeft: '10px', width: '70%' }}
                  >
                    {this.props.smsAccountCreditLoading
                      ? 'Loading...'
                      : this.props.smsAccountCredit}
                  </span>
                </div>
              </div>
              <div className="row">
                <div className="col-md-12">
                  <label htmlFor="sms_text">SMS Text</label>
                  <div className="input-group">
                    <textarea
                      className="form-control custom-control"
                      rows="3"
                      style={{ resize: 'none' }}
                      id="sms_text"
                      value={this.state.smsText}
                      onChange={this.handleChange}
                      placeholder="Type SMS text here ..."
                    />
                    <button
                      className="input-group-addon btn btn-primary"
                      onClick={e => this.sendSms()}
                      style={{ backgroundColor: '#05728f' }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
              <div className="row">
                <div
                  className="col-md-12"
                  style={{ margin: '10px 0px 10px 0px' }}
                >
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ backgroundColor: '#05728f' }}
                    onClick={e =>
                      this.props.setShowMessageHistory(
                        this.props.showMessageHistory ? false : true,
                      )
                    }
                  >
                    {this.props.showMessageHistory
                      ? 'Hide Message History'
                      : 'Show Message History'}
                  </button>
                </div>
              </div>
              {this.props.showMessageHistory && (
                <div className="row">
                  <div className="col-md-12">
                    <div className="messaging">
                      <div className="msg_box">
                        <div className="mesgs">
                          <div className="msg_history">
                            {this.state.messages &&
                            this.state.messages.length > 0
                              ? this.state.messages
                              : 'No messages to show'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('showMessageHistory', 'setShowMessageHistory', true),
  withHandlers({
    sendSmsMessage: ({
      submission,
      sendSms,
      createLeadActivities,
      createMemberActivities,
      fetchCurrentMember,
      fetchLead,
      updateMember,
      updateLead,
      memberItem,
      leadItem,
      target,
      addNotification,
      setSystemError,
    }) => sms => {
      if (!sms) {
        console.log('No SMS to send, returning...');
        return;
      }

      if (target === 'Member') {
        memberItem.values['SMS Sent Count'] =
          (!memberItem.values['SMS Sent Count'] ||
          isNaN(memberItem.values['SMS Sent Count'])
            ? 0
            : parseInt(memberItem.values['SMS Sent Count'])) + 1;
        sendSms({
          sms: sms,
          target: target,
          id: submission['id'],
          memberItem: submission,
          updateMember,
          createMemberActivities: createMemberActivities,
          fetchMember: fetchCurrentMember,
          addNotification: addNotification,
          setSystemError: setSystemError,
          myThis: this,
          smsInputElm: $('#sms_text'),
        });
      } else if (target === 'Leads') {
        leadItem.values['SMS Sent Count'] =
          (!leadItem.values['SMS Sent Count'] ||
          isNaN(leadItem.values['SMS Sent Count'])
            ? 0
            : parseInt(leadItem.values['SMS Sent Count'])) + 1;
        sendSms({
          sms: sms,
          target: target,
          id: submission['id'],
          leadItem: submission,
          updateLead,
          createLeadActivities: createLeadActivities,
          fetchLead: fetchLead,
          addNotification: addNotification,
          setSystemError: setSystemError,
          myThis: this,
          smsInputElm: $('#sms_text'),
        });
      }
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.getAccountCredit({
        setAccountCredit: this.props.setAccountCredit,
      });
    },
  }),
);
export const SMSModalContainer = enhance(SMSModal);

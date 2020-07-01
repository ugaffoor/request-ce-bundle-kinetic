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
import moment from 'moment';

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

    let numberOptions = [
      {
        value: this.props.submission.values['Phone Number'],
        label: this.props.submission.values['Phone Number'],
      },
    ];

    if (this.props.submission.values['Additional Phone Number']) {
      numberOptions.push({
        value: this.props.submission.values['Additional Phone Number'],
        label: this.props.submission.values['Additional Phone Number'],
      });
    }

    this.state = {
      messages: this.getMessages(this.props.submission),
      smsText: '',
      selectedOption: numberOptions,
      options: numberOptions,
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

    if (!this.state.selectedOption.length > 0) {
      console.log('At least one phone number must be selected');
      return;
    }

    let to = null;
    if (this.state.selectedOption.length == 1) {
      to = this.state.selectedOption[0].value;
    } else {
      to =
        this.state.selectedOption[0].value +
        ',' +
        this.state.selectedOption[1].value;
    }

    this.props.sendSmsMessage({
      type: 'outbound',
      status: 'sent',
      to: to,
      text: this.state.smsText,
      datetime: moment().format('DD-MM-YYYY hh:mm A'),
    });
  }

  handleRecipientChange = selectedOption => {
    this.setState({ selectedOption });
  };

  handleChange(event) {
    this.setState({ smsText: event.target.value });
  }

  getMessages(submission) {
    let sms_msgs = [];
    if (!submission.smsContent) {
      return null;
    }
    let sms = [];
    if (typeof submission.smsContent !== 'object') {
      sms = JSON.parse(submission.smsContent);
    } else {
      sms = submission.smsContent;
    }

    let smsValues = [];
    sms.forEach(value => {
      let content = JSON.parse(value.values['Content']);
      var dt =
        value.values['Direction'] === 'Outbound'
          ? content['Sent Date']
          : content['Received Date'];

      dt = moment(dt, 'DD-MM-YYYY HH:mm');
      dt = dt.add(moment().utcOffset() * 60, 'seconds');

      smsValues[smsValues.length] = {
        Direction: value.values['Direction'],
        Date: dt.format('DD-MM-YYYY HH:mm'),
        Content: content['Content'],
      };
    });
    smsValues.sort(function(sms1, sms2) {
      if (
        moment(sms1['Date'], 'DD-MM-YYYY HH:mm').isAfter(
          moment(sms2['Date'], 'DD-MM-YYYY HH:mm'),
        )
      ) {
        return -1;
      } else if (
        moment(sms1['Date'], 'DD-MM-YYYY HH:mm').isBefore(
          moment(sms2['Date'], 'DD-MM-YYYY HH:mm'),
        )
      ) {
        return 1;
      }
      if (sms1['Content'][0] === '[' && sms2['Content'][0] === '[') {
        var page1 = sms1['Content'].substring(1, sms1['Content'].indexOf('/'));
        var page2 = sms2['Content'].substring(1, sms2['Content'].indexOf('/'));
        if (parseInt(page1) > parseInt(page2)) {
          return 1;
        } else if (parseInt(page1) < parseInt(page2)) {
          return -1;
        }
      }
      return 0;
    });

    var smsResult = [];

    smsValues.forEach(element => {
      var idx = smsResult.findIndex(el => el['Date'] === element['Date']);
      if (idx === -1) {
        if (element['Content'][0] === '[')
          element['Content'] = element['Content'].split(']')[1].trim();
        smsResult.push(element);
      } else {
        smsResult[idx]['Content'] =
          smsResult[idx]['Content'] +
          (element['Content'][0] === '['
            ? element['Content'].split(']')[1]
            : element['Content']
          ).trim();
      }
    });

    smsResult.forEach((element, index) => {
      if (element['Direction'] === 'Outbound') {
        var dt = moment(element['Date'], 'DD-MM-YYYY HH:mm');
        dt = dt.add(moment().utcOffset() * 60, 'seconds');
        element['Date'] = dt.format('DD-MM-YYYY HH:mm');
        sms_msgs.push(
          <div className="outgoing_msg" key={index}>
            <div className="sent_msg">
              <p>{element['Content']}</p>
              <span className="time_date">{element['Date']}</span>{' '}
            </div>
          </div>,
        );
      } else if (element['Direction'] === 'Inbound') {
        dt = moment(element['Date'], 'DD-MM-YYYY HH:mm');
        dt = dt.add(moment().utcOffset() * 60, 'seconds');
        element['Date'] = dt.format('DD-MM-YYYY HH:mm');
        sms_msgs.push(
          <div className="incoming_msg" key={index}>
            <div className="incoming_msg_img">
              {' '}
              <img src={memberAvatar} alt="Person" />{' '}
            </div>
            <div className="received_msg">
              <div className="received_withd_msg">
                <p>{element['Content']}</p>
                <span className="time_date">{element['Date']}</span>
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
        <ModalContainer onClose={this.handleClose} zIndex={1030}>
          <ModalDialog onClose={this.handleClose} style={inlineStyle}>
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
                  <span style={{ marginLeft: '10px', width: '70%' }}>
                    <Select
                      value={this.state.selectedOption}
                      onChange={this.handleRecipientChange}
                      options={this.state.options}
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      controlShouldRenderValue={true}
                      isMulti={true}
                      isDisabled={this.state.options.length > 1 ? false : true}
                      isClearable={false}
                    />
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
                      maxlength="765"
                      style={{ resize: 'none' }}
                      id="sms_text"
                      value={this.state.smsText}
                      onChange={this.handleChange}
                      placeholder="Max 765 characters allowed"
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
  connect(mapStateToProps, mapDispatchToProps),
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

const inlineStyle = {
  position: 'absolute',
  marginBottom: '20px',
  width: '80%',
  height: '80%',
  top: '10%',
  transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
  left: '10%',
  overflowY: 'scroll',
};

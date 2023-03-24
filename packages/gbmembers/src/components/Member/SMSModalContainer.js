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
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { substituteFields } from '../leads/LeadsUtils';
import NumberFormat from 'react-number-format';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  leadItem: state.member.leads.currentLead,
  currentMemberLoading: state.member.members.currentMemberLoading,
  currentLeadLoading: state.member.leads.currentLeadLoading,
  smsAccountCredit: state.member.messaging.smsAccountCredit,
  smsAccountCreditLoading: state.member.messaging.smsAccountCreditLoading,
  smsTemplateCategories: state.member.datastore.smsTemplateCategories,
  smsTemplates: state.member.datastore.smsTemplates,
  smsTemplatesLoading: state.member.datastore.smsTemplatesLoading,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  fetchCurrentMemberAdditional: actions.fetchCurrentMemberAdditional,
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
  fetchSMSTemplates: dataStoreActions.fetchSMSTemplates,
};

const util = require('util');
export class SMSModal extends Component {
  handleClose = e => {
    this.setState({ isShowingModal: false });
    this.props.setShowSMSModal(false);
  };
  constructor(props) {
    super(props);
    this.getMessages = this.getMessages.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.sendSms = this.sendSms.bind(this);
    this.selectSMSTemplate = this.selectSMSTemplate.bind(this);

    let numberOptions = [
      {
        value: this.props.submission.values['Phone Number'],
        label: (
          <NumberFormat
            value={this.props.submission.values['Phone Number']}
            displayType={'text'}
            format={
              getAttributeValue(props.space, 'PhoneNumber Format') !== undefined
                ? getAttributeValue(props.space, 'PhoneNumber Format')
                : '####-###-###'
            }
          />
        ),
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

  UNSAFE_componentWillReceiveProps(nextProps) {}

  UNSAFE_componentWillMount() {
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
    if (this.state.selectedOption.length === 1) {
      to = this.state.selectedOption[0].value;
    } else {
      to =
        this.state.selectedOption[0].value +
        ',' +
        this.state.selectedOption[1].value;
    }
    var content = this.state.smsText;

    content = content.replace(
      /member\('First Name'\)/g,
      this.props.target === 'Member'
        ? this.props.memberItem.values['First Name']
        : this.props.leadItem.values['First Name'],
    );
    content = content.replace(
      /member\('Last Name'\)/g,
      this.props.target === 'Member'
        ? this.props.memberItem.values['Last Name']
        : this.props.leadItem.values['Last Name'],
    );

    var matches = content.match(/\$\{.*?\('(.*?)'\)\}/g);
    var self = this;
    if (matches !== null) {
      matches.forEach(function(value, index) {
        console.log(value);
        if (value.indexOf('spaceAttributes') !== -1) {
          content = content.replace(
            new RegExp(
              value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'),
              'g',
            ),
            self.props.space.attributes[value.split("'")[1]][0],
          );
        }
      });
    }

    var dt = moment().format('L hh:mm A');
    this.props.sendSmsMessage({
      type: 'outbound',
      status: 'sent',
      to: to,
      text: content,
      datetime: dt,
    });

    var newMessages = [];

    newMessages.push(
      <div className="outgoing_msg" key={this.state.messages.length + 1}>
        <div className="sent_msg">
          <p>{content}</p>
          <span className="time_date">{dt}</span>{' '}
        </div>
      </div>,
    );
    this.setState({
      messages: newMessages.concat(this.state.messages),
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
          : /*content['Received Date'];*/ value['createdAt'];

      dt = moment(dt, [
        'L HH:mm',
        'DD-MM-YYYY HH:mm',
        'YYYY-MM-DDThh:mm:ss.SSSZ',
      ]);
      //      dt = dt.add(moment().utcOffset() * 60, 'seconds');

      dt = moment(value['createdAt']);

      smsValues[smsValues.length] = {
        Direction: value.values['Direction'],
        Date: dt.format('L h:mm A'),
        Content: content['Content'],
      };
    });
    smsValues.sort(function(sms1, sms2) {
      if (
        moment(sms1['Date'], 'L hh:mm A').isAfter(
          moment(sms2['Date'], 'L hh:mm A'),
        )
      ) {
        return -1;
      } else if (
        moment(sms1['Date'], 'L hh:mm A').isBefore(
          moment(sms2['Date'], 'L hh:mm A'),
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
      var idx = smsResult.findIndex(
        el =>
          el['Date'] === element['Date'] &&
          el['Direction'] === element['Direction'],
      );
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
        var dt = moment(element['Date'], 'L HH:mm');
        //dt = dt.add(moment().utcOffset() * 60, 'seconds');
        element['Date'] = dt.format('L HH:mm');
        sms_msgs.push(
          <div className="outgoing_msg" key={index}>
            <div className="sent_msg">
              <p>{element['Content']}</p>
              <span className="time_date">{element['Date']}</span>{' '}
            </div>
          </div>,
        );
      } else if (element['Direction'] === 'Inbound') {
        dt = moment(element['Date'], 'L HH:mm');
        //dt = dt.add(moment().utcOffset() * 60, 'seconds');
        element['Date'] = dt.format('L HH:mm');
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

  getSMSTemplates(smsTemplates) {
    let templates = [];
    smsTemplates.forEach(template => {
      templates.push({
        label:
          template.values['Category'] !== undefined &&
          template.values['Category'] !== null
            ? template.values['Category'] +
              '->' +
              template.values['Template Name']
            : template.values['Template Name'],
        value: template.id,
      });
    });
    return templates;
  }
  selectSMSTemplate(e) {
    let templateId = e.value;
    if (!templateId) {
      console.log('Please select a template');
      return;
    }
    let template = this.props.smsTemplates.find(
      template => template['id'] === templateId,
    );
    var smsText = substituteFields(
      template.values['SMS Content'],
      this.props.target === 'Leads'
        ? this.props.leadItem
        : this.props.memberItem,
      this.props.space,
      this.props.profile,
    );

    this.setState({ smsText: smsText });
  }

  render() {
    return (
      <div>
        <ModalContainer zIndex={1030}>
          <ModalDialog
            onClose={this.handleClose}
            style={inlineStyle}
            dismissOnBackgroundClick={false}
            className="smsDialog"
          >
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
                  <Select
                    closeMenuOnSelect={true}
                    options={this.getSMSTemplates(this.props.smsTemplates)}
                    className="sms-templates-container"
                    classNamePrefix="hide-columns"
                    placeholder="Select SMS Template"
                    onChange={e => {
                      this.selectSMSTemplate(e);
                    }}
                    style={{ width: '300px' }}
                  />
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
                      style={{ backgroundColor: '#4d5059' }}
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
                    style={{ backgroundColor: '#4d5059' }}
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
      fetchCurrentMemberAdditional,
      allMembers,
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
          fetchMemberAdditional: fetchCurrentMemberAdditional,
          allMembers: allMembers,
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
    UNSAFE_componentWillMount() {
      this.props.getAccountCredit({
        setAccountCredit: this.props.setAccountCredit,
      });
      this.props.fetchSMSTemplates();
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
  left: '20%',
  overflowY: 'scroll',
};

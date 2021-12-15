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
import NumberFormat from 'react-number-format';
import 'react-datetime/css/react-datetime.css';
import ReactTable from 'react-table';
import moment from 'moment';
import { email_sent_date_format, substituteFields } from '../leads/LeadsUtils';
import Select, { components } from 'react-select';
import { actions as memberActions } from '../../redux/modules/members';
import { matchesMemberFilter, matchesLeadFilter } from '../../utils/utils';
import { actions as messagingActions } from '../../redux/modules/messaging';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import PropTypes from 'prop-types';
import { actions as dataStoreActions } from '../../redux/modules/settingsDatastore';
import { actions as leadsActions } from '../../redux/modules/leads';
import { actions as appActions } from '../../redux/modules/memberApp';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newSmsCampaign,
  newCampaignLoading: state.member.campaigns.newSmsCampaignLoading,
  memberLists: state.member.app.memberLists,
  leadLists: state.member.app.leadLists,
  allMembers: state.member.members.allMembers,
  allLeads: state.member.leads.allLeads,
  profile: state.app.profile,
  space: state.member.app.space,
  smsAccountCredit: state.member.messaging.smsAccountCredit,
  smsAccountCreditLoading: state.member.messaging.smsAccountCreditLoading,
  smsTemplateCategories: state.member.datastore.smsTemplateCategories,
  smsTemplates: state.member.datastore.smsTemplates,
  smsTemplatesLoading: state.member.datastore.smsTemplatesLoading,
});
const mapDispatchToProps = {
  createCampaign: actions.createSmsCampaign,
  fetchNewCampaign: actions.fetchNewSmsCampaign,
  updateCampaign: actions.updateSmsCampaign,
  sendSms: messagingActions.sendBulkSms,
  createMemberActivities: messagingActions.createMemberActivities,
  createLeadActivities: messagingActions.createLeadActivities,
  fetchMembers: memberActions.fetchMembers,
  getAccountCredit: messagingActions.getAccountCredit,
  setAccountCredit: messagingActions.setAccountCredit,
  fetchSMSTemplates: dataStoreActions.fetchSMSTemplates,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};

const util = require('util');

export class NewSmsCampaign extends Component {
  constructor(props) {
    super(props);

    this.handleSmsTextChange = this.handleSmsTextChange.bind(this);
    this.handleRecipientChange = this.handleRecipientChange.bind(this);
    this.handleLeadRecipientChange = this.handleLeadRecipientChange.bind(this);

    this.createCampaign = this.createCampaign.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);
    this.selectSMSTemplate = this.selectSMSTemplate.bind(this);
    this.state = {
      content: '',
      options: this.getSelectOptions(
        this.props.memberLists,
        this.props.allMembers,
      ),
      selectedOption: [],
      leadOptions: this.getSelectLeadOptions(
        this.props.leadLists,
        this.props.allLeads,
      ),
      selectedLeadOption: [],
      smsCreditsRequired: 0,
      uniquePhoneNumbersCount: 0,
      disableCreateCampaign: true,
      showManageNumbersModal: false,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    if (
      nextProps.allMembers !== undefined &&
      nextProps.allMembers.length !== this.props.allMembers.length
    ) {
      this.setState({
        options: this.getSelectOptions(
          nextProps.memberLists,
          nextProps.allMembers,
        ),
      });
    }
    if (
      nextProps.allLeads !== undefined &&
      nextProps.allLeads.length !== this.props.allLeads.length
    ) {
      this.setState({
        leadOptions: this.getSelectLeadOptions(
          nextProps.leadLists,
          nextProps.allLeads,
        ),
      });
    }
  }

  UNSAFE_componentWillMount() {
    this.props.getAccountCredit({
      setAccountCredit: this.props.setAccountCredit,
    });
    this.props.fetchSMSTemplates();
  }

  getSelectOptions(memberLists, allMembers) {
    let options = [];
    let activeMemberIds = [];
    let inactiveMemberIds = [];
    let activeMemberPhoneNumbers = [];
    let inactiveMemberPhoneNumbers = [];

    allMembers.forEach(member => {
      let numbersMap = {};
      numbersMap['id'] = member['id'];
      numbersMap['number'] = member.values['Phone Number'];
      if (member.values['Additional Phone Number']) {
        numbersMap['additionalNumber'] =
          member.values['Additional Phone Number'];
      }
      if (member.values['Status'] === 'Active') {
        activeMemberIds.push(member['id']);
        activeMemberPhoneNumbers.push(numbersMap);
      } else if (member.values['Status'] === 'Inactive') {
        inactiveMemberIds.push(member['id']);
        inactiveMemberPhoneNumbers.push(numbersMap);
      }
    });

    if (activeMemberIds.length > 0) {
      options.push({
        value: '__active_members__',
        label: 'Active Members',
        ids: activeMemberIds,
        phoneNumbers: activeMemberPhoneNumbers,
      });
    }

    if (inactiveMemberIds.length > 0) {
      options.push({
        value: '__inactive_members__',
        label: 'Inactive Members',
        ids: inactiveMemberIds,
        phoneNumbers: inactiveMemberPhoneNumbers,
      });
    }

    memberLists.forEach(list => {
      let matchesFilter = matchesMemberFilter(allMembers, list.filters);
      options.push({
        value: list.name,
        label: list.name,
        ids: matchesFilter.map(member => member['id']),
        phoneNumbers: matchesFilter.map(member => {
          let numbersMap = {};
          numbersMap['id'] = member['id'];
          numbersMap['number'] = member.values['Phone Number'];
          if (member.values['Additional Phone Number']) {
            numbersMap['additionalNumber'] =
              member.values['Additional Phone Number'];
          }
          return numbersMap;
        }),
      });
    });

    return options;
  }

  getSelectLeadOptions(leadLists, allLeads) {
    let options = [];

    allLeads.forEach(lead => {
      let leadsMap = {};
      leadsMap['id'] = lead['id'];
      leadsMap['number'] = lead.values['Phone Number'];
      if (lead.values['Additional Phone Number']) {
        leadsMap['additionalNumber'] = lead.values['Additional Phone Number'];
      }
    });

    leadLists.forEach(list => {
      let matchesFilter = matchesLeadFilter(allLeads, list.filters);
      options.push({
        value: list.name,
        label: list.name,
        ids: matchesFilter.map(lead => lead['id']),
        phoneNumbers: matchesFilter.map(lead => {
          let leadsMap = {};
          leadsMap['id'] = lead['id'];
          leadsMap['number'] = lead.values['Phone Number'];
          if (lead.values['Additional Phone Number']) {
            leadsMap['additionalNumber'] =
              lead.values['Additional Phone Number'];
          }
          return leadsMap;
        }),
      });
    });

    return options;
  }

  handleRecipientChange = selectedOption => {
    let difference = this.state.selectedOption.filter(
      x => !selectedOption.includes(x),
    );
    difference.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        phoneNumber.primaryDeleted = false;
        if (phoneNumber.additionalNumber) {
          phoneNumber.secondaryDeleted = false;
        }
      });
    });

    this.setState({ selectedOption });
    let phoneNumbers = [];
    selectedOption.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        if (!phoneNumber.primaryDeleted) {
          phoneNumbers.push(phoneNumber.number);
        }
        if (phoneNumber.additionalNumber && !phoneNumber.secondaryDeleted) {
          phoneNumbers.push(phoneNumber.additionalNumber);
        }
      });
    });

    let uniquePhoneNumbers = new Set(phoneNumbers);
    let creditsRequired =
      uniquePhoneNumbers.size * this.getSmsCount(this.state.content);
    let disableCreateCampaign =
      creditsRequired > this.props.smsAccountCredit ||
      uniquePhoneNumbers.size <= 0 ||
      this.state.content.length <= 0 ||
      this.state.content.length > 765
        ? true
        : false;

    this.setState({
      smsCreditsRequired: creditsRequired,
      uniquePhoneNumbersCount: uniquePhoneNumbers.size,
      disableCreateCampaign,
    });
  };

  handleLeadRecipientChange = selectedLeadOption => {
    let difference = this.state.selectedLeadOption.filter(
      x => !selectedLeadOption.includes(x),
    );
    difference.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        phoneNumber.primaryDeleted = false;
        if (phoneNumber.additionalNumber) {
          phoneNumber.secondaryDeleted = false;
        }
      });
    });

    this.setState({ selectedLeadOption });
    let phoneNumbers = [];
    selectedLeadOption.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        if (!phoneNumber.primaryDeleted) {
          phoneNumbers.push(phoneNumber.number);
        }
        if (phoneNumber.additionalNumber && !phoneNumber.secondaryDeleted) {
          phoneNumbers.push(phoneNumber.additionalNumber);
        }
      });
    });

    let uniquePhoneNumbers = new Set(phoneNumbers);
    let creditsRequired =
      uniquePhoneNumbers.size * this.getSmsCount(this.state.content);
    let disableCreateCampaign =
      creditsRequired > this.props.smsAccountCredit ||
      uniquePhoneNumbers.size <= 0 ||
      this.state.content.length <= 0 ||
      this.state.content.length > 765
        ? true
        : false;

    this.setState({
      smsCreditsRequired: creditsRequired,
      uniquePhoneNumbersCount: uniquePhoneNumbers.size,
      disableCreateCampaign,
    });
  };

  updateCreditsRequired = () => {
    let phoneNumbers = [];
    let options =
      this.props.submissionType === 'member'
        ? this.state.selectedOption
        : this.state.selectedLeadOption;
    options.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        if (!phoneNumber.primaryDeleted) {
          phoneNumbers.push(phoneNumber.number);
        }
        if (phoneNumber.additionalNumber && !phoneNumber.secondaryDeleted) {
          phoneNumbers.push(phoneNumber.additionalNumber);
        }
      });
    });

    let uniquePhoneNumbers = new Set(phoneNumbers);
    let creditsRequired =
      uniquePhoneNumbers.size * this.getSmsCount(this.state.content);
    this.setState({
      uniquePhoneNumbersCount: uniquePhoneNumbers.size,
      smsCreditsRequired: creditsRequired,
    });
  };

  getSmsCount = smsText => {
    if (smsText.length <= 160) {
      return 1;
    } else if (smsText.length > 160 && smsText.length <= 306) {
      return 2;
    } else if (smsText.length > 306 && smsText.length <= 459) {
      return 3;
    } else if (smsText.length > 459 && smsText.length <= 612) {
      return 4;
    } else if (smsText.length > 612 && smsText.length <= 765) {
      return 5;
    }

    return -0;
  };

  createCampaign() {
    if (
      (this.state.selectedOption.length <= 0 ||
        this.state.selectedLeadOption.length <= 0) &&
      this.state.content.length <= 0
    ) {
      console.log('Recipients and sms content is required');
      return;
    }

    if (this.state.content.length > 765) {
      console.log('The sms text length can not exceed 765 charatcers.');
      return;
    }

    if (this.state.smsCreditsRequired > this.props.smsAccountCredit) {
      console.log(
        'Credits required for this operation exceed available credits.',
      );
      return;
    }

    let ids = [];
    let phoneNumbers = [];

    let options =
      this.props.submissionType === 'member'
        ? this.state.selectedOption
        : this.state.selectedLeadOption;

    options.forEach(option => {
      option.phoneNumbers.forEach(phoneNumber => {
        let obj = { id: phoneNumber.id };
        if (!phoneNumber.primaryDeleted) {
          obj.number = phoneNumber.number;
        }
        if (phoneNumber.additionalNumber && !phoneNumber.secondaryDeleted) {
          obj.additionalNumber = phoneNumber.additionalNumber;
        }
        phoneNumbers.push(obj);
      });
      ids.push(...option.ids);
    });

    if (ids.length <= 0) {
      console.log('Selected member list contains no members');
      return;
    }

    this.props.saveCampaign(
      ids,
      phoneNumbers,
      this.state.content,
      this.props.space,
      this.props.submissionType,
    );
  }

  handleSmsTextChange(event) {
    this.determineCreditRequired(event.target.value);
  }

  determineCreditRequired(text) {
    let smsCreditsRequired =
      this.state.uniquePhoneNumbersCount * this.getSmsCount(text);
    let disableCreateCampaign =
      smsCreditsRequired > this.props.smsAccountCredit ||
      this.state.uniquePhoneNumbersCount <= 0 ||
      text.length <= 0 ||
      text.length > 765
        ? true
        : false;
    this.setState({
      content: text,
      smsCreditsRequired,
      disableCreateCampaign,
    });
  }
  showManageNumbersModal = val => {
    this.setState({ showManageNumbersModal: val });
  };

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
      undefined,
      this.props.space,
      this.props.profile,
    );

    this.determineCreditRequired(smsText);
  }
  render() {
    return (
      <div className="new_campaign" style={{ marginTop: '2%' }}>
        <div
          className="row form-group mb-0"
          style={{
            height: '100px',
            backgroundColor: '#f7f7f7',
            paddingTop: '2%',
          }}
        >
          <label htmlFor="memberList" className="col-form-label mt-0 ml-1">
            You are currently sending this sms to{' '}
            {this.props.submissionType === 'member' ? 'Members' : 'Leads'}
          </label>
          <div className="col-sm-5">
            {this.props.submissionType === 'member' ? (
              <Select
                value={this.state.selectedOption}
                onChange={this.handleRecipientChange}
                options={this.state.options}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            ) : (
              <Select
                value={this.state.selectedLeadOption}
                onChange={this.handleLeadRecipientChange}
                options={this.state.leadOptions}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            )}
          </div>
          {this.props.submissionType === 'member' ? (
            <div className="col-sm-3">
              <button
                onClick={e => this.showManageNumbersModal(true)}
                disabled={this.state.selectedOption.length > 0 ? false : true}
              >
                Manage Numbers
              </button>
              {this.state.showManageNumbersModal && (
                <ManageNumbersModal
                  users={this.props.allMembers}
                  options={this.state.selectedOption}
                  showManageNumbersModal={this.showManageNumbersModal}
                  updateCreditsRequired={this.updateCreditsRequired}
                />
              )}
            </div>
          ) : (
            <div className="col-sm-3">
              <button
                onClick={e => this.showManageNumbersModal(true)}
                disabled={
                  this.state.selectedLeadOption.length > 0 ? false : true
                }
              >
                Manage Numbers
              </button>
              {this.state.showManageNumbersModal && (
                <ManageNumbersModal
                  users={this.props.allLeads}
                  options={this.state.selectedLeadOption}
                  showManageNumbersModal={this.showManageNumbersModal}
                  updateCreditsRequired={this.updateCreditsRequired}
                />
              )}
            </div>
          )}
        </div>
        <div
          className="row form-group mt-0 pb-1"
          style={{
            backgroundColor: '#f7f7f7',
          }}
        >
          <label htmlFor="sms_cost" className="label label-default ml-1">
            Credits Required
          </label>
          <div className="col-sm-4">
            <span className="form-control input-sm">
              {this.state.smsCreditsRequired}
            </span>
          </div>
          <label htmlFor="account_credit" className="label label-default">
            Available Credits
          </label>
          <div className="col-sm-4">
            <span className="form-control input-sm">
              {this.props.smsAccountCreditLoading
                ? 'Loading...'
                : this.props.smsAccountCredit}
            </span>
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
        </div>
        <div className="row">
          <div className="col-md-10" style={{ height: '1000px' }}>
            <span className="line">
              <label htmlFor="sms_text">
                SMS Text: NOTE, member('ID'), member('First Name'), member('Last
                Name') substitutes don't work for campaigns
              </label>
              <div className="input-group">
                <textarea
                  value={this.state.content}
                  onChange={this.handleSmsTextChange}
                  className="form-control custom-control"
                  rows="8"
                  maxlength="765"
                  style={{ resize: 'none' }}
                  placeholder="Max 765 characters allowed"
                />
                <button
                  type="button"
                  id="createCampaignBtn"
                  onClick={e => this.createCampaign()}
                  disabled={this.state.disableCreateCampaign}
                  className="input-group-addon btn btn-primary"
                >
                  Send
                </button>
              </div>
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export const NewSmsCampaignView = ({
  campaignItem,
  newCampaignLoading,
  saveCampaign,
  memberLists,
  leadLists,
  isDirty,
  setIsDirty,
  updateCampaign,
  allMembers,
  allLeads,
  leadItem,
  profile,
  space,
  submissionType,
  smsAccountCreditLoading,
  smsAccountCredit,
  getAccountCredit,
  setAccountCredit,
  fetchSMSTemplates,
  smsTemplateCategories,
  smsTemplates,
  smsTemplatesLoading,
}) =>
  newCampaignLoading ? (
    <div />
  ) : (
    <div className="container-fluid">
      <NewSmsCampaign
        campaignItem={campaignItem}
        saveCampaign={saveCampaign}
        memberLists={memberLists}
        leadLists={leadLists}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        updateCampaign={updateCampaign}
        allMembers={allMembers}
        allLeads={allLeads}
        leadItem={leadItem}
        profile={profile}
        space={space}
        submissionType={submissionType}
        smsAccountCreditLoading={smsAccountCreditLoading}
        smsAccountCredit={smsAccountCredit}
        getAccountCredit={getAccountCredit}
        setAccountCredit={setAccountCredit}
        fetchSMSTemplates={fetchSMSTemplates}
        smsTemplateCategories={smsTemplateCategories}
        smsTemplates={smsTemplates}
        smsTemplatesLoading={smsTemplatesLoading}
      />
    </div>
  );

export const SmsCampaignContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ match }) => {
    return {
      submissionType: match.params.submissionType,
    };
  }),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveCampaign: ({
      campaignItem,
      createCampaign,
      sendSms,
      createMemberActivities,
      createLeadActivities,
      fetchMembers,
      escapeRegExp,
    }) => (ids, phoneNumbers, content, space, submissionType) => {
      var matches = content.match(/\$\{.*?\('(.*?)'\)\}/g);
      if (matches !== null) {
        matches.forEach(function(value, index) {
          console.log(value);
          if (value.indexOf('spaceAttributes') !== -1) {
            content = content.replace(
              new RegExp(
                value.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1'),
                'g',
              ),
              space.attributes[value.split("'")[1]][0],
            );
          }
        });
      }

      campaignItem.values['From Number'] =
        space.attributes['School Telephone'][0];
      campaignItem.values['Recipients'] = ids;
      campaignItem.values['SMS Content'] = content;
      campaignItem.values['Sent Date'] = moment().format(
        email_sent_date_format,
      );
      createCampaign({
        campaignItem,
        phoneNumbers,
        target: submissionType === 'member' ? 'Member' : 'Lead',
        history: campaignItem.history,
        sendSms,
        createMemberActivities,
        fetchMembers,
        createLeadActivities,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchNewCampaign({
        myThis: this,
        history: this.props.history,
        fetchSmsCampaigns: null,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewCampaign({
          myThis: this,
          history: this.props.history,
          fetchSmsCampaigns: null,
        });
      }
    },
    componentDidMount() {
      this.props.setSidebarDisplayType('members');
      $('.content')
        .parent('div')[0]
        .scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(NewSmsCampaignView);

class ManageNumbersModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.showManageNumbersModal(false);
  };

  constructor(props) {
    super(props);
    this.options = this.props.options;
    let checkedItems = new Map();
    this.numbers = [];
    this.options.forEach(list => {
      list.phoneNumbers.forEach(phoneNumber => {
        if (phoneNumber.additionalNumber) {
          phoneNumber['listName'] = list['label'];
          this.numbers.push(phoneNumber);
          checkedItems.set(
            phoneNumber.listName + phoneNumber.id + phoneNumber.number,
            phoneNumber.primaryDeleted ? !phoneNumber.primaryDeleted : true,
          );
          checkedItems.set(
            phoneNumber.listName +
              phoneNumber.id +
              phoneNumber.additionalNumber,
            phoneNumber.secondaryDeleted ? !phoneNumber.secondaryDeleted : true,
          );
        }
      });
    });

    this.state = {
      checkedItems,
    };
  }

  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  handleCheckboxChange = (e, userId, listName, numberType, number) => {
    const item = e.target.name;
    const isChecked = e.target.checked;

    let obj = this.options
      .find(list => list.label === listName)
      ['phoneNumbers'].find(phone => phone.id === userId);
    if (numberType === 'primary') {
      if (!isChecked && obj.secondaryDeleted) {
        console.log('At least one number must be checked');
        return;
      }
      obj.primaryDeleted = !isChecked;
    } else {
      if (!isChecked && obj.primaryDeleted) {
        console.log('At least one number must be checked');
        return;
      }
      obj.secondaryDeleted = !isChecked;
    }
    this.setState(prevState => ({
      checkedItems: prevState.checkedItems.set(item, isChecked),
    }));
    this.props.updateCreditsRequired();
  };

  render() {
    return (
      <div onClick={this.handleClick}>
        {
          <ModalContainer onClose={this.handleClose} zIndex={1030}>
            <ModalDialog onClose={this.handleClose} style={inlineStyle}>
              <div
                className="jumbotron"
                style={{ textAlign: 'center', padding: 0, marginBottom: 0 }}
              >
                <h5 style={{ margin: '0' }}>Manage Phone Numbers</h5>
              </div>
              <div className="mt-1">
                <button
                  type="button"
                  className="btn btn-primary ml-3"
                  onClick={e => this.handleClose()}
                >
                  Close
                </button>
                <table className="table table-striped table-hover mt-4">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Primary Number</th>
                      <th>Secondary Number</th>
                    </tr>
                  </thead>
                  <tbody>
                    {this.numbers.map((phoneNumber, index) => {
                      return (
                        <tr key={phoneNumber.listName + phoneNumber.id}>
                          <td>
                            <label key={phoneNumber.id}>
                              <span>
                                {
                                  this.props.users.filter(
                                    user => user['id'] === phoneNumber.id,
                                  )[0].values['First Name']
                                }
                                &nbsp;
                                {
                                  this.props.users.filter(
                                    user => user['id'] === phoneNumber.id,
                                  )[0].values['Last Name']
                                }
                              </span>
                            </label>
                          </td>
                          <td>
                            <label key={phoneNumber.number}>
                              {phoneNumber.number}
                              <Checkbox
                                name={
                                  phoneNumber.listName +
                                  phoneNumber.id +
                                  phoneNumber.number
                                }
                                checked={this.state.checkedItems.get(
                                  phoneNumber.listName +
                                    phoneNumber.id +
                                    phoneNumber.number,
                                )}
                                onChange={this.handleCheckboxChange}
                                userId={phoneNumber.id}
                                listName={phoneNumber.listName}
                                number={phoneNumber.number}
                                numberType="primary"
                              />
                            </label>
                          </td>
                          <td>
                            <label key={phoneNumber.additionalNumber}>
                              {phoneNumber.additionalNumber}
                              <Checkbox
                                name={
                                  phoneNumber.listName +
                                  phoneNumber.id +
                                  phoneNumber.additionalNumber
                                }
                                checked={this.state.checkedItems.get(
                                  phoneNumber.listName +
                                    phoneNumber.id +
                                    phoneNumber.additionalNumber,
                                )}
                                onChange={this.handleCheckboxChange}
                                userId={phoneNumber.id}
                                listName={phoneNumber.listName}
                                number={phoneNumber.additionalNumber}
                                numberType="secondary"
                              />
                            </label>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </ModalDialog>
          </ModalContainer>
        }
      </div>
    );
  }
}

const Checkbox = ({
  type = 'checkbox',
  name,
  checked,
  onChange,
  userId,
  listName,
  numberType,
  number,
}) => (
  <input
    type={type}
    name={name}
    checked={checked}
    onChange={e => onChange(e, userId, listName, numberType, number)}
    className="ml-2"
  />
);

Checkbox.propTypes = {
  type: PropTypes.string,
  name: PropTypes.string.isRequired,
  checked: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  memberId: PropTypes.string.isRequired,
  listName: PropTypes.string.isRequired,
  numberType: PropTypes.string.isRequired,
  number: PropTypes.string.isRequired,
};

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

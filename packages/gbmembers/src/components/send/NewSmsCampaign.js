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
import { email_sent_date_format } from '../leads/LeadsUtils';
import Select, { components } from 'react-select';
import { actions as memberActions } from '../../redux/modules/members';
import { matchesMemberFilter } from '../../utils/utils';
import { actions as messagingActions } from '../../redux/modules/messaging';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import PropTypes from 'prop-types';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newSmsCampaign,
  newCampaignLoading: state.member.campaigns.newSmsCampaignLoading,
  memberLists: state.member.app.memberLists,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  smsAccountCredit: state.member.messaging.smsAccountCredit,
  smsAccountCreditLoading: state.member.messaging.smsAccountCreditLoading,
});
const mapDispatchToProps = {
  createCampaign: actions.createSmsCampaign,
  fetchNewCampaign: actions.fetchNewSmsCampaign,
  updateCampaign: actions.updateSmsCampaign,
  sendSms: messagingActions.sendBulkSms,
  createMemberActivities: messagingActions.createMemberActivities,
  fetchMembers: memberActions.fetchMembers,
  getAccountCredit: messagingActions.getAccountCredit,
  setAccountCredit: messagingActions.setAccountCredit,
};

const util = require('util');

export class NewSmsCampaign extends Component {
  constructor(props) {
    super(props);

    this.handleSmsTextChange = this.handleSmsTextChange.bind(this);
    this.handleRecipientChange = this.handleRecipientChange.bind(this);

    this.createCampaign = this.createCampaign.bind(this);
    this.getSelectOptions = this.getSelectOptions.bind(this);

    this.state = {
      content: '',
      options: this.getSelectOptions(
        this.props.memberLists,
        this.props.allMembers,
      ),
      selectedOption: [],
      smsCreditsRequired: 0,
      uniquePhoneNumbersCount: 0,
      disableCreateCampaign: true,
      showManageNumbersModal: false,
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.allMembers.length !== this.props.allMembers.length) {
      this.setState({
        options: this.getSelectOptions(
          nextProps.memberLists,
          nextProps.allMembers,
        ),
      });
    }
  }

  componentWillMount() {
    this.props.getAccountCredit({
      setAccountCredit: this.props.setAccountCredit,
    });
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
      } else {
        inactiveMemberIds.push(member['id']);
        inactiveMemberPhoneNumbers.push(numbersMap);
      }
    });

    if (activeMemberIds.length > 0) {
      options.push({
        value: '__active_members__',
        label: 'Active Members',
        memberIds: activeMemberIds,
        phoneNumbers: activeMemberPhoneNumbers,
      });
    }

    if (inactiveMemberIds.length > 0) {
      options.push({
        value: '__inactive_members__',
        label: 'Inactive Members',
        memberIds: inactiveMemberIds,
        phoneNumbers: inactiveMemberPhoneNumbers,
      });
    }

    memberLists.forEach(list => {
      let matchesFilter = matchesMemberFilter(allMembers, list.filters);
      options.push({
        value: list.name,
        label: list.name,
        memberIds: matchesFilter.map(member => member['id']),
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

  updateCreditsRequired = () => {
    let phoneNumbers = [];
    this.state.selectedOption.forEach(option => {
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
      this.state.selectedOption.length <= 0 ||
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

    let memberIds = [];
    let phoneNumbers = [];
    this.state.selectedOption.forEach(option => {
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
      memberIds.push(...option.memberIds);
    });

    if (memberIds.length <= 0) {
      console.log('Selected member list contains no members');
      return;
    }

    this.props.saveCampaign(
      memberIds,
      phoneNumbers,
      this.state.content,
      this.props.space,
    );
  }

  handleSmsTextChange(event) {
    let smsCreditsRequired =
      this.state.uniquePhoneNumbersCount * this.getSmsCount(event.target.value);
    let disableCreateCampaign =
      smsCreditsRequired > this.props.smsAccountCredit ||
      this.state.uniquePhoneNumbersCount <= 0 ||
      event.target.value.length <= 0 ||
      event.target.value.length > 765
        ? true
        : false;
    this.setState({
      content: event.target.value,
      smsCreditsRequired,
      disableCreateCampaign,
    });
  }

  showManageNumbersModal = val => {
    this.setState({ showManageNumbersModal: val });
  };

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
            You are currently sending this sms to
          </label>
          <div className="col-sm-5">
            <Select
              value={this.state.selectedOption}
              onChange={this.handleRecipientChange}
              options={this.state.options}
              closeMenuOnSelect={false}
              hideSelectedOptions={false}
              controlShouldRenderValue={true}
              isMulti={true}
            />
          </div>
          <div className="col-sm-4">
            <button
              onClick={e => this.showManageNumbersModal(true)}
              disabled={this.state.selectedOption.length > 0 ? false : true}
            >
              Manage Numbers
            </button>
            {this.state.showManageNumbersModal && (
              <ManageNumbersModal
                allMembers={this.props.allMembers}
                options={this.state.selectedOption}
                showManageNumbersModal={this.showManageNumbersModal}
                updateCreditsRequired={this.updateCreditsRequired}
              />
            )}
          </div>
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
        </div>
        <div className="row">
          <div className="col-md-10" style={{ height: '1000px' }}>
            <span className="line">
              <label htmlFor="sms_text">SMS Text</label>
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
  isDirty,
  setIsDirty,
  updateCampaign,
  allMembers,
  leadItem,
  space,
  smsAccountCreditLoading,
  smsAccountCredit,
  getAccountCredit,
  setAccountCredit,
}) =>
  newCampaignLoading ? (
    <div />
  ) : (
    <div className="container-fluid">
      <NewSmsCampaign
        campaignItem={campaignItem}
        saveCampaign={saveCampaign}
        memberLists={memberLists}
        isDirty={isDirty}
        setIsDirty={setIsDirty}
        updateCampaign={updateCampaign}
        allMembers={allMembers}
        leadItem={leadItem}
        space={space}
        smsAccountCreditLoading={smsAccountCreditLoading}
        smsAccountCredit={smsAccountCredit}
        getAccountCredit={getAccountCredit}
        setAccountCredit={setAccountCredit}
      />
    </div>
  );

export const SmsCampaignContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveCampaign: ({
      campaignItem,
      createCampaign,
      sendSms,
      createMemberActivities,
      fetchMembers,
    }) => (memberIds, phoneNumbers, content, space) => {
      campaignItem.values['From Number'] =
        space.attributes['School Telephone'][0];
      campaignItem.values['Recipients'] = memberIds;
      campaignItem.values['SMS Content'] = content;
      campaignItem.values['Sent Date'] = moment().format(
        email_sent_date_format,
      );
      createCampaign({
        campaignItem,
        phoneNumbers,
        target: 'Member',
        history: campaignItem.history,
        sendSms,
        createMemberActivities,
        fetchMembers,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchNewCampaign({
        myThis: this,
        history: this.props.history,
        fetchSmsCampaigns: null,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchNewCampaign({
          myThis: this,
          history: this.props.history,
          fetchSmsCampaigns: null,
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
)(NewSmsCampaignView);

class ManageNumbersModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.showManageNumbersModal(false);
  };

  constructor(props) {
    super(props);
    this.memberLists = this.props.options;
    let checkedItems = new Map();
    this.numbers = [];
    this.memberLists.forEach(list => {
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

  componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  handleCheckboxChange = (e, memberId, listName, numberType, number) => {
    const item = e.target.name;
    const isChecked = e.target.checked;

    let obj = this.memberLists
      .find(list => list.label === listName)
      ['phoneNumbers'].find(phone => phone.id === memberId);
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
                <h5 style={{ margin: '0' }}>Manage Phone Numebers</h5>
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
                      <th>Member Id</th>
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
                                  this.props.allMembers.filter(
                                    member => member['id'] === phoneNumber.id,
                                  )[0].values['Member ID']
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
                                memberId={phoneNumber.id}
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
                                memberId={phoneNumber.id}
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
  memberId,
  listName,
  numberType,
  number,
}) => (
  <input
    type={type}
    name={name}
    checked={checked}
    onChange={e => onChange(e, memberId, listName, numberType, number)}
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
  left: '10%',
  overflowY: 'scroll',
};

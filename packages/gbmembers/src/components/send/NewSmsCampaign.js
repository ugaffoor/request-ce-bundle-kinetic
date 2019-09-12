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

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  campaignItem: state.member.campaigns.newSmsCampaign,
  newCampaignLoading: state.member.campaigns.newSmsCampaignLoading,
  memberLists: state.member.app.memberLists,
  allMembers: state.member.members.allMembers,
  space: state.member.app.space,
  leadItem: state.member.leads.currentLead,
});
const mapDispatchToProps = {
  createCampaign: actions.createSmsCampaign,
  fetchNewCampaign: actions.fetchNewSmsCampaign,
  updateCampaign: actions.updateSmsCampaign,
  sendSms: messagingActions.sendBulkSms,
  createMemberActivities: messagingActions.createMemberActivities,
  fetchMembers: memberActions.fetchMembers
};

const util = require('util');

export class NewSmsCampaign extends Component {
  constructor(props) {
    super(props);

    this.handleChange = this.handleChange.bind(this);
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

  getSelectOptions(memberLists, allMembers) {
    let options = [];
    let activeMemberIds = [];
    let inactiveMemberIds = [];
    let activeMemberPhoneNumbers = [];
    let inactiveMemberPhoneNumbers = [];

    allMembers.forEach(member => {
      if (member.values['Status'] === 'Active') {
        activeMemberIds.push(member['id']);
        activeMemberPhoneNumbers.push({id: member['id'], number: member.values['Phone Number']});
      } else {
        inactiveMemberIds.push(member['id']);
        inactiveMemberPhoneNumbers.push({id: member['id'], number: member.values['Phone Number']});
      }
    });

    if (activeMemberIds.length > 0) {
      options.push({
        value: '__active_members__',
        label: 'Active Members',
        memberIds: activeMemberIds,
        phoneNumbers: activeMemberPhoneNumbers
      });
    }

    if (inactiveMemberIds.length > 0) {
      options.push({
        value: '__inactive_members__',
        label: 'Inactive Members',
        memberIds: inactiveMemberIds,
        phoneNumbers: inactiveMemberPhoneNumbers
      });
    }

    memberLists.forEach(list => {
      let matchesFilter = matchesMemberFilter(allMembers, list.filters);
      options.push({
        value: list.name,
        label: list.name,
        memberIds: matchesFilter.map(member => member['id']),
        phoneNumbers: matchesFilter.map(member =>
          ({id: member['id'], number: member.values['Phone Number']})
        ),
      });
    });

    return options;
  }

  handleRecipientChange = selectedOption => {
    this.setState({ selectedOption });
  };

  createCampaign() {
    if (this.state.selectedOption.length <= 0 || this.state.content.length <= 0) {
      console.log('Recipients and sms content is required');
      return;
    }

    let memberIds = [];
    let phoneNumbers = [];
    this.state.selectedOption.forEach(option => {
      phoneNumbers.push(...option.phoneNumbers);
      memberIds.push(...option.memberIds);
    });

    if (memberIds.length <= 0) {
      console.log('Selected member list contains no members');
      return;
    }

    console.log("### memberIds = " + JSON.stringify(memberIds));
    console.log("### recipientNumbers = " + JSON.stringify(phoneNumbers));

    this.props.saveCampaign(
      memberIds,
      phoneNumbers,
      this.state.content,
      this.props.space
    );
  }

  handleChange(event) {
    this.setState({ content: event.target.value });
  }

  render() {
    return (
      <div className="new_campaign" style={{ marginTop: '2%' }}>
        <div
          className="row"
          style={{
            height: '100px',
            backgroundColor: '#f7f7f7',
            paddingTop: '2%',
          }}
        >
          <div className="col-md-4" style={{ textAlign: 'right' }}>
            You are currently sending this sms to
          </div>
          <div className="col-md-4">
            {this.props.submissionId ? (
              <input
                type="text"
                readOnly
                style={{ width: '100%' }}
                value={
                  this.props.submissionType === 'member'
                    ? this.props.allMembers && this.props.allMembers.length > 0
                      ? this.props.allMembers.find(
                          member => member['id'] === this.props.submissionId,
                        ).values['Phone Number']
                      : ''
                    : this.props.leadItem && this.props.leadItem.values
                      ? this.props.leadItem.values['Phone Number']
                      : ''
                }
              />
            ) : (
              <Select
                value={this.state.selectedOption}
                onChange={this.handleRecipientChange}
                options={this.state.options}
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                controlShouldRenderValue={true}
                isMulti={true}
              />
            )}
          </div>
          <div className="col-md-3">&nbsp;</div>
        </div>
        <div className="row">
          <div className="col-md-10" style={{ height: '1000px' }}>
            <span className="line">
              <label htmlFor="sms_text">SMS Text</label>
              <div className="input-group">
                <textarea value={this.state.content} onChange={this.handleChange} className="form-control custom-control" rows="5" style={{resize:'none'}}/>
                <button type="button" id="saveButton" onClick={e => this.createCampaign()} className="input-group-addon btn btn-primary">Send</button>
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
  space
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
      />
    </div>
  );

export const SmsCampaignContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withState('isDirty', 'setIsDirty', false),
  withHandlers({
    saveCampaign: ({ campaignItem, createCampaign, sendSms, createMemberActivities, fetchMembers }) => (
      memberIds,
      phoneNumbers,
      content,
      space
    ) => {
      campaignItem.values['From Number'] = space.attributes['School Telephone'][0];
      campaignItem.values['Recipients'] = memberIds;
      campaignItem.values['SMS Content'] = content;
      campaignItem.values['Sent Date'] = moment().format(
        email_sent_date_format,
      );
      createCampaign({ campaignItem, phoneNumbers, target: 'Member', history: campaignItem.history, sendSms, createMemberActivities, fetchMembers });
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
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(NewSmsCampaignView);

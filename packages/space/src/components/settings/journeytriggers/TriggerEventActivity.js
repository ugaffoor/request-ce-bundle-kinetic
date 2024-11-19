import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import Select from 'react-select';
import { Button } from 'reactstrap';
import { I18n } from '../../../../../app/src/I18nProvider';
import { actions } from '../../../redux/modules/journeyTriggers';

const globals = import('common/globals');

const mapStateToProps = state => {
  return {
    journeyEventsLoading: state.space.journeyTriggers.journeyEventsLoading,
    journeyEvents: state.space.journeyTriggers.journeyEvents,
  };
};
const mapDispatchToProps = {
  fetchJourneyEvents: actions.fetchJourneyEvents,
};
var compThis = undefined;
const util = require('util');

export class TriggerEventActivity extends Component {
  constructor(props) {
    super(props);
    compThis = this;
    this.getAllMembers = this.getAllMembers.bind(this);
    this.getAllLeads = this.getAllLeads.bind(this);
    this.disableSearch = this.disableSearch.bind(this);

    this.state = {
      triggerID: null,
      memberID: null,
      leadID: null,
    };
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  componentDidMount() {}

  customFilter(option, searchText) {
    if (
      (option.data.values['Member Condition'] !== undefined &&
        option.data.values['Member Condition'] !== null &&
        option.data.values['Member Condition']
          .toLowerCase()
          .includes(searchText.toLowerCase())) ||
      (option.data.values['Lead Condition'] !== undefined &&
        option.data.values['Lead Condition'] !== null &&
        option.data.values['Lead Condition']
          .toLowerCase()
          .includes(searchText.toLowerCase()))
    ) {
      return true;
    } else {
      return false;
    }
  }
  getAllMembers() {
    let membersVals = [];
    this.props.allMembers.forEach(member => {
      if (
        member.values['Status'] === 'Active' ||
        member.values['Status'] === 'Pending Freeze' ||
        member.values['Status'] === 'Pending Cancellation'
      ) {
        membersVals.push({
          label: member.values['Last Name'] + ' ' + member.values['First Name'],
          value: member.id,
        });
      }
    });
    return membersVals.sort(function(a, b) {
      if (a.label < b.label) {
        return -1;
      } else if (a.label > b.labe) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  getAllLeads() {
    let leadsVals = [];
    this.props.allLeads.forEach(lead => {
      if (
        lead.values['Status'] !== 'Converted' &&
        lead.values['Status'] !== 'Deleted'
      ) {
        leadsVals.push({
          label: lead.values['First Name'] + ' ' + lead.values['First Name'],
          value: lead.id,
        });
      }
    });
    return leadsVals.sort(function(a, b) {
      if (a.label < b.label) {
        return -1;
      } else if (a.label > b.labe) {
        return -1;
      } else {
        return 0;
      }
    });
  }
  disableSearch() {
    let ret = true;

    if (this.state.recordType !== undefined) ret = false;
    if (
      this.state.memberSelected !== null &&
      this.state.memberSelected !== undefined &&
      this.state.memberSelected.value !== ''
    )
      ret = false;
    if (
      this.state.leadSelected !== null &&
      this.state.leadSelected !== undefined &&
      this.state.leadSelected.value !== ''
    )
      ret = false;

    return ret;
  }
  render() {
    return (
      <div className="triggerActivity">
        <div
          className="back fa fa-chevron-left"
          onClick={e => {
            this.props.setHideMemberBlock(false);
            this.props.setHideLeadBlock(false);
            this.props.setHideActivityBlock(false);
            this.props.setShowTriggerActivities(false);
          }}
        />
        <div className="header">
          <div className={`fa fa-history`} />
          <div className="details">
            <div className="title">Journey Trigger Activity</div>
            <div className="info">
              Evaluate/review all Journey Trigger usage/activity. Locate
              generated Journey Trigger events by Trigger/Member/Lead.
            </div>
          </div>
        </div>
        <div className="searchOptions">
          <div className="triggerConditionSelect">
            <Select
              closeMenuOnSelect={true}
              options={this.props.journeyTriggers.sort(function(a, b) {
                let ret = 0;
                if (a.values['Record Type'] < b.values['Record Type']) {
                  ret = 1;
                } else if (a.values['Record Type'] > b.values['Record Type']) {
                  ret = -1;
                } else {
                  if (
                    (a.values['Record Type'] === 'Member'
                      ? a.values['Member Condition']
                      : a.values['Lead Condition']) <
                    (b.values['Record Type'] === 'Member'
                      ? b.values['Member Condition']
                      : b.values['Lead Condition'])
                  ) {
                    ret = -1;
                  } else if (
                    (a.values['Record Type'] === 'Member'
                      ? a.values['Member Condition']
                      : a.values['Lead Condition']) >
                    (b.values['Record Type'] === 'Member'
                      ? b.values['Member Condition']
                      : b.values['Lead Condition'])
                  ) {
                    ret = 1;
                  } else {
                    if (
                      (a.values['Record Type'] === 'Member'
                        ? parseInt(a.values['Member Condition Duration'])
                        : parseInt(a.values['Lead Condition Duration'])) <
                      (b.values['Record Type'] === 'Member'
                        ? parseInt(b.values['Member Condition Duration'])
                        : parseInt(b.values['Lead Condition Duration']))
                    ) {
                      ret = -1;
                    } else if (
                      (a.values['Record Type'] === 'Member'
                        ? parseInt(a.values['Member Condition Duration'])
                        : parseInt(a.values['Lead Condition Duration'])) >
                      (b.values['Record Type'] === 'Member'
                        ? parseInt(b.values['Member Condition Duration'])
                        : parseInt(b.values['Lead Condition Duration']))
                    ) {
                      ret = 1;
                    }
                  }
                }

                return ret;
              })}
              value={this.state.triggerSelected}
              getOptionLabel={trigger => (
                <span>
                  {trigger.values['Record Type']}
                  {trigger.values['Contact Type'] === 'Call' ? (
                    <span className="fa fa-fw fa-phone" />
                  ) : trigger.values['Contact Type'] === 'SMS' ? (
                    <span className="fa fa-fw fa-comment-o" />
                  ) : (
                    <span className="fa fa-fw fa-envelope-o" />
                  )}
                  {' - [' +
                    (trigger.values['Record Type'] === 'Member'
                      ? trigger.values['Member Condition Duration'] +
                        ' ' +
                        trigger.values['Member Condition']
                      : trigger.values['Lead Condition Duration'] +
                        ' ' +
                        trigger.values['Lead Condition'])}
                  {'] - ' + trigger.values['Template Name']}
                </span>
              )}
              getOptionValue={trigger => `${trigger.id}`}
              filterOption={this.customFilter}
              styles={{
                option: base => ({
                  ...base,
                  width: '100%',
                }),
                input: base => ({
                  ...base,
                  width: '600px',
                }),
              }}
              className="triggerConditions"
              classNamePrefix="hide-columns"
              placeholder="Select Trigger Condition"
              onChange={value => {
                this.setState({
                  triggerSelected: value,
                  recordType: value.values['Record Type'],
                });
                if (value.values['Record Type'] === 'Member') {
                  this.setState({
                    leadSelected: null,
                  });
                } else {
                  this.setState({
                    memberSelected: null,
                  });
                }
              }}
            />
            <Button
              className="clearTriggers"
              color="primary"
              onClick={() => {
                this.setState({
                  triggerSelected: null,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <div className="memberSelect">
            <Select
              value={this.state.memberSelected}
              closeMenuOnSelect={true}
              options={this.getAllMembers()}
              className="hide-columns-container"
              classNamePrefix="hide-columns"
              placeholder="Select Member"
              isDisabled={
                this.state.recordType !== undefined &&
                this.state.recordType !== 'Member'
              }
              onChange={value => {
                this.setState({
                  memberSelected: value.value === '' ? null : value,
                });
              }}
              style={{ width: '300px' }}
            />
            <Button
              className="clearMember"
              color="primary"
              onClick={() => {
                this.setState({
                  memberSelected: null,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <div className="leadSelect">
            <Select
              value={this.state.leadSelected}
              closeMenuOnSelect={true}
              options={this.getAllLeads()}
              className="hide-columns-container"
              classNamePrefix="hide-columns"
              placeholder="Select Lead"
              isDisabled={
                this.state.recordType !== undefined &&
                this.state.recordType !== 'Lead'
              }
              onChange={value => {
                this.setState({
                  leadSelected: value.value === '' ? null : value,
                });
              }}
              style={{ width: '300px' }}
            />
            <Button
              className="clearLead"
              color="primary"
              onClick={() => {
                this.setState({
                  leadSelected: null,
                });
              }}
            >
              <I18n>Clear</I18n>
            </Button>
          </div>
          <Button
            className="searchButton"
            color="primary"
            disabled={this.disableSearch()}
            onClick={() => {
              this.props.fetchJourneyEvents({
                triggerID: this.state.triggerSelected.id,
                memberID: this.state.memberSelected,
                leadID: this.state.leadSelected,
              });
            }}
          >
            <I18n>Search</I18n>
          </Button>
        </div>
      </div>
    );
  }
}

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({}),
);

export const TriggerEventActivityContainer = enhance(TriggerEventActivity);

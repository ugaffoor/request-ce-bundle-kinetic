import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import {
  getReminderDate,
  gmt_format,
  formatDateValue,
} from '../leads/LeadsUtils';
import { StatusMessagesContainer } from '../StatusMessages';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';
import { actions as appActions } from '../../redux/modules/memberApp';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  currentMemberLoading: state.member.members.currentMemberLoading,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
});
const mapDispatchToProps = {
  updateMember: actions.updateMember,
  fetchCurrentMember: actions.fetchCurrentMember,
  setSidebarDisplayType: appActions.setSidebarDisplayType,
};
export class FollowUpDate extends Component {
  constructor(props) {
    super(props);
    this.saveMember = this.props.saveMember;
    let reminderDate = moment().format('YYYY-MM-DD');
    let reminderDateString = 'Tomorrow';

    this.state = {
      reminderDate,
      reminderDateString,
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {}

  handleDateChange() {
    var value = $('#' + this.id)
      .siblings('.DayPickerInput')
      .find('input')
      .val();
    console.log('Date value:' + value.trim());
    var dateValue = value.trim() === '' ? '' : formatDateValue(value);
    if (value.trim() !== '' && dateValue === 'Invalid Date') return;
    if (value.trim() === '') dateValue = '';

    this.followUpThis.setState({
      reminderDate: moment(dateValue).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
    });
  }
  handleChange(key, element) {
    if (key === 'reminderDateString') {
      this.setState({
        reminderDateString: element.target.value,
      });
    } else if (key === 'reminderDate') {
      this.setState({
        reminderDate:
          moment(element.target.value).format('YYYY-MM-DDTHH:mm:ss') + 'Z',
      });
    }
  }

  setReminder() {
    //console.log("set reminder called # reminderDateString = " + this.state.reminderDateString);
    if (!this.state.reminderDateString) {
      return;
    }
    if (this.state.reminderDateString === 'Custom') {
      if (!this.state.reminderDate) {
        return;
      }
      this.saveMember(this.state.reminderDate);
    } else {
      this.saveMember(getReminderDate(this.state.reminderDateString));
    }
  }

  render() {
    return (
      <div className="container-fluid">
        <StatusMessagesContainer />
        <div className="row">
          <div className="col-md-5" style={{ marginTop: '20px' }}>
            <div className="row">
              <div
                className="col float-right text-right text-nowrap"
                style={{ marginBottom: '10px' }}
              >
                <b>Set a reminder to follow up with&nbsp;</b>
                <span
                  style={{
                    fontWeight: 'bold',
                    fontStyle: 'normal',
                    fontSize: '24px',
                    color: '#333333',
                  }}
                >
                  {this.props.memberItem.values['First Name']}
                  &nbsp;
                  {this.props.memberItem.values['Last Name']}
                </span>
              </div>
            </div>
            <div className="row">
              <div
                className="col float-right text-right"
                style={{ marginBottom: '10px' }}
              >
                <select
                  id="reminderDateString"
                  style={{ width: '60%' }}
                  value={this.state.reminderDateString}
                  onChange={e => this.handleChange('reminderDateString', e)}
                >
                  <option value="Tomorrow">Tomorrow</option>
                  <option value="Next Week">Next Week</option>
                  <option value="Next Month">Next Month</option>
                  <option value="Custom">Custom</option>
                  <option value="Never">Never</option>
                </select>
              </div>
            </div>
            {this.state.reminderDateString === 'Custom' && (
              <div className="row datetime">
                <div className="col">
                  <span className="float-right">
                    <label id="reminderDate" htmlFor="reminderDate"></label>
                    <DayPickerInput
                      name="reminderDate"
                      id="reminderDate"
                      placeholder={moment(new Date())
                        .locale(
                          getLocalePreference(
                            this.props.space,
                            this.props.profile,
                          ),
                        )
                        .localeData()
                        .longDateFormat('L')
                        .toLowerCase()}
                      formatDate={formatDate}
                      parseDate={parseDate}
                      onDayPickerHide={this.handleDateChange}
                      followUpThis={this}
                      dayPickerProps={{
                        locale: getLocalePreference(
                          this.props.space,
                          this.props.profile,
                        ),
                        localeUtils: MomentLocaleUtils,
                      }}
                    />
                  </span>
                </div>
              </div>
            )}
            <div className="row">
              <div className="col float-right text-right">
                <button
                  type="button"
                  id="setReminder"
                  className="btn btn-primary"
                  onClick={e => this.setReminder()}
                >
                  Set Reminder
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export const FollowUpView = ({
  memberItem,
  profile,
  space,
  saveMember,
  currentMemberLoading,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <FollowUpDate
      memberItem={memberItem}
      saveMember={saveMember}
      profile={profile}
      space={space}
    />
  );

export const MemberFollowUpContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    saveMember: ({ memberItem, updateMember }) => reminderDate => {
      //console.log("### reminder date = " + reminderDate);
      if (reminderDate) {
        memberItem.values['Reminder Date'] =
          moment(new Date(reminderDate))
            .utc()
            .format(gmt_format) + 'Z';
      } else {
        memberItem.values['Reminder Date'] = '';
      }
      updateMember({
        id: memberItem['id'],
        memberItem: memberItem,
        history: memberItem.history,
        fromTasks: true,
      });
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      moment.locale(
        this.props.profile.preferredLocale === null
          ? this.props.space.defaultLocale
          : this.props.profile.preferredLocale,
      );

      this.props.fetchCurrentMember({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
        billingService: getAttributeValue(this.props.space, 'Billing Company'),
        allMembers: this.props.allMembers,
      });
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
          billingService: getAttributeValue(
            this.props.space,
            'Billing Company',
          ),
          allMembers: this.props.allMembers,
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
)(FollowUpView);

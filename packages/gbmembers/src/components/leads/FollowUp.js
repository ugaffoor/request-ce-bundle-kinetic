import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/leads';
import $ from 'jquery';
import { formatDateValue, getReminderDate, gmt_format } from './LeadsUtils';
import { StatusMessagesContainer } from '../StatusMessages';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import 'react-day-picker/lib/style.css';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getLocalePreference } from '../Member/MemberUtils';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  leadItem: state.member.leads.currentLead,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
  currentLeadLoading: state.member.leads.currentLeadLoading,
});
const mapDispatchToProps = {
  fetchLead: actions.fetchCurrentLead,
  updateLead: actions.updateLead,
  fetchLeads: actions.fetchLeads,
};

export class FollowUpDate extends Component {
  constructor(props) {
    super(props);
    moment.locale(
      this.props.profile.preferredLocale === null
        ? this.props.space.defaultLocale
        : this.props.profile.preferredLocale,
    );

    this.saveLead = this.props.saveLead;
    let reminderDate = moment().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    let reminderDateString = 'Tomorrow';

    this.state = {
      reminderDate,
      reminderDateString,
    };
  }

  componentWillReceiveProps(nextProps) {}

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
      this.saveLead(this.state.reminderDate);
    } else {
      this.saveLead(getReminderDate(this.state.reminderDateString));
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
                  {this.props.leadItem.values['First Name']}
                  &nbsp;
                  {this.props.leadItem.values['Last Name']}
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
  leadItem,
  saveLead,
  currentLeadLoading,
  profile,
  space,
}) =>
  currentLeadLoading ? (
    <div />
  ) : (
    <FollowUpDate
      leadItem={leadItem}
      saveLead={saveLead}
      profile={profile}
      space={space}
    />
  );

export const FollowUpContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(() => {
    return {};
  }),
  withHandlers({
    saveLead: ({ leadItem, updateLead, fetchLeads }) => reminderDate => {
      //console.log("### reminder date = " + reminderDate);
      if (reminderDate) {
        leadItem.values['Reminder Date'] =
          moment(new Date(reminderDate))
            .utc()
            .format(gmt_format) + 'Z';
      } else {
        leadItem.values['Reminder Date'] = '';
      }
      updateLead({
        id: leadItem['id'],
        leadItem: leadItem,
        history: leadItem.history,
      });
    },
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchLead({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchLead({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
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
)(FollowUpView);

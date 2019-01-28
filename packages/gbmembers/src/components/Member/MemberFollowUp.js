import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import { getReminderDate, gmt_format } from '../leads/LeadsUtils';
import { StatusMessagesContainer } from '../StatusMessages';

const mapStateToProps = state => ({
  pathname: state.router.location.pathname,
  memberItem: state.member.members.currentMember,
  currentMemberLoading: state.member.members.currentMemberLoading,
});
const mapDispatchToProps = {
  updateMember: actions.updateMember,
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
};

export class FollowUpDate extends Component {
  constructor(props) {
    super(props);
    this.saveMember = this.props.saveMember;
    let reminderDate = moment().format('YYYY-MM-DDTHH:mm:ss') + 'Z';
    let reminderDateString = 'Tomorrow';

    this.state = {
      reminderDate,
      reminderDateString,
    };
  }

  componentWillReceiveProps(nextProps) {}

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
                  <input
                    type="date"
                    name="reminderDate"
                    id="reminderDate"
                    className="float-right"
                    required
                    ref={input => (this.input = input)}
                    defaultValue={this.state.reminderDate}
                    onChange={e => this.handleChange('reminderDate', e)}
                  />
                </div>
              </div>
            )}
            <div className="row">
              <div className="col float-right text-right">
                <button
                  type="button"
                  id="setReminder"
                  className="btn btn-primary"
                  style={{ backgroundColor: '#991B1E' }}
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
  saveMember,
  currentMemberLoading,
}) =>
  currentMemberLoading ? (
    <div />
  ) : (
    <FollowUpDate memberItem={memberItem} saveMember={saveMember} />
  );

export const MemberFollowUpContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(() => {
    return {};
  }),
  withHandlers({
    saveMember: ({
      memberItem,
      updateMember,
      fetchMembers,
    }) => reminderDate => {
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
    componentWillMount() {
      this.props.fetchCurrentMember({
        id: this.props.match.params['id'],
        myThis: this,
        history: this.props.history,
      });
    },
    componentWillReceiveProps(nextProps) {
      if (this.props.pathname !== nextProps.pathname) {
        this.props.fetchCurrentMember({
          id: this.props.match.params['id'],
          myThis: this,
          history: this.props.history,
        });
      }
    },
    componentDidMount() {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(FollowUpView);
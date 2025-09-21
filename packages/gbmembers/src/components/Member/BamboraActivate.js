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
import { actions } from '../../redux/modules/members';
import { actions as errorActions } from '../../redux/modules/errors';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { getLocalePreference } from './MemberUtils';
import MomentLocaleUtils, {
  formatDate,
  parseDate,
} from 'react-day-picker/moment';
import { getAttributeValue } from '../../lib/react-kinops-components/src/utils';

const mapStateToProps = state => ({
  memberItem: state.member.members.currentMember,
  activatingBiller: state.member.members.activatingBiller,
  activatingBillerCompleted: state.member.members.activatingBillerCompleted,
  space: state.member.app.space,
  profile: state.member.kinops.profile,
});
const mapDispatchToProps = {
  updateMember: actions.updateMember,
  activateBiller: actions.activateBiller,
  billerActivated: actions.billerActivated,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

export class BamboraActivate extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowBamboraActivate(false);
  };
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleDayChange = this.handleDayChange.bind(this);
    this.activateMember = this.activateMember.bind(this);
    this.state = {
      startDate: undefined,
      applyAdminFee: true,
      processing: false,
      period: this.props.memberItem.values['Billing Payment Period'],
      currentAmount: Number.parseFloat(
        this.props.memberItem.values['Membership Cost'],
      ).toFixed(2),
      paymentValue: (
        Number.parseFloat(this.props.memberItem.values['Membership Cost']) +
        Number.parseFloat(this.props.memberItem.values['Membership Cost']) *
          0.0133
      ).toFixed(2),
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('test');
  }

  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  handleRecipientChange = selectedOption => {
    this.setState({ selectedOption });
  };

  handleChange(event) {
    this.setState({});
  }
  handleDayChange(selectedDay, modifiers, dayPickerInput) {
    this.setState({
      startDate: moment(selectedDay),
    });
  }
  activateMember() {
    this.setState({
      processing: true,
    });
    this.props.activateBillerMember(
      this.getScheduledDate,
      this.state.startDate,
      this.state.period,
      this.state.paymentValue,
    );
  }
  getScheduledDate(startDate, period) {
    switch (period) {
      case 'Daily':
        return startDate.add(1, 'days');
      case 'Weekly':
        return startDate.add(7, 'days');
      case 'Fortnightly':
        return startDate.add(14, 'days');
      case 'Monthly':
        return startDate.add(1, 'months');
      case 'Quarterly':
        return startDate.add(3, 'months');
      case '4 Months':
        return startDate.add(4, 'months');
      case '6 Months':
        return startDate.add(6, 'months');
      case 'Yearly':
        return startDate.add(1, 'years');
      default:
        return startDate;
    }
  }
  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose} zIndex={1030}>
          <ModalDialog onClose={this.handleClose} style={inlineStyle}>
            <div className="bamboraActivate">
              <div className="row">
                <div className="col-md-12" style={{ textAlign: 'center' }}>
                  {this.props.target} -{' '}
                  {this.props.memberItem.values['First Name']}{' '}
                  {this.props.memberItem.values['Last Name']}
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="startDate" id="startDate">
                    Start Date
                  </label>
                  <DayPickerInput
                    name="startDate"
                    id="startDate"
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
                    onDayChange={this.handleDayChange}
                    dayPickerProps={{
                      locale: getLocalePreference(
                        this.props.space,
                        this.props.profile,
                      ),
                      localeUtils: MomentLocaleUtils,
                      disabledDays: {
                        before: moment()
                          .add(1, 'days')
                          .toDate(),
                      },
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="payment">Payment Period</label>
                  <select
                    name="paymentPeriod"
                    id="paymentPeriod"
                    defaultValue={
                      this.props.memberItem.values['Billing Payment Period']
                    }
                    onChange={e => {
                      this.setState({
                        period: e.target.value,
                      });
                    }}
                  >
                    <option value="" />
                    {getAttributeValue(
                      this.props.space,
                      'Payment Frequencies',
                      '',
                    )
                      .split(',')
                      .map(period => {
                        return (
                          <option value={period}>
                            {period === 'Fortnightly' ? 'Bi-Weekly' : period}
                          </option>
                        );
                      })}
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="currentAmount">Current Amount</label>
                  <input
                    type="text"
                    name="currentAmount"
                    id="currentAmount"
                    disabled={false}
                    defaultValue={this.state.currentAmount}
                    onChange={e => {
                      if (this.state.applyAdminFee) {
                        this.setState({
                          paymentValue: (
                            Number.parseFloat(e.target.value) +
                            Number.parseFloat(e.target.value) * 0.0133
                          ).toFixed(2),
                          currentAmount: e.target.value,
                        });
                      } else {
                        this.setState({
                          paymentValue: Number.parseFloat(
                            e.target.value,
                          ).toFixed(2),
                          currentAmount: e.target.value,
                        });
                      }
                    }}
                  />
                </div>
              </div>
              <div className="row">
                <div className="field">
                  <label htmlFor="applyAdmin" style={{ minWidth: '100px' }}>
                    Apply Admin Fee
                  </label>
                  <input
                    type="checkbox"
                    name="applyAdmin"
                    id="applyAdmin"
                    style={{ clear: 'none', margin: '4px' }}
                    value="YES"
                    checked={this.state.applyAdminFee}
                    onChange={e => {
                      if (!this.state.applyAdminFee) {
                        this.setState({
                          paymentValue: (
                            Number.parseFloat(this.state.currentAmount) +
                            Number.parseFloat(this.state.currentAmount) * 0.0133
                          ).toFixed(2),
                        });
                      } else {
                        this.setState({
                          paymentValue: Number.parseFloat(
                            this.state.currentAmount,
                          ).toFixed(2),
                        });
                      }
                      this.setState({
                        applyAdminFee: !this.state.applyAdminFee,
                      });
                    }}
                  />
                </div>
              </div>
              {this.state.applyAdminFee && (
                <div className="row">
                  <div className="field">
                    <label htmlFor="adminFee">Admin Fee</label>
                    <input
                      type="text"
                      name="adminFee"
                      id="adminFee"
                      disabled={true}
                      defaultValue={'1.33%'}
                      onChange={e => {}}
                    />
                  </div>
                </div>
              )}
              <div className="row">
                <div className="field">
                  <label htmlFor="payment">Payment</label>
                  <input
                    type="text"
                    name="payment"
                    id="payment"
                    value={this.state.paymentValue}
                    onChange={e => {}}
                  />
                </div>
              </div>
              <div className="row">
                <button
                  type="button"
                  id="activate"
                  className="btn btn-primary btn-block"
                  disabled={
                    this.state.startDate === undefined || this.state.processing
                  }
                  onClick={e => this.activateMember()}
                >
                  Activate
                </button>
              </div>
              {this.props.activatingBiller && (
                <div className="row">
                  <ReactSpinner />
                </div>
              )}
              {this.props.activatingBillerCompleted && (
                <div className="completedActivation">
                  <p>
                    Billing for {this.props.memberItem.values['First Name']}{' '}
                    {this.props.memberItem.values['Last Name']} has been
                    Activated.
                  </p>
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
  withHandlers({
    activateBillerMember: ({
      memberItem,
      updateMember,
      activateBiller,
      billerActivated,
      allMembers,
      addNotification,
      setSystemError,
    }) => (getScheduledDate, startDate, period, payment) => {
      memberItem.values['Membership Cost'] = payment;
      memberItem.values['Payment'] = payment;
      memberItem.values['Billing Payment Type'] = 'Credit Card';
      memberItem.values['Payment Method'] = 'Credit Card';
      memberItem.values['Billing Payment Period'] = period;
      memberItem.values['Billing Period'] = period;
      memberItem.values['Biller Migrated'] = 'YES';
      memberItem.values['Billing Start Date'] = startDate.format('YYYY-MM-DD');
      activateBiller({
        id: memberItem.id,
        memberItem,
        updateMember,
        billerActivated,
        orderNumber: memberItem.values['Billing Customer Id'],
        startDate: startDate.format('YYYY-MM-DD'),
        scheduleDate: getScheduledDate(startDate, period).format('YYYY-MM-DD'),
        period,
        payment,
        email: memberItem.values['Email'],
        city: memberItem.values['Suburb'],
        postcode: memberItem.values['Postcode'],
        state: memberItem.values['State'],
        address: memberItem.values['Address'],
        addNotification,
        setSystemError,
      });
      for (let i = 0; i < allMembers.length; i++) {
        if (allMembers[i].id === memberItem.id) {
          allMembers[i].values = memberItem.values;
          break;
        }
      }
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {},
  }),
);
export const BamboraActivateContainer = enhance(BamboraActivate);

const inlineStyle = {
  position: 'absolute',
  marginBottom: '20px',
  width: '40%',
  height: '400px',
  top: '10%',
  transform: 'matrix3d(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)',
  left: '20%',
  overflowY: 'scroll',
};

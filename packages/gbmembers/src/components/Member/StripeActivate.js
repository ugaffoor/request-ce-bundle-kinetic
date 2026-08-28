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
import axios from 'axios';
import moment from 'moment';
import DayPickerInput from 'react-day-picker/DayPickerInput';
import { getLocalePreference } from './MemberUtils';
import { contact_date_format } from '../leads/LeadsUtils';
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
  kineticBillingServerUrl: state.member.app.kineticBillingServerUrl,
  spaceSlug: state.member.app.spaceSlug,
});
const mapDispatchToProps = {
  updateMember: actions.updateMember,
  billerActivated: actions.billerActivated,
  resetBillerActivated: actions.resetBillerActivated,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
};

export class StripeActivate extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowStripeActivate(false);
  };
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleDayChange = this.handleDayChange.bind(this);
    this.activateMember = this.activateMember.bind(this);
    this.state = {
      startDate: undefined,
      applyAdminFee:
        getAttributeValue(this.props.space, 'Ignore Admin Fee') === 'YES'
          ? false
          : true,
      processing: false,
      period: this.props.memberItem.values['Billing Payment Period'],
      currentAmount:
        this.props.memberItem.values['Membership Cost'] !== undefined
          ? Number.parseFloat(
              this.props.memberItem.values['Membership Cost'],
            ).toFixed(2)
          : 0,
      paymentValue: this.getPaymentAmount(
        this.props.memberItem.values['Membership Cost'],
      ),
    };
  }
  getPaymentAmount(cost) {
    if (cost === undefined) {
      return 0;
    }
    const adminFeeAttr = getAttributeValue(
      this.props.space,
      'Admin Fee Charge',
    );
    let amount = 0;

    if (adminFeeAttr) {
      amount =
        Number.parseFloat(cost) +
        Number.parseFloat(cost) *
          (parseFloat(adminFeeAttr.replace('%', '')) / 100);
      amount = amount.toFixed(2);
    } else if (this.props.memberItem.values['Membership Cost'] !== undefined) {
      amount = Number.parseFloat(cost).toFixed(2);
    }

    return amount;
  }
  UNSAFE_componentWillReceiveProps(nextProps) {
    console.log('test');
  }

  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
    this.props.resetBillerActivated();
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
      case '4 Weekly':
        return startDate.add(28, 'days');
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
            <div className="stripeActivate">
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
                          paymentValue: this.getPaymentAmount(e.target.value),
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
              {getAttributeValue(this.props.space, 'Ignore Admin Fee') ===
              'YES' ? (
                <div />
              ) : (
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
                            paymentValue: this.getPaymentAmount(
                              this.state.currentAmount,
                            ),
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
              )}
              {this.state.applyAdminFee && (
                <div className="row">
                  <div className="field">
                    <label htmlFor="adminFee">Admin Fee</label>
                    <input
                      type="text"
                      name="adminFee"
                      id="adminFee"
                      disabled={true}
                      defaultValue={getAttributeValue(
                        this.props.space,
                        'Admin Fee Charge',
                      )}
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
                    this.state.startDate === undefined ||
                    this.state.processing ||
                    this.props.activatingBillerCompleted
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
      billerActivated,
      allMembers,
      addNotification,
      space,
      setSystemError,
      kineticBillingServerUrl,
      spaceSlug,
      profile,
    }) => (_getScheduledDate, startDate, period, payment) => {
      memberItem.values['Membership Cost'] = payment;
      memberItem.values['Payment'] = payment;
      memberItem.values['Billing Payment Period'] = period;
      memberItem.values['Billing Period'] = period;
      memberItem.values['Billing Start Date'] = startDate.format('YYYY-MM-DD');
      const args = {
        space: spaceSlug,
        billingService: 'Stripe',
        customerId: memberItem.values['Member ID'],
        paymentMethod: 'Credit Card',
        firstName: memberItem.values['First Name'],
        lastName: memberItem.values['Last Name'],
        dob: memberItem.values['DOB'],
        address: memberItem.values['Address'],
        suburb: memberItem.values['Suburb'],
        state: memberItem.values['State'],
        postCode: memberItem.values['Postcode'],
        email: memberItem.values['Email'],
        mobile: memberItem.values['Mobile'],
        billingPeriod: period,
        payment,
        contractStartDate: startDate.format('YYYY-MM-DD'),
        cardToken: memberItem.values['Billing Customer Id'],
        currency: getAttributeValue(space, 'Currency'),
      };
      axios
        .post(kineticBillingServerUrl + '/registerUser', args)
        .then(result => {
          if (result.data.error && result.data.error > 0) {
            addNotification(
              'error',
              result.data.errorMessage,
              'Activated Biller Failed',
            );
          } else {
            memberItem.values['Billing Payment Type'] =
              result.data.data.paymentMethod === 'card'
                ? 'Credit Card'
                : 'Bank Account';
            memberItem.values['Billing Customer Reference'] =
              result.data.data.customerBillingId;

            let changes = memberItem.values['Billing Changes'];
            if (!changes) {
              changes = [];
            } else if (typeof changes !== 'object') {
              changes = JSON.parse(changes);
            }
            changes.push({
              date: moment().format(contact_date_format),
              user: profile.username,
              action: 'Stripe Activation',
              from: '',
              to: result.data.data.customerBillingId,
            });
            memberItem.values['Billing Changes'] = changes;

            addNotification('success', 'Activating Biller successfully');
            updateMember({
              id: memberItem.id,
              memberItem,
              allMembers,
              values: {
                'Membership Cost': payment,
                Payment: payment,
                'Billing Payment Period': period,
                'Billing Period': period,
                'Billing Start Date': startDate.format('YYYY-MM-DD'),
                'Billing Payment Type':
                  memberItem.values['Billing Payment Type'],
                'Billing Customer Reference':
                  result.data.data.customerBillingId,
                'Billing Changes': changes,
                'Biller Migrated': 'YES',
              },
            });
            billerActivated();
          }
        })
        .catch(error => {
          console.log(error);
          addNotification('error', 'Activated Biller Failed');
          setSystemError(error);
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
export const StripeActivateContainer = enhance(StripeActivate);

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

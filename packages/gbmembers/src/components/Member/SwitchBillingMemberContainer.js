import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import $ from 'jquery';
import { confirm } from '../helpers/Confirmation';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class SwitchBillingMemberModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setSwitchBillingMemberDialog(false);
  };
  applySwitch = () => {
    this.props.switchBillingMember(this.props.memberItem, this.state.newMember);
    this.handleClose();
  };
  constructor(props) {
    super(props);

    var familyMembersVals = JSON.parse(
      this.props.memberItem.values['Billing Family Members'],
    );
    this.dependantMembers = [];
    familyMembersVals.forEach(item => {
      if (item !== this.props.memberItem.id) {
        var idx = this.props.allMembers.findIndex(member => member.id === item);
        if (idx !== -1) {
          this.dependantMembers[
            this.dependantMembers.length
          ] = this.props.allMembers[idx];
        }
      }
    });
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog className="setStatusDialog" onClose={this.handleClose}>
            <div className="memberOptions">
              <form>
                <table>
                  <tbody>
                    <tr>
                      <td>
                        All billing payment information will be transferred to
                        the selected Member.
                      </td>
                    </tr>
                    <tr>
                      <td>
                        The current member will be changed to be a dependant
                        family member.
                      </td>
                    </tr>
                  </tbody>
                </table>
                <br></br>
                {this.dependantMembers.map((member, index) => {
                  return (
                    <label htmlFor={member.id}>
                      <input
                        type="radio"
                        id={member.id}
                        name="name"
                        value={member.id}
                        onChange={e => {
                          var idx = this.props.allMembers.findIndex(
                            member => member.id === e.target.value,
                          );
                          if (idx !== -1) {
                            this.setState({
                              newMember: this.props.allMembers[idx],
                            });
                          }
                        }}
                      />
                      {member.values['First Name']} {member.values['Last Name']}
                    </label>
                  );
                })}
              </form>
              <button
                type="button"
                id="applyStatus"
                className="btn btn-primary btn-block"
                disabled={$('.memberOptions input:checked').length === 0}
                onClick={async e => {
                  if (
                    await confirm(
                      <span>
                        <span>
                          Are you sure you want to SWITCH the billing Member?
                        </span>
                        <table>
                          <tbody>
                            <tr>
                              <td>Current Billing Member:</td>
                              <td>
                                {this.props.memberItem.values['First Name']}{' '}
                                {this.props.memberItem.values['Last Name']}
                              </td>
                            </tr>
                            <tr>
                              <td>SWITCH TO</td>
                              <td></td>
                            </tr>
                            <tr>
                              <td>New Billing Member:</td>
                              <td>
                                {this.state.newMember.values['First Name']}{' '}
                                {this.state.newMember.values['Last Name']}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </span>,
                    )
                  ) {
                    this.applySwitch();
                  }
                }}
              >
                Switch Billing Member
              </button>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const SwitchBillingMemberContainer = enhance(SwitchBillingMemberModal);

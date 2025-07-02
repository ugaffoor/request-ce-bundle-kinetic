import React, { Component } from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { connect } from 'react-redux';
import { getJson } from '../Member/MemberUtils';
import moment from 'moment';
import { compose } from 'recompose';
import $ from 'jquery';
import { KappNavLink as NavLink } from 'common';
import { Utils } from 'common';

const mapStateToProps = state => ({});
const mapDispatchToProps = {};

export class RegisterMemberModal extends Component {
  handleClick = () => this.setState({ isShowingModal: true });
  handleClose = () => {
    this.setState({ isShowingModal: false });
    this.props.setShowRegisterMemberModal(false);
  };
  constructor(props) {
    super(props);
    this.state = {};
  }
  UNSAFE_componentWillReceiveProps(nextProps) {}
  UNSAFE_componentWillMount() {
    this.setState({ isShowingModal: this.props.isShowingModal });
  }

  render() {
    return (
      <div onClick={this.handleClick}>
        <ModalContainer onClose={this.handleClose}>
          <ModalDialog
            className="setRegisterMemberDialog"
            onClose={this.handleClose}
          >
            <div className="registerOptions">
              <span className="cell">
                {Utils.getAttributeValue(
                  this.props.space,
                  'Billing Company',
                ) === 'Bambora' && (
                  <h2>
                    <NavLink
                      to={`/categories/bambora-billing/bambora-member-registration?id=${this.props.memberItem.id}`}
                      kappSlug={'services'}
                      className={'nav-link icon-wrapper device'}
                      activeClassName="active"
                      style={{ display: 'inline' }}
                    >
                      Register
                    </NavLink>
                  </h2>
                )}
                {Utils.getAttributeValue(
                  this.props.space,
                  'Billing Company',
                ) === 'Stripe' && (
                  <h2>
                    <NavLink
                      to={`/categories/stripe-billing/stripe-member-registration?id=${this.props.memberItem.id}`}
                      kappSlug={'services'}
                      className={'nav-link icon-wrapper device'}
                      activeClassName="active"
                      style={{ display: 'inline' }}
                    >
                      Register
                    </NavLink>
                  </h2>
                )}
                {Utils.getAttributeValue(
                  this.props.space,
                  'Billing Company',
                ) === 'PaySmart' && (
                  <h2>
                    <NavLink
                      to={`/categories/billing-registration/paysmart-member-registration?id=${this.props.memberItem.id}`}
                      kappSlug={'services'}
                      className={'nav-link icon-wrapper device'}
                      activeClassName="active"
                      style={{ display: 'inline' }}
                    >
                      Register
                    </NavLink>
                  </h2>
                )}
                <span>Complete the Registration on this device.</span>
              </span>
              <span className="cell">
                <h2>
                  <NavLink
                    to={`/RemoteRegistration/${this.props.memberItem.id}`}
                    className=" nav-link icon-wrapper remote"
                    activeClassName="active"
                    style={{ display: 'inline' }}
                  >
                    Remote Register
                  </NavLink>
                </h2>
                <span>
                  Set the program, price and start date, <br></br>then send link
                  to Member to complete the Registration via SMS or Email
                </span>
              </span>
            </div>
          </ModalDialog>
        </ModalContainer>
      </div>
    );
  }
}

const enhance = compose(connect(mapStateToProps, mapDispatchToProps));
export const RegisterMemberModalContainer = enhance(RegisterMemberModal);

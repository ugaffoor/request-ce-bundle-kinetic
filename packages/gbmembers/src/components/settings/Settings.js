import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import { actions } from '../../redux/modules/members';
import $ from 'jquery';
import moment from 'moment';
import PropTypes from 'prop-types';
import ReactSpinner from 'react16-spinjs';
import 'bootstrap/scss/bootstrap.scss';
import _ from 'lodash';
import ReactTable from 'react-table';
import { StatusMessagesContainer } from '../StatusMessages';
import { actions as errorActions } from '../../redux/modules/errors';
import { KappNavLink as NavLink } from 'common';

const mapStateToProps = state => ({
  memberItem: state.member.members.currentMember,
  allMembers: state.member.members.allMembers,
  billingCompany: state.member.app.billingCompany,
  billingCustomersLoading: state.member.members.billingCustomersLoading,
});

const mapDispatchToProps = {
  fetchCurrentMember: actions.fetchCurrentMember,
  fetchMembers: actions.fetchMembers,
  addNotification: errorActions.addNotification,
  setSystemError: errorActions.setSystemError,
  fetchBillingCustomers: actions.fetchBillingCustomers,
  setBillingCustomers: actions.setBillingCustomers,
  createBillingMembers: actions.createBillingMembers,
};

export const SettingsView = ({
  memberItem,
  allMembers,
  billingPayments,
  billingCompany,
  fetchBillingCustomers,
  setBillingCustomers,
  createBillingMembers,
  billingCustomersLoading,
  fetchMembers,
}) => (
  <div className="dashboard">
    <StatusMessagesContainer />
    <div className="buttons row" style={{ marginLeft: '10px' }}>
      <div className="col-xs-3">
        <NavLink
          to={`/ddrTemplates`}
          style={{ borderRadius: '0', marginRight: '5px' }}
          className="btn btn-primary"
        >
          Manage DDR Templates
        </NavLink>
      </div>
      <div className="col-xs-3">
        <button
          type="button"
          id="loadBillingCustomers"
          className={'btn btn-primary'}
          style={{ borderRadius: '0', marginRight: '5px' }}
          onClick={e =>
            fetchBillingCustomers({
              setBillingCustomers,
              createBillingMembers,
              fetchMembers,
            })
          }
        >
          Import Billing Members
        </button>
      </div>
      <div className="col-xs-3">
        {billingCustomersLoading ? (
          <p>Importing billing customers ....</p>
        ) : (
          <span />
        )}
      </div>
    </div>
  </div>
);

export const SettingsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ memberItem }) => {
    return {};
  }),
  withState('isAssigning', 'setIsAssigning', false),
  withHandlers({}),
  lifecycle({
    componentWillMount() {},
    componentWillReceiveProps(nextProps) {
      $('.content')[0].scrollIntoView(true);
    },
    componentWillUnmount() {},
  }),
)(SettingsView);

export class Settings extends Component {
  constructor(props) {
    super(props);
  }

  componentWillReceiveProps(nextProps) {}

  render() {
    <span />;
  }
}

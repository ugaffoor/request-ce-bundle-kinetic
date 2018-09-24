import React from 'react';
import { connect } from 'react-redux';
import {
  compose,
  withState,
  lifecycle,
  withHandlers,
  withProps,
} from 'recompose';
import $ from 'jquery';
import { actions as errorActions } from '../redux/modules/errors';
import { NotificationsContainer } from './notifications/NotificationsContainer';
import { SystemErrorContainer } from './systemError/SystemErrorContainer';

const mapStateToProps = state => ({
  systemError: state.member.errors.system,
});
const mapDispatchToProps = {};

const util = require('util');
export const StatusMessages = ({ systemError }) => (
  <span>
    <NotificationsContainer />
    {!$.isEmptyObject(systemError) && <SystemErrorContainer />}
  </span>
);

export const StatusMessagesContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
)(StatusMessages);

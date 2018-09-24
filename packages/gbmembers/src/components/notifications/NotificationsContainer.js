import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';

import SVGInline from 'react-svg-inline';
import timesIcon from 'font-awesome-svg-png/white/svg/times.svg';

import { actions } from '../../redux/modules/errors';

const defaultTitle = {
  success: 'Success',
  info: 'Info',
  warn: 'Warning',
  error: 'Error',
  normal: 'Info',
};

const Notification = ({ notification, dismiss }) => (
  <div className={`notification ${notification.type}`}>
    <div className="message">
      <div className="headline-copy">
        {notification.title || defaultTitle[notification.type]}
      </div>
      {notification.msg}
    </div>
    <div className="actions">
      <button className="btn btn-link" onClick={dismiss}>
        <SVGInline svg={timesIcon} className="icon" />
      </button>
    </div>
  </div>
);

const Notifications = ({ notifications, dismiss }) => (
  <div className="notifications">
    {notifications.map(n => (
      <Notification key={n.id} notification={n} dismiss={dismiss(n.id)} />
    ))}
  </div>
);

const mapStateToProps = state => ({
  notifications: state.member.errors.notifications,
});

const mapDispatchToProps = {
  removeNotification: actions.removeNotification,
};

export const NotificationsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    dismiss: ({ removeNotification }) => id => () => removeNotification(id),
  }),
)(Notifications);

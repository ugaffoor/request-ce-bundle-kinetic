import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  SET_SYSTEM_ERROR: '@kd/boilerplate/SET_SYSTEM_ERROR',
  CLEAR_SYSTEM_ERROR: '@kd/boilerplate/CLEAR_SYSTEM_ERROR',
  ADD_NOTIFICATION: namespace('errors', 'ADD_NOTIFICATION'),
  REMOVE_NOTIFICATION: namespace('errors', 'REMOVE_NOTIFICATION'),
  ADD_RECENT_NOTIFICATION: namespace('errors', 'ADD_RECENT_NOTIFICATION'),
};

export const NOTICE_TYPES = {
  SUCCESS: 'success',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  NORMAL: 'normal',
};

export const actions = {
  setSystemError: error => ({ type: types.SET_SYSTEM_ERROR, payload: error }),
  clearSystemError: () => ({ type: types.CLEAR_SYSTEM_ERROR }),
  addSuccess: (msg, title) => ({
    type: types.ADD_NOTIFICATION,
    payload: { id: Date.now(), type: NOTICE_TYPES.SUCCESS, title, msg },
  }),
  addInfo: (msg, title) => ({
    type: types.ADD_NOTIFICATION,
    payload: { id: Date.now(), type: NOTICE_TYPES.INFO, title, msg },
  }),
  addWarn: (msg, title) => ({
    type: types.ADD_NOTIFICATION,
    payload: { id: Date.now(), type: NOTICE_TYPES.WARN, title, msg },
  }),
  addError: (msg, title) => ({
    type: types.ADD_NOTIFICATION,
    payload: { id: Date.now(), type: NOTICE_TYPES.ERROR, title, msg },
  }),
  addNormal: (msg, title) => ({
    type: types.ADD_NOTIFICATION,
    payload: { id: Date.now(), type: NOTICE_TYPES.NORMAL, title, msg },
  }),
  removeNotification: withPayload(types.REMOVE_NOTIFICATION),
  addNotification: (msgType, msg, title) =>
    getNotificationMessage(msgType, msg, title),
  addRecentNotification: withPayload(types.ADD_RECENT_NOTIFICATION),
};

export const State = Record({
  system: {},
  notifications: List(),
  recentNotifications: List(),
});

const reducer = (state = State(), action) => {
  switch (action.type) {
    case types.SET_SYSTEM_ERROR:
      return state.set('system', action.payload);
    case types.CLEAR_SYSTEM_ERROR:
      return state.set('system', {});
    case types.ADD_NOTIFICATION:
      return state.update('notifications', ns => ns.push(action.payload));
    case types.REMOVE_NOTIFICATION:
      return state.update('notifications', ns =>
        ns.filterNot(n => n.id === action.payload),
      );
    case types.ADD_RECENT_NOTIFICATION:
      return state.update('recentNotifications', ns => ns.push(action.payload));
    default:
      return state;
  }
};

export default reducer;

function getNotificationMessage(msgType, msg, title) {
  switch (msgType) {
    case NOTICE_TYPES.SUCCESS:
      return {
        type: types.ADD_NOTIFICATION,
        payload: { id: Date.now(), type: NOTICE_TYPES.SUCCESS, title, msg },
      };
    case NOTICE_TYPES.INFO:
      return {
        type: types.ADD_NOTIFICATION,
        payload: { id: Date.now(), type: NOTICE_TYPES.INFO, title, msg },
      };
    case NOTICE_TYPES.WARN:
      return {
        type: types.ADD_NOTIFICATION,
        payload: { id: Date.now(), type: NOTICE_TYPES.WARN, title, msg },
      };
    case NOTICE_TYPES.ERROR:
      return {
        type: types.ADD_NOTIFICATION,
        payload: { id: Date.now(), type: NOTICE_TYPES.ERROR, title, msg },
      };
    case NOTICE_TYPES.NORMAL:
      return {
        type: types.ADD_NOTIFICATION,
        payload: { id: Date.now(), type: NOTICE_TYPES.NORMAL, title, msg },
      };
  }
}

import { Record, List } from 'immutable';
import { Utils } from 'common';
import moment from 'moment';
const { namespace, noPayload, withPayload } = Utils;

export const types = {
  FETCH_APP_SETTINGS: namespace('app', 'FETCH_APP_SETTINGS'),
  SET_APP_SETTINGS: namespace('app', 'SET_APP_SETTINGS'),
  SET_SIDEBAR_OPEN: namespace('app', 'SET_SIDEBAR_OPEN'),
  DELETE_ALERT: namespace('app', 'DELETE_ALERT'),
  SET_SETTINGS_BACK_PATH: namespace('app', 'SET_SETTINGS_BACK_PATH'),
};

export const actions = {
  fetchAppSettings: noPayload(types.FETCH_APP_SETTINGS),
  setAppSettings: withPayload(types.SET_APP_SETTINGS),
  setSidebarOpen: withPayload(types.SET_SIDEBAR_OPEN),
  deleteAlert: withPayload(types.DELETE_ALERT),
  setSettingsBackPath: withPayload(types.SET_SETTINGS_BACK_PATH),
};

export const selectHasSharedTaskEngine = state =>
  state.app.loading
    ? false
    : Utils.getAttributeValue(state.app.space, 'Task Server Url', '').includes(
        'shared',
      ) ||
      Utils.getAttributeValue(state.app.space, 'Shared Workflow Engine', '')
        .downcase === 'true'
      ? true
      : false;

export const State = Record({
  appLoading: true,
  sidebarOpen: true,
  spaceAdmins: List(),
  userAttributeDefinitions: {},
  userProfileAttributeDefinitions: {},
  settingsBackPath: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_APP_SETTINGS:
      return state.set('appLoading', true);
    case types.SET_APP_SETTINGS:
      return state
        .set('spaceAdmins', List(payload.spaceAdmins))
        .set('userAttributeDefinitions', payload.userAttributeDefinitions)
        .set(
          'userProfileAttributeDefinitions',
          payload.userProfileAttributeDefinitions,
        )
        .set('appLoading', false);
    case types.SET_SIDEBAR_OPEN:
      return state.set('sidebarOpen', payload);
    case types.SET_SETTINGS_BACK_PATH:
      return state.set('settingsBackPath', payload);
    default:
      return state;
  }
};

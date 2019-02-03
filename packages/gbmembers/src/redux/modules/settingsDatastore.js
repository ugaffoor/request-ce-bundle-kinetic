import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_CALL_SCRIPTS: namespace('datastore', 'FETCH_CALL_SCRIPTS'),
  SET_CALL_SCRIPTS: namespace('datastore', 'SET_CALL_SCRIPTS')
};

export const actions = {
  fetchCallScripts: withPayload(types.FETCH_CALL_SCRIPTS),
  setCallScripts: withPayload(types.SET_CALL_SCRIPTS)
};

export const State = Record({
  callScripts: [],
  callScriptsLoading: true
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CALL_SCRIPTS:
      return state.set('callScriptsLoading', true);
    case types.SET_CALL_SCRIPTS: {
      return state.set('callScriptsLoading', false).set('callScripts', payload);
    }
    default:
      return state;
  }
};

import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_CALL_SCRIPTS: namespace('datastore', 'FETCH_CALL_SCRIPTS'),
  SET_CALL_SCRIPTS: namespace('datastore', 'SET_CALL_SCRIPTS'),
  FETCH_EMAIL_TEMPLATES: namespace('datastore', 'FETCH_EMAIL_TEMPLATES'),
  SET_EMAIL_TEMPLATES: namespace('datastore', 'SET_EMAIL_TEMPLATES'),
};

export const actions = {
  fetchCallScripts: withPayload(types.FETCH_CALL_SCRIPTS),
  setCallScripts: withPayload(types.SET_CALL_SCRIPTS),
  fetchEmailTemplates: withPayload(types.FETCH_EMAIL_TEMPLATES),
  setEmailTemplates: withPayload(types.SET_EMAIL_TEMPLATES),
};

export const State = Record({
  callScripts: [],
  callScriptsLoading: true,
  emailTemplates: [],
  emailTemplatesLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CALL_SCRIPTS:
      return state.set('callScriptsLoading', true);
    case types.SET_CALL_SCRIPTS: {
      return state.set('callScriptsLoading', false).set('callScripts', payload);
    }
    case types.FETCH_EMAIL_TEMPLATES:
      return state.set('emailTemplatesLoading', true);
    case types.SET_EMAIL_TEMPLATES: {
      return state
        .set('emailTemplatesLoading', false)
        .set('emailTemplates', payload);
    }
    default:
      return state;
  }
};

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
  emailTemplateCategories: [],
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
      var templates = payload;
      var categories = new Map();

      templates = templates.sort(function(a, b) {
        categories.set(
          a.values['Category'] === undefined || a.values['Category'] === null
            ? ''
            : a.values['Category'],
          a.values['Category'] === undefined || a.values['Category'] === null
            ? ''
            : a.values['Category'],
        );
        if (
          a.values['Category'] === undefined ||
          a.values['Category'] === null
        ) {
          return -1;
        }
        if (
          b.values['Category'] === undefined ||
          b.values['Category'] === null
        ) {
          return 1;
        }
        return a.values['Category'] > b['Category']
          ? 1
          : b['Category'] > a['Category']
          ? -1
          : 0;
      });

      var categoryArray = [];
      categories.forEach(value => {
        categoryArray.push(value);
      });
      return state
        .set('emailTemplatesLoading', false)
        .set('emailTemplateCategories', categoryArray)
        .set('emailTemplates', templates);
    }
    default:
      return state;
  }
};

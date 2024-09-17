import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_CALL_SCRIPTS: namespace('datastore', 'FETCH_CALL_SCRIPTS'),
  SET_CALL_SCRIPTS: namespace('datastore', 'SET_CALL_SCRIPTS'),
  FETCH_EMAIL_TEMPLATES: namespace('datastore', 'FETCH_EMAIL_TEMPLATES'),
  FETCH_EMAIL_TEMPLATE: namespace('datastore', 'FETCH_EMAIL_TEMPLATE'),
  FETCH_EMAIL_TEMPLATE_BYNAME: namespace(
    'datastore',
    'FETCH_EMAIL_TEMPLATE_BYNAME',
  ),
  SET_EMAIL_TEMPLATES: namespace('datastore', 'SET_EMAIL_TEMPLATES'),
  SET_EMAIL_TEMPLATE: namespace('datastore', 'SET_EMAIL_TEMPLATE'),
  FETCH_SMS_TEMPLATES: namespace('datastore', 'FETCH_SMS_TEMPLATES'),
  SET_SMS_TEMPLATES: namespace('datastore', 'SET_SMS_TEMPLATES'),
  FETCH_JOURNEY_EVENT: namespace('datastore', 'FETCH_JOURNEY_EVENT'),
  SET_JOURNEY_EVENT: namespace('datastore', 'SET_JOURNEY_EVENT'),
  RESET_JOURNEY_EVENT: namespace('datastore', 'RESET_JOURNEY_EVENT'),
  SET_JOURNEY_EVENT_ERROR: namespace('datastore', 'SET_JOURNEY_EVENT_ERROR'),
  CREATE_JOURNEY_EVENT: namespace('datastore', 'CREATE_JOURNEY_EVENT'),
  UPDATE_JOURNEY_EVENT: namespace('datastore', 'UPDATE_JOURNEY_EVENT'),
  DELETE_JOURNEY_EVENT: namespace('datastore', 'DELETE_JOURNEY_EVENT'),
  CREATE_TRIAL_BOOKING: namespace('datastore', 'CREATE_TRIAL_BOOKING'),
  DELETE_TRIAL_BOOKING: namespace('datastore', 'DELETE_TRIAL_BOOKING'),
  UPDATE_SPACE_ATTRIBUTE: namespace('datastore', 'UPDATE_SPACE_ATTRIBUTE'),
  FETCH_UPDATE_SPACE_ATTRIBUTES: namespace(
    'datastore',
    'FETCH_UPDATE_SPACE_ATTRIBUTES',
  ),
  SET_UPDATE_SPACE_ATTRIBUTES: namespace(
    'datastore',
    'SET_UPDATE_SPACE_ATTRIBUTES',
  ),
};

export const actions = {
  fetchCallScripts: withPayload(types.FETCH_CALL_SCRIPTS),
  setCallScripts: withPayload(types.SET_CALL_SCRIPTS),
  fetchEmailTemplates: withPayload(types.FETCH_EMAIL_TEMPLATES),
  fetchEmailTemplate: withPayload(types.FETCH_EMAIL_TEMPLATE),
  fetchEmailTemplateByName: withPayload(types.FETCH_EMAIL_TEMPLATE_BYNAME),
  setEmailTemplates: withPayload(types.SET_EMAIL_TEMPLATES),
  setEmailTemplate: withPayload(types.SET_EMAIL_TEMPLATE),
  fetchSMSTemplates: withPayload(types.FETCH_SMS_TEMPLATES),
  setSMSTemplates: withPayload(types.SET_SMS_TEMPLATES),
  fetchJourneyEvent: withPayload(types.FETCH_JOURNEY_EVENT),
  setJourneyEvent: withPayload(types.SET_JOURNEY_EVENT),
  resetJourneyEvent: withPayload(types.RESET_JOURNEY_EVENT),
  setJourneyEventError: withPayload(types.SET_JOURNEY_EVENT_ERROR),
  createJourneyEvent: withPayload(types.CREATE_JOURNEY_EVENT),
  updateJourneyEvent: withPayload(types.UPDATE_JOURNEY_EVENT),
  deleteJourneyEvent: withPayload(types.DELETE_JOURNEY_EVENT),
  createTrialBooking: withPayload(types.CREATE_TRIAL_BOOKING),
  deleteTrialBooking: withPayload(types.DELETE_TRIAL_BOOKING),
  updateSpaceAttribute: withPayload(types.UPDATE_SPACE_ATTRIBUTE),
  fetchUpdateSpaceAttributes: withPayload(types.FETCH_UPDATE_SPACE_ATTRIBUTES),
  setUpdateSpaceAttributes: withPayload(types.SET_UPDATE_SPACE_ATTRIBUTES),
};

export const State = Record({
  callScripts: [],
  callScriptsLoading: true,
  emailTemplateCategories: [],
  emailTemplates: [],
  emailTemplatesLoading: true,
  emailTemplate: {},
  emailTemplateLoading: true,
  smsTemplates: [],
  smsTemplatesLoading: true,
  journeyEventLoading: true,
  journeyEvent: null,
  error: null,
  updatingAttribute: false,
  updateSpaceAttributes: [],
  updateSpaceAttributesLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CALL_SCRIPTS:
      return state.set('callScriptsLoading', true);
    case types.SET_CALL_SCRIPTS: {
      return state.set('callScriptsLoading', false).set('callScripts', payload);
    }
    case types.FETCH_EMAIL_TEMPLATE:
      return state.set('emailTemplateLoading', true);
    case types.FETCH_EMAIL_TEMPLATE_BYNAME:
      return state.set('emailTemplateLoading', true);
    case types.SET_EMAIL_TEMPLATE: {
      return state
        .set('emailTemplateLoading', false)
        .set('emailTemplate', payload[0].values);
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
    case types.FETCH_SMS_TEMPLATES:
      return state.set('smsTemplatesLoading', true);
    case types.SET_SMS_TEMPLATES: {
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
        .set('smsTemplatesLoading', false)
        .set('smsTemplateCategories', categoryArray)
        .set('smsTemplates', templates);
    }
    case types.FETCH_JOURNEY_EVENT:
      return state.set('journeyEventLoading', true).set('journeyEvent', null);
    case types.SET_JOURNEY_EVENT:
      return state
        .set('journeyEventLoading', false)
        .set('error', null)
        .set('journeyEvent', payload);
    case types.RESET_JOURNEY_EVENT:
      return state.set('journeyEventLoading', true);
    case types.SET_JOURNEY_EVENT_ERROR:
      return state.set('journeyEventLoading', false).set('error', payload);
    case types.UPDATE_SPACE_ATTRIBUTE:
      return state.set('updatingAttribute', true);
    case types.FETCH_UPDATE_SPACE_ATTRIBUTES:
      return state.set('updateSpaceAttributesLoading', true);
    case types.SET_UPDATE_SPACE_ATTRIBUTES:
      payload.submissions = payload.submissions.sort(function(a, b) {
        return a.createdAt > b.createdAt
          ? -1
          : b.createdAt > a.createdAt
          ? 1
          : 0;
      });

      return state
        .set('updateSpaceAttributesLoading', false)
        .set('updateSpaceAttributes', payload);
    default:
      return state;
  }
};

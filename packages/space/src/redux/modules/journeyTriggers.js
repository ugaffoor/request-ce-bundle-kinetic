import { Record, List } from 'immutable';
import { Utils } from 'common';
const { namespace, noPayload, withPayload } = Utils;

export const State = Record({
  journeyGroups: List(),
  journeyTriggers: List(),
  journeyEvents: List(),
  emailTemplates: null,
  smsTemplates: null,
  scriptTemplates: null,
  journeyInfoLoading: false,
  journeyTriggerUpdating: false,
  journeyEventsLoading: false,
});

export const types = {
  FETCH_JOURNEY_INFO: namespace('journey', 'FETCH_JOURNEY_INFO'),
  SET_JOURNEY_INFO: namespace('journey', 'SET_JOURNEY_INFO'),
  FETCH_TEMPLATES: namespace('journey', 'FETCH_TEMPLATES'),
  SET_TEMPLATES: namespace('journey', 'SET_TEMPLATES'),
  UPDATE_JOURNEY_TRIGGER: namespace('journey', 'UPDATE_JOURNEY_TRIGGER'),
  DELETE_TRIGGER: namespace('journey', 'DELETE_TRIGGER'),
  FETCH_JOURNEY_EVENTS: namespace('journey', 'FETCH_JOURNEY_EVENTS'),
  SET_JOURNEY_EVENTS: namespace('journey', 'SET_JOURNEY_EVENTS'),
};

export const actions = {
  fetchJourneyInfo: noPayload(types.FETCH_JOURNEY_INFO),
  setJourneyInfo: withPayload(types.SET_JOURNEY_INFO),
  fetchTemplates: noPayload(types.FETCH_TEMPLATES),
  setTemplates: withPayload(types.SET_TEMPLATES),
  updateJourneyTrigger: withPayload(types.UPDATE_JOURNEY_TRIGGER),
  deleteTrigger: withPayload(types.DELETE_TRIGGER),
  fetchJourneyEvents: withPayload(types.FETCH_JOURNEY_EVENTS),
  setJourneyEvents: withPayload(types.SET_JOURNEY_EVENTS),
};

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_JOURNEY_INFO:
      return state.set('journeyInfoLoading', true);
    case types.SET_JOURNEY_INFO:
      return state
        .set('journeyInfoLoading', false)
        .set('journeyGroups', payload.groups)
        .set('journeyTriggers', payload.triggers);
    case types.SET_TEMPLATES:
      return state
        .set('emailTemplates', payload.emailTemplates)
        .set('smsTemplates', payload.smsTemplates)
        .set('scriptTemplates', payload.scriptTemplates);
    case types.FETCH_JOURNEY_EVENTS:
      return state.set('journeyEventsLoading', true);
    case types.SET_JOURNEY_EVENTS:
      return state
        .set('journeyEventsLoading', false)
        .set('journeyEvents', payload.events);
    default:
      return state;
  }
};

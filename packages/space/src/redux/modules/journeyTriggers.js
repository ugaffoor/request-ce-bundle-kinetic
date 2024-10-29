import { Record, List } from 'immutable';
import { Utils } from 'common';
const { namespace, noPayload, withPayload } = Utils;

export const State = Record({
  journeyGroups: List(),
  journeyTriggers: List(),
  journeyInfoLoading: false,
});

export const types = {
  FETCH_JOURNEY_INFO: namespace('journey', 'FETCH_JOURNEY_INFO'),
  SET_JOURNEY_INFO: namespace('journey', 'SET_JOURNEY_INFO'),
  UPDATE_JOURNEY_TRIGGER: namespace('journey', 'UPDATE_JOURNEY_TRIGGER'),
};

export const actions = {
  fetchJourneyInfo: noPayload(types.FETCH_JOURNEY_INFO),
  setJourneyInfo: withPayload(types.SET_JOURNEY_INFO),
  updateJourneyTrigger: withPayload(types.UPDATE_JOURNEY_TRIGGER),
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
    case types.UPDATE_JOURNEY_TRIGGER:
      return state.set('userLoading', true);
    default:
      return state;
  }
};

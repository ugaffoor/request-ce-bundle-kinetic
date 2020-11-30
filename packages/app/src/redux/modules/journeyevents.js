import { Record, List } from 'immutable';
import * as Utils from 'common/src/utils';
const { namespace, noPayload, withPayload } = Utils;

export const types = {
  FETCH_JOURNEY_EVENTS: namespace('alerts', 'FETCH_JOURNEY_EVENTS'),
  SET_JOURNEY_EVENTS: namespace('alerts', 'SET_JOURNEY_EVENTS'),
  SET_JOURNEY_EVENTS_ERROR: namespace('alerts', 'SET_JOURNEY_EVENTS_ERROR'),
};

export const actions = {
  fetchJourneyEvents: noPayload(types.FETCH_JOURNEY_EVENTS),
  setJourneyEvents: withPayload(types.SET_JOURNEY_EVENTS),
  setJourneyEventsError: withPayload(types.SET_JOURNEY_EVENTS_ERROR),
};

export const State = Record({
  loading: true,
  data: List(),
  error: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_JOURNEY_EVENTS:
      return state.set('loading', true);
    case types.SET_JOURNEY_EVENTS:
      return state
        .set('loading', false)
        .set('error', null)
        .set('data', payload);
    case types.SET_JOURNEY_EVENTS_ERROR:
      return state.set('loading', false).set('error', payload);
    default:
      return state;
  }
};

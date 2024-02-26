import { Record, List } from 'immutable';
import * as Utils from 'common/src/utils';
const { namespace, noPayload, withPayload } = Utils;

export const types = {
  FETCH_JOURNEY_EVENTS: namespace('alerts', 'FETCH_JOURNEY_EVENTS'),
  SET_JOURNEY_EVENTS: namespace('alerts', 'SET_JOURNEY_EVENTS'),
  SET_JOURNEY_EVENTS_ERROR: namespace('alerts', 'SET_JOURNEY_EVENTS_ERROR'),
  DELETE_JOURNEY_EVENTS: namespace('alerts', 'DELETE_JOURNEY_EVENTS'),
  DECREMENT_DELETE_JOURNEY_EVENTS_COUNT: namespace(
    'alerts',
    'DECREMENT_DELETE_JOURNEY_EVENTS_COUNT',
  ),
  DELETE_JOURNEY_EVENTS_COMPLETED: namespace(
    'alerts',
    'DELETE_JOURNEY_EVENTS_COMPLETED',
  ),
};

export const actions = {
  fetchJourneyEvents: noPayload(types.FETCH_JOURNEY_EVENTS),
  setJourneyEvents: withPayload(types.SET_JOURNEY_EVENTS),
  setJourneyEventsError: withPayload(types.SET_JOURNEY_EVENTS_ERROR),
  deleteJourneyEvents: withPayload(types.DELETE_JOURNEY_EVENTS),
  decrementDeletingJourneyEventsCount: withPayload(
    types.DECREMENT_DELETE_JOURNEY_EVENTS_COUNT,
  ),
  deleteJourneyEventsCompleted: withPayload(
    types.DELETE_JOURNEY_EVENTS_COMPLETED,
  ),
};

export const State = Record({
  loading: true,
  data: List(),
  error: null,
  deletingJourneyEventsCount: 0,
  deletingJourneyEvents: false,
  deletedJourneyEventIds: [],
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
    case types.DELETE_JOURNEY_EVENTS:
      return state
        .set('deletingJourneyEvents', true)
        .set('deletedJourneyEventIds', payload.ids)
        .set('deletingJourneyEventsCount', payload.ids.length);
    case types.DECREMENT_DELETE_JOURNEY_EVENTS_COUNT:
      return state.set('deletingJourneyEventsCount', payload);
    case types.DELETE_JOURNEY_EVENTS_COMPLETED:
      return state
        .set('deletingJourneyEvents', false)
        .set('deletedJourneyEventIds', []);
    default:
      return state;
  }
};

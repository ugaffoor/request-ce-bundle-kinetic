import { List, Record } from 'immutable';
import { namespace, withPayload, noPayload } from '../../utils';

export const types = {
  FETCH_ALERTS: namespace('queue', 'FETCH_ALERTS'),
  SET_ALERTS: namespace('queue', 'SET_ALERTS'),
  SET_ALERTS_ERROR: namespace('queue', 'SET_ALERTS_ERROR'),
};

export const actions = {
  fetchAlerts: noPayload(types.FETCH_ALERTS),
  setAlerts: withPayload(types.SET_ALERTS),
  setAlertsError: withPayload(types.SET_ALERTS_ERROR),
};

export const State = Record({
  loading: true,
  error: null,
  data: List(),
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_ALERTS:
      return state.set('loading', true);
    case types.SET_ALERTS:
      return state
        .set('loading', false)
        .set('error', null)
        .set('data', payload);
    case types.SET_ALERTS_ERROR:
      return state.set('loading', false).set('error', payload);
    default:
      return state;
  }
};

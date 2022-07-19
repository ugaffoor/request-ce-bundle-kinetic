import { Record, List } from 'immutable';
import * as Utils from 'common/src/utils';
const { namespace, noPayload, withPayload } = Utils;

export const types = {
  FETCH_HELP: namespace('help', 'FETCH_HELP'),
  SET_HELP: namespace('help', 'SET_HELP'),
  SET_HELP_ERROR: namespace('help', 'SET_HELP_ERROR'),
};

export const actions = {
  fetchHelp: noPayload(types.FETCH_HELP),
  setHelp: withPayload(types.SET_HELP),
  setHelpError: withPayload(types.SET_HELP_ERROR),
};

export const State = Record({
  loading: true,
  data: List(),
  error: null,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_HELP:
      return state.set('loading', true);
    case types.SET_HELP:
      return state
        .set('loading', false)
        .set('error', null)
        .set('data', payload);
    case types.SET_HELP_ERROR:
      return state.set('loading', false).set('error', payload);
    default:
      return state;
  }
};

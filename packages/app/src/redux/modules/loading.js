import * as Utils from 'common/src/utils';
import { Record } from 'immutable';
const { namespace, withPayload } = Utils;

export const types = {
  LOAD_APP: namespace('loading', 'LOAD_APP'),
  SET_LOADING: namespace('loading', 'SET_LOADING'),
};

export const actions = {
  loadApp: withPayload(types.LOAD_APP),
  setLoading: withPayload(types.SET_LOADING),
};
const State = Record({
  metaJSONLocation: '.',
  loading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SET_LOADING:
      return state
        .set('loading', payload.loading)
        .set('metaJSONLocation', payload.metaJSONLocation);
    default:
      return state;
  }
};

import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_SUBMISSIONS: namespace('datastore', 'FETCH_SUBMISSIONS'),
  SET_SUBMISSIONS: namespace('datastore', 'SET_SUBMISSIONS')
};

export const actions = {
  fetchSubmissions: withPayload(types.FETCH_SUBMISSIONS),
  setSubmissions: withPayload(types.SET_SUBMISSIONS)
};

export const State = Record({
  submissions: [],
  submissionsLoading: true
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_SUBMISSIONS:
      return state.set('submissionsLoading', true);
    case types.SET_SUBMISSIONS: {
      return state.set('submissionsLoading', false).set('submissions', payload);
    }
    default:
      return state;
  }
};

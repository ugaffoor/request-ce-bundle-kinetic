import { Record } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_ACTIVITY_REPORT: namespace('reporting', 'FETCH_ACTIVITY_REPORT'),
  SET_ACTIVITY_REPORT: namespace('reporting', 'SET_ACTIVITY_REPORT'),
};

export const actions = {
  fetchActivityReport: withPayload(types.FETCH_ACTIVITY_REPORT),
  setActivityReport: withPayload(types.SET_ACTIVITY_REPORT)
};

export const State = Record({
  activityReport: {},
  activityReportLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_ACTIVITY_REPORT:
      return state.set('activityReportLoading', true);
    case types.SET_ACTIVITY_REPORT: {
      return state.set('activityReportLoading', false).set('activityReport', payload);
    }
    default:
      return state;
  }
};

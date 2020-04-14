import { Record, List } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_MONTHLY_STATISTICS: namespace(
    'monthlyStatistics',
    'FETCH_MONTHLY_STATISTICS',
  ),
  SET_MONTHLY_STATISTICS: namespace(
    'monthlyStatistics',
    'SET_MONTHLY_STATISTICS',
  ),
};

export const actions = {
  fetchMonthlyStatistics: withPayload(types.FETCH_MONTHLY_STATISTICS),
  setMonthlyStatistics: withPayload(types.SET_MONTHLY_STATISTICS),
};

export const State = Record({
  monthlyStatistics: [],
  monthlyStatisticsLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_MONTHLY_STATISTICS:
      return state.set('monthlyStatisticsLoading', true);
    case types.SET_MONTHLY_STATISTICS: {
      return state
        .set('monthlyStatisticsLoading', false)
        .set('monthlyStatistics', payload);
    }
    default:
      return state;
  }
};

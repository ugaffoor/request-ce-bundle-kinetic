import { call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/monthlyStatistics';
import { actions as errorActions } from '../modules/errors';

const util = require('util');

export function* fetchMonthlyStatistics(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'monthly-statistics',
      search,
    });
    yield put(actions.setMonthlyStatistics(submissions));
  } catch (error) {
    console.log('Error in fetchMonthlyStatistics: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchMonthlyStatistics() {
  console.log('watchMonthlyStatistics');
  yield takeEvery(types.FETCH_MONTHLY_STATISTICS, fetchMonthlyStatistics);
}

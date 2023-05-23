import { all, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import { actions, types } from '../modules/services';
import { actions as systemErrorActions } from '../modules/systemError';
import moment from 'moment';

export function* fetchServicesByDate(action) {
  const kappSlug = 'services';
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .coreState('Submitted')
    .type('Service')
    .sortBy('submittedAt')
    .sortDirection('DESC')
    .limit(1000)
    .includes([
      'details',
      'values[Student First Name],values[Student Last Name],values[Members],values[Payment Required],values[Term End Date]',
      'form',
    ]);

  if (action.payload !== undefined) {
    searchBuilder.startDate(action.payload.fromDate.toDate());
    searchBuilder.endDate(action.payload.toDate.toDate());
  }
  searchBuilder.end();

  const search = searchBuilder.build();

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
    kapp: 'services',
    search,
  });

  const serverError = submissions.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(actions.setServices(submissions));
  }
}

export function* watchServices() {
  yield takeEvery(types.FETCH_SERVICESBYDATE, fetchServicesByDate);
}

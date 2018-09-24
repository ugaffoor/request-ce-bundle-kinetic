import { call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/alerts';

export const ALERTS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();

export function* fetchAlertsSaga() {
  console.log('debug alert 1');
  const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
    datastore: true,
    form: 'alerts',
    search: ALERTS_SEARCH,
  });
  console.log('debug alert 2');

  yield put(
    serverError
      ? actions.setAlertsError(serverError)
      : actions.setAlerts(submissions),
  );
}

export function* watchAlerts() {
  yield takeEvery(types.FETCH_ALERTS, fetchAlertsSaga);
}

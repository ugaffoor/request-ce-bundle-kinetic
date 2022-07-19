import { takeEvery, call, put } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { actions, types } from '../modules/help';

// Alerts Search Query
export const HELP_SEARCH = new CoreAPI.SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();

export function* fetchHelp() {
  const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
    form: 'help-info',
    search: HELP_SEARCH,
    datastore: true,
  });

  yield put(
    serverError
      ? actions.setHelpError(serverError)
      : actions.setHelp(submissions),
  );
}

export function* watchHelp() {
  yield takeEvery(types.FETCH_HELP, fetchHelp);
}

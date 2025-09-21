import { all, call, put, takeEvery, select } from 'redux-saga/effects';
import { SubmissionSearch, searchSubmissions } from '@kineticdata/react';
import * as constants from '../../constants';
import { actions, types } from '../modules/registrationCounts';
import { actions as systemErrorActions } from '../modules/systemError';

const buildSearch = (coreState, username) =>
  new SubmissionSearch()
    .coreState(coreState)
    .type(constants.REGISTRATION_FORM_TYPE)
    .limit(constants.REGISTRATION_COUNT_LIMIT)
    .or()
    .eq(`values[${constants.REQUESTED_FOR_FIELD}]`, username)
    .eq('submittedBy', username)
    .end()
    .build();

export function* fetchRegistrationCountsSaga() {
  const kappSlug = yield select(state => state.app.config.kappSlug);
  const username = yield select(state => state.app.profile.username);
  const [draft, submitted, closed] = yield all([
    call(searchSubmissions, {
      get: true,
      search: buildSearch(constants.CORE_STATE_DRAFT, username),
      kapp: kappSlug,
    }),
    call(searchSubmissions, {
      get: true,
      search: buildSearch(constants.CORE_STATE_SUBMITTED, username),
      kapp: kappSlug,
    }),
    call(searchSubmissions, {
      get: true,
      search: buildSearch(constants.CORE_STATE_CLOSED, username),
      kapp: kappSlug,
    }),
  ]);

  const serverError =
    draft.serverError || submitted.serverError || closed.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(
      actions.setRegistrationCounts({
        Draft: draft.submissions.length,
        Submitted: submitted.submissions.length,
        Closed: closed.submissions.length,
      }),
    );
  }
}

export function* watchRegistrationCounts() {
  yield takeEvery(types.FETCH_REGISTRATION_COUNTS, fetchRegistrationCountsSaga);
}

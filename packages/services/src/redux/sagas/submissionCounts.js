import { all, call, put, takeEvery, select } from 'redux-saga/effects';
import { SubmissionSearch, searchSubmissions } from '@kineticdata/react';
import * as constants from '../../constants';
import { actions, types } from '../modules/submissionCounts';
import { actions as systemErrorActions } from '../modules/systemError';

const buildSearch = (coreState, username) =>
  new SubmissionSearch()
    .coreState(coreState)
    .type(constants.SUBMISSION_FORM_TYPE)
    .limit(constants.SUBMISSION_COUNT_LIMIT)
    //    .or()
    //    .eq(`values[${constants.REQUESTED_FOR_FIELD}]`, username)
    //    .eq('submittedBy', username)
    .end()
    .build();

export function* fetchSubmissionCountsSaga() {
  try {
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
        actions.setSubmissionCounts({
          Draft: draft.submissions !== undefined ? draft.submissions.length : 0,
          Submitted:
            submitted.submissions !== undefined
              ? submitted.submissions.length
              : 0,
          Closed:
            closed.submissions !== undefined ? closed.submissions.length : 0,
        }),
      );
    }
  } catch (error) {
    console.log('Error in fetchSubmissionCountsSaga: ' + util.inspect(error));
  }
}

export function* watchSubmissionCounts() {
  yield takeEvery(types.FETCH_SUBMISSION_COUNTS, fetchSubmissionCountsSaga);
}

import { call, put, select, takeEvery } from 'redux-saga/effects';
import { SubmissionSearch, searchSubmissions } from '@kineticdata/react';
import { Utils } from 'common';

import * as constants from '../../constants';
import { actions, types } from '../modules/submissions';
import { actions as systemErrorActions } from '../modules/systemError';

export function* fetchSubmissionsSaga(action) {
  try {
    const kappSlug = yield select(state => state.app.config.kappSlug);
    const username = yield select(state => state.app.profile.username);
    const profile = yield select(state => state.app.profile);
    const pageToken = yield select(state => state.services.submissions.current);
    const searchBuilder = new SubmissionSearch()
      .type(constants.SUBMISSION_FORM_TYPE)
      .limit(constants.PAGE_SIZE)
      .includes([
        'details',
        'values',
        'form',
        'form.attributes',
        'form.kapp',
        'form.kapp.attributes',
        'form.kapp.space.attributes',
      ]);
    if (
      action.payload.coreState !== undefined &&
      action.payload.coreState.name !== undefined
    ) {
      searchBuilder
        .or()
        .eq(
          `values[${constants.REQUESTED_FOR_FIELD}]`,
          action.payload.coreState.name,
        );
      //    .eq('submittedBy', username)
      //    .eq('createdBy', username)
    } else if (
      profile.spaceAdmin ||
      Utils.isMemberOf(profile, 'Role::Data Admin') ||
      Utils.isMemberOf(profile, 'Role::Program Managers')
    ) {
    } else {
      searchBuilder
        .or()
        .eq('submittedBy', username)
        .eq('createdBy', username);
    }
    searchBuilder.end();
    // Add some of the optional parameters to the search
    //  if (coreState) searchBuilder.coreState(coreState);
    if (pageToken) searchBuilder.pageToken(pageToken);
    const search = searchBuilder.build();

    const { submissions, nextPageToken, serverError } = yield call(
      searchSubmissions,
      {
        get: true,
        search,
        kapp: kappSlug,
      },
    );

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else {
      yield put(
        pageToken && submissions.length === 0
          ? actions.fetchPreviousPage(coreState)
          : actions.setSubmissions(submissions, nextPageToken),
      );
    }
  } catch (error) {
    console.log('Error in fetchSubmissionsSaga: ' + util.inspect(error));
  }
}

export function* watchSubmissions() {
  yield takeEvery(
    [
      types.FETCH_SUBMISSIONS,
      types.FETCH_NEXT_PAGE,
      types.FETCH_PREVIOUS_PAGE,
      types.FETCH_CURRENT_PAGE,
    ],
    fetchSubmissionsSaga,
  );
}

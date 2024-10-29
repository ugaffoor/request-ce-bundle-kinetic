import { takeEvery, call, all, put, select } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import { commonActions } from 'common';
import { types, actions } from '../modules/journeyTriggers';
import { actions as errorActions } from '../modules/errors';

export const JOURNEY_GROUPS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();

export const JOURNEY_TRIGGERS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();

export function* fetchJourneyInfo({ payload }) {
  const { groups, triggers } = yield all({
    groups: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'trigger-groups',
      search: JOURNEY_GROUPS_SEARCH,
    }),
    triggers: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'journey-triggers',
      search: JOURNEY_TRIGGERS_SEARCH,
    }),
  });

  var groupsSubmissions = groups.submissions;
  var triggerSubmissions = triggers.submissions;

  if (groups.serverError) {
    yield put(actions.setUserError(groups.serverError));
  } else if (triggers.serverError) {
    yield put(actions.setUserError(triggers.serverError));
  } else {
    yield put(
      actions.setJourneyInfo({
        groups: groupsSubmissions,
        triggers: triggerSubmissions,
      }),
    );
  }
}

export function* updateJourneyTrigger({ payload }) {
  const { serverError, user } = yield call(CoreAPI.updateUser, {
    include: USER_INCLUDES,
    username: payload.username,
    user: payload,
  });

  if (serverError) {
    yield put(actions.setUserError(serverError));
  } else {
    const username = yield select(state => state.app.profile.username);
    if (username === user.username) {
      yield put(commonActions.loadApp());
    }
    yield put(actions.setUser(user));
    yield put(actions.fetchUsers());
  }
}

export function* watchJourneyTriggers() {
  yield takeEvery(types.FETCH_JOURNEY_INFO, fetchJourneyInfo);
  yield takeEvery(types.UPDATE_JOURNEY_TRIGGER, updateJourneyTrigger);
}

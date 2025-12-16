import { takeEvery, all, call, put } from 'redux-saga/effects';
import { push } from 'connected-react-router';

import { fetchTeams, fetchUsers } from '@kineticdata/react';

import { types, actions } from '../modules/about';
import { actions as systemErrorActions } from '../modules/errors';

export function* fetchAboutSaga() {
  try {
    const [teamResult, userResult] = yield all([
      call(fetchTeams),
      call(fetchUsers),
    ]);
    const serverError = teamResult.serverError || userResult.serverError;
    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
      yield put(push('/system-error'));
    } else {
      const about = {
        numberOfTeams: teamResult.teams.length,
        numberOfUsers: userResult.users.length,
        spaceAdmins: userResult.users.filter(user => user.spaceAdmin),
      };
      yield put(actions.setAbout(about));
    }
  } catch (error) {
    console.log('Error in fetchAboutSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchAboutSaga'));
  }
}

export function* watchAbout() {
  yield takeEvery(types.FETCH_ABOUT, fetchAboutSaga);
}

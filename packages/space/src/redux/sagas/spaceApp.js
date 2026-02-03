import { takeEvery, put, all, call, select } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { fetchUsers, fetchSpace, deleteSubmission } from '@kineticdata/react';
import { List } from 'immutable';
import { commonActions, toastActions } from 'common';
import { actions, types } from '../modules/spaceApp';
import { actions as errorActions } from '../modules/errors';

export function* fetchAppSettingsSaga() {
  try {
    const [
      { users, usersServerError },
      { space, spaceServerError },
    ] = yield all([
      call(fetchUsers),
      call(fetchSpace, {
        include: 'userAttributeDefinitions,userProfileAttributeDefinitions',
      }),
    ]);

    if (usersServerError || spaceServerError) {
      yield put(
        errorActions.setSystemError(usersServerError || spaceServerError),
      );
    } else {
      yield put(
        actions.setAppSettings({
          spaceAdmins: List(users).filter(u => u.spaceAdmin),
          userAttributeDefinitions: space.userAttributeDefinitions.reduce(
            (memo, item) => {
              memo[item.name] = item;
              return memo;
            },
            {},
          ),
          userProfileAttributeDefinitions: space.userProfileAttributeDefinitions.reduce(
            (memo, item) => {
              memo[item.name] = item;
              return memo;
            },
            {},
          ),
        }),
      );
    }
  } catch (error) {
    console.log('Error in fetchAppSettingsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchAppSettingsSaga'));
  }
}

export function* deleteAlertSaga(action) {
  try {
    const { errors, serverError } = yield call(deleteSubmission, {
      id: action.payload,
    });

    if (serverError || errors) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(toastActions.addSuccess('Deleted alert.'));
      yield put(commonActions.fetchAlerts());
    }
  } catch (error) {
    console.log('Error in deleteAlertSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'deleteAlertSaga'));
  }
}

export function* watchSpaceApp() {
  yield takeEvery(types.FETCH_APP_SETTINGS, fetchAppSettingsSaga);
  yield takeEvery(types.DELETE_ALERT, deleteAlertSaga);
}

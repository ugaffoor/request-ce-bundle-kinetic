import { takeEvery, call, put, select } from 'redux-saga/effects';
import {
  fetchUser,
  updateUser,
  createUser,
  fetchUsers,
  deleteUser,
} from '@kineticdata/react';

import { commonActions } from 'common';
import { types, actions } from '../modules/settingsUsers';
import { actions as errorActions } from '../modules/errors';

const USER_INCLUDES =
  'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user';

export function* fetchUserSaga({ payload }) {
  try {
    const { serverError, user } = yield call(fetchUser, {
      include: USER_INCLUDES,
      username: payload,
    });
    if (serverError) {
      yield put(actions.setUserError(serverError));
    } else {
      yield put(actions.setUser(user));
    }
  } catch (error) {
    console.log('Error in fetchUserSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchUserSaga'));
  }
}

export function* updateUserSaga({ payload }) {
  try {
    const { serverError, user } = yield call(updateUser, {
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
  } catch (error) {
    console.log('Error in updateUserSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'updateUserSaga'));
  }
}

export function* createUserSaga({ payload }) {
  try {
    const { serverError, user } = yield call(createUser, {
      include: USER_INCLUDES,
      user: payload,
    });

    if (serverError) {
      yield put(actions.setUserError(serverError));
    } else {
      yield put(actions.setUser(user));
      yield put(actions.fetchUsers());
    }
  } catch (error) {
    console.log('Error in createUserSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'createUserSaga'));
  }
}

export function* fetchUsersSaga() {
  try {
    const { users, serverError } = yield call(fetchUsers, {
      include: 'attributesMap,memberships,profileAttributesMap',
    });

    if (serverError) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(
        actions.setUsers(
          users.filter(user => !user.username.endsWith('@kinops.io')),
        ),
      );
    }
  } catch (error) {
    console.log('Error in fetchUsersSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchUsersSaga'));
  }
}

export function* deleteUserSaga({ payload }) {
  try {
    const { serverError } = yield call(deleteUser, { username: payload });

    if (serverError) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(actions.fetchUsers());
    }
  } catch (error) {
    console.log('Error in deleteUserSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'deleteUserSaga'));
  }
}

export function* watchSettingsUsers() {
  yield takeEvery(types.FETCH_USERS, fetchUsersSaga);
  yield takeEvery(types.FETCH_USER, fetchUserSaga);
  yield takeEvery(types.UPDATE_USER, updateUserSaga);
  yield takeEvery(types.CREATE_USER, createUserSaga);
  yield takeEvery(types.DELETE_USER, deleteUserSaga);
}

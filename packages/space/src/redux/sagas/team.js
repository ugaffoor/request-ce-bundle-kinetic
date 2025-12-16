import { takeEvery, call, put } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import {
  fetchUsers,
  fetchTeams,
  fetchTeam,
  createTeam,
  updateTeam,
  deleteTeam,
} from '@kineticdata/react';

import {
  actions as listActions,
  types as listTypes,
} from '../modules/teamList';
import {
  actions as currentActions,
  types as currentTypes,
} from '../modules/team';
import { actions as errorActions } from '../modules/errors';

export function* fetchUsersSaga() {
  try {
    const { users, serverError } = yield call(fetchUsers);

    if (serverError) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(
        currentActions.setUsers(
          users.filter(user => !user.username.endsWith('@kinops.io')),
        ),
      );
    }
  } catch (error) {
    console.log('Error in fetchUsersSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchUsersSaga'));
  }
}

export function* fetchTeamsSaga() {
  try {
    const { teams, serverError } = yield call(fetchTeams, {
      include:
        'attributes,memberships.user,memberships.user.attributes,memberships.user.profileAttributes',
    });

    if (serverError) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(listActions.setTeams(teams));
      yield put(listActions.setRoles(teams));
    }
  } catch (error) {
    console.log('Error in fetchTeamsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchTeamsSaga'));
  }
}

export function* fetchTeamSaga(action) {
  try {
    const { team, serverError } = yield call(fetchTeam, {
      teamSlug: action.payload,
      include:
        'attributes,memberships.user,memberships.user.attributes,memberships.user.profileAttributes',
    });

    if (serverError) {
      yield put(errorActions.setSystemError(serverError));
    } else {
      yield put(currentActions.setTeam(team));
    }
  } catch (error) {
    console.log('Error in fetchTeamSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchTeamSaga'));
  }
}

export function* updateTeamSaga(action) {
  try {
    const { team, serverError } = yield call(updateTeam, {
      teamSlug: action.payload.slug,
      team: action.payload,
      include:
        'attributes,memberships.user,memberships.user.attributes,memberships.user.profileAttributes',
    });

    if (serverError) {
      yield put(currentActions.setSubmitError(serverError));
    } else {
      yield put(currentActions.setTeam(team));
      yield put(listActions.fetchTeams());
      yield put(push(`/teams/${team.slug}`));
    }
  } catch (error) {
    console.log('Error in updateTeamSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'updateTeamSaga'));
  }
}

export function* createTeamSaga(action) {
  try {
    const { team, serverError } = yield call(createTeam, {
      team: action.payload,
      include:
        'attributes,memberships.user,memberships.user.attributes,memberships.user.profileAttributes',
    });

    if (serverError) {
      yield put(currentActions.setSubmitError(serverError));
    } else {
      yield put(currentActions.setTeam(team));
      yield put(listActions.addTeam(team));
      yield put(push(`/teams/${team.slug}`));
    }
  } catch (error) {
    console.log('Error in createTeamSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'createTeamSaga'));
  }
}

export function* deleteTeamSaga(action) {
  try {
    const teamSlug = action.payload.slug;
    const { serverError } = yield call(deleteTeam, {
      teamSlug,
    });

    if (serverError) {
      yield put(currentActions.setDeleteError(serverError));
    } else {
      yield put(listActions.removeTeam(teamSlug));
      yield put(push('/settings/teams'));
      yield put(currentActions.resetTeam());
    }
  } catch (error) {
    console.log('Error in deleteTeamSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'deleteTeamSaga'));
  }
}

export function* cancelSaveTeamSaga(action) {
  try {
    const teamSlug = action.payload.slug;
    if (teamSlug) {
      yield put(push(`/teams/${teamSlug}`));
    } else {
      yield put(push('/settings/teams'));
    }
    yield put(currentActions.resetTeam());
  } catch (error) {
    console.log('Error in cancelSaveTeamSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'cancelSaveTeamSaga'));
  }
}

export function* watchTeams() {
  yield takeEvery(listTypes.FETCH_TEAMS, fetchTeamsSaga);
  yield takeEvery(currentTypes.FETCH_TEAM, fetchTeamSaga);
  yield takeEvery(currentTypes.UPDATE_TEAM, updateTeamSaga);
  yield takeEvery(currentTypes.CREATE_TEAM, createTeamSaga);
  yield takeEvery(currentTypes.DELETE_TEAM, deleteTeamSaga);
  yield takeEvery(currentTypes.CANCEL_SAVE_TEAM, cancelSaveTeamSaga);
  yield takeEvery(currentTypes.FETCH_TEAM, fetchUsersSaga);
}

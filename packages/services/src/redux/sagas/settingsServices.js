import { Map } from 'immutable';
import { all, takeEvery, call, put } from 'redux-saga/effects';
import { actions, types } from '../modules/settingsServices';
import { actions as kinopsActions } from 'app/src/redux/modules/loading';

import {
  fetchKapp,
  fetchForms,
  fetchTeams,
  fetchUsers,
  fetchSpace,
  updateKapp,
  SubmissionSearch,
  searchSubmissions,
} from '@kineticdata/react';

const SERVICES_SETTING_INCLUDES = 'formTypes,attributesMap,forms,forms.details';
const TEAMS_SETTING_INCLUDES = 'teams';
const SPACE_SETTING_INCLUDES = 'kapps,kapps.forms,attributes,attributesMap';

export function* fetchServicesSettingsSaga({ payload }) {
  try {
    const [{ serverError, kapp }, manageableForms] = yield all([
      call(fetchKapp, {
        include: SERVICES_SETTING_INCLUDES,
        kappSlug: 'services',
      }),
      call(fetchForms, {
        kappSlug: 'services',
        manage: 'true',
      }),
    ]);

    if (serverError) {
      yield put(actions.updateServicesSettingsError(serverError));
    } else {
      const manageableFormsSlugs = (manageableForms.forms || []).map(
        form => form.slug,
      );
      yield put(
        actions.setServicesSettings({
          ...kapp,
          forms: (kapp.forms || []).map(form => ({
            ...form,
            canManage: manageableFormsSlugs.includes(form.slug),
          })),
        }),
      );
    }
  } catch (error) {
    console.log('Error in fetchServicesSettingsSaga: ' + util.inspect(error));
  }
}

export function* fetchTeamsSaga({ payload }) {
  try {
    const { serverError, teams } = yield call(fetchTeams, {
      include: TEAMS_SETTING_INCLUDES,
      teams: payload,
    });

    if (serverError) {
      yield put(actions.updateServicesSettingsError(serverError));
    } else {
      yield put(actions.setServicesSettingsTeams(teams));
    }
  } catch (error) {
    console.log('Error in fetchTeamsSaga: ' + util.inspect(error));
  }
}

export function* fetchUsersSaga({ payload }) {
  try {
    const { serverError, users } = yield call(fetchUsers, {
      include: 'details',
    });

    if (serverError) {
      yield put(actions.updateServicesSettingsError(serverError));
    } else {
      yield put(actions.setServicesSettingsUsers(users));
    }
  } catch (error) {
    console.log('Error in fetchUsersSaga: ' + util.inspect(error));
  }
}

export function* fetchSpaceSaga({ payload }) {
  try {
    const { serverError, space } = yield call(fetchSpace, {
      include: SPACE_SETTING_INCLUDES,
      space: payload,
    });

    if (serverError) {
      yield put(actions.updateServicesSettingsError(serverError));
    } else {
      yield put(actions.setServicesSettingsSpace(space));
    }
  } catch (error) {
    console.log('Error in fetchUsersSaga: ' + util.inspect(error));
  }
}

export function* updateServicesSettingsSaga({ payload }) {
  try {
    const attributes = Map(payload)
      .filter(value => value)
      .map(value => (value.constructor === Array ? value : [value]))
      .toJS();

    const { serverError, kapp } = yield call(updateKapp, {
      include: SERVICES_SETTING_INCLUDES,
      kapp: {
        attributesMap: attributes,
      },
      kappSlug: 'services',
    });

    if (serverError) {
      yield put(actions.updateServicesSettingsError(serverError));
    } else {
      yield put(kinopsActions.loadApp());
    }
  } catch (error) {
    console.log('Error in updateServicesSettingsSaga: ' + util.inspect(error));
  }
}

export function* fetchNotificationsSaga() {
  try {
    const search = new SubmissionSearch(true)
      .index('values[Name]')
      .includes(['details', 'values'])
      .build();

    const { serverError, submissions } = yield call(searchSubmissions, {
      get: true,
      search,
      form: 'notification-data',
      datastore: true,
    });

    if (serverError) {
      yield put(actions.setFormsErrors(serverError));
    } else {
      yield put(actions.setNotifications(submissions));
    }
  } catch (error) {
    console.log('Error in fetchNotificationsSaga: ' + util.inspect(error));
  }
}

export function* watchSettingsServices() {
  yield takeEvery(types.FETCH_SERVICES_SETTINGS, fetchServicesSettingsSaga);
  yield takeEvery(types.FETCH_SERVICES_SETTINGS_TEAMS, fetchTeamsSaga);
  yield takeEvery(types.FETCH_SERVICES_SETTINGS_USERS, fetchUsersSaga);
  yield takeEvery(types.FETCH_SERVICES_SETTINGS_SPACE, fetchSpaceSaga);
  yield takeEvery(types.UPDATE_SERVICES_SETTINGS, updateServicesSettingsSaga);
  yield takeEvery(types.FETCH_NOTIFICATIONS, fetchNotificationsSaga);
}

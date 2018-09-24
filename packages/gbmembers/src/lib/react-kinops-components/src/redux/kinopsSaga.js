import { takeEvery } from 'redux-saga/effects';
import { all, call, put } from 'redux-saga/effects';
import { Map } from 'immutable';
import { CoreAPI } from 'react-kinetic-core';

import { actions, types } from './kinopsModule';

// Alerts Search Query
export const ALERTS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();

// Fetch Entire App
export function* fetchAppTask() {
  const {
    profile: { profile },
    alerts: { submissions },
  } = yield all({
    profile: call(CoreAPI.fetchProfile, {
      include:
        'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user,attributes,space,space.attributes,space.kapps,space.kapps.attributes',
    }),
    alerts: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'alerts',
      search: ALERTS_SEARCH,
    }),
  });

  const space = Map(profile.space)
    .delete('kapps')
    .toJS();
  const kapps = profile.space.kapps;
  const me = Map(profile)
    .delete('space')
    .toJS();

  const appData = {
    space,
    kapps,
    profile: me,
    alerts: submissions,
  };

  yield put(actions.setApp(appData));
}

export function* fetchAlertsTask() {
  const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
    datastore: true,
    form: 'alerts',
    search: ALERTS_SEARCH,
  });

  yield put(
    serverError
      ? actions.setAlertsError(serverError)
      : actions.setAlerts(submissions),
  );
}

export function* watchKinops() {
  yield takeEvery(types.LOAD_APP, fetchAppTask);
  yield takeEvery(types.FETCH_ALERTS, fetchAlertsTask);
}

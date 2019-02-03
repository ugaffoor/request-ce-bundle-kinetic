import { select, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import $ from 'jquery';

import { types, actions } from '../modules/settingsDatastore';
import axios from 'axios';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';


export const getAppSettings = state => state.member.app;

const util = require('util');

export function* fetchCallScripts(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(
      CoreAPI.searchSubmissions,
      {
        datastore: true,
        form: 'call-scripts',
        search
      }
    );
    yield put(actions.setCallScripts(submissions));
  } catch (error) {
    console.log('Error in fetchCallScripts: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchSettingsDatastore() {
  console.log('watchSettingsDatastore');
  yield takeEvery(types.FETCH_CALL_SCRIPTS, fetchCallScripts);
}

import { all, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import { actions, types } from '../modules/services';
import { actions as systemErrorActions } from '../modules/systemError';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import moment from 'moment';

export function* fetchServicesByDate(action) {
  const kappSlug = 'services';
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .coreState('Submitted')
    .type('Service')
    .sortBy('submittedAt')
    .sortDirection('DESC')
    .limit(1000)
    .includes([
      'details',
      'values[First Name],values[Last Name],values[Student First Name],values[Student Last Name],values[Members],values[Payment Required],values[Term Date],values[Term End Date],values[Registration Fee]',
      'form',
    ]);

  if (action.payload !== undefined) {
    searchBuilder.startDate(action.payload.fromDate.toDate());
    searchBuilder.endDate(action.payload.toDate.toDate());
  }
  searchBuilder.end();

  const search = searchBuilder.build();

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
    kapp: 'services',
    search,
  });

  const serverError = submissions.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(actions.setServices(submissions));
  }
}
export function* sendReceipt(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'receipt-sender',
      values: action.payload.values,
    });
    console.log('sendReceipt');
    yield put(errorActions.addSuccess('Email Receipt Sent', 'Send Receipt'));
  } catch (error) {
    console.log('Error in sendReceipt: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchServices() {
  yield takeEvery(types.FETCH_SERVICESBYDATE, fetchServicesByDate);
  yield takeEvery(types.SEND_RECEIPT, sendReceipt);
}

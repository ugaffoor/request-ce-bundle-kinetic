import { all, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import * as constants from '../../constants';
import { actions, types } from '../modules/registrations';
import { actions as systemErrorActions } from '../modules/systemError';

export function* fetchRegistrationsSaga(action) {
  const kappSlug = 'services';
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .coreState(constants.CORE_STATE_SUBMITTED)
    .type(constants.REGISTRATION_FORM_TYPE)
    .limit(constants.PAGE_SIZE)
    .includes([
      'details',
      'values',
      'form',
      'form.attributes',
      'form.kapp',
      'form.kapp.attributes',
    ]);

  if (action.payload !== undefined) {
    var idx = action.payload.allLeads.findIndex(
      lead => lead.id === action.payload.leadID,
    );
    if (idx !== -1) {
      var lead = action.payload.allLeads.get(idx);
      searchBuilder.eq('values[First Name]', lead.values['First Name']);
      searchBuilder.eq('values[Last Name]', lead.values['Last Name']);
    }
  }
  searchBuilder.end();

  const search = searchBuilder.build();

  const [kids, mens, womans, barrafit] = yield all([
    call(CoreAPI.searchSubmissions, {
      search,
      kapp: kappSlug,
      form: 'kids-registration',
    }),
    call(CoreAPI.searchSubmissions, {
      search,
      kapp: kappSlug,
      form: 'mens-registration',
    }),
    call(CoreAPI.searchSubmissions, {
      search,
      kapp: kappSlug,
      form: 'pink-team-registration',
    }),
    call(CoreAPI.searchSubmissions, {
      search,
      kapp: kappSlug,
      form: 'barrafit-registration',
    }),
  ]);
  const serverError =
    kids.serverError || mens.serverError || womans.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(actions.setRegistrations(kids, mens, womans, barrafit));
  }
}
export function* fetchLeads(action) {
  const search = new CoreAPI.SubmissionSearch()
    .in('values[Lead State]', ['Open', 'Converted'])
    .includes(['details', 'values'])
    .limit(1000)
    .build();

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
    kapp: 'gbmembers',
    form: 'lead',
    search,
  });
  console.log('AllLeads # ' + submissions);
  const serverError = submissions.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(actions.setLeads(submissions));
  }
}

export function* watchRegistrations() {
  console.log('watchRegistrations');
  yield takeEvery(types.FETCH_REGISTRATIONS, fetchRegistrationsSaga);
  yield takeEvery(types.FETCH_LEADS, fetchLeads);
}

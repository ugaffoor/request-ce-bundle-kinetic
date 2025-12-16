import { select, call, put, takeEvery } from 'redux-saga/effects';
import { fetchTeams } from '@kineticdata/react';
import $ from 'jquery';

import { types, actions } from '../modules/teams';
import axios from 'axios';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

export const getAppSettings = state => state.member.app;

const util = require('util');

const TEAMS_SETTING_INCLUDES = 'details,memberships,memberships.user';
export function* fetchBillingTeam(action) {
  try {
    const { teams } = yield call(fetchTeams, {
      include: TEAMS_SETTING_INCLUDES,
    });

    yield put(actions.setBillingTeam(teams));
  } catch (error) {
    console.log('Error in fetchBillingTeam: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchIsBillingUser(action) {
  try {
    const { teams } = yield call(fetchTeams, {
      include: TEAMS_SETTING_INCLUDES,
    });

    let billingTeam = teams.find(team => team.name === 'Billing');
    if (billingTeam) {
      const appSettings = yield select(getAppSettings);
      let user = billingTeam.memberships.find(
        membership => membership.user.username === appSettings.profile.username,
      );
      let isBillingUser = user ? true : false;
      yield put(actions.setIsBillingUser(isBillingUser));
    } else {
      yield put(actions.setIsBillingUser(false));
    }
  } catch (error) {
    console.log('Error in fetchIsBillingUser: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchTeams() {
  console.log('watchTeams');
  yield takeEvery(types.FETCH_BILLING_TEAM, fetchBillingTeam);
  yield takeEvery(types.FETCH_IS_BILLING_USER, fetchIsBillingUser);
}

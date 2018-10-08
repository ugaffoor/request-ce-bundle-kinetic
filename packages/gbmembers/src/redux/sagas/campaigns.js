import { call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/campaigns';
import axios, { post } from 'axios';
import { actions as errorActions } from '../modules/errors';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';
export const TOO_MANY_STATUS_STRING = 'Your filter matches too many items.';

export const SUBMISSION_INCLUDES = 'details,values,attributes';

export const getAppSettings = state => state.member.app;
const util = require('util');

export function* fetchNewCampaign(action) {
  var campaign = {
    values: {},
  };
  yield put(actions.setNewCampaign(campaign));
  if (action.payload.myThis) campaign.myThis = action.payload.myThis;
  if (action.payload.history) campaign.history = action.payload.history;
  if (action.payload.fetchCampaigns)
    campaign.fetchCampaigns = action.payload.fetchCampaigns;
  if (action.payload.allCampaigns)
    campaign.allCampaigns = action.payload.allCampaigns;
}

export function* createCampaign(action) {
  try {
    action.payload.campaignItem.myThis = undefined;
    //action.payload.campaignItem.history=undefined;
    action.payload.campaignItem.fetchCampaigns = undefined;

    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'email-campaigns',
      values: action.payload.campaignItem.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });

    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Send');
    //if (action.payload.fetchLeads)
    //action.payload.fetchLeads();
    console.log('createCampaign # ' + submission);
    yield put(
      errorActions.addSuccess(
        'Campaign created successfully',
        'Create Campaign',
      ),
    );
  } catch (error) {
    console.log('Error in createCampaign: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* updateCampaign(action) {
  try {
    console.log('#### updating campaign ... ');
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.campaignItem.values,
    });
    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Send');
    if (action.payload.fetchCampaigns) action.payload.fetchCampaigns();
    if (action.payload.fetchCampaign)
      action.payload.fetchCampaign({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    console.log('updateCampaign:' + submission);
    yield put(
      errorActions.addSuccess(
        'Campaign updated successfully',
        'Update Campaign',
      ),
    );
  } catch (error) {
    console.log('Error in updateCampaign: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchCampaign(action) {
  try {
    if (action.payload.setDummy) {
      var campaign = {
        values: {},
      };
      yield put(actions.setCampaign(campaign));
    } else {
      const { submission } = yield call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      });

      if (action.payload.myThis) submission.myThis = action.payload.myThis;
      if (action.payload.history) submission.history = action.payload.history;
      if (action.payload.fetchCampaigns)
        submission.fetchCampaigns = action.payload.fetchCampaigns;

      yield put(actions.setCampaign(submission));
    }
  } catch (error) {
    console.log('Error in fetchCampaign: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchCampaigns(action) {
  try {
    //action.payload.campaignItem.myThis=undefined;
    //action.payload.campaignItem.history=undefined;
    //action.payload.campaignItem.fetchCampaigns=undefined;
    const search = new CoreAPI.SubmissionSearch()
      .includes([
        'details',
        'values[Recipients]',
        'values[From]',
        'values[Subject]',
        'values[Body]',
        'values[Sent Date]',
        'values[Opened By Members]',
        'values[Clicked By Members]',
      ])
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'email-campaigns',
      search,
    });
    console.log('#### fetchCampaigns');
    yield put(actions.setCampaigns(submissions));
  } catch (error) {
    console.log('Error in fetchCampaigns: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchCampaigns() {
  yield takeEvery(types.FETCH_NEW_CAMPAIGN, fetchNewCampaign);
  yield takeEvery(types.CREATE_CAMPAIGN, createCampaign);
  yield takeEvery(types.FETCH_CAMPAIGN, fetchCampaign);
  yield takeEvery(types.FETCH_CAMPAIGNS, fetchCampaigns);
  yield takeEvery(types.UPDATE_CAMPAIGN, updateCampaign);
}

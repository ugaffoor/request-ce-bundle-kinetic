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

export function* fetchNewEmailCampaign(action) {
  var campaign = {
    values: {},
  };
  yield put(actions.setNewEmailCampaign(campaign));
  if (action.payload.myThis) campaign.myThis = action.payload.myThis;
  if (action.payload.history) campaign.history = action.payload.history;
  if (action.payload.fetchEmailCampaigns)
    campaign.fetchEmailCampaigns = action.payload.fetchEmailCampaigns;
  if (action.payload.allEmailCampaigns)
    campaign.allEmailCampaigns = action.payload.allEmailCampaigns;
}

export function* createEmailCampaign(action) {
  try {
    action.payload.campaignItem.myThis = undefined;
    //action.payload.campaignItem.history=undefined;
    action.payload.campaignItem.fetchEmailCampaigns = undefined;

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

export function* updateEmailCampaign(action) {
  try {
    console.log('#### updating campaign ... ');
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.campaignItem.values,
    });
    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Send');
    if (action.payload.fetchEmailCampaigns)
      action.payload.fetchEmailCampaigns();
    if (action.payload.fetchEmailCampaign)
      action.payload.fetchEmailCampaign({
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

export function* fetchEmailCampaign(action) {
  try {
    if (action.payload.setDummy) {
      var campaign = {
        values: {},
      };
      yield put(actions.setEmailCampaign(campaign));
    } else {
      const { submission } = yield call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      });

      if (action.payload.myThis) submission.myThis = action.payload.myThis;
      if (action.payload.history) submission.history = action.payload.history;
      if (action.payload.fetchEmailCampaigns)
        submission.fetchEmailCampaigns = action.payload.fetchEmailCampaigns;

      yield put(actions.setEmailCampaign(submission));
    }
  } catch (error) {
    console.log('Error in fetchCampaign: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchEmailCampaigns(action) {
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
        'values[Attachments]',
      ])
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'email-campaigns',
      search,
    });
    console.log('#### fetchCampaigns');
    yield put(actions.setEmailCampaigns(submissions));
  } catch (error) {
    console.log('Error in fetchCampaigns: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchNewSmsCampaign(action) {
  var campaign = {
    values: {},
  };
  yield put(actions.setNewSmsCampaign(campaign));
  if (action.payload.myThis) campaign.myThis = action.payload.myThis;
  if (action.payload.history) campaign.history = action.payload.history;
  if (action.payload.fetchSmsCampaigns)
    campaign.fetchSmsCampaigns = action.payload.fetchSmsCampaigns;
  if (action.payload.allSmsCampaigns)
    campaign.allSmsCampaigns = action.payload.allSmsCampaigns;
}

export function* createSmsCampaign(action) {
  try {
    action.payload.campaignItem.myThis = undefined;
    //action.payload.campaignItem.history=undefined;
    action.payload.campaignItem.fetchSmsCampaigns = undefined;

    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'sms-campaigns',
      values: action.payload.campaignItem.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });

    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Send');
    action.payload.sendSms({
      campaignItem: action.payload.campaignItem,
      phoneNumbers: action.payload.phoneNumbers,
      target: action.payload.target,
      createMemberActivities: action.payload.createMemberActivities,
      createLeadActivities: action.payload.createLeadActivities,
      fetchMembers: action.payload.fetchMembers,
    });
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

export function* updateSmsCampaign(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.campaignItem.values,
    });
    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Send');
    if (action.payload.fetchSmsCampaigns) action.payload.fetchSmsCampaigns();
    if (action.payload.fetchEmailCampaign)
      action.payload.fetchSmsCampaign({
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

export function* fetchSmsCampaign(action) {
  try {
    if (action.payload.setDummy) {
      var campaign = {
        values: {},
      };
      yield put(actions.setSmsCampaign(campaign));
    } else {
      const { submission } = yield call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      });

      if (action.payload.myThis) submission.myThis = action.payload.myThis;
      if (action.payload.history) submission.history = action.payload.history;
      if (action.payload.fetchSmsCampaigns)
        submission.fetchSmsCampaigns = action.payload.fetchSmsCampaigns;

      yield put(actions.setSmsCampaign(submission));
    }
  } catch (error) {
    console.log('Error in fetchCampaign: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchSmsCampaigns(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes([
        'details',
        'values[Recipients]',
        'values[From Number]',
        'values[SMS Content]',
        'values[Sent Date]',
      ])
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'sms-campaigns',
      search,
    });
    yield put(actions.setSmsCampaigns(submissions));
  } catch (error) {
    console.log('Error in fetchCampaigns: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchCampaigns() {
  yield takeEvery(types.FETCH_NEW_EMAIL_CAMPAIGN, fetchNewEmailCampaign);
  yield takeEvery(types.CREATE_EMAIL_CAMPAIGN, createEmailCampaign);
  yield takeEvery(types.FETCH_EMAIL_CAMPAIGN, fetchEmailCampaign);
  yield takeEvery(types.FETCH_EMAIL_CAMPAIGNS, fetchEmailCampaigns);
  yield takeEvery(types.UPDATE_EMAIL_CAMPAIGN, updateEmailCampaign);

  yield takeEvery(types.FETCH_NEW_SMS_CAMPAIGN, fetchNewSmsCampaign);
  yield takeEvery(types.CREATE_SMS_CAMPAIGN, createSmsCampaign);
  yield takeEvery(types.FETCH_SMS_CAMPAIGN, fetchSmsCampaign);
  yield takeEvery(types.FETCH_SMS_CAMPAIGNS, fetchSmsCampaigns);
  yield takeEvery(types.UPDATE_SMS_CAMPAIGN, updateSmsCampaign);
}

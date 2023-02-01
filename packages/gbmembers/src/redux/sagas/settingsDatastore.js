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

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'call-scripts',
      search,
    });
    yield put(actions.setCallScripts(submissions));
  } catch (error) {
    console.log('Error in fetchCallScripts: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchEmailTemplates(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'email-templates',
      search,
    });
    yield put(actions.setEmailTemplates(submissions));
  } catch (error) {
    console.log('Error in fetchEmailTemplates: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchEmailTemplate(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .eq('id', action.id)
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'email-templates',
      search,
    });
    yield put(actions.setEmailTemplate(submissions));
  } catch (error) {
    console.log('Error in fetchEmailTemplate: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchEmailTemplateByName(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', action.payload)
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'email-templates',
      search,
    });
    yield put(actions.setEmailTemplate(submissions));
  } catch (error) {
    console.log('Error in fetchEmailTemplate: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchSMSTemplates(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'sms-templates',
      search,
    });
    yield put(actions.setSMSTemplates(submissions));
  } catch (error) {
    console.log('Error in fetchSMSTemplates: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchJourneyEvent(action) {
  console.log('fetchJourneyEvent:' + action);
  const SUBMISSION_INCLUDES = 'details,values';
  const { submission, serverError } = yield call(CoreAPI.fetchSubmission, {
    id: action.payload.id,
    include: SUBMISSION_INCLUDES,
    datastore: true,
  });
  let journeyEvent = {
    submission: submission,
  };

  if (submission.values['Contact Type'] === 'Email') {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'email-templates',
      search,
    });
    if (submissions.length > 0) {
      journeyEvent['emailTemplate'] = submissions[0].values;
    } else {
      journeyEvent['emailTemplate'] = 'NOT_FOUND';
    }
  }

  if (submission.values['Contact Type'] === 'SMS') {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'sms-templates',
      search,
    });
    if (submissions.length > 0) {
      journeyEvent['smsTemplate'] = submissions[0].values;
    } else {
      journeyEvent['smsTemplate'] = 'NOT_FOUND';
    }
  }

  if (submission.values['Contact Type'] === 'Call') {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Target],values[Script Name]')
      .eq('values[Target]', submission.values['Record Type'] + 's')
      .eq('values[Script Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'call-scripts',
      search,
    });
    if (submissions.length > 0) {
      journeyEvent['callTemplate'] = submissions[0].values;
    } else {
      journeyEvent['callTemplate'] = 'NOT_FOUND';
    }
  }

  console.log(
    "submission.values['Record Type']:" + submission.values['Record Type'],
  );
  if (submission.values['Record Type'] === 'Member') {
    let idx = action.payload.members.findIndex(
      element => element['id'] === submission.values['Record ID'],
    );
    console.log('member idx:' + idx);
    journeyEvent['memberItem'] = action.payload.members[idx];
  }
  if (submission.values['Record Type'] === 'Lead') {
    let idx = action.payload.leads.findIndex(function(element) {
      console.log(element['id'] + '===' + submission.values['Record ID']);
      console.log(element['id'] === submission.values['Record ID']);
      return element['id'] === submission.values['Record ID'];
    });
    console.log('lead idx:' + idx);
    journeyEvent['leadItem'] = action.payload.leads[idx];
  }
  console.log(journeyEvent);
  yield put(
    serverError
      ? actions.setJourneyEventError(serverError)
      : actions.setJourneyEvent(journeyEvent),
  );
}
export function* createJourneyEvent(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Record ID],values[Trigger ID]')
      .eq('values[Record ID]', action.payload.values['Record ID'])
      .eq('values[Trigger ID]', action.payload.values['Trigger ID'])
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'journey-event',
      search,
    });
    if (submissions.length > 0) {
      const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
        id: submissions[0]['id'],
        datastore: true,
      });
    }
    const { submission } = yield call(CoreAPI.createSubmission, {
      formSlug: 'journey-event',
      values: action.payload.values,
      datastore: true,
    });
    console.log('create Journey Event');
  } catch (error) {
    console.log('Error in createJourneyEvent: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* updateJourneyEvent(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.values,
      datastore: true,
    });

    console.log('updateJourneyEvent');
  } catch (error) {
    console.log('Error in updateJourneyEvent: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* deleteJourneyEvent(action) {
  try {
    var values = { Status: 'Delete' };
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: values,
      datastore: true,
    });

    console.log('deleteJourneyEvent');
  } catch (error) {
    console.log('Error in deleteJourneyEvent: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* createTrialBooking(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      formSlug: 'trial-booking',
      values: action.payload.values,
      datastore: true,
    });
    console.log('create Trial Booking');
  } catch (error) {
    console.log('Error in createTrialBooking: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* deleteTrialBooking(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Lead ID],values[Trial Datetime]')
      .eq('values[Lead ID]', action.payload.values['Lead ID'])
      .eq('values[Trial Datetime]', action.payload.values['Trial Datetime'])
      .build();

    const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'trial-booking',
      search,
    });
    if (submissions.length > 0) {
      const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
        id: submissions[0]['id'],
        datastore: true,
      });
    }
    console.log('deleteTrialBooking');
  } catch (error) {
    console.log('Error in deleteTrialBooking: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* watchSettingsDatastore() {
  console.log('watchSettingsDatastore');
  yield takeEvery(types.FETCH_CALL_SCRIPTS, fetchCallScripts);
  yield takeEvery(types.FETCH_EMAIL_TEMPLATES, fetchEmailTemplates);
  yield takeEvery(types.FETCH_EMAIL_TEMPLATE, fetchEmailTemplate);
  yield takeEvery(types.FETCH_EMAIL_TEMPLATE_BYNAME, fetchEmailTemplateByName);
  yield takeEvery(types.FETCH_SMS_TEMPLATES, fetchSMSTemplates);
  yield takeEvery(types.FETCH_JOURNEY_EVENT, fetchJourneyEvent);
  yield takeEvery(types.CREATE_JOURNEY_EVENT, createJourneyEvent);
  yield takeEvery(types.UPDATE_JOURNEY_EVENT, updateJourneyEvent);
  yield takeEvery(types.DELETE_JOURNEY_EVENT, deleteJourneyEvent);
  yield takeEvery(types.CREATE_TRIAL_BOOKING, createTrialBooking);
  yield takeEvery(types.DELETE_TRIAL_BOOKING, deleteTrialBooking);
}

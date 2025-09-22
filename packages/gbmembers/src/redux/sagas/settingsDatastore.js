import { select, call, put, all, takeEvery } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  fetchSubmission,
  deleteSubmission,
  createSubmission,
  updateSubmission,
} from '@kineticdata/react';
import $ from 'jquery';

import { types, actions } from '../modules/settingsDatastore';
import axios from 'axios';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

export const getAppSettings = state => state.member.app;

const util = require('util');

export function* fetchCallScripts(action) {
  try {
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .eq('id', action.id)
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', action.payload)
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
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
  const { submission, serverError } = yield call(fetchSubmission, {
    id: action.payload.id,
    include: SUBMISSION_INCLUDES,
    datastore: true,
  });
  let journeyEvent = {
    submission: submission,
  };

  console.log(
    "submission.values['Record Type']:" + submission.values['Record Type'],
  );
  if (
    submission.values['Record Type'] === 'Member' &&
    submission.values['Contact Type'] === 'SMS'
  ) {
    let searchSMS = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [memberSubmissionSMS, submissionsSMS] = yield all([
      call(fetchSubmission, {
        id: submission.values['Record ID'],
        include: 'details,values[Notes History]',
      }),
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'sms-templates',
        search: searchSMS,
      }),
    ]);

    let idxSMS = action.payload.members.findIndex(
      element => element['id'] === submission.values['Record ID'],
    );
    console.log('member idxSMS:' + idxSMS);
    action.payload.members[idxSMS].values['Notes History'] =
      memberSubmissionSMS.submission.values['Notes History'] === undefined
        ? ''
        : memberSubmissionSMS.submission.values['Notes History'];
    journeyEvent['memberItem'] = action.payload.members[idxSMS];

    if (submissionsSMS.submissions.length > 0) {
      journeyEvent['smsTemplate'] = submissionsSMS.submissions[0].values;
    } else {
      journeyEvent['smsTemplate'] = 'NOT_FOUND';
    }
  }

  if (
    submission.values['Record Type'] === 'Member' &&
    submission.values['Contact Type'] === 'Email'
  ) {
    let searchEmail = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [memberSubmissionEmail, submissionsEmail] = yield all([
      call(fetchSubmission, {
        id: submission.values['Record ID'],
        include: 'details,values[Notes History]',
      }),
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'email-templates',
        search: searchEmail,
      }),
    ]);

    let idxEmail = action.payload.members.findIndex(
      element => element['id'] === submission.values['Record ID'],
    );
    console.log('member idxEmail:' + idxEmail);
    action.payload.members[idxEmail].values['Notes History'] =
      memberSubmissionEmail.submission.values['Notes History'] === undefined
        ? ''
        : memberSubmissionEmail.submission.values['Notes History'];
    journeyEvent['memberItem'] = action.payload.members[idxEmail];

    if (submissionsEmail.submissions.length > 0) {
      journeyEvent['emailTemplate'] = submissionsEmail.submissions[0].values;
    } else {
      journeyEvent['emailTemplate'] = 'NOT_FOUND';
    }
  }
  if (
    submission.values['Record Type'] === 'Member' &&
    submission.values['Contact Type'] === 'Call'
  ) {
    let searchCall = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Target],values[Script Name]')
      .eq('values[Target]', submission.values['Record Type'] + 's')
      .eq('values[Script Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [memberSubmissionCall, submissionsCall] = yield all([
      call(fetchSubmission, {
        id: submission.values['Record ID'],
        include: 'details,values[Notes History]',
      }),
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'call-scripts',
        search: searchCall,
      }),
    ]);

    let idxCall = action.payload.members.findIndex(
      element => element['id'] === submission.values['Record ID'],
    );
    console.log('member idxCall:' + idxCall);
    action.payload.members[idxCall].values['Notes History'] =
      memberSubmissionCall.submission.values['Notes History'] === undefined
        ? ''
        : memberSubmissionCall.submission.values['Notes History'];
    journeyEvent['memberItem'] = action.payload.members[idxCall];

    if (submissionsCall.submissions.length > 0) {
      journeyEvent['callTemplate'] = submissionsCall.submissions[0].values;
    } else {
      journeyEvent['callTemplate'] = 'NOT_FOUND';
    }
  }
  if (
    submission.values['Record Type'] === 'Lead' &&
    submission.values['Contact Type'] === 'Email'
  ) {
    let searchLeadEmail = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [submissionsLeadEmail] = yield all([
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'email-templates',
        search: searchLeadEmail,
      }),
    ]);
    if (submissionsLeadEmail.submissions.length > 0) {
      journeyEvent['emailTemplate'] =
        submissionsLeadEmail.submissions[0].values;
    } else {
      journeyEvent['emailTemplate'] = 'NOT_FOUND';
    }
  }

  if (
    submission.values['Record Type'] === 'Lead' &&
    submission.values['Contact Type'] === 'SMS'
  ) {
    let searchLeadSMS = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Template Name]')
      .eq('values[Template Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [submissionsLeadSMS] = yield all([
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'sms-templates',
        search: searchLeadSMS,
      }),
    ]);
    if (submissionsLeadSMS.submissions.length > 0) {
      journeyEvent['smsTemplate'] = submissionsLeadSMS.submissions[0].values;
    } else {
      journeyEvent['smsTemplate'] = 'NOT_FOUND';
    }
  }

  if (
    submission.values['Record Type'] === 'Lead' &&
    submission.values['Contact Type'] === 'Call'
  ) {
    let searchLeadCall = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Target],values[Script Name]')
      .eq('values[Target]', submission.values['Record Type'] + 's')
      .eq('values[Script Name]', submission.values['Template Name'])
      .limit(1000)
      .build();

    let [submissionsLeadCall] = yield all([
      call(searchSubmissions, {
        get: true,
        datastore: true,
        form: 'call-scripts',
        search: searchLeadCall,
      }),
    ]);
    if (submissionsLeadCall.submissions.length > 0) {
      journeyEvent['callTemplate'] = submissionsLeadCall.submissions[0].values;
    } else {
      journeyEvent['callTemplate'] = 'NOT_FOUND';
    }
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
    const search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Record ID],values[Trigger ID]')
      .eq('values[Record ID]', action.payload.values['Record ID'])
      .eq('values[Trigger ID]', action.payload.values['Trigger ID'])
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'journey-event',
      search,
    });
    if (submissions.length > 0) {
      const { errors, serverError } = yield call(deleteSubmission, {
        id: submissions[0]['id'],
        datastore: true,
      });
    }
    const { submission } = yield call(createSubmission, {
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
    const { submission } = yield call(updateSubmission, {
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
    const { submission } = yield call(updateSubmission, {
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
    const { submission } = yield call(createSubmission, {
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
    const search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Lead ID],values[Trial Datetime]')
      .eq('values[Lead ID]', action.payload.values['Lead ID'])
      .eq('values[Trial Datetime]', action.payload.values['Trial Datetime'])
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'trial-booking',
      search,
    });
    if (submissions.length > 0) {
      const { errors, serverError } = yield call(deleteSubmission, {
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
export function flushServicesCache(space, attributeName) {
  if (
    attributeName === 'Switch Trial Class Booking Order' ||
    attributeName === 'School Closed Dates' ||
    attributeName === 'School Start Date'
  ) {
    axios
      .get(
        'https://services.gbmembers.net/gbcalendar-3.0/flushCache.htm?space=' +
          space,
      )
      .then(result => {
        console.log('flushCache:' + result);
      })
      .catch(error => {
        console.log(error.response);
      });
  }
}

export function* updateSpaceAttribute(action) {
  try {
    const { submission, error, statusCode } = yield call(createSubmission, {
      formSlug: 'space-attribute-update',
      values: action.payload.values,
      datastore: true,
    });
    if (statusCode === undefined) {
      console.log('create record for space-attribute-update');
      yield put(
        errorActions.addSuccess(
          'Attribute value updated',
          action.payload.values['Attribute Name'] + ' updated',
        ),
      );
      flushServicesCache(
        action.payload.space.slug,
        action.payload.values['Attribute Name'],
      );
    } else {
      yield put(errorActions.addError('Attribute value updated', error));
    }
  } catch (error) {
    console.log('Error in updateSpaceAttribute: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchUpdateSpaceAttributes(action) {
  try {
    let search = new SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Attribute Name]')
      .in('values[Attribute Name]', action.payload.attributeNames)
      .limit(1000);
    if (
      action.payload.nextPageToken !== undefined &&
      action.payload.nextPageToken !== null
    ) {
      search = search.pageToken(action.payload.nextPageToken);
    }

    search = search.build();

    const { submissions, nextPageToken } = yield call(searchSubmissions, {
      datastore: true,
      form: 'space-attribute-update',
      search,
    });
    console.log(
      '#### fetchUpdateSpaceAttributes nextPageToken:' + nextPageToken,
    );
    yield put(
      actions.setUpdateSpaceAttributes({
        submissions,
        nextPageToken,
        initial: action.payload.nextPageToken === undefined ? true : false,
      }),
    );
  } catch (error) {
    console.log('Error in fetchCampaigns: ' + util.inspect(error));
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
  yield takeEvery(types.UPDATE_SPACE_ATTRIBUTE, updateSpaceAttribute);
  yield takeEvery(
    types.FETCH_UPDATE_SPACE_ATTRIBUTES,
    fetchUpdateSpaceAttributes,
  );
}

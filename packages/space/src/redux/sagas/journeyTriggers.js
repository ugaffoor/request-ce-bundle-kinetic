import { takeEvery, call, all, put, select } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import {
  actions as errorActions,
  NOTICE_TYPES,
} from 'gbmembers/src/redux/modules/errors';
import { types, actions } from '../modules/journeyTriggers';
const util = require('util');

export const JOURNEY_GROUPS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();

export const JOURNEY_TRIGGERS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();

export function* fetchJourneyEvents(action) {
  var search = undefined;
  if (
    action.payload.triggerID !== null &&
    action.payload.memberID === null &&
    action.payload.leadID === null
  ) {
    search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Trigger ID]', action.payload.triggerID)
      .index('values[Trigger ID]')
      .includes(['details', 'values'])
      .limit(50)
      .build();
  } else if (
    action.payload.triggerID !== null &&
    action.payload.memberID !== null &&
    action.payload.leadID === null
  ) {
    search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Record ID]', action.payload.memberID)
      .eq('values[Trigger ID]', action.payload.triggerID)
      .index('values[Record ID],values[Trigger ID]')
      .includes(['details', 'values'])
      .limit(50)
      .build();
  } else if (
    action.payload.triggerID !== null &&
    action.payload.memberID === null &&
    action.payload.leadID !== null
  ) {
    search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Record ID]', action.payload.leadID)
      .eq('values[Trigger ID]', action.payload.triggerID)
      .index('values[Record ID],values[Trigger ID]')
      .includes(['details', 'values'])
      .limit(50)
      .build();
  }
  const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
    form: 'journey-event',
    search: search,
    datastore: true,
  });

  if (serverError) {
    yield put(errorActions.addError(serverError));
  } else {
    yield put(
      actions.setJourneyEvents({
        events: submissions,
      }),
    );
  }
}

export function* fetchJourneyInfo() {
  const { groups, triggers } = yield all({
    groups: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'trigger-groups',
      search: JOURNEY_GROUPS_SEARCH,
    }),
    triggers: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'journey-triggers',
      search: JOURNEY_TRIGGERS_SEARCH,
    }),
  });

  var groupsSubmissions = groups.submissions;
  var triggerSubmissions = triggers.submissions;

  if (groups.serverError) {
    yield put(errorActions.addError(groups.serverError));
  } else if (triggers.serverError) {
    yield put(errorActions.addError(triggers.serverError));
  } else {
    yield put(
      actions.setJourneyInfo({
        groups: groupsSubmissions,
        triggers: triggerSubmissions,
      }),
    );
  }
}

export function* updateJourneyTrigger({ payload }) {
  try {
    const { submission, serverError } = yield call(CoreAPI.updateSubmission, {
      id: payload.id,
      values: payload.values,
      datastore: true,
      include: 'details,values',
    });

    if (serverError) {
      yield put(errorActions.addError(serverError));
    } else {
      payload.triggerUpdateCompleted(submission);
      yield put(
        errorActions.addSuccess(
          ['Journey Trigger updated successfully'],
          'Trigger Updated',
        ),
      );
    }
  } catch (error) {
    console.log('Error in updateJourneyTrigger: ' + util.inspect(error));
    yield put(errorActions.addError(error));
  }
}

export function* deleteTrigger(action) {
  try {
    console.log('deleteTrigger: ');
    const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    if (serverError) {
      yield put(errorActions.addError(serverError));
    } else {
      action.payload.completeTriggerDelete(action.payload.id);
    }

    yield put(
      errorActions.addSuccess(
        ['Journey Trigger deleted successfully'],
        'Delete Trigger',
      ),
    );
  } catch (error) {
    console.log('Error in deleteTrigger: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'Delete Trigger'));
  }
}

export function* watchJourneyTriggers() {
  yield takeEvery(types.FETCH_JOURNEY_INFO, fetchJourneyInfo);
  yield takeEvery(types.UPDATE_JOURNEY_TRIGGER, updateJourneyTrigger);
  yield takeEvery(types.DELETE_TRIGGER, deleteTrigger);
  yield takeEvery(types.FETCH_JOURNEY_EVENTS, fetchJourneyEvents);
}

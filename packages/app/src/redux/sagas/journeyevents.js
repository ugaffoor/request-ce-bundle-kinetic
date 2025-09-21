import { call, put, takeEvery, all } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  updateSubmission,
} from '@kineticdata/react';
import { actions, types } from '../modules/journeyevents';

const util = require('util');

// Alerts Search Query
export const JOURNEY_EVENTS_SEARCH = new SubmissionSearch(true)
  .eq('values[Status]', 'New')
  .include('details,values')
  .index('values[Status]')
  .limit(1000)
  .build();

export function* fetchJourneyEventsTask() {
  const { submissions, serverError } = yield call(searchSubmissions, {
    get: true,
    form: 'journey-event',
    search: JOURNEY_EVENTS_SEARCH,
    datastore: true,
  });

  yield put(
    serverError
      ? actions.setJourneyEventsError(serverError)
      : actions.setJourneyEvents(submissions),
  );
}
export function* deleteJourneyEvents(action) {
  try {
    var ids = action.payload.ids;

    for (var i = 0; i < ids.length; i++) {
      const [submission] = yield all([
        call(updateSubmission, {
          id: ids[i],
          values: { Status: 'Delete' },
          datastore: true,
        }),
      ]);
      action.payload.journeyevents.forEach(elem => {
        if (elem.id === ids[i]) {
          elem.values['Status'] = 'Deleted';
        }
      });
      yield put(
        actions.decrementDeletingJourneyEventsCount(ids.length - 1 - i),
      );
    }

    console.log('deleteJourneyEvents');
    yield put(actions.deleteJourneyEventsCompleted());
  } catch (error) {
    console.log('Error in deleteJourneyEvent: ' + util.inspect(error));
    yield put(actions.setJourneyEventsError(error));
  }
}

export function* watchJourneyEvents() {
  yield takeEvery(types.FETCH_JOURNEY_EVENTS, fetchJourneyEventsTask);
  yield takeEvery(types.DELETE_JOURNEY_EVENTS, deleteJourneyEvents);
}

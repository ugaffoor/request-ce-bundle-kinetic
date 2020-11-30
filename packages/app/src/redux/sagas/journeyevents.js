import { takeEvery, call, put } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { actions, types } from '../modules/journeyevents';

// Alerts Search Query
export const JOURNEY_EVENTS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'New')
  .include('details,values')
  .index('values[Status]')
  .limit(1000)
  .build();

export function* fetchJourneyEventsTask() {
  const { submissions, serverError } = yield call(CoreAPI.searchSubmissions, {
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

export function* watchJourneyEvents() {
  yield takeEvery(types.FETCH_JOURNEY_EVENTS, fetchJourneyEventsTask);
}

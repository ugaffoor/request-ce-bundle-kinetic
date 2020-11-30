import { all, fork } from 'redux-saga/effects';
import { watchJourneyEvents } from './sagas/journeyevents';
import { watchApp } from './sagas/app';

export function* sagas() {
  yield all([watchJourneyEvents(), watchApp()]);
}

export function combineSagas(allSagas) {
  return function* combinedSagas() {
    yield all(allSagas.map(s => fork(s)));
  };
}

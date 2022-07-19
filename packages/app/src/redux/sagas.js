import { all, fork } from 'redux-saga/effects';
import { watchJourneyEvents } from './sagas/journeyevents';
import { watchHelp } from './sagas/help';
import { watchApp } from './sagas/app';

export function* sagas() {
  yield all([watchJourneyEvents(), watchHelp(), watchApp()]);
}

export function combineSagas(allSagas) {
  return function* combinedSagas() {
    yield all(allSagas.map(s => fork(s)));
  };
}

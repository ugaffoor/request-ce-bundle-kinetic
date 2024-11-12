import { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';
import { actions, types, NOTICE_TYPES } from '../modules/errors';

export function* addNotificationTask(action) {
  window.console.log('DELAY', action);
  yield delay(3000);
  if (action.payload.type !== NOTICE_TYPES.ERROR) {
    yield put(actions.removeNotification(action.payload.id));
  }
  yield put(actions.addRecentNotification(action.payload));
}

export function* watchErrors() {
  yield takeEvery(types.ADD_NOTIFICATION, addNotificationTask);
}

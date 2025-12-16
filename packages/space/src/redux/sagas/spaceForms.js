import { takeEvery, call, put } from 'redux-saga/effects';
import { fetchForms } from '@kineticdata/react';

import { types, actions } from '../modules/spaceForms';

export function* fetchFormsSaga(action) {
  try {
    const { forms, serverError } = yield call(fetchForms, {
      kappSlug: action.payload,
      include: 'attributes,kapp',
    });

    if (serverError) {
      // TODO: implement system error push.
      yield put(actions.setForms([]));
    } else {
      yield put(actions.setForms(forms));
    }
  } catch (error) {
    console.log('Error in fetchFormsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchFormsSaga'));
  }
}

export function* watchForms() {
  yield takeEvery(types.FETCH_FORMS, fetchFormsSaga);
}

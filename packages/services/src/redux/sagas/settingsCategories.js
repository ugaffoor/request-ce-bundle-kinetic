import { call, put, takeEvery, select, all } from 'redux-saga/effects';
import { fetchCategories, bundle } from '@kineticdata/react';
import { toastActions } from 'common';
import axios from 'axios';
import { actions, types } from '../modules/settingsCategories';
import { Promise } from 'core-js';

export function* fetchCategoriesSaga(action) {
  const { serverError, categories } = yield call(fetchCategories, {
    kappSlug: action.payload,
    include: 'attributes',
  });

  if (serverError) {
    yield put(actions.setCategoriesErrors(serverError));
  } else {
    yield put(actions.setCategories(categories));
  }
}

export function* watchSettingsCategories() {
  yield takeEvery(types.FETCH_CATEGORIES, fetchCategoriesSaga);
}

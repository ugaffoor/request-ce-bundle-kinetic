import { takeEvery, call, all, put, select } from 'redux-saga/effects';
import {
  createSubmission,
  updateSubmission,
  deleteSubmission,
  SubmissionSearch,
  searchSubmissions,
} from '@kineticdata/react';

import {
  actions as errorActions,
  NOTICE_TYPES,
} from 'gbmembers/src/redux/modules/errors';
import { types, actions } from '../modules/priceIncreases';
const util = require('util');

export const PRICE_INCREASES_SEARCH = new SubmissionSearch(true)
  .include('details,values')
  .limit(1000)
  .build();
export const MEMBERSHIP_FEES_SEARCH = new SubmissionSearch(true)
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();
export const SUBMISSION_INCLUDES = 'details,values,attributes';

export function* fetchPriceIncreases() {
  try {
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'membership-fee-price-increase',
      search,
    });
    yield put(actions.setPriceIncreases(submissions));
  } catch (error) {
    console.log('Error in fetchPriceIncreases: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchAllMembershipFees() {
  try {
    const search = new SubmissionSearch()
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions, serverError } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: 'membership-fees',
      search,
    });
    yield put(actions.setMembershipFees(submissions));
  } catch (error) {
    console.log('Error in fetchAllMembershipFees: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* createPriceIncrease(action) {
  try {
    const { submission, error } = yield call(createSubmission, {
      datastore: true,
      formSlug: 'membership-fee-price-increase',
      values: action.payload.values,
      completed: true,
      include: SUBMISSION_INCLUDES,
    });

    if (error) {
      const msg = error.message || 'Failed to create Price Increase';
      if (action.payload.onError) action.payload.onError(msg);
    } else {
      yield put(
        errorActions.addSuccess(
          'Price Increase created successfully',
          'Price Increases',
        ),
      );
      yield put(actions.setNewPriceIncrease(submission));
      yield put(actions.fetchPriceIncreases());
      if (action.payload.onSuccess) action.payload.onSuccess();
    }
  } catch (error) {
    console.log('Error in createPriceIncrease: ' + util.inspect(error));
    const msg = error.message || 'Failed to create Price Increase';
    if (action.payload.onError) action.payload.onError(msg);
  }
}

export function* updatePriceIncrease(action) {
  try {
    yield call(updateSubmission, {
      datastore: true,
      id: action.payload.id,
      values: action.payload.values,
    });
    yield put(
      errorActions.addSuccess(
        'Price Increase updated successfully',
        'Price Increases',
      ),
    );
    yield put(actions.fetchPriceIncreases());
  } catch (error) {
    console.log('Error in updatePriceIncrease: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deletePriceIncrease(action) {
  try {
    yield call(deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });
    yield put(
      errorActions.addSuccess(
        'Price Increase deleted successfully',
        'Price Increases',
      ),
    );
    yield put(actions.fetchPriceIncreases());
  } catch (error) {
    console.log('Error in deletePriceIncrease: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchPriceIncreases() {
  yield takeEvery(types.FETCH_PRICE_INCREASES, fetchPriceIncreases);
  yield takeEvery(types.FETCH_MEMBERSHIP_FEES, fetchAllMembershipFees);
  yield takeEvery(types.CREATE_PRICE_INCREASE, createPriceIncrease);
  yield takeEvery(types.UPDATE_PRICE_INCREASE, updatePriceIncrease);
  yield takeEvery(types.DELETE_PRICE_INCREASE, deletePriceIncrease);
}

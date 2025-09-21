import { delay } from 'redux-saga';
import {
  call,
  put,
  cancel,
  take,
  fork,
  takeEvery,
  select,
} from 'redux-saga/effects';
import {
  fetchSubmission,
  createSubmission,
  deleteSubmission,
} from '@kineticdata/react';
import { Map, Seq } from 'immutable';
import { push } from 'connected-react-router';

import { actions, types } from '../modules/registration';
import { actions as systemErrorActions } from '../modules/systemError';

export function* fetchRegistrationSaga(action) {
  const include =
    'details,values,form,form.attributes,form.kapp.attributes,' +
    'form.kapp.space.attributes,activities,activities.details';
  const { submission, errors, serverError } = yield call(fetchSubmission, {
    id: action.payload,
    include,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.setRegistrationErrors(errors));
  } else {
    yield put(actions.setRegistration(submission));
  }
}

export function* cloneRegistrationSaga(action) {
  const include = 'details,values,form,form.fields.details,form.kapp';
  const kappSlug = yield select(state => state.app.config.kappSlug);
  const { submission, errors, serverError } = yield call(fetchSubmission, {
    id: action.payload,
    include,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.cloneRegistrationErrors(errors));
  } else {
    // The values of attachment fields cannot be cloned so we will filter them out
    // of the values POSTed to the new submission.
    const attachmentFields = Seq(submission.form.fields)
      .filter(field => field.dataType === 'file')
      .map(field => field.name)
      .toSet();

    // Some values on the original submission should be reset.
    const overrideFields = Map({
      Status: 'Draft',
      'Discussion Id': null,
      Observers: [],
    });

    // Copy the values from the original submission with the transformations
    // described above.
    const values = Seq(submission.values)
      .filter((value, fieldName) => !attachmentFields.contains(fieldName))
      .map((value, fieldName) => overrideFields.get(fieldName) || value)
      .toJS();

    // Make the call to create the clone.
    const {
      submission: cloneRegistration,
      postErrors,
      postServerError,
    } = yield call(createSubmission, {
      kappSlug: submission.form.kapp.slug,
      formSlug: submission.form.slug,
      values,
      completed: false,
    });

    if (postServerError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (postErrors) {
      yield put(actions.cloneRegistrationErrors(postErrors));
    } else {
      yield put(actions.cloneRegistrationSuccess());
      yield put(
        push(
          `/kapps/${kappSlug}/requests/Draft/request/${cloneRegistration.id}`,
        ),
      );
    }
  }
}

export function* deleteRegistrationSaga(action) {
  const { errors, serverError } = yield call(deleteSubmission, {
    id: action.payload.id,
  });

  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else if (errors) {
    yield put(actions.deleteRegistrationErrors(errors));
  } else {
    yield put(actions.deleteRegistrationSuccess());
    if (typeof action.payload.callback === 'function') {
      action.payload.callback();
    }
  }
}

export function* pollerTask(id) {
  const include =
    'details,values,form,form.attributes,form.kapp.attributes,' +
    'form.kapp.space.attributes,activities,activities.details';
  let pollDelay = 5000;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // Wait
    yield delay(pollDelay);
    // Query
    const { submission, serverError } = yield call(fetchSubmission, {
      id,
      include,
    });
    // If there is a server error dispatch the appropriate action and break out
    // of the while loop to stop polling.
    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
      yield put(actions.stopRegistrationPoller());
      break;
    } else {
      yield put(actions.setRegistration(submission));
      pollDelay = Math.min(pollDelay + 5000, 30000);
    }
  }
}

export function* watchRegistrationPoller() {
  let action;
  // eslint-disable-next-line no-cond-assign
  while ((action = yield take(types.START_REGISTRATION_POLLER))) {
    // start the poller in the background
    const poller = yield fork(pollerTask, action.payload);
    // wait for the message to stop the poller
    yield take(types.STOP_REGISTRATION_POLLER);
    // stop the poller by cancelling the background task
    yield cancel(poller);
  }
}

export function* watchRegistration() {
  yield takeEvery(types.FETCH_REGISTRATION, fetchRegistrationSaga);
  yield takeEvery(types.CLONE_REGISTRATION, cloneRegistrationSaga);
  yield takeEvery(types.DELETE_REGISTRATION, deleteRegistrationSaga);
}

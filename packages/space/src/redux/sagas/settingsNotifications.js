import { call, put, takeEvery } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  fetchSubmission,
  createSubmission,
  fetchForms,
  deleteSubmission,
  updateSubmission,
} from '@kineticdata/react';
import { Seq, Map } from 'immutable';
import { push } from 'connected-react-router';

import { actions as systemErrorActions } from '../modules/errors';
import {
  actions,
  types,
  NOTIFICATIONS_FORM_SLUG,
  NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
} from '../modules/settingsNotifications';

export function* fetchNotificationsSaga() {
  try {
    const query = new SubmissionSearch(true);
    query.include('details,values');
    query.limit('1000');
    query.index('createdAt');

    const { submissions, errors, serverError } = yield call(searchSubmissions, {
      search: query.build(),
      datastore: true,
      form: NOTIFICATIONS_FORM_SLUG,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setFetchNotificationsError(errors));
    } else {
      yield put(
        actions.setNotifications({
          templates: submissions.filter(sub => sub.values.Type === 'Template'),
          snippets: submissions.filter(sub => sub.values.Type === 'Snippet'),
        }),
      );
    }
  } catch (error) {
    console.log('Error in fetchNotificationsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchNotificationsSaga'));
  }
}

export function* fetchNotificationSaga(action) {
  try {
    const include = 'details,values';
    if (action.payload === 'new') {
      yield put(actions.setNotification(null));
    } else {
      const { submission, serverError } = yield call(fetchSubmission, {
        id: action.payload,
        include,
        datastore: true,
      });

      if (serverError) {
        yield put(systemErrorActions.setSystemError(serverError));
      } else {
        yield put(actions.setNotification(submission));
      }
    }
  } catch (error) {
    console.log('Error in fetchNotificationSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchNotificationSaga'));
  }
}

export function* cloneNotificationSaga(action) {
  try {
    const include = 'details,values,form,form.fields.details';
    const { submission, errors, serverError } = yield call(fetchSubmission, {
      id: action.payload,
      include,
      datastore: true,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setCloneError(errors));
    } else {
      // The values of attachment fields cannot be cloned so we will filter them out
      // of the values POSTed to the new submission.
      const attachmentFields = Seq(submission.form.fields)
        .filter(field => field.dataType === 'file')
        .map(field => field.name)
        .toSet();

      // Some values on the original submission should be reset.
      const overrideFields = Map({
        Status: 'Inactive',
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
        submission: cloneSubmission,
        postErrors,
        postServerError,
      } = yield call(createSubmission, {
        datastore: true,
        formSlug: submission.form.slug,
        values,
        completed: false,
      });

      if (postServerError) {
        yield put(systemErrorActions.setSystemError(serverError));
      } else if (postErrors) {
        yield put(actions.setCloneError(postErrors));
      } else {
        // Determine the type route parameter for the redirect below based on
        // either the form slug or the value of the 'Type' field.
        const type =
          submission.form.slug === NOTIFICATIONS_DATE_FORMAT_FORM_SLUG
            ? 'date-formats'
            : submission.values.Type === 'Template'
              ? 'templates'
              : 'snippets';
        yield put(actions.setCloneSuccess());
        yield put(actions.fetchNotifications());
        yield put(
          push(`/settings/notifications/${type}/${cloneSubmission.id}`),
        );
      }
    }
  } catch (error) {
    console.log('Error in cloneNotificationSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'cloneNotificationSaga'));
  }
}

export function* deleteNotificationSaga(action) {
  try {
    const { errors, serverError } = yield call(deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setDeleteError(errors));
    } else {
      yield put(actions.setDeleteSuccess());
      if (typeof action.payload.callback === 'function') {
        action.payload.callback();
      }
    }
  } catch (error) {
    console.log('Error in deleteNotificationSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'deleteNotificationSaga'));
  }
}

export function* saveNotificationSaga(action) {
  try {
    const datastore = true;
    const completed = true;
    const formSlug = NOTIFICATIONS_FORM_SLUG;
    const {
      payload: { id, values, callback },
    } = action;

    const { errors, error, serverError, submission } = yield id
      ? call(updateSubmission, { datastore, id, values })
      : call(createSubmission, {
          datastore,
          completed,
          formSlug,
          values,
        });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors || error) {
      yield put(actions.setSaveError(errors || error));
    } else {
      yield put(actions.setSaveSuccess());
      if (typeof callback === 'function') {
        callback(submission);
      }
    }
  } catch (error) {
    console.log('Error in saveNotificationSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'saveNotificationSaga'));
  }
}

export function* fetchVariablesSaga(action) {
  try {
    if (action.payload.kappSlug) {
      // When Datastore is selected, we're passing the string 'app/datastore' as the kapp-slug
      const isDatastore = action.payload.kappSlug === 'app/datastore';
      const { forms, errors, serverError } = yield call(fetchForms, {
        include: 'attributes,fields',
        datastore: isDatastore,
        ...(!isDatastore && { kappSlug: action.payload.kappSlug }),
      });

      if (serverError) {
        yield put(systemErrorActions.setSystemError(serverError));
      } else if (errors) {
        yield put(actions.setVariablesError(errors));
      } else {
        yield put(actions.setVariables({ forms }));
      }
    }
  } catch (error) {
    console.log('Error in fetchVariablesSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchVariablesSaga'));
  }
}

export function* fetchDateFormatsSaga(action) {
  try {
    const { submissions } = yield call(searchSubmissions, {
      get: true,
      datastore: true,
      form: NOTIFICATIONS_DATE_FORMAT_FORM_SLUG,
      search: new SubmissionSearch(true).includes(['values']).build(),
    });

    yield put(
      submissions
        ? actions.setDateFormats(submissions)
        : actions.setSystemError(
            'Failed to fetch notification template date formats',
          ),
    );
  } catch (error) {
    console.log('Error in fetchDateFormatsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchDateFormatsSaga'));
  }
}

export function* watchSettingsNotifications() {
  yield takeEvery(types.FETCH_VARIABLES, fetchVariablesSaga);
  yield takeEvery(types.FETCH_DATE_FORMATS, fetchDateFormatsSaga);
  yield takeEvery(types.FETCH_NOTIFICATIONS, fetchNotificationsSaga);
  yield takeEvery(types.FETCH_NOTIFICATION, fetchNotificationSaga);
  yield takeEvery(types.CLONE_NOTIFICATION, cloneNotificationSaga);
  yield takeEvery(types.DELETE_NOTIFICATION, deleteNotificationSaga);
  yield takeEvery(types.SAVE_NOTIFICATION, saveNotificationSaga);
}

import { call, put, select, takeEvery } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  fetchSubmission,
  deleteSubmission,
} from '@kineticdata/react';

import { actions as systemErrorActions } from '../modules/errors';
import {
  actions,
  types,
  ROBOT_FORM_SLUG,
  ROBOT_EXECUTIONS_FORM_SLUG,
  ROBOT_EXECUTIONS_PAGE_SIZE,
} from '../modules/settingsRobots';

export function* fetchRobotsSaga(action) {
  try {
    const query = new SubmissionSearch(true);
    query.include('details,values');
    query.limit('1000');

    const { submissions, errors, serverError } = yield call(searchSubmissions, {
      search: query.build(),
      datastore: true,
      form: ROBOT_FORM_SLUG,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setFetchRobotsError(errors));
    } else {
      yield put(actions.setRobots(submissions));
    }
  } catch (error) {
    console.log('Error in fetchRobotsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchRobotsSaga'));
  }
}

export function* fetchRobotSaga(action) {
  try {
    const include = 'details,values';
    const { submission, errors, serverError } = yield call(fetchSubmission, {
      id: action.payload,
      include,
      datastore: true,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setRobotError(errors));
    } else {
      yield put(actions.setRobot(submission));
    }
  } catch (error) {
    console.log('Error in fetchRobotSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchRobotSaga'));
  }
}

export function* deleteRobotSaga(action) {
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
    console.log('Error in deleteRobotSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'deleteRobotSaga'));
  }
}

export function* fetchRobotExecutionsSaga({ payload: { scheduleId } }) {
  try {
    const pageToken = yield select(
      state => state.space.settingsRobots.robotExecutionsCurrentPageToken,
    );
    const query = new SubmissionSearch(true);
    if (pageToken) {
      query.pageToken(pageToken);
    }
    query.include('details,values');
    query.limit(ROBOT_EXECUTIONS_PAGE_SIZE);
    query.sortDirection('DESC');
    query.eq('values[Robot ID]', scheduleId);
    query.index('values[Robot ID],values[Start]');

    const { submissions, nextPageToken, errors, serverError } = yield call(
      searchSubmissions,
      {
        search: query.build(),
        datastore: true,
        form: ROBOT_EXECUTIONS_FORM_SLUG,
      },
    );

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setFetchRobotExecutionsError(errors));
    } else {
      yield put(actions.setRobotExecutions({ submissions, nextPageToken }));
    }
  } catch (error) {
    console.log('Error in fetchRobotExecutionsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchRobotExecutionsSaga'));
  }
}

export function* fetchRobotExecutionSaga(action) {
  try {
    const include = 'details,values';
    const { submission, errors, serverError } = yield call(fetchSubmission, {
      id: action.payload,
      include,
      datastore: true,
    });

    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else if (errors) {
      yield put(actions.setRobotExecutionError(errors));
    } else {
      yield put(actions.setRobotExecution(submission));
    }
  } catch (error) {
    console.log('Error in fetchRobotExecutionSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchRobotExecutionSaga'));
  }
}

export function* fetchNextExecutionsSaga(action) {
  try {
    const query = new SubmissionSearch(true);

    query.include('details,values');
    query.limit('1000');

    const { submissions, errors, serverError } = yield call(searchSubmissions, {
      search: query.build(),
      datastore: true,
      form: 'robot-next-execution',
    });

    if (serverError) {
    } else if (errors) {
    } else {
      yield put(actions.setNextExecutions(submissions));
    }
  } catch (error) {
    console.log('Error in fetchNextExecutionsSaga: ' + util.inspect(error));
    yield put(errorActions.addError([error], 'fetchNextExecutionsSaga'));
  }
}

export function* watchSettingsRobots() {
  yield takeEvery(types.FETCH_ROBOTS, fetchRobotsSaga);
  yield takeEvery(types.FETCH_ROBOT, fetchRobotSaga);
  yield takeEvery(types.DELETE_ROBOT, deleteRobotSaga);
  yield takeEvery(
    [
      types.FETCH_ROBOT_EXECUTIONS,
      types.FETCH_ROBOT_EXECUTIONS_NEXT_PAGE,
      types.FETCH_ROBOT_EXECUTIONS_PREVIOUS_PAGE,
    ],
    fetchRobotExecutionsSaga,
  );
  yield takeEvery(types.FETCH_ROBOT_EXECUTION, fetchRobotExecutionSaga);
  yield takeEvery(types.FETCH_NEXT_EXECUTIONS, fetchNextExecutionsSaga);
}

import { List } from 'immutable';
import { call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/classes';
import moment from 'moment';
import { actions as errorActions } from '../modules/errors';
import { OrderedMap } from 'immutable';

export const SUBMISSION_INCLUDES = 'details,values';
const util = require('util');

function convertCalenarDate(dateVal) {
  var dayOfWeek = dateVal.split('-')[0];
  var hour = dateVal.split('-')[1].split(':')[0];
  var minute = dateVal.split('-')[1].split(':')[1];

  var dt = moment()
    .day(dayOfWeek)
    .hour(hour)
    .minute(minute)
    .second(0)
    .toDate();
  return dt;
}

export function* fetchClassSchedules(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'class-schedule',
      datastore: true,
      search,
    });
    var classSchedulesMap = OrderedMap();
    var classSchedulesSubmissions = submissions;

    for (var i = 0; i < classSchedulesSubmissions.length; i++) {
      classSchedulesMap = classSchedulesMap.set(
        classSchedulesSubmissions[i].values['id'],
        {
          classID: classSchedulesSubmissions[i].id,
          id: classSchedulesSubmissions[i].values['id'],
          start: convertCalenarDate(
            classSchedulesSubmissions[i].values['Start'],
          ),
          end: convertCalenarDate(classSchedulesSubmissions[i].values['End']),
          title: classSchedulesSubmissions[i].values['Title'],
          program: classSchedulesSubmissions[i].values['Program'],
          maxStudents: classSchedulesSubmissions[i].values['Max Students'],
        },
      );
    }
    var classSchedules = classSchedulesMap.toList();

    yield put(actions.setClassSchedules(classSchedules));
  } catch (error) {
    console.log('Error in fetchClassSchedules: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* newClass(action) {
  try {
    console.log('new Class entry');
    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'class-schedule',
      values: action.payload.values,
      completed: true,
      include: SUBMISSION_INCLUDES,
    });
    console.log('submission:' + submission);
  } catch (error) {
    console.log('Error in createClass: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* editClass(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      datastore: true,
      id: action.payload.id,
      values: action.payload.values,
    });

    console.log('submission:' + submission);
  } catch (error) {
    console.log('Error in editClass: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteClass(action) {
  try {
    console.log('deleteClass: ');
    const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    console.log('deleteClass');
  } catch (error) {
    console.log('Error in deleteClass: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* watchClasses() {
  yield takeEvery(types.FETCH_CLASS_SCHEDULES, fetchClassSchedules);
  yield takeEvery(types.NEW_CLASS, newClass);
  yield takeEvery(types.EDIT_CLASS, editClass);
  yield takeEvery(types.DELETE_CLASS, deleteClass);
}

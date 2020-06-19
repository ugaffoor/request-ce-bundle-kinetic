import { List } from 'immutable';
import { call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/classes';
import moment from 'moment';
import { actions as errorActions } from '../modules/errors';
import { OrderedMap } from 'immutable';

export const SUBMISSION_INCLUDES = 'details,values';
const util = require('util');

function convertCalendarDate(dateVal) {
  var dayOfWeek = dateVal.split('-')[0];
  var hour = dateVal.split('-')[1].split(':')[0];
  var minute = dateVal.split('-')[1].split(':')[1];

  var dt = moment()
    .day(dayOfWeek === '0' ? '7' : dayOfWeek)
    .hour(hour)
    .minute(minute)
    .second(0);
  if (moment().day() === 7 && dt.day() !== 0) {
    dt.add(-7, 'days');
  }
  return dt.toDate();
}

export function* fetchClassSchedules(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
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
          start: convertCalendarDate(
            classSchedulesSubmissions[i].values['Start'],
          ),
          end: convertCalendarDate(classSchedulesSubmissions[i].values['End']),
          title: classSchedulesSubmissions[i].values['Title'],
          program: classSchedulesSubmissions[i].values['Program'],
          maxStudents: classSchedulesSubmissions[i].values['Max Students'],
          colour: classSchedulesSubmissions[i].values['Colour'],
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

export function* fetchClassBookings(action) {
  try {
    var allMembers = action.payload.allMembers;
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index(
        'values[Class Date],values[Class Time],values[Program],values[Status]',
      )
      .eq('values[Class Date]', action.payload.classDate)
      .eq('values[Class Time]', action.payload.classTime)
      .eq('values[Program]', action.payload.program)
      .eq('values[Status]', action.payload.status)
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'class-booking',
      datastore: true,
      search,
    });
    var classBookingsMap = OrderedMap();
    var classBookingsSubmissions = submissions;
    for (var i = 0; i < classBookingsSubmissions.length; i++) {
      classBookingsMap = classBookingsMap.set(classBookingsSubmissions[i].id, {
        id: classBookingsSubmissions[i].id,
        status: classBookingsSubmissions[i].values['Status'],
        program: classBookingsSubmissions[i].values['Program'],
        classDate: classBookingsSubmissions[i].values['Class Date'],
        classTime: classBookingsSubmissions[i].values['Class Time'],
        memberID: classBookingsSubmissions[i].values['Member ID'],
        memberGUID: classBookingsSubmissions[i].values['Member GUID'],
        memberName: classBookingsSubmissions[i].values['Member Name'],
      });
    }
    var classBookings = classBookingsMap.toList();

    yield put(
      actions.setClassBookings({
        classBookings: classBookings,
        allMembers: allMembers,
      }),
    );
  } catch (error) {
    console.log('Error in fetchClassBookings: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchCurrentClassBookings(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .index('values[Class Date]')
      .gteq('values[Class Date]', moment().format('YYYY-MM-DD'))
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'class-booking',
      datastore: true,
      search,
    });
    var classBookingsMap = OrderedMap();
    var classBookingsSubmissions = submissions;
    for (var i = 0; i < classBookingsSubmissions.length; i++) {
      if (
        classBookingsSubmissions[i].values['Status'] === 'Booked' ||
        classBookingsSubmissions[i].values['Status'] === 'Cancelled'
      ) {
        classBookingsMap = classBookingsMap.set(
          classBookingsSubmissions[i].id,
          {
            id: classBookingsSubmissions[i].id,
            status: classBookingsSubmissions[i].values['Status'],
            program: classBookingsSubmissions[i].values['Program'],
            classDate: classBookingsSubmissions[i].values['Class Date'],
            classTime: classBookingsSubmissions[i].values['Class Time'],
            memberID: classBookingsSubmissions[i].values['Member ID'],
            memberGUID: classBookingsSubmissions[i].values['Member GUID'],
            memberName: classBookingsSubmissions[i].values['Member Name'],
          },
        );
      }
    }
    var currentClassBookings = classBookingsMap.toList();

    yield put(
      actions.setCurrentClassBookings({
        currentClassBookings: currentClassBookings,
      }),
    );
  } catch (error) {
    console.log('Error in fetchClassBookings: ' + util.inspect(error));
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
export function* updateBooking(action) {
  try {
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.values,
      datastore: true,
    });

    console.log('updateBooking');
  } catch (error) {
    console.log('Error in updateBooking: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* addBooking(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'class-booking',
      values: action.payload.values,
      completed: true,
    });

    console.log('addBooking');
    yield put(
      actions.setAddedBooking({
        id: submission.id,
        status: action.payload.values['Status'],
        program: action.payload.values['Program'],
        classDate: action.payload.values['Class Date'],
        classTime: action.payload.values['Class Time'],
        name: action.payload.values['Member Name'],
        memberGUID: action.payload.values['Member GUID'],
      }),
    );
  } catch (error) {
    console.log('Error in addBooking: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* deleteBooking(action) {
  try {
    console.log('deleteBooking: ');
    const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    console.log('deleteBooking');
  } catch (error) {
    console.log('Error in deleteBooking: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* watchClasses() {
  yield takeEvery(
    types.FETCH_CURRENT_CLASS_BOOKINGS,
    fetchCurrentClassBookings,
  );
  yield takeEvery(types.FETCH_CLASS_BOOKINGS, fetchClassBookings);
  yield takeEvery(types.FETCH_CLASS_SCHEDULES, fetchClassSchedules);
  yield takeEvery(types.NEW_CLASS, newClass);
  yield takeEvery(types.EDIT_CLASS, editClass);
  yield takeEvery(types.DELETE_CLASS, deleteClass);
  yield takeEvery(types.UPDATE_BOOKING, updateBooking);
  yield takeEvery(types.ADD_BOOKING, addBooking);
  yield takeEvery(types.DELETE_BOOKING, deleteBooking);
}

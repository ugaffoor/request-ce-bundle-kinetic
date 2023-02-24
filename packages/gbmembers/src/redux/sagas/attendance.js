import { List } from 'immutable';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/attendance';
import moment from 'moment';
import { actions as errorActions } from '../modules/errors';
import { setMemberPromotionValues } from '../../components/Member/MemberUtils';

export const SUBMISSION_INCLUDES = 'details,values';
export const getMembersApp = state => state.member.members;
export const getApp = state => state.member.app;
const util = require('util');

function excludeFromAttendanceCount(additionalPrograms, className) {
  // Determine if program should exclude from Member Attendance
  var program = additionalPrograms.find(element => {
    return element['program'] === className;
  });
  return program !== undefined &&
    program['program'] === className &&
    program['exludeFromGrading'] !== undefined &&
    program['exludeFromGrading'] !== null &&
    program['exludeFromGrading'].indexOf('Exclude from Grading') !== -1
    ? true
    : false;
}

export function* fetchAttendancesByDate(action) {
  try {
    let dtFrom = moment(action.payload.fromDate);
    let dtTo = moment(action.payload.toDate);
    let allSubmissions = [];

    const search = new CoreAPI.SubmissionSearch(true)
      .gteq('values[Class Date]', dtFrom.format('YYYY-MM-DD'))
      .lteq('values[Class Date]', dtTo.format('YYYY-MM-DD'))
      .index('values[Class Date]')
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    var { submissions, nextPageToken } = yield call(CoreAPI.searchSubmissions, {
      form: 'member-attendance',
      datastore: true,
      search,
    });
    allSubmissions = allSubmissions.concat(submissions);

    while (nextPageToken) {
      var search2 = new CoreAPI.SubmissionSearch(true)
        .gteq('values[Class Date]', dtFrom.format('YYYY-MM-DD'))
        .lteq('values[Class Date]', dtTo.format('YYYY-MM-DD'))
        .index('values[Class Date]')
        .includes(['details', 'values'])
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var [submissions2] = yield all([
        call(CoreAPI.searchSubmissions, {
          form: 'member-attendance',
          datastore: true,
          search: search2,
        }),
      ]);

      allSubmissions = allSubmissions.concat(submissions2.submissions);

      if (submissions2.nextPageToken !== null) {
        nextPageToken = submissions2.nextPageToken;
      } else {
        nextPageToken = undefined;
      }
    }

    yield put(actions.setAttendancesByDate(allSubmissions));
  } catch (error) {
    console.log('Error in fetchClassAttendances: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchClassAttendances(action) {
  try {
    let dt = moment(action.payload.classDate);

    const search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Class Date]', dt.format('YYYY-MM-DD'))
      .index('values[Class Date]')
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member-attendance',
      datastore: true,
      search,
    });
    const membersApp = yield select(getMembersApp);
    const app = yield select(getApp);
    submissions.forEach(attendance => {
      let memberItem = undefined;
      for (let i = 0; i < membersApp.allMembers.length; i++) {
        if (membersApp.allMembers[i].id === attendance.values['Member GUID']) {
          memberItem = membersApp.allMembers[i];
          setMemberPromotionValues(memberItem, app.belts);
          break;
        }
      }
      attendance.values['Photo'] = memberItem.values['Photo'];
      attendance.values['First Name'] = memberItem.values['First Name'];
      attendance.values['Last Name'] = memberItem.values['Last Name'];

      attendance.programOrder = memberItem.programOrder;
      attendance.promotionSort = memberItem.promotionSort;
      attendance.statusText = memberItem.statusText;
      attendance.attendClasses = memberItem.attendClasses;
      attendance.durationPeriod = memberItem.durationPeriod;
      attendance.attendanceVal = memberItem.attendanceVal;
      attendance.daysElapsed = memberItem.daysElapsed;
      attendance.daysVal = memberItem.daysVal;
      attendance.attendancePerc = memberItem.attendancePerc;
      attendance.statusIndicator = memberItem.statusIndicator;
    });

    yield put(actions.setClassAttendances(submissions));
  } catch (error) {
    console.log('Error in fetchClassAttendances: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchMemberAttendances(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member GUID]', action.payload.id)
      .gteq('values[Class Date]', action.payload.fromDate)
      .lteq('values[Class Date]', action.payload.toDate)
      .index('values[Member GUID],values[Class Date]')
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member-attendance',
      datastore: true,
      search,
    });

    yield put(actions.setMemberAttendances(submissions));
  } catch (error) {
    console.log('Error in fetchMemberAttendances: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* createAttendance(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'member-attendance',
      values: action.payload.values,
      completed: true,
      include: SUBMISSION_INCLUDES,
    });
    action.payload.attendance['id'] = submission.id;
    let memberItem = undefined;
    for (let i = 0; i < action.payload.allMembers.length; i++) {
      if (
        action.payload.allMembers[i].id === submission.values['Member GUID']
      ) {
        memberItem = action.payload.allMembers[i];
        break;
      }
    }
    const app = yield select(getApp);
    setMemberPromotionValues(memberItem, app.belts);

    submission.values['Photo'] = memberItem.values['Photo'];
    submission.values['First Name'] = memberItem.values['First Name'];
    submission.values['Last Name'] = memberItem.values['Last Name'];

    submission.programOrder = memberItem.programOrder;
    submission.promotionSort = memberItem.promotionSort;
    submission.statusText = memberItem.statusText;
    submission.attendClasses = memberItem.attendClasses;
    submission.durationPeriod = memberItem.durationPeriod;
    submission.attendanceVal = memberItem.attendanceVal;
    submission.daysElapsed = memberItem.daysElapsed;
    submission.daysVal = memberItem.daysVal;
    submission.attendancePerc = memberItem.attendancePerc;
    submission.statusIndicator = memberItem.statusIndicator;

    // Only Increment attendanceCount if the first classs of the day
    let checkin = action.payload.classAttendances.find(
      checkin =>
        checkin.values['Member GUID'] === submission.values['Member GUID'] &&
        moment(checkin.values['Class Date']).format('MM/DD/YYYY') ===
          moment(action.payload.classDate).format('MM/DD/YYYY') &&
        !excludeFromAttendanceCount(
          action.payload.additionalPrograms,
          checkin.values['Class'],
        ),
    );
    if (
      checkin === undefined &&
      !excludeFromAttendanceCount(
        action.payload.additionalPrograms,
        action.payload.values['Class'],
      )
    ) {
      let attendanceCount =
        memberItem.values['Attendance Count'] !== undefined
          ? parseFloat(
              parseFloat(memberItem.values['Attendance Count']).toFixed(2),
            )
          : 0;
      attendanceCount += 1;
      memberItem.values['Attendance Count'] = attendanceCount;
      memberItem.values['Last Attendance Date'] = moment().format('YYYY-MM-DD');

      var values = {};
      values['Attendance Count'] = attendanceCount;
      values['Last Attendance Date'] = moment().format('YYYY-MM-DD');
      action.payload.updateMember({
        id: memberItem['id'],
        memberItem: memberItem,
        values: values,
        myThis: action.payload.myThis,
      });
    }
    var values = [];
    values['Member GUID'] = memberItem.id;

    action.payload.classAttendances[
      action.payload.classAttendances.length
    ] = submission;
    yield put(
      actions.setAddAttendance({
        id: submission.id,
        values: values,
        name:
          memberItem.values['First Name'] +
          ' ' +
          memberItem.values['Last Name'],
        class: action.payload.values['Class'],
      }),
    );
    yield put(actions.setClassAttendances(action.payload.classAttendances));
  } catch (error) {
    console.log('Error in createAttendance: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteAttendance(action) {
  try {
    console.log('deleteAttendance: ');
    const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.attendance.id,
      datastore: true,
    });

    let attendances = [];
    if (action.payload.classAttendances !== undefined) {
      for (let i = 0; i < action.payload.classAttendances.length; i++) {
        if (
          action.payload.classAttendances[i].id !== action.payload.attendance.id
        ) {
          attendances[attendances.length] = action.payload.classAttendances[i];
        }
      }
      let memberItem = undefined;
      for (let i = 0; i < action.payload.allMembers.length; i++) {
        if (
          action.payload.allMembers[i].id ===
          action.payload.attendance.values['Member GUID']
        ) {
          memberItem = action.payload.allMembers[i];
          break;
        }
      }

      // Only Decrement attendanceCount if no classes for the day
      let checkin = attendances.find(
        checkin =>
          checkin.values['Member GUID'] ===
            action.payload.attendance.values['Member GUID'] &&
          moment(checkin.values['Class Date']).format('MM/DD/YYYY') ===
            moment(action.payload.classDate).format('MM/DD/YYYY') &&
          !excludeFromAttendanceCount(
            action.payload.additionalPrograms,
            checkin.values['Class'],
          ),
      );
      if (
        checkin === undefined &&
        !excludeFromAttendanceCount(
          action.payload.additionalPrograms,
          action.payload.attendance.values['Class'],
        )
      ) {
        let attendanceCount =
          memberItem.values['Attendance Count'] !== undefined
            ? parseFloat(
                parseFloat(memberItem.values['Attendance Count']).toFixed(2),
              )
            : 0;
        attendanceCount -= 1;
        memberItem.values['Attendance Count'] = attendanceCount;

        var values = {};
        values['Attendance Count'] = attendanceCount;
        action.payload.updateMember({
          id: memberItem['id'],
          memberItem: memberItem,
          values: values,
          myThis: action.payload.myThis,
        });
      }
      console.log('attendances:' + attendances.length);
      yield put(actions.setClassAttendances(attendances));
    }
  } catch (error) {
    console.log('Error in deleteAttendance: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchAttendance() {
  yield takeEvery(types.CREATE_ATTENDANCE, createAttendance);
  yield takeEvery(types.DELETE_ATTENDANCE, deleteAttendance);
  yield takeEvery(types.FETCH_CLASS_ATTENDANCES, fetchClassAttendances);
  yield takeEvery(types.FETCH_MEMBER_ATTENDANCES, fetchMemberAttendances);
  yield takeEvery(types.FETCH_ATTENDANCES_BY_DATE, fetchAttendancesByDate);
}

import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  CREATE_ATTENDANCE: namespace('attendance', 'CREATE_ATTENDANCE'),
  DELETE_ATTENDANCE: namespace('attendance', 'DELETE_ATTENDANCE'),
  SET_ADD_ATTENDANCE: namespace('attendance', 'SET_ADD_ATTENDANCE'),
  FETCH_CLASS_ATTENDANCES: namespace('attendance', 'FETCH_CLASS_ATTENDANCES'),
  SET_CLASS_ATTENDANCES: namespace('attendance', 'SET_CLASS_ATTENDANCES'),
  FETCH_MEMBER_ATTENDANCES: namespace('attendance', 'FETCH_MEMBER_ATTENDANCES'),
  SET_MEMBER_ATTENDANCES: namespace('attendance', 'SET_MEMBER_ATTENDANCES'),
  FETCH_ATTENDANCES_BY_DATE: namespace(
    'attendance',
    'FETCH_ATTENDANCES_BY_DATE',
  ),
  SET_ATTENDANCES_BY_DATE: namespace('attendance', 'SET_ATTENDANCES_BY_DATE'),
};

export const actions = {
  createAttendance: withPayload(types.CREATE_ATTENDANCE),
  deleteAttendance: withPayload(types.DELETE_ATTENDANCE),
  fetchClassAttendances: withPayload(types.FETCH_CLASS_ATTENDANCES),
  setClassAttendances: withPayload(types.SET_CLASS_ATTENDANCES),
  setAddAttendance: withPayload(types.SET_ADD_ATTENDANCE),
  fetchMemberAttendances: withPayload(types.FETCH_MEMBER_ATTENDANCES),
  setMemberAttendances: withPayload(types.SET_MEMBER_ATTENDANCES),
  fetchAttendancesByDate: withPayload(types.FETCH_ATTENDANCES_BY_DATE),
  setAttendancesByDate: withPayload(types.SET_ATTENDANCES_BY_DATE),
};

export const State = Record({
  classAttendances: List(),
  fetchingClassAttendances: false,
  memberAttendances: List(),
  fetchingMemberAttendances: true,
  newAttendance: {},
  fetchingAttendancesByDate: true,
  attendancesByDate: List(),
  attendanceAdded: {},
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CLASS_ATTENDANCES:
      return state.set('fetchingClassAttendances', true);
    case types.SET_CLASS_ATTENDANCES: {
      var classAttendances = [];

      for (var k = 0; k < payload.length; k++) {
        classAttendances[classAttendances.length] = payload[k];
      }

      return state
        .set('fetchingClassAttendances', false)
        .set('classAttendances', classAttendances);
    }
    case types.FETCH_MEMBER_ATTENDANCES:
      return state.set('fetchingMemberAttendances', true);
    case types.CREATE_ATTENDANCE:
      return state.set('attendanceAdded', {});
    case types.SET_ADD_ATTENDANCE:
      return state.set('attendanceAdded', payload);
    case types.SET_MEMBER_ATTENDANCES: {
      var memberAttendances = [];

      for (var k = 0; k < payload.length; k++) {
        memberAttendances[memberAttendances.length] = payload[k];
      }

      return state
        .set('fetchingMemberAttendances', false)
        .set('memberAttendances', memberAttendances);
    }
    case types.FETCH_ATTENDANCES_BY_DATE:
      return state.set('fetchingAttendancesByDate', true);
    case types.SET_ATTENDANCES_BY_DATE: {
      var attendances = [];

      for (var k = 0; k < payload.length; k++) {
        attendances[attendances.length] = payload[k];
      }

      return state
        .set('fetchingAttendancesByDate', false)
        .set('attendancesByDate', attendances);
    }
    default:
      return state;
  }
};

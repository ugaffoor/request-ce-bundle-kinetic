import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  NEW_CLASS: namespace('classes', 'NEW_CLASS'),
  EDIT_CLASS: namespace('classes', 'EDIT_CLASS'),
  DELETE_CLASS: namespace('classes', 'DELETE_CLASS'),
  FETCH_CLASS_SCHEDULES: namespace('classes', 'FETCH_CLASS_SCHEDULES'),
  SET_CLASS_SCHEDULES: namespace('classes', 'SET_CLASS_SCHEDULES'),
  FETCH_CLASS_BOOKINGS: namespace('classes', 'FETCH_CLASS_BOOKINGS'),
  SET_CLASS_BOOKINGS: namespace('classes', 'SET_CLASS_BOOKINGS'),
  UPDATE_BOOKING: namespace('classes', 'UPDATE_BOOKING'),
};

export const actions = {
  newClass: withPayload(types.NEW_CLASS),
  editClass: withPayload(types.EDIT_CLASS),
  deleteClass: withPayload(types.DELETE_CLASS),
  fetchClassSchedules: withPayload(types.FETCH_CLASS_SCHEDULES),
  setClassSchedules: withPayload(types.SET_CLASS_SCHEDULES),
  fetchClassBookings: withPayload(types.FETCH_CLASS_BOOKINGS),
  setClassBookings: withPayload(types.SET_CLASS_BOOKINGS),
  updateBooking: withPayload(types.UPDATE_BOOKING),
};

export const State = Record({
  classSchedules: List(),
  fetchingClassSchedules: true,
  classBookings: List(),
  fetchingClassBookings: false,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CLASS_SCHEDULES:
      return state.set('fetchingClassSchedules', true);
    case types.SET_CLASS_SCHEDULES: {
      return state
        .set('fetchingClassSchedules', false)
        .set('classSchedules', payload);
    }
    case types.FETCH_CLASS_BOOKINGS:
      return state.set('fetchingClassBookings', true);
    case types.SET_CLASS_BOOKINGS: {
      payload.classBookings.forEach(booking => {
        var memberRec = payload.allMembers.find(
          member => member.id === booking.memberGUID,
        );
        booking['photo'] = memberRec.values['Photo'];
        booking['firstName'] = memberRec.values['First Name'];
        booking['lastName'] = memberRec.values['Last Name'];
        booking['rankingProgram'] = memberRec.values['Ranking Program'];
        booking['rankingBelt'] = memberRec.values['Ranking Belt'];
        console.log(booking.firstName);
      });
      return state
        .set('fetchingClassBookings', false)
        .set('classBookings', payload.classBookings);
    }
    default:
      return state;
  }
};

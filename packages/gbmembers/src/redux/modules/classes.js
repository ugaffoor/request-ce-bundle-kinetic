import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';
import moment from 'moment';

export const types = {
  NEW_CLASS: namespace('classes', 'NEW_CLASS'),
  NEW_CLASS_ADDED: namespace('classes', 'NEW_CLASS_ADDED'),
  EDIT_CLASS: namespace('classes', 'EDIT_CLASS'),
  DELETE_CLASS: namespace('classes', 'DELETE_CLASS'),
  CLASS_DELETED: namespace('classes', 'CLASS_DELETED'),
  FETCH_CLASS_SCHEDULES: namespace('classes', 'FETCH_CLASS_SCHEDULES'),
  SET_CLASS_SCHEDULES: namespace('classes', 'SET_CLASS_SCHEDULES'),
  FETCH_CLASS_BOOKINGS: namespace('classes', 'FETCH_CLASS_BOOKINGS'),
  SET_CLASS_BOOKINGS: namespace('classes', 'SET_CLASS_BOOKINGS'),
  ADD_BOOKING: namespace('classes', 'ADD_BOOKING'),
  UPDATE_BOOKING: namespace('classes', 'UPDATE_BOOKING'),
  UPDATE_BOOKING_COMPLETE: namespace('classes', 'UPDATE_BOOKING_COMPLETE'),
  DELETE_BOOKING: namespace('classes', 'DELETE_BOOKING'),
  DELETE_BOOKING_COMPLETE: namespace('classes', 'DELETE_BOOKING_COMPLETE'),
  SET_ADD_BOOKING: namespace('classes', 'SET_ADD_BOOKING'),
  FETCH_CURRENT_CLASS_BOOKINGS: namespace(
    'classes',
    'FETCH_CURRENT_CLASS_BOOKINGS',
  ),
  SET_CURRENT_CLASS_BOOKINGS: namespace(
    'classes',
    'SET_CURRENT_CLASS_BOOKINGS',
  ),
  FETCH_RECURRING_BOOKINGS: namespace('classes', 'FETCH_RECURRING_BOOKINGS'),
  SET_RECURRING_BOOKINGS: namespace('classes', 'SET_RECURRING_BOOKINGS'),
  ADD_RECURRING: namespace('classes', 'ADD_RECURRING'),
  UPDATE_RECURRING: namespace('classes', 'UPDATE_RECURRING'),
  DELETE_RECURRING: namespace('classes', 'DELETE_RECURRING'),
  DELETE_RECURRING_COMPLETE: namespace('classes', 'DELETE_RECURRING_COMPLETE'),
  SET_ADD_RECURRING: namespace('classes', 'SET_ADD_RECURRING'),
};

export const actions = {
  newClass: withPayload(types.NEW_CLASS),
  newClassAdded: withPayload(types.NEW_CLASS_ADDED),
  editClass: withPayload(types.EDIT_CLASS),
  deleteClass: withPayload(types.DELETE_CLASS),
  classDeleted: withPayload(types.CLASS_DELETED),
  fetchClassSchedules: withPayload(types.FETCH_CLASS_SCHEDULES),
  setClassSchedules: withPayload(types.SET_CLASS_SCHEDULES),
  fetchClassBookings: withPayload(types.FETCH_CLASS_BOOKINGS),
  setClassBookings: withPayload(types.SET_CLASS_BOOKINGS),
  addBooking: withPayload(types.ADD_BOOKING),
  updateBooking: withPayload(types.UPDATE_BOOKING),
  updateBookingComplete: withPayload(types.UPDATE_BOOKING_COMPLETE),
  deleteBooking: withPayload(types.DELETE_BOOKING),
  deleteBookingComplete: withPayload(types.DELETE_BOOKING_COMPLETE),
  setAddedBooking: withPayload(types.SET_ADD_BOOKING),
  fetchCurrentClassBookings: withPayload(types.FETCH_CURRENT_CLASS_BOOKINGS),
  setCurrentClassBookings: withPayload(types.SET_CURRENT_CLASS_BOOKINGS),
  fetchRecurringBookings: withPayload(types.FETCH_RECURRING_BOOKINGS),
  setRecurringBookings: withPayload(types.SET_RECURRING_BOOKINGS),
  addRecurring: withPayload(types.ADD_RECURRING),
  updateRecurring: withPayload(types.UPDATE_RECURRING),
  deleteRecurring: withPayload(types.DELETE_RECURRING),
  deleteRecurringComplete: withPayload(types.DELETE_RECURRING_COMPLETE),
  setAddedRecurring: withPayload(types.SET_ADD_RECURRING),
};

export const State = Record({
  classSchedules: List(),
  fetchingClassSchedules: false,
  classBookings: List(),
  fetchingClassBookings: false,
  currentClassBookings: List(),
  fetchingCurrentClassBookings: false,
  addedBooking: {},
  recurringBookings: List(),
  fetchingRecurringBookings: false,
  addedRecurring: {},
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_CLASS_SCHEDULES:
      return state.set('fetchingClassSchedules', true);
    case types.SET_CLASS_SCHEDULES: {
      let data = payload.sort(function(a, b) {
        if (moment(a.start).isAfter(moment(b.start))) return 1;
        if (moment(a.start).isBefore(moment(b.start))) return -1;
        return 0;
      });

      return state
        .set('fetchingClassSchedules', false)
        .set('classSchedules', data);
    }
    case types.FETCH_CLASS_BOOKINGS:
      return state.set('fetchingClassBookings', true);
    case types.SET_CLASS_BOOKINGS: {
      payload.classBookings.forEach(booking => {
        var memberRec = payload.allMembers.find(
          member =>
            member.id === booking.memberGUID ||
            member.values['Member ID'] === booking.memberID,
        );
        booking['photo'] = memberRec.values['Photo'];
        booking['firstName'] = memberRec.values['First Name'];
        booking['lastName'] = memberRec.values['Last Name'];
        booking['rankingProgram'] = memberRec.values['Ranking Program'];
        booking['rankingBelt'] = memberRec.values['Ranking Belt'];
        booking['waiverCompletedDate'] =
          memberRec.values['Waiver Complete Date'];

        console.log(booking.firstName);
      });
      return state
        .set('fetchingClassBookings', false)
        .set('classBookings', payload.classBookings);
    }
    case types.SET_CURRENT_CLASS_BOOKINGS: {
      var now = moment();
      var classBookings = payload.currentClassBookings.filter(element => {
        if (
          element['classDate'] === now.format('YYYY-MM-DD') &&
          moment(
            element['classDate'] + ' ' + element['classTime'],
            'YYYY-MM-DD HH:mm',
          ).isBefore(now)
        ) {
          return false;
        }
        return true;
      });

      return state
        .set('fetchingCurrentClassBookings', false)
        .set('currentClassBookings', classBookings)
        .set('addedBooking', {});
    }
    case types.SET_ADD_BOOKING: {
      return state.set('addedBooking', payload);
    }
    case types.UPDATE_BOOKING_COMPLETE: {
      var classBookings = state.get('currentClassBookings');

      for (var i = 0; i < classBookings.length; i++) {
        var idx = classBookings[i].bookings.findIndex(element => {
          if (element.id === payload.id) return true;
          return false;
        });
        if (idx !== -1) {
          classBookings[i].bookings[idx].status = 'Cancelled';
          break;
        }
      }
      return state;
    }
    case types.DELETE_BOOKING_COMPLETE: {
      var classBookings = state.get('currentClassBookings');

      var idx = classBookings.findIndex(element => element.id === payload.id);
      classBookings.splice(idx, 1);
      return state;
    }
    case types.SET_ADD_RECURRING: {
      var recurringBookings = state.get('recurringBookings');

      return state.set('addedRecurring', payload);
    }
    case types.DELETE_RECURRING: {
      return state.set('addedRecurring', {});
    }
    case types.DELETE_RECURRING_COMPLETE: {
      var recurringBookings = state.get('recurringBookings');

      var idx = recurringBookings.findIndex(
        element => element.id === payload.id,
      );
      recurringBookings.splice(idx, 1);
      return state.set('addedRecurring', {});
    }
    case types.FETCH_RECURRING_BOOKINGS:
      return state.set('fetchingRecurringBookings', true);
    case types.SET_RECURRING_BOOKINGS: {
      payload.recurringBookings.forEach(booking => {
        var memberRec = payload.allMembers.find(
          member => member.id === booking.memberGUID,
        );
        if (memberRec !== undefined) {
          booking['photo'] = memberRec.values['Photo'];
          booking['firstName'] = memberRec.values['First Name'];
          booking['lastName'] = memberRec.values['Last Name'];
          booking['rankingProgram'] = memberRec.values['Ranking Program'];
          booking['rankingBelt'] = memberRec.values['Ranking Belt'];
          console.log(booking.firstName + ' ' + booking.lastName);
        } else {
          console.log(
            'NOT Matched to Member:' +
              booking.firstName +
              ' ' +
              booking.lastName,
          );
        }
      });
      return state
        .set('fetchingRecurringBookings', false)
        .set('recurringBookings', payload.recurringBookings)
        .set('addedRecurring', {});
    }
    case types.NEW_CLASS_ADDED: {
      var classSchedules = state.get('classSchedules').push(payload.classEvent);
      return state.set('classSchedules', classSchedules);
    }
    case types.CLASS_DELETED: {
      var classSchedules = state.get('classSchedules');

      var idx = classSchedules.findIndex(element => element.id === payload.id);
      classSchedules = classSchedules.splice(idx, 1);
      return state.set('classSchedules', classSchedules);
    }
    default:
      return state;
  }
};

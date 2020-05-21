import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  NEW_CLASS: namespace('classes', 'NEW_CLASS'),
  EDIT_CLASS: namespace('classes', 'EDIT_CLASS'),
  DELETE_CLASS: namespace('classes', 'DELETE_CLASS'),
  FETCH_CLASS_SCHEDULES: namespace('classes', 'FETCH_CLASS_SCHEDULES'),
  SET_CLASS_SCHEDULES: namespace('classes', 'SET_CLASS_SCHEDULES'),
};

export const actions = {
  newClass: withPayload(types.NEW_CLASS),
  editClass: withPayload(types.EDIT_CLASS),
  deleteClass: withPayload(types.DELETE_CLASS),
  fetchClassSchedules: withPayload(types.FETCH_CLASS_SCHEDULES),
  setClassSchedules: withPayload(types.SET_CLASS_SCHEDULES),
};

export const State = Record({
  classSchedules: List(),
  fetchingClassSchedules: true,
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
    default:
      return state;
  }
};

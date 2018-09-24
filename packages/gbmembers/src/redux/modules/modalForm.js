import { Record } from 'immutable';
import { namespace, withPayload, noPayload } from '../../utils';

export const types = {
  OPEN_FORM: namespace('queue', 'OPEN_FORM'),
  CLOSE_FORM: namespace('queue', 'CLOSE_FORM'),
  COMPLETE_FORM: namespace('queue', 'COMPLETE_FORM'),
};

export const actions = {
  openForm: withPayload(types.OPEN_FORM),
  closeForm: noPayload(types.CLOSE_FORM),
  completeForm: noPayload(types.COMPLETE_FORM),
};

export const State = Record({
  form: null,
  isCompleted: false,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.OPEN_FORM:
      return State({ form: payload });
    case types.CLOSE_FORM:
      return State();
    case types.COMPLETE_FORM:
      return state.set('isCompleted', true);
    default:
      return state;
  }
};

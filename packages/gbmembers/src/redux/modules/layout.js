import { Map } from 'immutable';

export const types = {
  SET_SIZE: '@kd/member/SET_SIZE',
};

export const actions = {
  setSize: payload => ({ type: types.SET_SIZE, payload }),
};

export const defaultState = Map({
  size: 'small',
});

export const reducer = (state = defaultState, { type, payload }) => {
  switch (type) {
    case types.SET_SIZE:
      return state.set('size', payload);
    default:
      return state;
  }
};

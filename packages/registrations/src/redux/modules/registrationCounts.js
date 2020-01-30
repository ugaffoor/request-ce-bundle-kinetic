export const types = {
  FETCH_REGISTRATION_COUNTS: '@kd/registrations/FETCH_REGISTRATION_COUNTS',
  SET_REGISTRATION_COUNTS: '@kd/registrations/SET_SREGISTRATION_COUNTS',
};

export const actions = {
  fetchRegistrationCounts: () => ({ type: types.FETCH_REGISTRATION_COUNTS }),
  setRegistrationCounts: counts => ({
    type: types.SET_REGISTRATION_COUNTS,
    payload: counts,
  }),
};

export const defaultState = {
  loading: true,
  data: {},
};

const reducer = (state = defaultState, { type, payload }) => {
  switch (type) {
    case types.FETCH_REGISTRATION_COUNTS:
      return { ...state, loading: true, errors: [] };
    case types.SET_REGISTRATION_COUNTS:
      return { ...state, loading: false, data: payload };
    default:
      return state;
  }
};

export default reducer;

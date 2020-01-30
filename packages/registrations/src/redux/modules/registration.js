export const types = {
  FETCH_REGISTRATION: '@kd/registrations/FETCH_REGISTRATION',
  SET_REGISTRATION: '@kd/registrations/SET_REGISTRATION',
  SET_REGISTRATION_ERRORS: '@kd/registrations/SET_REGISTRATION_ERRORS',
  CLEAR_REGISTRATION: '@kd/registrations/CLEAR_REGISTRATION',
  CLONE_REGISTRATION: '@kd/registrations/CLONE_REGISTRATION',
  CLONE_REGISTRATION_SUCCESS: '@kd/registrations/CLONE_REGISTRATION_SUCCESS',
  CLONE_REGISTRATION_ERROR: '@kd/registrations/CLONE_REGISTRATION_ERROR',
  DELETE_REGISTRATION: '@kd/registrations/DELETE_REGISTRATION',
  DELETE_REGISTRATION_SUCCESS: '@kd/registrations/DELETE_REGISTRATION_SUCCESS',
  DELETE_REGISTRATION_ERROR: '@kd/registrations/DELETE_REGISTRATION_ERROR',
  START_REGISTRATION_POLLER: '@kd/registrations/START_REGISTRATION_POLLER',
  STOP_REGISTRATION_POLLER: '@kd/registrations/STOP_REGISTRATION_POLLER',
};

export const actions = {
  fetchRegistration: id => ({ type: types.FETCH_REGISTRATION, payload: id }),
  setRegistration: submissions => ({
    type: types.SET_REGISTRATION,
    payload: submissions,
  }),
  setRegistrationErrors: errors => ({
    type: types.SET_REGISTRATION_ERRORS,
    payload: errors,
  }),
  clearRegistration: () => ({ type: types.CLEAR_REGISTRATION }),
  cloneRegistration: id => ({ type: types.CLONE_REGISTRATION, payload: id }),
  cloneRegistrationSuccess: () => ({ type: types.CLONE_REGISTRATION_SUCCESS }),
  cloneRegistrationErrors: errors => ({
    type: types.CLONE_REGISTRATION_ERROR,
    payload: errors,
  }),
  deleteRegistration: (id, callback) => ({
    type: types.DELETE_REGISTRATION,
    payload: { id, callback },
  }),
  deleteRegistrationSuccess: () => ({
    type: types.DELETE_REGISTRATION_SUCCESS,
  }),
  deleteRegistrationErrors: errors => ({
    type: types.DELETE_REGISTRATION_ERROR,
    payload: errors,
  }),
  startRegistrationPoller: id => ({
    type: types.START_REGISTRATION_POLLER,
    payload: id,
  }),
  stopRegistrationPoller: () => ({ type: types.STOP_REGISTRATION_POLLER }),
};

export const defaultState = {
  loading: true,
  cloning: false,
  deleting: false,
  errors: [],
  data: null,
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case types.FETCH_REGISTRATION:
      return { ...state, loading: true, errors: [] };
    case types.SET_REGISTRATION:
      return { ...state, loading: false, errors: [], data: action.payload };
    case types.SET_REGISTRATION_ERRORS:
      return {
        ...state,
        loading: false,
        errors: state.errors.concat(action.payload),
      };
    case types.CLEAR_REGISTRATION:
      return defaultState;
    case types.CLONE_REGISTRATION:
      return { ...state, cloning: true };
    case types.CLONE_REGISTRATION_SUCCESS:
      return { ...state, cloning: false };
    case types.CLONE_REGISTRATION_ERROR:
      return {
        ...state,
        cloning: false,
        errors: state.errors.concat(action.payload),
      };
    case types.DELETE_REGISTRATION:
      return { ...state, deleting: true };
    case types.DELETE_REGISTRATION_SUCCESS:
      return { ...state, deleting: false };
    case types.DELETE_REGISTRATION_ERROR:
      return {
        ...state,
        deleting: false,
        errors: state.errors.concat(action.payload),
      };
    default:
      return state;
  }
};

export default reducer;

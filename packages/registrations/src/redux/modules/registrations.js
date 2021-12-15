import { List } from 'immutable';
import { withPayload } from '../../utils';

export const types = {
  FETCH_REGISTRATIONS: '@kd/registrations/FETCH_REGISTRATIONS',
  SET_REGISTRATIONS: '@kd/registrations/SET_REGISTRATIONS',
  FETCH_LEADS: '@kd/registrations/FETCH_LEADS',
  SET_LEADS: '@kd/registrations/SET_LEADS',
};

export const actions = {
  fetchRegistrations: withPayload(types.FETCH_REGISTRATIONS),
  setRegistrations: (kids, mens, womans, barrafit) => ({
    type: types.SET_REGISTRATIONS,
    payload: { kids, mens, womans, barrafit },
  }),
  fetchLeads: coreState => ({
    type: types.FETCH_LEADS,
    payload: { coreState },
  }),
  setLeads: allLeads => ({
    type: types.SET_LEADS,
    payload: { allLeads },
  }),
};

export const defaultState = {
  registrationsLoading: true,
  data: List(),
  allLeads: [],
};

const reducer = (state = defaultState, action) => {
  switch (action.type) {
    case types.FETCH_REGISTRATIONS:
      return {
        ...state,
        registrationsLoading: true,
      };
    case types.SET_REGISTRATIONS: {
      let submissions = action.payload.kids.submissions
        .concat(action.payload.womans.submissions)
        .concat(action.payload.mens.submissions)
        .concat(action.payload.barrafit.submissions);

      submissions.sort(function(a, b) {
        if (new Date(a.submittedAt) < new Date(b.submittedAt)) {
          return 1;
        }
        if (new Date(a.submittedAt) > new Date(b.submittedAt)) {
          return -1;
        }
        return 0;
      });
      return {
        ...state,
        registrationsLoading: false,
        data: List(submissions),
        next: action.payload.nextPageToken,
      };
    }
    case types.FETCH_LEADS:
      return {
        ...state,
        leadsLoading: true,
      };
    case types.SET_LEADS: {
      return {
        ...state,
        leadsLoading: false,
        allLeads: List(action.payload.allLeads),
      };
    }
    default:
      return state;
  }
};

export default reducer;

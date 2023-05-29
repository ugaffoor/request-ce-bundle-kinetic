import { Record, List } from 'immutable';
import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_SERVICESBYDATE: namespace('services', 'FETCH_SERVICESBYDATE'),
  SET_SERVICES: namespace('services', 'SET_SERVICES'),
  SEND_RECEIPT: namespace('services', 'SEND_RECEIPT'),
};

export const actions = {
  fetchServicesByDate: withPayload(types.FETCH_SERVICESBYDATE),
  setServices: withPayload(types.SET_SERVICES),
  sendReceipt: withPayload(types.SEND_RECEIPT),
};

export const State = Record({
  servicesLoading: true,
  services: List(),
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_SERVICESBYDATE:
      return state.set('servicesLoading', true);
    case types.SET_SERVICES: {
      let services = payload;

      services.sort(function(a, b) {
        if (new Date(a.submittedAt) < new Date(b.submittedAt)) {
          return 1;
        }
        if (new Date(a.submittedAt) > new Date(b.submittedAt)) {
          return -1;
        }
        return 0;
      });
      return state.set('servicesLoading', false).set('services', services);
    }
    default:
      return state;
  }
};

export default reducer;

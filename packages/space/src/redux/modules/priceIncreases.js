import { Record, List } from 'immutable';
import { Utils } from 'common';
const { namespace, noPayload, withPayload } = Utils;

export const State = Record({
  priceIncreases: List(),
  priceIncreasesLoading: false,
  membershipFees: List(),
  membershipFeesLoading: false,
  newPriceIncrease: {},
});

export const types = {
  FETCH_PRICE_INCREASES: namespace('priceincreases', 'FETCH_PRICE_INCREASES'),
  SET_PRICE_INCREASES: namespace('priceincreases', 'SET_PRICE_INCREASES'),
  FETCH_MEMBERSHIP_FEES: namespace('priceincreases', 'FETCH_MEMBERSHIP_FEES'),
  SET_MEMBERSHIP_FEES: namespace('priceincreases', 'SET_MEMBERSHIP_FEES'),
  CREATE_PRICE_INCREASE: namespace('priceincreases', 'CREATE_PRICE_INCREASE'),
  SET_NEW_PRICE_INCREASE: namespace('priceincreases', 'SET_NEW_PRICE_INCREASE'),
  UPDATE_PRICE_INCREASE: namespace('priceincreases', 'UPDATE_PRICE_INCREASE'),
  DELETE_PRICE_INCREASE: namespace('priceincreases', 'DELETE_PRICE_INCREASE'),
};

export const actions = {
  fetchPriceIncreases: noPayload(types.FETCH_PRICE_INCREASES),
  setPriceIncreases: withPayload(types.SET_PRICE_INCREASES),
  fetchAllMembershipFees: noPayload(types.FETCH_MEMBERSHIP_FEES),
  setMembershipFees: withPayload(types.SET_MEMBERSHIP_FEES),
  createPriceIncrease: withPayload(types.CREATE_PRICE_INCREASE),
  setNewPriceIncrease: withPayload(types.SET_NEW_PRICE_INCREASE),
  updatePriceIncrease: withPayload(types.UPDATE_PRICE_INCREASE),
  deletePriceIncrease: withPayload(types.DELETE_PRICE_INCREASE),
};

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_PRICE_INCREASES:
      return state.set('priceIncreasesLoading', true);
    case types.SET_PRICE_INCREASES:
      return state
        .set('priceIncreasesLoading', false)
        .set('priceIncreases', payload);
    case types.FETCH_MEMBERSHIP_FEES:
      return state.set('membershipFeesLoading', true);
    case types.SET_MEMBERSHIP_FEES:
      return state
        .set('membershipFeesLoading', false)
        .set('membershipFees', payload);
    case types.SET_NEW_PRICE_INCREASE: {
      return state.set('newPriceIncrease', payload);
    }
    default:
      return state;
  }
};

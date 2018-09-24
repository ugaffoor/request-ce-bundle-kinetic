import { Record } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  CREATE_CAMPAIGN: namespace('campaigns', 'CREATE_CAMPAIGN'),
  FETCH_NEW_CAMPAIGN: namespace('campaigns', 'FETCH_NEW_CAMPAIGN'),
  SET_NEW_CAMPAIGN: namespace('campaigns', 'SET_NEW_CAMPAIGN'),
  FETCH_CAMPAIGNS: namespace('campaigns', 'FETCH_CAMPAIGNS'),
  SET_CAMPAIGNS: namespace('campaigns', 'SET_CAMPAIGNS'),
  FETCH_CAMPAIGN: namespace('campaigns', 'FETCH_CAMPAIGN'),
  SET_CAMPAIGN: namespace('campaigns', 'SET_CAMPAIGN'),
  UPDATE_CAMPAIGN: namespace('campaigns', 'UPDATE_CAMPAIGN'),
};

export const actions = {
  createCampaign: withPayload(types.CREATE_CAMPAIGN),
  fetchNewCampaign: withPayload(types.FETCH_NEW_CAMPAIGN),
  setNewCampaign: withPayload(types.SET_NEW_CAMPAIGN),
  fetchCampaigns: withPayload(types.FETCH_CAMPAIGNS),
  setCampaigns: withPayload(types.SET_CAMPAIGNS),
  fetchCampaign: withPayload(types.FETCH_CAMPAIGN),
  setCampaign: withPayload(types.SET_CAMPAIGN),
  updateCampaign: withPayload(types.UPDATE_CAMPAIGN),
};

export const State = Record({
  newCampaign: {},
  campaignItem: {},
  allCampaigns: [],
  newCampaignLoading: true,
  campaignsLoading: true,
  campaignLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_NEW_CAMPAIGN:
      return state.set('newCampaignLoading', true);
    case types.SET_NEW_CAMPAIGN: {
      return state.set('newCampaignLoading', false).set('newCampaign', payload);
    }
    case types.FETCH_CAMPAIGN: {
      return state.set('campaignLoading', true);
    }
    case types.SET_CAMPAIGN: {
      return state.set('campaignLoading', false).set('campaignItem', payload);
    }
    case types.FETCH_CAMPAIGNS: {
      return state.set('campaignsLoading', true);
    }
    case types.SET_CAMPAIGNS: {
      return state.set('allCampaigns', payload).set('campaignsLoading', false);
    }
    default:
      return state;
  }
};

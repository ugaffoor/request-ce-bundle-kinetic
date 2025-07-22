import { Record } from 'immutable';

import { namespace, withPayload } from '../../utils';
import moment from 'moment';

export const types = {
  CREATE_EMAIL_CAMPAIGN: namespace('campaigns', 'CREATE_EMAIL_CAMPAIGN'),
  FETCH_NEW_EMAIL_CAMPAIGN: namespace('campaigns', 'FETCH_NEW_EMAIL_CAMPAIGN'),
  SET_NEW_EMAIL_CAMPAIGN: namespace('campaigns', 'SET_NEW_EMAIL_CAMPAIGN'),
  FETCH_EMAIL_CAMPAIGNS: namespace('campaigns', 'FETCH_EMAIL_CAMPAIGNS'),
  SET_EMAIL_CAMPAIGNS: namespace('campaigns', 'SET_EMAIL_CAMPAIGNS'),
  FETCH_EMAIL_CAMPAIGNS_BYDATE: namespace(
    'campaigns',
    'FETCH_EMAIL_CAMPAIGNS_BYDATE',
  ),
  SET_EMAIL_CAMPAIGNS_BYDATE: namespace(
    'campaigns',
    'SET_EMAIL_CAMPAIGNS_BYDATE',
  ),
  FETCH_EMAIL_CAMPAIGN: namespace('campaigns', 'FETCH_EMAIL_CAMPAIGN_BYDATE'),
  SET_EMAIL_CAMPAIGN: namespace('campaigns', 'SET_EMAIL_CAMPAIGN'),
  UPDATE_EMAIL_CAMPAIGN: namespace('campaigns', 'UPDATE_EMAIL_CAMPAIGN'),

  CREATE_SMS_CAMPAIGN: namespace('campaigns', 'CREATE_SMS_CAMPAIGN'),
  FETCH_NEW_SMS_CAMPAIGN: namespace('campaigns', 'FETCH_NEW_SMS_CAMPAIGN'),
  SET_NEW_SMS_CAMPAIGN: namespace('campaigns', 'SET_NEW_SMS_CAMPAIGN'),
  FETCH_SMS_CAMPAIGNS: namespace('campaigns', 'FETCH_SMS_CAMPAIGNS'),
  SET_SMS_CAMPAIGNS: namespace('campaigns', 'SET_SMS_CAMPAIGNS'),
  FETCH_SMS_CAMPAIGN: namespace('campaigns', 'FETCH_SMS_CAMPAIGN'),
  SET_SMS_CAMPAIGN: namespace('campaigns', 'SET_SMS_CAMPAIGN'),
  UPDATE_SMS_CAMPAIGN: namespace('campaigns', 'UPDATE_SMS_CAMPAIGN'),
};

export const actions = {
  createEmailCampaign: withPayload(types.CREATE_EMAIL_CAMPAIGN),
  fetchNewEmailCampaign: withPayload(types.FETCH_NEW_EMAIL_CAMPAIGN),
  setNewEmailCampaign: withPayload(types.SET_NEW_EMAIL_CAMPAIGN),
  fetchEmailCampaigns: withPayload(types.FETCH_EMAIL_CAMPAIGNS),
  setEmailCampaigns: withPayload(types.SET_EMAIL_CAMPAIGNS),
  fetchEmailCampaignsByDate: withPayload(types.FETCH_EMAIL_CAMPAIGNS_BYDATE),
  setEmailCampaignsByDate: withPayload(types.SET_EMAIL_CAMPAIGNS_BYDATE),
  fetchEmailCampaign: withPayload(types.FETCH_EMAIL_CAMPAIGN),
  setEmailCampaign: withPayload(types.SET_EMAIL_CAMPAIGN),
  updateEmailCampaign: withPayload(types.UPDATE_EMAIL_CAMPAIGN),

  createSmsCampaign: withPayload(types.CREATE_SMS_CAMPAIGN),
  fetchNewSmsCampaign: withPayload(types.FETCH_NEW_SMS_CAMPAIGN),
  setNewSmsCampaign: withPayload(types.SET_NEW_SMS_CAMPAIGN),
  fetchSmsCampaigns: withPayload(types.FETCH_SMS_CAMPAIGNS),
  setSmsCampaigns: withPayload(types.SET_SMS_CAMPAIGNS),
  fetchSmsCampaign: withPayload(types.FETCH_SMS_CAMPAIGN),
  setSmsCampaign: withPayload(types.SET_SMS_CAMPAIGN),
  updateSmsCampaign: withPayload(types.UPDATE_SMS_CAMPAIGN),
};

export const State = Record({
  newEmailCampaign: {},
  emailCampaignItem: {},
  allEmailCampaigns: [],
  allEmailCampaignsByDate: [],
  newEmailCampaignLoading: true,
  emailCampaignsLoading: true,
  emailCampaignsByDateLoading: true,
  emailCampaignsLoadingTimestamp: moment().subtract(1, 'days'),
  emailCampaignLoading: true,

  newSmsCampaign: {},
  smsCampaignItem: {},
  allSmsCampaigns: [],
  newSmsCampaignLoading: true,
  smsCampaignsLoading: true,
  smsCampaignsLoadingTimestamp: moment().subtract(1, 'days'),
  smsCampaignLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_NEW_EMAIL_CAMPAIGN:
      return state.set('newEmailCampaignLoading', true);
    case types.SET_NEW_EMAIL_CAMPAIGN: {
      return state
        .set('newEmailCampaignLoading', false)
        .set('newEmailCampaign', payload);
    }
    case types.FETCH_EMAIL_CAMPAIGN: {
      return state.set('emailCampaignLoading', true);
    }
    case types.SET_EMAIL_CAMPAIGN: {
      return state
        .set('emailCampaignLoading', false)
        .set('emailCampaignItem', payload);
    }
    case types.FETCH_EMAIL_CAMPAIGNS: {
      return state.set('emailCampaignsLoading', true);
    }
    case types.SET_EMAIL_CAMPAIGNS: {
      var allEmailCampaigns = state.get('allEmailCampaigns');
      if (!payload.initial) {
        allEmailCampaigns.submissions = allEmailCampaigns.submissions.concat(
          payload.submissions,
        );
      }
      return state
        .set('allEmailCampaigns', {
          submissions: payload.initial
            ? payload.submissions
            : allEmailCampaigns.submissions,
          nextPageToken:
            payload.nextPageToken === null ? undefined : payload.nextPageToken,
        })
        .set('emailCampaignsLoading', false)
        .set('emailCampaignsLoadingTimestamp', moment());
    }
    case types.FETCH_EMAIL_CAMPAIGNS_BYDATE: {
      return state.set('emailCampaignsByDateLoading', true);
    }
    case types.SET_EMAIL_CAMPAIGNS_BYDATE: {
      return state
        .set('allEmailCampaignsByDate', {
          submissions: payload.emailCampaigns,
        })
        .set('emailCampaignsByDateLoading', false);
    }

    case types.FETCH_NEW_SMS_CAMPAIGN:
      return state.set('newSmsCampaignLoading', true);
    case types.SET_NEW_SMS_CAMPAIGN: {
      return state
        .set('newSmsCampaignLoading', false)
        .set('newSmsCampaign', payload);
    }
    case types.FETCH_SMS_CAMPAIGN: {
      return state.set('smsCampaignLoading', true);
    }
    case types.SET_SMS_CAMPAIGN: {
      return state
        .set('smsCampaignLoading', false)
        .set('smsCampaignItem', payload);
    }
    case types.FETCH_SMS_CAMPAIGNS: {
      return state.set('smsCampaignsLoading', true);
    }
    case types.SET_SMS_CAMPAIGNS: {
      var allSmsCampaigns = state.get('allSmsCampaigns');
      if (!payload.initial) {
        allSmsCampaigns.submissions = allSmsCampaigns.submissions.concat(
          payload.submissions,
        );
      }
      return state
        .set('allSmsCampaigns', {
          submissions: payload.initial
            ? payload.submissions
            : allSmsCampaigns.submissions,
          nextPageToken:
            payload.nextPageToken === null ? undefined : payload.nextPageToken,
        })
        .set('smsCampaignsLoading', false)
        .set('smsCampaignsLoadingTimestamp', moment());
    }
    default:
      return state;
  }
};

import { Record } from 'immutable';

import { namespace, withPayload } from '../../utils';

export const types = {
  FETCH_LEADS: namespace('leads', 'FETCH_LEADS'),
  SET_LEADS: namespace('leads', 'SET_LEADS'),
  FETCH_LEADS_BY_DATE: namespace('leads', 'FETCH_LEADS_BY_DATE'),
  SET_LEADS_BY_DATE: namespace('leads', 'SET_LEADS_BY_DATE'),
  FETCH_CURRENT_LEAD: namespace('leads', 'FETCH_CURRENT_LEAD'),
  SET_CURRENT_LEAD: namespace('leads', 'SET_CURRENT_LEAD'),
  SET_LEAD_STATUS: namespace('leads', 'SET_LEAD_STATUS'),
  UPDATE_LEAD: namespace('leads', 'UPDATE_LEAD'),
  LEAD_SAVED: namespace('leads', 'LEAD_SAVED'),
  CREATE_LEAD: namespace('leads', 'CREATE_LEAD'),
  DELETE_LEAD: namespace('leads', 'DELETE_LEAD'),
  FETCH_NEW_LEAD: namespace('leads', 'FETCH_NEW_LEAD'),
  SET_NEW_LEAD: namespace('leads', 'SET_NEW_LEAD'),
};

export const actions = {
  fetchLeads: withPayload(types.FETCH_LEADS),
  setLeads: withPayload(types.SET_LEADS),
  fetchLeadsByDate: withPayload(types.FETCH_LEADS_BY_DATE),
  setLeadsByDate: withPayload(types.SET_LEADS_BY_DATE),
  fetchCurrentLead: withPayload(types.FETCH_CURRENT_LEAD),
  setCurrentLead: withPayload(types.SET_CURRENT_LEAD),
  setLeadStatus: withPayload(types.SET_LEAD_STATUS),
  updateLead: withPayload(types.UPDATE_LEAD),
  leadSaved: withPayload(types.LEAD_SAVED),
  createLead: withPayload(types.CREATE_LEAD),
  deleteLead: withPayload(types.DELETE_LEAD),
  fetchNewLead: withPayload(types.FETCH_NEW_LEAD),
  setNewLead: withPayload(types.SET_NEW_LEAD),
};

export const State = Record({
  allLeads: [],
  leadsByDate: [],
  currentLead: {},
  newLead: {},
  currentLeadLoading: true,
  leadUpdating: true,
  newLeadLoading: true,
  leadsLoading: true,
  leadsByDateLoading: true,
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.FETCH_LEADS:
      return state.set('leadsLoading', true);
    case types.FETCH_LEADS_BY_DATE:
      return state.set('leadsByDateLoading', true);
    case types.FETCH_CURRENT_LEAD:
      return state.set('currentLeadLoading', true);
    case types.FETCH_NEW_LEAD:
      return state.set('newLeadLoading', true);
    case types.SET_LEADS: {
      return state.set('leadsLoading', false).set('allLeads', payload);
    }
    case types.SET_LEADS_BY_DATE: {
      return state.set('leadsByDateLoading', false).set('leadsByDate', payload);
    }
    case types.SET_CURRENT_LEAD: {
      return state.set('currentLeadLoading', false).set('currentLead', payload);
    }
    case types.SET_NEW_LEAD: {
      return state.set('newLeadLoading', false).set('newLead', payload);
    }
    case types.UPDATE_LEAD: {
      return state.set('leadUpdating', true);
    }
    case types.LEAD_SAVED: {
      var allLeads = payload.allLeads;
      for (var i = 0; i < allLeads.length; i++) {
        if (allLeads[i]['id'] === payload.leadItem.id) {
          allLeads[i] = payload.leadItem;
        }
      }

      return state.set('leadUpdating', false).set('allLeads', allLeads);
    }
    default:
      return state;
  }
};

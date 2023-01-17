import { Record } from 'immutable';
import moment from 'moment';

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
  LEAD_DELETED: namespace('leads', 'LEAD_DELETED'),
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
  leadDeleted: withPayload(types.LEAD_DELETED),
  fetchNewLead: withPayload(types.FETCH_NEW_LEAD),
  setNewLead: withPayload(types.SET_NEW_LEAD),
};

export const State = Record({
  allLeads: [],
  leadLastFetchTime: undefined,
  leadsByDate: [],
  currentLead: {},
  newLead: {},
  currentLeadLoading: true,
  leadUpdating: true,
  newLeadLoading: true,
  leadsLoading: true,
  leadsByDateLoading: true,
  leadAttentionRequired: false,
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
      var allLeads = state.get('allLeads');
      var leadsByDate = state.get('leadsByDate');
      let attentionRequired = false;
      var leads = [];
      for (var k = 0; k < payload.length; k++) {
        leads[leads.length] = payload[k];
      }

      if (allLeads.length === 0) {
        allLeads = leads;
      } else {
        for (var k = 0; k < leads.length; k++) {
          var mIdx = allLeads.findIndex(lead => lead.id === leads[k].id);
          if (mIdx !== -1) {
            allLeads[mIdx] = leads[k];
          } else {
            allLeads.push(leads[k]);
          }
        }
      }

      for (var k = 0; k < allLeads.length; k++) {
        if (
          allLeads[k].values['Status'] !== 'Converted' &&
          allLeads[k].values['Is New Reply Received'] === 'true'
        ) {
          attentionRequired = true;
        }
      }
      if (leadsByDate.length !== 0 && payload.length !== 0) {
        for (var k = 0; k < payload.length; k++) {
          var mIdx = leadsByDate.findIndex(lead => lead.id === payload[k].id);
          if (mIdx !== -1) {
            leadsByDate[mIdx] = leads[k];
          } else {
            leadsByDate.push(leads[k]);
          }
        }

        leadsByDate = leadsByDate.sort(function(a, b) {
          if (a['createdAt'] > b['createdAt']) {
            return -1;
          } else if (a['createdAt'] < b['createdAt']) {
            return 1;
          }
          return 0;
        });
      }
      return state
        .set('leadsLoading', false)
        .set('allLeads', allLeads)
        .set('leadsByDate', leadsByDate)
        .set('leadLastFetchTime', moment().format('YYYY-MM-DDTHH:mm:ssZ'))
        .set('leadAttentionRequired', attentionRequired);
    }
    case types.SET_LEADS_BY_DATE: {
      let attentionRequired = false;
      if (
        payload.findIndex(
          lead =>
            lead.values['Status'] !== 'Converted' &&
            lead.values['Is New Reply Received'] === 'true',
        ) !== -1
      ) {
        attentionRequired = true;
      }
      return state
        .set('leadsByDateLoading', false)
        .set('leadsByDate', payload)
        .set('leadAttentionRequired', attentionRequired);
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
    case types.LEAD_DELETED: {
      return state
        .set('allLeads', payload.allLeads)
        .set('leadsByDate', payload.leadsByDate);
    }
    case types.LEAD_SAVED: {
      var leadsByDate = state.leadsByDate;
      for (var i = 0; i < leadsByDate.length; i++) {
        if (leadsByDate[i]['id'] === payload.leadItem.id) {
          leadsByDate[i] = payload.leadItem;
        }
      }
      var allLeads = payload.allLeads;
      for (var i = 0; i < allLeads.length; i++) {
        if (allLeads[i]['id'] === payload.leadItem.id) {
          allLeads[i] = payload.leadItem;
        }
      }
      let attentionRequired = false;
      if (
        payload.allLeads.findIndex(
          lead =>
            lead.values['Status'] !== 'Converted' &&
            lead.values['Is New Reply Received'] === 'true',
        ) !== -1
      ) {
        attentionRequired = true;
      }

      return state
        .set('leadUpdating', false)
        .set('allLeads', allLeads)
        .set('leadsByDate', leadsByDate)
        .set('leadAttentionRequired', attentionRequired);
    }
    default:
      return state;
  }
};

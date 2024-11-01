import { Record, List } from 'immutable';
import { namespace, noPayload, withPayload } from '../../utils';
import { Profile } from '../../records';

export const DEFAULT_DOCUMENTATION_URL = 'https://help.kinops.io/';
export const DEFAULT_SUPPORT_URL = 'https://kinops.io/manage/public/support';

export const types = {
  LOAD_MEMBER_APP_SETTINGS: namespace('app', 'LOAD_MEMBER_APP_SETTINGS'),
  SET_MEMBER_APP_SETTINGS: namespace('app', 'SET_MEMBER_APP_SETTINGS'),
  ADD_MEMBERS_LIST: namespace('app', 'ADD_MEMBERS_LIST'),
  UPDATE_MEMBERS_LIST: namespace('app', 'UPDATE_MEMBERS_LIST'),
  REMOVE_MEMBERS_LIST: namespace('app', 'REMOVE_MEMBERS_LIST'),
  ADD_LEADS_LIST: namespace('app', 'ADD_LEADS_LIST'),
  UPDATE_LEADS_LIST: namespace('app', 'UPDATE_LEADS_LIST'),
  REMOVE_LEADS_LIST: namespace('app', 'REMOVE_LEADS_LIST'),
  ADD_DDR_TEMPLATE: namespace('app', 'ADD_DDR_TEMPLATE'),
  REMOVE_DDR_TEMPLATE: namespace('app', 'REMOVE_DDR_TEMPLATE'),
  UPDATE_REPORT_PREFERENCES: namespace('app', 'UPDATE_REPORT_PREFERENCES'),
  FETCH_REPORT_PREFERENCES: namespace('app', 'FETCH_REPORT_PREFERENCES'),
  SET_REPORT_PREFERENCES: namespace('app', 'SET_REPORT_PREFERENCES'),
  SET_SIDEBAR_DISPLAY_TYPE: namespace('app', 'SET_SIDEBAR_DISPLAY_TYPE'),
};

export const actions = {
  loadAppSettings: noPayload(types.LOAD_MEMBER_APP_SETTINGS),
  setAppSettings: withPayload(types.SET_MEMBER_APP_SETTINGS),
  addMembersList: withPayload(types.ADD_MEMBERS_LIST),
  updateMembersList: withPayload(types.UPDATE_MEMBERS_LIST),
  removeMembersList: withPayload(types.REMOVE_MEMBERS_LIST),
  addLeadsList: withPayload(types.ADD_LEADS_LIST),
  updateLeadsList: withPayload(types.UPDATE_LEADS_LIST),
  removeLeadsList: withPayload(types.REMOVE_LEADS_LIST),
  addDDRTemplate: withPayload(types.ADD_DDR_TEMPLATE),
  removeDDRTemplate: withPayload(types.REMOVE_DDR_TEMPLATE),
  updateReportPreferences: withPayload(types.UPDATE_REPORT_PREFERENCES),
  fetchReportPreferences: withPayload(types.FETCH_REPORT_PREFERENCES),
  setReportPreferences: withPayload(types.SET_REPORT_PREFERENCES),
  setSidebarDisplayType: withPayload(types.SET_SIDEBAR_DISPLAY_TYPE),
};
/*
 *
 * Mine (only assigned to me)
 * Teammates (members of all of my teams except me)
 * Unassigned (assigned to one of my teams but not to an individual)
 */

export const State = Record({
  profile: Profile(),
  kineticBillingServerUrl: '',
  billingDDRUrl: '',
  billingWidgetUrl: '',
  discussionServerUrl: '',
  billingCompany: '',
  isSmsEnabled: false,
  sidebarDisplayType: 'members',
  leadStatusValues: '',
  leadSourceValues: '',
  memberStatusValues: '',
  paymentPeriods: '',
  ddrTemplates: List(),
  allTeams: List(),
  programs: List(),
  additionalPrograms: List(),
  belts: List(),
  beltSizes: [],
  membershipTypes: List(),
  membershipFees: List(),
  snippets: List(),
  triggers: List(),
  myTeams: List(),
  myTeammates: List(),
  myFilters: List(),
  forms: List(),
  space: List(),
  spaceSlug: '',
  loading: true,
  lastFilterPath: null,
  lastFilterName: null,
  memberLists: List(),
  leadLists: List(),
  kapp: {},
  reportPreferences: List(),
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SET_MEMBER_APP_SETTINGS: {
      if (payload.profile.profileAttributes['Member Lists']) {
        for (
          var i = 0;
          i < payload.profile.profileAttributes['Member Lists'].length;
          i++
        ) {
          payload.profile.profileAttributes['Member Lists'][i] = JSON.parse(
            payload.profile.profileAttributes['Member Lists'][i],
          );
        }
      }
      var memberLists = payload.profile.profileAttributes['Member Lists']
        ? List(payload.profile.profileAttributes['Member Lists'])
        : List();

      if (payload.profile.profileAttributes['Lead Lists']) {
        for (
          var i = 0;
          i < payload.profile.profileAttributes['Lead Lists'].length;
          i++
        ) {
          payload.profile.profileAttributes['Lead Lists'][i] = JSON.parse(
            payload.profile.profileAttributes['Lead Lists'][i],
          );
        }
      }
      var leadLists = payload.profile.profileAttributes['Lead Lists']
        ? List(payload.profile.profileAttributes['Lead Lists'])
        : List();

      var reportPreferencesArr =
        payload.profile.profileAttributes['Report Preferences'];
      if (reportPreferencesArr) {
        for (var i = 0; i < reportPreferencesArr.length; i++) {
          reportPreferencesArr[i] = JSON.parse(reportPreferencesArr[i]);
        }
      }

      var reportPreferences = reportPreferencesArr
        ? List(reportPreferencesArr)
        : List();

      return state
        .set('kineticBillingServerUrl', payload.kineticBillingServerUrl)
        .set('billingDDRUrl', payload.billingDDRUrl)
        .set('billingWidgetUrl', payload.billingWidgetUrl)
        .set('discussionServerUrl', payload.discussionServerUrl)
        .set('billingCompany', payload.billingCompany)
        .set('isSmsEnabled', payload.isSmsEnabled === 'true' ? true : false)
        .set('leadStatusValues', payload.leadStatusValues.split(','))
        .set('leadSourceValues', payload.leadSourceValues.split(','))
        .set('memberStatusValues', payload.memberStatusValues.split(','))
        .set('paymentPeriods', payload.paymentPeriods.split(','))
        .set('billingCompany', payload.billingCompany)
        .set(
          'ddrTemplates',
          payload.ddrTemplates
            ? typeof payload.ddrTemplates === 'string'
              ? List(JSON.parse(payload.ddrTemplates))
              : List(payload.ddrTemplates)
            : List(),
        )
        .set('profile', payload.profile)
        .set('programs', List(payload.programs))
        .set('additionalPrograms', List(payload.additionalPrograms))
        .set('belts', List(payload.belts))
        .set('beltSizes', List(payload.beltSizes))
        .set('membershipTypes', List(payload.membershipTypes))
        .set('membershipFees', List(payload.membershipFees))
        .set('snippets', List(payload.snippets))
        .set('triggers', List(payload.triggers))
        .set('space', payload.space)
        .set('spaceSlug', payload.space.slug)
        .set('memberLists', memberLists)
        .set('leadLists', leadLists)
        .set('kapp', payload.kapp)
        .set('reportPreferences', reportPreferences)
        .set('loading', false);
    }
    case types.ADD_MEMBERS_LIST:
      return state.update('memberLists', memberLists =>
        memberLists.push(payload.newList),
      );
    case types.UPDATE_MEMBERS_LIST:
      return state.update('memberLists', memberLists =>
        memberLists.set(
          memberLists.findIndex(m => m['id'] === payload.updatedList['id']),
          payload.updatedList,
        ),
      );
    case types.REMOVE_MEMBERS_LIST:
      return state.update('memberLists', memberLists =>
        memberLists.filter(list => list.name !== payload),
      );
    case types.ADD_LEADS_LIST:
      return state.update('leadLists', leadLists =>
        leadLists.push(payload.newList),
      );
    case types.UPDATE_LEADS_LIST:
      return state.update('leadLists', leadLists =>
        leadLists.set(
          leadLists.findIndex(m => m['id'] === payload.updatedList['id']),
          payload.updatedList,
        ),
      );
    case types.REMOVE_LEADS_LIST:
      return state.update('leadLists', leadLists =>
        leadLists.filter(list => list.name !== payload),
      );
    case types.ADD_DDR_TEMPLATE:
      return state.update('ddrTemplates', ddrTemplates =>
        ddrTemplates.push(payload.newTemplate),
      );
    case types.REMOVE_DDR_TEMPLATE:
      return state.update('ddrTemplates', ddrTemplates =>
        ddrTemplates.filter(template => template.name !== payload.name),
      );
    case types.UPDATE_REPORT_PREFERENCES:
      return state.update('reportPreferences', reportPreferences => {
        let index = -1;
        if (reportPreferences && reportPreferences.size > 0) {
          index = reportPreferences.findIndex(x =>
            x.hasOwnProperty(payload.key),
          );
        }
        let obj = {};
        obj[payload.key] = payload.reportPreferences;
        if (index >= 0) {
          return reportPreferences.set(index, obj);
        } else {
          return reportPreferences.push(obj);
        }
      });
    case types.SET_REPORT_PREFERENCES: {
      var reportPreferencesArr =
        payload.profileAttributes['Report Preferences'];
      if (reportPreferencesArr) {
        for (var i = 0; i < reportPreferencesArr.length; i++) {
          reportPreferencesArr[i] = JSON.parse(reportPreferencesArr[i]);
        }
      }

      var reportPreferences = reportPreferencesArr
        ? List(reportPreferencesArr)
        : List();
      return state.set('reportPreferences', reportPreferences);
    }
    case types.SET_SIDEBAR_DISPLAY_TYPE: {
      return state.set('sidebarDisplayType', payload);
    }
    default:
      return state;
  }
};

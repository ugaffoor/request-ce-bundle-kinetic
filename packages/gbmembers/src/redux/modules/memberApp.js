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
};

export const actions = {
  loadAppSettings: noPayload(types.LOAD_MEMBER_APP_SETTINGS),
  setAppSettings: withPayload(types.SET_MEMBER_APP_SETTINGS),
  addMembersList: withPayload(types.ADD_MEMBERS_LIST),
  updateMembersList: withPayload(types.UPDATE_MEMBERS_LIST),
  removeMembersList: withPayload(types.REMOVE_MEMBERS_LIST),
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
  allTeams: List(),
  programs: List(),
  belts: List(),
  membershipTypes: List(),
  membershipFees: List(),
  snippets: List(),
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
});

export const reducer = (state = State(), { type, payload }) => {
  switch (type) {
    case types.SET_MEMBER_APP_SETTINGS: {
      return state
        .set('kineticBillingServerUrl', payload.kineticBillingServerUrl)
        .set('billingDDRUrl', payload.billingDDRUrl)
        .set('billingWidgetUrl', payload.billingWidgetUrl)
        .set('discussionServerUrl', payload.discussionServerUrl)
        .set('billingCompany', payload.billingCompany)
        .set('profile', payload.profile)
        .set('programs', List(payload.programs))
        .set('belts', List(payload.belts))
        .set('membershipTypes', List(payload.membershipTypes))
        .set('membershipFees', List(payload.membershipFees))
        .set('snippets', List(payload.snippets))
        .set('space', payload.space)
        .set('spaceSlug', payload.space.slug)
        .set(
          'memberLists',
          payload.profile.profileAttributes['Member Lists']
            ? List(payload.profile.profileAttributes['Member Lists'])
            : List(),
        )
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
    default:
      return state;
  }
};

import {
  all,
  call,
  put,
  select,
  takeLatest,
  takeEvery,
} from 'redux-saga/effects';
import { OrderedMap } from 'immutable';
import { CoreAPI } from 'react-kinetic-core';

import { getAttributeValue } from '../../utils';

import { actions, types } from '../modules/memberApp';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

const PROFILE_INCLUDES =
  //  'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user,attributes,space,space.attributes,space.kapps';
  //  'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user,attributes,space,space.attributes,space.kapps,space.kapps.attributes';
  'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user';
const PROFILE_UPDATE_INCLUDES =
  'attributes,profileAttributes,memberships,memberships.team,memberships.team.attributes,memberships.team.memberships,memberships.team.memberships.user';
const KAPP_UPDATE_INCLUDES = 'attributes';

export const selectProfile = ({ app }) => app.profile;
export const selectMemberLists = ({ member }) => member.app.memberLists;
export const selectDDRTemplates = ({ member }) => member.app.ddrTemplates;
export const selectKapp = ({ app }) => app.kapps;
export const selectReportPreferences = ({ member }) => member.app.reportPreferences;

export const PROGRAMBELTS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();
export const MEMBER_TYPES_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();
export const MEMBERSHIP_FEES_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .index('values[Status]')
  .include('details,values')
  .limit(1000)
  .build();
export const SNIPPETS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .eq('values[Type]', 'Snippet')
  .index('values[Status],values[Type]')
  .include('details,values')
  .limit(1000)
  .build();

// TODO decide on error handling for these calls.
export function* fetchMemberAppSettingsTask() {
  console.log('debug 1');
  const {
    kapps: { kapps },
    space: { space },
    profile: { profile },
    submissions: { submissions },
  } = yield all({
    space: call(CoreAPI.fetchSpace, { include: 'attributes' }),
    kapps: call(CoreAPI.fetchKapps, { include: 'attributes' }),
    profile: call(CoreAPI.fetchProfile, {
      include: PROFILE_INCLUDES,
    }),
    submissions: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'program-belts',
      search: PROGRAMBELTS_SEARCH,
    }),
  });
  console.log('debug 2');
  var kapp = undefined;
  kapps.forEach(function(k) {
    if (k.slug === 'gbmembers') kapp = k;
  });
  console.log('debug 3:' + kapp);

  var programsMap = OrderedMap();
  var beltsMap = OrderedMap();
  for (var i = 0; i < submissions.length; i++) {
    programsMap = programsMap.set(submissions[i].values['Program Order'], {
      order: submissions[i].values['Program Order'],
      program: submissions[i].values['Program'],
    });
    beltsMap = beltsMap.set(
      submissions[i].values['Program Order'] +
        submissions[i].values['Belt Order'],
      {
        programOrder: submissions[i].values['Program Order'],
        program: submissions[i].values['Program'],
        beltOrder: submissions[i].values['Belt Order'],
        belt: submissions[i].values['Belt'],
      },
    );
  }
  programsMap = programsMap.sort((a, b) => {
    if (a.order < b.order) {
      return -1;
    }
    if (a.order > b.order) {
      return 1;
    }
    return 0;
  });

  var programs = programsMap.toList();

  beltsMap = beltsMap.sort((a, b) => {
    const p1Order = a.programOrder;
    const p2Order = b.programOrder;
    const belt1Order = a.beltOrder.padStart(2, '0');
    const belt2Order = b.beltOrder.padStart(2, '0');

    const beforeIndex = -1;
    const afterIndex = 1;

    if (p1Order === p2Order) {
      if (belt1Order > belt2Order) {
        return afterIndex;
      } else if (belt1Order < belt2Order) {
        return beforeIndex;
      } else {
        return 0;
      }
    } else if (p1Order > p2Order) {
      return afterIndex;
    } else if (p1Order < p2Order) {
      return beforeIndex;
    }

    return 0;
  });

  var belts = beltsMap.toList();
  console.log('debug 4');

  const memberTypes = yield all({
    submissions: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'membership-types',
      search: MEMBER_TYPES_SEARCH,
    }),
  });
  var memberTypesMap = OrderedMap();
  var memberTypesSubmissions = memberTypes.submissions.submissions;
  for (i = 0; i < memberTypesSubmissions.length; i++) {
    memberTypesMap = memberTypesMap.set(
      memberTypesSubmissions[i].values['Order'] +
        memberTypesSubmissions[i].values['Type'],
      {
        order: memberTypesSubmissions[i].values['Order'],
        type: memberTypesSubmissions[i].values['Type'],
      },
    );
  }
  memberTypesMap = memberTypesMap.sort((a, b) => {
    if (a.order < b.order) {
      return -1;
    }
    if (a.order > b.order) {
      return 1;
    }
    return 0;
  });
  var membershipTypes = memberTypesMap.toList();
  console.log('debug 5');

  const memberFees = yield all({
    submissions: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'membership-fees',
      search: MEMBERSHIP_FEES_SEARCH,
    }),
  });
  var membershipFeesMap = OrderedMap();
  var membershipFeesSubmissions = memberFees.submissions.submissions;

  for (i = 0; i < membershipFeesSubmissions.length; i++) {
    membershipFeesMap = membershipFeesMap.set(
      membershipFeesSubmissions[i].values['Program'],
      {
        program: membershipFeesSubmissions[i].values['Program'],
        info: membershipFeesSubmissions[i].values['Info'],
        fee: membershipFeesSubmissions[i].values['Fee'],
      },
    );
  }
  membershipFeesMap = membershipFeesMap.sort((a, b) => {
    if (a.program < b.program) {
      return -1;
    }
    if (a.program > b.program) {
      return 1;
    }
    return 0;
  });
  var membershipFees = membershipFeesMap.toList();

  const snippetsSubs = yield all({
    submissions: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'notification-data',
      search: SNIPPETS_SEARCH,
    }),
  });
  var snippetsMap = OrderedMap();
  var snippetsSubmissions = snippetsSubs.submissions.submissions;
  for (i = 0; i < snippetsSubmissions.length; i++) {
    snippetsMap = snippetsMap.set(snippetsSubmissions[i].values['Name'], {
      name: snippetsSubmissions[i].values['Name'],
      value: snippetsSubmissions[i].values['HTML Content'],
    });
  }
  var snippets = snippetsMap.toList();
  console.log('debug 5');

  const appSettings = {
    kineticBillingServerUrl: getAttributeValue(
      'Kinetic Billing Server URL',
      '',
      kapp,
      space,
    )[0],
    billingDDRUrl: getAttributeValue('Billing eDDR URL', '', kapp, space)[0],
    billingWidgetUrl: getAttributeValue(
      'Billing Widget URL',
      '',
      kapp,
      space,
    )[0],
    billingCompany: getAttributeValue('Billing Company', '', kapp, space)[0],
    ddrTemplates: getAttributeValue(
      'Billing eDDR Templates',
      '',
      kapp,
      space,
    )[0],
    isSmsEnabled: getAttributeValue('SMS Enabled', '', kapp, space)[0],
    leadStatusValues: getAttributeValue(
      'Lead Status Values',
      '',
      kapp,
      space,
    )[0],
    memberStatusValues: getAttributeValue(
      'Member Status Values',
      '',
      kapp,
      space,
    )[0],
    discussionServerUrl: `/${space.slug}/kinetic-response`,
    profile,
    space,
    programs,
    belts,
    membershipTypes,
    membershipFees,
    snippets,
    kapp,
  };
  console.log('debug 7');

  yield put(actions.setAppSettings(appSettings));
}

const util = require('util');
export function* updateDDRTemplatesTask(payload) {
  const ddrTemplates = yield select(selectDDRTemplates);
  const kapps = yield select(selectKapp);
  let kapp = undefined;
  yield kapps.forEach(function(k) {
    if (k.slug === 'gbmembers') kapp = k;
  });
  let templatesAttribute = yield kapp.attributes.find(
    attribute => attribute.name === 'Billing eDDR Templates',
  );
  if (templatesAttribute) {
    yield (templatesAttribute.values = [JSON.stringify(ddrTemplates)]);
  } else {
    yield kapp.attributes.push({
      name: 'Billing eDDR Templates',
      values: [JSON.stringify(ddrTemplates)],
    });
  }

  try {
    const { serverError } = yield call(CoreAPI.updateKapp, {
      kapp,
      kappSlug: 'gbmembers',
      include: KAPP_UPDATE_INCLUDES,
    });
    let message, label;
    if (payload.payload.action === 'add') {
      label = 'Add Template';
      message = 'Template added successfully';
    } else if (payload.payload.action === 'remove') {
      label = 'Remove Template';
      message = 'Template removed successfully';
    }
    if (!serverError) {
      yield put(errorActions.addSuccess(message, label));
      if (payload.payload.history) {
        payload.payload.history.push('/ddrTemplates');
      }
    } else {
      console.log(
        'updateDDRTemplatesTask - Caught server error : ' +
          util.inspect(serverError),
      );
      yield put(
        errorActions.addError(
          serverError.statusText + ': ' + serverError.error,
          label,
        ),
      );
    }
  } catch (error) {
    console.log('Error in updateDDRTemplatesTask: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* updateMembersListTask(payload) {
  const memberLists = yield select(selectMemberLists);
  const profile = yield select(selectProfile);
  var memberListsArr = memberLists.toJS();
  for (var i = 0; i < memberListsArr.length; i++) {
    memberListsArr[i] = JSON.stringify(memberListsArr[i]);
  }

  profile.profileAttributes['Member Lists'] = memberListsArr;
  const { serverError } = yield call(CoreAPI.updateProfile, {
    profile,
    include: PROFILE_UPDATE_INCLUDES,
  });

  if (!serverError) {
    // TODO: What should we do on success?
    if (payload.payload.history) {
      payload.payload.history.push('/kapps/gbmembers/memberLists');
    }
  }
}

//TODO - fetch only reportPreferences instead of entire profile
export function* fetchReportPreferences() {
  const { profile } = yield call(CoreAPI.fetchProfile, {
      include: PROFILE_INCLUDES
  });
  yield put(actions.setReportPreferences(profile));
}

export function* updateReportPreferences(action) {
  const reportPreferences = yield select(selectReportPreferences);
  const profile = yield select(selectProfile);
  var reportPreferencesArr = reportPreferences.toJS();
  for (var i = 0; i < reportPreferencesArr.length; i++) {
    reportPreferencesArr[i] = JSON.stringify(reportPreferencesArr[i]);
  }

  yield profile.profileAttributes['Report Preferences'] = reportPreferencesArr;
  const { serverError } = yield call(CoreAPI.updateProfile, {
    profile,
    include: PROFILE_UPDATE_INCLUDES,
  });

  if (!serverError) {
    // TODO: What should we do on success?
    yield put(errorActions.addSuccess("Preferences updated successfully", "Update Preference"));
    yield put(actions.fetchReportPreferences());
  } else {
    yield put(errorActions.addError("Error updating preferences", "Update Preference"));
  }
}

export function* watchApp() {
  console.log('watchApp');
  yield takeEvery(types.LOAD_MEMBER_APP_SETTINGS, fetchMemberAppSettingsTask);
  yield takeLatest(
    [
      types.ADD_MEMBERS_LIST,
      types.UPDATE_MEMBERS_LIST,
      types.REMOVE_MEMBERS_LIST,
    ],
    updateMembersListTask,
  );
  yield takeLatest(
    [types.ADD_DDR_TEMPLATE, types.REMOVE_DDR_TEMPLATE],
    updateDDRTemplatesTask,
  );
  yield takeEvery(types.UPDATE_REPORT_PREFERENCES, updateReportPreferences);
  yield takeEvery(types.FETCH_REPORT_PREFERENCES, fetchReportPreferences);
}

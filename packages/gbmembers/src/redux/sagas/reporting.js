import { call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/reporting';
import { actions as errorActions } from '../modules/errors';

const util = require('util');

export function* fetchActivityReport(actions) {
  try {
    let report = {members : [], leads : []};
    let id = null;

    const MEMBER_SEARCH = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member ID]', id)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const LEAD_SEARCH = new CoreAPI.SubmissionSearch(true)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const LEAD_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Lead ID]', id)
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const [members, leads] = yield all([
      call(CoreAPI.searchSubmissions, {
        form: 'member',
        kapp: 'gbmembers',
        search: MEMBER_SEARCH
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'lead',
        kapp: 'gbmembers',
        search : LEAD_SEARCH
      })
    ]);

    /*const { submissions } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'member',
      search: MEMBER_SEARCH
    });*/

    report.members = members.submissions;
    report.leads = leads.submissions;

    /*for (let i = 0; i < members.submissions.length; i++) {
      id = members.submissions[i]['id'];
      const { memberActivities } = yield call(CoreAPI.searchSubmissions, {
        form: 'member-activities',
        kapp: 'gbmembers',
        search: new CoreAPI.SubmissionSearch(true)
          .eq('values[Member ID]', id)
          .includes(['Count', 'count'])
          .limit(1000)
          .build()
      });
      report.members.push({member: members.submissions[i], activities: memberActivities});
    }

    for (let i = 0; i < leads.submissions.length; i++) {
      id = leads.submissions[i]['id'];
      const { leadActivities } = yield call(CoreAPI.searchSubmissions, {
        form: 'lead-activities',
        kapp: 'gbmembers',
        search: new CoreAPI.SubmissionSearch(true)
          .eq('values[Lead ID]', id)
          .includes(['Count', 'count'])
          .limit(1000)
          .build()
      });

      report.leads.push({lead: leads.submissions[i], activities: leadActivities});
    }*/

    yield put(actions.payload.setReport(report));
  } catch (error) {
    console.log('Error in fetchActivityReport: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchReports() {
  yield takeEvery(types.FETCH_ACTIVITY_REPORT, fetchActivityReport);
}

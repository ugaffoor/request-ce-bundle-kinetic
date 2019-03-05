import { takeEvery, put, all, call, select } from 'redux-saga/effects';
import { push } from 'connected-react-router';
import { CoreAPI } from 'react-kinetic-core';
import { List } from 'immutable';
import { commonActions, toastActions } from 'common';
import { actions, types } from '../modules/spaceApp';
import { actions as errorActions } from '../modules/errors';
import { OrderedMap } from 'immutable';
import { DiscussionAPI } from 'discussions';

export const SNIPPETS_SEARCH = new CoreAPI.SubmissionSearch(true)
  .eq('values[Status]', 'Active')
  .eq('values[Type]', 'Snippet')
  .index('values[Status],values[Type]')
  .include('details,values')
  .limit(1000)
  .build();

export function* fetchAppSettingsSaga() {
  const [{ users, usersServerError }, { space, spaceServerError }] = yield all([
    call(CoreAPI.fetchUsers),
    call(CoreAPI.fetchSpace, {
      include: 'userAttributeDefinitions,userProfileAttributeDefinitions',
    }),
  ]);

  const snippetsSubs = yield all({
    submissions: call(CoreAPI.searchSubmissions, {
      datastore: true,
      form: 'notification-data',
      search: SNIPPETS_SEARCH,
    }),
  });
  var snippetsMap = OrderedMap();
  var snippetsSubmissions = snippetsSubs.submissions.submissions;
  for (let i = 0; i < snippetsSubmissions.length; i++) {
    snippetsMap = snippetsMap.set(snippetsSubmissions[i].values['Name'], {
      name: snippetsSubmissions[i].values['Name'],
      value: snippetsSubmissions[i].values['HTML Content'],
    });
  }
  var snippets = snippetsMap.toList();

  if (usersServerError || spaceServerError) {
    yield put(
      errorActions.setSystemError(usersServerError || spaceServerError),
    );
  } else {
    yield put(
      actions.setAppSettings({
        spaceAdmins: List(users).filter(u => u.spaceAdmin),
        userAttributeDefinitions: space.userAttributeDefinitions.reduce(
          (memo, item) => {
            memo[item.name] = item;
            return memo;
          },
          {},
        ),
        userProfileAttributeDefinitions: space.userProfileAttributeDefinitions.reduce(
          (memo, item) => {
            memo[item.name] = item;
            return memo;
          },
          {},
        ),
        snippets,
      }),
    );
  }
}

export function* deleteAlertSaga(action) {
  const { errors, serverError } = yield call(CoreAPI.deleteSubmission, {
    id: action.payload,
  });

  if (serverError || errors) {
    yield put(errorActions.setSystemError(serverError));
  } else {
    yield put(toastActions.addSuccess('Deleted alert.'));
    yield put(commonActions.fetchAlerts());
  }
}

export function* createDiscussionSaga({ payload }) {
  const { error, issue } = yield call(DiscussionAPI.createIssue, {
    name: payload.title,
    description: payload.description || payload.title,
  });

  if (error) {
    yield put(actions.setDiscussionsError(error));
  } else {
    // Invite members to discussion
    if (payload.members) {
      const invites = payload.members.split(',').map(i => i.trim());
      yield all(
        invites.map(invite =>
          call(
            DiscussionAPI.createInvite,
            issue.guid,
            invite,
            payload.description,
          ),
        ),
      );
    }
    yield put(push(`/discussions/${issue.guid}`));
  }
}

export function* fetchRecentDiscussionsSaga() {
  // First we need to determine if the user is authenticated in Response.
  const { error: authenticationError } = yield call(
    DiscussionAPI.fetchResponseProfile,
  );
  if (authenticationError) {
    yield call(DiscussionAPI.getResponseAuthentication);
  }

  const { limit, offset, search } = yield select(state => ({
    limit: state.space.spaceApp.discussionsLimit,
    offset: state.space.spaceApp.discussionsOffset,
    search: state.space.spaceApp.discussionsSearchTerm,
  }));

  const { error, issues } = !!search
    ? yield call(DiscussionAPI.searchIssues, search, limit, offset)
    : yield call(DiscussionAPI.fetchMyOpenIssues, limit, offset);

  if (error) {
    yield put(actions.setDiscussionsError(error));
  } else {
    yield put(actions.setDiscussions(issues));
  }
}

export function* watchSpaceApp() {
  yield takeEvery(types.FETCH_APP_SETTINGS, fetchAppSettingsSaga);
  yield takeEvery(
    [types.FETCH_DISCUSSIONS, types.SET_DISCUSSIONS_SEARCH_TERM],
    fetchRecentDiscussionsSaga,
  );
  yield takeEvery(types.CREATE_DISCUSSION, createDiscussionSaga);
  yield takeEvery(types.DELETE_ALERT, deleteAlertSaga);
}

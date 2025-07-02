import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/leads';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import axios from 'axios';
import moment from 'moment';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';
export const TOO_MANY_STATUS_STRING = 'Your filter matches too many items.';

export const USER_INCLUDES = 'details,attributes,profile.attributes';
export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';

export const getAppSettings = state => state.member.app;
export const getCurrentLead = state => state.currentLead;
export const getNewLead = state => state.newLead;

const createEventUrl = '/create-event';
const deleteEventUrl = '/delete-event';
const util = require('util');

export function* fetchLeads(action) {
  try {
    let allSubmissions = [];

    let leadLastFetchTime =
      action.payload !== undefined &&
      action.payload.leadLastFetchTime !== undefined
        ? action.payload.leadLastFetchTime
        : undefined;
    let searchCurrent = new CoreAPI.SubmissionSearch()
      .in('values[Lead State]', ['Open', 'Converted'])
      .sortBy('updatedAt')
      .sortDirection('DESC')
      //.includes(['details', 'values[Lead State],values[Status],values[Status History],values[Source],values[Date],values[Date Created],values[Date Created],values[Last Name],values[Gender],values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number]'])
      .includes(['details', 'values'])
      .limit(1000);
    if (leadLastFetchTime !== undefined) {
      searchCurrent = searchCurrent.startDate(
        moment(leadLastFetchTime).toDate(),
      );
    }
    searchCurrent = searchCurrent.build();

    var { submissions, nextPageToken } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'lead',
      search: searchCurrent,
    });
    allSubmissions = allSubmissions.concat(submissions);

    while (nextPageToken) {
      var search2 = new CoreAPI.SubmissionSearch()
        .eq('values[Lead State]', 'Open')
        .sortBy('updatedAt')
        .sortDirection('DESC')
        //.includes(['details', 'values[Lead State],values[Status],values[Status History],values[Source],values[Date],values[Date Created],values[Date Created],values[Last Name],values[Gender],values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number]'])
        .includes(['details', 'values'])
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var { submissions, nextPageToken } = yield call(
        CoreAPI.searchSubmissions,
        {
          kapp: 'gbmembers',
          form: 'lead',
          search: search2,
        },
      );

      allSubmissions = allSubmissions.concat(submissions);
    }
    //    console.log('AllLeads # ' + submissions);
    yield put(actions.setLeads(allSubmissions));
  } catch (error) {
    console.log('Error in fetchLeads: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchLeadsByDate(action) {
  try {
    let allSubmissions = [];

    const search = new CoreAPI.SubmissionSearch()
      //.includes(['details', 'values[Lead State],values[Status],values[Status History],values[Source],values[Date],values[Date Created],values[Date Created],values[Last Name],values[Gender],values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number]'])
      .includes(['details', 'values'])
      .sortBy('updatedAt')
      .sortDirection('DESC')
      .limit(1000)
      .build();

    var { submissions, nextPageToken } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'lead',
      search,
    });
    allSubmissions = allSubmissions.concat(submissions);

    while (nextPageToken) {
      var search2 = new CoreAPI.SubmissionSearch()
        //.includes(['details', 'values[Lead State],values[Status],values[Status History],values[Source],values[Date],values[Date Created],values[Date Created],values[Last Name],values[Gender],values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number]'])
        .includes(['details', 'values'])
        .sortBy('updatedAt')
        .sortDirection('DESC')
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var { submissions, nextPageToken } = yield call(
        CoreAPI.searchSubmissions,
        {
          kapp: 'gbmembers',
          form: 'lead',
          search: search2,
        },
      );
      allSubmissions = allSubmissions.concat(submissions);
    }
    //    console.log('Leads by Date# ' + submissions);
    yield put(actions.setLeadsByDate(allSubmissions));
  } catch (error) {
    console.log('Error in fetchLeadsByDate: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchCurrentLead(action) {
  try {
    const LEAD_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Lead ID]', action.payload.id)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const MEMBER_POS_SEARCH = new CoreAPI.SubmissionSearch(true)
      .index('values[Person ID]')
      .eq('values[Person ID]', action.payload.id)
      .include(['details', 'values'])
      .sortDirection('DESC')
      .limit(100)
      .build();
    const [
      submission,
      leadActivities,
      posOrderSubmissions,
      posPurchasedItems,
    ] = yield all([
      call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'lead-activities',
        kapp: 'gbmembers',
        search: LEAD_ACTIVITIES_SEARCH,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'pos-order',
        search: MEMBER_POS_SEARCH,
        datastore: true,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'pos-purchased-item',
        search: MEMBER_POS_SEARCH,
        datastore: true,
      }),
    ]);

    if (action.payload.myThis) submission.myThis = action.payload.myThis;
    if (action.payload.history)
      submission.submission.history = action.payload.history;
    if (action.payload.fetchLeads)
      submission.fetchLeads = action.payload.fetchLeads;

    // Add Email Sent/Recieved submissions
    let emailSentContent = [];
    let emailReceivedContent = [];
    let smsContent = [];
    let requestContent = [];
    for (let i = 0; i < leadActivities.submissions.length; i++) {
      if (
        leadActivities.submissions[i].values['Type'] === 'Email' &&
        leadActivities.submissions[i].values['Direction'] === 'Outbound'
      ) {
        emailSentContent[emailSentContent.length] = JSON.parse(
          leadActivities.submissions[i].values['Content'],
        );
      }
      if (
        leadActivities.submissions[i].values['Type'] === 'Email' &&
        leadActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        emailReceivedContent[emailReceivedContent.length] = JSON.parse(
          leadActivities.submissions[i].values['Content'],
        );
        emailReceivedContent[emailReceivedContent.length - 1]['Activity ID'] =
          leadActivities.submissions[i].id;
      }
      if (leadActivities.submissions[i].values['Type'] === 'SMS') {
        smsContent[smsContent.length] = leadActivities.submissions[i];
      }
      if (
        leadActivities.submissions[i].values['Type'] === 'Request' &&
        leadActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        requestContent[requestContent.length] = JSON.parse(
          leadActivities.submissions[i].values['Content'],
        );
      }
    }
    let posOrders = [];
    for (let i = 0; i < posOrderSubmissions.submissions.length; i++) {
      var len = posOrders.length;
      posOrders[len] = posOrderSubmissions.submissions[i].values;
      posOrders[len]['id'] = posOrderSubmissions.submissions[i]['id'];
    }
    posOrders = posOrders.sort((a, b) => {
      if (a['Date time processed'] < b['Date time processed']) {
        return -1;
      }
      if (a['Date time processed'] > b['Date time processed']) {
        return 1;
      }
      return 0;
    });
    let posItems = [];
    for (let i = 0; i < posPurchasedItems.submissions.length; i++) {
      var len = posItems.length;
      posItems[len] = posPurchasedItems.submissions[i].values;
      posItems[len]['id'] = posPurchasedItems.submissions[i]['id'];
    }
    submission.submission.emailsReceived = emailReceivedContent;
    submission.submission.emailsSent = emailSentContent;
    submission.submission.smsContent = smsContent;
    submission.submission.requestContent = requestContent;
    submission.submission.posOrders = posOrders;
    submission.submission.posItems = posItems;
    submission.submission.myThis = action.payload.myThis;

    yield put(actions.setCurrentLead(submission.submission));
  } catch (error) {
    console.log('Error in fetchCurrentLead: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchNewLead(action) {
  var lead = {
    values: {},
  };
  yield put(actions.setNewLead(lead));
  if (action.payload.myThis) lead.myThis = action.payload.myThis;
  if (action.payload.history) lead.history = action.payload.history;
  if (action.payload.fetchLeads) lead.fetchLeads = action.payload.fetchLeads;
  if (action.payload.allLeads) lead.allLeads = action.payload.allLeads;
}

export function* updateCurrentLead(action) {
  const appSettings = yield select(getAppSettings);
  try {
    //console.log("### updateCurrentLead # item.history = " + util.inspect(action.payload.history));
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: action.payload.leadItem.values,
    });
    if (action.payload.history) {
      if (action.payload.showLead) {
        action.payload.history.push(
          '/kapps/gbmembers/LeadDetail/' + action.payload['id'],
        );
      } else {
        action.payload.history.push('/kapps/gbmembers/Leads');
      }
    }
    if (action.payload.fetchLeads)
      action.payload.fetchLeads({
        leadLastFetchTime: action.payload.leadLastFetchTime,
      });
    if (action.payload.fetchLead)
      action.payload.fetchLead({
        id: action.payload['id'],
        myThis: action.payload.myThis,
      });
    console.log('updateCurrentLead # ' + submission);
    yield put(
      errorActions.addSuccess(
        'Lead ' +
          action.payload.leadItem.values['First Name'] +
          ' ' +
          action.payload.leadItem.values['Last Name'] +
          ' updated successfully',
        'Update Lead',
      ),
    );
    yield put(
      actions.leadSaved({
        allLeads: action.payload.allLeads,
        leadItem: action.payload.leadItem,
      }),
    );
    if (action.payload.calendarEvent) {
      var args = {
        space: appSettings.spaceSlug,
        summary: action.payload.calendarEvent.summary,
        description: action.payload.calendarEvent.description,
        location: action.payload.calendarEvent.location,
        attendeeEmail: action.payload.calendarEvent.attendeeEmail,
        startDateTime: action.payload.calendarEvent.startDateTime,
        endDateTime: action.payload.calendarEvent.endDateTime,
        timeZone: action.payload.calendarEvent.timeZone,
        calendarName: action.payload.calendarEvent.calendarName,
      };
      axios
        .post(
          appSettings.kapp.attributes['Kinetic Email Server URL'] +
            createEventUrl,
          args,
        )
        .then(result => {
          if (result.data.error && result.data.error > 0) {
            console.log(result.data.errorMessage);
            action.payload.addNotification(
              NOTICE_TYPES.ERROR,
              result.data.errorMessage,
              'Create Calendar Event',
            );
          } else {
            let data = result.data.data;
            let msg = null;
            if (data) {
              msg =
                'Event created successfully. Following events already exist for the date\n';
              data.forEach(dt => (msg += dt + ' \n'));
            } else {
              msg = 'Event created successfully.';
            }

            action.payload.addNotification(
              NOTICE_TYPES.SUCCESS,
              msg,
              'Create Calendar Event',
            );
          }
        })
        .catch(error => {
          console.log(error.response);
          //action.payload.setSystemError(error);
        });
    }
    if (action.payload.calendarDeleteEvent) {
      var args = {
        space: appSettings.spaceSlug,
        summary: action.payload.calendarDeleteEvent.summary,
        attendeeEmail: action.payload.calendarDeleteEvent.attendeeEmail,
        startDateTime: action.payload.calendarDeleteEvent.startDateTime,
        timeZone: action.payload.calendarDeleteEvent.timeZone,
        calendarName: action.payload.calendarDeleteEvent.calendarName,
      };
      axios
        .post(
          appSettings.kapp.attributes['Kinetic Email Server URL'] +
            deleteEventUrl,
          args,
        )
        .then(result => {
          if (result.data.error && result.data.error > 0) {
            console.log(result.data.errorMessage);
            action.payload.addNotification(
              NOTICE_TYPES.ERROR,
              result.data.errorMessage,
              'Delete Calendar Event',
            );
          } else {
            let data = result.data.data;
            let msg = null;
            if (data) {
            } else {
              msg = 'Event deleted successfully.';
            }

            action.payload.addNotification(
              NOTICE_TYPES.SUCCESS,
              msg,
              'Deleted Calendar Event',
            );
          }
        })
        .catch(error => {
          console.log(error.response);
          //action.payload.setSystemError(error);
        });
    }
  } catch (error) {
    console.log('Error in updateCurrentLead: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* createLead(action) {
  try {
    action.payload.leadItem.myThis = undefined;
    action.payload.leadItem.history = undefined;
    action.payload.leadItem.fetchLeads = undefined;
    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'lead',
      values: action.payload.leadItem.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });
    if (action.payload.history)
      action.payload.history.push(
        '/kapps/gbmembers/LeadDetail/' + submission.id,
      );
    if (action.payload.fetchLeads)
      action.payload.fetchLeads({
        leadLastFetchTime: action.payload.leadLastFetchTime,
      });
    console.log('createLead # ' + submission);
    yield put(
      errorActions.addSuccess('Lead created successfully', 'Create Lead'),
    );
  } catch (error) {
    console.log('Error in createLead: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteLead(action) {
  try {
    const { submission } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.leadItem.id,
    });
    let mIdx = action.payload.allLeads.findIndex(
      lead => lead.id === action.payload.leadItem.id,
    );
    action.payload.allLeads.splice(mIdx, 1);

    var lIdx = action.payload.leadsByDate.findIndex(
      lead => lead.id === action.payload.leadItem.id,
    );
    action.payload.leadsByDate.splice(lIdx, 1);

    yield put(
      actions.leadDeleted({
        allLeads: action.payload.allLeads,
        leadsByDate: action.payload.leadsByDate,
      }),
    );
    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Leads');
    console.log('deleteLead # ' + submission);
    yield put(
      errorActions.addSuccess('Lead deleted successfully', 'Delete Lead'),
    );
  } catch (error) {
    console.log('Error in deleteLead: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* watchLeads() {
  yield takeEvery(types.FETCH_LEADS, fetchLeads);
  yield takeEvery(types.FETCH_LEADS_BY_DATE, fetchLeadsByDate);
  yield takeEvery(types.FETCH_CURRENT_LEAD, fetchCurrentLead);
  yield takeEvery(types.UPDATE_LEAD, updateCurrentLead);
  yield takeEvery(types.CREATE_LEAD, createLead);
  yield takeEvery(types.DELETE_LEAD, deleteLead);
  yield takeEvery(types.FETCH_NEW_LEAD, fetchNewLead);
}

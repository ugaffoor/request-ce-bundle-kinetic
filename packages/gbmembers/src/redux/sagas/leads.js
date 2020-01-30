import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import { types, actions } from '../modules/leads';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import axios from 'axios';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';
export const TOO_MANY_STATUS_STRING = 'Your filter matches too many items.';

export const USER_INCLUDES = 'details,attributes,profile.attributes';
export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';

export const getAppSettings = state => state.member.app;
export const getCurrentLead = state => state.currentLead;
export const getNewLead = state => state.newLead;

const createEventUrl = '/create-event';
const util = require('util');

export function* fetchLeads(action) {
  try {
    const search = new CoreAPI.SubmissionSearch()
      .eq('values[Lead State]', 'Open')
      .includes(['details', 'values'])
      .limit(1000)
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      kapp: 'gbmembers',
      form: 'lead',
      search,
    });
    console.log('AllLeads # ' + submissions);
    yield put(actions.setLeads(submissions));
  } catch (error) {
    console.log('Error in fetchLeads: ' + util.inspect(error));
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
    const [submission, leadActivities] = yield all([
      call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'lead-activities',
        kapp: 'gbmembers',
        search: LEAD_ACTIVITIES_SEARCH,
      }),
    ]);

    if (action.payload.myThis) submission.myThis = action.payload.myThis;
    if (action.payload.history) submission.history = action.payload.history;
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
    submission.submission.emailsReceived = emailReceivedContent;
    submission.submission.emailsSent = emailSentContent;
    submission.submission.smsContent = smsContent;
    submission.submission.requestContent = requestContent;
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
      //action.payload.history.push("/LeadDetail/"+action.payload['id']);
      action.payload.history.push('/kapps/gbmembers/Leads');
    }
    if (action.payload.fetchLeads) action.payload.fetchLeads();
    if (action.payload.fetchLead)
      action.payload.fetchLead({
        id: action.payload['id'],
        myThis: action.payload.myThis,
      });
    console.log('updateCurrentLead # ' + submission);
    yield put(
      errorActions.addSuccess('Lead updated successfully', 'Update Lead'),
    );

    if (!action.payload.calendarEvent) {
      return;
    }

    var args = {
      space: appSettings.spaceSlug,
      summary: action.payload.calendarEvent.summary,
      description: action.payload.calendarEvent.description,
      location: action.payload.calendarEvent.location,
      attendeeEmail: action.payload.calendarEvent.attendeeEmail,
      startDateTime: action.payload.calendarEvent.startDateTime,
      endDateTime: action.payload.calendarEvent.endDateTime,
      timeZone: action.payload.calendarEvent.timeZone,
    };
    axios
      .post('https://gbbilling.com.au:8443/mail-handler' + createEventUrl, args)
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
      action.payload.history.push('/kapps/gbmembers/Leads');
    if (action.payload.fetchLeads) action.payload.fetchLeads();
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
    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Leads');
    if (action.payload.fetchLeads) action.payload.fetchLeads();
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
  yield takeEvery(types.FETCH_CURRENT_LEAD, fetchCurrentLead);
  yield takeEvery(types.UPDATE_LEAD, updateCurrentLead);
  yield takeEvery(types.CREATE_LEAD, createLead);
  yield takeEvery(types.DELETE_LEAD, deleteLead);
  yield takeEvery(types.FETCH_NEW_LEAD, fetchNewLead);
}

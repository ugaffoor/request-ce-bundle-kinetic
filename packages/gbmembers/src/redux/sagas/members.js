import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';
import $ from 'jquery';

import { types, actions } from '../modules/members';
import { getJson } from '../../components/Member/MemberUtils';
import axios from 'axios';
import moment from 'moment';
import { contact_date_format } from '../../components/leads/LeadsUtils';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';

export const ERROR_STATUS_STRING = 'There was a problem retrieving items.';
export const TOO_MANY_STATUS_STRING = 'Your filter matches too many items.';

export const USER_INCLUDES = 'details,attributes,profile.attributes';
export const SUBMISSION_INCLUDES =
  'details,values,attributes,form,children,children.details,children.form,children.values,form.attributes';

export const getAppSettings = state => state.member.app;
export const getCurrentMember = state => state.currentMember;
export const getNewMember = state => state.newMember;

const getBillingInfoUrl = '/billingInfo';
const getPaymentsUrl = '/payments';
const getOverduesUrl = '/overdues';
const getScheduledPaymentsUrl = '/scheduledPayments';
const ChangeScheduledAmountUrl = '/scheduledAmountChange';
const createScheduleUrl = '/createSchedule';
const clearScheduleUrl = '/clearSchedule';
const registerUserUrl = '/registerUser';
const updatePaymentMethodUrl = '/savePaymentMethod';
const refundTransactionUrl = '/refundTransaction';
const getNewCustomersUrl = '/newCustomers';
const ddrStatusUrl = '/getDDRStatus';
const actionRequestsUrl = '/getActionRequests';
const getVariationsUrl = '/getVariations';
const getRefundsUrl = '/getRefunds';
const getCustomersUrl = '/getCustomers';
const getInactiveCustomersCountUrl = '/getInactiveCustomersCount';
const activateBillerUrl = '/activateBiller';

const util = require('util');

export function* fetchMembers(action) {
  try {
    const appSettings = yield select(getAppSettings);

    let allSubmissions = [];
    let nextPageTokenValue;

    let memberLastFetchTime =
      action.payload !== undefined &&
      action.payload.memberLastFetchTime !== undefined
        ? action.payload.memberLastFetchTime
        : undefined;

    if (!action.payload.memberInitialLoadComplete) {
      let searchCurrent = new CoreAPI.SubmissionSearch()
        .includes([
          'details',
          'values[Member ID],values[Status],values[Status History],values[First Name],values[Last Name],values[Gender]' +
            ',values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number],values[Last Promotion],values[Photo]' +
            ',values[Alternate Barcode],values[Address],values[Suburb],values[Country],values[State]' +
            ',values[Postcode],values[Date Joined],values[DOB],values[Member Type]' +
            ',values[Opt-Out],values[Emergency Contact Name],values[Emergency Contact Phone],values[Emergency Contact Relationship]' +
            ',values[Medical Allergies],values[Ranking Program],values[Ranking Belt],values[Belt Size],values[Attendance Count]' +
            ',values[Additional Program 1],values[Additional Program 2],values[Non Paying]' +
            ',values[Billing Customer Reference],values[Billing Parent Member],values[Lead Source]' +
            ',values[Billing User],values[Billing Customer Id],values[Billing Setup Fee Id],values[Billing Start Date]' +
            ',values[Billing Payment Period],values[Billing Payment Type],values[Billing Cash Term Start Date]' +
            ',values[Billing Cash Term End Date],values[Credit Card Expiry Year],values[Credit Card Expiry Month],values[Billing Members]' +
            ',values[Billing Family Members],values[Biller Migrated],values[Payment]' +
            ',values[Membership Cost],values[Family Fee Details],values[Resume Date]' +
            ',values[Last Attendance Date],values[Is New Reply Received],values[Waiver Complete Date]' +
            ',values[useSubAccount],values[POS Profile ID],values[Fee Program],values[Parent or Guardian]' +
            ',values[Emails Sent Count],values[Max Weekly Classes],values[Reminder Date]' +
            ',values[Emails Received Count],values[Is New Reply Received],values[SMS Sent Count],values[SMS Received Count]' +
            ',values[Payment Method],values[Lead Submission ID],values[Send Payment Receipt]' +
            ',values[Billing Period],values[Admin Fee],values[Last Payment Date]',
        ])

        /*        
        .includes(['details', ''+
        ',values[Next Schedule Promotion]'+
        ',values[Billing Setup Fee Type]'+
        ',values[Billing First Name],values[Billing Last Name],values[Billing Email]'+
        ',values[Billing Phone Number],values[Billing Address],values[Billing Suburb],values[Billing State]'+
        ',values[Billing Postcode]'+
        ',values[Credit Card Expiry Year],values[Credit Card Expiry Month],values[Billing Members]'+
        ',values[Family Member Order]'+
        ',values[Payment Schedule]'+
        ',values[Refunded Payments],values[DDR Status],values[Membership TAX 1]'+
        ',values[Membership TAX 2],values[Membership TAX 3],values[Main Benefits]'+
        ',values[First Payment]'+
        ',values[Setup Fee]'+
        ',values[Lead History],values[Member Changes],values[Billing Changes]'+
        ',values[Mother Covid Check],values[Father Covid Check]'])
*/

        //    .includes(['details', 'values[Member ID],values[First Name],values[Last Name],values[Status],values[Gender],values[Date Joined],values[DOB],values[Ranking Program],values[Ranking Belt],values[Status History],values[Billing Parent Member],values[Billing User],values[Non Paying],values[Billing Customer Id],values[Billing Customer Reference],values[Billing Migrated],values[Lead Submission ID],values[Billing Payment Period]'])
        //.includes(['details', 'values'])
        .sortBy('updatedAt')
        .limit(1000)
        .build();

      const [submissions] = yield all([
        call(CoreAPI.searchSubmissions, {
          form: 'member',
          kapp: 'gbmembers',
          search: searchCurrent,
        }),
      ]);
      nextPageTokenValue = submissions.nextPageToken;
      allSubmissions = allSubmissions.concat(submissions.submissions);

      while (nextPageTokenValue) {
        let search2 = new CoreAPI.SubmissionSearch()
          .includes([
            'details',
            'values[Member ID],values[Status],values[Status History],values[First Name],values[Last Name],values[Gender]' +
              ',values[Email],values[Additional Email],values[Phone Number],values[Additional Phone Number],values[Last Promotion],values[Photo]' +
              ',values[Alternate Barcode],values[Address],values[Suburb],values[Country],values[State]' +
              ',values[Postcode],values[Date Joined],values[DOB],values[Member Type]' +
              ',values[Opt-Out],values[Emergency Contact Name],values[Emergency Contact Phone],values[Emergency Contact Relationship]' +
              ',values[Medical Allergies],values[Ranking Program],values[Ranking Belt],values[Belt Size],values[Attendance Count]' +
              ',values[Additional Program 1],values[Additional Program 2],values[Non Paying]' +
              ',values[Billing Customer Reference],values[Billing Parent Member],values[Lead Source]' +
              ',values[Billing User],values[Billing Customer Id],values[Billing Setup Fee Id],values[Billing Start Date]' +
              ',values[Billing Payment Period],values[Billing Payment Type],values[Billing Cash Term Start Date]' +
              ',values[Billing Cash Term End Date],values[Credit Card Expiry Year],values[Credit Card Expiry Month],values[Billing Members]' +
              ',values[Billing Family Members],values[Biller Migrated],values[Payment]' +
              ',values[Membership Cost],values[Family Fee Details],values[Resume Date]' +
              ',values[Last Attendance Date],values[Is New Reply Received],values[Waiver Complete Date]' +
              ',values[useSubAccount],values[POS Profile ID],values[Fee Program],values[Parent or Guardian]' +
              ',values[Emails Sent Count],values[Max Weekly Classes],values[Reminder Date]' +
              ',values[Emails Received Count],values[Is New Reply Received],values[SMS Sent Count],values[SMS Received Count]' +
              ',values[Payment Method],values[Lead Submission ID],values[Send Payment Receipt]' +
              ',values[Billing Period],values[Admin Fee],values[Last Payment Date]',
          ])

          //  .includes(['details', 'values[Member ID],values[First Name],values[Last Name],values[Status],values[Gender],values[Date Joined],values[DOB],values[Ranking Program],values[Ranking Belt],values[Status History],values[Billing Parent Member],values[Billing User],values[Non Paying],values[Billing Customer Id],values[Billing Customer Reference],values[Billing Migrated],values[Lead Submission ID],values[Billing Payment Period]'])
          //    .includes(['details', 'values'])
          .sortBy('updatedAt')
          .limit(1000)
          .pageToken(nextPageTokenValue)
          .build();

        const [submissions] = yield all([
          call(CoreAPI.searchSubmissions, {
            form: 'member',
            kapp: 'gbmembers',
            search: search2,
          }),
        ]);
        allSubmissions = allSubmissions.concat(submissions.submissions);
        nextPageTokenValue = submissions.nextPageToken;
      }
    }

    if (
      action.payload.memberInitialLoadComplete &&
      memberLastFetchTime !== undefined &&
      !action.payload.loadMemberNotes
    ) {
      let searchCurrent = new CoreAPI.SubmissionSearch()
        //  .includes(['details', 'values[Member ID],values[First Name],values[Last Name],values[Status],values[Status History],values[Billing Parent Member],values[Billing User],values[Non Paying],values[Billing Customer Id],values[Billing Customer Reference],values[Billing Migrated]'])
        .includes(['details', 'values'])
        .sortBy('updatedAt')
        .limit(1000);
      searchCurrent = searchCurrent.startDate(
        moment(memberLastFetchTime).toDate(),
      );
      searchCurrent = searchCurrent.build();

      const [submissions] = yield all([
        call(CoreAPI.searchSubmissions, {
          form: 'member',
          kapp: 'gbmembers',
          search: searchCurrent,
        }),
      ]);
      allSubmissions = allSubmissions.concat(submissions.submissions);
      nextPageTokenValue = 'LAST_FETCH';
    }

    if (
      action.payload.memberInitialLoadComplete &&
      action.payload.loadMemberNotes
    ) {
      let searchCurrent = new CoreAPI.SubmissionSearch()
        .includes(['details', 'values'])
        .sortBy('updatedAt')
        .limit(1000)
        .build();

      const [submissions] = yield all([
        call(CoreAPI.searchSubmissions, {
          form: 'member',
          kapp: 'gbmembers',
          search: searchCurrent,
        }),
      ]);
      nextPageTokenValue = submissions.nextPageToken;
      allSubmissions = allSubmissions.concat(submissions.submissions);

      while (nextPageTokenValue) {
        let search2 = new CoreAPI.SubmissionSearch()
          .includes(['details', 'values'])
          .sortBy('updatedAt')
          .limit(1000)
          .pageToken(nextPageTokenValue)
          .build();

        const [submissions] = yield all([
          call(CoreAPI.searchSubmissions, {
            form: 'member',
            kapp: 'gbmembers',
            search: search2,
          }),
        ]);
        allSubmissions = allSubmissions.concat(submissions.submissions);
        nextPageTokenValue = submissions.nextPageToken;
      }
    }

    let usersResult;
    if (!action.payload.memberInitialLoadComplete) {
      const [users] = yield all([
        call(CoreAPI.fetchUsers, {
          include: ['details'],
          limit: 1000,
        }),
      ]);
      usersResult = users.users;
    }
    let memberInfo = {
      members: allSubmissions,
      belts: appSettings.belts,
      users: usersResult,
      nextPageToken: nextPageTokenValue,
      loadMemberNotes:
        action.payload.loadMemberNotes !== undefined
          ? action.payload.loadMemberNotes
          : false,
    };
    yield put(actions.setMembers(memberInfo));
  } catch (error) {
    console.log('Error in fetchMembers: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchCurrentMember(action) {
  try {
    const appSettings = yield select(getAppSettings);
    const [submission] = yield all([
      call(CoreAPI.fetchSubmission, {
        id: action.payload.id,
        include: SUBMISSION_INCLUDES,
      }),
    ]);
    let fetchedUser = undefined;
    if (
      action.payload.allMembers !== undefined &&
      action.payload.allMembers.length === 0
    ) {
      const [user] = yield all([
        call(CoreAPI.fetchUser, {
          username: submission.submission.values['Member ID'],
          include: ['details'],
        }),
      ]);
      fetchedUser = user;
    }
    if (action.payload.myThis) submission.myThis = action.payload.myThis;
    if (action.payload.history)
      submission.submission.history = action.payload.history;
    if (action.payload.forBilling)
      submission.forBilling = action.payload.forBilling;

    if (action.payload.setInitialLoad) {
      console.log('members.js setInitialLoad 111');
    }

    if (submission.submission.values['Lead Submission ID'] !== undefined) {
      const LEAD_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
        .eq(
          'values[Lead ID]',
          submission.submission.values['Lead Submission ID'],
        )
        .include(['details', 'values'])
        .limit(1000)
        .build();
      const [leadActivities] = yield all([
        call(CoreAPI.searchSubmissions, {
          form: 'lead-activities',
          kapp: 'gbmembers',
          search: LEAD_ACTIVITIES_SEARCH,
        }),
      ]);

      let leadRequestContent = [];
      for (let i = 0; i < leadActivities.submissions.length; i++) {
        if (
          leadActivities.submissions[i].values['Type'] === 'Request' &&
          leadActivities.submissions[i].values['Direction'] === 'Inbound'
        ) {
          leadRequestContent[leadRequestContent.length] = JSON.parse(
            leadActivities.submissions[i].values['Content'],
          );
        }
      }
      submission.submission.leadRequestContent = leadRequestContent;
    } else {
      submission.submission.leadRequestContent = undefined;
    }

    if (action.payload.myThis)
      submission.submission.myThis = action.payload.myThis;

    let memberInfo = {
      member: submission.submission,
      belts: appSettings.belts,
      user: fetchedUser,
    };
    if (action.payload.billingService === 'XXBambora') {
      var nextStartDate = moment(
        submission.submission.values['Billing Start Date'],
        'YYYY-MM-DD',
      );
      if (nextStartDate.isBefore(moment())) {
        var billingPeriod = submission.submission.values['Billing Period'];
        var period = 'weeks';
        var periodVal = 2;
        if (billingPeriod === 'Daily') {
          period = 'days';
          periodVal = 1;
        } else if (billingPeriod === 'Weekly') {
          period = 'days';
          periodVal = 7;
        } else if (billingPeriod === 'Fortnightly') {
          period = 'days';
          periodVal = 14;
        } else if (billingPeriod === 'Monthly') {
          period = 'months';
          periodVal = 1;
        } else if (billingPeriod === 'Quarterly') {
          period = 'months';
          periodVal = 3;
        } else if (billingPeriod === '4 Months') {
          period = 'months';
          periodVal = 4;
        } else if (billingPeriod === '6 Months') {
          period = 'months';
          periodVal = 6;
        } else if (billingPeriod === 'Yearly') {
          period = 'years';
          periodVal = 1;
        }
        var nextBillingDate = undefined;
        if (billingPeriod === 'Daily') {
          nextBillingDate = moment(
            submission.submission.values['Billing Start Date'],
            'YYYY-MM-DD',
          ).add(
            moment().diff(
              moment(
                submission.submission.values['Billing Start Date'],
                'YYYY-MM-DD',
              ),
              period,
            ),
            period,
          );
        } else {
          nextBillingDate = moment(
            submission.submission.values['Billing Start Date'],
            'YYYY-MM-DD',
          ).add(periodVal, period);
        }
        if (billingPeriod === 'Fortnightly') {
          var days = moment().diff(
            moment(
              submission.submission.values['Billing Start Date'],
              'YYYY-MM-DD',
            ),
            'days',
          );
          var rem = days % 14;
          if (rem !== 0) {
            days = days - rem + 14;
          }
          nextBillingDate = moment(
            submission.submission.values['Billing Start Date'],
            'YYYY-MM-DD',
          ).add(days, 'days');
        }
      } else {
        nextBillingDate = nextStartDate;
      }
      yield put(
        actions.setBillingInfo({
          statusCode: submission.submission.values['Status'],
          statusDescription: submission.submission.values['Status'],
          addressLine1: submission.submission.values['Address'],
          addressPostCode: submission.submission.values['Postcode'],
          addressState: submission.submission.values['State'],
          addressSuburb: submission.submission.values['Suburb'],
          customerFirstName: submission.submission.values['First Name'],
          customerName: submission.submission.values['Last Name'],
          email: submission.submission.values['Email'],
          customerBillingId:
            submission.submission.values['Billing Customer Id'],
          mobilePhone: submission.submission.values['Phone Number'],
          nextBillingDate: nextBillingDate,
          paymentMethod: submission.submission.values['Billing Payment Type'],
          paymentPeriod: submission.submission.values['Billing Period'],
          customerReference:
            submission.submission.values['Billing Customer Reference'],
          cardOnFileID: submission.submission.values['POS Profile ID'],
          paymentAmountInCents:
            parseFloat(submission.submission.values['Payment'], 2) * 100,
          billingSetupFeeId:
            submission.submission.values['Billing Setup Fee Id'],
          billingSetupFeeType:
            submission.submission.values['Billing Setup Fee Type'],
        }),
      );
    }
    yield put(actions.setCurrentMember(memberInfo));
  } catch (error) {
    console.log('Error in fetchCurrentMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchCurrentMemberAdditional(action) {
  try {
    const MEMBER_POS_SEARCH = new CoreAPI.SubmissionSearch(true)
      .index('values[Person ID]')
      .eq('values[Person ID]', action.payload.id)
      .include(['details', 'values'])
      .sortDirection('DESC')
      .limit(100)
      .build();

    var mIdx = action.payload.allMembers.findIndex(
      member => action.payload.id === member.id,
    );

    const LEAD_POS_SEARCH = new CoreAPI.SubmissionSearch(true)
      .index('values[Person ID]')
      .eq(
        'values[Person ID]',
        mIdx !== -1
          ? action.payload.allMembers[mIdx].values['Lead Submission ID']
          : 'XX',
      )
      .include(['details', 'values'])
      .sortDirection('DESC')
      .limit(100)
      .build();
    const MEMBER_FILES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .index('values[Member ID]')
      .eq('values[Member ID]', action.payload.id)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const MEMBER_ADDITIONAL_SERVICES = new CoreAPI.SubmissionSearch(true)
      .index('values[Member GUID]')
      .eq('values[Member GUID]', action.payload.id)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member ID]', action.payload.id)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const REMOTE_REGISTRATION_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member GUID]', action.payload.id)
      .include(['details', 'values'])
      .sortDirection('DESC')
      .limit(1000)
      .build();
    const [
      memberActivities,
      memberFilesSubmissions,
      posOrderSubmissions,
      posLeadOrderSubmissions,
      posPurchasedItems,
      remoteRegistrationSubmissions,
    ] = yield all([
      call(CoreAPI.searchSubmissions, {
        form: 'member-activities',
        kapp: 'gbmembers',
        search: MEMBER_ACTIVITIES_SEARCH,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'member-files',
        search: MEMBER_FILES_SEARCH,
        datastore: true,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'pos-order',
        search: MEMBER_POS_SEARCH,
        datastore: true,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'pos-order',
        search: LEAD_POS_SEARCH,
        datastore: true,
      }),
      call(CoreAPI.searchSubmissions, {
        form: 'pos-purchased-item',
        search: MEMBER_POS_SEARCH,
        datastore: true,
      }),
      call(CoreAPI.searchSubmissions, {
        form:
          action.payload.billingService.toLowerCase().replace(' ', '-') +
          '-remote-registration',
        kapp: 'services',
        search: REMOTE_REGISTRATION_SEARCH,
      }),
    ]);

    let additionalServices = [];

    if (action.payload.billingService === 'Bambora') {
      const [memberAdditionalServices] = yield all([
        call(CoreAPI.searchSubmissions, {
          form:
            action.payload.billingService === 'Bambora'
              ? 'bambora-member-additional-services'
              : 'member-additional-services',
          search: MEMBER_ADDITIONAL_SERVICES,
          datastore: true,
        }),
      ]);
      if (action.payload.billingService === 'Bambora') {
        for (let i = 0; i < memberAdditionalServices.submissions.length; i++) {
          var len = additionalServices.length;
          additionalServices[len] =
            memberAdditionalServices.submissions[i].values;
          additionalServices[len]['id'] =
            memberAdditionalServices.submissions[i]['id'];
        }
      }
    }

    // Add Email Sent/Recieved submissions
    let emailSentContent = [];
    let emailReceivedContent = [];
    let smsContent = [];
    let requestContent = [];
    let promotionContent = [];
    for (let i = 0; i < memberActivities.submissions.length; i++) {
      if (
        memberActivities.submissions[i].values['Type'] === 'Email' &&
        memberActivities.submissions[i].values['Direction'] === 'Outbound'
      ) {
        emailSentContent[emailSentContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
      }
      if (
        memberActivities.submissions[i].values['Type'] === 'Email' &&
        memberActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        emailReceivedContent[emailReceivedContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
        emailReceivedContent[emailReceivedContent.length - 1]['Activity ID'] =
          memberActivities.submissions[i].id;
      }
      if (memberActivities.submissions[i].values['Type'] === 'SMS') {
        smsContent[smsContent.length] = memberActivities.submissions[i];
      }
      if (
        memberActivities.submissions[i].values['Type'] === 'Request' &&
        memberActivities.submissions[i].values['Direction'] === 'Inbound'
      ) {
        requestContent[requestContent.length] = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
      }
      if (memberActivities.submissions[i].values['Type'] === 'Promotion') {
        var content = JSON.parse(
          memberActivities.submissions[i].values['Content'],
        );
        content['Submitter'] = memberActivities.submissions[i].updatedBy;
        promotionContent[promotionContent.length] = content;
      }
    }
    let posOrders = [];
    for (let i = 0; i < posOrderSubmissions.submissions.length; i++) {
      var len = posOrders.length;
      posOrders[len] = posOrderSubmissions.submissions[i].values;
      posOrders[len]['id'] = posOrderSubmissions.submissions[i]['id'];
    }
    for (let i = 0; i < posLeadOrderSubmissions.submissions.length; i++) {
      var len = posOrders.length;
      posOrders[len] = posLeadOrderSubmissions.submissions[i].values;
      posOrders[len]['id'] = posLeadOrderSubmissions.submissions[i]['id'];
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

    let receiptSubmissionIDs = [];
    for (let i = 0; i < requestContent.length; i++) {
      if (
        requestContent[i].Form.includes('Registration') ||
        requestContent[i].Form.includes('Sign Up Fee') ||
        requestContent[i].Form.includes('Member Self Sign Up')
      ) {
        let id = requestContent[i].url.split('/')[
          requestContent[i].url.split('/').length - 2
        ];
        receiptSubmissionIDs[receiptSubmissionIDs.length] = id;
      }
    }
    for (let i = 0; i < posOrderSubmissions.submissions.length; i++) {
      let id = posOrderSubmissions.submissions[i].id;
      if (receiptSubmissionIDs.length < 30) {
        receiptSubmissionIDs[receiptSubmissionIDs.length] = id;
      }
    }

    if (receiptSubmissionIDs.length === 0) {
      receiptSubmissionIDs[0] = 'XX';
    }
    const RECEIPT_SENDER_SEARCH = new CoreAPI.SubmissionSearch(true)
      .index('values[Submission ID]')
      .in('values[Submission ID]', receiptSubmissionIDs)
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const [receiptSenderSubmissions] = yield all([
      call(CoreAPI.searchSubmissions, {
        form: 'receipt-sender',
        search: RECEIPT_SENDER_SEARCH,
        datastore: true,
      }),
    ]);

    for (let i = 0; i < requestContent.length; i++) {
      var id = requestContent[i].url.split('/')[
        requestContent[i].url.split('/').length - 2
      ];
      for (let x = 0; x < receiptSenderSubmissions.submissions.length; x++) {
        if (
          receiptSenderSubmissions.submissions[x].values['Submission ID'] === id
        ) {
          if (requestContent[i].receiptSender === undefined) {
            requestContent[i].receiptSender = [];
          }
          requestContent[i].receiptSender[
            requestContent[i].receiptSender.length
          ] = moment(receiptSenderSubmissions.submissions[x].createdAt);
        }
      }
    }
    for (let i = 0; i < posOrders.length; i++) {
      let id = posOrders[i].id;
      for (let x = 0; x < receiptSenderSubmissions.submissions.length; x++) {
        if (
          receiptSenderSubmissions.submissions[x].values['Submission ID'] === id
        ) {
          if (posOrders[i].receiptSender === undefined) {
            posOrders[i].receiptSender = [];
          }
          posOrders[i].receiptSender[
            posOrders[i].receiptSender.length
          ] = moment(receiptSenderSubmissions.submissions[x].createdAt);
        }
      }
    }

    let memberFiles = [];
    for (let i = 0; i < memberFilesSubmissions.submissions.length; i++) {
      memberFiles[memberFiles.length] = memberFilesSubmissions.submissions[i];
    }
    let posItems = [];
    for (let i = 0; i < posPurchasedItems.submissions.length; i++) {
      len = posItems.length;
      posItems[len] = posPurchasedItems.submissions[i].values;
      posItems[len]['id'] = posPurchasedItems.submissions[i]['id'];
    }

    let memberInfo = {
      emailsReceived: emailReceivedContent,
      emailsSent: emailSentContent,
      smsContent: smsContent,
      requestContent: requestContent,
      promotionContent: promotionContent,
      memberFiles: memberFiles,
      posOrders: posOrders,
      posItems: posItems,
      additionalServices: additionalServices,
      remoteRegistrationForm:
        remoteRegistrationSubmissions.submissions.length > 0
          ? remoteRegistrationSubmissions.submissions[0]
          : undefined,
    };
    yield put(actions.setCurrentMemberAdditional(memberInfo));
  } catch (error) {
    console.log('Error in setCurrentMemberAdditional: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchMemberPromotions(action) {
  try {
    const MEMBER_ACTIVITIES_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member ID]', action.payload.id)
      .eq('values[Type]', 'Promotion')
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member-activities',
      kapp: 'gbmembers',
      search: MEMBER_ACTIVITIES_SEARCH,
    });

    let promotionContent = [];
    for (let i = 0; i < submissions.length; i++) {
      if (submissions[i].values['Type'] === 'Promotion') {
        var content = JSON.parse(submissions[i].values['Content']);
        content['Submitter'] = submissions[i].updatedBy;
        promotionContent[promotionContent.length] = content;
      }
    }

    action.payload.setMemberPromotions(promotionContent);
  } catch (error) {
    console.log('Error in fetchMemberPromotions: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchNewMember(action) {
  var member = {
    values: {},
  };
  yield put(actions.setNewMember(member));
  console.log('fetchNewMember:' + member);
  /*  if (action.payload.myThis) member.myThis = action.payload.myThis;
  if (action.payload.history) member.history = action.payload.history;
  if (action.payload.fetchMembers)
    member.fetchMembers = action.payload.fetchMembers;
  if (action.payload.allMembers) member.allMembers = action.payload.allMembers;*/
}

export function* updateCurrentMember(action) {
  console.log('In updateCurrentMember');
  try {
    var values =
      action.payload.values !== undefined
        ? action.payload.values
        : action.payload.memberItem.values;

    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.id,
      values: values,
    });
    if (action.payload.emailChanged) {
      let user = {
        email: action.payload.memberItem.values['Email'],
      };
      const { userUpdate } = yield call(CoreAPI.updateUser, {
        username: action.payload.memberItem.values['Member ID'],
        user: user,
      });
    }
    if (
      action.payload.history &&
      action.payload.fromTasks === undefined &&
      action.payload.fromBilling === undefined
    ) {
      action.payload.history.push(
        '/kapps/gbmembers/Member/' + action.payload.id,
      );
    }
    if (action.payload.history && action.payload.fromTasks)
      action.payload.history.push('/kapps/gbmembers/Leads');
    if (action.payload.fetchMembers) action.payload.fetchMembers();
    if (action.payload.fetchMember)
      action.payload.fetchMember({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    if (action.payload.fetchMemberAdditional)
      action.payload.fetchMemberAdditional({
        id: action.payload.id,
        myThis: action.payload.myThis,
      });
    yield put(
      actions.memberSaved({
        allMembers: action.payload.allMembers,
        memberItem: action.payload.memberItem,
      }),
    );

    console.log(
      'updateCurrentMember:' + action.payload.memberItem.values['Member ID'],
    );
    yield put(
      errorActions.addSuccess('Member updated successfully', 'Update Member'),
    );
  } catch (error) {
    console.log('Error in updateCurrentMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* createMember(action) {
  try {
    action.payload.memberItem.myThis = undefined;
    action.payload.memberItem.history = undefined;
    action.payload.memberItem.fetchMembers = undefined;
    if (
      action.payload.leadItem !== undefined &&
      action.payload.leadItem.values !== undefined &&
      action.payload.leadItem.values['Source'] !== undefined
    )
      action.payload.memberItem.values['Lead Source'] =
        action.payload.leadItem.values['Source'];
    const { submission } = yield call(CoreAPI.createSubmission, {
      kappSlug: 'gbmembers',
      formSlug: 'member',
      values: action.payload.memberItem.values,
      completed: false,
      include: SUBMISSION_INCLUDES,
    });

    //if leadId is present then the lead is being converted into a member
    if (action.payload.leadId) {
      action.payload.leadItem.values['Status'] = 'Converted';
      action.payload.leadItem.values['Lead State'] = 'Converted';
      action.payload.leadItem.values['Converted Member ID'] = submission.id;
      action.payload.updateLead({
        id: action.payload.leadItem['id'],
        leadItem: action.payload.leadItem,
        allLeads: action.payload.allLeads,
      });
    }

    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Member/' + submission.id);
    if (action.payload.fetchMembers) {
      action.payload.fetchMembers({
        membersNextPageToken: action.payload.membersNextPageToken,
        memberInitialLoadComplete: action.payload.memberInitialLoadComplete,
        memberLastFetchTime: action.payload.memberLastFetchTime,
      });
    }
    if (
      action.payload.showNotification === undefined ||
      action.payload.showNotification !== false
    ) {
      yield put(
        errorActions.addSuccess('Member created successfully', 'Create Member'),
      );
    }
  } catch (error) {
    console.log('Error in createMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteMember(action) {
  try {
    var values = {
      Status: 'Deleted',
    };

    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.memberItem.id,
      values: values,
    });

    if (action.payload.history)
      action.payload.history.push('/kapps/gbmembers/Home');
    let mIdx = action.payload.allMembers.findIndex(
      member => member.id === action.payload.memberItem.id,
    );
    action.payload.allMembers.splice(mIdx, 1);

    actions.memberDeleted({
      allMembers: action.payload.allMembers,
    });

    yield put(
      errorActions.addSuccess('Member deleted successfully', 'Delete Member'),
    );
  } catch (error) {
    console.log('Error in deleteMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* deleteMemberFile(action) {
  try {
    const { submission } = yield call(CoreAPI.deleteSubmission, {
      id: action.payload.id,
      datastore: true,
    });

    yield put(
      errorActions.addSuccess(
        'Member File deleted successfully',
        'Delete Member File',
      ),
    );
  } catch (error) {
    console.log('Error in deleteMemberFile: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchBillingInfo(action) {
  if (
    action.payload.billingRef === undefined ||
    action.payload.billingRef === ''
  ) {
    yield put(actions.setBillingInfo({}));
  } else {
    const appSettings = yield select(getAppSettings);
    var args = {
      customerId: action.payload.billingRef,
      space: appSettings.spaceSlug,
      billingService: appSettings.billingCompany,
      useSubAccount: action.payload.useSubAccount,
    };
    axios
      .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          console.log(result.data.errorMessage);
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Billing Info',
          );
        } else {
          if (action.payload.updateBillingInfo !== undefined) {
            action.payload.updateBillingInfo(result.data.data);
          }
          action.payload.setBillingInfo(result.data.data);
        }
      })
      .catch(error => {
        console.log(error.response);
        //action.payload.setSystemError(error);
      });
    yield put(actions.setDummy());
  }
}

export function* fetchBillingInfoAfterRegistration(action) {
  if (
    action.payload.billingRef === undefined ||
    action.payload.billingRef === ''
  ) {
    yield put(actions.setBillingInfo({}));
  } else {
    const appSettings = yield select(getAppSettings);
    var args = {
      customerId: action.payload.billingRef,
      space: appSettings.spaceSlug,
      billingService: appSettings.billingCompany,
    };
    console.log('action:' + action.payload);
    axios
      .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
      .then(result => {
        if (result.data.error && result.data.error > 0) {
          console.log(result.data.errorMessage);
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Billing Info After Registration',
          );
        } else {
          action.payload.setBillingInfo(result.data.data);
          // Update memberItem values from billingInfo
          action.payload.memberItem.values['Billing Customer Reference'] =
            result.data.data.customerReference;
          action.payload.memberItem.values['Billing Customer Id'] =
            result.data.data.customerBillingId;
          action.payload.memberItem.values['Billing Payment Type'] =
            result.data.data.paymentMethod;
          action.payload.memberItem.values['Billing Payment Period'] =
            result.data.data.paymentPeriod;
          action.payload.memberItem.values['Payment Schedule'] = {
            period: 'Fortnightly',
            amount: result.data.data.paymentAmountInCents / 100,
          };

          let changes = getBillingChanges(action.payload.memberItem);
          changes.push({
            date: moment().format(contact_date_format),
            user: appSettings.profile.username,
            action: 'Setup Billing',
            from: null,
            to:
              'Setup Member Billing with payments of [' +
              result.data.data.paymentAmountInCents / 100 +
              ']',
          });
          action.payload.memberItem.values['Billing Changes'] = changes;

          action.payload.updateMember({
            id: action.payload.memberItem.id,
            memberItem: action.payload.memberItem,
            myThis: action.payload.memberItem.myThis,
            fetchMember: action.payload.fetchCurrentMember,
          });
        }
      })
      .catch(error => {
        console.log(error.response);
        //action.payload.setSystemError(error);
      });
    yield put(actions.setDummy());
  }
}

export function* syncBillingCustomer(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    customerId: action.payload.billingRef,
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    useSubAccount: action.payload.useSubAccount,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getBillingInfoUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Sync Billing Customer',
        );
      } else {
        action.payload.setBillingInfo(result.data.data);
        // Update memberItem values from billingInfo
        action.payload.memberItem.values['Billing Customer Reference'] =
          result.data.data.customerReference;
        action.payload.memberItem.values['Billing Customer Id'] =
          result.data.data.customerBillingId;
        action.payload.memberItem.values['Billing User'] = 'YES';
        action.payload.memberItem.values['Billing Payment Type'] =
          result.data.data.paymentMethod;
        action.payload.memberItem.values['Billing Payment Period'] =
          result.data.data.paymentPeriod;
        action.payload.memberItem.values['Payment Schedule'] = {
          period: result.data.data.paymentPeriod,
          amount: result.data.data.paymentAmountInCents / 100,
        };
        action.payload.memberItem.values['Membership Cost'] =
          result.data.data.paymentAmountInCents / 100;

        if (
          action.payload.memberItem.values['DOB'] !== null &&
          action.payload.memberItem.values['DOB'].indexOf('-') === 2
        ) {
          action.payload.memberItem.values['DOB'] = result.data.data.dob;
        }
        if (
          action.payload.memberItem.values['Date Joined'] === undefined ||
          action.payload.memberItem.values['Date Joined'] === null
        ) {
          action.payload.memberItem.values['Date Joined'] =
            result.data.data.contractStartDate;
        }

        if (
          result.data.data.statusDescription === 'Inactive' &&
          action.payload.memberItem.values['Status'] !== 'Inactive'
        ) {
          action.payload.memberItem.values['Status'] = 'Inactive';
          let history = getJson(
            action.payload.memberItem.values['Status History'],
          );
          let newHistory = {
            submitter: appSettings.profile.displayName,
            date: moment().toString(),
            status: 'Inactive',
          };
          history.push(newHistory);
          action.payload.memberItem.values['Status History'] = history;
        }
        if (
          result.data.data.statusDescription === 'Frozen' &&
          action.payload.memberItem.values['Status'] !== 'Frozen'
        ) {
          action.payload.memberItem.values['Status'] = 'Frozen';
          let history = getJson(
            action.payload.memberItem.values['Status History'],
          );
          let newHistory = {
            submitter: appSettings.profile.displayName,
            date: moment().toString(),
            status: 'Frozen',
          };
          history.push(newHistory);
          action.payload.memberItem.values['Status History'] = history;
        }
        if (
          result.data.data.statusDescription === 'Active' &&
          action.payload.memberItem.values['Status'] !== 'Active'
        ) {
          action.payload.memberItem.values['Status'] = 'Active';
          let history = getJson(
            action.payload.memberItem.values['Status History'],
          );
          let newHistory = {
            submitter: appSettings.profile.displayName,
            date: moment().toString(),
            status: 'Active',
          };
          history.push(newHistory);
          action.payload.memberItem.values['Status History'] = history;
        }
        //        action.payload.memberItem.values['DDR Status'] = 'Pending';
        if (result.data.data.fromSubAccount) {
          action.payload.memberItem.values['useSubAccount'] = 'YES';
        }

        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Sync Billing Customer',
          from: null,
          to:
            'Synced Member Billing with payments of [' +
            result.data.data.paymentAmountInCents / 100 +
            ']',
        });
        action.payload.memberItem.values['Billing Changes'] = changes;

        action.payload.updateMember({
          id: action.payload.memberItem.id,
          memberItem: action.payload.memberItem,
          allMembers: action.payload.allMembers,
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Billing customer synced successfully',
          'Sync Billing Customer',
        );
        let memberInfo = {
          member: action.payload.memberItem,
          belts: appSettings.belts,
        };
        action.setCurrentMember(memberInfo);

        /*        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.fetchMembers();
*/
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* fetchNewCustomers(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getNewCustomersUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get New Customers',
        );
      } else {
        action.payload.setNewCustomers(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* editPaymentAmount(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    customerId: action.payload.billingRef,
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    changeFromPaymentNumber: action.payload.changeFromPaymentNumber,
    changeFromDate: action.payload.changeFromDate,
    newPaymentAmountInCents: action.payload.newPaymentAmountInCents,
    applyToAllFuturePayments: action.payload.applyToAllFuturePayments,
    keepManualPayments: action.payload.keepManualPayments,
    scheduleStartDate: action.payload.scheduleStartDate,
    scheduleResumeDate: action.payload.scheduleResumeDate,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + ChangeScheduledAmountUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Edit Payment Amount',
        );
      } else {
        console.log('ChangeScheduledAmount result =' + result.data.data);
        if (action.payload.billingChangeReason) {
          let changes = getBillingChanges(action.payload.memberItem);
          changes.push({
            date: moment().format(contact_date_format),
            user: appSettings.profile.username,
            action: 'Change Payment Amount',
            to:
              'Payment amount changed to [' +
              action.payload.memberItem.values['Membership Cost'] +
              ']',
            reason: action.payload.billingChangeReason,
          });
          action.payload.memberItem.values['Billing Changes'] = changes;
          action.payload.updateMember({
            id: action.payload.memberItem.id,
            memberItem: action.payload.memberItem,
          });
        }
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment amount edited successfully',
          'Edit Payment Amount',
        );
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}

export function* fetchPaymentHistory(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
    customerId: action.payload.billingRef,
    internalPaymentType: action.payload.internalPaymentType,
    timezone: action.payload.timezone,
    useSubAccount: action.payload.useSubAccount,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Payment History',
        );
      } else {
        if (appSettings.billingCompany === 'Bambora') {
          let paymentsData = result.data.data;
          args = {};
          args.space = appSettings.spaceSlug;
          args.billingService = appSettings.billingCompany;
          args.dateFrom = action.payload.dateFrom;
          args.dateTo = action.payload.dateTo;
          args.customerId = action.payload.billingRef;
          args.timezoneOffset = null;
          args.timezone = action.payload.timezone;

          axios
            .post(appSettings.kineticBillingServerUrl + getRefundsUrl, args)
            .then(result => {
              if (result.data.error && result.data.error > 0) {
                console.log(
                  'fetchCustomerRefunds 2 Error: ' + result.data.errorMessage,
                );
                if (action.payload.addNotification) {
                  action.payload.addNotification(
                    NOTICE_TYPES.ERROR,
                    result.data.errorMessage,
                    'Get Customer Refunds',
                  );
                }
              } else {
                action.payload.setPaymentHistory({
                  paymentType: action.payload.paymentType,
                  data: result.data.data.concat(paymentsData),
                  dateFrom: action.payload.dateFrom,
                  dateTo: action.payload.dateTo,
                });
              }
            })
            .catch(error => {
              console.log(util.inspect(error));
              action.payload.setSystemError(error);
            });
        } else {
          action.payload.setPaymentHistory({
            paymentType: action.payload.paymentType,
            data: result.data.data,
            dateFrom: action.payload.dateFrom,
            dateTo: action.payload.dateTo,
          });
        }
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}
export function* setPaymentHistoryLoaded(action) {
  action.payload.setPaymentHistory({
    paymentType: action.payload.paymentType,
    data: action.payload.data,
  });
  yield put(actions.setDummy());
}
export function* fetchOverdues(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    useSubAccount: action.payload.useSubAccount,
    timezone: action.payload.timezone,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getOverduesUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Overdues',
        );
      } else {
        action.payload.setOverdues(result.data.data);
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });
  yield put(actions.setDummy());
}

export function* fetchAdditionalServices(action) {
  try {
    if (action.payload.additionalServiceForm !== '') {
      const search = new CoreAPI.SubmissionSearch(true)
        .includes(['details', 'values'])
        .index('values[Start Date]')
        .between(
          'values[Start Date]',
          action.payload.dateFrom.format('YYYY-MM-DD'),
          action.payload.dateTo.format('YYYY-MM-DD'),
        )
        .limit(1000)
        .build();

      const { submissions, serverError } = yield call(
        CoreAPI.searchSubmissions,
        {
          datastore: true,
          form: action.payload.additionalServiceForm,
          search,
        },
      );
      yield put(actions.setAdditionalServices(submissions));
    } else {
      yield put(actions.setAdditionalServices([]));
    }
  } catch (error) {
    console.log('Error in fetchAdditionalServices: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchActiveAdditionalServices(action) {
  try {
    if (action.payload.additionalServiceForm !== '') {
      const search = new CoreAPI.SubmissionSearch(true)
        .includes(['details', 'values'])
        .index('values[Status]')
        .eq('values[Status]', 'Active')
        .limit(1000)
        .build();

      const { submissions, serverError } = yield call(
        CoreAPI.searchSubmissions,
        {
          datastore: true,
          form: action.payload.additionalServiceForm,
          search,
        },
      );
      yield put(actions.setAdditionalServices(submissions));
    } else {
      yield put(actions.setAdditionalServices([]));
    }
  } catch (error) {
    console.log(
      'Error in fetchActiveAdditionalServices: ' + util.inspect(error),
    );
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchBillingPayments(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
    internalPaymentType: action.payload.internalPaymentType,
  };
  console.log('action:' + action.payload);
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Billing Payments',
        );
      } else if (action.payload.setBillingPayments) {
        action.payload.setBillingPayments(result.data.data);
      } else if (action.payload.createBillingStatistics) {
        action.payload.createBillingStatistics({
          data: result.data.data,
          createStatistic: action.payload.createStatistic,
        });
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}
export function* createBillingStatistics(action) {
  const search = new CoreAPI.SubmissionSearch(true)
    .includes(['details', 'values'])
    .limit(1000)
    .build();

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
    form: 'monthly-statistics',
    datastore: true,
    search,
  });

  var statistics = new Map();
  for (let i = 0; i < action.payload.data.length; i++) {
    let customer = action.payload.data[i];
    let monthDate = moment(customer.debitDate, 'YYYY-MM-DD HH:mm:ss').format(
      'YYYY-MM',
    );
    let monthStats = statistics.get(monthDate);
    if (monthStats === undefined) {
      monthStats = {
        income: customer.paymentAmount,
        memberCount: '',
        activeMemberCount: '',
        inactiveMemberCount: '',
        frozenMemberCount: '',
        billingMemberCount: '',
        nonBillingMemberCount: '',
        averagePricePerStudent: '',
      };
    } else {
      monthStats = {
        income: monthStats['income'] + customer.paymentAmount,
        memberCount: monthStats['memberCount'],
        activeMemberCount: monthStats['activeMemberCount'],
        inactiveMemberCount: monthStats['inactiveMemberCount'],
        frozenMemberCount: monthStats['frozenMemberCount'],
        billingMemberCount: monthStats['billingMemberCount'],
        nonBillingMemberCount: monthStats['nonBillingMemberCount'],
        averagePricePerStudent: monthStats['averagePricePerStudent'],
      };
    }
    statistics.set(monthDate, monthStats);
  }
  for (let statsKey of statistics.keys()) {
    let newStatistic = true;
    console.log('-' + statistics.get(statsKey)['income']);
    if (submissions && submissions.length > 0) {
      submissions.forEach(statRecord => {
        if (
          statRecord.values['Year'] + '-' + statRecord.values['Month'] ===
          statsKey
        ) {
          newStatistic = false;
        }
      });
    }
    console.log('newStatistic:' + newStatistic);
    if (newStatistic) {
      action.payload.createStatistic({
        key: statsKey,
        statistics: statistics.get(statsKey),
      });
    }
  }
}
export function* createStatistic(payload) {
  try {
    let values = {};
    let key = payload.payload.key;
    let statistic = payload.payload.statistics;

    values['Year'] = key.split('-')[0];
    values['Month'] = key.split('-')[1];
    values['All Member Count'] = '';
    values['Active Member Count'] = '';
    values['Inactive Member Count'] = '';
    values['Frozen Member Count'] = '';
    values['Billing Member Count'] = '';
    values['Non Billing Member Count'] = '';
    values['Monthly Revenue'] = statistic['income'];
    values['Average Price Per Student'] = '';

    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'monthly-statistics',
      values: values,
      completed: true,
      include: SUBMISSION_INCLUDES,
    });
  } catch (error) {
    console.log('Error in createStatistic: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchProcessedAndScheduledPayments(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    paymentType: action.payload.paymentType,
    paymentMethod: action.payload.paymentMethod,
    paymentSource: action.payload.paymentSource,
    dateFrom: action.payload.dateFrom,
    dateTo: action.payload.dateTo,
    dateField: action.payload.dateField,
  };
  console.log('action:' + action.payload);
  let allPayments = [];
  axios
    .post(appSettings.kineticBillingServerUrl + getPaymentsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Billing Payments',
        );
      } else {
        allPayments.processedPayments = result.data.data;
        var args1 = {
          space: appSettings.spaceSlug,
          billingService: appSettings.billingCompany,
          dateFrom: action.payload.dateFrom,
          dateTo: action.payload.dateTo,
        };

        axios
          .post(
            appSettings.kineticBillingServerUrl + getScheduledPaymentsUrl,
            args1,
          )
          .then(result1 => {
            if (result1.data.Error && result1.data.Error > 0) {
              console.log(result1.data.ErrorMessage);
              action.payload.addNotification(
                NOTICE_TYPES.ERROR,
                result.data.errorMessage,
                'Get Scheduled Payments',
              );
            } else {
              allPayments.scheduledPayments = result1.data.data;
              action.payload.setProcessedAndScheduledPayments(allPayments);
            }
          })
          .catch(error => {
            console.log(error.response);
            //action.payload.setSystemError(error);
          });
      }
    })
    .catch(error => {
      console.log(error.response);
      //action.payload.setSystemError(error);
    });

  yield put(actions.setDummy());
}

export function* clearPaymentSchedule(action) {
  const appSettings = yield select(getAppSettings);
  var args = {
    space: appSettings.spaceSlug,
    billingService: appSettings.billingCompany,
    customerId: action.payload.billingRef,
    keepManualPayments: action.payload.keepManualPayments,
    startDate: action.payload.startDate,
    resumeDate: action.payload.resumeDate,
  };

  axios
    .post(appSettings.kineticBillingServerUrl + clearScheduleUrl, args)
    .then(result => {
      //console.log("clearPaymentSchedule # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Clear Payment Schedule',
        );
      } else {
        console.log(result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Clear Schedule',
          to: {
            startDate: action.payload.startDate,
            resumeDate: action.payload.resumeDate,
          },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.memberItem.values['Payment Schedule'] = undefined;
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment schedule cleared successfully',
          'Clear Payment Schedule',
        );
      }
    })
    .catch(error => {
      console.log(JSON.stringify(error));
      action.payload.setSystemError(error);
    });
}

export function* createPaymentSchedule(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId = action.payload.billingRef;
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.scheduleStartDate = action.payload.scheduleStartDate;
  args.scheduleResumeDate = action.payload.scheduleResumeDate;
  args.schedulePeriodType = action.payload.schedulePeriodType;
  if (action.payload.dayOfWeek) {
    args.dayOfWeek = action.payload.dayOfWeek;
  }
  args.dayOfMonth = action.payload.dayOfMonth;
  args.paymentAmountInCents = action.payload.paymentAmountInCents;
  args.limitToNumberOfPayments = action.payload.limitToNumberOfPayments;
  args.limitToTotalAmountInCents = action.payload.limitToTotalAmountInCents;
  args.keepManualPayments = action.payload.keepManualPayments;
  args.scheduleType = 'UNENDING'; //for integraPay

  axios
    .post(appSettings.kineticBillingServerUrl + createScheduleUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Create Payment Schedule',
        );
      } else {
        console.log(result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Create Schedule',
          to: {
            period: 'Fortnightly',
            amount: action.payload.paymentAmountInCents / 100,
            startDate: action.payload.scheduleStartDate,
            endDate: action.payload.scheduleResumeDate,
          },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.memberItem.values['Payment Schedule'] = {
          period: 'Fortnightly',
          amount: action.payload.paymentAmountInCents / 100,
        };
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment schedule created successfully',
          'Create Payment Schedule',
        );
      }
    })
    .catch(error => {
      console.log('Error in createPaymentSchedule: ' + util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function fetchFamilyMembers(action) {
  let members = [];
  if (action.payload.currentMember && action.payload.allMembers) {
    members = action.payload.allMembers.filter(member => {
      return getJson(
        action.payload.currentMember.values['Billing Family Members'],
      ).some(memberid => memberid === member['id']);
    });
  }

  var clonedMembers = [];
  members.forEach(member => {
    clonedMembers.push($.extend(true, {}, member));
  });

  console.log(
    '# Redux # fetchFamilyMembers called, size=' + clonedMembers.length,
  );
  action.payload.setFamilyMembers(clonedMembers);
}

export function* registerBillingMember(action) {
  let ccNumber = null;
  if (action.payload.billingInfo.values['Credit Card Number']) {
    ccNumber = action.payload.billingInfo.values['Credit Card Number'];
    action.payload.billingInfo.values[
      'Credit Card Number'
    ] = action.payload.billingInfo.values['Credit Card Number'].replace(
      /.(?=.{4,}$)/g,
      '*',
    );
    const { submission } = yield call(CoreAPI.updateSubmission, {
      id: action.payload.billingInfo['id'],
      values: action.payload.billingInfo.values,
    });
  }

  const appSettings = yield select(getAppSettings);
  let args = {};
  //args.addIfNotExists = '1';
  args.customerId = action.payload.memberItem.values['Member ID'];
  args.firstName = action.payload.billingInfo.values['First Name'];
  args.lastName = action.payload.billingInfo.values['Last Name'];
  args.dob = action.payload.billingInfo.values['DOB'];
  args.address = action.payload.billingInfo.values['Address'];
  args.suburb = action.payload.billingInfo.values['Suburb'];
  args.state = action.payload.billingInfo.values['State'];
  args.postCode = action.payload.billingInfo.values['Postcode'];
  //args.country = 'Australia';
  args.email = action.payload.billingInfo.values['Email'];
  args.driversLicence = action.payload.billingInfo.values['Drivers Licence'];
  args.phoneHome = action.payload.billingInfo.values['Phone Home'];
  args.phoneWork = action.payload.billingInfo.values['Phone Work'];
  args.mobile = action.payload.billingInfo.values['Mobile'];
  args.payment = action.payload.billingInfo.values['Payment'];
  args.firstPayment = action.payload.billingInfo.values['First Payment'];
  args.billingPeriod = action.payload.billingInfo.values['Billing Period'];
  args.contractStartDate =
    action.payload.billingInfo.values['Billing Start Date'];
  args.paymentMethod = action.payload.billingInfo.values['Payment Method'];
  if (args.paymentMethod === 'Credit Card') {
    args.creditCardName = action.payload.billingInfo.values['Name On Card'];
    args.creditCardNumber = ccNumber;
    args.creditCardExpiryMonth =
      action.payload.billingInfo.values['Credit Card Expiry Month'];
    args.creditCardExpiryYear =
      action.payload.billingInfo.values['Credit Card Expiry Year'];
    args.creditCardType = action.payload.billingInfo.values['Credit Card Type'];
  } else if (args.paymentMethod === 'Bank Account') {
    args.bankAccountName = action.payload.billingInfo.values['Account Name'];
    args.bankAccountNumber =
      action.payload.billingInfo.values['Account Number'];
    args.bankAccountBsb = action.payload.billingInfo.values['BSB'];
  }
  args.contractByValue = false;
  args.fta = false;
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.gbmemberId = action.payload.memberItem['id'];
  args.gbmembersReturn = window.location.href;

  axios
    .post(appSettings.kineticBillingServerUrl + registerUserUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('registerBillingMember Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Register Billing Member',
        );
      } else {
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Billing Member registered successfully',
          'Register Billing Member',
        );

        action.payload.memberItem.values['Billing Info Form Id'] =
          action.payload.billingInfo['id'];

        action.payload.fetchBillingInfoAfterRegistration({
          billingRef: action.payload.memberItem.values['Member ID'],
          memberItem: action.payload.memberItem,
          setBillingInfo: action.payload.setBillingInfo,
          updateMember: action.payload.updateMember,
          fetchCurrentMember: action.payload.fetchCurrentMember,
          addNotification: action.payload.addNotification,
        });
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function* editPaymentMethod(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId =
    action.payload.memberItem.values['Billing Customer Reference'];
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.paymentMethod = action.payload.paymentMethod.methodName;
  if (action.payload.paymentMethod.methodName === 'CREDITCARD') {
    args.creditCardNumber = action.payload.paymentMethod.creditCardNumber;
    args.creditCardType = action.payload.paymentMethod.creditCardType;
    args.creditCardExpiryDate =
      action.payload.paymentMethod.creditCardExpiryDate;
    args.creditCardName = action.payload.paymentMethod.creditCardName;
  } else if (action.payload.paymentMethod.methodName === 'BANKACCOUNT') {
    args.bankAccountBsb = action.payload.paymentMethod.bankAccountBsb;
    args.bankAccountNumber = action.payload.paymentMethod.bankAccountNumber;
    args.bankAccountName = action.payload.paymentMethod.bankAccountName;
    //args.bankAccountType = action.payload.paymentMethod.bankAccountType; For USA customers only, for all other countries this parameter can be blank. if used value must be "CHECK" or "SAVINGS"
  }

  axios
    .post(appSettings.kineticBillingServerUrl + updatePaymentMethodUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('editPaymentMethod Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Edit Payment Method',
        );
      } else {
        console.log('#### Response = ' + result.data.data);
        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Edit Payment Method',
          to: { method: action.payload.paymentMethod.methodName },
          reason: action.payload.editPaymentTypeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          myThis: action.payload.myThis,
        });
        action.payload.fetchCurrentMember({
          id: action.payload.memberItem['id'],
          myThis: action.payload.myThis,
        });
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment method updated successfully',
          'Update Payment Method',
        );
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}
export function* activateBiller(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId =
    action.payload.memberItem.values['Billing Customer Reference'];
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.orderNumber = action.payload.orderNumber;
  args.payment = action.payload.payment;
  args.schedulePeriodType = action.payload.period;
  args.startDate = action.payload.startDate;
  args.scheduleDate = action.payload.scheduleDate;
  args.email = action.payload.email;
  args.city = action.payload.city;
  args.postcode = action.payload.postcode;
  args.state = action.payload.state;
  args.address = action.payload.address;
  axios
    .post(appSettings.kineticBillingServerUrl + activateBillerUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('activateBiller Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Activated Biller Failed',
        );
      } else {
        console.log('#### Response = ' + result.data.data);
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Activating Biller successfully',
        );
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
        });

        action.payload.billerActivated();
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.addNotification(
        NOTICE_TYPES.ERROR,
        'Activated Biller Failed',
      );
    });
}

export function* refundTransaction(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.customerId = action.payload.memberItem.values['Billing Customer Id'];
  args.transactionId = action.payload.transactionId;
  args.bankReceiptId = action.payload.bankReceiptId;
  args.refundAmount = action.payload.refundAmount;

  axios
    .post(appSettings.kineticBillingServerUrl + refundTransactionUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('refundTransaction Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Refund Transaction',
        );
        action.payload.refundTransactionComplete({ id: '' });
      } else {
        console.log('#### Response = ' + result.data.data);
        let paymentsRefunded =
          typeof action.payload.memberItem.values['Refunded Payments'] ===
          'object'
            ? action.payload.memberItem.values['Refunded Payments']
            : action.payload.memberItem.values['Refunded Payments']
            ? JSON.parse(action.payload.memberItem.values['Refunded Payments'])
            : [];

        paymentsRefunded.push(action.payload.transactionId);
        action.payload.memberItem.values[
          'Refunded Payments'
        ] = paymentsRefunded;

        let changes = getBillingChanges(action.payload.memberItem);
        changes.push({
          date: moment().format(contact_date_format),
          user: appSettings.profile.username,
          action: 'Refund Transaction',
          to: { amount: +action.payload.refundAmount / 100 },
          reason: action.payload.billingChangeReason,
        });
        action.payload.memberItem.values['Billing Changes'] = changes;

        var values = {};
        values['Refunded Payments'] =
          action.payload.memberItem.values['Refunded Payments'];
        values['Billing Changes'] =
          action.payload.memberItem.values['Billing Changes'];
        action.payload.updateMember({
          id: action.payload.memberItem['id'],
          memberItem: action.payload.memberItem,
          values: values,
        });

        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment refunded successfully',
          'Refund Transaction',
        );
        action.payload.refundTransactionComplete({
          id: action.payload.transactionId,
          value: action.payload.refundAmount,
        });

        if (action.payload.billingThis) {
          action.payload.billingThis.setState({
            showPaymentHistory: false,
          });
          action.payload.billingThis.setState({
            showPaymentHistory: true,
          });
        }
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}

export function* refundPOSTransaction(action) {
  const appSettings = yield select(getAppSettings);

  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.transactionId = action.payload.transactionId;
  args.refundAmount = action.payload.refundAmount;

  axios
    .post(appSettings.kineticBillingServerUrl + refundTransactionUrl, args)
    .then(result => {
      //console.log("fetchWebToken # result = " + util.inspect(result));
      if (result.data.error && result.data.error > 0) {
        console.log('refundTransaction Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Refund Transaction',
        );
        action.payload.refundPOSTransactionComplete({ id: '' });
      } else {
        console.log('#### Response = ' + result.data.data);

        var order =
          action.payload.memberItem.posOrders[
            action.payload.memberItem.posOrders.findIndex(
              item => item['Transaction ID'] === action.payload.transactionId,
            )
          ];
        var products = JSON.parse(order['POS Checkout JSON'])['Checkout Items']
          .products;
        products.forEach((product, i) => {
          if (product.productType === 'Apparel') {
            action.payload.incrementPOSStock({
              productID: product['productID'],
              size: product['size'],
              quantity: product['quantity'],
            });
            var pIdx = action.payload.memberItem.posItems.findIndex(
              item =>
                item['Product ID'] === product['productID'] &&
                item['Size'] === product['size'] &&
                parseInt(item['Quantity']) === product['quantity'] &&
                item['Person ID'] === action.payload.memberItem.id,
            );
            if (pIdx !== -1) {
              action.payload.deletePOSPurchasedItem({
                id: action.payload.memberItem.posItems[pIdx].id,
              });
            }
          } else if (product.productType === 'Package') {
            product.packageStock.forEach((packageProduct, i) => {
              action.payload.incrementPOSStock({
                productID: packageProduct['productID'],
                size: packageProduct['size'],
                quantity: product['quantity'],
              });
              var pIdx = action.payload.memberItem.posItems.findIndex(
                item =>
                  item['Product ID'] === packageProduct['productID'] &&
                  item['Size'] === packageProduct['size'] &&
                  parseInt(item['Quantity']) === product['quantity'] &&
                  item['Person ID'] === action.payload.memberItem.id,
              );
              if (pIdx !== -1) {
                action.payload.deletePOSPurchasedItem({
                  id: action.payload.memberItem.posItems[pIdx].id,
                });
              }
            });
          }
        });

        var orderValues = {};
        orderValues['Status'] = 'Refunded';
        orderValues['Refund'] = action.payload.refundAmount;
        action.payload.updatePOSOrder({
          id: order.id,
          values: orderValues,
        });

        if (action.payload.memberItem.form.slug === 'member') {
          let changes = getBillingChanges(action.payload.memberItem);
          changes.push({
            date: moment().format(contact_date_format),
            user: appSettings.profile.username,
            action: 'Refund Transaction',
            to: { amount: +action.payload.refundAmount / 100 },
            reason: action.payload.billingChangeReason,
          });
          action.payload.memberItem.values['Billing Changes'] = changes;

          var values = {};
          values['Billing Changes'] = changes;
          action.payload.updateMember({
            id: action.payload.memberItem.id,
            allMembers: action.payload.allMembers,
            memberItem: action.payload.memberItem,
            values: values,
          });
        }
        action.payload.addNotification(
          NOTICE_TYPES.SUCCESS,
          'Payment refunded successfully',
          'Refund Transaction',
        );
        action.payload.refundPOSTransactionComplete({
          id: action.payload.orderid,
          value: action.payload.refundAmount,
        });

        if (action.payload.billingThis) {
          action.payload.billingThis.setState({
            showPaymentHistory: false,
          });
          action.payload.billingThis.setState({
            showPaymentHistory: true,
          });
        }
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      //action.payload.setSystemError(error);
    });
}
export function* refundCashTransaction(action) {
  const appSettings = yield select(getAppSettings);

  var order =
    action.payload.memberItem.posOrders[
      action.payload.memberItem.posOrders.findIndex(
        item => item.id === action.payload.orderid,
      )
    ];
  var products = JSON.parse(order['POS Checkout JSON'])['Checkout Items']
    .products;
  products.forEach((product, i) => {
    if (product.productType === 'Apparel') {
      action.payload.incrementPOSStock({
        productID: product['productID'],
        size: product['size'],
        quantity: product['quantity'],
      });
      var pIdx = action.payload.memberItem.posItems.findIndex(
        item =>
          item['Product ID'] === product['productID'] &&
          item['Size'] === product['size'] &&
          parseInt(item['Quantity']) === product['quantity'] &&
          item['Person ID'] === action.payload.memberItem.id,
      );
      if (pIdx !== -1) {
        action.payload.deletePOSPurchasedItem({
          id: action.payload.memberItem.posItems[pIdx].id,
        });
      }
    } else if (product.productType === 'Package') {
      product.packageStock.forEach((packageProduct, i) => {
        action.payload.incrementPOSStock({
          productID: packageProduct['productID'],
          size: packageProduct['size'],
          quantity: product['quantity'],
        });
        var pIdx = action.payload.memberItem.posItems.findIndex(
          item =>
            item['Product ID'] === packageProduct['productID'] &&
            item['Size'] === packageProduct['size'] &&
            parseInt(item['Quantity']) === product['quantity'] &&
            item['Person ID'] === action.payload.memberItem.id,
        );
        if (pIdx !== -1) {
          action.payload.deletePOSPurchasedItem({
            id: action.payload.memberItem.posItems[pIdx].id,
          });
        }
      });
    }
  });

  var orderValues = {};
  orderValues['Status'] = 'Refunded';
  orderValues['Refund'] = action.payload.refundAmount;
  action.payload.updatePOSOrder({
    id: order.id,
    values: orderValues,
  });

  if (action.payload.memberItem.form.slug === 'member') {
    let changes = getBillingChanges(action.payload.memberItem);
    changes.push({
      date: moment().format(contact_date_format),
      user: appSettings.profile.username,
      action: 'Refund Transaction',
      to: { amount: +action.payload.refundAmount / 100 },
      reason: action.payload.billingChangeReason,
    });
    action.payload.memberItem.values['Billing Changes'] = changes;

    var values = {};
    values['Billing Changes'] = changes;
    action.payload.updateMember({
      id: action.payload.memberItem.id,
      allMembers: action.payload.allMembers,
      memberItem: action.payload.memberItem,
      values: values,
    });
  }
  action.payload.addNotification(
    NOTICE_TYPES.SUCCESS,
    'Payment refunded successfully',
    'Refund Transaction',
  );
  action.payload.refundPOSTransactionComplete({
    id: action.payload.orderid,
    value: action.payload.refundAmount,
  });

  if (action.payload.billingThis) {
    action.payload.billingThis.setState({
      showPaymentHistory: false,
    });
    action.payload.billingThis.setState({
      showPaymentHistory: true,
    });
  }
}

export function* fetchActionRequests(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.customerId = action.payload.customerId;
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  axios
    .post(appSettings.kineticBillingServerUrl + actionRequestsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('fetchActionRequests Error: ' + result.data.errorMessage);
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Action Requests',
        );
      } else {
        action.payload.setActionRequests(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchVariationCustomers(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  axios
    .post(appSettings.kineticBillingServerUrl + getVariationsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(
          'fetchVariationCustomers Error: ' + result.data.errorMessage,
        );
        if (action.payload.addNotification) {
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Variation Customers',
          );
        }
      } else {
        action.payload.setVariationCustomers(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchCustomerRefunds(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.dateFrom = action.payload.dateFrom;
  args.dateTo = action.payload.dateTo;
  args.timezoneOffset = action.payload.timezoneOffset;
  args.useSubAccount = action.payload.useSubAccount;
  args.timezone = action.payload.timezone;

  axios
    .post(appSettings.kineticBillingServerUrl + getRefundsUrl, args)
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log('fetchCustomerRefunds Error: ' + result.data.errorMessage);
        if (action.payload.addNotification) {
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            result.data.errorMessage,
            'Get Customer Refunds',
          );
        }
      } else {
        console.log('fetchCustomerRefunds1:' + util.inspect(result.data));
        console.log('fetchCustomerRefunds2:' + result.data.data.length);
        action.payload.setCustomerRefunds(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}

export function* fetchBillingCustomers(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.active = true;
  args.useSubAccount = action.payload.useSubAccount;

  if (appSettings.billingCompany === 'Bambora') {
    let billingCustomers = [];
    action.payload.allMembers.forEach((member, i) => {
      if (member.values['Billing User'] === 'YES') {
        console.log('fetchBillingCustomers 22:' + member.values['Status']);
        billingCustomers[billingCustomers.length] = {
          memberId: member.values['Member ID'],
          customerId: member.values['Billing Customer Id'],
          billingId: member.values['Billing Customer Reference'],
          status: member.values['Status'],
          firstName: member.values['First Name'],
          lastName: member.values['Last Name'],
          billingAmount: member.values['Payment'],
          contractStartDate: member.values['Billing Start Date'],
          billingPeriod: member.values['Billing Period'],
          billingPeriod: member.values['Billing Period'],
          paymentMethod: member.values['Payment Method'],
        };
      }
    });

    action.payload.setBillingCustomers({
      billingCustomers: billingCustomers,
    });
  } else {
    axios
      .post(appSettings.kineticBillingServerUrl + getCustomersUrl, args)
      .then(resultActive => {
        if (resultActive.data.error && resultActive.data.error > 0) {
          /*          console.log(
            'loadBillingCustomers Error: ' + resultActive.data.errorMessage,
          );*/
          action.payload.addNotification(
            NOTICE_TYPES.ERROR,
            resultActive.data.errorMessage,
            'Get Billing Customers',
          );
        } else {
          /*          console.log(
            '#### loadBillingCustomers ACTIVE # data = ' +
              JSON.stringify(resultActive.data.data),
          ); */
        }
        args.active = false;
        axios
          .post(appSettings.kineticBillingServerUrl + getCustomersUrl, args)
          .then(resultInactive => {
            if (resultInactive.data.error && resultInactive.data.error > 0) {
              /*              console.log(
                'loadBillingCustomers Error: ' +
                  resultInactive.data.errorMessage,
              ); */
              action.payload.addNotification(
                NOTICE_TYPES.ERROR,
                resultInactive.data.errorMessage,
                'Get Billing Customers',
              );
            } else {
              /*              console.log(
                '#### loadBillingCustomers INACTIVE # data = ' +
                  JSON.stringify(resultInactive.data.data),
              ); */
              if (action.payload.createBillingMembers !== undefined) {
                action.payload.createBillingMembers({
                  customers: resultActive.data.data.concat(
                    resultInactive.data.data,
                  ),
                  setBillingCustomers: action.payload.setBillingCustomers,
                  fetchMembers: action.payload.fetchMembers,
                  appSettings: appSettings,
                  allMembers: action.payload.allMembers,
                  membersNextPageToken: action.payload.membersNextPageToken,
                  memberInitialLoadComplete:
                    action.payload.memberInitialLoadComplete,
                  memberLastFetchTime: action.payload.memberLastFetchTime,
                  useSubAccount: action.payload.useSubAccount,
                });
              } else if (action.payload.syncBillingMembers !== undefined) {
                action.payload.syncBillingMembers({
                  customers: resultActive.data.data.concat(
                    resultInactive.data.data,
                  ),
                  setBillingCustomers: action.payload.setBillingCustomers,
                  fetchMembers: action.payload.fetchMembers,
                  appSettings: appSettings,
                  allMembers: action.payload.allMembers,
                  useSubAccount: action.payload.useSubAccount,
                });
              } else if (action.payload.setBillingCustomers) {
                action.payload.setBillingCustomers({
                  billingCustomers: resultActive.data.data.concat(
                    resultInactive.data.data,
                  ),
                });
              }
            }
          })
          .catch(error => {
            console.log(util.inspect(error));
            action.payload.setSystemError(error);
          });
      })
      .catch(error => {
        console.log(util.inspect(error));
        action.payload.setSystemError(error);
      });
  }
}

export function* createBillingMembers(action) {
  let newMemberAdded = false;
  let newMembers = [];
  let threeMonths = moment().subtract(3, 'months');
  //  let loadCount = 0;
  for (let i = 0; i < action.payload.customers.length; i++) {
    let customer = action.payload.customers[i];
    if (customer.dateArchived > 0) {
      var dt = new Date(customer.dateArchived);
      if (moment(dt).isBefore(threeMonths)) {
        console.log(
          'Archived Name:' +
            customer.firstName +
            ' ' +
            customer.lastName +
            ' - PaySmartID:' +
            customer.customerId +
            ' - Status:' +
            customer.status,
        );
        continue;
      }
    }
    //    if (!customer.fromSubAccount || loadCount > 4) continue;
    //    loadCount++;
    const MEMBER_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Billing Customer Id]', customer.customerId)
      .include('details,values')
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member',
      kapp: 'gbmembers',
      search: MEMBER_SEARCH,
    });
    //  console.log('#### createMembers # submissions = ' + util.inspect(submissions));
    console.log(
      'Name:' +
        customer.firstName +
        ' ' +
        customer.lastName +
        ' - PaySmartID:' +
        customer.customerId +
        ' - Status:' +
        customer.status +
        (!submissions || submissions.length <= 0
          ? 'NEW'
          : submissions[0].values['Status']),
    );
    var memberItem = {
      values: {},
    };
    if (
      (!submissions || submissions.length <= 0) &&
      customer.status === 'Inactive'
    ) {
      //Ignore
      console.log('Not importing Inactive member');
    } else if (!submissions || submissions.length <= 0) {
      let memberId = (
        (customer.firstName !== undefined
          ? customer.firstName.toLowerCase()
          : '') +
        (customer.lastName !== undefined ? customer.lastName.toLowerCase() : '')
      )
        .replace(/[^\x00-\x7F]|['"`\.,\(\)]/g, '')
        .substring(0, 30);

      /*        customer.firstName.charAt(0).toLowerCase() +
        customer.firstName.slice(1) +
        customer.lastName.charAt(0).toLowerCase() +
        customer.lastName.slice(1); */

      let memberidInc = 0;
      action.payload.allMembers.forEach(member => {
        if (member.values['Member ID'].indexOf(memberId) !== -1) {
          memberidInc++;
        }
      });
      newMembers.forEach(member => {
        if (member.values['Member ID'].indexOf(memberId) !== -1) {
          memberidInc++;
        }
      });

      memberItem.values['Status'] = customer.status;
      memberItem.values['First Name'] = customer.firstName;
      memberItem.values['Last Name'] = customer.lastName;
      memberItem.values['Member ID'] =
        memberId + (memberidInc !== 0 ? memberidInc : '');
      memberItem.values['Address'] = customer.address;
      memberItem.values['Suburb'] = customer.suburb;
      memberItem.values['State'] = customer.state;
      memberItem.values['Postcode'] = customer.postCode;
      memberItem.values['Email'] = customer.email;
      memberItem.values['Phone Number'] = customer.phone;
      memberItem.values['DOB'] = customer.dob;
      memberItem.values['Date Joined'] = customer.contractStartDate;

      memberItem.values['Billing Customer Id'] = customer.customerId;
      memberItem.values['Billing User'] = 'YES';
      memberItem.values['Billing Payment Type'] = customer.paymentMethod;
      memberItem.values['Billing Payment Period'] = customer.billingPeriod;
      memberItem.values['Payment Schedule'] = {
        period: customer.billingPeriod,
        amount: customer.billingAmount,
      };
      memberItem.values['Membership Cost'] = customer.billingAmount;
      memberItem.values['DDR Status'] = 'Pending';
      if (customer.fromSubAccount) {
        memberItem.values['useSubAccount'] = 'YES';
      }
      newMembers[newMembers.length] = memberItem;
      yield put(
        actions.createMember({
          memberItem,
          showNotification: false,
          memberInitialLoadComplete: true,
        }),
      );
      newMemberAdded = true;
    } else if (submissions && submissions.length === 1) {
      memberItem.values = submissions[0].values;
      if (memberItem.values['Non Paying'] === 'YES') {
        console.log(
          'Non Paying :' +
            memberItem.values['First Name'] +
            ' ' +
            memberItem.values['Last Name'],
        );
        //Ignore
      } else {
        let changeMade = false;
        if (customer.status !== memberItem.values['Status']) {
          memberItem.values['Status'] = customer.status;
          let history = getJson(memberItem.values['Status History']);
          let newHistory = {
            submitter: action.payload.appSettings.profile.displayName,
            date: moment().toString(),
            status: customer.status,
          };
          history.push(newHistory);
          memberItem.values['Status History'] = history;
          changeMade = true;
        }

        if (memberItem.values['Billing User'] !== 'YES') {
          memberItem.values['Billing User'] = 'YES';
          changeMade = true;
        }
        if (
          memberItem.values['Billing Payment Type'] !== customer.paymentMethod
        ) {
          memberItem.values['Billing Payment Type'] = customer.paymentMethod;
          changeMade = true;
        }
        if (
          memberItem.values['Billing Payment Period'] !== customer.billingPeriod
        ) {
          memberItem.values['Billing Payment Period'] = customer.billingPeriod;
          changeMade = true;
        }
        if (
          parseInt(memberItem.values['Membership Cost']) !==
          customer.billingAmount
        ) {
          memberItem.values['Payment Schedule'] = {
            period: customer.billingPeriod,
            amount: customer.billingAmount,
          };
          memberItem.values['Membership Cost'] = customer.billingAmount;
          changeMade = true;
        }
        if (memberItem.values['DOB'].indexOf('-') === 2) {
          memberItem.values['DOB'] = customer.dob;
          changeMade = true;
        }
        if (
          memberItem.values['Date Joined'] === undefined ||
          memberItem.values['Date Joined'] === null
        ) {
          memberItem.values['Date Joined'] = customer.contractStartDate;
          changeMade = true;
        }
        if (customer.fromSubAccount) {
          memberItem.values['useSubAccount'] = 'YES';
        } else {
          memberItem.values['useSubAccount'] = null;
        }

        if (changeMade) {
          memberItem.id = submissions[0].id;
          yield put(
            actions.updateMember({
              id: memberItem.id,
              memberItem: memberItem,
            }),
          );
        }
      }
    }
  }

  if (action.payload.setBillingCustomers) {
    action.payload.setBillingCustomers({
      createBillingMembers: true,
    });
    if (newMemberAdded) {
      action.payload.fetchMembers();
    }
  }
}

export function* syncBillingMembers(action) {
  let newMemberAdded = false;
  for (let i = 0; i < action.payload.customers.length; i++) {
    let customer = action.payload.customers[i];
    const MEMBER_SEARCH = new CoreAPI.SubmissionSearch(true)
      .eq('values[Billing Customer Id]', customer.customerId)
      .include('details,values')
      .build();

    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'member',
      kapp: 'gbmembers',
      search: MEMBER_SEARCH,
    });
    var memberItem = {
      values: {},
    };
    if (
      (!submissions || submissions.length <= 0) &&
      customer.status === 'Inactive'
    ) {
      //Ignore
      console.log('Not synching Inactive member');
    } else if (submissions && submissions.length === 1) {
      memberItem.values = submissions[0].values;
      if (memberItem.values['Non Paying'] === 'YES') {
        console.log(
          'Non Paying :' +
            memberItem.values['First Name'] +
            ' ' +
            memberItem.values['Last Name'],
        );
        //Ignore
      } else {
        let changeMade = false;
        if (
          memberItem.values['Billing Payment Type'] !== customer.paymentMethod
        ) {
          memberItem.values['Billing Payment Type'] = customer.paymentMethod;
          changeMade = true;
        }
        if (
          memberItem.values['Billing Payment Period'] !== customer.billingPeriod
        ) {
          memberItem.values['Billing Payment Period'] = customer.billingPeriod;
          changeMade = true;
        }
        if (
          parseInt(memberItem.values['Membership Cost']) !==
          customer.billingAmount
        ) {
          memberItem.values['Payment Schedule'] = {
            period: customer.billingPeriod,
            amount: customer.billingAmount,
          };
          memberItem.values['Membership Cost'] = customer.billingAmount;
          changeMade = true;
        }
        if (changeMade) {
          memberItem.id = submissions[0].id;
          console.log(
            'Name:' +
              customer.firstName +
              ' ' +
              customer.lastName +
              ' - PaySmartID:' +
              customer.customerId +
              ' - Status:' +
              customer.status +
              (!submissions || submissions.length <= 0
                ? 'NEW'
                : submissions[0].values['Status']),
          );

          yield put(
            actions.updateMember({
              id: memberItem.id,
              memberItem: memberItem,
            }),
          );
        }
      }
    }
  }

  if (action.payload.setBillingCustomers) {
    action.payload.setBillingCustomers({
      syncBillingMembers: true,
    });
    if (newMemberAdded) {
      action.payload.fetchMembers();
    }
  }
}
export function* fetchInactiveCustomersCount(action) {
  const appSettings = yield select(getAppSettings);
  let args = {};
  args.space = appSettings.spaceSlug;
  args.billingService = appSettings.billingCompany;
  args.fromDate = action.payload.fromDate;
  args.toDate = action.payload.toDate;
  args.useSubAccount = action.payload.useSubAccount;

  axios
    .post(
      appSettings.kineticBillingServerUrl + getInactiveCustomersCountUrl,
      args,
    )
    .then(result => {
      if (result.data.error && result.data.error > 0) {
        console.log(
          'fetchInactiveCustomersCount Error: ' + result.data.errorMessage,
        );
        action.payload.addNotification(
          NOTICE_TYPES.ERROR,
          result.data.errorMessage,
          'Get Inactive Customers',
        );
      } else {
        action.payload.setInactiveCustomersCount(result.data.data);
      }
    })
    .catch(error => {
      console.log(util.inspect(error));
      action.payload.setSystemError(error);
    });
}
export function* promoteMember(action) {
  try {
    let memberActivities = { values: {} };
    memberActivities.values['Member ID'] = action.payload.memberItem['id'];
    memberActivities.values['Type'] = 'Promotion';
    memberActivities.values['Direction'] = '';
    memberActivities.values['Content'] = {
      Program: action.payload.memberItem.values['Ranking Program'],
      Belt: action.payload.memberItem.values['Ranking Belt'],
      PromotionDate: action.payload.memberItem.values['Last Promotion'],
      Notes: action.payload.notes,
      Submitter: action.payload.submitter,
    };

    action.payload.createMemberActivities({
      memberActivities,
      id: action.payload.memberItem['id'],
      myThis: action.payload.myThis,
      //      fetchMember: action.payload.fetchMember,
    });
    action.payload.updateMember({
      id: action.payload.memberItem['id'],
      memberItem: action.payload.memberItem,
      values: action.payload.values,
      allMembers: action.payload.allMembers,
    });
    //    memberActivities.values['Content']['Submitter'] = action.payload.submitter;
    action.payload.memberItem.promotionContent.splice(
      0,
      0,
      memberActivities.values['Content'],
    );

    yield put(actions.memberPromoted());
    action.payload.promotionComplete();
  } catch (error) {
    console.log('Error in promoteMember: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* createMemberUserAccount(action) {
  console.log('createMemberUserAccount');
  try {
    let user = {
      displayName:
        action.payload.memberItem.values['First Name'] +
        ' ' +
        action.payload.memberItem.values['Last Name'],
      email: action.payload.memberItem.values['Email'],
      enabled: true,
      spaceAdmin: false,
      username: action.payload.memberItem.values['Member ID'],
      attributesMap: {},
      profileAttributesMap: { 'Default Kapp Display': ['services'] },
    };
    const { submission } = yield call(CoreAPI.createUser, {
      user: user,
    });

    action.payload.memberItem.user = user;

    var allMembers = action.payload.allMembers;
    for (var i = 0; i < allMembers.length; i++) {
      if (allMembers[i]['id'] === action.payload.memberItem.id) {
        allMembers[i] = action.payload.memberItem;
      }
    }

    yield put(action.payload.setCreatingUserAccount(false));
  } catch (error) {
    console.log('Error in createMemberUserAccount: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* addCashPayment(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
      datastore: true,
      formSlug: 'cash-payment',
      values: action.payload.values,
      completed: true,
      include: SUBMISSION_INCLUDES,
    });
    if (action.payload.completeCashPayment) {
      action.payload.completeCashPayment(action.payload.updateMember);
    }
    if (action.payload.nextBillingDate) {
      // Set next this.props.billingInfo.nextBillingDate
      var values = {};
      values['Billing Start Date'] = action.payload.nextBillingDate.format(
        'YYYY-MM-DD',
      );
      var mItem = {};
      mItem['values'] = values;
      action.payload.updateMember({
        id: action.payload.memberItem['id'],
        memberItem: mItem,
        fromBilling: true,
      });
    }
  } catch (error) {
    console.log('Error in addCashPayment: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchMemberCashPayments(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .eq('values[Member GUID]', action.payload.id)
      .index('values[Member GUID]')
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'cash-payment',
      datastore: true,
      search,
    });

    yield put(actions.setMemberCashPayments(submissions));
  } catch (error) {
    console.log('Error in fetchMemberCashPayments: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchCashPaymentsByDate(action) {
  try {
    const search = new CoreAPI.SubmissionSearch(true)
      .gteq('values[Date]', action.payload.dateFrom)
      .lteq('values[Date]', action.payload.dateTo)
      .index('values[Date]')
      .include(['details', 'values'])
      .limit(1000)
      .build();
    const { submissions } = yield call(CoreAPI.searchSubmissions, {
      form: 'cash-payment',
      datastore: true,
      search,
    });

    yield put(actions.setCashPaymentsByDate(submissions));
  } catch (error) {
    console.log('Error in fetchCashPaymentsByDate: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* watchMembers() {
  console.log('watchMembers');
  yield takeEvery(types.FETCH_MEMBERS, fetchMembers);
  yield takeEvery(types.FETCH_CURRENT_MEMBER, fetchCurrentMember);
  yield takeEvery(
    types.FETCH_CURRENT_MEMBER_ADDITIONAL,
    fetchCurrentMemberAdditional,
  );
  yield takeEvery(types.ACTIVATE_BILLER, activateBiller);
  yield takeEvery(types.UPDATE_MEMBER, updateCurrentMember);
  yield takeEvery(types.CREATE_MEMBER, createMember);
  yield takeEvery(types.DELETE_MEMBER, deleteMember);
  yield takeEvery(types.DELETE_MEMBER_FILE, deleteMemberFile);
  yield takeEvery(types.CANCEL_ADDITIONAL_SERVICE, cancelAdditionalService);
  yield takeEvery(types.FETCH_NEW_MEMBER, fetchNewMember);
  yield takeEvery(types.FETCH_BILLING_INFO, fetchBillingInfo);
  yield takeEvery(
    types.FETCH_BILLING_INFO_AFTER_REGISTRATION,
    fetchBillingInfoAfterRegistration,
  );
  yield takeEvery(types.EDIT_PAYMENT_AMOUNT, editPaymentAmount);
  yield takeEvery(types.FETCH_MEMBER_PROMOTIONS, fetchMemberPromotions);
  yield takeEvery(types.FETCH_PAYMENT_HISTORY, fetchPaymentHistory);
  yield takeEvery(types.SET_PAYMENT_HISTORY_LOADED, setPaymentHistoryLoaded);
  yield takeEvery(types.FETCH_OVERDUES, fetchOverdues);
  yield takeEvery(types.FETCH_ADDITIONAL_SERVICES, fetchAdditionalServices);
  yield takeEvery(
    types.FETCH_ACTIVE_ADDITIONAL_SERVICES,
    fetchActiveAdditionalServices,
  );
  yield takeEvery(types.CLEAR_PAYMENT_SCHEDULE, clearPaymentSchedule);
  yield takeEvery(types.CREATE_PAYMENT_SCHEDULE, createPaymentSchedule);
  yield takeEvery(types.FETCH_BILLING_PAYMENTS, fetchBillingPayments);
  yield takeEvery(
    types.FETCH_PROCESSED_SCHEDULED_PAYMENTS,
    fetchProcessedAndScheduledPayments,
  );
  yield takeEvery(types.FETCH_FAMILY_MEMBERS, fetchFamilyMembers);
  yield takeEvery(types.REGISTER_BILLING_MEMBER, registerBillingMember);
  yield takeEvery(types.EDIT_PAYMENT_METHOD, editPaymentMethod);
  yield takeEvery(types.REFUND_TRANSACTION, refundTransaction);
  yield takeEvery(types.REFUND_POS_TRANSACTION, refundPOSTransaction);
  yield takeEvery(types.REFUND_CASH_TRANSACTION, refundCashTransaction);
  yield takeEvery(types.SYNC_BILLING_CUSTOMER, syncBillingCustomer);
  yield takeEvery(types.FETCH_NEW_CUSTOMERS, fetchNewCustomers);
  yield takeEvery(types.FETCH_ACTION_REQUESTS, fetchActionRequests);
  yield takeEvery(types.FETCH_VARIATION_CUSTOMERS, fetchVariationCustomers);
  yield takeEvery(types.FETCH_CUSTOMER_REFUNDS, fetchCustomerRefunds);
  yield takeEvery(types.FETCH_BILLING_CUSTOMERS, fetchBillingCustomers);
  yield takeEvery(types.CREATE_BILLING_MEMBERS, createBillingMembers);
  yield takeEvery(types.SYNC_BILLING_MEMBERS, syncBillingMembers);
  yield takeEvery(types.CREATE_BILLING_STATISTICS, createBillingStatistics);
  yield takeEvery(types.CREATE_STATISTIC, createStatistic);
  yield takeEvery(
    types.FETCH_INACTIVE_CUSTOMERS_COUNT,
    fetchInactiveCustomersCount,
  );
  yield takeEvery(types.PROMOTE_MEMBER, promoteMember);
  yield takeEvery(types.CREATE_MEMBER_ACCOUNT, createMemberUserAccount);
  yield takeEvery(types.ADD_CASH_PAYMENT, addCashPayment);
  yield takeEvery(types.FETCH_MEMBER_CASH_PAYMENTS, fetchMemberCashPayments);
  yield takeEvery(types.FETCH_CASH_PAYMENTS_BYDATE, fetchCashPaymentsByDate);
}

export default function fetchMemberById(id) {
  const submission = CoreAPI.fetchSubmission({
    id: id,
    include: SUBMISSION_INCLUDES,
  });
  return submission;
}

export function updateBillingMember(options) {
  const submission = CoreAPI.updateSubmission({
    id: options.id,
    values: options.memberItem.values,
  });
  return submission;
}

export function updateBillingMembers(
  parentMemberId,
  membersToUpdate,
  membersToRemove,
) {
  membersToUpdate.forEach(member => {
    member.values['Billing Parent Member'] = parentMemberId;
    delete member.toBeUpdated;
    updateBillingMember({ id: member['id'], memberItem: member });
  });

  membersToRemove.forEach(member => {
    updateBillingMember({ id: member['id'], memberItem: member });
  });
}

export function* cancelAdditionalService(action) {
  let values = {};
  values['Status'] = 'Cancelled';
  const { submission } = yield call(CoreAPI.updateSubmission, {
    id: action.payload['id'],
    values: values,
    datastore: true,
  });

  console.log('cancelAdditionalService');
}

function getBillingChanges(memberItem) {
  let changes = memberItem.values['Billing Changes'];
  if (!changes) {
    changes = [];
  } else if (typeof changes !== 'object') {
    changes = JSON.parse(changes);
  }
  return changes;
}

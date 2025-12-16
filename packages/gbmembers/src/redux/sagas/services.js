import { all, call, put, takeEvery } from 'redux-saga/effects';
import {
  SubmissionSearch,
  searchSubmissions,
  createSubmission,
  fetchSubmission,
} from '@kineticdata/react';

import { actions, types } from '../modules/services';
import { actions as systemErrorActions } from '../modules/systemError';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import moment from 'moment';
const util = require('util');

export function* fetchServicesByDate(action) {
  try {
    const kappSlug = 'services';
    const searchBuilder = new SubmissionSearch()
      .type('Service')
      .sortBy('submittedAt')
      .sortDirection('DESC')
      .limit(1000)
      .includes([
        'details',
        'values[First Name],values[Last Name],values[Student First Name],values[Student Last Name],values[Members],values[Payment Required],values[Term Date],values[Term End Date],values[Registration Fee]',
        'form',
      ]);

    if (action.payload !== undefined) {
      searchBuilder.startDate(action.payload.fromDate.toDate());
      searchBuilder.endDate(action.payload.toDate.toDate());
    }
    searchBuilder.end();

    const search = searchBuilder.build();

    const { submissions } = yield call(searchSubmissions, {
      get: true,
      kapp: 'services',
      search,
    });

    const serverError = submissions.serverError;
    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else {
      yield put(actions.setServices(submissions));
    }
  } catch (error) {
    console.log('Error in fetchServicesByDate: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* sendReceipt(action) {
  try {
    const { submission } = yield call(createSubmission, {
      datastore: true,
      formSlug: 'receipt-sender',
      values: action.payload.values,
    });
    console.log('sendReceipt');
    yield put(errorActions.addSuccess('Email Receipt Sent', 'Send Receipt'));
  } catch (error) {
    console.log('Error in sendReceipt: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchSenderReceipt(action) {
  try {
    const SUBMISSION_INCLUDES = 'details,values';
    const { submission, serverError } = yield call(fetchSubmission, {
      id: action.payload.id,
      include: SUBMISSION_INCLUDES,
      datastore: true,
    });

    yield put(actions.setSenderReceipt(submission));
  } catch (error) {
    console.log('Error in fetchSenderReceipt: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}

export function* fetchBillingChangeByBillingReference(action) {
  try {
    var membershipServices = [];
    if (action.payload.franchisor === 'YES') {
      yield put(actions.setBillingChangeByBillingReference(membershipServices));
    } else {
      if (action.payload.billingCompany === 'Bambora') {
        const BAMBORA_REGISTRATION_SEARCH = new SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const BAMBORA_REMOTE_REGISTRATION_SEARCH = new SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[The first instalment is due on]',
          ])
          .limit(25)
          .build();

        const BAMBORA_BILLING_CHANGES_SEARCH = new SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective],values[New Billing Start Date]',
          ])
          .limit(25)
          .build();

        const BAMBORA_SETUP_BILLER_SEARCH = new SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [
          registrations,
          remoteRegistrations,
          billingChanges,
          setupBillers,
        ] = yield all([
          call(searchSubmissions, {
            get: true,
            form: 'bambora-member-registration',
            kapp: 'services',
            search: BAMBORA_REGISTRATION_SEARCH,
          }),
          call(searchSubmissions, {
            get: true,
            form: 'bambora-remote-registration',
            kapp: 'services',
            search: BAMBORA_REMOTE_REGISTRATION_SEARCH,
          }),
          call(searchSubmissions, {
            get: true,
            form: 'bambora-submit-billing-changes',
            kapp: 'services',
            search: BAMBORA_BILLING_CHANGES_SEARCH,
          }),
          call(searchSubmissions, {
            get: true,
            form: 'bambora-setup-biller-details',
            kapp: 'services',
            search: BAMBORA_SETUP_BILLER_SEARCH,
          }),
        ]);

        billingChanges.submissions = billingChanges.submissions.sort((a, b) => {
          if (
            moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isBefore(
              moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
            )
          ) {
            return 1;
          }
          if (
            moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isAfter(
              moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
            )
          ) {
            return -1;
          }
          return 0;
        });
        for (let i = 0; i < billingChanges.submissions.length; i++) {
          if (
            billingChanges.submissions[i].coreState === 'Submitted' ||
            billingChanges.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                billingChanges.submissions[i]['submittedAt'],
              ),
              billingStartDate:
                billingChanges.submissions[i].values['Date Affective'] !== null
                  ? moment(
                      billingChanges.submissions[i].values['Date Affective'],
                      'YYYY-MM-DD',
                    )
                  : moment(
                      billingChanges.submissions[i].values[
                        'New Billing Start Date'
                      ],
                      'YYYY-MM-DD',
                    ),
              feeJSON: JSON.parse(
                billingChanges.submissions[i].values['feesJSON'],
              ),
            });
          }
        }
        for (let i = 0; i < setupBillers.submissions.length; i++) {
          if (
            setupBillers.submissions[i].coreState === 'Submitted' ||
            setupBillers.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                setupBillers.submissions[i]['submittedAt'],
              ),
              billingStartDate:
                setupBillers.submissions[i].values['Date Affective'] !== null
                  ? moment(
                      setupBillers.submissions[i].values['Date Affective'],
                      'YYYY-MM-DD',
                    )
                  : moment(
                      setupBillers.submissions[i].values[
                        'New Billing Start Date'
                      ],
                      'YYYY-MM-DD',
                    ),
              feeJSON: JSON.parse(
                setupBillers.submissions[i].values['feesJSON'],
              ),
            });
          }
        }
        for (let i = 0; i < registrations.submissions.length; i++) {
          if (
            registrations.submissions[i].coreState === 'Submitted' ||
            registrations.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                registrations.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                registrations.submissions[i].values['Billing Start Date'],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                registrations.submissions[i].values['feesJSON'],
              ),
            });
          }
        }
        for (let i = 0; i < remoteRegistrations.submissions.length; i++) {
          if (
            remoteRegistrations.submissions[i].coreState === 'Submitted' ||
            remoteRegistrations.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                remoteRegistrations.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                remoteRegistrations.submissions[i].values[
                  'The first instalment is due on'
                ],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                remoteRegistrations.submissions[i].values['feesJSON'],
              ),
            });
          }
        }

        yield put(
          actions.setBillingChangeByBillingReference(membershipServices),
        );
      }
      if (action.payload.billingCompany === 'PaySmart') {
        const PAYSMART_REGISTRATION_SEARCH = new SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const PAYSMART_BILLER_SETUP_SEARCH = new SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [paysmartRegistrations, setupBiller] = yield all([
          call(searchSubmissions, {
            get: true,
            form: 'paysmart-member-registration',
            kapp: 'services',
            search: PAYSMART_REGISTRATION_SEARCH,
          }),
          call(searchSubmissions, {
            get: true,
            form: 'setup-biller-details',
            kapp: 'services',
            search: PAYSMART_BILLER_SETUP_SEARCH,
          }),
        ]);

        setupBiller.submissions = setupBiller.submissions.sort((a, b) => {
          if (
            moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isBefore(
              moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
            )
          ) {
            return 1;
          }
          if (
            moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isAfter(
              moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
            )
          ) {
            return -1;
          }
          return 0;
        });
        for (let i = 0; i < setupBiller.submissions.length; i++) {
          if (
            setupBiller.submissions[i].coreState === 'Submitted' ||
            setupBiller.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                setupBiller.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                setupBiller.submissions[i].values['Date Affective'],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                setupBiller.submissions[i].values['feesJSON'],
              ),
            });
          }
        }
        for (let i = 0; i < paysmartRegistrations.submissions.length; i++) {
          if (
            paysmartRegistrations.submissions[i].coreState === 'Submitted' ||
            paysmartRegistrations.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                paysmartRegistrations.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                paysmartRegistrations.submissions[i].values[
                  'Billing Start Date'
                ],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                paysmartRegistrations.submissions[i].values['feesJSON'],
              ),
            });
          }
        }

        yield put(
          actions.setBillingChangeByBillingReference(membershipServices),
        );
      }
      if (action.payload.billingCompany === 'Stripe') {
        const STRIPE_REGISTRATION_SEARCH = new SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const STRIPE_BILLER_SETUP_SEARCH = new SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [stripeRegistrations, stripeSetupBiller] = yield all([
          call(searchSubmissions, {
            get: true,
            form: 'stripe-member-registration',
            kapp: 'services',
            search: STRIPE_REGISTRATION_SEARCH,
          }),
          call(searchSubmissions, {
            get: true,
            form: 'stripe-setup-biller-details',
            kapp: 'services',
            search: STRIPE_BILLER_SETUP_SEARCH,
          }),
        ]);

        stripeSetupBiller.submissions = stripeSetupBiller.submissions.sort(
          (a, b) => {
            if (
              moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isBefore(
                moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
              )
            ) {
              return 1;
            }
            if (
              moment(a['submittedAt'], 'YYYY-MM-DDTHH:mmZ').isAfter(
                moment(b['submittedAt'], 'YYYY-MM-DDTHH:mmZ'),
              )
            ) {
              return -1;
            }
            return 0;
          },
        );
        for (let i = 0; i < stripeSetupBiller.submissions.length; i++) {
          if (
            stripeSetupBiller.submissions[i].coreState === 'Submitted' ||
            stripeSetupBiller.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                stripeSetupBiller.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                stripeSetupBiller.submissions[i].values['Date Affective'],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                stripeSetupBiller.submissions[i].values['feesJSON'],
              ),
            });
          }
        }
        for (let i = 0; i < stripeRegistrations.submissions.length; i++) {
          if (
            stripeRegistrations.submissions[i].coreState === 'Submitted' ||
            stripeRegistrations.submissions[i].coreState === 'Closed'
          ) {
            membershipServices.push({
              submittedAtDate: moment(
                stripeRegistrations.submissions[i]['submittedAt'],
              ),
              billingStartDate: moment(
                stripeRegistrations.submissions[i].values['Billing Start Date'],
                'YYYY-MM-DD',
              ),
              feeJSON: JSON.parse(
                stripeRegistrations.submissions[i].values['feesJSON'],
              ),
            });
          }
        }

        yield put(
          actions.setBillingChangeByBillingReference(membershipServices),
        );
      }
    }
  } catch (error) {
    console.log(
      'Error in fetchBillingChangeByBillingReference: ' + util.inspect(error),
    );
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchCashRegistrations(action) {
  try {
    const kappSlug = 'services';
    const searchBuilder = new SubmissionSearch()
      .coreState('Submitted')
      .type('Service')
      .sortBy('submittedAt')
      .sortDirection('DESC')
      .eq('values[Members]', action.payload.id)
      .includes([
        'details',
        'values[Student First Name],values[Student Last Name],values[Members],values[Payment Required],values[Term Date],values[Term End Date],values[Payment Frequency],values[feesJSON]',
        'form',
      ])
      .build();

    const { submissions } = yield call(searchSubmissions, {
      get: true,
      form: 'cash-member-registration',
      kapp: 'services',
      search: searchBuilder,
    });

    const serverError = submissions.serverError;
    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else {
      yield put(actions.setCashRegistrations(submissions));
    }
  } catch (error) {
    console.log('Error in fetchCashRegistrations: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* fetchMemberMigrations(action) {
  try {
    let allSubmissions = [];

    let migrationsLastFetchTime =
      action.payload !== undefined &&
      action.payload.migrationsLastFetchTime !== undefined
        ? action.payload.migrationsLastFetchTime
        : undefined;

    /* Remote Registrations START */
    let searchBuilder = new SubmissionSearch()
      .type('Service')
      .sortBy('updatedAt')
      .sortDirection('ASC')
      .includes([
        'details',
        'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent],values[membersJSON]',
      ])
      .limit(1000);

    if (migrationsLastFetchTime !== undefined) {
      searchBuilder = searchBuilder.sortBy('updatedAt');

      searchBuilder = searchBuilder.startDate(
        moment(migrationsLastFetchTime).toDate(),
      );
    }
    searchBuilder = searchBuilder.build();

    var { submissions, nextPageToken } = yield call(searchSubmissions, {
      get: true,
      form: action.payload.billingSystem + '-remote-registration',
      kapp: 'services',
      search: searchBuilder,
    });
    allSubmissions = allSubmissions.concat(submissions);
    while (nextPageToken) {
      var search2 = new SubmissionSearch()
        .type('Service')
        .sortBy('updatedAt')
        .sortDirection('ASC')
        .includes([
          'details',
          'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent]',
        ])
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var { submissions, nextPageToken } = yield call(searchSubmissions, {
        form: action.payload.billingSystem + '-remote-registration',
        kapp: 'services',
        search: search2,
      });

      allSubmissions = allSubmissions.concat(submissions);
    }
    /* Remote Registrations END */

    /* Member Registrations START */
    let searchMemberBuilder = new SubmissionSearch()
      .coreState('Submitted')
      .type('Service')
      .sortBy('submittedAt')
      .sortDirection('ASC')
      .includes([
        'details',
        'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent]',
      ])
      .limit(1000);

    if (migrationsLastFetchTime !== undefined) {
      searchMemberBuilder = searchMemberBuilder.sortBy('updatedAt');

      searchMemberBuilder = searchMemberBuilder.startDate(
        moment(migrationsLastFetchTime).toDate(),
      );
    }
    searchMemberBuilder = searchMemberBuilder.build();

    var { submissions, nextPageToken } = yield call(searchSubmissions, {
      get: true,
      form: action.payload.billingSystem + '-member-registration',
      kapp: 'services',
      search: searchMemberBuilder,
    });
    allSubmissions = allSubmissions.concat(submissions);
    while (nextPageToken) {
      var search2 = new SubmissionSearch()
        .coreState('Submitted')
        .type('Service')
        .sortBy('submittedAt')
        .sortDirection('ASC')
        .includes([
          'details',
          'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent]',
        ])
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var { submissions, nextPageToken } = yield call(searchSubmissions, {
        form: action.payload.billingSystem + '-member-registration',
        kapp: 'services',
        search: search2,
      });

      allSubmissions = allSubmissions.concat(submissions);
    }
    /* Remote Registrations END */

    const serverError = submissions.serverError;
    if (serverError) {
      yield put(systemErrorActions.setSystemError(serverError));
    } else {
      yield put(actions.setMemberMigrations(allSubmissions));
    }
  } catch (error) {
    console.log('Error in fetchMemberMigrations: ' + util.inspect(error));
    yield put(errorActions.setSystemError(error));
  }
}
export function* watchServices() {
  yield takeEvery(types.FETCH_SERVICESBYDATE, fetchServicesByDate);
  yield takeEvery(
    types.FETCH_BILLING_CHANGES_BY_BILLINGREFERENCE,
    fetchBillingChangeByBillingReference,
  );
  yield takeEvery(types.SEND_RECEIPT, sendReceipt);
  yield takeEvery(types.FETCH_SENDER_RECEIPT, fetchSenderReceipt);
  yield takeEvery(types.FETCH_CASH_REGISTRATIONS, fetchCashRegistrations);
  yield takeEvery(types.FETCH_MEMBER_MIGRATIONS, fetchMemberMigrations);
}

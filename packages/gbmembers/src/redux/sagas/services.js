import { all, call, put, takeEvery } from 'redux-saga/effects';
import { CoreAPI } from 'react-kinetic-core';

import { actions, types } from '../modules/services';
import { actions as systemErrorActions } from '../modules/systemError';
import { actions as errorActions, NOTICE_TYPES } from '../modules/errors';
import moment from 'moment';
const util = require('util');

export function* fetchServicesByDate(action) {
  const kappSlug = 'services';
  const searchBuilder = new CoreAPI.SubmissionSearch()
    .coreState('Submitted')
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

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
    kapp: 'services',
    search,
  });

  const serverError = submissions.serverError;
  if (serverError) {
    yield put(systemErrorActions.setSystemError(serverError));
  } else {
    yield put(actions.setServices(submissions));
  }
}
export function* sendReceipt(action) {
  try {
    const { submission } = yield call(CoreAPI.createSubmission, {
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
    const { submission, serverError } = yield call(CoreAPI.fetchSubmission, {
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
        const BAMBORA_REGISTRATION_SEARCH = new CoreAPI.SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const BAMBORA_BILLING_CHANGES_SEARCH = new CoreAPI.SubmissionSearch(
          true,
        )
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective],values[New Billing Start Date]',
          ])
          .limit(25)
          .build();

        const BAMBORA_SETUP_BILLER_SEARCH = new CoreAPI.SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [registrations, billingChanges, setupBillers] = yield all([
          call(CoreAPI.searchSubmissions, {
            form: 'bambora-member-registration',
            kapp: 'services',
            search: BAMBORA_REGISTRATION_SEARCH,
          }),
          call(CoreAPI.searchSubmissions, {
            form: 'bambora-submit-billing-changes',
            kapp: 'services',
            search: BAMBORA_BILLING_CHANGES_SEARCH,
          }),
          call(CoreAPI.searchSubmissions, {
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

        yield put(
          actions.setBillingChangeByBillingReference(membershipServices),
        );
      }
      if (action.payload.billingCompany === 'PaySmart') {
        const PAYSMART_REGISTRATION_SEARCH = new CoreAPI.SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const PAYSMART_BILLER_SETUP_SEARCH = new CoreAPI.SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [paysmartRegistrations, setupBiller] = yield all([
          call(CoreAPI.searchSubmissions, {
            form: 'paysmart-member-registration',
            kapp: 'services',
            search: PAYSMART_REGISTRATION_SEARCH,
          }),
          call(CoreAPI.searchSubmissions, {
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
        const STRIPE_REGISTRATION_SEARCH = new CoreAPI.SubmissionSearch(true)
          .sortDirection('DESC')
          .eq('values[Member ID]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Billing Start Date]',
          ])
          .limit(25)
          .build();

        const STRIPE_BILLER_SETUP_SEARCH = new CoreAPI.SubmissionSearch(true)
          .eq('values[Billing Customer Id]', action.payload.billingCustomerRef)
          .include([
            'details',
            'values[Member ID],values[feesJSON],values[Date Affective]',
          ])
          .limit(25)
          .build();

        const [stripeRegistrations, stripeSetupBiller] = yield all([
          call(CoreAPI.searchSubmissions, {
            form: 'stripe-member-registration',
            kapp: 'services',
            search: STRIPE_REGISTRATION_SEARCH,
          }),
          call(CoreAPI.searchSubmissions, {
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
  const kappSlug = 'services';
  const searchBuilder = new CoreAPI.SubmissionSearch()
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

  const { submissions } = yield call(CoreAPI.searchSubmissions, {
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
}
export function* fetchMemberMigrations(action) {
  try {
    let allSubmissions = [];

    let migrationsLastFetchTime =
      action.payload !== undefined &&
      action.payload.migrationsLastFetchTime !== undefined
        ? action.payload.migrationsLastFetchTime
        : undefined;

    let searchBuilder = new CoreAPI.SubmissionSearch()
      .type('Service')
      .includes([
        'details',
        'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent]',
      ])
      .limit(1000);

    if (migrationsLastFetchTime !== undefined) {
      searchBuilder = searchBuilder.sortBy('updatedAt');

      searchBuilder = searchBuilder.startDate(
        moment(migrationsLastFetchTime).toDate(),
      );
    }
    searchBuilder = searchBuilder.build();

    var { submissions, nextPageToken } = yield call(CoreAPI.searchSubmissions, {
      form: action.payload.billingSystem + '-remote-registration',
      kapp: 'services',
      search: searchBuilder,
    });
    allSubmissions = allSubmissions.concat(submissions);
    while (nextPageToken) {
      var search2 = new CoreAPI.SubmissionSearch()
        .type('Service')
        .includes([
          'details',
          'values[Student First Name],values[Student Last Name],values[Member GUID],values[The first instalment is due on],values[I promise to pay equal FREQUENCY instalments of],values[Billing Customer Reference],values[customerBillingId],values[Form Completion Sent]',
        ])
        .pageToken(nextPageToken)
        .limit(1000)
        .build();

      var { submissions, nextPageToken } = yield call(
        CoreAPI.searchSubmissions,
        {
          form: action.payload.billingSystem + '-remote-registration',
          kapp: 'services',
          search: search2,
        },
      );

      allSubmissions = allSubmissions.concat(submissions);
    }

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

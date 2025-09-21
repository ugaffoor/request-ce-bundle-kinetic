import { call, put } from 'redux-saga/effects';
import { actions } from '../modules/alerts';

global.bundle = {
  apiLocation: () => '/acme/app/api/v1',
};
const { searchSubmissions } = require('@kineticdata/react');
const { fetchAlertsSaga, ALERTS_SEARCH } = require('./alerts');

describe('alerts saga', () => {
  describe('#fetchAlertsSaga', () => {
    describe('when request is successful', () => {
      test('sets the alerts to the response', () => {
        const action = actions.fetchAlerts();
        const saga = fetchAlertsSaga(action);

        // Execute the search.
        const fetchArguments = {
          datastore: true,
          form: 'alerts',
          search: ALERTS_SEARCH,
        };
        expect(saga.next().value).toEqual(
          call(searchSubmissions, fetchArguments),
        );

        // Mock the response and send it to the generator.
        const submissions = [{ id: 'asdf' }, { id: 'foo bar' }];
        const response = { nextPageToken: null, submissions };
        expect(saga.next(response).value).toEqual(
          put(actions.setAlerts(submissions)),
        );
      });
    });

    describe('when the request fails', () => {
      test('sets the alerts error to the response', () => {
        const action = actions.fetchAlerts();
        const saga = fetchAlertsSaga(action);

        // Execute the search.
        const fetchArguments = {
          datastore: true,
          form: 'alerts',
          search: ALERTS_SEARCH,
        };
        expect(saga.next().value).toEqual(
          call(searchSubmissions, fetchArguments),
        );

        // Mock the response and send it to the generator.
        const error = {
          status: 404,
          statusText: 'Request failed with status code 404',
        };
        const response = { serverError: error };
        expect(saga.next(response).value).toEqual(
          put(actions.setAlertsError(error)),
        );
      });
    });
  });
});

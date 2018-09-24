import { List } from 'immutable';
import * as matchers from 'jest-immutable-matchers';
import { reducer, actions, types, State } from './alerts';

beforeEach(() => jest.addMatchers(matchers));

describe('alerts redux module', () => {
  describe('action creators', () => {
    test('fetchAlerts', () => {
      const action = actions.fetchAlerts();
      expect(action.type).toBe(types.FETCH_ALERTS);
      expect(action.payload).toBeUndefined();
    });

    test('setAlerts', () => {
      const data = ['some', 'alerts'];
      const action = actions.setAlerts(data);
      expect(action.type).toBe(types.SET_ALERTS);
      expect(action.payload).toBe(data);
    });

    test('setAlertsError', () => {
      const data = 'error';
      const action = actions.setAlertsError(data);
      expect(action.type).toBe(types.SET_ALERTS_ERROR);
      expect(action.payload).toBe(data);
    });
  });

  describe('reducer', () => {
    test('initializes with default state', () => {
      expect(reducer(undefined, {})).toEqualImmutable(State());
    });

    test('fetchAlerts', () => {
      const before = State({
        data: List('one'),
        error: 'error',
        loading: false,
      });
      const action = actions.fetchAlerts();
      expect(reducer(before, action)).toEqualImmutable(
        State({
          data: List('one'),
          error: 'error',
          loading: true,
        }),
      );
    });

    test('setAlerts', () => {
      const before = State({
        data: List('one'),
        error: 'error',
        loading: true,
      });
      const action = actions.setAlerts(List('two'));
      expect(reducer(before, action)).toEqualImmutable(
        State({
          data: List('two'),
          error: null,
          loading: false,
        }),
      );
    });

    test('setAlertsError', () => {
      const before = State({
        data: List(['one']),
        error: null,
        loading: true,
      });
      const action = actions.setAlertsError('error');
      expect(reducer(before, action)).toEqualImmutable(
        State({
          data: List(['one']),
          error: 'error',
          loading: false,
        }),
      );
    });
  });
});

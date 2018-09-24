import { List } from 'immutable';
import { State as AppState, getFilterByPath } from './app';
import { State as QueueState } from './queue';
import { Filter } from '../../records';

const state = {
  app: AppState({
    filters: List([Filter({ name: 'Mine' }), Filter({ name: 'Teammates' })]),
    myFilters: List([
      Filter({ name: 'Facilities Teammates' }),
      Filter({ name: 'Everything' }),
    ]),
  }),
  queue: QueueState({
    adhocFilter: Filter({ name: 'Adhoc' }),
  }),
};

describe('getFilterByPath', () => {
  describe('matches adhoc filter', () => {
    it('should return the adhocFilter property from queue state', () => {
      expect(getFilterByPath(state, '/custom').name).toBe('Adhoc');
    });
  });

  describe('matches custom filter', () => {
    it('should return the custom filter with matching name', () => {
      expect(getFilterByPath(state, '/custom/Everything').name).toBe(
        'Everything',
      );
      expect(getFilterByPath(state, '/custom/Everything/').name).toBe(
        'Everything',
      );
    });
  });

  describe('matches default filter', () => {
    it('should return the default filter with matching name', () => {
      expect(getFilterByPath(state, '/list/Mine').name).toBe('Mine');
    });
    it('should return the default filter with matching name', () => {
      expect(getFilterByPath(state, '/list/Mine/').name).toBe('Mine');
    });
  });

  describe('does not match any filter type', () => {
    it('returns undefined', () => {
      expect(getFilterByPath(state, '/')).toBeUndefined();
      expect(getFilterByPath(state, '/x')).toBeUndefined();
      expect(getFilterByPath(state, '/list')).toBeUndefined();
      expect(getFilterByPath(state, '/list/x')).toBeUndefined();
      expect(getFilterByPath(state, '/list/Mine/x')).toBeUndefined();
      expect(getFilterByPath(state, '/custom/other')).toBeUndefined();
      expect(getFilterByPath(state, '/custom/Everything/x')).toBeUndefined();
      expect(getFilterByPath(state, '/list/Mine/x')).toBeUndefined();
    });
  });
});

import { selectCurrentKapp } from './selectors';

describe('selectors', () => {
  let state;

  beforeEach(() => {
    state = {
      app: {
        loading: false,
        config: {
          kappSlug: 'this-kapp',
        },
        kapps: [{ slug: 'this-kapp' }],
      },
    };
  });

  describe('#selectCurrentKapp', () => {
    it('returns the current kapp', () => {
      expect(selectCurrentKapp(state)).toBe(state.app.kapps[0]);
    });

    it('returns null when loading', () => {
      state.app.loading.loading = true;
      expect(selectCurrentKapp(state)).toBeNull();
    });

    it('returns null when there is no current kapp', () => {
      state.app.config.kappSlug = null;
      expect(selectCurrentKapp(state)).toBeNull();
    });
  });
});

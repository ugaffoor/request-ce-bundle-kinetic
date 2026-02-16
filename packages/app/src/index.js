import React, { Fragment, lazy, Suspense, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { matchPath } from 'react-router';
import { Provider, connect } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { configureStore } from './redux/store';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { KineticLib, history } from '@kineticdata/react';
import { actions as layoutActions } from './redux/modules/layout';
import { actions as configActions } from './redux/modules/config';
import './assets/styles/master.scss';
import './kinetic/widgets';

const Authentication = lazy(() =>
  import('./AuthenticatedContainer').then(m => ({ default: m.Authentication })),
);

const App = lazy(() => import('./App').then(m => ({ default: m.App })));

export const store = configureStore(history);

const ConnectedKineticLib = connect(state => ({
  locale: state.app.config.locale,
}))(KineticLib);

const useResponsiveListener = () => {
  useEffect(() => {
    const breakpoints = [
      ['small', window.matchMedia('(max-width: 767px)')],
      [
        'medium',
        window.matchMedia('(min-width: 768px) and (max-width: 1200px)'),
      ],
      ['large', window.matchMedia('(min-width: 1201px)')],
    ];

    const handleChange = (size, mql) => {
      if (mql.matches) store.dispatch(layoutActions.setSize(size));
    };

    breakpoints.forEach(([size, mql]) => {
      const listener = () => handleChange(size, mql);
      mql.addEventListener('change', listener);
      handleChange(size, mql);
      mql._listener = listener;
    });

    return () => {
      breakpoints.forEach(([_, mql]) => {
        if (mql._listener) mql.removeEventListener('change', mql._listener);
      });
    };
  }, []);
};

const Root = () => {
  useResponsiveListener();

  useEffect(() => {
    const match = matchPath(history.location.pathname, {
      path: '/kapps/:kappSlug',
    });
    store.dispatch(configActions.setKappSlug(match?.params.kappSlug));
  }, []);

  return (
    <HelmetProvider>
      <Helmet>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0"
        />
      </Helmet>

      <Provider store={store}>
        <ConnectedKineticLib noSocket>
          {({ initialized, ...authProps }) =>
            initialized && (
              <ConnectedRouter history={history}>
                <Suspense fallback={<div>Loading...</div>}>
                  <Authentication {...authProps}>
                    <App />
                  </Authentication>
                </Suspense>
              </ConnectedRouter>
            )
          }
        </ConnectedKineticLib>
      </Provider>
    </HelmetProvider>
  );
};

ReactDOM.render(<Root />, document.getElementById('root'));

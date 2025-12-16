import React, { Fragment } from 'react';
import ReactDOM from 'react-dom';
import { matchPath } from 'react-router';
import { Route } from 'react-router-dom';
import { Provider, connect } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createHashHistory } from 'history';
import { configureStore } from './redux/store';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { KineticLib, history } from '@kineticdata/react';
import AuthInterceptor from './utils/AuthInterceptor';
import { actions as layoutActions } from './redux/modules/layout';
import { actions as configActions } from './redux/modules/config';
import {
  actions as authActions,
  selectors as authSelectors,
} from './redux/modules/auth';
import { Authentication } from './AuthenticatedContainer';
import { App } from './App';

// Create the redux store with the configureStore helper found in redux/store.js
export const store = configureStore(history);

function translationsLoadedCallback() {
  console.log('translationsLoadedCallback');
  if (
    window.bundle.identity() !== 'unus@uniqconsulting.com.au' &&
    window.bundle.config.translations !== undefined &&
    window.bundle.config.translations.shared.Redirect !== undefined
  ) {
    window.location = window.bundle.config.translations.shared.Redirect;
  } else if (
    window.bundle.identity() !== 'anonymous' &&
    window.location.hash.includes('redirected')
  ) {
    window.location.hash = '#/';
  }
}

const ConnectedKineticLib = connect(state => ({
  locale: state.app.config.locale,
}))(KineticLib);

ReactDOM.render(
  <Fragment>
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
              <Authentication {...authProps}>
                <App />
              </Authentication>
            </ConnectedRouter>
          )
        }
      </ConnectedKineticLib>
    </Provider>
  </Fragment>,
  document.getElementById('root'),
);

// Initialize the kappSlug state which is normally set on location change but
// since location changes are not fired on first load we need to do this
// manually.
const match = matchPath(history.location.pathname, {
  path: '/kapps/:kappSlug',
});
store.dispatch(configActions.setKappSlug(match && match.params.kappSlug));

// Add global listeners
[
  ['small', window.matchMedia('(max-width: 767px)')],
  ['medium', window.matchMedia('(min-width: 768px) and (max-width: 1200px)')],
  ['large', window.matchMedia('(min-width: 1201px)')],
].forEach(([size, mql]) => {
  mql.addListener(event => {
    if (event.matches) {
      store.dispatch(layoutActions.setSize(size));
    }
  });
  if (mql.matches) {
    store.dispatch(layoutActions.setSize(size));
  }
});

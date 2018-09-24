import React from 'react';
import ReactDOM from 'react-dom';
import { Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ConnectedRouter } from 'connected-react-router';
import { createHashHistory } from 'history';
import axios from 'axios';
import { CoreAPI } from 'react-kinetic-core';
import AuthInterceptor from './utils/AuthInterceptor';
import {
  actions as authActions,
  selectors as authSelectors,
} from './redux/modules/auth';
import { AppContainer } from './components/AppContainer';
import { configureStore } from './redux/store';
import { actions } from './redux/modules/layout';

// This src/index.js file is the main entry into the React application.  It does
// not contain much application code, instead it is mostly boilerplate code that
// wires up some of the features we want to add to our React application.
//
// When getting started, the most important piece is the line that contains:
//   <Route path="/" component={AppContainer}/>
// which specifies that the root of the application is to be AppContainer which
// can be found in containers/AppContainer.js.  The rest of the application gets
// included as descendants of that component.
//
// The rest of the code below is doing things like setting up a client-side
// router that allows us to define multiple routes and pages all on the
// client-side.  We also setup a redux store, which is a strategy we use for
// storing and organizing the state of the application.  Finally we configure
// the application to support hot module reloading (hmr), which means we can
// update code in our editor and see changes in the browser without refreshing
// the page.

// Create the history instance that enables client-side application routing.
const history = createHashHistory();
// Create the redux store with the configureStore helper found in redux/store.js
const store = configureStore(history);

const authInterceptor = new AuthInterceptor(
  store,
  authActions.timedOut,
  authSelectors.authenticatedSelector,
  authSelectors.cancelledSelector,
);
axios.interceptors.response.use(null, authInterceptor.handleRejected);
CoreAPI.addResponseInterceptor(null, authInterceptor.handleRejected);
CoreAPI.setDefaultAuthAssumed(true);

ReactDOM.render(
  <Provider store={store}>
    <ConnectedRouter history={history}>
      <Route path="/" component={AppContainer} />
    </ConnectedRouter>
  </Provider>,
  document.getElementById('root'),
);

// Add global listeners
[
  ['small', window.matchMedia('(max-width: 767px)')],
  ['medium', window.matchMedia('(min-width: 768px) and (max-width: 1200px)')],
  ['large', window.matchMedia('(min-width: 1201px)')],
].forEach(([size, mql]) => {
  mql.addListener(event => {
    if (event.matches) {
      store.dispatch(actions.setSize(size));
    }
  });
  if (mql.matches) {
    store.dispatch(actions.setSize(size));
  }
});

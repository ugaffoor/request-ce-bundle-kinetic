import React from 'react';
import { connect } from 'react-redux';
import { matchPath, Switch } from 'react-router-dom';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import {
  KappRoute as Route,
  KappRedirect as Redirect,
  Loading,
  Utils,
} from 'common';
import { actions as registrationsActions } from './redux/modules/registrations';
import { actions as registrationCountActions } from './redux/modules/registrationCounts';
import { CatalogContainer } from './components/home/CatalogContainer';
import { CatalogSearchResultsContainer } from './components/search_results/CatalogSearchResultsContainer';
import { Sidebar } from './components/Sidebar';
import { Sidebar as SettingsSidebar } from './components/settings/Sidebar';
import { RequestListContainer } from './components/request_list/RequestListContainer';
import { RequestShowContainer } from './components/request/RequestShowContainer';
import { Settings } from './components/settings/Settings';

import './assets/styles/master.scss';

const mapStateToProps = (state, props) => {
  return {
    registrationCounts: state.registrations.registrationCounts.data,
    errors: [],
    systemError: state.registrations.systemError,
    pathname: state.router.location.pathname,
    settingsBackPath: state.space.spaceApp.settingsBackPath || '/',
  };
};

const mapDispatchToProps = {
  fetchRegistrationCounts: registrationCountActions.fetchRegistrationCounts,
};

export const AppComponent = props => {
  if (props.loading) {
    return <Loading text="App is loading ..." />;
  }
  return props.render({
    sidebar: (
      <Switch>
        <Route
          path="/kapps/services/settings"
          render={() => (
            <SettingsSidebar settingsBackPath={props.settingsBackPath} />
          )}
        />
        <Route
          render={() => (
            <Sidebar
              counts={props.registrationCounts}
              homePageMode={props.homePageMode}
              homePageItems={props.homePageItems}
            />
          )}
        />
      </Switch>
    ),
    main: (
      <main className="package-layout package-layout--services">
        <Route path="/settings" component={Settings} />
        <Route
          path="/submissions/:id"
          exact
          render={({ match, location }) => (
            <Redirect
              to={`/requests/request/${match.params.id}/${
                location.search.includes('review') ? 'review' : 'activity'
              }`}
            />
          )}
        />
        <Route
          exact
          path="/"
          render={() => (
            <CatalogContainer
              homePageMode={props.homePageMode}
              homePageItems={props.homePageItems}
            />
          )}
        />
        <Route exact path="/search" component={CatalogSearchResultsContainer} />
        <Route
          exact
          path="/search/:query"
          component={CatalogSearchResultsContainer}
        />
        <Route exact path="/requests/:type?" component={RequestListContainer} />
        <Route
          exact
          path="/requests/:type?/request/:submissionId/:mode"
          component={RequestShowContainer}
        />
      </main>
    ),
  });
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(props => {}),
  withHandlers({
    openSettings: props => () => props.setSettingsBackPath(props.pathname),
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchRegistrationCounts();
    },
  }),
);

export const App = enhance(AppComponent);

App.shouldSuppressSidebar = (pathname, kappSlug) =>
  matchPath(pathname, { path: `/kapps/${kappSlug}`, exact: false });

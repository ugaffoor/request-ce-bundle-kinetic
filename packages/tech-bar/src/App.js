import React from 'react';
import { connect } from 'react-redux';
import { matchPath, Switch } from 'react-router-dom';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import {
  KappRoute as Route,
  KappRedirect as Redirect,
  Loading,
  ErrorNotFound,
  ErrorUnexpected,
  selectCurrentKappSlug,
} from 'common';
import { actions } from './redux/modules/techBarApp';
import { actions as appointmentActions } from './redux/modules/appointments';
import { Sidebar } from './components/Sidebar';
import { Home } from './components/Home';
import { Past } from './components/Past';
import { TechBars } from './components/TechBars';
import { Display } from './components/Display';
import { Form } from './components/Form';
import { AppointmentForm } from './components/AppointmentForm';
import { Settings } from './components/settings/Settings';
import { Sidebar as SettingsSidebar } from './components/settings/Sidebar';
import { I18n } from '../../app/src/I18nProvider';
import './assets/styles/master.scss';

export const DATE_FORMAT = 'YYYY-MM-DD';
export const TIME_FORMAT = 'HH:mm';

export const AppComponent = props => {
  if (props.loading) {
    return <Loading text="App is loading ..." />;
  } else if (props.errors.length > 0) {
    return <ErrorUnexpected />;
  } else {
    return props.render({
      sidebar: (
        <Switch>
          <Route
            path={`/kapps/${props.kappSlug}/settings`}
            render={() => (
              <SettingsSidebar settingsBackPath={props.settingsBackPath} />
            )}
          />
          <Route
            render={() => (
              <Sidebar
                counts={props.submissionCounts}
                homePageMode={props.homePageMode}
                homePageItems={props.homePageItems}
                openSettings={props.openSettings}
              />
            )}
          />
        </Switch>
      ),
      main: (
        <I18n>
          <main className={`package-layout package-layout--tech-bar`}>
            <Route path="/" exact component={Home} />
            <Route path="/past" exact component={Past} />
            <Route path="/tech-bars" exact component={TechBars} />
            <Route
              path="/forms/:formSlug/submissions/:id"
              exact
              component={Form}
            />
            <Route
              path="/appointment/:techBarId?/:id?"
              exact
              component={AppointmentForm}
            />
            <Route
              path="/past/appointment/:techBarId/:id?"
              exact
              render={props => <AppointmentForm {...props} isPast={true} />}
            />
            <Route path="/forms/:formSlug/:id?" exact component={Form} />
            <Route path="/display/:id/:mode?" exact component={Display} />
            <Route path="/settings" component={Settings} />
          </main>
        </I18n>
      ),
    });
  }
};

const mapStateToProps = (state, props) => {
  const currentKapp = selectCurrentKappSlug(state);
  return {
    pathname: state.router.location.pathname,
    kappSlug: currentKapp,
    settingsBackPath: `/kapps/${currentKapp}`,
    loading: state.techBar.techBarApp.appLoading,
    errors: state.techBar.techBarApp.appErrors,
    fullScreen: matchPath(state.router.location.pathname, {
      path: `/kapps/${currentKapp}/display`,
    }),
  };
};

const mapDispatchToProps = {
  fetchAppSettings: actions.fetchAppSettings,
  fetchUpcomingAppointments: appointmentActions.fetchUpcomingAppointments,
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    componentDidMount() {
      this.props.fetchAppSettings();
      this.props.fetchUpcomingAppointments();
    },
  }),
);

export const App = enhance(AppComponent);

App.shouldSuppressSidebar = (pathname, kappSlug) =>
  matchPath(pathname, { path: `/kapps/${kappSlug}` });
App.shouldHideHeader = (pathname, kappSlug) =>
  matchPath(pathname, { path: `/kapps/${kappSlug}/display` });

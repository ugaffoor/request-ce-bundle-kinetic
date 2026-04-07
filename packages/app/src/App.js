import 'bootstrap/scss/bootstrap.scss';
import 'font-awesome/css/font-awesome.css';
import 'typeface-open-sans/index.css';
import 'common/src/assets/styles/master.scss';
import './assets/styles/master.scss';
import 'space/src/assets/styles/master.scss';
import 'gbmembers/src/styles/master.scss';
import React, { Fragment, lazy } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { matchPath } from 'react-router';
import Sidebar from 'react-sidebar';
import { Utils, ToastsContainer, ModalFormContainer } from 'common';
import { LoginModal } from './components/authentication/LoginModal';
import { HeaderContainer } from './components/HeaderContainer';
import { actions as loadingActions } from './redux/modules/loading';
import { actions as journeyeventsActions } from './redux/modules/journeyevents';
import { actions as helpActions } from './redux/modules/help';
import { actions as layoutActions } from './redux/modules/layout';
//import Favicon from "react-favicon";
import { Helmet } from 'react-helmet';

const ServicesApp = lazy(() =>
  import('services/src/App').then(m => ({ default: m.App })),
);
const RegistrationsApp = lazy(() =>
  import('registrations/src/App').then(m => ({ default: m.App })),
);
const QueueApp = lazy(() =>
  import('queue/src/App').then(m => ({ default: m.App })),
);
const SpaceApp = lazy(() =>
  import('space/src/App').then(m => ({ default: m.App })),
);
const MemberApp = lazy(() =>
  import('gbmembers/src/components/AppContainer').then(m => ({
    default: m.AppContainer,
  })),
);

require('react-dom');
/*window.React2 = require('react');
console.log("React instance count test:"+window.React1 === window.React2);
console.log("React1 version:"+window.React1.version);
console.log("React2 t:"+window.React2.version); */

export const clientId =
  process.env.NODE_ENV === 'development'
    ? 'kinetic-bundle-dev'
    : 'kinetic-bundle';

//<Favicon url="https://us-gbfms-files.s3.us-east-2.amazonaws.com/favicon.ico" />

export const AppComponent = props =>
  !props.loading && (
    <div>
      <Helmet>
        {
          <link
            rel="icon"
            href="https://us-gbfms-files.s3.us-east-2.amazonaws.com/favicon.ico"
            type="image/x-icon"
          />
        }
      </Helmet>
      <Fragment>
        <ToastsContainer />
        <LoginModal />
        <ModalFormContainer />
        {!props.headerHidden ? (
          <Fragment>
            <HeaderContainer
              hasSidebar={!props.sidebarHidden}
              toggleSidebarOpen={props.toggleSidebarOpen}
            />
            <props.AppProvider
              render={({ main, sidebar, header }) =>
                !props.sidebarHidden && sidebar ? (
                  <Sidebar
                    sidebar={sidebar}
                    shadow={false}
                    open={props.sidebarOpen && props.layoutSize === 'small'}
                    docked={props.sidebarOpen && props.layoutSize !== 'small'}
                    onSetOpen={props.setSidebarOpen}
                    rootClassName="sidebar-layout-wrapper"
                    sidebarClassName={`sidebar-container ${
                      true ? 'drawer' : 'overlay'
                    }`}
                    contentClassName={`main-container ${
                      props.sidebarOpen ? 'open' : 'closed'
                    }`}
                  >
                    {main}
                  </Sidebar>
                ) : (
                  <div className="main-container main-container--no-sidebar">
                    {main}
                  </div>
                )
              }
            />
          </Fragment>
        ) : (
          <props.AppProvider
            render={({ main }) => (
              <div className="main-container main-container--no-header">
                {main}
              </div>
            )}
          />
        )}
      </Fragment>
    </div>
  );

export const mapStateToProps = state => ({
  loading: state.app.loading.loading,
  metaJSONLocation: state.app.loading.metaJSONLocation,
  kapps: state.app.kapps,
  sidebarOpen: state.app.layout.sidebarOpen,
  suppressedSidebarOpen: state.app.layout.suppressedSidebarOpen,
  layoutSize: state.app.layout.size,
  kappSlug: state.app.config.kappSlug,
  pathname: state.router.location.pathname,
  locale: state.app.config.locale,
  space: state.member.app.space,
});
export const mapDispatchToProps = {
  loadApp: loadingActions.loadApp,
  fetchJourneyEvents: journeyeventsActions.fetchJourneyEvents,
  fetchHelp: helpActions.fetchHelp,
  setSidebarOpen: layoutActions.setSidebarOpen,
  setSuppressedSidebarOpen: layoutActions.setSuppressedSidebarOpen,
};

const APP_METADATA = {
  services: {
    shouldSuppressSidebar: (pathname, kappSlug) => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        return matchPath(pathname, {
          path: `/kapps/${kappSlug}`,
          exact: false,
        });
      }
      return undefined;
    },
  },
  registrations: {
    shouldSuppressSidebar: (pathname, kappSlug) =>
      matchPath(pathname, { path: `/kapps/${kappSlug}`, exact: false }),
  },
};

const getAppProvider = kapp => {
  const bundlePackage = kapp
    ? Utils.getAttributeValue(kapp, 'Bundle Package', kapp.slug)
    : 'space';
  switch (bundlePackage) {
    case 'services':
      return { Component: ServicesApp, meta: APP_METADATA.services };
    case 'registrations':
      return { Component: RegistrationsApp, meta: APP_METADATA.registrations };
    case 'queue':
      return { Component: QueueApp, meta: {} };
    case 'gbmembers':
      return { Component: MemberApp, meta: {} };
    default:
      return { Component: SpaceApp, meta: {} };
  }
};

export const App = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => {
    const { Component: AppProvider, meta } = getAppProvider(
      props.kapps.find(kapp => kapp.slug === props.kappSlug),
    );
    const shouldSuppressSidebar =
      meta.shouldSuppressSidebar &&
      meta.shouldSuppressSidebar(props.pathname, props.kappSlug);
    const sidebarOpen = shouldSuppressSidebar
      ? props.suppressedSidebarOpen
      : props.sidebarOpen;
    const headerHidden =
      meta.shouldHideHeader &&
      meta.shouldHideHeader(props.pathname, props.kappSlug);
    const sidebarHidden =
      meta.shouldHideSidebar &&
      meta.shouldHideSidebar(props.pathname, props.kappSlug);
    return {
      AppProvider,
      shouldSuppressSidebar,
      sidebarOpen,
      headerHidden,
      sidebarHidden,
      loading: props.loading,
      metaJSONLocation: props.metaJSONLocation,
    };
  }),
  withHandlers({
    toggleSidebarOpen: props => () => {
      console.log('sidebar');
      return props.shouldSuppressSidebar
        ? props.setSuppressedSidebarOpen(!props.sidebarOpen)
        : props.setSidebarOpen(!props.sidebarOpen);
    },
  }),
  lifecycle({
    componentDidMount() {
      this.props.loadApp(true);
      this.props.fetchJourneyEvents();
      this.props.fetchHelp();
    },
  }),
)(AppComponent);

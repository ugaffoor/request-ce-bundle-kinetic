import 'bootstrap/scss/bootstrap.scss';
import 'font-awesome/css/font-awesome.css';
import 'typeface-open-sans/index.css';
import 'common/src/assets/styles/master.scss';
import './assets/styles/master.scss';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import Sidebar from 'react-sidebar';
import { Utils, ToastsContainer, ModalFormContainer } from 'common';
import { LoginModal } from './components/authentication/LoginModal';
import { HeaderContainer } from './components/HeaderContainer';
import { actions as loadingActions } from './redux/modules/loading';
import { actions as journeyeventsActions } from './redux/modules/journeyevents';
import { actions as helpActions } from './redux/modules/help';
import { actions as layoutActions } from './redux/modules/layout';
import { App as ServicesApp } from 'services/src/App';
import { App as RegistrationsApp } from 'registrations/src/App';
import { App as QueueApp } from 'queue/src/App';
import { App as SpaceApp } from 'space/src/App';
import { AppContainer as MemberApp } from 'gbmembers/src/components/AppContainer';
//import Favicon from "react-favicon";
import { Helmet } from 'react-helmet';

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

const getAppProvider = kapp => {
  const bundlePackage = kapp
    ? Utils.getAttributeValue(kapp, 'Bundle Package', kapp.slug)
    : SpaceApp;
  switch (bundlePackage) {
    case 'services':
      return ServicesApp;
    case 'registrations':
      return RegistrationsApp;
    case 'queue':
      return QueueApp;
    case 'gbmembers':
      return MemberApp;
    default:
      return SpaceApp;
  }
};

export const App = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(props => {
    const AppProvider = getAppProvider(
      props.kapps.find(kapp => kapp.slug === props.kappSlug),
    );
    const shouldSuppressSidebar =
      AppProvider.shouldSuppressSidebar &&
      AppProvider.shouldSuppressSidebar(props.pathname, props.kappSlug);
    const sidebarOpen = shouldSuppressSidebar
      ? props.suppressedSidebarOpen
      : props.sidebarOpen;
    const headerHidden =
      AppProvider.shouldHideHeader &&
      AppProvider.shouldHideHeader(props.pathname, props.kappSlug);
    const sidebarHidden =
      AppProvider.shouldHideSidebar &&
      AppProvider.shouldHideSidebar(props.pathname, props.kappSlug);
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

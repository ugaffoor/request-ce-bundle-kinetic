import 'bootstrap/scss/bootstrap.scss';
import 'font-awesome/css/font-awesome.css';
import 'typeface-open-sans/index.css';
import 'common/src/assets/styles/master.scss';
import './assets/styles/master.scss';
import 'discussions/src/assets/styles/master.scss';
import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import Sidebar from 'react-sidebar';
import { Utils, ToastsContainer, ModalFormContainer } from 'common';
import { LoginModal } from './components/authentication/LoginModal';
import { HeaderContainer } from './components/HeaderContainer';
import { actions as loadingActions } from './redux/modules/loading';
import { actions as alertsActions } from './redux/modules/alerts';
import { actions as layoutActions } from './redux/modules/layout';
import { App as ServicesApp } from 'services/src/App';
import { App as QueueApp } from 'queue/src/App';
import { App as SpaceApp } from 'space/src/App';
import { App as TechBarApp } from 'tech-bar/src/App';
import { AppContainer as MemberApp } from 'gbmembers/src/components/AppContainer';

export const AppComponent = props =>
  !props.loading && (
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
  );

export const mapStateToProps = state => ({
  loading: state.app.loading,
  kapps: state.app.kapps,
  sidebarOpen: state.app.layout.sidebarOpen,
  suppressedSidebarOpen: state.app.layout.suppressedSidebarOpen,
  layoutSize: state.app.layout.size,
  kappSlug: state.app.config.kappSlug,
  pathname: state.router.location.pathname,
  locale: state.app.config.locale,
});
export const mapDispatchToProps = {
  loadApp: loadingActions.loadApp,
  fetchAlerts: alertsActions.fetchAlerts,
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
    case 'queue':
      return QueueApp;
    case 'gbmembers':
      return MemberApp;
    case 'tech-bar':
      return TechBarApp;
    default:
      return SpaceApp;
  }
};

export const App = compose(
  connect(mapStateToProps, mapDispatchToProps),
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
    };
  }),
  withHandlers({
    toggleSidebarOpen: props => () =>
      props.shouldSuppressSidebar
        ? props.setSuppressedSidebarOpen(!props.sidebarOpen)
        : props.setSidebarOpen(!props.sidebarOpen),
  }),
  lifecycle({
    componentDidMount() {
      this.props.loadApp(true);
      this.props.fetchAlerts();
    },
  }),
)(AppComponent);

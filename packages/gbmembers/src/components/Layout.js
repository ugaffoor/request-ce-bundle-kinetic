import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompose';
import Sidebar from 'react-sidebar';
//import { Sidebar } from './Sidebar';
import * as selectors from '../lib/react-kinops-components/src/redux/kinopsSelectors';

export const Layout = ({
  isOpenedBar,
  sidebarOpen,
  isLarge,
  toggleSidebarOpen,
  setSidebarOpen,
  mainContent,
  sidebarContent,
  isKiosk,
}) => (
  <div
    className={
      /Safari/.test(navigator.userAgent) &&
      /Apple Computer/.test(navigator.vendor)
        ? 'layout isSafari'
        : 'layout'
    }
  >
    <Sidebar
      sidebar={!isKiosk ? sidebarContent : <div />}
      shadow={false}
      open={!isKiosk ? isOpenedBar && !isLarge : false}
      docked={isOpenedBar && isLarge}
      toggleSidebarOpen={toggleSidebarOpen}
      onSetOpen={setSidebarOpen}
      rootClassName={'sidebarMain'}
      sidebarClassName={`sidebar-content ${isLarge ? 'drawer' : 'overlay'}`}
    >
      {mainContent}
    </Sidebar>
  </div>
);

export const mapStateToProps = state => ({
  isLarge: state.app.layout.get('size') !== 'small',
  isOpenedBar: state.app.layout.get('sidebarOpen'),
  isKiosk: selectors.selectHasRoleKiosk(state),
});

export const LayoutContainer = compose(
  connect(mapStateToProps),
  withState('sidebarOpen', 'setSidebarOpen', ({ isLarge }) => isLarge),
  withHandlers({
    toggleSidebarOpen: props => () => props.setSidebarOpen(isOpen => !isOpen),
  }),
)(Layout);

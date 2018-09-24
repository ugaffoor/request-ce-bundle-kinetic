import React from 'react';
import { connect } from 'react-redux';
import { compose, withHandlers, withState } from 'recompose';
import Sidebar from 'react-sidebar';
//import { Sidebar } from './Sidebar';

export const Layout = ({
  isOpenedBar,
  sidebarOpen,
  isLarge,
  toggleSidebarOpen,
  setSidebarOpen,
  mainContent,
  sidebarContent,
}) => (
  <div className="layout">
    <Sidebar
      sidebar={sidebarContent}
      shadow={false}
      open={isOpenedBar && !isLarge}
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
});

export const LayoutContainer = compose(
  connect(mapStateToProps),
  withState('sidebarOpen', 'setSidebarOpen', ({ isLarge }) => isLarge),
  withHandlers({
    toggleSidebarOpen: props => () => props.setSidebarOpen(isOpen => !isOpen),
  }),
)(Layout);

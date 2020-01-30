import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import { bundle } from 'react-kinetic-core';

export const SidebarComponent = ({ settingsBackPath, loading, spaceAdmin }) => (
  <div className="sidebar space-sidebar">
    <Link to="/kapps/services" className="nav-return">
      <span className="fa fa-fw fa-chevron-left" />
      Return to Services
    </Link>
    <div className="sidebar-group--content-wrapper">
      {!loading && (
        <ul className="nav flex-column settings-group">
          <li className="nav-item">
            {spaceAdmin && (
              <NavLink
                to="/kapps/services/settings/kapp"
                className="nav-link"
                activeClassName="active"
              >
                General
                <span className="fa fa-fw fa-angle-right" />
              </NavLink>
            )}
            <NavLink
              to="/kapps/services/settings/forms"
              className="nav-link"
              activeClassName="active"
            >
              Forms
              <span className="fa fa-fw fa-angle-right" />
            </NavLink>
          </li>
        </ul>
      )}
    </div>
  </div>
);

export const mapStateToProps = state => ({
  loading: state.services.servicesSettings.loading,
  forms: state.services.forms.data,
  spaceAdmin: state.app.profile.spaceAdmin,
  pathname: state.router.location.pathname,
});

export const Sidebar = compose(connect(mapStateToProps))(SidebarComponent);

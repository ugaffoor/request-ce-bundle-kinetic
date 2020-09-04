import React from 'react';
import { KappLink as Link, KappNavLink as NavLink } from 'common';
import { Nav, NavItem } from 'reactstrap';
import { I18n } from '../../../app/src/I18nProvider';

const formatCount = count =>
  count || count === 0 ? (count >= 1000 ? '(999+)' : `(${count})`) : '';

export const Sidebar = ({
  counts,
  handleOpenNewItemMenu,
  myFilters,
  teamFilters,
  hasTeammates,
  hasTeams,
  hasForms,
}) => (
  <div className="sidebar sidebar-queue">
    <div className="sidebar-group--content-wrapper">
      {hasForms && (
        <div className="sidebar-group sidebar-new-task">
          <button
            type="button"
            className="btn btn-secondary btn-sidebar-action"
            onClick={handleOpenNewItemMenu}
          >
            <I18n>New Task</I18n>
          </button>
        </div>
      )}
      <div className="sidebar-group sidebar-default-filters">
        <h1>Default Filters</h1>
        <Nav vertical>
          <NavItem>
            <NavLink
              to="/list/Mine"
              className="nav-link"
              activeClassName="active"
            >
              <span className="fa fa-fw fa-user" />
              <I18n>Mine</I18n> {formatCount(counts.get('Mine'))}
            </NavLink>
          </NavItem>
          {hasTeammates && (
            <NavItem>
              <NavLink
                to="/list/Teammates"
                className="nav-link"
                activeClassName="active"
              >
                <span className="fa fa-fw fa-users" />
                <I18n>Teammates</I18n> {formatCount(counts.get('Teammates'))}
              </NavLink>
            </NavItem>
          )}
          {hasTeams && (
            <NavItem>
              <NavLink
                to="/list/Unassigned"
                className="nav-link"
                activeClassName="active"
              >
                <span className="fa fa-fw fa-inbox" />
                <I18n>Unassigned</I18n> {formatCount(counts.get('Unassigned'))}
              </NavLink>
            </NavItem>
          )}
          <NavItem>
            <NavLink
              to="/list/Created By Me"
              className="nav-link"
              activeClassName="active"
            >
              <span className="fa fa-fw fa-user-circle-o" />
              <I18n>Created By Me</I18n>{' '}
              {formatCount(counts.get('Created By Me'))}
            </NavLink>
          </NavItem>
        </Nav>
      </div>
      {hasTeams && (
        <div className="sidebar-group sidebar-team-filters">
          <h1>
            <I18n>Team Filters</I18n>
          </h1>
          <Nav vertical>
            {teamFilters.map(filter => (
              <NavItem key={filter.name}>
                <NavLink
                  to={`/team/${encodeURIComponent(filter.name)}`}
                  className="nav-link"
                  activeClassName="active"
                >
                  <span className={`fa fa-fw fa-${filter.icon}`} />
                  <I18n>{`${filter.name}`}</I18n>
                </NavLink>
              </NavItem>
            ))}
          </Nav>
        </div>
      )}
      <div className="sidebar-group sidebar-my-filters">
        <h1>
          <I18n>My Filters</I18n>
        </h1>
        <Nav vertical>
          {myFilters.map(filter => (
            <NavItem key={filter.name}>
              <NavLink
                to={`/custom/${encodeURIComponent(filter.name)}`}
                className="nav-link"
                activeClassName="active"
              >
                <span className="fa fa-fw fa-star-o" />

                {`${filter.name}`}
              </NavLink>
            </NavItem>
          ))}
          {myFilters.size === 0 && (
            <NavItem>
              <i className="nav-link">
                <span className="fa fa-filled-star" />
                <I18n>None Configured</I18n>
              </i>
            </NavItem>
          )}
        </Nav>
      </div>
    </div>
    <div className="sidebar-group sidebar-group--settings">
      <ul className="nav flex-column settings-group">
        <Link to="/settings/" className="nav-link">
          <I18n>Settings</I18n>
          <span className="fa fa-fw fa-angle-right" />
        </Link>
      </ul>
    </div>
  </div>
);

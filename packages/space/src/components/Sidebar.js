import React from 'react';
import { Utils } from 'common';
import { Link, NavLink } from 'react-router-dom';
import { getTeamColor } from '../utils';
import { I18n } from '../../../app/src/I18nProvider';

export const Sidebar = ({ kapps, teams, isSpaceAdmin, openSettings }) => (
  <div className="sidebar space-sidebar">
    <div className="sidebar-group--content-wrapper">
      <div className="sidebar-group sidebar-group--my-teams">
        <h1>
          <I18n>My Teams</I18n>
          <Link to="/teams" className="view-all">
            <I18n>All Teams</I18n>
          </Link>
        </h1>

        {teams.length === 0 && (
          <ul className="nav flex-column">
            <li className="nav-item">
              <Link to="/teams" className="nav-link">
                <I18n>Join a team</I18n>
              </Link>
            </li>
            {isSpaceAdmin && (
              <li className="nav-item">
                <Link to="/teams/new" className="nav-link">
                  <I18n>Create a team</I18n>
                </Link>
              </li>
            )}
          </ul>
        )}
        <ul className="nav flex-column">
          {teams.length > 0 &&
            teams.map(team => (
              <li key={team.slug} className="nav-item">
                <NavLink
                  to={`/teams/${team.slug}`}
                  className="nav-link"
                  activeClassName="active"
                >
                  <span
                    style={{ background: getTeamColor(team) }}
                    className={`fa ${Utils.getAttributeValue(
                      team,
                      'Icon',
                      'fa-group',
                    )} fa-fw card-icon`}
                  />
                  <I18n>{`${team.name}`}</I18n>
                </NavLink>
              </li>
            ))}
        </ul>
      </div>
    </div>
    <div className="sidebar-group sidebar-group--settings">
      <ul className="nav flex-column settings-group">
        <Link
          to="/settings/profile"
          onClick={openSettings}
          className="nav-link"
        >
          <I18n>Settings</I18n>
          <span className="fa fa-fw fa-angle-right" />
        </Link>
      </ul>
    </div>
  </div>
);

import React from 'react';
import {
  UncontrolledDropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Navbar,
  Nav,
  NavItem,
} from 'reactstrap';
import { KappNavLink as NavLink } from 'common';
import classNames from 'classnames';
import { bundle } from 'react-kinetic-core';
import SVGInline from 'react-svg-inline';

import { getAttributeValue } from '../../utils';
import { AlertsContainer } from './AlertsContainer';
import { ProfileContainer } from './ProfileContainer';
import { CompanyLogoContainer } from '../../../../../components/CompanyLogo';
import hamburgerIcon from '../../../../../images/hamburger.svg';
import homeIcon from '../../../../../images/home3.svg';
import attendanceIcon from '../../../../../images/flag.svg';
import leadsIcon from '../../../../../images/smile.svg';
import sendIcon from '../../../../../images/envelop.svg';
import gradingIcon from '../../../../../images/star-full.svg';

const BuildKappLink = ({ kapp, nameOverride = kapp.name }) => (
  <DropdownItem tag="a" href={bundle.kappLocation(kapp.slug)}>
    <span
      className={classNames(
        'fa fa-fw',
        getAttributeValue(kapp, 'Icon') || 'fa-book',
      )}
    />
    {nameOverride}
  </DropdownItem>
);

export const Header = ({
  hasSidebar,
  toggleSidebarOpen,
  isGuest,
  isSpaceAdmin,
  hasAccessToManagement,
  hasAccessToSupport,
  currentKapp,
  adminKapp,
  predefinedKapps,
  additionalKapps,
  loading,
}) => (
  <Navbar color="faded" light fixed="top" display={loading ? 'none' : 'block'}>
    <Nav className="nav-header">
      {hasSidebar && (
        <NavItem>
          <NavLink
            className="drawer-button icon-wrapper"
            role="button"
            to="#"
            tabIndex="0"
            onClick={toggleSidebarOpen}
          >
            <SVGInline svg={hamburgerIcon} className="icon" />
          </NavLink>
        </NavItem>
      )}
      {!isGuest && (
        <UncontrolledDropdown>
          <DropdownToggle caret nav role="button">
            {currentKapp.name}
          </DropdownToggle>
          <DropdownMenu>
            {isSpaceAdmin && (
              <DropdownItem tag="a" href={bundle.spaceLocation()}>
                <span className="fa fa-fw fa-home" />
                Home
              </DropdownItem>
            )}
            <DropdownItem divider />
            {predefinedKapps.map(thisKapp => (
              <BuildKappLink kapp={thisKapp} key={thisKapp.slug} />
            ))}
            {additionalKapps.map(thisKapp => (
              <BuildKappLink kapp={thisKapp} key={thisKapp.slug} />
            ))}
            {(hasAccessToManagement || hasAccessToSupport) && (
              <DropdownItem divider />
            )}
            {hasAccessToManagement && (
              <BuildKappLink kapp={adminKapp} nameOverride="Admin Console" />
            )}
            {hasAccessToSupport && (
              <DropdownItem
                tag="a"
                href={`${bundle.kappLocation(
                  adminKapp.slug,
                )}/submission-support`}
              >
                <span className="fa fa-fw fa-clipboard" />
                Submission Support
              </DropdownItem>
            )}
          </DropdownMenu>
        </UncontrolledDropdown>
      )}
      {!isGuest && <AlertsContainer />}
      {!isGuest && <ProfileContainer />}
      <CompanyLogoContainer />
    </Nav>
    <Nav className="nav-header apps">
      {isSpaceAdmin && (
        <NavItem>
          <NavLink
            to="/Home"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={homeIcon} className="icon" />
            <span className="appName">Dashboard</span>
          </NavLink>
        </NavItem>
      )}
      <NavItem>
        <NavLink
          to="/Attendance"
          className="nav-link icon-wrapper"
          strict
          activeClassName="active"
        >
          <SVGInline svg={attendanceIcon} className="icon" />
          <span className="appName">Attendance</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          to="/Leads"
          className="nav-link icon-wrapper"
          strict
          activeClassName="active"
        >
          <SVGInline svg={leadsIcon} className="icon" />
          <span className="appName">Leads / Tasks</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          to="/Send"
          className="nav-link icon-wrapper"
          strict
          activeClassName="active"
        >
          <SVGInline svg={sendIcon} className="icon" />
          <span className="appName">Send</span>
        </NavLink>
      </NavItem>
      <NavItem>
        <NavLink
          to="/Grading"
          className="nav-link icon-wrapper"
          strict
          activeClassName="active"
        >
          <SVGInline svg={gradingIcon} className="icon" />
          <span className="appName">Grading</span>
        </NavLink>
      </NavItem>
    </Nav>
  </Navbar>
);

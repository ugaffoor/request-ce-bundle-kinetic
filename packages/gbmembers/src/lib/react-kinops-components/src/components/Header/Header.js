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
import { bundle } from '@kineticdata/react';

import { getAttributeValue } from '../../utils';
import { AlertsContainer } from './AlertsContainer';
import { ProfileContainer } from './ProfileContainer';
import { CompanyLogoContainer } from '../../../../../components/CompanyLogo';
import { ReactComponent as HamburgerIcon } from '../../../../../images/hamburger.svg';
import { ReactComponent as HomeIcon } from '../../../../../images/home3.svg';
import { ReactComponent as AttendanceIcon } from '../../../../../images/flag.svg';
import { ReactComponent as LeadsIcon } from '../../../../../images/smile.svg';
import { ReactComponent as SendIcon } from '../../../../../images/envelop.svg';
import { ReactComponent as GradingIcon } from '../../../../../images/star-full.svg';

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
            <HamburgerIcon className="icon icon-svg" />
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
            <HomeIcon className="icon icon-svg" />
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
          <AttendanceIcon className="icon icon-svg" />
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
          <LeadsIcon className="icon icon-svg" />
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
          <SendIcon className="icon icon-svg" />
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
          <GradingIcon className="icon icon-svg" />
          <span className="appName">Grading</span>
        </NavLink>
      </NavItem>
    </Nav>
  </Navbar>
);

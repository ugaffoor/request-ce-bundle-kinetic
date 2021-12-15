import React from 'react';
import {
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Navbar,
  Nav,
  NavItem,
  NavLink,
} from 'reactstrap';
import { Link } from 'react-router-dom';
import { KappLink, Utils } from 'common';
import { JourneyEventsContainer } from './JourneyEventsContainer';
import { ProfileContainer } from './ProfileContainer';
import { I18n } from '../I18nProvider';
import SVGInline from 'react-svg-inline';
import gbIcon from '../assets/images/GBMEMBERS.svg?raw';

export const dropdownTitleName = currentKapp => (
  <I18n>{currentKapp ? currentKapp.name : 'Home'}</I18n>
);

export const dropdownIcon = currentKapp =>
  currentKapp
    ? Utils.getAttributeValue(currentKapp, 'Icon') || 'fa-book'
    : 'fa-home';

const BuildKappLink = ({ kapp, onClick, nameOverride = kapp.name }) => (
  <Link className="dropdown-item" to={`/kapps/${kapp.slug}`} onClick={onClick}>
    {Utils.getAttributeValue(kapp, 'Icon') === 'svg-gb-icon' ? (
      <SVGInline svg={gbIcon} className="icon  svg-gb-icon" />
    ) : (
      <span>
        <span
          className={`fa fa-fw' ${Utils.getAttributeValue(kapp, 'Icon') ||
            'fa-book'}`}
        />
        {nameOverride}
      </span>
    )}
  </Link>
);

export const Header = ({
  hasSidebar,
  toggleSidebarOpen,
  isGuest,
  hasAccessToManagement,
  hasAccessToSupport,
  currentKapp,
  adminKapp,
  predefinedKapps,
  additionalKapps,
  kappDropdownOpen,
  kappDropdownToggle,
  space,
}) => (
  <Navbar color="faded" light fixed="top">
    <Nav
      className={
        currentKapp !== null ? currentKapp.slug + ' nav-header' : 'nav-header'
      }
    >
      {hasSidebar && (
        <NavItem id="header-sidebar-toggle">
          <NavLink
            className="drawer-button"
            role="button"
            tabIndex="0"
            onClick={toggleSidebarOpen}
          >
            <i className="fa fa-fw fa-bars" />
          </NavLink>
        </NavItem>
      )}
      <NavItem>
        <KappLink className="nav-link" to="/">
          {dropdownIcon(currentKapp) === 'svg-gb-icon' ||
          (currentKapp !== null && currentKapp.slug === 'services') ? (
            <span>
              <SVGInline svg={gbIcon} className="icon svg-gb-icon" />
            </span>
          ) : (
            <span>
              <span className={`fa fa-fw ${dropdownIcon(currentKapp)}`} />
              <span>&nbsp; {dropdownTitleName(currentKapp)}</span>
            </span>
          )}
        </KappLink>
        {currentKapp !== null && currentKapp.slug === 'services' ? (
          <span className="headerLabel">Services</span>
        ) : (
          ''
        )}
      </NavItem>
      <div className="nav-item-centre">
        {Utils.getAttributeValue(space, 'BarraFIT') === 'TRUE' ? (
          <img
            src="https://us-gbfms-files.s3.us-east-2.amazonaws.com/Barrafit.png"
            alt="BarraFIT Logo"
            className="BarraFITLogo"
          />
        ) : (
          <img
            src="https://gbfms-files.s3-ap-southeast-2.amazonaws.com/GB+Name+Log.png"
            alt="GB Logo"
            className="GBLogo"
          />
        )}
      </div>
      <div className="nav-item-right">
        <Dropdown
          id="header-kapp-dropdown"
          isOpen={kappDropdownOpen}
          toggle={kappDropdownToggle}
        >
          <DropdownToggle nav role="button">
            <i className="fa fa-fw fa-th" />
          </DropdownToggle>
          <DropdownMenu>
            <Link className="dropdown-item" to="/" onClick={kappDropdownToggle}>
              <span className="fa fa-fw fa-home" />
              Home
            </Link>
            <DropdownItem divider />
            {predefinedKapps.map(thisKapp => (
              <BuildKappLink
                kapp={thisKapp}
                key={thisKapp.slug}
                onClick={kappDropdownToggle}
              />
            ))}
            {additionalKapps.map(thisKapp => (
              <BuildKappLink
                kapp={thisKapp}
                key={thisKapp.slug}
                onClick={kappDropdownToggle}
              />
            ))}
          </DropdownMenu>
        </Dropdown>
        {!isGuest && <JourneyEventsContainer />}
        <ProfileContainer space={space} />
      </div>
    </Nav>
  </Navbar>
);

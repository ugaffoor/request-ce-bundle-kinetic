import React from 'react';
import { Navbar, Nav, NavItem } from 'reactstrap';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';

import { CompanyLogoContainer } from './CompanyLogo';
import homeIcon from '../images/Dashboard.svg?raw';
import attendanceIcon from '../images/Attendance.svg?raw';
import leadsIcon from '../images/Leads.svg?raw';
import sendIcon from '../images/Send.svg?raw';
import gradingIcon from '../images/Grading.svg?raw';
import settingsIcon from '../images/Settings.svg?raw';
import reportsIcon from '../images/Reports.svg?raw';
import proShopIcon from '../images/proShop.svg?raw';
import attentionRequired from '../images/flag.svg?raw';

import { Utils } from 'common';

export const Header = ({
  loading,
  profile,
  leadsByDateLoading,
  leadsByDate,
  leadAttentionRequired,
  memberAttentionRequired,
  isKiosk,
}) => (
  <Navbar color="faded" light className="fixed-top">
    {!isKiosk ? (
      <Nav className="nav-header apps">
        <NavItem className="homeNavItem">
          <NavLink
            to="/Home"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={homeIcon} className="icon" />
            <span className="appName">DASHBOARD</span>
            <SVGInline
              svg={attentionRequired}
              className={
                memberAttentionRequired
                  ? 'attention icon'
                  : 'attention icon hide'
              }
            />
          </NavLink>
        </NavItem>
        <NavItem className="attendanceNavItem">
          <NavLink
            to="/Attendance"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={attendanceIcon} className="icon" />
            <span className="appName">ATTENDANCE</span>
          </NavLink>
        </NavItem>
        <NavItem className="leadsNavItem">
          <NavLink
            to="/Leads"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={leadsIcon} className="icon" />
            <span className="appName ">LEADS</span>
            <SVGInline
              svg={attentionRequired}
              className={
                leadAttentionRequired ? 'attention icon' : 'attention icon hide'
              }
            />
          </NavLink>
        </NavItem>
        <NavItem className="sendNavItem">
          <NavLink
            to="/Send"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={sendIcon} className="icon" />
            <span className="appName">SEND</span>
          </NavLink>
        </NavItem>
        <NavItem className="gradingNavItem">
          <NavLink
            to="/Grading"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={gradingIcon} className="icon" />
            <span className="appName">GRADING</span>
          </NavLink>
        </NavItem>
        {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
          <div />
        ) : (
          <NavItem className="settingsNavItem">
            <NavLink
              to="/Settings"
              className="nav-link icon-wrapper"
              strict
              activeClassName="active"
            >
              <SVGInline svg={settingsIcon} className="icon" />
              <span className="appName">SETTINGS</span>
            </NavLink>
          </NavItem>
        )}
        {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
          <div />
        ) : (
          <NavItem className="reportsNavItem">
            <NavLink
              to="/Reports"
              className="nav-link icon-wrapper"
              strict
              activeClassName="active"
            >
              <SVGInline svg={reportsIcon} className="icon" />
              <span className="appName">REPORTS</span>
            </NavLink>
          </NavItem>
        )}
        {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
          <div />
        ) : (
          <NavItem className="proShopNavItem">
            <NavLink
              to="/ProShop"
              className="nav-link icon-wrapper"
              strict
              activeClassName="active"
            >
              <SVGInline svg={proShopIcon} className="icon" />
              <span className="appName">PRO SHOP</span>
            </NavLink>
          </NavItem>
        )}
      </Nav>
    ) : (
      <Nav className="nav-header apps">
        <NavItem className="attendanceNavItem">
          <NavLink
            to="/Attendance"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <SVGInline svg={attendanceIcon} className="icon" />
            <span className="appName">ATTENDANCE</span>
          </NavLink>
        </NavItem>
      </Nav>
    )}
  </Navbar>
);

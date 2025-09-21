import React from 'react';
import { Navbar, Nav, NavItem } from 'reactstrap';
import { KappNavLink as NavLink } from 'common';
import { ReactComponent as Home } from '../images/Dashboard.svg';
import { ReactComponent as Attendance } from '../images/Attendance.svg';
import { ReactComponent as Leads } from '../images/Leads.svg';
import { ReactComponent as Send } from '../images/Send.svg';
import { ReactComponent as Grading } from '../images/Grading.svg';
import { ReactComponent as Reports } from '../images/Reports.svg';
import { ReactComponent as ProShop } from '../images/proShop.svg';
import { ReactComponent as Flag } from '../images/flag.svg';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';

import { Utils } from 'common';

export const Header = ({
  loading,
  profile,
  leadsByDateLoading,
  leadsByDate,
  leadAttentionRequired,
  memberAttentionRequired,
  isKiosk,
  space,
}) => (
  <Navbar
    color="faded"
    light
    className={`fixed-top ${isKiosk ? 'isKiosk' : ''}`}
  >
    {!isKiosk ? (
      <Nav className="nav-header apps">
        <NavItem className="homeNavItem">
          <NavLink
            to="/Home"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <Home className="icon-svg" />
            <span className="appName">DASHBOARD</span>
            <Flag
              className={
                memberAttentionRequired
                  ? 'attention icon icon-svg'
                  : 'attention icon hide icon-svg'
              }
            />
          </NavLink>
        </NavItem>
        {getAttributeValue(space, 'Franchisor') !== 'YES' && (
          <NavItem className="attendanceNavItem">
            <NavLink
              to="/Attendance"
              className="nav-link icon-wrapper"
              strict
              activeClassName="active"
            >
              <Attendance className="icon-svg" />
              <span className="appName">ATTENDANCE</span>
            </NavLink>
          </NavItem>
        )}
        <NavItem className="leadsNavItem">
          <NavLink
            to="/Leads"
            className="nav-link icon-wrapper"
            strict
            activeClassName="active"
          >
            <Leads className="icon-svg" />
            <span className="appName ">LEADS</span>
            <Flag
              className={
                leadAttentionRequired
                  ? 'attention icon icon-svg'
                  : 'attention icon hide icon-svg'
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
            <Send className="icon-svg" />
            <span className="appName">SEND</span>
          </NavLink>
        </NavItem>
        {getAttributeValue(space, 'Franchisor') !== 'YES' && (
          <NavItem className="gradingNavItem">
            <NavLink
              to="/Grading"
              className="nav-link icon-wrapper"
              strict
              activeClassName="active"
            >
              <Grading className="icon-svg" />
              <span className="appName">GRADING</span>
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
              <Reports className="icon-svg" />
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
              <ProShop className="icon-svg" />
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
            <Attendance />
            <span className="appName">ATTENDANCE</span>
          </NavLink>
        </NavItem>
      </Nav>
    )}
  </Navbar>
);

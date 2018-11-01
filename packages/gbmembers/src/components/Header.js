import React from 'react';
import { Navbar, Nav, NavItem } from 'reactstrap';
import { KappNavLink as NavLink } from 'common';
import SVGInline from 'react-svg-inline';

import { CompanyLogoContainer } from './CompanyLogo';
import homeIcon from '../images/home3.svg?raw';
import attendanceIcon from '../images/flag.svg?raw';
import leadsIcon from '../images/smile.svg?raw';
import sendIcon from '../images/envelop.svg?raw';
import gradingIcon from '../images/star-full.svg?raw';
import settingsIcon from '../images/settings-icon.svg?raw';

export const Header = ({ loading }) => (
  <Navbar color="faded" light>
    <CompanyLogoContainer />
    <Nav className="nav-header apps">
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
      <NavItem>
        <NavLink
          to="/Settings"
          className="nav-link icon-wrapper"
          strict
          activeClassName="active"
        >
          <SVGInline svg={settingsIcon} className="icon" />
          <span className="appName">Settings</span>
        </NavLink>
      </NavItem>
    </Nav>
  </Navbar>
);

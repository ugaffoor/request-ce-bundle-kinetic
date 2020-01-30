import React from 'react';
import { KappLink as Link, KappNavLink as NavLink } from 'common';
import { Nav, NavItem } from 'reactstrap';

const formatCount = count =>
  !count ? '' : count >= 1000 ? '(999+)' : `(${count})`;

export const Sidebar = props => (
  <div className="sidebar services-sidebar"></div>
);

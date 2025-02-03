import React from 'react';
import { Avatar } from 'common';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { bundle } from 'react-kinetic-core';
import { I18n } from '../I18nProvider';
import { version } from './package.json';

export const Profile = ({
  profile,
  openFeedbackForm,
  openHelpForm,
  openInviteOthersForm,
  openKitchenSinkForm,
  isOpen,
  toggle,
  isGuest,
  isKiosk,
  space,
}) => (
  <Dropdown isOpen={isOpen} toggle={toggle}>
    <DropdownToggle
      nav
      role="button"
      className="icon-wrapper"
      style={{ padding: '0 1em' }}
    >
      <span className="userCompanyName">
        <div className="userName">{profile.displayName}</div>
        <div className="schoolName">{space.name}</div>
      </span>
      <Avatar size={38} user={profile} previewable={false} />
    </DropdownToggle>
    <DropdownMenu right className="profile-menu">
      <div className="profile-header">
        <h6>
          {profile.displayName}
          <br />
          <small>{profile.email}</small>
        </h6>
      </div>
      <div className="profile-links">
        <div className="dropdown-divider" />
        <div className="dropdown-item">Version:{version}</div>
        <div className="dropdown-divider" />
        <a
          href={`${bundle.spaceLocation()}/app/logout`}
          className="dropdown-item"
        >
          <I18n>Logout</I18n>
        </a>
      </div>
    </DropdownMenu>
  </Dropdown>
);

import React from 'react';
import Avatar from 'react-avatar';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { bundle } from 'react-kinetic-core';

export const Profile = ({
  profile,
  openFeedbackForm,
  openHelpForm,
  openInviteOthersForm,
  openKitchenSinkForm,
  isOpen,
  toggle,
  isGuest,
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
      <Avatar
        size={38}
        email={profile.email}
        name={profile.displayName}
        round
      />
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
        <Link to="/settings/profile" className="dropdown-item" onClick={toggle}>
          Profile
        </Link>
        {profile.spaceAdmin && (
          <a
            role="button"
            tabIndex="0"
            onClick={openInviteOthersForm}
            className="dropdown-item"
          >
            Invite Others
          </a>
        )}
        {!isGuest && (
          <a
            role="button"
            tabIndex="0"
            onClick={openHelpForm}
            className="dropdown-item"
          >
            Get Help
          </a>
        )}
        {!isGuest && (
          <a
            role="button"
            tabIndex="0"
            onClick={openFeedbackForm}
            className="dropdown-item"
          >
            Give Feedback
          </a>
        )}
        {!isGuest && (
          <Link to="/about" className="dropdown-item" onClick={toggle}>
            About My Space
          </Link>
        )}
        <div className="dropdown-divider" />
        <a
          href={`${bundle.spaceLocation()}/app/logout`}
          className="dropdown-item"
        >
          Logout
        </a>
      </div>
    </DropdownMenu>
  </Dropdown>
);

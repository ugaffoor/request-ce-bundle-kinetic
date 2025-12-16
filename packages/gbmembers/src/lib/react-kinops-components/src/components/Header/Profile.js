import React from 'react';
import { UncontrolledDropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { bundle } from '@kineticdata/react';

import { ReactComponent as PersonIcon } from 'font-awesome-svg-png/white/svg/user.svg';

export const Profile = ({
  profile,
  openFeedbackForm,
  openHelpForm,
  openInviteOthersForm,
  openKitchenSinkForm,
}) => (
  <UncontrolledDropdown className="profile">
    <DropdownToggle nav role="button" className="icon-wrapper">
      <PersonIcon className="icon icon-svg" />
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
        <a
          href={`${bundle.spaceLocation()}?page=profile`}
          className="dropdown-item"
        >
          Profile
        </a>
        <div className="dropdown-divider" />
        <a
          href={`${bundle.spaceLocation()}/app/logout`}
          className="dropdown-item"
        >
          Logout
        </a>
      </div>
    </DropdownMenu>
  </UncontrolledDropdown>
);

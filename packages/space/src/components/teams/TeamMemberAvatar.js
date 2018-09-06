import React, { Fragment } from 'react';

import Avatar from 'react-avatar';

export const TeamMemberAvatar = ({ user }) => (
  <Fragment>
    <Avatar size={24} name={user.displayName} round />
  </Fragment>
);

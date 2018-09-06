import React, { Fragment } from 'react';

import Avatar from 'react-avatar';

export const TeamMemberAvatar = ({ user }) => (
  <Fragment>
    <Avatar name={user.displayName} />
  </Fragment>
);

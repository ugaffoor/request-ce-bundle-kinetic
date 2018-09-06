import React from 'react';
import Avatar from 'react-avatar';

const getProfilePhone = profile =>
  profile.profileAttributes['Phone Number']
    ? profile.profileAttributes['Phone Number'].join(', ')
    : '';

export const ProfileCard = ({ user, button }) => {
  return (
    <div className="card card--profile">
      <Avatar size={96} name={user.displayName} round />
      <h1>{user.displayName}</h1>
      <p>{user.email}</p>
      {getProfilePhone(user) && <p>{getProfilePhone(user)}</p>}
      {button ? button : null}
    </div>
  );
};

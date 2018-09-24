import { bundle } from 'react-kinetic-core';

import { getAttributeValue, isMemberOf, getTeams, getRoles } from '../utils';

// Find a Kapp by Space Attribute Value
const kappBySpaceAttribute = (state, slugAttributeName) =>
  !state.member.kinops.loading
    ? state.member.kinops.kapps.find(
        kapp =>
          kapp.slug ===
          getAttributeValue(state.member.kinops.space, slugAttributeName),
      )
    : null;

// Kapp Selectors
export const selectCurrentKapp = state =>
  !state.member.kinops.loading
    ? state.member.kinops.kapps.find(
        kapp => kapp.slug === `${bundle.kappSlug()}`,
      )
    : null;
export const selectAdminKapp = state =>
  kappBySpaceAttribute(state, 'Admin Kapp Slug');
export const selectQueueKapp = state =>
  kappBySpaceAttribute(state, 'Queue Kapp Slug');
export const selectServicesKapp = state =>
  kappBySpaceAttribute(state, 'Catalog Kapp Slug');
export const selectTeamsKapp = state =>
  kappBySpaceAttribute(state, 'Teams Kapp Slug');

// Role Selectors
export const selectHasRoleDataAdmin = state =>
  !state.member.kinops.loading
    ? isMemberOf(state.member.kinops.profile, 'Role::Data Admin')
    : false;
export const selectHasRoleSubmissionSupport = state =>
  !state.member.kinops.loading
    ? isMemberOf(state.member.kinops.profile, 'Role::Submission Support')
    : false;
export const selectHasAccessToManagement = state =>
  !state.member.kinops.loading
    ? state.member.kinops.profile.spaceAdmin ||
      selectHasRoleDataAdmin(state) ||
      getTeams(state.member.kinops.profile).length > 0
    : false;
export const selectHasAccessToSupport = state =>
  !state.member.kinops.loading
    ? state.member.kinops.profile.spaceAdmin ||
      selectHasRoleSubmissionSupport(state)
    : false;

export const selectIsGuest = state =>
  !state.member.kinops.loading
    ? state.member.kinops.profile.spaceAdmin === false &&
      getRoles(state.member.kinops.profile).length === 0
    : false;

// Kapp List Selectors
export const selectPredefinedKapps = state =>
  !state.member.kinops.loading
    ? [
        selectTeamsKapp(state),
        selectServicesKapp(state),
        selectQueueKapp(state),
      ]
        .filter(kapp => kapp != null)
        .filter(kapp => kapp !== selectCurrentKapp(state))
    : [];
export const selectAdditionalKapps = state =>
  !state.member.kinops.loading
    ? state.member.kinops.kapps
        .filter(
          kapp =>
            kapp !== selectAdminKapp(state) &&
            !selectPredefinedKapps(state).includes(kapp),
        )
        .filter(kapp => kapp !== selectCurrentKapp(state))
    : [];

/**
 * Who may use the conversations feature in GB Members.
 *
 * Team names are the ones this codebase already uses elsewhere -- note
 * `Role::Program Managers` is plural and `Role::Coach` is singular, matching
 * the Kinetic teams rather than how they are said out loud.
 *
 * This gates the PORTAL UI only. Firestore decides separately what a person
 * may actually read or write: the mobile app's mintToken function computes
 * `staff` from the same Kinetic user record (spaceAdmin, or any team whose
 * name starts with `Role::`) and firestore.rules enforces it. So this list
 * should stay a subset of what counts as staff there -- widening it here
 * would show the feature to someone whose every query is then refused.
 */
export const CONVERSATION_ROLES = [
  'Role::Data Admin',
  'Role::Program Managers',
  'Role::Coach',
  'Role::Kiosk',
];

/**
 * Space admins are included regardless of team membership, matching
 * computeIsStaff() in the app, which short-circuits on spaceAdmin before
 * looking at memberships at all.
 */
export const canUseConversations = profile => {
  if (!profile) {
    return false;
  }

  if (profile.spaceAdmin === true) {
    return true;
  }

  const memberships = profile.memberships || [];
  return memberships.some(
    membership =>
      membership &&
      membership.team &&
      CONVERSATION_ROLES.indexOf(membership.team.name) !== -1,
  );
};

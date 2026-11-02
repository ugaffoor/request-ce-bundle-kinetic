/**
 * Who may use the conversations feature in GB Members.
 *
 * Team names are the ones this codebase already uses elsewhere -- note
 * `Role::Program Managers` is plural, matching the Kinetic team rather than
 * how it is said out loud.
 *
 * This gates the PORTAL UI only. Firestore decides separately what a person
 * may actually read or write: the mobile app's mintToken function computes
 * `staff` from the same Kinetic user record (spaceAdmin, or any team whose
 * name starts with `Role::`) and firestore.rules enforces it. So this list
 * should stay a subset of what counts as staff there -- widening it here
 * would show the feature to someone whose every query is then refused.
 */
export const CONVERSATION_ROLES = ['Role::Program Managers'];

/**
 * Team membership only. Being a space admin does NOT grant access on its own
 * -- an admin who needs conversations has to be in one of the teams above,
 * same as anyone else. That is deliberately stricter than computeIsStaff() in
 * the mobile app, which short-circuits on spaceAdmin: Firestore will still
 * treat an admin as staff, this list just decides who is shown the feature.
 */
const hasConversationRole = profile => {
  if (!profile) {
    return false;
  }

  const memberships = profile.memberships || [];
  return memberships.some(
    membership =>
      membership &&
      membership.team &&
      CONVERSATION_ROLES.indexOf(membership.team.name) !== -1,
  );
};

/**
 * Messaging is on for every school (the BJJ Members app has it always on
 * too); what decides is whether this person is in a conversations role.
 * `space` is still taken so callers needn't change, but nothing reads it.
 */
// eslint-disable-next-line no-unused-vars
export const canUseConversations = (profile, space) =>
  hasConversationRole(profile);

/** Why someone is not seeing messages, for the pages reachable by URL. */
// eslint-disable-next-line no-unused-vars
export const noConversationsAccessMessage = space =>
  'You do not have access to messages. Ask a space admin to add you to the Program Managers role.';

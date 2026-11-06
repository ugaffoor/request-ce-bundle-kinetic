import { isBjjMembersAppRunning } from './bjjMembersApp';

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
 * Messaging needs both: the school is using the BJJ Members app (bjjMembersApp.js)
 * and this person is in a conversations role. A caller that leaves out the
 * space hides the feature rather than showing it to a school not using the app.
 */
export const canUseConversations = (profile, space) =>
  isBjjMembersAppRunning(space) && hasConversationRole(profile);

/**
 * Why someone is not seeing messages, for the pages reachable by URL. The
 * school comes first: if it isn't using the app, joining a role would not help.
 */
export const noConversationsAccessMessage = space =>
  isBjjMembersAppRunning(space)
    ? 'You do not have access to messages. Ask a space admin to add you to the Program Managers role.'
    : 'Messages are not available for this school.';

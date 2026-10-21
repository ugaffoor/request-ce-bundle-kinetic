import { getAttributeValues } from '../utils/utils';

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
 * The space attribute that rolls the chat features (message threads and
 * chats) out school by school while they are being tested. YES turns them on;
 * the attribute may hold several values, and Messages also turns them on, so
 * other features can be given values of their own later. Matched without
 * regard to case or spacing, since the values are typed in by hand.
 */
export const FEATURE_ROLLOUT_ATTRIBUTE = 'GB Members Chat feature';
export const MESSAGING_FEATURE = 'Messages';

const ALL_FEATURES = 'YES';

const rolloutKey = value =>
  String(value || '')
    .trim()
    .toUpperCase();

/**
 * Whether this school has message threads and chats rolled out. With no
 * space loaded, or the attribute unset, the answer is no: a feature still in
 * testing stays off until a school is given it.
 */
export const isMessagingRolledOut = space =>
  getAttributeValues(space || {}, FEATURE_ROLLOUT_ATTRIBUTE, []).some(
    value =>
      rolloutKey(value) === ALL_FEATURES ||
      rolloutKey(value) === rolloutKey(MESSAGING_FEATURE),
  );

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
 * Messaging needs both: the school has it rolled out, and this person is in
 * a conversations role. The space is required -- a caller that leaves it out
 * hides the feature rather than showing it to a school that hasn't got it.
 */
export const canUseConversations = (profile, space) =>
  isMessagingRolledOut(space) && hasConversationRole(profile);

/**
 * Why someone is not seeing messages, for the pages reachable by URL. The
 * school comes first: if messaging is not rolled out there, joining a role
 * would not help.
 */
export const noConversationsAccessMessage = space =>
  isMessagingRolledOut(space)
    ? 'You do not have access to messages. Ask a space admin to add you to the Program Managers role.'
    : 'Messages are not available for this school yet.';

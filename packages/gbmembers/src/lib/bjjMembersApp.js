/**
 * Whether a school is using the BJJ Members app. Everything in the portal that
 * runs on Firebase -- messages, announcements, the header inbox, the app
 * account status on a profile, the sign-in at login -- is for schools that are,
 * so until this space attribute is YES none of it shows or starts. Not set, or
 * anything else, and it is off; with no space to read, it is off too.
 *
 * On its own with no imports because the login reads it, and that code loads
 * before the rest of the portal.
 */
export const APP_RUNNING_ATTRIBUTE = 'BJJ Members App running indicator';

export const isBjjMembersAppRunning = space => {
  const attributes = space && space.attributes;
  // Kinetic gives a list of { name, values }, or a map of name to values.
  const values = Array.isArray(attributes)
    ? (attributes.find(a => a && a.name === APP_RUNNING_ATTRIBUTE) || {}).values
    : attributes && attributes[APP_RUNNING_ATTRIBUTE];
  return (
    Array.isArray(values) &&
    values.some(
      value =>
        String(value || '')
          .trim()
          .toUpperCase() === 'YES',
    )
  );
};

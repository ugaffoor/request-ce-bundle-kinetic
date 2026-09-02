/**
 * Which inbox entries this person has already dealt with.
 *
 * Kept in localStorage rather than Firestore: the unreadCount field on a
 * conversation is written by the onChatMessageCreated Cloud Function through
 * the Admin SDK, and the security rules do not invite clients to assert it.
 * Read state here is therefore per-browser -- marking something read on one
 * machine will not clear it on another. Move this to Firestore if and when
 * the rules allow a staff client to update its own unread counter.
 */

const STORAGE_KEY = 'gbmembers.inbox.read';

/**
 * The marker is the timestamp of the newest message that was read, not just
 * the conversation id. That way a conversation marked read pops back into
 * the inbox when the student sends something new, instead of staying
 * dismissed forever.
 */
export const markerFor = entry =>
  entry && entry.updatedAtMs ? String(entry.updatedAtMs) : '';

export const loadReadMarkers = () => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    // Private windows and blocked site data both throw here. Read state is a
    // convenience, so treat it as "nothing read yet" rather than failing.
    return {};
  }
};

export const saveReadMarkers = markers => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(markers));
  } catch (e) {
    // Nothing to do -- the in-memory copy still drives this session.
  }
};

export const isRead = (markers, entry) =>
  !!entry && markers[entry.id] === markerFor(entry);

export const withRead = (markers, entry) => ({
  ...markers,
  [entry.id]: markerFor(entry),
});

export const withAllRead = (markers, entries) =>
  (entries || []).reduce((acc, entry) => withRead(acc, entry), markers);

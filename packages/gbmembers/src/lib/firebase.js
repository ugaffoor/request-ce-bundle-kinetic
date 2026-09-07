import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAttributeValue } from '../utils/utils';

/**
 * Connects this portal to the shared Firebase project.
 *
 * The config is not hardcoded. It is read at runtime from the `Firebase
 * Config` space attribute, which holds the web config object from the
 * Firebase console as a JSON string. Every GB Members space carries the
 * same value, so one build serves every school and pointing at a
 * different project is an attribute edit rather than a redeploy.
 *
 * Set the attribute to the object copied from:
 *   Firebase console -> Project settings -> Your apps -> Web
 *
 *   {"apiKey":"...","authDomain":"...","projectId":"...",
 *    "storageBucket":"...","messagingSenderId":"...","appId":"..."}
 */

export const FIREBASE_CONFIG_ATTRIBUTE = 'Firebase Config';

export const getFirebaseConfig = space => {
  if (!space) {
    return undefined;
  }

  const raw =
    getAttributeValue(space, FIREBASE_CONFIG_ATTRIBUTE) ||
    // Development fallback so the connection can be exercised on localhost
    // before the space attribute has been set. Production spaces must use
    // the attribute -- this variable is not defined in a deployed build.
    process.env.REACT_APP_FIREBASE_CONFIG;

  if (!raw) {
    return undefined;
  }

  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    console.error(
      `[firebase] The '${FIREBASE_CONFIG_ATTRIBUTE}' space attribute is not ` +
        'valid JSON. Copy the web config object from the Firebase console ' +
        'exactly as it appears there.',
      e,
    );
    return undefined;
  }
};

/**
 * Initialises the Firebase app once and returns it. Safe to call repeatedly.
 * Returns undefined when the space has no Firebase config, so callers can
 * degrade rather than throw on spaces that have not been rolled out yet.
 */
export const initialiseFirebase = space => {
  const existing = getApps();
  if (existing.length > 0) {
    return existing[0];
  }

  const config = getFirebaseConfig(space);
  if (!config) {
    return undefined;
  }

  return initializeApp(config);
};

export const getFirebaseApp = () => {
  const apps = getApps();
  return apps.length > 0 ? apps[0] : undefined;
};

/**
 * Firestore handle for the shared conversation store. Returns undefined
 * until initialiseFirebase has run with a valid config.
 */
/**
 * Firestore's default transport is a streaming WebChannel to
 * firestore.googleapis.com. Ad and privacy blockers frequently kill parts of
 * that stream -- the `TYPE=terminate` beacon is on several filter lists --
 * and corporate proxies mangle it, both of which leave listeners hanging with
 * no error. Auto-detect falls back to long polling when the stream does not
 * come up, which is plain HTTPS requests and survives all of that.
 *
 * It is only a fallback for the TRANSPORT. A blocker that blocks
 * firestore.googleapis.com outright cannot be worked around from here: the SDK
 * has to reach that host, and nothing in this app can proxy it.
 *
 * initializeFirestore must run before anything calls getFirestore for this
 * app, and throws if called twice, so the instance is cached and the second
 * call falls back to fetching the existing one (which a hot reload will hit).
 */
let conversationStore = null;

export const getConversationStore = () => {
  const app = getFirebaseApp();
  if (!app) {
    return undefined;
  }

  if (conversationStore) {
    return conversationStore;
  }

  try {
    conversationStore = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: true,
    });
  } catch (e) {
    // Already initialised for this app -- reuse it rather than failing.
    conversationStore = getFirestore(app);
  }

  return conversationStore;
};

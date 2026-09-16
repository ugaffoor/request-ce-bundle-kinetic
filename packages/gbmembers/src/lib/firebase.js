import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAttributeValue } from '../utils/utils';

/**
 * Connects this portal to the shared Firebase project.
 *
 * Every GB Members space talks to the same project, so the web config ships
 * with the portal: conversations then work on any device, in any space, with
 * no per-space setup. Relying on a space attribute instead meant every new
 * space silently had no messaging until an admin remembered to set it -- and
 * anyone whose space had not been set up saw "Firebase is not configured".
 *
 * A web config is not a secret. It is meant to live in client code; access
 * is enforced by firestore.rules and the sign-in bridge (firebaseAuth.js),
 * not by hiding these values.
 *
 * The `Firebase Config` space attribute remains as an OVERRIDE, for a space
 * that needs to point at a different project. Set it to the object copied
 * from Firebase console -> Project settings -> Your apps -> Web.
 */

export const FIREBASE_CONFIG_ATTRIBUTE = 'Firebase Config';

// The shared project's web config. Same values as the mobile app's
// google-services.json / GoogleService-Info.plist, for the web app registered
// in the same project.
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: 'AIzaSyD9_b0Eu2_MmOg8oNddcLufQOEItqVM4so',
  authDomain: 'bjj-members-connect.firebaseapp.com',
  projectId: 'bjj-members-connect',
  storageBucket: 'bjj-members-connect.firebasestorage.app',
  messagingSenderId: '50500665716',
  appId: '1:50500665716:web:1eab912bebcb4913472c21',
  measurementId: 'G-3P7VL88PPX',
};

const parseConfig = (raw, source) => {
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (e) {
    console.error(
      `[firebase] The ${source} is not valid JSON. Copy the web config ` +
        'object from the Firebase console exactly as it appears there.',
      e,
    );
    return undefined;
  }
};

/**
 * Resolution order: a space attribute override, then a development
 * environment override, then the built-in shared config. A malformed
 * override falls through to the next source rather than disabling
 * messaging for the space.
 */
export const getFirebaseConfig = space => {
  if (space) {
    const fromSpace = getAttributeValue(space, FIREBASE_CONFIG_ATTRIBUTE);
    if (fromSpace) {
      const parsed = parseConfig(
        fromSpace,
        `'${FIREBASE_CONFIG_ATTRIBUTE}' space attribute`,
      );
      if (parsed) {
        return parsed;
      }
    }
  }

  if (process.env.REACT_APP_FIREBASE_CONFIG) {
    const parsed = parseConfig(
      process.env.REACT_APP_FIREBASE_CONFIG,
      'REACT_APP_FIREBASE_CONFIG environment variable',
    );
    if (parsed) {
      return parsed;
    }
  }

  return DEFAULT_FIREBASE_CONFIG;
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

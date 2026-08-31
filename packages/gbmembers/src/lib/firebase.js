import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
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
export const getConversationStore = () => {
  const app = getFirebaseApp();
  return app ? getFirestore(app) : undefined;
};

import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
} from 'firebase/auth';
import { getFirebaseApp } from './firebase';

/**
 * Bridges a GB Members (Kinetic) login into Firebase.
 *
 * Kinetic and Firebase are separate systems with separate sessions: being
 * signed into the portal means nothing to Firestore, whose rules gate every
 * read and write on `request.auth != null`. The mintFirebaseToken Cloud
 * Function re-verifies the member's Kinetic credentials server-side and
 * returns a custom token keyed to their member GUID (or `staff_{space}_{user}`
 * for staff without a member record). Signing in with that token is what makes
 * request.auth.uid usable in firestore.rules.
 *
 * This mirrors src/firebase/authBridge.ts in the mobile app -- same function,
 * same contract -- with the React Native SDK swapped for the web one.
 *
 * Every failure path here degrades to "chat isn't available this session"
 * rather than throwing. The GB Members login has already succeeded by the time
 * any of this runs, and a Firebase problem must never take the portal down
 * with it.
 */

// Cloud Functions v2 publishes a deterministic URL of this shape. Kept in step
// with src/firebase/config.ts in the mobile app.
const FUNCTIONS_REGION = 'us-central1';
const FIREBASE_PROJECT_ID = 'bjj-members-connect';
export const FUNCTIONS_BASE_URL = `https://${FUNCTIONS_REGION}-${FIREBASE_PROJECT_ID}.cloudfunctions.net`;

// The only host mintFirebaseToken will verify credentials against (its own
// ALLOWED_DOMAINS allowlist); sending anything else earns a 400.
const FRANCHISE_DOMAIN = 'gbmembers.net';

// The credentials of a login in progress. Read exactly once, by
// exchangeStashedCredentials, and cleared on read -- the password never
// outlives the login that produced it, and is never persisted anywhere.
let stashedCredentials = null;

// The custom token minted at login, held until a Firebase app exists to sign
// in with. The app can't be built any earlier: its config lives on the space,
// which only loads after authentication.
let pendingToken = null;

const slugFromHost = host => {
  const [first] = String(host || '').split('.');
  return first && first !== 'localhost' && !/^\d+$/.test(first) ? first : null;
};

/**
 * The space this portal is talking to. In production the portal is served from
 * the space's own subdomain, so the hostname carries it. On localhost the dev
 * server proxies to REACT_APP_PROXY_HOST instead, so the slug comes from there.
 */
export const resolveSpaceSlug = () =>
  slugFromHost(window.location.hostname) ||
  slugFromHost(
    String(process.env.REACT_APP_PROXY_HOST || '').replace(/^https?:\/\//, ''),
  );

/**
 * Holds the credentials of a login in progress. Called from the sign-in
 * handler, which is the only moment the password exists in the browser.
 */
export const stashCredentials = credentials => {
  stashedCredentials = credentials;
};

/**
 * Trades the stashed credentials for a Firebase custom token. Call once the
 * Kinetic login has succeeded. Returns the member GUID on success, or null if
 * the bridge failed for any reason.
 */
export const exchangeStashedCredentials = async () => {
  const credentials = stashedCredentials;
  stashedCredentials = null;
  if (!credentials) {
    return null;
  }
  return requestFirebaseToken(credentials);
};

export const requestFirebaseToken = async ({ userName, password }) => {
  const spaceSlug = resolveSpaceSlug();
  if (!spaceSlug || !userName || !password) {
    return null;
  }

  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/mintFirebaseToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        spaceSlug,
        userName,
        password,
        domain: FRANCHISE_DOMAIN,
      }),
    });

    if (!response.ok) {
      console.warn('[firebase] mintFirebaseToken HTTP', response.status);
      return null;
    }

    const { token, memberGuid } = await response.json();
    if (!token) {
      console.warn('[firebase] mintFirebaseToken returned no token');
      return null;
    }

    pendingToken = token;
    return memberGuid || null;
  } catch (e) {
    // Also the path taken when the browser blocks the request at the CORS
    // preflight, which it will until mintFirebaseToken declares a cors option.
    console.warn('[firebase] mintFirebaseToken request failed', e);
    return null;
  }
};

/**
 * The uid this browser is currently signed in to Firebase as, or null. Used to
 * tell a rules rejection ("you may not do that") apart from a missing session
 * ("Firebase does not know who you are"), which look identical otherwise --
 * both surface only as permission-denied.
 */
export const getSignedInUid = () => {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  try {
    const user = getAuth(app).currentUser;
    return user ? user.uid : null;
  } catch (e) {
    return null;
  }
};

/**
 * Resolves once the initial persisted auth state has been restored. The web
 * SDK reads its session from IndexedDB asynchronously, so `auth.currentUser`
 * is null for a moment after a page load even when a session does exist --
 * checking it synchronously would sign in again needlessly.
 */
const waitForInitialAuth = auth =>
  new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      user => {
        unsubscribe();
        resolve(user);
      },
      // Without this the listener can fail and never call back, leaving the
      // caller awaiting a promise that never settles.
      error => {
        unsubscribe();
        reject(error);
      },
    );
  });

/**
 * Ensures the Firebase app is signed in, and returns the signed-in uid (or
 * null when chat isn't available this session). Safe to call repeatedly: an
 * existing session is reused, and the pending token is spent at most once.
 */
export const ensureFirebaseSignIn = async app => {
  if (!app) {
    return null;
  }

  const auth = getAuth(app);
  const existing = await waitForInitialAuth(auth);
  if (existing) {
    return existing.uid;
  }

  const token = pendingToken;
  pendingToken = null;
  if (!token) {
    return null;
  }

  try {
    const credential = await signInWithCustomToken(auth, token);
    return credential.user.uid;
  } catch (e) {
    console.warn('[firebase] custom token sign-in failed', e);
    return null;
  }
};

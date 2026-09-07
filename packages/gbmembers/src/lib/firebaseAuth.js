import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { getFirebaseApp, getConversationStore } from './firebase';

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
export const FRANCHISE_DOMAIN = 'gbmembers.net';

// The credentials of a login in progress. Read exactly once, by
// exchangeStashedCredentials, and cleared on read -- the password never
// outlives the login that produced it, and is never persisted anywhere.
let stashedCredentials = null;

// The custom token minted at login, held until a Firebase app exists to sign
// in with. The app can't be built any earlier: its config lives on the space,
// which only loads after authentication.
let pendingToken = null;

// Why the last token exchange failed, if it did. Without this a blocked
// request is indistinguishable from never having tried, and both surface as
// the same unhelpful "not signed in to Firebase".
let lastTokenFailure = null;

export const getLastTokenFailure = () => lastTokenFailure;

// Which Kinetic login the current Firebase session belongs to. Persisted
// because the Firebase session itself is persisted: without this, a session
// minted for one user is silently reused by the next person to sign into the
// portal on this browser, and they would read that person's conversations.
const MINTED_FOR_KEY = 'gbmembers.firebase.mintedFor';

const rememberMintedFor = identity => {
  try {
    window.localStorage.setItem(MINTED_FOR_KEY, identity);
  } catch (e) {
    // Storage unavailable: the session is then treated as unattributable
    // below, which errs towards signing out rather than sharing a session.
  }
};

const recallMintedFor = () => {
  try {
    return window.localStorage.getItem(MINTED_FOR_KEY);
  } catch (e) {
    return null;
  }
};

export const identityKey = (spaceSlug, userName) =>
  `${spaceSlug || ''}:${userName || ''}`;

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
      lastTokenFailure = `the sign-in service refused the request (HTTP ${
        response.status
      })`;
      return null;
    }

    const { token, memberGuid } = await response.json();
    if (!token) {
      console.warn('[firebase] mintFirebaseToken returned no token');
      lastTokenFailure = 'the sign-in service returned no token';
      return null;
    }

    lastTokenFailure = null;
    pendingToken = token;
    rememberMintedFor(identityKey(spaceSlug, userName));
    return memberGuid || null;
  } catch (e) {
    // fetch() rejects with a TypeError for anything that never reached the
    // server: an extension blocking the request, DNS or TLS failure, or a
    // CORS preflight that was refused. An ad blocker is much the most likely
    // of those here, and it is invisible in the response -- so name it.
    console.warn('[firebase] mintFirebaseToken request failed', e);
    lastTokenFailure =
      `could not reach the sign-in service at ${FUNCTIONS_BASE_URL} ` +
      `(${e && e.message ? e.message : e}). An ad or privacy blocker will ` +
      `do this -- allow cloudfunctions.net and firestore.googleapis.com, ` +
      `then sign out and in again`;
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
 * The custom claims on the current ID token, or null when signed out.
 *
 * Worth inspecting directly because claims from createCustomToken() live only
 * in the token they were minted into -- they are NOT stored on the user
 * record unless setCustomUserClaims() is also called. Firebase re-mints the
 * ID token roughly hourly from the user record, so a `staff` claim granted
 * only at sign-in silently disappears on the first refresh, and every rule
 * that tests request.auth.token.staff starts failing.
 */
export const getIdTokenClaims = async () => {
  const app = getFirebaseApp();
  if (!app) {
    return null;
  }
  try {
    const user = getAuth(app).currentUser;
    if (!user) {
      return null;
    }
    const result = await user.getIdTokenResult();
    return result.claims || {};
  } catch (e) {
    console.warn('[firebase] could not read ID token claims', e);
    return null;
  }
};

/**
 * Whether this uid has a members/{uid} document. Firestore rules call me()
 * constantly; without that document every rule that touches it errors out,
 * and Firestore reports the error as permission-denied.
 *
 * members is readable by any signed-in user (allow read: if request.auth !=
 * null), so this probe needs no special privileges.
 */
export const describeMemberProfile = async uid => {
  const store = getConversationStore();
  if (!store || !uid) {
    return 'could not check for a members profile';
  }
  try {
    const snap = await getDoc(doc(store, 'members', uid));
    if (!snap.exists()) {
      return (
        `NO members/${uid} document exists -- rules call me() on it, and a ` +
        `missing document denies every read. mintFirebaseToken writes this ` +
        `via writeStaffProfile(), which swallows its own failures`
      );
    }
    const data = snap.data() || {};
    return (
      `members/${uid} exists ` +
      `(spaceSlug=${data.spaceSlug}, domain=${data.domain}, ` +
      `isStaff=${data.isStaff})`
    );
  } catch (e) {
    return `reading members/${uid} failed: ${e.message || String(e)}`;
  }
};

/**
 * A short description of why Firestore may be refusing, for error messages.
 * Distinguishes "no session", "session without the staff claim" and "staff
 * claim present" -- all three surface identically as permission-denied.
 */
export const describeAuthState = async () => {
  const uid = getSignedInUid();
  if (!uid) {
    return lastTokenFailure
      ? `not signed in to Firebase: ${lastTokenFailure}`
      : 'not signed in to Firebase - sign out of GB Members and sign in again';
  }
  const claims = await getIdTokenClaims();
  if (!claims) {
    return `signed in as ${uid}, but the ID token could not be read`;
  }
  if (claims.staff === true) {
    // The claim alone is not enough. Nearly every rule reaches me() --
    // get(/members/$(uid)) -- and .data on a missing document raises an
    // error, which denies the whole rule before any OR'd branch is tried.
    // A missing members doc therefore looks exactly like a rules rejection.
    const profile = await describeMemberProfile(uid);
    return `signed in as ${uid} with the staff claim present; ${profile}`;
  }
  return (
    `signed in as ${uid} but WITHOUT the staff claim ` +
    `(claims: ${JSON.stringify(claims)}) - the token has been refreshed ` +
    `since login and mintFirebaseToken does not persist claims via ` +
    `setCustomUserClaims, so signing out and in again will restore it ` +
    `temporarily`
  );
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
export const ensureFirebaseSignIn = async (app, expectedIdentity) => {
  if (!app) {
    return null;
  }

  const auth = getAuth(app);
  const existing = await waitForInitialAuth(auth);
  const token = pendingToken;
  pendingToken = null;

  // A freshly minted token always wins over a persisted session. Firebase
  // sessions outlive the Kinetic one, so signing into the portal as a
  // different person would otherwise keep the PREVIOUS user's Firebase
  // identity -- and every query would then filter on one uid while
  // request.auth.uid was another, which the rules reject as
  // permission-denied with no hint that the identities disagree.
  if (token) {
    if (existing) {
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('[firebase] could not clear the previous session', e);
      }
    }
    try {
      const credential = await signInWithCustomToken(auth, token);
      return credential.user.uid;
    } catch (e) {
      console.warn('[firebase] custom token sign-in failed', e);
      return null;
    }
  }

  if (existing) {
    // A persisted session must belong to the person currently signed into the
    // portal. Firebase sessions outlive Kinetic ones, so on a shared browser
    // the previous user's session is still sitting here -- and because every
    // query keys off request.auth.uid, reusing it would show this user the
    // PREVIOUS user's conversations. Refuse it rather than risk that.
    const mintedFor = recallMintedFor();
    if (expectedIdentity && mintedFor !== expectedIdentity) {
      console.warn(
        `[firebase] session belongs to "${mintedFor}" but the portal is ` +
          `signed in as "${expectedIdentity}" - signing out`,
      );
      try {
        await signOut(auth);
      } catch (e) {
        console.warn('[firebase] could not clear the mismatched session', e);
      }
      return null;
    }
    return existing.uid;
  }

  return null;
};

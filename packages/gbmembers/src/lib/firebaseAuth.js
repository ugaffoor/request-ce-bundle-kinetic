import {
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { fetchSpace, retrieveJwt } from '@kineticdata/react';
import { isBjjMembersAppRunning } from './bjjMembersApp';
import {
  getFirebaseApp,
  getConversationStore,
  initialiseFirebase,
  startFirebaseApp,
} from './firebase';

/**
 * Redeems a freshly minted custom token straight away. Creates the Firebase
 * app from the built-in config if nothing has yet -- at login the space has
 * not loaded, and waiting for it is what used to force the token to be held.
 * Returns whether the sign-in succeeded; the caller keeps the token if not.
 */
const signInImmediately = async token => {
  try {
    const app = startFirebaseApp();
    if (!app) {
      return false;
    }
    await signInWithCustomToken(getAuth(app), token);
    return true;
  } catch (e) {
    console.warn(
      '[firebase] immediate sign-in failed; will retry when a conversation ' +
        'screen opens',
      e,
    );
    return false;
  }
};

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
 * Whether this school is using the BJJ Members app, asked of Kinetic directly:
 * this runs at login, before the portal has loaded the space. Not knowing
 * counts as no, so a failed read leaves Firebase off rather than on.
 */
const schoolIsRunningApp = async () => {
  try {
    const { space } = await fetchSpace({ include: 'attributes' });
    return isBjjMembersAppRunning(space);
  } catch (e) {
    console.warn('[firebase] could not read the school settings', e);
    return false;
  }
};

/**
 * Trades the stashed credentials for a Firebase custom token. Call once the
 * Kinetic login has succeeded. Returns the member GUID on success, or null if
 * the bridge failed for any reason -- or if the school isn't using the BJJ
 * Members app, in which case Firebase is not contacted at all. A school that
 * turns the app on signs in to Firebase at its staff's next login.
 */
export const exchangeStashedCredentials = () => {
  const credentials = stashedCredentials;
  stashedCredentials = null;
  if (!credentials) {
    return Promise.resolve(null);
  }
  loginExchange = (async () =>
    (await schoolIsRunningApp()) ? requestFirebaseToken(credentials) : null)()
    .catch(() => null)
    .finally(() => {
      loginExchange = null;
    });
  return loginExchange;
};

// The login's exchange while it runs, so a connection check that arrives in
// the meantime waits for it instead of signing in a second time.
let loginExchange = null;

/**
 * Asks mintFirebaseToken for a custom token, with either a username and
 * password or the Kinetic session's token. Returns its answer -- { token,
 * memberGuid, userName } -- or null, with lastTokenFailure saying why.
 */
const mintCustomToken = async body => {
  try {
    const response = await fetch(`${FUNCTIONS_BASE_URL}/mintFirebaseToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...body, domain: FRANCHISE_DOMAIN }),
    });

    if (!response.ok) {
      console.warn('[firebase] mintFirebaseToken HTTP', response.status);
      lastTokenFailure = `the sign-in service refused the request (HTTP ${
        response.status
      })`;
      return null;
    }

    const minted = await response.json();
    if (!minted || !minted.token) {
      console.warn('[firebase] mintFirebaseToken returned no token');
      lastTokenFailure = 'the sign-in service returned no token';
      return null;
    }

    lastTokenFailure = null;
    return minted;
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
      `then reload the page`;
    return null;
  }
};

const requestFirebaseToken = async ({ userName, password }) => {
  const spaceSlug = resolveSpaceSlug();
  if (!spaceSlug || !userName || !password) {
    return null;
  }

  const minted = await mintCustomToken({ spaceSlug, userName, password });
  if (!minted) {
    return null;
  }
  rememberMintedFor(identityKey(spaceSlug, userName));

  // Sign in NOW rather than holding the token for a conversations screen
  // to spend later. Custom tokens expire after an hour, so a login followed
  // by an hour of other work used to leave the first visit to Conversations
  // failing with nothing to explain why. This is possible because the
  // shared Firebase config is built into the portal -- the app no longer
  // has to wait for the space to load before it can be created.
  //
  // If it fails the token is kept, so the lazy path in ensureFirebaseSignIn
  // still gets its chance when a screen opens.
  pendingToken = (await signInImmediately(minted.token)) ? null : minted.token;
  return minted.memberGuid || null;
};

// How long to wait for Kinetic to hand over the session's token.
const KINETIC_TOKEN_TIMEOUT_MS = 10 * 1000;

/**
 * The signed-in Kinetic session's token, or null. Kinetic issues it to the
 * page itself (OAuth, the same way @kineticdata/react gets the one it uses),
 * so it exists whenever the portal is signed in -- including a session that
 * was resumed rather than started at the login form.
 */
const kineticSessionToken = () =>
  Promise.race([
    retrieveJwt().catch(() => null),
    new Promise(resolve =>
      setTimeout(() => resolve(null), KINETIC_TOKEN_TIMEOUT_MS),
    ),
  ]);

// The session sign-in in progress, shared by everything that asks at once.
let sessionSignIn = null;

/**
 * Signs in to Firebase with the Kinetic session rather than a password, and
 * returns the uid, or null. This is what keeps Firebase connected when there
 * is no login to take a password from: a resumed session, a Firebase session
 * that was dropped, or a browser that has moved to another school. The Cloud
 * Function asks Kinetic who the token belongs to, so it can only ever sign in
 * as the person who is signed in to the portal.
 */
const signInWithKineticSession = (auth, expectedIdentity) => {
  if (!sessionSignIn) {
    sessionSignIn = (async () => {
      const spaceSlug = resolveSpaceSlug();
      const kineticToken = spaceSlug ? await kineticSessionToken() : null;
      if (!kineticToken) {
        lastTokenFailure =
          'the Kinetic session could not be used to sign in -- reload the page';
        return null;
      }
      const minted = await mintCustomToken({ spaceSlug, kineticToken });
      if (!minted) {
        return null;
      }
      const credential = await signInWithCustomToken(auth, minted.token);
      rememberMintedFor(
        expectedIdentity || identityKey(spaceSlug, minted.userName),
      );
      return credential.user.uid;
    })()
      .catch(e => {
        console.warn('[firebase] session sign-in failed', e);
        return null;
      })
      .finally(() => {
        sessionSignIn = null;
      });
  }
  return sessionSignIn;
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

  // A login that's still exchanging its password is about to sign in: wait
  // for it rather than race it with a second token.
  if (loginExchange) {
    await loginExchange;
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
      // Then connect as the right person, from the Kinetic session.
      return signInWithKineticSession(auth, expectedIdentity);
    }
    return existing.uid;
  }

  // No Firebase session at all -- one that was never started this session,
  // because the portal was resumed rather than logged in to. Connect from the
  // Kinetic session instead of giving up until the next login.
  return signInWithKineticSession(auth, expectedIdentity);
};

// How often a portal that's left open checks it is still connected.
const CONNECTION_CHECK_MS = 5 * 60 * 1000;

/**
 * Keeps Firebase connected for as long as the portal is open, for a school
 * using the BJJ Members app: checks once now, again whenever the tab comes back
 * into view, and every few minutes. A check that finds the right session costs
 * nothing (no network); one that finds none, or another person's or another
 * school's, connects again from the Kinetic session. Returns a function that
 * stops it.
 */
export const keepFirebaseConnected = ({ space, profile }) => {
  const username = profile && profile.username;
  if (!isBjjMembersAppRunning(space) || !username || !space.slug) {
    return () => {};
  }
  const identity = identityKey(space.slug, username);
  const check = () => {
    const app = initialiseFirebase(space);
    if (app) {
      ensureFirebaseSignIn(app, identity).catch(e =>
        console.warn('[firebase] connection check failed', e),
      );
    }
  };
  const onVisible = () => {
    if (document.visibilityState === 'visible') {
      check();
    }
  };

  check();
  document.addEventListener('visibilitychange', onVisible);
  const timer = setInterval(check, CONNECTION_CHECK_MS);
  return () => {
    document.removeEventListener('visibilitychange', onVisible);
    clearInterval(timer);
  };
};

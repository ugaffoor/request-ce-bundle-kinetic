import { doc, onSnapshot } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { initialiseFirebase, getConversationStore } from './firebase';
import { ensureFirebaseSignIn, identityKey } from './firebaseAuth';

// The BJJ Members app's profile for each member: members/{memberId}, keyed by
// the member's submission id. The app's mintFirebaseToken function writes it
// every time the member signs in to the app, so it exists once they have
// activated their account. deleteAppAccount marks it appDeleted: true when
// they delete (deactivate) the account, and signing back in after Forgot
// password clears that again. Only the functions write it; any signed-in
// user can read it.
export const APP_MEMBERS = 'members';

export const APP_ACCOUNT_STATUS = {
  ACTIVATED: 'activated',
  DEACTIVATED: 'deactivated',
  // Never signed in to the app.
  NONE: 'none',
};

const statusOf = snap => {
  if (!snap.exists()) {
    return APP_ACCOUNT_STATUS.NONE;
  }
  return snap.get('appDeleted') === true
    ? APP_ACCOUNT_STATUS.DEACTIVATED
    : APP_ACCOUNT_STATUS.ACTIVATED;
};

/**
 * Follows one member's BJJ Members app account, calling onChange with an
 * APP_ACCOUNT_STATUS each time it changes, or null while it is not known.
 * Returns a function that stops listening.
 *
 * The listener follows the Firebase sign-in rather than waiting on one call
 * to ensureFirebaseSignIn: that spends the freshly minted token at most once,
 * so when the profile's conversation panel signs in at the same moment, only
 * one of the two callers gets a uid back. Whoever completes the sign-in, this
 * starts reading once someone is signed in.
 *
 * Anything that goes wrong -- no Firebase, not signed in, rules refusing --
 * reports null: the profile then shows no status at all, rather than a
 * status it could not confirm.
 */
export const subscribeAppAccountStatus = ({
  space,
  spaceSlug,
  username,
  memberId,
  onChange,
}) => {
  const app = initialiseFirebase(space);
  const store = getConversationStore();
  if (!app || !store || !spaceSlug || !memberId) {
    onChange(null);
    return () => {};
  }

  let stopSnapshot = null;
  const stopReading = () => {
    if (stopSnapshot) {
      stopSnapshot();
      stopSnapshot = null;
    }
  };

  const stopAuth = onAuthStateChanged(getAuth(app), user => {
    stopReading();
    onChange(null);
    if (!user) {
      return;
    }
    stopSnapshot = onSnapshot(
      doc(store, APP_MEMBERS, memberId),
      snap => onChange(statusOf(snap)),
      e => {
        console.warn('[appAccounts] could not read the app account', e);
        onChange(null);
      },
    );
  });

  if (username) {
    // Starts the sign-in if nothing else on the page has; a no-op otherwise.
    ensureFirebaseSignIn(app, identityKey(spaceSlug, username)).catch(e =>
      console.warn('[appAccounts] Firebase sign-in failed', e),
    );
  }

  return () => {
    stopAuth();
    stopReading();
  };
};

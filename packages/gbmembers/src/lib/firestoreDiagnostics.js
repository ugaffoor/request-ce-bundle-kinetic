import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import { getConversationStore } from './firebase';
import { getSignedInUid, getIdTokenClaims } from './firebaseAuth';
import {
  CONVERSATIONS_COLLECTION,
  CONVERSATION_FIELDS,
  MEMBERS_COLLECTION,
} from './conversationSchema';

/**
 * Walks the Firestore reads this feature depends on, cheapest rule first, so a
 * permission failure says WHICH rule refused rather than just "insufficient
 * permissions".
 *
 * The order matters. `members` is guarded only by `allow read: if
 * request.auth != null` -- the most permissive rule in the whole file. If that
 * fails while signed in, the deployed ruleset cannot be the one in the app
 * repo, and nothing further down is worth interpreting. If it succeeds, the
 * rules are live and the fault is specific to the conversations rule.
 */
const check = async (name, expectation, fn) => {
  try {
    const detail = await fn();
    return { name, expectation, ok: true, detail };
  } catch (e) {
    return {
      name,
      expectation,
      ok: false,
      detail: `${e.code || ''} ${e.message || String(e)}`.trim(),
    };
  }
};

export const runConversationDiagnostics = async ({ spaceSlug } = {}) => {
  const store = getConversationStore();
  const uid = getSignedInUid();

  if (!store) {
    return [
      {
        name: 'Firebase app',
        ok: false,
        detail: 'not initialised - no config for this space',
      },
    ];
  }
  if (!uid) {
    return [
      {
        name: 'Firebase session',
        ok: false,
        detail: 'not signed in - sign out of GB Members and sign in again',
      },
    ];
  }

  const results = [{ name: 'Signed in as', ok: true, detail: uid }];

  const claims = await getIdTokenClaims();
  results.push({
    name: 'staff claim',
    expectation: 'rules gate almost everything on request.auth.token.staff',
    ok: !!(claims && claims.staff === true),
    detail: claims ? JSON.stringify(claims) : 'could not read token',
  });

  results.push(
    await check(
      `read members/${uid}`,
      'allow read: if request.auth != null - the most permissive rule there is',
      async () => {
        const snap = await getDoc(doc(store, MEMBERS_COLLECTION, uid));
        return snap.exists()
          ? `exists: ${JSON.stringify(snap.data())}`
          : 'readable, but NO SUCH DOCUMENT - rules call me() on it';
      },
    ),
  );

  if (spaceSlug) {
    results.push(
      await check(
        `read safeguarding/${spaceSlug}`,
        'also allow read: if request.auth != null',
        async () => {
          const snap = await getDoc(doc(store, 'safeguarding', spaceSlug));
          return snap.exists() ? 'exists' : 'readable, no document';
        },
      ),
    );
  }

  results.push(
    await check(
      'list conversations (1 doc)',
      'the query this feature actually runs',
      async () => {
        const snap = await getDocs(
          query(
            collection(store, CONVERSATIONS_COLLECTION),
            where(CONVERSATION_FIELDS.participantIds, 'array-contains', uid),
            orderBy(CONVERSATION_FIELDS.updatedAt, 'desc'),
            limit(1),
          ),
        );
        return `returned ${snap.size} document(s)`;
      },
    ),
  );

  // Same query without the ordering, to tell a rules refusal apart from an
  // index problem -- a missing index reports failed-precondition, not
  // permission-denied, but the two get conflated easily.
  results.push(
    await check(
      'list conversations, no orderBy',
      'isolates the index from the rule',
      async () => {
        const snap = await getDocs(
          query(
            collection(store, CONVERSATIONS_COLLECTION),
            where(CONVERSATION_FIELDS.participantIds, 'array-contains', uid),
            limit(1),
          ),
        );
        return `returned ${snap.size} document(s)`;
      },
    ),
  );

  return results;
};

import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { getConversationStore } from './firebase';

/**
 * Chats shared by every program manager.
 *
 * Any chat with a program manager in it is shared with ALL of the academy's
 * program managers, so nothing a member says to one of them is lost to the
 * rest of the team (see the sharing section in the BJJ Members Cloud
 * Functions, functions/src/index.ts). The Cloud Functions add the program
 * managers and keep them current; such a chat carries pmShared, with pmCore
 * holding who it started with -- for a one-to-one, the person first, then the
 * program manager they were talking to. The portal only reads that, and never
 * rewrites a shared chat's people (firestore.rules would refuse it).
 *
 * Program manager is read from members/{uid}.isProgramManager, which the
 * Cloud Functions keep in step with the Kinetic "Role::Program Managers"
 * team. Mirrors openChatWith / useProgramManagerIds in the app's
 * src/firebase/chat.ts.
 */

const MEMBERS = 'members';

/**
 * A one-to-one with this person shared with the program managers, from a
 * list of normalised conversations -- a colleague's chat with them, which
 * every program manager is in -- or undefined. Lets a program manager land in
 * the conversation already under way rather than starting a second one.
 */
export const sharedOneToOneWith = (conversations, personId) =>
  (conversations || []).find(
    conversation =>
      conversation.isSharedOneToOne &&
      (conversation.pmCore || []).includes(personId),
  );

/**
 * The school's program managers, live: who may edit or delete the team's
 * messages in a shared chat (programManagerTeamMessage in firestore.rules).
 * Calls onChange with a Set of uids; returns a function that stops listening.
 * An error reports an empty set, so only the viewer's own messages are
 * offered.
 */
export const subscribeProgramManagerIds = (spaceSlug, onChange) => {
  const store = getConversationStore();
  if (!store || !spaceSlug) {
    onChange(new Set());
    return () => {};
  }
  return onSnapshot(
    query(
      collection(store, MEMBERS),
      where('spaceSlug', '==', spaceSlug),
      where('isProgramManager', '==', true),
    ),
    snap => onChange(new Set(snap.docs.map(d => d.id))),
    e => {
      console.warn('[programManagers] could not read program managers', e);
      onChange(new Set());
    },
  );
};

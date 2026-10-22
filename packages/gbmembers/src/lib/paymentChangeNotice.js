import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getConversationStore } from './firebase';
import {
  FRANCHISE_DOMAIN,
  getSignedInUid,
  resolveSpaceSlug,
} from './firebaseAuth';

/**
 * Tells the BJJ Members app's Cloud Functions that a member has just been
 * approved to change how they pay, so they get a push notification on their
 * phone (onPaymentChangeApproved). The approval itself is the Billing Changes
 * entry on their Kinetic record (changePayment.js) -- this is only the nudge,
 * and the app shows the approval in its Notifications from that record
 * whether or not the push arrives.
 *
 * Best-effort: never throws, and a failure only means no push. Skipped when
 * this portal isn't signed in to Firebase. firestore.rules lets staff write
 * one only for a member of their own academy who uses the app, in their own
 * name.
 */
export const notifyPaymentChangeApproved = async ({ member, staff }) => {
  try {
    const store = getConversationStore();
    const uid = getSignedInUid();
    const spaceSlug = resolveSpaceSlug();
    if (!store || !uid || !spaceSlug || !member || !member.id) {
      return;
    }
    await addDoc(collection(store, 'paymentChangeApprovals'), {
      // The member's submission id, which is also their app account id.
      memberId: member.id,
      approvedBy: (staff && (staff.displayName || staff.username)) || '',
      approvedByUid: uid,
      spaceSlug,
      domain: FRANCHISE_DOMAIN,
      createdAt: serverTimestamp(),
    });
  } catch (e) {
    // A member who has never signed in to the app is refused by the rules --
    // they have no phone to push to anyway.
    console.warn('[paymentChange] app notification not sent', e);
  }
};

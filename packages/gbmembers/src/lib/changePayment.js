/**
 * The Change Payment button on a member's profile: asks the member, through
 * the BJJ Members app, to change how they pay.
 *
 * The request is two fields on the member's own record in Kinetic -- the
 * contract the app already reads (MemberRecord.paymentChangeRequested in its
 * src/api/kinetic.ts):
 *
 *   Payment Change Requested     "YES" while the request is open; anything
 *                                else means none
 *   Payment Change Requested By  who asked, shown to the member
 *
 * While it is "YES" the app's Profile shows "Change payment method", which
 * opens the member's change-payment form for their billing provider. The
 * program manager clears it here once it has been dealt with.
 */
import { updateSubmission } from '@kineticdata/react';
import { NOTICE_TYPES } from '../redux/modules/errors';
import { getAttributeValue } from './react-kinops-components/src/utils';

export const REQUESTED_FIELD = 'Payment Change Requested';
export const REQUESTED_BY_FIELD = 'Payment Change Requested By';

const nameOf = member => {
  const values = (member && member.values) || {};
  return (
    [values['First Name'], values['Last Name']].filter(Boolean).join(' ') ||
    'This member'
  );
};

/** Whether a request is open -- read exactly as the app reads it. */
export const isPaymentChangeRequested = member =>
  ((member && member.values && member.values[REQUESTED_FIELD]) || '')
    .toString()
    .trim()
    .toUpperCase() === 'YES';

/** Who asked, or null. */
export const paymentChangeRequestedBy = member => {
  const value = member && member.values && member.values[REQUESTED_BY_FIELD];
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null;
};

/**
 * Which change-payment form applies to a member, by the rules both the
 * Billing tab and the app use, so all three agree:
 *
 *   PaySmart                           paysmart-change-payment-type
 *   Stripe, or a member already moved  stripe-change-payment-type
 *     to Stripe during a Bambora
 *     migration
 *   Bambora, not migrating             bambora-change-credit-card-details
 *   Bambora, migrating, not yet moved  none
 *
 * Returns { category, form }, or { reason } when there is no form.
 */
export const changePaymentFormFor = (member, space) => {
  const company = getAttributeValue(space || {}, 'Billing Company');
  const migrating =
    getAttributeValue(space || {}, 'Bambora Stripe Migration') === 'YES';
  const onStripe = (
    (member && member.values && member.values['Billing Customer Id']) ||
    ''
  ).startsWith('cus_');

  if (company === 'PaySmart') {
    return {
      category: 'billing-registration',
      form: 'paysmart-change-payment-type',
    };
  }
  if (company === 'Stripe' || (migrating && onStripe)) {
    return { category: 'stripe-billing', form: 'stripe-change-payment-type' };
  }
  if (company === 'Bambora' && !migrating) {
    return {
      category: 'bambora-billing',
      form: 'bambora-change-credit-card-details',
    };
  }
  if (company === 'Bambora') {
    return {
      reason: `${nameOf(
        member,
      )} has not been moved to Stripe yet, and payment details cannot be changed while the school is moving off Bambora.`,
    };
  }
  return {
    reason:
      company && company !== 'No Billing'
        ? `There is no change payment form for ${company} billing.`
        : 'This school does not take payments through a billing provider.',
  };
};

/**
 * Why the app would not let this member change their payment method, or
 * null when it would. Checked before anything is saved, so "Sent" only ever
 * means the member can actually use what they were sent.
 */
const blockedReason = (member, space) => {
  const values = (member && member.values) || {};
  if ((values['Non Paying'] || '').toString().toUpperCase() === 'YES') {
    // The app hides the option entirely for a non-paying member.
    return `${nameOf(
      member,
    )} is marked Non Paying, so there is no payment method to change.`;
  }
  const target = changePaymentFormFor(member, space);
  return target.form ? null : target.reason;
};

/**
 * Saves values onto the member's record. Kinetic's updateSubmission does not
 * throw when the server refuses -- it resolves with { error } -- so that is
 * checked explicitly; otherwise a refused save would read as a success.
 * Returns null when saved, or why not.
 */
const save = async (update, member, values) => {
  try {
    const result = await update({ id: member.id, values });
    if (result && result.error) {
      return result.error.message || 'Kinetic refused the change.';
    }
    return null;
  } catch (e) {
    return (e && e.message) || String(e);
  }
};

/**
 * Asks the member to change their payment method: saves the request onto
 * their record and says how it went. Green "Sent" clears itself; red "Not
 * sent" stays until closed, as every failure does in the portal.
 *
 * On success the member's values are updated in place, so the profile shows
 * the open request at once without reloading. `update` is replaceable for
 * testing.
 */
export const requestPaymentChange = async ({
  member,
  space,
  requestedBy,
  addNotification,
  setSaving = () => {},
  update = updateSubmission,
}) => {
  const name = nameOf(member);
  const blocked = blockedReason(member, space);
  if (blocked) {
    addNotification(NOTICE_TYPES.ERROR, blocked, 'Not sent');
    return false;
  }

  const values = {
    [REQUESTED_FIELD]: 'YES',
    [REQUESTED_BY_FIELD]: requestedBy || '',
  };

  setSaving(true);
  const failure = await save(update, member, values);
  if (failure) {
    setSaving(false);
    addNotification(
      NOTICE_TYPES.ERROR,
      `${name} was not asked to change their payment method. ${failure}`,
      'Not sent',
    );
    return false;
  }

  Object.assign(member.values, values);
  setSaving(false);
  addNotification(
    NOTICE_TYPES.SUCCESS,
    `${name} can now change their payment method in the BJJ Members app.`,
    'Sent',
  );
  return true;
};

/**
 * Withdraws an open request once it has been dealt with, so the app stops
 * offering the option. "NO" rather than blank, following the member form's
 * YES/NO convention; the app treats anything but "YES" as no request.
 */
export const clearPaymentChange = async ({
  member,
  addNotification,
  setSaving = () => {},
  update = updateSubmission,
}) => {
  const name = nameOf(member);
  const values = { [REQUESTED_FIELD]: 'NO', [REQUESTED_BY_FIELD]: '' };

  setSaving(true);
  const failure = await save(update, member, values);
  if (failure) {
    setSaving(false);
    addNotification(
      NOTICE_TYPES.ERROR,
      `The payment change request for ${name} was not cleared. ${failure}`,
      'Not cleared',
    );
    return false;
  }

  Object.assign(member.values, values);
  setSaving(false);
  addNotification(
    NOTICE_TYPES.SUCCESS,
    `${name} will no longer see "Change payment method" in the app.`,
    'Request cleared',
  );
  return true;
};

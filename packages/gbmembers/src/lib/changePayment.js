/**
 * The Change Payment button on a member's profile: approves the member, in
 * the BJJ Members app, to change how they pay. Without an approval the app
 * never offers "Change payment method".
 *
 * The approval is kept in the member's existing "Billing Changes" history on
 * their Kinetic record -- the list the portal already appends to for every
 * billing change, and the Billing tab already shows -- so no new fields are
 * needed. Each approval and each withdrawal is one more entry:
 *
 *   action  "Payment Change Requested" or "Payment Change Cleared"
 *   user    the program manager's username, like every other entry
 *   by      their display name, shown to the member as "Requested by ..."
 *   date    'YYYY-MM-DD HH:mm', like every other entry
 *   at      the exact time (ISO), which decides which entry is newest
 *   from    ''
 *   to      '' -- the history table reads to.amount, so never null
 *   reason  a readable note for the Billing tab
 *
 * The newest of those two actions is the current state, by `at`. Not by
 * position: the Billing tab sorts the list in place when it shows it, so the
 * order a later save writes back is not reliably chronological. The app
 * reads it the same way (paymentChangeFromHistory in its src/api/kinetic.ts).
 */
import moment from 'moment';
import { updateSubmission } from '@kineticdata/react';
import { NOTICE_TYPES } from '../redux/modules/errors';
import { getAttributeValue } from './react-kinops-components/src/utils';

export const BILLING_CHANGES_FIELD = 'Billing Changes';
export const REQUESTED_ACTION = 'Payment Change Requested';
export const CLEARED_ACTION = 'Payment Change Cleared';

// The format every Billing Changes entry is written and sorted in --
// contact_date_format in components/leads/LeadsUtils.js.
const BILLING_DATE_FORMAT = 'YYYY-MM-DD HH:mm';

const nameOf = member => {
  const values = (member && member.values) || {};
  return (
    [values['First Name'], values['Last Name']].filter(Boolean).join(' ') ||
    'This member'
  );
};

/**
 * The member's Billing Changes as a list: [] when there are none, null when
 * the stored value cannot be read. Stored as a JSON string or, once the
 * portal has touched it, as the parsed list -- the same two shapes the
 * Billing tab handles.
 */
const billingChangesOf = member => {
  let changes = member && member.values && member.values[BILLING_CHANGES_FIELD];
  if (!changes) {
    return [];
  }
  if (typeof changes !== 'object') {
    try {
      changes = JSON.parse(changes);
    } catch (e) {
      return null;
    }
  }
  return Array.isArray(changes) ? changes : null;
};

// When an entry was made: its exact time, else its minute-level date.
const entryTime = entry => {
  const exact = Date.parse(entry.at);
  if (!isNaN(exact)) {
    return exact;
  }
  const loose = moment(entry.date, BILLING_DATE_FORMAT, true);
  return loose.isValid() ? loose.valueOf() : 0;
};

/**
 * The newest approval or withdrawal in a member's history, or null. On a tie
 * the one further down the list wins, which is the later write.
 */
export const latestPaymentChange = member => {
  let latest = null;
  let latestTime = -Infinity;
  (billingChangesOf(member) || []).forEach(entry => {
    if (
      !entry ||
      (entry.action !== REQUESTED_ACTION && entry.action !== CLEARED_ACTION)
    ) {
      return;
    }
    const time = entryTime(entry);
    if (time >= latestTime) {
      latest = entry;
      latestTime = time;
    }
  });
  return latest;
};

/** Whether the member is currently approved. */
export const isPaymentChangeRequested = member => {
  const latest = latestPaymentChange(member);
  return !!latest && latest.action === REQUESTED_ACTION;
};

/** Who approved it, or null. */
export const paymentChangeRequestedBy = member => {
  const latest = latestPaymentChange(member);
  if (!latest || latest.action !== REQUESTED_ACTION) {
    return null;
  }
  const by = (latest.by || latest.user || '').toString().trim();
  return by || null;
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
 * Adds one approval or withdrawal to the member's Billing Changes and saves
 * it. Refuses rather than writing when the existing history cannot be read:
 * saving a fresh list over it would wipe the member's billing history.
 * On success the member's values are updated in place, so the profile and
 * its Billing tab show the change at once.
 */
const appendEntry = async ({ member, staff, action, reason, update, now }) => {
  const changes = billingChangesOf(member);
  if (changes === null) {
    return `${nameOf(
      member,
    )}'s Billing Changes history could not be read, so nothing was saved over it.`;
  }
  const at = now();
  const entry = {
    date: moment(at).format(BILLING_DATE_FORMAT),
    at: at.toISOString(),
    user: (staff && staff.username) || '',
    by: (staff && (staff.displayName || staff.username)) || '',
    action,
    from: '',
    to: '',
    reason,
  };
  const next = changes.concat(entry);
  const failure = await save(update, member, {
    [BILLING_CHANGES_FIELD]: next,
  });
  if (!failure) {
    member.values[BILLING_CHANGES_FIELD] = next;
  }
  return failure;
};

/**
 * Approves the member to change their payment method and says how it went:
 * green "Sent" clears itself; red "Not sent" stays until closed, as every
 * failure does in the portal. `update` and `now` are replaceable for testing.
 */
export const requestPaymentChange = async ({
  member,
  space,
  staff,
  addNotification,
  setSaving = () => {},
  update = updateSubmission,
  now = () => new Date(),
}) => {
  const name = nameOf(member);
  const blocked = blockedReason(member, space);
  if (blocked) {
    addNotification(NOTICE_TYPES.ERROR, blocked, 'Not sent');
    return false;
  }

  setSaving(true);
  const failure = await appendEntry({
    member,
    staff,
    action: REQUESTED_ACTION,
    reason: 'Approved to change payment method in the BJJ Members app',
    update,
    now,
  });
  setSaving(false);

  if (failure) {
    addNotification(
      NOTICE_TYPES.ERROR,
      `${name} was not approved to change their payment method. ${failure}`,
      'Not sent',
    );
    return false;
  }
  addNotification(
    NOTICE_TYPES.SUCCESS,
    `${name} can now change their payment method in the BJJ Members app.`,
    'Sent',
  );
  return true;
};

/**
 * Withdraws the approval once it has been dealt with, so the app stops
 * offering the option. Recorded as its own entry, so the history keeps both.
 */
export const clearPaymentChange = async ({
  member,
  staff,
  addNotification,
  setSaving = () => {},
  update = updateSubmission,
  now = () => new Date(),
}) => {
  const name = nameOf(member);

  setSaving(true);
  const failure = await appendEntry({
    member,
    staff,
    action: CLEARED_ACTION,
    reason: 'Approval to change payment method withdrawn',
    update,
    now,
  });
  setSaving(false);

  if (failure) {
    addNotification(
      NOTICE_TYPES.ERROR,
      `The approval for ${name} was not cleared. ${failure}`,
      'Not cleared',
    );
    return false;
  }
  addNotification(
    NOTICE_TYPES.SUCCESS,
    `${name} will no longer see "Change payment method" in the app.`,
    'Request cleared',
  );
  return true;
};

/**
 * The shape of the shared Firestore data, kept in one place.
 *
 * The BJJ Members app owns this schema -- the portal reads and writes the
 * same documents, so these names must match what the app actually uses.
 * Confirmed against the bjj-members-connect Firestore console.
 */

// -- Collections --------------------------------------------------------

export const MEMBERS_COLLECTION = 'members';
export const CONVERSATIONS_COLLECTION = 'conversations';
export const MESSAGES_SUBCOLLECTION = 'messages';

// -- Participant identifiers --------------------------------------------

/**
 * Students appear as their raw Kinetic member id -- the same id the portal
 * already holds on records in state.member.members.allMembers, so nothing
 * needs translating:
 *
 *   09b668c2-d47a-11eb-b63a-49f06b4ef873
 *
 * Staff appear as a composite of space slug and Kinetic username:
 *
 *   staff_usbeta_program.manager
 *
 * That means the portal can derive its own participant id from the signed
 * in Kinetic user, with no lookup against the members collection.
 */
export const STAFF_ID_PREFIX = 'staff_';

export const staffParticipantId = (spaceSlug, username) =>
  `${STAFF_ID_PREFIX}${spaceSlug}_${username}`;

export const isStaffParticipant = participantId =>
  typeof participantId === 'string' &&
  participantId.startsWith(STAFF_ID_PREFIX);

/**
 * Conversation documents are keyed by member id and staff id joined with an
 * underscore, member first:
 *
 *   09b668c2-d47a-11eb-b63a-49f06b4ef873_staff_usbeta_program.manager
 *
 * Deriving the id rather than querying for it means a staff member opening
 * a student always lands on the same document, so replies append to the
 * existing thread instead of forking a second one.
 */
export const conversationId = (memberId, staffId) =>
  // Must match conversationIdFor() in the app: [a, b].sort().join('_').
  // Sorting matters -- deriving the id a different way would create a second
  // document for the same pair, and the two sides would stop seeing each
  // other's messages with no error to show for it.
  [memberId, staffId].sort().join('_');

/**
 * Broadcast threads get their own id namespace, deliberately separate from
 * the 1:1 pair id above.
 *
 * They used to share it, which was a data-corrupting bug: broadcasting to
 * someone you already had a conversation with resolved to the SAME document,
 * and merging staffBroadcast onto it rewrote that existing chat into a
 * broadcast -- retitling their history and hiding the reply box.
 *
 * Still derived from the pair rather than auto-generated, so broadcasting to
 * the same member twice appends to one broadcast thread instead of leaving a
 * new document behind every time. The member id is sorted with the staff id
 * for the same reason conversationId() sorts: one pair, one id, whichever way
 * round the caller passes them.
 */
export const BROADCAST_ID_PREFIX = 'broadcast_';

export const broadcastConversationId = (memberId, staffId) =>
  BROADCAST_ID_PREFIX + [memberId, staffId].sort().join('_');

/**
 * Announcement threads. When a student replies to a broadcast announcement
 * the reply lands in a conversation whose id and participant carry an
 * `announcements_` prefix, e.g.
 *
 *   announcements_gbmembers.net
 *
 * Those threads are worth marking in the UI: they are a reply to something
 * sent to everyone, not a message someone chose to start with this member of
 * staff, so they read differently.
 */
export const ANNOUNCEMENT_ID_PREFIX = 'announcements_';

/**
 * The school's single announcement thread. Must match announcementThreadId()
 * in the app and announcementIdFor() in firestore.rules, which builds it as
 * 'announcements_' + domain.lower() + '_' + slug.lower() -- the rules pin the
 * document id to exactly this, so a mismatch is rejected outright.
 */
export const announcementThreadId = (spaceSlug, domain) =>
  ANNOUNCEMENT_ID_PREFIX +
  String(domain || '')
    .trim()
    .toLowerCase() +
  '_' +
  String(spaceSlug || '')
    .trim()
    .toLowerCase();

/** What the thread is called, e.g. "usbeta Announcements". */
export const announcementThreadName = spaceSlug =>
  `${String(spaceSlug || '').trim()} Announcements`;

/** The three things this page can send. */
export const SEND_KINDS = {
  CONVERSATION: 'conversation',
  GROUP: 'group',
  BROADCAST: 'broadcast',
  ANNOUNCEMENT: 'announcement',
};

export const isAnnouncementParticipant = participantId =>
  typeof participantId === 'string' &&
  participantId.startsWith(ANNOUNCEMENT_ID_PREFIX);

/**
 * An ANNOUNCEMENT is addressed to a whole school. The app keeps one thread
 * per school at a deterministic id built by announcementThreadId():
 *
 *   announcements_{domain}_{spaceSlug}    e.g. announcements_gbmembers.net_usbeta
 *
 * That thread deliberately carries NO participantIds -- firestore.rules
 * decides who may read it from spaceSlug instead, so a gym of any size does
 * not need an array of every member. Per-member deliveries are separate
 * documents flagged `announcementCopy`.
 *
 * Unlike a broadcast, an announcement CAN be replied to.
 */
export const isAnnouncementConversation = (id, participantIds, data) =>
  (typeof id === 'string' && id.startsWith(ANNOUNCEMENT_ID_PREFIX)) ||
  (participantIds || []).some(isAnnouncementParticipant) ||
  !!(data && (data.announcement || data.announcementCopy));

/**
 * The school's own announcement thread, as opposed to a per-member delivery.
 *
 * Both share the `announcements_` id prefix -- a copy is the thread id with
 * the member's guid appended -- so the prefix alone cannot tell them apart.
 * The distinction matters for removal: firestore.rules lets staff DELETE a
 * post from the school thread, which triggers the fan-out cleanup, but a copy
 * is not `announcement: true` and the same delete is refused.
 *
 * Staff receive copies too (the fan-out always includes them), so a staff
 * member's own copy WILL appear in their conversation list.
 */
export const isAnnouncementThread = data => !!(data && data.announcement);

export const isAnnouncementCopy = data => !!(data && data.announcementCopy);

/**
 * Broadcast vs announcement, per the BJJ Members app (src/firebase/chat.ts).
 * They are separate features and behave differently, so they are detected
 * separately here.
 *
 * A BROADCAST is the same text sent to several members, each in their own
 * conversation, so no recipient learns who else received it. The conversation
 * carries `staffBroadcast: true` and `broadcastSender`, and lives under the
 * broadcast_ id prefix.
 *
 * NOTE: this is a PORTAL-ONLY feature. The BJJ Members app has no broadcast
 * concept -- nothing in it reads or writes staffBroadcast -- so to a member on
 * a phone a broadcast is simply an ordinary conversation from a staff member.
 *
 * CAREFUL: the app also has a `broadcast` field on MESSAGE documents, which
 * means something else entirely -- "a fanned-out announcement delivery". The
 * app names the conversation flag `staffBroadcast` precisely to avoid that
 * collision, and their comment calls the overlap a trap. Do not key on
 * `broadcast` here.
 */
export const isBroadcastConversation = data => !!(data && data.staffBroadcast);

/**
 * Who sent a broadcast, so the portal can hide its own reply box on a thread
 * it treats as one-way.
 *
 * CAREFUL: nothing enforces that one-wayness. firestore.rules contains no
 * broadcast handling at all, so a recipient CAN reply and their reply will be
 * accepted -- the portal simply does not offer them the box. Treat "one-way"
 * as a UI convention, not a guarantee, until a rule backs it.
 */
export const broadcastSenderOf = data => (data && data.broadcastSender) || null;

/**
 * The three kinds of thread the portal can show. Broadcast is tested first
 * because it is the one with restricted behaviour -- if a thread were ever
 * flagged as both, treating it as a broadcast is the safer reading.
 */
export const CONVERSATION_KINDS = {
  ALL: 'all',
  // Not a kind of thread but a state: the other side spoke last. Offered
  // in the same filter because that is where someone looks for it.
  NEEDS_REPLY: 'needs_reply',
  CONVERSATION: 'conversation',
  GROUP: 'group',
  ANNOUNCEMENT: 'announcement',
  BROADCAST: 'broadcast',
};

export const CONVERSATION_KIND_LABELS = {
  [CONVERSATION_KINDS.ALL]: 'All',
  [CONVERSATION_KINDS.NEEDS_REPLY]: 'Needs reply',
  [CONVERSATION_KINDS.CONVERSATION]: 'Conversations',
  [CONVERSATION_KINDS.GROUP]: 'Groups',
  [CONVERSATION_KINDS.ANNOUNCEMENT]: 'Announcements',
  [CONVERSATION_KINDS.BROADCAST]: 'Broadcasts',
};

export const conversationKind = conversation => {
  if (!conversation) {
    return CONVERSATION_KINDS.CONVERSATION;
  }
  if (conversation.isBroadcast) {
    return CONVERSATION_KINDS.BROADCAST;
  }
  if (conversation.isAnnouncement) {
    return CONVERSATION_KINDS.ANNOUNCEMENT;
  }
  // Checked after the two above: a broadcast or announcement carrying
  // isGroup is still better read as what restricts its behaviour.
  if (conversation.isGroup) {
    return CONVERSATION_KINDS.GROUP;
  }
  return CONVERSATION_KINDS.CONVERSATION;
};

/**
 * Whether the ball is in the viewer's court: someone else sent the last
 * message. The same test the header inbox uses. A broadcast never needs a
 * reply -- nobody can send one -- and an announcement is a notice, not a
 * conversation, so it is not flagged either. With no viewer known nothing
 * is flagged, since a wrong badge is worse than none.
 */
export const needsReply = (conversation, viewerId) =>
  !!viewerId &&
  !!conversation &&
  !conversation.isBroadcast &&
  !conversation.isAnnouncement &&
  !!conversation.lastMessage &&
  !!conversation.lastMessage.senderId &&
  conversation.lastMessage.senderId !== viewerId;

export const matchesConversationKind = (conversation, kind, viewerId) =>
  !kind ||
  kind === CONVERSATION_KINDS.ALL ||
  (kind === CONVERSATION_KINDS.NEEDS_REPLY
    ? needsReply(conversation, viewerId)
    : conversationKind(conversation) === kind);

// -- participant names --------------------------------------------------

/**
 * Members indexed by id, for name lookups.
 *
 * Memoised on the array's identity because callers re-derive props on every
 * store change -- the header inbox especially -- and rebuilding this from a
 * full academy roster each time is wasted work.
 */
let membersByIdCache = null;

/**
 * Tiny Champions are the platform's youngest members, and messaging them is
 * treated differently: a Tiny Champion is contacted through whoever pays for
 * them, not directly.
 *
 * The definition matches TINY_CHAMPIONS in the app's functions/src/index.ts,
 * which builds the safeguarding/{spaceSlug} index the security rules test
 * against -- a member enrolled in the Tiny Champions program under any of
 * their three program slots. Derived from the member record the portal
 * already holds, so this needs no extra read.
 */
export const TINY_CHAMPIONS_PROGRAM = 'Tiny Champions';

export const isTinyChampion = member =>
  !!member &&
  !!member.values &&
  [
    member.values['Ranking Program'],
    member.values['Additional Program 1'],
    member.values['Additional Program 2'],
  ].indexOf(TINY_CHAMPIONS_PROGRAM) !== -1;

/**
 * The member who pays for this one, when they are a dependent. This is who
 * should be contacted about a Tiny Champion.
 */
export const billingOwnerIdOf = member => {
  const parent =
    member && member.values && member.values['Billing Parent Member'];
  return parent && parent !== member.id ? parent : null;
};

let billingOwnersCache = null;

/**
 * The members who pay: for themselves, and possibly for others. A billing
 * owner is anyone with a billing account of their own, or anyone another
 * member's bill is charged to. A dependent -- someone whose bill goes to a
 * parent member -- is not one, even if they happen to have a customer id.
 *
 * Returned as a set of member ids, cached on the roster's identity the same
 * way indexMembersById is, since every list filter runs it.
 */
export const billingOwnerIds = allMembers => {
  const list = allMembers || [];

  if (billingOwnersCache && billingOwnersCache.list === list) {
    return billingOwnersCache.value;
  }

  const value = new Set();
  list.forEach(member => {
    const values = (member && member.values) || {};
    const parent = values['Billing Parent Member'];
    if (parent && parent !== member.id) {
      // Someone else pays for this member -- so that someone is an owner.
      value.add(parent);
      return;
    }
    if (values['Billing User'] === 'YES' || values['Billing Customer Id']) {
      value.add(member.id);
    }
  });

  billingOwnersCache = { list, value };
  return value;
};

/**
 * Whether anyone in the thread, other than the viewer, is a billing owner.
 */
export const involvesBillingOwner = (conversation, owners, viewerId) =>
  (conversation.participantIds || []).some(
    pid => pid !== viewerId && owners.has(pid),
  );

export const indexMembersById = allMembers => {
  const list = allMembers || [];

  if (membersByIdCache && membersByIdCache.list === list) {
    return membersByIdCache.value;
  }

  const value = list.reduce((map, member) => {
    map[member.id] = member;
    return map;
  }, {});

  membersByIdCache = { list, value };
  return value;
};

/**
 * Participant ids are either a raw Kinetic member id or a staff composite.
 * Resolve both to something a human recognises, falling back to the raw id
 * so an unresolvable participant is still visible rather than blank.
 */
export const participantName = (participantId, membersById) => {
  if (!participantId) {
    return 'Unknown';
  }

  if (isAnnouncementParticipant(participantId)) {
    return 'Announcements';
  }

  if (isStaffParticipant(participantId)) {
    const username = participantId
      .slice(STAFF_ID_PREFIX.length)
      .split('_')
      .slice(1)
      .join('_');
    return username || participantId;
  }

  const member = membersById[participantId];
  if (!member) {
    return participantId;
  }

  return (
    (
      (member.values['Last Name'] || '') +
      ' ' +
      (member.values['First Name'] || '')
    ).trim() || participantId
  );
};

/**
 * What to call a thread in a list.
 *
 * A group carries its own name -- createGroupConversation() in the app writes
 * `name` -- while a 1:1 is named after the other participant. Naming a group
 * after `otherParticipantId` would pick an arbitrary member out of the group,
 * which is why groups need their own case.
 *
 * The `Group (N)` fallback matches MessagesScreen in the app, so an unnamed
 * group reads identically in the portal and on a phone.
 */
export const conversationTitle = (conversation, membersById) => {
  if (!conversation) {
    return 'Unknown';
  }

  if (conversation.isGroup) {
    return (
      conversation.name ||
      `Group (${(conversation.participantIds || []).length})`
    );
  }

  return participantName(conversation.otherParticipantId, membersById);
};

/**
 * Who sent a thread's most recent message, labelled for a list row.
 *
 * Only meaningful for a group. In a 1:1 the sender is either you or the person
 * the row is already named after, so labelling it adds noise -- but a group row
 * is named after the GROUP, which leaves the sender invisible: you can see that
 * a message arrived without seeing who it came from.
 *
 * Returns null when there is nothing worth showing, so callers can render the
 * message text alone.
 */
export const lastMessageSenderLabel = (conversation, membersById, viewerId) => {
  if (!conversation || !conversation.isGroup || !conversation.lastMessage) {
    return null;
  }

  const senderId = conversation.lastMessage.senderId;
  if (!senderId) {
    return null;
  }

  // Your own messages read oddly under your own name in a list.
  if (viewerId && senderId === viewerId) {
    return 'You';
  }

  return participantName(senderId, membersById);
};

/**
 * Who sent the last message, for any kind of thread: "You", or the sender
 * by name. Unlike lastMessageSenderLabel this is not limited to groups --
 * in a list that shows only the preview, "Sounds good" says nothing about
 * whether you are waiting on them or they on you.
 */
export const previewSenderLabel = (conversation, membersById, viewerId) => {
  if (!conversation || !conversation.lastMessage) {
    return null;
  }
  const senderId = conversation.lastMessage.senderId;
  if (!senderId) {
    return null;
  }
  if (viewerId && senderId === viewerId) {
    return 'You';
  }
  return participantName(senderId, membersById);
};

/**
 * Collapses a conversation list into one entry per person.
 *
 * A single member normally has one thread per staff member, since the id is
 * derived from the pair -- but duplicates do occur: threads created before
 * that convention settled, and threads the mobile app opened under its own
 * id. Showing them as separate rows makes it look like someone messaged
 * several times when they have one ongoing conversation.
 *
 * Only ordinary 1:1 conversations collapse this way. A group, a broadcast
 * and an announcement thread each stand on their own row: they are different
 * things from a chat with that person, and folding a broadcast under the
 * member's conversation made it look like part of the chat.
 *
 * Each group carries its threads newest first, with `latest` as the one whose
 * message should represent the group. Groups themselves are ordered by that
 * same recency, so the most active person is at the top.
 */
export const groupConversationsByParticipant = (conversations, membersById) => {
  const time = conversation =>
    conversation && conversation.updatedAt
      ? conversation.updatedAt.getTime()
      : 0;

  const groups = new Map();
  (conversations || []).forEach(conversation => {
    // A 1:1 chat is keyed on the person; anything else on its own id so it
    // never merges with the person's chat or with each other.
    const plainChat =
      conversationKind(conversation) === CONVERSATION_KINDS.CONVERSATION;
    const key = plainChat
      ? conversation.otherParticipantId || ''
      : conversation.id;
    if (!groups.has(key)) {
      groups.set(key, { participantId: key, plainChat, list: [] });
    }
    groups.get(key).list.push(conversation);
  });

  return Array.from(groups.values())
    .map(({ participantId, plainChat, list }) => {
      const ordered = list.slice().sort((a, b) => time(b) - time(a));
      return {
        participantId,
        name: plainChat
          ? participantName(participantId || null, membersById)
          : conversationTitle(ordered[0], membersById),
        conversations: ordered,
        latest: ordered[0],
        isAnnouncement: ordered.some(c => c.isAnnouncement),
        isBroadcast: ordered.some(c => c.isBroadcast),
      };
    })
    .sort((a, b) => time(b.latest) - time(a.latest));
};

// -- conversations fields -----------------------------------------------

export const CONVERSATION_FIELDS = {
  participantIds: 'participantIds',
  participantsMeta: 'participantsMeta',
  lastMessage: 'lastMessage',
  updatedAt: 'updatedAt',
  isGroup: 'isGroup',
  // Groups only -- written by createGroupConversation() in the app.
  name: 'name',
  hasJunior: 'hasJunior',
  monitorable: 'monitorable',
};

// -- message fields -----------------------------------------------------

export const MESSAGE_FIELDS = {
  body: 'text',
  senderId: 'senderId',
  createdAt: 'createdAt',
};

/**
 * Firestore Timestamps, epoch numbers and ISO strings all appear in the
 * wild. Normalise to a JS Date so the UI does not have to care which the
 * app happens to write.
 */
export const toDate = value => {
  if (!value) {
    return null;
  }
  if (typeof value.toDate === 'function') {
    return value.toDate();
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
};

/**
 * Flattens a conversation document into the shape the UI consumes, with the
 * timestamp normalised and the other participant resolved.
 */
export const normaliseConversation = (id, data, viewerId) => {
  const participantIds = data[CONVERSATION_FIELDS.participantIds] || [];
  const lastMessage = data[CONVERSATION_FIELDS.lastMessage];
  const meta = data[CONVERSATION_FIELDS.participantsMeta] || {};
  const mine = (viewerId && meta[viewerId]) || {};

  return {
    id,
    // When this viewer last removed the thread. Per-viewer, not shared: the
    // other participant sees no change. Matches clearConversationForMe() in
    // the app, which writes the same field.
    clearedAt: toDate(mine.clearedAt),
    participantIds,
    otherParticipantId: participantIds.find(pid => pid !== viewerId),
    isGroup: !!data[CONVERSATION_FIELDS.isGroup],
    name: data[CONVERSATION_FIELDS.name] || null,
    isAnnouncement: isAnnouncementConversation(id, participantIds, data),
    // Only the school thread may be hard-deleted; a delivered copy may not.
    isAnnouncementThread: isAnnouncementThread(data),
    isAnnouncementCopy: isAnnouncementCopy(data),
    isBroadcast: isBroadcastConversation(data),
    broadcastSender: broadcastSenderOf(data),
    hasJunior: !!data[CONVERSATION_FIELDS.hasJunior],
    monitorable: !!data[CONVERSATION_FIELDS.monitorable],
    lastMessage: lastMessage
      ? {
          text: lastMessage[MESSAGE_FIELDS.body],
          senderId: lastMessage[MESSAGE_FIELDS.senderId],
          createdAt: toDate(lastMessage[MESSAGE_FIELDS.createdAt]),
        }
      : null,
    // The document carries its own updatedAt (what the app orders by);
    // fall back to the last message time for threads written before it.
    updatedAt:
      toDate(data[CONVERSATION_FIELDS.updatedAt]) ||
      (lastMessage ? toDate(lastMessage[MESSAGE_FIELDS.createdAt]) : null),
  };
};

/**
 * A thread the viewer has removed stays hidden until someone sends something
 * newer -- then it returns, showing only what arrived since. Mirrors
 * isConversationCleared() in the app so both clients hide the same threads.
 */
export const isConversationCleared = conversation => {
  if (!conversation || !conversation.clearedAt) {
    return false;
  }
  const last = conversation.updatedAt;
  return !last || last.getTime() <= conversation.clearedAt.getTime();
};

/**
 * The tombstone text. Must match DELETED_MESSAGE_TEXT in the app's
 * src/firebase/chat.ts -- it is written into the conversation's cached
 * lastMessage preview, so both clients have to agree on the wording or the
 * list and the thread will disagree about the same message.
 */
export const DELETED_MESSAGE_TEXT = 'This message was deleted';

/**
 * The tombstone for an announcement copy whose original was withdrawn by the
 * school. onAnnouncementDeleted stamps the copy with announcementRemoved so
 * the member sees that the SCHOOL took it back, not that a message in the
 * chat was deleted. Must match ANNOUNCEMENT_REMOVED_TEXT in the app.
 */
export const ANNOUNCEMENT_REMOVED_TEXT = 'Announcement was removed';

/**
 * Who an announcement was addressed to: the people by name when it went to
 * specific members, otherwise the programs it was filtered to, otherwise
 * the whole school.
 */
export const describeAudience = (message, membersById) => {
  const members = message.audienceMembers || [];
  if (members.length > 0) {
    return members.map(id => participantName(id, membersById)).join(', ');
  }
  const programs = message.audience || [];
  if (programs.length > 0) {
    return programs.join(', ');
  }
  return 'Whole school';
};

/**
 * Everyone in a thread other than the viewer, by name. The school's
 * announcement thread has no participants, so it reads as the whole school.
 */
export const conversationParticipants = (
  conversation,
  membersById,
  viewerId,
) => {
  const others = (conversation.participantIds || []).filter(
    pid => pid !== viewerId,
  );
  if (others.length < 1) {
    return conversation.isAnnouncementThread ? 'Whole school' : '';
  }
  return others.map(pid => participantName(pid, membersById)).join(', ');
};

export const normaliseMessage = (id, data) => ({
  id,
  // Withdrawn for everyone by its sender. text is '' when set, so the UI
  // shows a tombstone rather than an empty bubble.
  deleted: !!data.deleted,
  // Set alongside deleted when the tombstone came from a withdrawn
  // announcement rather than the sender deleting their own post.
  announcementRemoved: !!data.announcementRemoved,
  // Announcements only: who it went to. `audience` is the programs filter
  // the app offers; `audienceMembers` the explicit member ids the portal
  // sends; `audienceStatus` the portal's label for that choice. All empty
  // means the whole school.
  audience: Array.isArray(data.audience) ? data.audience : [],
  audienceMembers: Array.isArray(data.audienceMembers)
    ? data.audienceMembers
    : [],
  audienceStatus: data.audienceStatus || null,
  text: data[MESSAGE_FIELDS.body],
  senderId: data[MESSAGE_FIELDS.senderId],
  createdAt: toDate(data[MESSAGE_FIELDS.createdAt]),
});

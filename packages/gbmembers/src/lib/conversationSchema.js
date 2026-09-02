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
 * Broadcast vs announcement, per the BJJ Members app (src/firebase/chat.ts).
 * They are separate features and behave differently, so they are detected
 * separately here.
 *
 * A BROADCAST is a one-way 1:1 thread created by sendBroadcast(): the same
 * text sent to several members, each in their own conversation, so no
 * recipient learns who else received it. The conversation carries
 * `staffBroadcast: true` and `broadcastSender`.
 *
 * CAREFUL: the app also has a `broadcast` field on MESSAGE documents, which
 * means something else entirely -- "a fanned-out announcement delivery". The
 * app names the conversation flag `staffBroadcast` precisely to avoid that
 * collision, and their comment calls the overlap a trap. Do not key on
 * `broadcast` here.
 */
export const isBroadcastConversation = data => !!(data && data.staffBroadcast);

/**
 * Only the sender may write into a broadcast thread -- firestore.rules
 * enforces it via broadcastWritable(), which permits a write when
 * `broadcastSender == request.auth.uid` and rejects everyone else.
 */
export const broadcastSenderOf = data =>
  (data && data.broadcastSender) || null;

/**
 * The three kinds of thread the portal can show. Broadcast is tested first
 * because it is the one with restricted behaviour -- if a thread were ever
 * flagged as both, treating it as a broadcast is the safer reading.
 */
export const CONVERSATION_KINDS = {
  ALL: 'all',
  CONVERSATION: 'conversation',
  ANNOUNCEMENT: 'announcement',
  BROADCAST: 'broadcast',
};

export const CONVERSATION_KIND_LABELS = {
  [CONVERSATION_KINDS.ALL]: 'All',
  [CONVERSATION_KINDS.CONVERSATION]: 'Conversations',
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
  return CONVERSATION_KINDS.CONVERSATION;
};

export const matchesConversationKind = (conversation, kind) =>
  !kind ||
  kind === CONVERSATION_KINDS.ALL ||
  conversationKind(conversation) === kind;

// -- participant names --------------------------------------------------

/**
 * Members indexed by id, for name lookups.
 *
 * Memoised on the array's identity because callers re-derive props on every
 * store change -- the header inbox especially -- and rebuilding this from a
 * full academy roster each time is wasted work.
 */
let membersByIdCache = null;

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
 * Collapses a conversation list into one entry per person.
 *
 * A single member normally has one thread per staff member, since the id is
 * derived from the pair -- but duplicates do occur: threads created before
 * that convention settled, and threads the mobile app opened under its own
 * id. Showing them as separate rows makes it look like someone messaged
 * several times when they have one ongoing conversation.
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
    const key = conversation.otherParticipantId || '';
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(conversation);
  });

  return Array.from(groups.entries())
    .map(([participantId, list]) => {
      const ordered = list.slice().sort((a, b) => time(b) - time(a));
      return {
        participantId,
        name: participantName(participantId || null, membersById),
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
  isGroup: 'isGroup',
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

  return {
    id,
    participantIds,
    otherParticipantId: participantIds.find(pid => pid !== viewerId),
    isGroup: !!data[CONVERSATION_FIELDS.isGroup],
    isAnnouncement: isAnnouncementConversation(id, participantIds, data),
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
    updatedAt: lastMessage
      ? toDate(lastMessage[MESSAGE_FIELDS.createdAt])
      : null,
  };
};

export const normaliseMessage = (id, data) => ({
  id,
  text: data[MESSAGE_FIELDS.body],
  senderId: data[MESSAGE_FIELDS.senderId],
  createdAt: toDate(data[MESSAGE_FIELDS.createdAt]),
});

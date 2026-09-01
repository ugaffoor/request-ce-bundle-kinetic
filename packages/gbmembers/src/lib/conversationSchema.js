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
export const conversationId = (memberId, staffId) => `${memberId}_${staffId}`;

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

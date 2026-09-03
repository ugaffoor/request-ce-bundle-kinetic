import { connect } from 'react-redux';
import { compose, withHandlers, withProps, withState } from 'recompose';
import { List } from 'immutable';
import { Inbox } from './Inbox';
import {
  indexMembersById,
  participantName,
  staffParticipantId,
} from 'gbmembers/src/lib/conversationSchema';
import { canUseConversations } from 'gbmembers/src/lib/conversationAccess';
import {
  loadReadMarkers,
  saveReadMarkers,
  isRead,
  withRead,
  withAllRead,
} from '../utils/inboxReadState';

/**
 * Reads the live conversation list the gbmembers conversations saga keeps up
 * to date, so the header reflects messages arriving from the app without a
 * refresh. Conversations are shown newest first.
 */
export const mapStateToProps = state => {
  const conversations =
    state.member && state.member.conversations
      ? state.member.conversations.data
      : List();

  // Conversations carry participant ids, not names. Resolve them against the
  // member roster the app has already loaded, so the inbox reads as people
  // rather than GUIDs. Falls back to the id when a member isn't loaded yet.
  const membersById = indexMembersById(
    state.member && state.member.members ? state.member.members.allMembers : [],
  );

  // Who the signed-in staff member is in Firestore terms, so their own
  // messages can be told apart from a student's.
  const app = state.member ? state.member.app : null;
  const username = app && app.profile ? app.profile.username : null;
  const viewerId =
    username && app && app.spaceSlug
      ? staffParticipantId(app.spaceSlug, username)
      : null;

  return {
    // The whole inbox is hidden from anyone without conversations access,
    // rather than showing an empty dropdown they can never fill.
    permitted: canUseConversations(app ? app.profile : null),
    allMessages: conversations
      .toArray()
      // The inbox is for messages needing a response. A thread whose latest
      // message you sent is waiting on them, not on you -- without this,
      // every reply you send reappears here as unread, because the read
      // marker is tied to the newest message and you just changed it.
      //
      // If the viewer cannot be identified, nothing is filtered: showing an
      // extra thread beats silently hiding a student's message.
      .filter(
        conversation =>
          !viewerId ||
          !conversation.lastMessage ||
          conversation.lastMessage.senderId !== viewerId,
      )
      .slice()
      .sort(
        (a, b) =>
          (b.updatedAt ? b.updatedAt.getTime() : 0) -
          (a.updatedAt ? a.updatedAt.getTime() : 0),
      )
      .map(conversation => ({
        id: conversation.id,
        from: participantName(conversation.otherParticipantId, membersById),
        subject: conversation.lastMessage ? conversation.lastMessage.text : '',
        isAnnouncement: !!conversation.isAnnouncement,
        // Raw milliseconds drive the read marker; the string is for display.
        updatedAtMs: conversation.updatedAt
          ? conversation.updatedAt.getTime()
          : 0,
        createdAt: conversation.updatedAt
          ? conversation.updatedAt.toLocaleString()
          : '',
      })),
  };
};

export const InboxContainer = compose(
  connect(mapStateToProps),
  withState('readMarkers', 'setReadMarkers', () => loadReadMarkers()),
  withProps(({ allMessages, readMarkers }) => ({
    // Read entries leave the inbox entirely -- it is a list of things still
    // needing attention, not an archive. Everything left is unread.
    messages: List(
      allMessages.filter(message => !isRead(readMarkers, message)),
    ),
  })),
  withHandlers({
    markRead: ({ readMarkers, setReadMarkers }) => message => {
      const next = withRead(readMarkers, message);
      saveReadMarkers(next);
      setReadMarkers(next);
    },
    markAllRead: ({ messages, readMarkers, setReadMarkers }) => () => {
      const next = withAllRead(readMarkers, messages.toArray());
      saveReadMarkers(next);
      setReadMarkers(next);
    },
  }),
  withState('isOpen', 'setIsOpen', false),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
)(Inbox);

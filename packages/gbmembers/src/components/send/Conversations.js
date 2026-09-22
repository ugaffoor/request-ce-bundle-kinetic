import React, { Component } from 'react';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import moment from 'moment';
import ReactSpinner from 'react16-spinjs';
import { KappNavLink as NavLink } from 'common';
import { StatusMessagesContainer } from '../StatusMessages';
import { confirm } from '../helpers/Confirmation';
import { actions as conversationActions } from '../../redux/modules/conversations';
import { actions as memberActions } from '../../redux/modules/members';
import { canUseConversations } from '../../lib/conversationAccess';
import { initialiseFirebase } from '../../lib/firebase';
import {
  ensureFirebaseSignIn,
  getSignedInUid,
  identityKey,
  FRANCHISE_DOMAIN,
} from '../../lib/firebaseAuth';
import {
  indexMembersById,
  participantName,
  conversationTitle,
  lastMessageSenderLabel,
  isConversationCleared,
  ANNOUNCEMENT_REMOVED_TEXT,
  DELETED_MESSAGE_TEXT,
  matchesConversationKind,
  needsReply,
  isUnread,
  isTinyChampion,
  billingOwnerIdOf,
  conversationId,
  billingOwnerIds,
  involvesBillingOwner,
  CONVERSATION_KINDS,
  CONVERSATION_KIND_LABELS,
} from '../../lib/conversationSchema';

const mapStateToProps = state => ({
  conversations: state.member.conversations.data,
  loading: state.member.conversations.loading,
  error: state.member.conversations.error,
  messages: state.member.conversations.messages,
  messagesLoading: state.member.conversations.messagesLoading,
  messagesError: state.member.conversations.messagesError,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  profile: state.member.app.profile,
  spaceSlug: state.member.app.spaceSlug,
  space: state.member.app.space,
  sending: state.member.conversations.sending,
  sendError: state.member.conversations.sendError,
  lastSentAt: state.member.conversations.lastSentAt,
  deletingId: state.member.conversations.deletingId,
  deleteError: state.member.conversations.deleteError,
});

const mapDispatchToProps = {
  subscribeConversations: conversationActions.subscribeConversations,
  subscribeMessages: conversationActions.subscribeMessages,
  setConversationsError: conversationActions.setConversationsError,
  sendMessage: conversationActions.sendMessage,
  deleteMessage: conversationActions.deleteMessage,
  markConversationRead: conversationActions.markConversationRead,
  clearConversation: conversationActions.clearConversation,
  deleteConversation: conversationActions.deleteConversation,
  fetchMembers: memberActions.fetchMembers,
};

const when = date => (date ? moment(date).format('D MMM YYYY, h:mm a') : '');

// Inside a thread the day is shown once, as a separator, so each message
// carries only its time.
const timeOf = date => (date ? moment(date).format('h:mm a') : '');

// The calendar day a message belongs to, for deciding where separators go.
const dayKey = date => (date ? moment(date).format('YYYY-MM-DD') : '');

// What a separator says. Recent days by name, older ones by date; the year
// only once it is not this year, since it is noise otherwise.
const dayLabel = date =>
  moment(date).calendar(null, {
    sameDay: '[Today]',
    lastDay: '[Yesterday]',
    lastWeek: 'dddd',
    sameElse: moment(date).isSame(moment(), 'year')
      ? 'dddd, D MMMM'
      : 'D MMMM YYYY',
  });

const routeConversationId = props =>
  (props.match && props.match.params && props.match.params.conversationId) ||
  null;

// The Message button on a member's profile links here with the member rather
// than a thread, because the thread may not exist yet.
const routeMemberId = props =>
  (props.match && props.match.params && props.match.params.memberId) || null;

export class Conversations extends Component {
  constructor(props) {
    super(props);
    // Arriving from a Send tab link opens that thread straight away rather
    // than dropping the user on "select a conversation".
    this.state = {
      selectedId: routeConversationId(props),
      reply: '',
      kind: CONVERSATION_KINDS.ALL,
      search: '',
      // Narrow the list to threads with someone who pays -- for themselves
      // or for others.
      billingOwnersOnly: false,
      // Sends the server rejected. Kept locally because a failed write never
      // reaches Firestore, so the snapshot listener will never return it --
      // without this the message would just vanish on failure.
      failed: [],
      // A 1:1 opened from a member's profile before any message exists. The
      // thread is created on the first send; until then there is nothing in
      // Firestore to listen to, so the page renders the empty thread itself.
      draftMemberId: null,
    };
  }

  /**
   * Resolves the member named in the route to a thread, once the list has
   * loaded and Firebase has signed in -- the thread id depends on the
   * signed-in uid. Opens the existing thread if there is one, otherwise a
   * draft that the first send will turn into a thread. Runs once.
   */
  openRoutedMember() {
    const memberId = routeMemberId(this.props);
    const viewerId = getSignedInUid();
    if (
      !memberId ||
      this.routedMemberOpened ||
      this.props.loading ||
      !viewerId ||
      this.props.allMembers.length === 0
    ) {
      return;
    }
    this.routedMemberOpened = true;

    const member = this.props.allMembers.find(m => m.id === memberId);
    if (!member) {
      return;
    }

    const id = conversationId(member.id, viewerId);
    const existing = this.props.conversations
      .toArray()
      .find(conversation => conversation.id === id);

    if (existing) {
      this.openConversation(id);
    } else {
      this.setState({
        selectedId: id,
        draftMemberId: member.id,
        reply: '',
        failed: [],
      });
    }
  }

  componentDidMount() {
    if (this.state.selectedId) {
      this.props.subscribeMessages({ conversationId: this.state.selectedId });
    }
    this.openRoutedMember();
  }

  /**
   * Brings the end of the thread into view. After paint, because the message
   * that triggered this has only just been added to the DOM.
   */
  scrollToNewest() {
    window.requestAnimationFrame(() => {
      if (this.threadEnd) {
        this.threadEnd.scrollIntoView({ block: 'end' });
      }
    });
  }

  componentDidUpdate(prevProps, prevState) {
    // The list and the roster arrive on their own listeners, at different
    // times; try again whenever either changes until the member is resolved.
    if (
      this.props.loading !== prevProps.loading ||
      this.props.allMembers !== prevProps.allMembers
    ) {
      this.openRoutedMember();
    }

    // The first send into a draft created the thread: the list listener has
    // now returned it, so switch to following it like any other.
    if (this.state.draftMemberId && this.getSelectedConversation()) {
      this.setState({ draftMemberId: null });
      this.props.subscribeMessages({ conversationId: this.state.selectedId });
    }

    // Following a second link while already on this page changes the route
    // param without remounting, so the thread has to be re-opened here.
    const id = routeConversationId(this.props);
    if (id && id !== routeConversationId(prevProps)) {
      this.openConversation(id);
    }

    // The same for a member link -- the "Message <parent>" way out of a Tiny
    // Champion's thread lands on this page again with a different member.
    // The once-only latch is reset so the new member is resolved afresh.
    if (routeMemberId(this.props) !== routeMemberId(prevProps)) {
      this.routedMemberOpened = false;
      this.openRoutedMember();
    }

    // Only once a send has actually landed.
    if (
      this.props.lastSentAt &&
      this.props.lastSentAt !== prevProps.lastSentAt
    ) {
      this.setState({ reply: '' });
    }

    // Keep the newest message in view. Triggered by the thread changing or a
    // message being added -- keyed on the last message's id rather than the
    // array, so a delete or an edit part-way up does not yank the view to
    // the bottom while someone is reading.
    const last = this.props.messages.last();
    const prevLast = prevProps.messages.last();
    if (
      this.state.selectedId !== prevState.selectedId ||
      (last && (!prevLast || last.id !== prevLast.id))
    ) {
      this.scrollToNewest();
    }

    // Showing a thread reads it. Reset the viewer's unread count once the
    // open thread carries one -- on opening, and again whenever a message
    // lands while it is open, since the function bumps the count regardless
    // of who is looking. Keyed on the count changing rather than merely being
    // set, so the reset is written once per arrival and not on every render
    // while it is in flight.
    const selected = this.getSelectedConversation();
    if (selected && isUnread(selected)) {
      const before = prevProps.conversations
        .toArray()
        .find(conversation => conversation.id === selected.id);
      if (
        prevState.selectedId !== selected.id ||
        !before ||
        before.unreadCount !== selected.unreadCount
      ) {
        this.markRead(selected);
      }
    }

    // A send that finished with an error: show the attempt in the thread
    // marked as failed, rather than leaving no trace that it was tried.
    if (prevProps.sending && !this.props.sending && this.props.sendError) {
      const text = this.pendingText;
      this.pendingText = null;
      if (text) {
        this.setState(state => ({
          reply: '',
          failed: state.failed.concat({
            id: `failed-${Date.now()}`,
            text,
            createdAt: new Date(),
          }),
        }));
      }
    }
  }

  /**
   * Tells the server this viewer has seen the thread. Under the viewer's own
   * uid -- the same key the count was incremented under -- so the write
   * lands where the badge reads from.
   */
  markRead(conversation) {
    const viewerId = this.viewerParticipantId();
    if (!viewerId) {
      return;
    }
    this.props.markConversationRead({
      conversationId: conversation.id,
      viewerId,
    });
  }

  openConversation(conversationId) {
    // Drop any half-typed reply when moving to a different thread, so it
    // cannot be sent to the wrong person. Failed sends are cleared too --
    // they belong to the thread that was open when they failed.
    this.setState({
      selectedId: conversationId,
      draftMemberId: null,
      reply: '',
      failed: [],
    });
    this.props.subscribeMessages({ conversationId });
  }

  getSelectedConversation() {
    return this.props.conversations
      .toArray()
      .find(conversation => conversation.id === this.state.selectedId);
  }

  /**
   * The Tiny Champion this thread would message directly, or null.
   *
   * Safeguarding: a Tiny Champion is not put in a private conversation with
   * staff; they are contacted through whoever pays for them. The composer
   * refuses to start one, but a thread can still be reached here -- opened
   * from the child's profile as a draft, or an existing 1:1 from before the
   * rule -- and firestore.rules lets staff through, so this is the only
   * check on the reply path. Only a 1:1 is refused: groups, broadcasts and
   * announcements may include them, the same policy as the composer.
   */
  blockedTinyChampion() {
    const conversation = this.getSelectedConversation();
    const otherId = conversation
      ? !conversation.isGroup &&
        !conversation.isBroadcast &&
        !conversation.isAnnouncement &&
        conversation.otherParticipantId
      : this.state.draftMemberId;
    if (!otherId) {
      return null;
    }
    const member = this.getMembersById()[otherId];
    return isTinyChampion(member) ? member : null;
  }

  sendReply = () => {
    const conversation = this.getSelectedConversation();
    const username = this.props.profile && this.props.profile.username;
    const text = this.state.reply.trim();

    // Repeated from renderComposer, which is what hides the box, so the send
    // path is safe on its own rather than relying on the UI never offering it.
    if (this.blockedTinyChampion()) {
      return;
    }

    // A draft has no thread yet. Leaving conversationId out lets the saga
    // derive the pair id and create the thread document on this first send.
    if (!conversation && this.state.draftMemberId) {
      if (!username || !this.props.spaceSlug || !text) {
        return;
      }
      this.pendingText = text;
      this.props.sendMessage({
        memberId: this.state.draftMemberId,
        staffId: getSignedInUid(),
        spaceSlug: this.props.spaceSlug,
        text,
      });
      return;
    }

    // isBroadcast is also checked in renderComposer, which is what actually
    // hides the box. Repeated here so the send path is safe on its own
    // rather than relying on the UI never offering it.
    if (
      !conversation ||
      conversation.isBroadcast ||
      !username ||
      !this.props.spaceSlug ||
      !text
    ) {
      return;
    }

    // Held so the failure handler can show what was attempted.
    this.pendingText = text;

    this.props.sendMessage({
      // Send into the thread that is actually open. Without this the saga
      // derives an id from the pair, which for a member who has been
      // broadcast to resolves to their broadcast thread instead.
      conversationId: conversation.id,
      // The student side of this thread -- normaliseConversation resolved it
      // by excluding the signed-in staff member.
      memberId: conversation.otherParticipantId,
      // firestore.rules requires senderId == request.auth.uid, so this must
      // be the signed-in uid rather than a derived staff id.
      staffId: getSignedInUid(),
      spaceSlug: this.props.spaceSlug,
      text,
    });
  };

  renderComposer() {
    const conversation = this.getSelectedConversation();
    if (!conversation && !this.state.draftMemberId) {
      return null;
    }

    // A broadcast is one-way by design: the same message sent to several
    // members in separate threads, so no recipient learns who else received
    // it. firestore.rules enforces that -- broadcastWritable() permits a write
    // only from broadcastSender.
    //
    // The recipient does see it as a broadcast: the BJJ Members app hides
    // staffBroadcast threads from Messages (MessagesScreen) and surfaces them
    // as a "New broadcast" notification and in BroadcastInboxScreen instead.
    //
    // Announcements are the other feature and are NOT restricted here: a
    // student can reply to one and staff can answer back.
    if (conversation && conversation.isBroadcast) {
      return (
        <p className="text-muted mt-3">
          <small>
            This is a broadcast &mdash; a one-way message, so it cannot be
            replied to. Start a new conversation to message this person
            directly.
          </small>
        </p>
      );
    }

    const tiny = this.blockedTinyChampion();
    if (tiny) {
      return this.renderTinyChampionNotice(tiny);
    }

    const canSend = !this.props.sending && this.state.reply.trim() !== '';

    return (
      <div className="form-group mt-3">
        <label htmlFor="conversation-reply">Reply</label>
        <textarea
          id="conversation-reply"
          className="form-control"
          rows="3"
          value={this.state.reply}
          disabled={this.props.sending}
          onChange={e => this.setState({ reply: e.target.value })}
        />
        {this.props.sendError && (
          <div className="alert alert-danger mt-2">
            <strong>Message not sent.</strong>
            <div>{this.props.sendError}</div>
          </div>
        )}
        <button
          type="button"
          className="btn btn-primary mt-2"
          disabled={!canSend}
          onClick={this.sendReply}
        >
          {this.props.sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    );
  }

  /**
   * What stands in for the reply box on a Tiny Champion's thread: why it is
   * closed and who to contact instead, with a way there. The same wording
   * as the composer's refusal, so the rule reads the same wherever it is
   * met.
   */
  renderTinyChampionNotice(member) {
    const membersById = this.getMembersById();
    const ownerId = billingOwnerIdOf(member);
    const owner = ownerId ? membersById[ownerId] : null;

    return (
      <div className="alert alert-danger mt-3">
        <strong>Tiny Champions cannot be messaged directly.</strong>
        <div>
          {owner ? (
            <React.Fragment>
              Contact {participantName(ownerId, membersById)}, who pays for
              them, instead.{' '}
              <NavLink
                to={`/MemberConversation/${ownerId}`}
                className="alert-link"
              >
                Message {participantName(ownerId, membersById)}
              </NavLink>
            </React.Fragment>
          ) : (
            // Nothing to link to: the profile has no billing parent recorded.
            'Contact the person who pays for them instead. No billing parent is recorded on their profile.'
          )}
        </div>
      </div>
    );
  }

  getMembersById() {
    return indexMembersById(this.props.allMembers);
  }

  selectConversation = conversation => {
    this.openConversation(conversation.id);
  };

  /**
   * This staff member's own participant id, for telling their own messages
   * apart from a student's.
   *
   * The uid Firebase signed us in as -- the same value the send path writes
   * as senderId, so the two are comparable by construction. Deriving it from
   * space + username instead only matched staff with no member record of
   * their own; for everyone else nothing was ever recognised as theirs.
   */
  viewerParticipantId() {
    return getSignedInUid();
  }

  renderList(membersById) {
    const { conversations, loading, error } = this.props;

    if (loading) {
      return <ReactSpinner />;
    }

    if (error) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load conversations.</strong>
          <div>{error}</div>
        </div>
      );
    }

    if (conversations.size < 1) {
      return <p>No conversations yet.</p>;
    }

    const sorted = conversations
      .toArray()
      // Threads this viewer removed stay hidden until something newer
      // arrives, matching how the app treats them.
      .filter(conversation => !isConversationCleared(conversation))
      .filter(conversation =>
        matchesConversationKind(
          conversation,
          this.state.kind,
          getSignedInUid(),
        ),
      )
      .filter(conversation => this.matchesSearch(conversation, membersById))
      .filter(
        conversation =>
          !this.state.billingOwnersOnly ||
          involvesBillingOwner(
            conversation,
            billingOwnerIds(this.props.allMembers),
            getSignedInUid(),
          ),
      )
      .sort(
        (a, b) =>
          (b.updatedAt ? b.updatedAt.getTime() : 0) -
          (a.updatedAt ? a.updatedAt.getTime() : 0),
      );

    if (sorted.length < 1) {
      return (
        <React.Fragment>
          {this.renderKindFilter()}
          {this.renderSearch()}
          <p>
            {this.state.search.trim()
              ? `No conversations match "${this.state.search.trim()}".`
              : this.state.billingOwnersOnly
                ? 'No conversations with billing owners.'
                : 'Nothing matches this filter.'}
          </p>
        </React.Fragment>
      );
    }

    const viewerId = this.viewerParticipantId();

    return (
      <React.Fragment>
        {this.renderKindFilter()}
        {this.renderSearch()}
        <ul className="list-group">
          {sorted.map(conversation => {
            // Groups are named after the group, so the sender of the latest
            // message would otherwise be invisible in this list.
            const senderLabel = lastMessageSenderLabel(
              conversation,
              membersById,
              viewerId,
            );

            return (
              <li
                key={conversation.id}
                // Bold is the unread mark, as in a mail list: it lifts once
                // the thread is opened. "Needs reply" stays on until the
                // viewer answers, so the two say different things.
                className={
                  'list-group-item' +
                  (conversation.id === this.state.selectedId ? ' active' : '') +
                  (isUnread(conversation) ? ' font-weight-bold' : '')
                }
                role="button"
                tabIndex="0"
                onClick={() => this.selectConversation(conversation)}
                onKeyPress={() => this.selectConversation(conversation)}
              >
                {isUnread(conversation) && (
                  <span
                    className="badge badge-primary badge-pill float-right"
                    title={`${conversation.unreadCount} unread`}
                  >
                    {conversation.unreadCount}
                  </span>
                )}
                {conversation.lastMessage && (
                  <div>
                    {senderLabel && <strong>{senderLabel}: </strong>}
                    {conversation.lastMessage.text}
                    {needsReply(conversation, getSignedInUid()) && (
                      <span className="badge badge-danger ml-2">
                        Needs reply
                      </span>
                    )}
                  </div>
                )}
                <div>
                  <small>
                    {conversationTitle(conversation, membersById)}
                    {conversation.isGroup && (
                      <span className="badge badge-secondary ml-2">
                        Group · {(conversation.participantIds || []).length}
                      </span>
                    )}
                    {conversation.isBroadcast && (
                      <span className="badge badge-warning ml-2">
                        Broadcast
                      </span>
                    )}
                    {conversation.isAnnouncement && (
                      <span className="badge badge-info ml-2">
                        Announcement
                      </span>
                    )}
                  </small>
                </div>
                <small className="text-muted">
                  {when(conversation.updatedAt)}
                </small>
              </li>
            );
          })}
        </ul>
      </React.Fragment>
    );
  }

  /**
   * Whether a thread matches the search box.
   *
   * Matches the name the row actually shows, so what you type lines up with
   * what you can see. For a group it also matches any participant, since a
   * group is titled by its own name -- searching a student should still find
   * the group they are in rather than appearing to lose them.
   */
  matchesSearch(conversation, membersById) {
    const query = this.state.search.trim().toLowerCase();
    if (!query) {
      return true;
    }

    if (
      conversationTitle(conversation, membersById)
        .toLowerCase()
        .includes(query)
    ) {
      return true;
    }

    return (conversation.participantIds || []).some(participantId =>
      participantName(participantId, membersById)
        .toLowerCase()
        .includes(query),
    );
  }

  renderSearch() {
    return (
      <div className="form-group">
        <label className="sr-only" htmlFor="conversation-search">
          Search conversations by name
        </label>
        <input
          id="conversation-search"
          type="search"
          className="form-control"
          placeholder="Search by name"
          value={this.state.search}
          onChange={e => this.setState({ search: e.target.value })}
        />
        <div className="form-check mt-2">
          <input
            id="conversation-billing-owners"
            type="checkbox"
            className="form-check-input"
            checked={this.state.billingOwnersOnly}
            onChange={e =>
              this.setState({ billingOwnersOnly: e.target.checked })
            }
          />
          <label
            className="form-check-label"
            htmlFor="conversation-billing-owners"
          >
            Billing owners only
          </label>
        </div>
      </div>
    );
  }

  renderKindFilter() {
    return (
      <ul className="nav nav-tabs mb-2" role="tablist">
        {Object.keys(CONVERSATION_KIND_LABELS).map(kind => (
          <li className="nav-item" key={kind}>
            <button
              type="button"
              role="tab"
              aria-selected={this.state.kind === kind}
              className={
                'nav-link btn btn-link' +
                (this.state.kind === kind ? ' active' : '')
              }
              onClick={() => this.setState({ kind })}
            >
              {CONVERSATION_KIND_LABELS[kind]}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  /**
   * A group's name and its participants, above the messages, so it is clear
   * who can see the thread. Nothing for a 1:1 -- the list already names the
   * one other person.
   */
  renderGroupHeader(membersById) {
    const conversation = this.getSelectedConversation();
    if (!conversation || !conversation.isGroup) {
      return null;
    }

    const participantIds = conversation.participantIds || [];

    return (
      <div className="mb-3">
        <h5 className="mb-1">{conversationTitle(conversation, membersById)}</h5>
        <div className="mb-1">
          <small className="text-muted">
            {participantIds.length}{' '}
            {participantIds.length === 1 ? 'participant' : 'participants'}
          </small>
        </div>
        <ul className="list-inline mb-0">
          {participantIds.map(participantId => (
            <li key={participantId} className="list-inline-item">
              <span className="badge badge-light">
                {participantName(participantId, membersById)}
              </span>
            </li>
          ))}
        </ul>
        <hr />
      </div>
    );
  }

  /**
   * Withdrawing applies to announcements and broadcasts only: those are
   * published outward, and a mistake in one is worth taking back. An ordinary
   * chat message is half of a two-way conversation the student has already
   * read and may have answered -- removing it would leave a gap in something
   * they can still see.
   */
  canRemove(conversation, message) {
    if (!conversation || !message || message.deleted) {
      return false;
    }
    // Only your own messages. The rules decide this too, but offering a
    // control that always fails is worse than not offering it.
    return message.senderId === getSignedInUid();
  }

  /**
   * Sits above the thread rather than in the group header, which only renders
   * for groups -- a 1:1 chat needs removing just as much.
   */
  renderThreadActions() {
    // A draft is not on anyone's list yet, so there is nothing to remove.
    const conversation = this.getSelectedConversation();
    if (!conversation) {
      return null;
    }
    const busy = this.props.deletingId === conversation.id;
    return (
      <div className="text-right mb-2">
        <button
          type="button"
          className="btn btn-link btn-sm p-0"
          onClick={this.removeConversation}
        >
          <small>Remove from my list</small>
        </button>
        {/*
          The school's announcement thread is managed from the Announcements
          page, where withdrawing a post also cleans up its deliveries.
        */}
        {!conversation.isAnnouncementThread && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0 ml-3 text-danger"
            disabled={busy}
            onClick={this.deleteConversationForEveryone}
          >
            <small>{busy ? 'Deleting...' : 'Delete for everyone'}</small>
          </button>
        )}
      </div>
    );
  }

  /**
   * Clean-up: the whole thread, messages and all, gone from every
   * participant's list in both GB Members and the BJJ Members app. Unlike
   * deleting a message this leaves no tombstone -- it is for removing
   * threads that should not exist, not for editing history.
   */
  deleteConversationForEveryone = async () => {
    const conversation = this.getSelectedConversation();
    if (!conversation) {
      return;
    }

    const confirmed = await confirm(
      <span>
        <span>
          This deletes the <strong>entire conversation</strong> and every
          message in it, for everyone in it &mdash; in GB Members and in the BJJ
          Members app. Nothing is left behind, and it cannot be undone.
        </span>
      </span>,
      'Delete for everyone',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.deleteConversation({ conversationId: conversation.id });

    // On a member's profile thread, fall back to the empty draft so a new
    // conversation can be started; on the full page, just deselect.
    const memberId = routeMemberId(this.props);
    this.setState({
      selectedId: memberId ? conversation.id : null,
      draftMemberId: memberId ? memberId : null,
      reply: '',
      failed: [],
    });
  };

  removeConversation = async () => {
    const conversation = this.getSelectedConversation();
    const viewerId = getSignedInUid();
    if (!conversation || !viewerId) {
      return;
    }

    const confirmed = await confirm(
      <span>
        <span>
          This removes the thread from <strong>your</strong> list only &mdash;
          the other person keeps it and sees no change. It comes back if they
          send something new.
        </span>
      </span>,
      'Remove from my list',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.clearConversation({
      conversationId: conversation.id,
      viewerId,
    });
    this.setState({ selectedId: null, reply: '', failed: [] });
  };

  removeMessage = async message => {
    const conversation = this.getSelectedConversation();
    // Only the school's OWN thread may be hard-deleted -- that is what
    // triggers the fan-out cleanup. A delivered copy is not
    // `announcement: true`, so the same delete is refused; it gets a
    // tombstone like any other message.
    const announcement = !!(conversation && conversation.isAnnouncementThread);

    const confirmed = await confirm(
      <span>
        <span>
          {announcement
            ? 'This announcement will be withdrawn from everyone who received it.'
            : `This replaces it with “${DELETED_MESSAGE_TEXT}” for everyone in the chat. If they have already read it, or seen the notification, you cannot undo that.`}
        </span>
      </span>,
      announcement ? 'Withdraw announcement' : 'Delete for everyone',
      'Cancel',
    );
    if (!confirmed) {
      return;
    }

    this.props.deleteMessage({
      conversationId: this.state.selectedId,
      messageId: message.id,
      // Announcements are deleted outright so the fan-out copies go too;
      // everything else leaves a tombstone.
      announcement,
    });
  };

  /**
   * The empty thread for a member who has not been messaged yet. Nothing is
   * in Firestore to listen to, so this stands in until the first send.
   */
  renderDraftThread(membersById) {
    return (
      <React.Fragment>
        <h5 className="mb-3">
          {participantName(this.state.draftMemberId, membersById)}
        </h5>
        <p className="text-muted">
          No messages yet.
          {/* Not promised when the box below is closed to them. */}
          {!this.blockedTinyChampion() &&
            ' Anything you send here starts a private conversation with them.'}
        </p>
        <ul className="list-unstyled conversation-thread">
          {this.renderFailedSends(null)}
        </ul>
      </React.Fragment>
    );
  }

  /**
   * Sends the server rejected, shown after the delivered messages so the
   * attempt is visible rather than silently lost.
   */
  renderFailedSends(lastDeliveredDay) {
    if (this.state.failed.length < 1) {
      return null;
    }
    // Failures are always from now, so they sit under Today. The separator
    // is only needed when the last delivered message was on an earlier day.
    const today = dayKey(new Date());
    const needsSeparator =
      lastDeliveredDay !== undefined && lastDeliveredDay !== today;

    // A failed send is always the viewer's own, so it belongs on their side
    // of the thread -- rendered on the left it would read as a message from
    // the other person that happened to fail.
    return [
      needsSeparator && (
        <li key="failed-day" className="message-day" aria-hidden="true">
          <span>{dayLabel(new Date())}</span>
        </li>
      ),
      ...this.state.failed.map(failure => (
        <li key={failure.id} className="message message--mine">
          <div className="message__sender">
            <small>
              <strong>You</strong>
            </small>
          </div>
          <div className="message__bubble text-muted">{failure.text}</div>
          <div className="message__meta">
            <small>
              <span className="text-muted">{timeOf(failure.createdAt)}</span>
            </small>
            <div>
              <small className="text-danger">Message failed to send</small>
            </div>
          </div>
        </li>
      )),
    ];
  }

  renderThread(membersById) {
    const { messages, messagesLoading, messagesError } = this.props;

    if (!this.state.selectedId) {
      return <p>Select a conversation to read it.</p>;
    }

    if (this.state.draftMemberId && !this.getSelectedConversation()) {
      return this.renderDraftThread(membersById);
    }

    if (messagesLoading) {
      return <ReactSpinner />;
    }

    if (messagesError) {
      return (
        <div className="alert alert-danger">
          <strong>Could not load messages.</strong>
          <div>{messagesError}</div>
        </div>
      );
    }

    if (messages.size < 1 && this.state.failed.length < 1) {
      return (
        <React.Fragment>
          {this.renderGroupHeader(membersById)}
          <p>No messages in this conversation.</p>
        </React.Fragment>
      );
    }

    const selectedConversation = this.getSelectedConversation();
    const viewerId = this.viewerParticipantId();
    // The most recent day with a separator above it, threaded through the map.
    let lastDay = '';
    // Who sent the previous message, so a run from one person is named once.
    let lastSender = null;

    return (
      <React.Fragment>
        {this.renderGroupHeader(membersById)}
        {this.props.deleteError && (
          <div className="alert alert-danger">
            <strong>Could not remove that.</strong>
            <div>{this.props.deleteError}</div>
          </div>
        )}
        <ul className="list-unstyled conversation-thread">
          {messages.toArray().map(message => {
            // Whose message this is. Everything below keys off it: which side
            // the bubble sits on, its colour, and whether the name is worth
            // showing at all.
            const mine = !!viewerId && message.senderId === viewerId;

            // A separator wherever the calendar day changes, so the date is
            // read once per day rather than on every message. Compared with
            // the last DATED message, not simply the previous one: a message
            // just sent has no timestamp until the server stamps it, and
            // treating that gap as a day change put a second "Today" under
            // every fresh send.
            const day = dayKey(message.createdAt);
            const newDay = !!day && day !== lastDay;
            if (day) {
              lastDay = day;
            }

            // Several messages in a row from the same person read as one
            // turn: the name goes on the first and the rest tuck up under it.
            // A new day always restarts the run, since the separator between
            // them has already broken the visual link.
            const continued = !newDay && message.senderId === lastSender;
            lastSender = message.senderId;

            return (
              <React.Fragment key={message.id}>
                {newDay &&
                  message.createdAt && (
                    <li className="message-day" aria-hidden="true">
                      <span>{dayLabel(message.createdAt)}</span>
                    </li>
                  )}
                <li
                  className={`message ${
                    mine ? 'message--mine' : 'message--theirs'
                  }${continued ? ' message--continued' : ''}`}
                >
                  {/* Who is speaking, read before what they said. Once per
                      run: the messages beneath are the same person's. */}
                  {!continued && (
                    <div className="message__sender">
                      <small>
                        <strong>
                          {mine
                            ? 'You'
                            : participantName(message.senderId, membersById)}
                        </strong>
                      </small>
                    </div>
                  )}
                  <div className="message__bubble">
                    {message.deleted ? (
                      <em className="text-muted">
                        {message.announcementRemoved
                          ? ANNOUNCEMENT_REMOVED_TEXT
                          : DELETED_MESSAGE_TEXT}
                      </em>
                    ) : (
                      message.text
                    )}
                  </div>
                  <div className="message__meta">
                    <small>
                      <span className="text-muted">
                        {timeOf(message.createdAt)}
                      </span>
                    </small>
                    {this.canRemove(selectedConversation, message) && (
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 ml-2"
                        disabled={this.props.deletingId === message.id}
                        onClick={() => this.removeMessage(message)}
                      >
                        <small>
                          {this.props.deletingId === message.id
                            ? 'Deleting...'
                            : 'Delete for everyone'}
                        </small>
                      </button>
                    )}
                  </div>
                </li>
              </React.Fragment>
            );
          })}

          {this.renderFailedSends(
            messages.size > 0 ? dayKey(messages.last().createdAt) : null,
          )}
          <li ref={element => (this.threadEnd = element)} aria-hidden="true" />
        </ul>
      </React.Fragment>
    );
  }

  renderNoAccess() {
    return (
      <div className="container-fluid leads">
        <div className="leadContents">
          <div className="options">
            <h4 className="title">Conversations</h4>
            <p>
              You do not have access to conversations. Ask a space admin to add
              you to the Program Managers role.
            </p>
          </div>
        </div>
      </div>
    );
  }

  render() {
    // Routes are reachable by URL, so the page guards itself rather than
    // relying on the Send tab having hidden the link.
    if (!canUseConversations(this.props.profile)) {
      return this.renderNoAccess();
    }

    const membersById = this.getMembersById();

    if (routeMemberId(this.props)) {
      return this.renderMemberThread(membersById);
    }

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">Conversations</h4>
            <div className="row">
              <div className="col-md-4">{this.renderList(membersById)}</div>
              <div className="col-md-8">
                {this.state.selectedId && this.renderThreadActions()}
                {this.renderThread(membersById)}
                {this.state.selectedId && this.renderComposer()}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /**
   * The page as reached from a member's profile: just the thread with that
   * one person, without the list of everyone else. The list normally shows
   * load errors and the spinner, so those are rendered here instead.
   */
  renderMemberThread(membersById) {
    const memberId = routeMemberId(this.props);
    const { loading, error } = this.props;

    const conversation = this.getSelectedConversation();
    const withId =
      this.state.draftMemberId ||
      (conversation && conversation.otherParticipantId) ||
      null;

    return (
      <div className="container-fluid leads">
        <StatusMessagesContainer />
        <div className="leadContents">
          <div className="options">
            <h4 className="title">
              {withId ? participantName(withId, membersById) : 'Conversation'}
              <span className="pull-right">
                <NavLink to={`/Member/${memberId}`} className="btn btn-link">
                  Back to profile
                </NavLink>
                <NavLink to="/Conversations" className="btn btn-link">
                  All conversations
                </NavLink>
              </span>
            </h4>
            {error && (
              <div className="alert alert-danger">
                <strong>Could not load the conversation.</strong>
                <div>{error}</div>
              </div>
            )}
            {loading && !error ? (
              <ReactSpinner />
            ) : (
              this.state.selectedId && (
                <React.Fragment>
                  {this.renderThreadActions()}
                  {this.renderThread(membersById)}
                  {this.renderComposer()}
                </React.Fragment>
              )
            )}
          </div>
        </div>
      </div>
    );
  }
}

export const ConversationsContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      if (this.props.allMembers.length === 0 && !this.props.membersLoading) {
        this.props.fetchMembers({ memberInitialLoadComplete: false });
      }

      // Every path out of here has to settle `loading`, which starts true:
      // returning quietly leaves the list spinning forever with nothing on
      // screen to say why.
      const app = initialiseFirebase(this.props.space);
      if (!app) {
        this.props.setConversationsError(
          'Firebase is not configured for this space.',
        );
        return;
      }

      const username = this.props.profile && this.props.profile.username;
      if (!username || !this.props.spaceSlug) {
        this.props.setConversationsError(
          'Could not determine the signed-in user or space.',
        );
        return;
      }

      // Firestore gates every read on request.auth, so the listener can only
      // attach once the Firebase sign-in started at login has completed.
      // Subscribing before that just earns a permission-denied, which reads
      // as an empty inbox rather than as the auth problem it is.
      ensureFirebaseSignIn(app, identityKey(this.props.spaceSlug, username))
        .then(uid => {
          if (!uid) {
            this.props.setConversationsError(
              'Not signed in to Firebase — sign out and sign in again to load conversations.',
            );
            return;
          }

          // Query on the uid Firebase actually signed us in as, NOT a
          // derived staff_{space}_{user} string. mintFirebaseToken keys staff
          // WITH a member record to their member GUID, and only staff without
          // one to the staff_ composite -- so deriving it is wrong for anyone
          // who has a member record. The rules compare against
          // request.auth.uid, so filtering on anything else returns documents
          // the rule then refuses, surfacing as permission-denied.
          // spaceSlug and domain let the saga also follow the school's
          // announcement thread, which no participant query can return.
          this.props.subscribeConversations({
            participantId: uid,
            spaceSlug: this.props.spaceSlug,
            domain: FRANCHISE_DOMAIN,
          });
        })
        .catch(e => {
          this.props.setConversationsError(
            `Firebase sign-in failed: ${e && e.message ? e.message : e}`,
          );
        });
    },
  }),
)(Conversations);

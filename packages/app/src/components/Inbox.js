import React from 'react';
import { KappLink as Link } from 'common';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '@kineticdata/react';

/**
 * Header inbox dropdown. Shows conversations that still need attention,
 * newest first, with a badge for the count. The list is fed by the live
 * snapshot listener in the gbmembers conversations saga, so it updates
 * without a refresh when a student sends a message.
 *
 * Everything listed is unread -- marking an entry read removes it. A later
 * message from the same person brings the conversation back, because the
 * read marker is tied to the message it was set against.
 */
export const Inbox = ({ messages, isOpen, toggle, markRead, markAllRead }) => (
  <Dropdown isOpen={isOpen} toggle={toggle}>
    <DropdownToggle nav role="button">
      <i className="fa fa-fw fa-inbox" />
      {messages.size > 0 && (
        <span className="badge badge-secondary">{messages.size}</span>
      )}
    </DropdownToggle>
    <DropdownMenu right className="inbox-menu">
      <div className="messages-header">
        <span className="title">
          <I18n>Messages</I18n>
        </span>
        <div className="actions">
          {messages.size > 0 && (
            <React.Fragment>
              <button
                type="button"
                className="link-action"
                onClick={markAllRead}
              >
                <I18n>Mark all read</I18n>
              </button>
              <span className="divider">&bull;</span>
            </React.Fragment>
          )}
          <Link to="/Conversations" onClick={toggle}>
            <I18n>View All</I18n>
          </Link>
        </div>
      </div>
      <ul className="messages-list">
        {messages.map(message => (
          <li key={message.id} className="message-item unread">
            <h1>
              <small className="source">{message.from}</small>
              <I18n>{message.subject}</I18n>
            </h1>
            <div className="message-footer">
              <span className="meta">{message.createdAt}</span>
              <button
                type="button"
                className="link-action mark-read"
                onClick={() => markRead(message)}
              >
                <I18n>Mark as read</I18n>
              </button>
            </div>
          </li>
        ))}
        {messages.size < 1 && (
          <h6 className="empty-messages">
            <I18n>You have no messages.</I18n>
          </h6>
        )}
      </ul>
    </DropdownMenu>
  </Dropdown>
);

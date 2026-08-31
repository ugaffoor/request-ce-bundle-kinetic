import React from 'react';
import { KappLink as Link } from 'common';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '@kineticdata/react';

/**
 * Header inbox dropdown. Shows the most recent conversations from the shared
 * Firestore store, newest first, with a badge for the count. The list is fed
 * by the live snapshot listener in the gbmembers conversations saga, so it
 * updates without a refresh when a student sends a message.
 */
export const Inbox = ({ messages, isOpen, toggle }) => (
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
          <Link to="/Conversations" onClick={toggle}>
            <I18n>View All</I18n>
          </Link>
        </div>
      </div>
      <ul className="messages-list">
        {messages.map(message => (
          <li key={message.id} className="message-item">
            <h1>
              <small className="source">{message.from}</small>
              <I18n>{message.subject}</I18n>
            </h1>
            <span className="meta">{message.createdAt}</span>
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

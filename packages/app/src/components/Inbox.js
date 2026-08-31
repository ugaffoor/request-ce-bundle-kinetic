import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '@kineticdata/react';

/**
 * Header inbox dropdown.
 *
 * The message shape below is a placeholder. When a real message source is
 * wired up, replace the fields referenced in the list with the actual
 * submission values and swap `withProps` for `connect` in InboxContainer.
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
      </div>
      <ul className="messages-list">
        {messages.map(message => (
          <li key={message.id} className="message-item">
            <h1>
              <small className="source">{message.from}</small>
              <I18n>{message.subject}</I18n>
            </h1>
            <p>{message.body}</p>
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

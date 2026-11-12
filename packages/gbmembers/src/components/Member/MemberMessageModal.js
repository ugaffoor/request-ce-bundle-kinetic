import React from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { ConversationsContainer } from '../send/Conversations';
import { inlineStyle } from './SMSModalContainer';

/**
 * The member's conversation, opened over their profile from the Message
 * button -- the same frame and close control as Send SMS, laid out like the
 * Messages page.
 *
 * The thread inside is the Conversations page itself, embedded: sending,
 * the pending bubble, the Tiny Champion safeguard and read marking all
 * behave exactly as they do on the full page, because they are the same
 * code.
 */
export const MemberMessageModal = ({ memberItem, onClose }) => (
  <div>
    <ModalContainer zIndex={1030}>
      <ModalDialog
        onClose={onClose}
        style={inlineStyle}
        dismissOnBackgroundClick={false}
        className="smsDialog conversationDialog"
      >
        {/* Laid out like the Messages page: the member's name in the dark
            tab, the chat below it on the grey band. */}
        <div className="conversationsPage conversationsPopup">
          <div className="conversationsHeader">
            <h4 className="title">
              {memberItem.values['First Name']} {memberItem.values['Last Name']}
            </h4>
          </div>
          <ConversationsContainer memberId={memberItem.id} embedded />
        </div>
      </ModalDialog>
    </ModalContainer>
  </div>
);

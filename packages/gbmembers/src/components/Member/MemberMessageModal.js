import React from 'react';
import { ModalContainer, ModalDialog } from 'react-modal-dialog-react16';
import { ConversationsContainer } from '../send/Conversations';
import { inlineStyle } from './SMSModalContainer';

/**
 * The member's conversation, opened over their profile from the Message
 * button -- the same frame, heading and close control as Send SMS, so the
 * two ways of reaching someone feel like one feature.
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
        <div className="row">
          <div className="col-md-12" style={{ textAlign: 'center' }}>
            Member - {memberItem.values['First Name']}{' '}
            {memberItem.values['Last Name']}
          </div>
        </div>
        <ConversationsContainer memberId={memberItem.id} embedded />
      </ModalDialog>
    </ModalContainer>
  </div>
);

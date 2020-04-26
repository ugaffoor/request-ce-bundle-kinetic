import React from 'react';
import { Modal, ModalBody } from 'reactstrap';
import { connect } from 'react-redux';

import { actions } from '../../../redux/modules/settingsForms';

import { Export } from './Export';
import { I18n } from '../../../../../app/src/I18nProvider';

const ExportModalComponent = ({
  modalIsOpen,
  closeModal,
  modalName,
  filter,
  createSearchQuery,
}) => (
  <Modal isOpen={modalIsOpen} toggle={closeModal}>
    <div className="modal-header">
      <h4 className="modal-title">
        <button onClick={closeModal} type="button" className="btn btn-link">
          <I18n>Cancel</I18n>
        </button>
        <span>
          <I18n>{modalName === 'import' ? 'Import' : 'Export'} Records</I18n>
        </span>
        <span>&nbsp;</span>
      </h4>
    </div>
    <ModalBody>
      <div style={{ padding: '1rem' }}>
        <Export filter={filter} createSearchQuery={createSearchQuery} />
      </div>
    </ModalBody>
  </Modal>
);

const mapStateToProps = state => ({
  modalIsOpen: state.queue.settingsForms.modalIsOpen,
  modalName: state.queue.settingsForms.modalName,
});

const mapDispatchToProps = {
  closeModal: actions.closeModal,
};

export const ExportModal = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ExportModalComponent);

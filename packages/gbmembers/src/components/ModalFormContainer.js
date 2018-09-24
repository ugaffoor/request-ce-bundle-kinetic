import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { ModalForm } from './ModalForm';
import { actions as modalFormActions } from '../redux/modules/modalForm';

export const mapStateToProps = state => ({
  form: state.modalForm.form,
  isCompleted: state.modalForm.isCompleted,
});

const mapDispatchToProps = {
  closeForm: modalFormActions.closeForm,
  completeForm: modalFormActions.completeForm,
};

export const ModalFormContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withHandlers({
    handleCompleted: props => (submission, actions) => {
      actions.stop();
      props.completeForm();
    },
    handleClosed: props => event => {
      if (event) event.stopPropagation();
      props.closeForm();
    },
  }),
)(ModalForm);

import { connect } from 'react-redux';
import { compose, withHandlers } from 'recompose';
import { ModalForm } from './ModalForm';
import { actions } from '../../redux/kinopsModule';

export const mapStateToProps = state => ({
  form: state.member.kinops.getIn(['modal', 'form']),
  isCompleted: state.member.kinops.getIn(['modal', 'isCompleted']),
});

const mapDispatchToProps = {
  closeForm: actions.closeForm,
  completeForm: actions.completeForm,
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

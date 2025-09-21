import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { actions } from '../../redux/modules/errors';

import { SystemError } from './SystemError';

export const mapStateToProps = ({ errors }) => ({
  status: errors !== undefined ? errors.system.status : 'Network',
  statusText:
    errors !== undefined
      ? errors.system.statusText
      : 'A network issue has occured',
});
export const mapDispatchToProps = actions;

export const SystemErrorContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentWillUnmount() {
      this.props.clearSystemError();
    },
  }),
)(SystemError);

import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { actions } from '../../redux/modules/registration';
import { RequestShow } from './RequestShow';

export const mapStateToProps = (state, props) => ({
  submission: state.registrations.registration.data,
  listType: props.match.params.type,
  mode: props.match.params.mode,
});

export const mapDispatchToProps = {
  clearRegistration: actions.clearRegistration,
  fetchRegistration: actions.fetchRegistration,
  startPoller: actions.startRegistrationPoller,
  stopPoller: actions.stopRegistrationPoller,
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    componentWillMount() {
      this.props.fetchRegistration(this.props.match.params.submissionId);
      this.props.startPoller(this.props.match.params.submissionId);
    },
    componentWillUnmount() {
      this.props.clearRegistration();
      this.props.stopPoller();
    },
  }),
);

export const RequestShowContainer = enhance(RequestShow);

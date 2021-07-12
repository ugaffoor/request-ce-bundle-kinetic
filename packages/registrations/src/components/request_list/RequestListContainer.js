import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { RequestList } from './RequestList';
import * as constants from '../../constants';
import { actions as registrationsActions } from '../../redux/modules/registrations';
import { actions as registrationCountActions } from '../../redux/modules/registrationCounts';

const mapStateToProps = (state, props) => ({
  submissions: state.registrations.registrations.data,
  hasNextPage: !!state.registrations.registrations.next,
  hasPreviousPage: !state.registrations.registrations.previous.isEmpty(),
  counts: state.registrations.registrationCounts.data,
  type: props.match.params.type,
});

const mapDispatchToProps = {
  fetchRegistrations: registrationsActions.fetchRegistrations,
  fetchNextPage: registrationsActions.fetchNextPage,
  fetchPreviousPage: registrationsActions.fetchPreviousPage,
  fetchCurrentPage: registrationsActions.fetchCurrentPage,
  fetchRegistrationCounts: registrationCountActions.fetchRegistrationCounts,
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(props => ({
    coreState:
      props.type === 'Open' ? constants.CORE_STATE_SUBMITTED : props.type,
  })),
  withHandlers({
    handleNextPage: props => () => props.fetchNextPage(props.coreState),
    handlePreviousPage: props => () => props.fetchPreviousPage(props.coreState),
    refreshPage: props => () => props.fetchCurrentPage(props.coreState),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchRegistrations(this.props.coreState);
    },
    UNSAFE_componentWillUpdate(nextProps) {
      if (this.props.coreState !== nextProps.coreState) {
        this.props.fetchRegistrations(nextProps.coreState);
        this.props.fetchRegistrationCounts();
      }
    },
  }),
);

export const RequestListContainer = enhance(RequestList);

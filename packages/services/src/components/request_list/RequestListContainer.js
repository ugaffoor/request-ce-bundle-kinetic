import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withProps } from 'recompose';
import { RequestList } from './RequestList';
import * as constants from '../../constants';
import { actions as submissionsActions } from '../../redux/modules/submissions';
import { actions as submissionCountActions } from '../../redux/modules/submissionCounts';

const mapStateToProps = (state, props) => ({
  submissions: state.services.submissions.data,
  hasNextPage: !!state.services.submissions.next,
  hasPreviousPage: !state.services.submissions.previous.isEmpty(),
  counts: state.services.submissionCounts.data,
  type: props.match.params.type,
  profile: state.app.profile,
});

const mapDispatchToProps = {
  fetchSubmissions: submissionsActions.fetchSubmissions,
  fetchNextPage: submissionsActions.fetchNextPage,
  fetchPreviousPage: submissionsActions.fetchPreviousPage,
  fetchCurrentPage: submissionsActions.fetchCurrentPage,
  fetchSubmissionCounts: submissionCountActions.fetchSubmissionCounts,
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
    searchByName: props => name =>
      props.fetchSubmissions({
        name: name,
        coreState: props.coreState,
      }),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchSubmissions({ coreState: this.props.coreState });
    },
    UNSAFE_componentWillUpdate(nextProps) {
      if (this.props.coreState !== nextProps.coreState) {
        this.props.fetchSubmissions({ coreState: nextProps.coreState });
        this.props.fetchSubmissionCounts();
      }
    },
  }),
);

export const RequestListContainer = enhance(RequestList);

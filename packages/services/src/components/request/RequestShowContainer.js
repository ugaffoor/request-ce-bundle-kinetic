import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { actions } from '../../redux/modules/submission';
import { RequestShow } from './RequestShow';

export const mapStateToProps = (state, props) => ({
  submission: state.services.submission.data,
  listType: props.match.params.type,
  mode: props.match.params.mode,
  profile: state.member.kinops.profile,
  space: state.member.app.space,
});

export const mapDispatchToProps = {
  clearSubmission: actions.clearSubmission,
  fetchSubmission: actions.fetchSubmission,
  startPoller: actions.startSubmissionPoller,
  stopPoller: actions.stopSubmissionPoller,
};

const enhance = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchSubmission(this.props.match.params.submissionId);
      this.props.startPoller(this.props.match.params.submissionId);
    },
    componentWillUnmount() {
      this.props.clearSubmission();
      this.props.stopPoller();
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (
        nextProps.match.params.submissionId !==
        this.props.match.params.submissionId
      ) {
        this.props.clearSubmission();
        this.props.stopPoller();
        this.props.fetchSubmission(nextProps.match.params.submissionId);
        this.props.startPoller(nextProps.match.params.submissionId);
      }
    },
  }),
);

export const RequestShowContainer = enhance(RequestShow);

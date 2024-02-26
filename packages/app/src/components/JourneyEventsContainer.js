import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { List } from 'immutable';
import moment from 'moment';
import { JourneyEvents } from './JourneyEvents';
import { actions } from '../redux/modules/journeyevents';
import $ from 'jquery';

export const mapStateToProps = state => ({
  journeyevents: List(state.app.journeyevents.get('data'))
    .filter(
      journeyevent =>
        !journeyevent.values['End Date Time'] ||
        moment(journeyevent.values['End Date Time']).isAfter(),
    )
    .filter(
      journeyevent =>
        !journeyevent.values['Start Date Time'] ||
        moment(journeyevent.values['Start Date Time']).isBefore(),
    )
    .sortBy(journeyevent =>
      moment(
        journeyevent.values['Start Date Time'] || alert.journeyevent,
      ).unix(),
    )
    .reverse(),
  isSpaceAdmin: state.app.profile.spaceAdmin,
  deletingJourneyEvents: state.app.journeyevents.get('deletingJourneyEvents'),
  deletingJourneyEventsCount: state.app.journeyevents.get(
    'deletingJourneyEventsCount',
  ),
  deletedJourneyEventIds: state.app.journeyevents.get('deletedJourneyEventIds'),
});

const mapDispatchToProps = {
  fetchJourneyEvents: actions.fetchJourneyEvents,
  deleteJourneyEvents: actions.deleteJourneyEvents,
};

function tick(mythis) {
  console.log('Ticking ...' + mythis);
  if (
    mythis.props.deletingJourneyEvents === false &&
    mythis.props.deletingJourneyEvents
  ) {
    mythis.props.fetchJourneyEvents();
  }
}

export const JourneyEventsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('isOpen', 'setIsOpen', false),
  withState('viewBy', 'setViewBy', 'all'),
  withState('doDelete', 'setDoDelete', false),
  withState('selectAll', 'setSelectAll', false),
  withState('confirmDelete', 'setConfirmDelete', false),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      let timer = setInterval(tick, 60 * 1000 * 10, this); // refresh every 10 minutes
      this.setState({ timer: timer });
    },
    componentWillUnmount() {
      clearInterval(this.state.timer);
    },
    componentWillReceiveProps(nextProps) {
      if (
        nextProps.deletingJourneyEvents === false &&
        this.props.deletingJourneyEvents
      ) {
        this.props.setDoDelete(false);
        $('.deleteButton button').attr('active', false);
        this.props.setConfirmDelete(false);
        $('.events-list').removeClass('hide');
      }
    },
  }),
)(JourneyEvents);

import { connect } from 'react-redux';
import { compose, lifecycle, withHandlers, withState } from 'recompose';
import { List } from 'immutable';
import moment from 'moment';
import { JourneyEvents } from './JourneyEvents';
import { actions } from '../redux/modules/journeyevents';

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
});

const mapDispatchToProps = {
  fetchJourneyEvents: actions.fetchJourneyEvents,
};

function tick(mythis) {
  console.log('Ticking ...' + mythis);
  mythis.props.fetchJourneyEvents();
}

export const JourneyEventsContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('isOpen', 'setIsOpen', false),
  withState('viewBy', 'setViewBy', 'all'),
  withHandlers({
    toggle: props => () => props.setIsOpen(open => !open),
  }),
  lifecycle({
    componentWillMount() {
      let timer = setInterval(tick, 60 * 1000 * 10, this); // refresh every 10 minutes
      this.setState({ timer: timer });
    },
    componentWillUnmount() {
      clearInterval(this.state.timer);
    },
  }),
)(JourneyEvents);

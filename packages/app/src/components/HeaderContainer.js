import { connect } from 'react-redux';
import {
  compose,
  withHandlers,
  withState,
  withProps,
  lifecycle,
} from 'recompose';
import { Header } from './Header';
import { Utils } from 'common';

import * as selectors from '../redux/selectors';
import { actions } from '../redux/modules/journeyevents';

export const mapStateToProps = state => ({
  space: state.app.space,
  profile: state.app.profile,
  // Selectors
  isKiosk: selectors.selectHasRoleKiosk(state),
  hasAccessToManagement: selectors.selectHasAccessToManagement(state),
  hasAccessToSupport: selectors.selectHasAccessToSupport(state),
  isGuest: selectors.selectIsGuest(state),
  adminKapp: selectors.selectAdminKapp(state),
  predefinedKapps: selectors.selectPredefinedKapps(state),
  additionalKapps: selectors.selectAdditionalKapps(state),
  currentKapp: selectors.selectCurrentKapp(state),
});
const mapDispatchToProps = {
  fetchJourneyEvents: actions.fetchJourneyEvents,
};

function eventsTick(mythis) {
  console.log('Ticking ...' + mythis);
  mythis.props.fetchJourneyEvents();
}

export const HeaderContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withState('kappDropdownOpen', 'setKappDropdownOpen', false),
  // Filter out Kapps that have an attribute of "Hidden" set to True or Yes
  withProps(props => ({
    predefinedKapps: props.predefinedKapps.filter(
      kapp =>
        !['yes', 'true'].includes(
          Utils.getAttributeValue(kapp, 'Hidden', 'false').toLowerCase(),
        ),
    ),
    additionalKapps: props.additionalKapps.filter(
      kapp =>
        !['yes', 'true'].includes(
          Utils.getAttributeValue(kapp, 'Hidden', 'false').toLowerCase(),
        ),
    ),
  })),
  withHandlers({
    kappDropdownToggle: props => () => props.setKappDropdownOpen(open => !open),
  }),
  lifecycle({
    constructor() {
      /*      this.props.fetchCurrentMember({
        id: this.props.match.params.id,
        history: this.props.history,
        fetchMembers: this.props.fetchMembers,
      }); */
    },
    UNSAFE_componentWillMount() {
      let timer = setInterval(eventsTick, 10 * 1000 * 60, this); // refresh every 1 hour
      this.setState({ timer: timer });
    },
    componentWillUnmount() {
      clearInterval(this.state.timer);
    },
  }),
)(Header);

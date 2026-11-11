import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { actions as appActions } from '../lib/react-kinops-components';
import { actions } from '../redux/modules/memberApp';
import { actions as alertsActions } from '../redux/modules/alerts';
import * as selectors from '../lib/react-kinops-components/src/redux/kinopsSelectors';
import { actions as leadActions } from '../redux/modules/leads';
import { actions as memberActions } from '../redux/modules/members';
import { actions as servicesActions } from '../redux/modules/services';
import { getAttributeValue } from '../lib/react-kinops-components/src/utils';
import { keepFirebaseConnected } from '../lib/firebaseAuth';

import { App } from './App';

const mapStateToProps = state => {
  return {
    loading: state.member.app.loading || state.member.kinops.loading,
    isKiosk: selectors.selectHasRoleKiosk(state),
    space: state.member.kinops.space,
    profile: state.member.kinops.profile,
    leadLastFetchTime: state.member.leads.leadLastFetchTime,
    memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
    membersNextPageToken: state.member.members.membersNextPageToken,
    memberLastFetchTime: state.member.members.memberLastFetchTime,
    memberNotesLoading: state.member.members.memberNotesLoading,
    migrationsLastFetchTime: state.member.services.migrationsLastFetchTime,
    // With their attributes, which keepFirebaseConnected reads.
    appSpace: state.member.app.space,
    appProfile: state.member.app.profile,
  };
};

const mapDispatchToProps = {
  loadApp: appActions.loadApp,
  loadAppSettings: actions.loadAppSettings,
  fetchAlerts: alertsActions.fetchAlerts,
  fetchLeads: leadActions.fetchLeads,
  fetchMembers: memberActions.fetchMembers,
  fetchMemberMigrations: servicesActions.fetchMemberMigrations,
};

function tick(mythis) {
  console.log('App Ticking ...' + mythis);
  mythis.props.fetchLeads({
    leadLastFetchTime: mythis.props.leadLastFetchTime,
  });
  mythis.props.fetchMemberMigrations({
    billingSystem: getAttributeValue(
      mythis.props.space,
      'Billing Company',
    ).toLowerCase(),
    migrationMode: getAttributeValue(mythis.props.space, 'Migration Mode'),
    migrationsLastFetchTime: mythis.props.migrationsLastFetchTime,
  });
  if (
    mythis.props.memberInitialLoadComplete &&
    !mythis.props.memberNotesLoading
  ) {
    mythis.props.fetchMembers({
      membersNextPageToken: mythis.props.membersNextPageToken,
      memberInitialLoadComplete: mythis.props.memberInitialLoadComplete,
      memberLastFetchTime: mythis.props.memberLastFetchTime,
    });
  }
}

export const AppContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  lifecycle({
    componentDidMount() {
      this.props.loadApp();
      this.props.loadAppSettings();
      this.props.fetchAlerts();

      let timer = setInterval(tick, 30 * 1000, this); // refresh every 30 seconds
      this.setState({ timer: timer });
      if (!this.props.loading) {
        this.connectFirebase();
      }
    },
    componentDidUpdate(prevProps) {
      // Once the school's settings and the signed-in profile have loaded.
      if (prevProps.loading && !this.props.loading) {
        this.connectFirebase();
      }
    },
    // Keeps Firebase connected while the portal is open, for a school using
    // the BJJ Members app -- not only at the login form, which a resumed
    // session never passes through (lib/firebaseAuth).
    connectFirebase() {
      if (this.stopFirebase) {
        this.stopFirebase();
      }
      this.stopFirebase = keepFirebaseConnected({
        space: this.props.appSpace,
        profile: this.props.appProfile,
      });
    },
    componentWillUnmount() {
      clearInterval(this.state.timer);
      if (this.stopFirebase) {
        this.stopFirebase();
      }
    },
    UNSAFE_componentWillReceiveProps(nextProps) {
      if (nextProps.space !== undefined && this.props.space === undefined) {
        document.title = this.props.space.name;
      }
    },
  }),
)(App);

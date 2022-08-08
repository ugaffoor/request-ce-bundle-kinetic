import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Header } from './Header';
import { actions as leadsActions } from '../redux/modules/leads';
import * as selectors from '../lib/react-kinops-components/src/redux/kinopsSelectors';

export const mapStateToProps = state => ({
  loading: state.member.app.loading || state.member.kinops.loading,
  space: state.member.kinops.space,
  profile: state.member.kinops.profile,
  // Selectors
  hasAccessToManagement: selectors.selectHasAccessToManagement(state),
  hasAccessToSupport: selectors.selectHasAccessToSupport(state),
  isKiosk: selectors.selectHasRoleKiosk(state),
  isGuest: selectors.selectIsGuest(state),
  adminKapp: selectors.selectAdminKapp(state),
  predefinedKapps: selectors.selectPredefinedKapps(state),
  additionalKapps: selectors.selectAdditionalKapps(state),
  currentKapp: selectors.selectCurrentKapp(state),
  leadsByDate: state.member.leads.leadsByDate,
  leadsByDateLoading: state.member.leads.leadsByDateLoading,
  leadAttentionRequired: state.member.leads.leadAttentionRequired,
});

export const HeaderContainer = compose(connect(mapStateToProps))(Header);

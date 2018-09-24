import { connect } from 'react-redux';
import { compose } from 'recompose';
import { Header } from './Header';
import * as selectors from '../../redux/kinopsSelectors';

export const mapStateToProps = state => ({
  loading: state.member.app.loading || state.member.kinops.loading,
  space: state.member.kinops.space,
  profile: state.member.kinops.profile,
  // Selectors
  hasAccessToManagement: selectors.selectHasAccessToManagement(state),
  hasAccessToSupport: selectors.selectHasAccessToSupport(state),
  isGuest: selectors.selectIsGuest(state),
  adminKapp: selectors.selectAdminKapp(state),
  predefinedKapps: selectors.selectPredefinedKapps(state),
  additionalKapps: selectors.selectAdditionalKapps(state),
  currentKapp: selectors.selectCurrentKapp(state),
});

export const HeaderContainer = compose(connect(mapStateToProps))(Header);

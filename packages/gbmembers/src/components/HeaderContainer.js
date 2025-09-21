import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import { Header } from './Header';
import { actions as leadsActions } from '../redux/modules/leads';
import { actions as membersActions } from '../redux/modules/members';
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
  allLeads: state.member.leads.allLeads,
  memberAttentionRequired: state.member.members.memberAttentionRequired,
  allMembers: state.member.members.allMembers,
});

var headerThis;

function toggleTitle(myThis) {
  if (document.title === myThis.state.baseTitle) {
    document.title = myThis.state.title;
  } else {
    document.title = myThis.state.baseTitle;
  }
}
export const HeaderContainer = compose(
  connect(mapStateToProps),
  lifecycle({
    UNSAFE_componentWillReceiveProps(nextProps) {
      //console.log("Lead Attention:"+nextProps.leadAttentionRequired);
      if (
        (nextProps.leadAttentionRequired !== this.props.leadAttentionRequired &&
          nextProps.allLeads.length > 0) ||
        (nextProps.memberAttentionRequired !==
          this.props.memberAttentionRequired &&
          nextProps.allMembers.length > 0) ||
        this.state === null
      ) {
        let title = this.props.space.name;
        if (
          nextProps.leadAttentionRequired ||
          nextProps.memberAttentionRequired
        ) {
          let leadAlert = '';
          let leadCount = 0;
          let memberAlert = '';
          let memberCount = 0;

          if (nextProps.allLeads.length > 0) {
            nextProps.allLeads.forEach(lead => {
              if (
                lead.values['Status'] !== 'Converted' &&
                lead.values['Is New Reply Received'] === 'true'
              ) {
                leadCount = leadCount + 1;
              }
            });
            if (leadCount > 0) {
              leadAlert = leadCount + 'L ';
            }
          }
          nextProps.allMembers.forEach(member => {
            if (member.values['Is New Reply Received'] === 'true') {
              memberCount = memberCount + 1;
            }
          });
          if (memberCount > 0) {
            memberAlert = memberCount + 'M ';
          }

          title =
            leadAlert +
            memberAlert +
            (leadCount > 0 || memberCount > 0 ? '- ' : '') +
            title;
        }
        document.title = title;
        this.setState({
          baseTitle: this.props.space.name,
          title: title,
        });
      }
    },
    componentDidMount() {
      headerThis = this;
      document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
          if (headerThis.state !== null) {
            console.log('has focus:' + headerThis.state.titleTimer);
            document.title = headerThis.state.title;
            clearInterval(headerThis.state.titleTimer);
            headerThis.setState({
              titleTimer: undefined,
            });
          }
        } else {
          if (
            headerThis.state !== null &&
            headerThis.state.titleTimer === undefined
          ) {
            let timer = setInterval(toggleTitle, 1 * 1000, headerThis); // refresh 1 seconds

            headerThis.setState({
              titleTimer: timer,
            });
            console.log('lost focus:' + timer);
          }
        }
      });
    },
    componentWillUnmount() {
      if (this.state !== null && this.state.titleTimer !== undefined) {
        console.log('clearing titeTimer:' + headerThis.state.titleTimer);
        clearInterval(headerThis.state.titleTimer);
        headerThis.setState({
          titleTimer: undefined,
        });
      }
    },
  }),
)(Header);

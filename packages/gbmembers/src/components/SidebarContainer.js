import {
  compose,
  lifecycle,
  withHandlers,
  withProps,
  withState,
} from 'recompose';
import { connect } from 'react-redux';
import { List } from 'immutable';
import { Filter } from '../records';
import { actions as filterMenuActions } from '../redux/modules/filterMenu';
import { Sidebar } from './Sidebar';
import { actions as memberActions } from '../redux/modules/members';
import $ from 'jquery';

const mapStateToProps = state => ({
  documentationUrl: state.member.app.documentationUrl,
  supportUrl: state.member.app.supportUrl,
  allMembers: state.member.members.allMembers,
  membersLoading: state.member.members.membersLoading,
  // The route prop below is just a way to make sure this component updates when
  // the route changes, otherwise connect implicitly prevents the update.
  route: `${state.router.location.pathname} ${state.router.location.search}`,
  memberLists: state.member.app.memberLists,
});

const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
  setMemberFilter: memberActions.setMemberFilter,
};

export const SidebarContainer = compose(
  connect(
    mapStateToProps,
    mapDispatchToProps,
  ),
  withProps(({ setMemberFilter }) => {
    return {};
  }),
  withState('listName', 'setListName', null),
  withState('filterType', 'setFilterType', 'filter'),
  withHandlers({
    handleOpenNewItemMenu: ({ openNewItemMenu }) => () => openNewItemMenu(),
  }),
  lifecycle({
    componentWillMount() {
      this.props.fetchMembers();
    },
  }),
)(Sidebar);

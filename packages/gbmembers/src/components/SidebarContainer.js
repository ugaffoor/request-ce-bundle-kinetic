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
  sidebarDisplayType: state.member.app.sidebarDisplayType,
  allMembers: state.member.members.allMembers,
  memberInitialLoadComplete: state.member.members.memberInitialLoadComplete,
  membersNextPageToken: state.member.members.membersNextPageToken,
  memberLastFetchTime: state.member.members.memberLastFetchTime,
  allLeads: state.member.leads.allLeads,
  currentFilter: state.member.members.currentFilter,
  membersLoading: state.member.members.membersLoading,
  leadsLoading: state.member.leads.leadsLoading,
  memberUpdating: state.member.members.memberUpdating,
  leadUpdating: state.member.leads.leadUpdating,
  // The route prop below is just a way to make sure this component updates when
  // the route changes, otherwise connect implicitly prevents the update.
  route: `${state.router.location.pathname} ${state.router.location.search}`,
  memberLists: state.member.app.memberLists,
  myFilters: state.member.app.myFilters,
  profile: state.member.app.profile,
  space: state.member.app.space,
});

const mapDispatchToProps = {
  fetchMembers: memberActions.fetchMembers,
  setMemberFilter: memberActions.setMemberFilter,
  getMemberFilter: memberActions.getMemberFilter,
};

export const SidebarContainer = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withProps(({ setMemberFilter }) => {
    return {};
  }),
  withState('listName', 'setListName', null),
  withState('filterType', 'setFilterType', 'filter'),
  withState('filterValue', 'setFilterValue', 'Active Members'),
  withHandlers({
    handleOpenNewItemMenu: ({ openNewItemMenu }) => () => openNewItemMenu(),
    handleFilterChange: ({
      setMemberFilter,
      getMemberFilter,
      fetchMembers,
      setFilterType,
      setListName,
      setFilterValue,
      membersNextPageToken,
      memberInitialLoadComplete,
      memberLastFetchTime,
    }) => () => {
      let filterValue = $('.membersFilters').val();
      setFilterValue(filterValue);
      let filterType = $('.membersFilters')
        .find(':selected')
        .attr('type');
      if (filterType === 'filter') {
        setMemberFilter($('.membersFilters').val());
        fetchMembers({
          membersNextPageToken: membersNextPageToken,
          memberInitialLoadComplete: memberInitialLoadComplete,
          memberLastFetchTime: memberLastFetchTime,
        });
        setFilterType('filter');
      } else if (filterType === 'list') {
        setMemberFilter('All Members');
        fetchMembers({
          membersNextPageToken: membersNextPageToken,
          memberInitialLoadComplete: memberInitialLoadComplete,
          memberLastFetchTime: memberLastFetchTime,
        });
        setFilterType('list');
        setListName($('.membersFilters').val());
      }
    },
    downloadLeads: ({ allLeads }) => () => {
      let fileDownload = require('js-file-download');
      let csvData =
        'First Name, Last Name, Gender, Address, Suburb, State, Postcode, Email, Phone, DOB, Source, Status, Date\n';
      allLeads.forEach(lead => {
        csvData = csvData.concat(
          '"' +
            lead.values['First Name'] +
            '","' +
            lead.values['Last Name'] +
            '","' +
            lead.values['Gender'] +
            '","' +
            lead.values['Address'] +
            '","' +
            lead.values['Suburb'] +
            '","' +
            lead.values['State'] +
            '","' +
            lead.values['Postcode'] +
            '","' +
            lead.values['Email'] +
            '","' +
            lead.values['Phone Number'] +
            '","' +
            lead.values['DOB'] +
            '","' +
            lead.values['Source'] +
            '","' +
            lead.values['Status'] +
            '","' +
            lead.values['Date'] +
            '"\n',
        );
      });
      fileDownload(csvData, 'leads.csv');
    },
  }),
  lifecycle({
    UNSAFE_componentWillMount() {
      this.props.fetchMembers({
        membersNextPageToken: this.props.membersNextPageToken,
        memberInitialLoadComplete: this.props.memberInitialLoadComplete,
        memberLastFetchTime: this.props.memberLastFetchTime,
      });
    },
  }),
)(Sidebar);

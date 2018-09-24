import React from 'react';
import { Members } from './Members';
import { ListMembers } from './ListMembers';
import { actions } from '../redux/modules/members';
import { KappNavLink as NavLink } from 'common';

export const Sidebar = ({
  documentationUrl,
  supportUrl,
  counts,
  handleOpenNewItemMenu,
  handleNewPersonalFilter,
  allMembers,
  membersLoading,
  setMemberFilter,
  fetchMembers,
  memberLists,
  filterType,
  listName,
}) => (
  <div className="sidebar">
    <NavLink to={`/NewMember`} className="btn btn-primary">
      Create New Member
    </NavLink>
    <NavLink to={`/memberLists`} className="btn btn-primary">
      Member Lists
    </NavLink>
    {filterType === 'filter' && membersLoading ? (
      <div />
    ) : (
      filterType === 'filter' && (
        <Members allMembers={allMembers} actions={actions} />
      )
    )}
    {filterType === 'list' && (
      <ListMembers
        allMembers={allMembers}
        actions={actions}
        memberLists={memberLists}
        listName={listName}
      />
    )}
  </div>
);

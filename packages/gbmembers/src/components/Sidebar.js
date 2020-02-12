import React from 'react';
import { Members } from './Members';
import { ListMembers } from './ListMembers';
import { actions } from '../redux/modules/members';
import { KappNavLink as NavLink } from 'common';
import { Utils } from 'common';

export const Sidebar = ({
  documentationUrl,
  supportUrl,
  counts,
  handleOpenNewItemMenu,
  handleNewPersonalFilter,
  allMembers,
  membersLoading,
  setMemberFilter,
  currentFilter,
  fetchMembers,
  memberLists,
  filterType,
  listName,
  myFilters,
  handleFilterChange,
  filterValue,
  profile,
}) => (
  <div className="sidebar">
    {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
      <div />
    ) : (
      <NavLink to={`/NewMember`} className="btn btn-primary">
        Create New Member
      </NavLink>
    )}
    <NavLink to={`/memberLists`} className="btn btn-primary">
      Member Lists
    </NavLink>
    <select
      value={filterValue}
      className="membersFilters"
      onChange={e => handleFilterChange(setMemberFilter, fetchMembers)}
    >
      <option type="filter" value="Active Members">
        Active Members
      </option>
      <option type="filter" value="Inactive Members">
        Inactive Members
      </option>
      <option type="filter" value="All Members">
        All Members
      </option>
      {myFilters.map(filter => (
        <option type="filter" value={filter.name}>
          {filter.name}
        </option>
      ))}
      {memberLists.map(list => (
        <option type="list" key={list.name} value={list.name}>
          {list.name}
        </option>
      ))}
    </select>
    <div className="droparrow" />
    {filterType === 'filter' && membersLoading ? (
      <div />
    ) : (
      filterType === 'filter' && (
        <Members
          allMembers={allMembers}
          currentFilter={currentFilter}
          actions={actions}
        />
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

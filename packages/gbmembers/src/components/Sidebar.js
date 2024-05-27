import React from 'react';
import { Members } from './Members';
import { Leads } from './Leads';
import { ListMembers } from './ListMembers';
import { actions } from '../redux/modules/members';
import { KappNavLink as NavLink } from 'common';
import { Utils } from 'common';
import download from '../images/download.svg?raw';
import SVGInline from 'react-svg-inline';
import attentionRequired from '../images/flag.svg?raw';

export const Sidebar = ({
  documentationUrl,
  supportUrl,
  sidebarDisplayType,
  counts,
  handleOpenNewItemMenu,
  handleNewPersonalFilter,
  allMembers,
  allLeads,
  memberInitialLoadComplete,
  membersLoading,
  leadsLoading,
  memberUpdating,
  leadUpdating,
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
  downloadLeads,
  downloadMembers,
  space,
  setAttentionRequiredOnly,
  attentionRequiredOnly,
  toggleAttentionRequiredOnly,
}) => (
  <div className={'sidebar ' + sidebarDisplayType}>
    {sidebarDisplayType === 'leads' && (
      <div className="leadsSidebar">
        <div className="buttons">
          <NavLink to={`/NewLead`} className="btn btn-primary addNewLead">
            Add New Lead
          </NavLink>
          <NavLink to={`/leadLists`} className="btn btn-primary leadListButton">
            Lead Lists
          </NavLink>
        </div>
        <div className="options">
          <SVGInline
            svg={download}
            className={'download icon'}
            title="Export Leads to CSV"
            alt="Export Leads to CSV"
            onClick={e => downloadLeads()}
          />
        </div>
        {(leadUpdating || !leadUpdating) && <Leads allLeads={allLeads} />}
      </div>
    )}
    {sidebarDisplayType === 'members' && (
      <div className="membersSidebar">
        <div className="buttons">
          {!Utils.isMemberOf(profile, 'Role::Program Managers') ? (
            <div />
          ) : (
            <NavLink to={`/NewMember`} className="btn btn-primary">
              New Member
            </NavLink>
          )}
          <NavLink to={`/memberLists`} className="btn btn-primary">
            Member Lists
          </NavLink>
        </div>
        <div className="options"></div>
        <select
          value={filterValue}
          className="membersFilters"
          onChange={e => handleFilterChange(setMemberFilter, fetchMembers)}
        >
          <option type="filter" value="Active Members">
            Active Members
          </option>
          <option type="filter" value="Frozen Members">
            Frozen Members
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
        {filterType === 'filter' && true && (
          <Members
            allMembers={allMembers}
            currentFilter={currentFilter}
            actions={actions}
            space={space}
          />
        )}
        {filterType === 'list' && (
          <ListMembers
            allMembers={allMembers}
            actions={actions}
            memberLists={memberLists}
            listName={listName}
            space={space}
          />
        )}
      </div>
    )}
  </div>
);

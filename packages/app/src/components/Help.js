import React from 'react';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '@kineticdata/react';

export const Help = ({
  Help,
  fetchHelp,
  isSpaceAdmin,
  isOpen,
  toggle,
  viewBy,
  setViewBy,
  selectViewBy,
  setViewByClicked,
  filterValue,
  setFilterValue,
}) => (
  <Dropdown isOpen={isOpen} toggle={toggle}>
    <DropdownToggle
      nav
      role="button"
      onClick={e => {
        setViewByClicked(false);
      }}
    >
      <i className="fa fa-solid fa-question" />
    </DropdownToggle>
    {isOpen && (
      <DropdownMenu right className="help-menu">
        <div className="help-header">
          <span className="title">
            <I18n>Help Information</I18n>
          </span>
          <div className="search-box">
            <form className="search-box__form">
              <input
                type="text"
                placeholder="Filter Help"
                value={filterValue}
                onChange={e => {
                  setFilterValue(e.target.value);
                }}
              />
              <span className="fa fa-search" />
            </form>
          </div>
          <div className="actions" />
        </div>
        <div className="viewByButtons">
          <button
            type="button"
            active={viewBy === 'all' ? 'true' : 'false'}
            className="btn btn-primary report-btn-default"
            onClick={e => {
              setViewBy('all');
              setViewByClicked(true);
            }}
          >
            All
          </button>
          <button
            type="button"
            active={viewBy === 'members' ? 'true' : 'false'}
            className="btn btn-primary"
            onClick={e => {
              setViewBy('members');
              setViewByClicked(true);
            }}
          >
            Members
          </button>
          <button
            type="button"
            active={viewBy === 'services' ? 'true' : 'false'}
            className="btn btn-primary"
            onClick={e => {
              setViewBy('services');
              setViewByClicked(true);
            }}
          >
            Services
          </button>
          <button
            type="button"
            active={viewBy === 'waivers' ? 'true' : 'false'}
            className="btn btn-primary"
            onClick={e => {
              setViewBy('waivers');
              setViewByClicked(true);
            }}
          >
            Waivers
          </button>
          <button
            type="button"
            active={viewBy === 'home' ? 'true' : 'false'}
            className="btn btn-primary"
            onClick={e => {
              setViewBy('home');
              setViewByClicked(true);
            }}
          >
            Home
          </button>
        </div>
        <ul className="help-list">
          {Help.filter(help => {
            if (
              viewBy === 'members' &&
              help.values['Application'] === 'Members'
            )
              return true;
            if (
              viewBy === 'services' &&
              help.values['Application'] === 'Services'
            )
              return true;
            if (
              viewBy === 'waivers' &&
              help.values['Application'] === 'Waivers'
            )
              return true;
            if (viewBy === 'home' && help.values['Application'] === 'Home')
              return true;
            if (viewBy === 'all') return true;
            return false;
          })
            .filter(help => {
              if (filterValue === '') return true;
              if (
                help.values['Title']
                  .toLowerCase()
                  .indexOf(filterValue.toLowerCase()) !== -1
              ) {
                return true;
              }
              if (
                help.values['Information']
                  .toLowerCase()
                  .indexOf(filterValue.toLowerCase()) !== -1
              ) {
                return true;
              }
              return false;
            })
            .map(help => (
              <li key={help.id} className="event-item">
                <span className="header">
                  <span className="category">[{help.values['Category']}]</span>
                  <span className="title">{help.values['Title']}</span>
                </span>
                <span
                  className="information"
                  dangerouslySetInnerHTML={{
                    __html: help.values['Information'],
                  }}
                />
              </li>
            ))}
          {Help.size < 1 && (
            <h6 className="empty-help">
              <I18n>There are no Help Information records.</I18n>
            </h6>
          )}
        </ul>
      </DropdownMenu>
    )}
  </Dropdown>
);

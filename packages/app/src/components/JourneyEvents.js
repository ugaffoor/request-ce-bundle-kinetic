import React from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '../I18nProvider';
import phone from '../assets/images/phone.png';
import mail from '../assets/images/mail.png';
import sms from '../assets/images/sms.png';
import binIcon from '../assets/images/bin.svg?raw';
import moment from 'moment';
import $ from 'jquery';
import SVGInline from 'react-svg-inline';
import { confirm } from './Confirmation';

export const JourneyEvents = ({
  journeyevents,
  fetchJourneyEvents,
  deleteJourneyEvents,
  deletingJourneyEvents,
  deletingJourneyEventsCount,
  deletedJourneyEventIds,
  isSpaceAdmin,
  isOpen,
  toggle,
  viewBy,
  setViewBy,
  doDelete,
  setDoDelete,
  selectViewBy,
  setSelectAll,
  selectAll,
  confirmDelete,
  setConfirmDelete,
}) => (
  <Dropdown isOpen={isOpen} toggle={toggle}>
    <DropdownToggle nav role="button">
      <i className="fa fa-fw fa-bell" />
      {journeyevents.size > 0 && (
        <span className="badge badge-secondary">
          {
            journeyevents.filter(
              journeyevent => journeyevent.values['Status'] === 'New',
            ).size
          }
        </span>
      )}
    </DropdownToggle>
    {isOpen && (
      <DropdownMenu right className="events-menu">
        <div className="events-header">
          <span className="title">
            <I18n>Journey Events</I18n>
          </span>
          {!deletingJourneyEvents && !confirmDelete && (
            <span className="deleteButton">
              <button
                type="button"
                className="btn btn-primary report-btn-default"
                onClick={e => {
                  $('.deleteButton button').attr('active', doDelete);
                  setDoDelete(!doDelete);
                }}
              >
                Enable Delete
              </button>
            </span>
          )}
          {!deletingJourneyEvents && !confirmDelete && (
            <div className="actions">
              <a role="button" tabIndex="0" onClick={fetchJourneyEvents}>
                <I18n>Refresh</I18n>
              </a>
            </div>
          )}
        </div>
        {!deletingJourneyEvents && !confirmDelete && (
          <div className="viewByButtons">
            <button
              type="button"
              active="true"
              className="btn btn-primary report-btn-default"
              onClick={e => {
                $('.viewByButtons button[active=true]').attr('active', 'false');
                $(e.target).attr('active', 'true');
                setViewBy('all');
              }}
            >
              All
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary"
              onClick={e => {
                $('.viewByButtons button[active=true]').attr('active', 'false');
                $(e.target).attr('active', 'true');
                setViewBy('leads');
              }}
            >
              Leads
            </button>
            <button
              type="button"
              active="false"
              className="btn btn-primary"
              onClick={e => {
                $('.viewByButtons button[active=true]').attr('active', 'false');
                $(e.target).attr('active', 'true');
                setViewBy('members');
              }}
            >
              Members
            </button>
          </div>
        )}
        {doDelete && !deletingJourneyEvents && !confirmDelete && (
          <div className="deleteOptions">
            <button
              type="button"
              active="false"
              className="btn btn-primary"
              onClick={e => {
                if (!selectAll) {
                  $('.deleteEvent input').prop('checked', true);
                } else {
                  $('.deleteEvent input').prop('checked', false);
                }
                setSelectAll(!selectAll);
              }}
            >
              {!selectAll ? 'Select All' : 'Unselect All'}
            </button>
            <span
              className="deletEvents"
              onClick={async e => {
                setConfirmDelete(true);
              }}
            >
              <SVGInline svg={binIcon} className="icon" />
            </span>
          </div>
        )}
        {confirmDelete && !deletingJourneyEvents && (
          <div className="deleteConfirmation">
            <h1>
              Do you wish to delete the{' '}
              {$('.deleteEvent input:checkbox:checked').length} alerts selected?
            </h1>
            <div className="buttons viewByButtons">
              <button
                type="button"
                active="false"
                className="btn "
                onClick={e => {
                  setConfirmDelete(false);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                active="false"
                className="btn "
                onClick={e => {
                  var ids = [];
                  $('.deleteEvent input:checkbox:checked').each(function() {
                    ids.push(
                      $(this)
                        .prop('id')
                        .replace('event-', ''),
                    );
                  });
                  deleteJourneyEvents({
                    journeyevents: journeyevents,
                    ids: ids,
                  });
                }}
              >
                Continue
              </button>
            </div>
          </div>
        )}
        {deletingJourneyEvents && (
          <div className="deleteConfirmation">
            <h1>
              Deleting alerts, {deletingJourneyEventsCount} alerts remaining?
            </h1>
            <h1>Please wait...</h1>
          </div>
        )}
        <ul
          className={
            deletingJourneyEvents || confirmDelete
              ? 'events-list hide'
              : 'events-list'
          }
        >
          {journeyevents
            .filter(journeyevent => journeyevent.values['Status'] === 'New')
            .filter(journeyevent => {
              if (
                viewBy === 'leads' &&
                journeyevent.values['Record Type'] === 'Lead'
              )
                return true;
              if (
                viewBy === 'members' &&
                journeyevent.values['Record Type'] === 'Member'
              )
                return true;
              if (viewBy === 'all') return true;
              return false;
            })
            .filter(
              journeyevent => !deletedJourneyEventIds.includes(journeyevent.id),
            )
            .map(journeyevent => (
              <li key={journeyevent.id} className="event-item">
                <Link
                  to={`/kapps/gbmembers/${journeyevent.values['Contact Type']}Event/${journeyevent.values['Record Type']}/${journeyevent.id}`}
                  onClick={toggle}
                >
                  <h1>
                    {journeyevent.values['Contact Type'] === 'Email' ? (
                      <span className="icon">
                        <img src={mail} alt="Email" />
                      </span>
                    ) : (
                      <span />
                    )}
                    {journeyevent.values['Contact Type'] === 'Call' ? (
                      <span className="icon">
                        <img src={phone} alt="Phone Call" />
                      </span>
                    ) : (
                      <span />
                    )}
                    {journeyevent.values['Contact Type'] === 'SMS' ? (
                      <span className="icon">
                        <img src={sms} alt="SMS" />
                      </span>
                    ) : (
                      <span />
                    )}
                    <small className="source">
                      <I18n>{journeyevent.values['Record Type']}</I18n>
                    </small>
                    <span className="name">
                      <I18n>{journeyevent.values['Record Name']}</I18n>
                    </span>
                  </h1>
                  <span className="template">
                    <I18n>{journeyevent.values['Template Name']}</I18n>
                  </span>
                  <span className="date">
                    {moment(journeyevent['createdAt']).fromNow()}
                  </span>
                </Link>
                {doDelete && (
                  <span className="deleteEvent">
                    <input
                      key={journeyevent.id}
                      type="checkbox"
                      id={`event-${journeyevent.id}`}
                      value={journeyevent.id}
                      onChange={e => {}}
                    />
                  </span>
                )}
              </li>
            ))}
          {journeyevents.size < 1 && (
            <h6 className="empty-events">
              <I18n>There are no active Journey Events.</I18n>
            </h6>
          )}
        </ul>
      </DropdownMenu>
    )}
  </Dropdown>
);

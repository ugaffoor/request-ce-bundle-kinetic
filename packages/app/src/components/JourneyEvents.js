import React from 'react';
import { Link } from 'react-router-dom';
import { Dropdown, DropdownToggle, DropdownMenu } from 'reactstrap';
import { I18n } from '../I18nProvider';
import phone from '../assets/images/phone.png';
import mail from '../assets/images/mail.png';
import sms from '../assets/images/sms.png';
import moment from 'moment';
import $ from 'jquery';

export const JourneyEvents = ({
  journeyevents,
  fetchJourneyEvents,
  isSpaceAdmin,
  isOpen,
  toggle,
  viewBy,
  setViewBy,
  selectViewBy,
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
          <div className="actions">
            <a role="button" tabIndex="0" onClick={fetchJourneyEvents}>
              <I18n>Refresh</I18n>
            </a>
          </div>
        </div>
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
        <ul className="events-list">
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

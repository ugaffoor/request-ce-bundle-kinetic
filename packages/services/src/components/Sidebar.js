import React from 'react';
import { KappLink as Link, KappNavLink as NavLink } from 'common';
import { Nav, NavItem } from 'reactstrap';
import { CatalogSearchContainer } from './shared/CatalogSearchContainer';
import { getSubmissionPath } from '../utils';
import { RequestCard } from './shared/RequestCard';

const formatCount = count =>
  !count ? '' : count >= 1000 ? '(999+)' : `(${count})`;

const itemLink = (mode, slug) =>
  `${mode === 'Categories' ? '/categories' : '/forms'}/${slug}`;

export const Sidebar = props => (
  <div className="sidebar services-sidebar">
    <div className="sidebar-group--content-wrapper">
      <div className="search-box">
        <CatalogSearchContainer />
      </div>
    </div>
    <hr />
    <div className="page-panel page-panel--transparent page-panel--one-thirds page-panel--auto-height page-panel--my-requests">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h1>Recent Requests</h1>
          <Link to="/requests">View All</Link>
        </div>
      </div>

      <div className="cards__wrapper cards__wrapper--requests">
        {props.submissions.size > 0 ? (
          props.submissions
            .take(5)
            .map(submission => ({
              submission: submission,
              forms: props.forms,
              key: submission.id,
              path: getSubmissionPath(submission),
              deleteCallback: props.fetchSubmissions,
            }))
            .map(props => <RequestCard {...props} />)
        ) : (
          <div className="card card--empty-state">
            <h1>You have no requests yet.</h1>
            <p>As you request new services, they’ll appear here.</p>
          </div>
        )}
      </div>
    </div>
    {props.spaceAdmin && (
      <div className="sidebar-group sidebar-group--settings">
        <ul className="nav flex-column settings-group">
          <Link
            to="/settings/"
            onClick={props.openSettings}
            className="nav-link"
          >
            Settings
            <span className="fa fa-fw fa-angle-right" />
          </Link>
        </ul>
      </div>
    )}
  </div>
);

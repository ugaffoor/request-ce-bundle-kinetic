import React, { Fragment } from 'react';
import wallyHappyImage from 'common/src/assets/images/wally-happy.svg';
import { KappLink as Link, PageTitle } from 'common';
import { RequestCard } from '../shared/RequestCard';
import { getSubmissionPath } from '../../utils';
import { Utils } from 'common';

const emptyStateMessage = type => {
  switch (type) {
    case 'Draft': {
      return 'You have no draft requests. Draft services are forms you started but haven\t submitted yet.';
    }
    case 'Open': {
      return 'You have no open requests. If you request something, it will show up here.';
    }
    case 'Closed': {
      return "Closed requests are services  you've requested that have been completed or canceled.";
    }
    default: {
      return 'No requests found. Submit a service and it will show up here!';
    }
  }
};

export const RequestList = ({
  forms,
  submissions,
  type,
  hasNextPage,
  hasPreviousPage,
  handleNextPage,
  handlePreviousPage,
  refreshPage,
  searchByName,
  profile,
}) => (
  <Fragment>
    <PageTitle parts={['My Requests']} />
    <span className="services-color-bar services-color-bar__blue-slate" />
    <div className="page-container page-container--request-list">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="/">services</Link> /{' '}
            {type && <Link to="/requests">requests</Link>}
            {type && ' / '}
          </h3>
          <h1>{type || 'All Requests'}</h1>
        </div>
        <div className="btn-group">
          <button
            type="button"
            className="btn btn-inverse"
            disabled={!hasPreviousPage}
            onClick={handlePreviousPage}
          >
            <span className="icon">
              <span className="fa fa-fw fa-caret-left" />
            </span>
          </button>
          <button
            type="button"
            className="btn btn-inverse"
            disabled={!hasNextPage}
            onClick={handleNextPage}
          >
            <span className="icon">
              <span className="fa fa-fw fa-caret-right" />
            </span>
          </button>
        </div>
      </div>
      {profile !== undefined &&
        profile.memberships !== undefined &&
        (profile.spaceAdmin ||
          Utils.isMemberOf(profile, 'Role::Data Admin') ||
          Utils.isMemberOf(profile, 'Role::Program Managers')) && (
          <div className="filterSection">
            <form className="search-box__form">
              <input
                type="text"
                placeholder="Search by Full Name"
                autoFocus
                onKeyUp={event => {
                  if (event.keyCode === 13) {
                    searchByName(event.target.value);
                  }
                }}
              />
              <span className="fa fa-search" />
            </form>
          </div>
        )}
      <div className="cards__wrapper cards__wrapper--requests">
        {submissions.size > 0 ? (
          submissions
            .map(submission => ({
              submission,
              forms,
              key: submission.id,
              path: getSubmissionPath(submission, null, type),
              deleteCallback: refreshPage,
            }))
            .map(props => <RequestCard {...props} />)
        ) : (
          <div className="empty-state empty-state--wally">
            <h5>No {type !== 'All' ? type : ''} Requests Found...</h5>
            <img src={wallyHappyImage} alt="Happy Wally" />
            <h6>{emptyStateMessage(type)}</h6>
          </div>
        )}
      </div>
    </div>
  </Fragment>
);

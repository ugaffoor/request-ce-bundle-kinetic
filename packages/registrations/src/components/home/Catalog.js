import React, { Fragment } from 'react';
import { PageTitle } from 'common';
import { CatalogSearchContainer } from '../shared/CatalogSearchContainer';
import { RequestCard } from '../shared/RequestCard';
import { getSubmissionPath } from '../../utils';
import Select from 'react-select';

export const Catalog = ({
  kapp,
  registrationsLoading,
  registrations,
  homePageMode,
  homePageItems,
  fetchSubmissions,
  allLeads,
  getAllLeads,
  selectLead,
  setSelectedLead,
}) => {
  return (
    <Fragment>
      <PageTitle parts={[]} />
      <div className="search-registrations-home">
        <div className="search-services-home__wrapper">
          <h1 className="text-truncate">Select a Lead</h1>
          <div className="search-box">
            <Select
              closeMenuOnSelect={true}
              options={getAllLeads()}
              className="hide-columns-container"
              classNamePrefix="hide-columns"
              placeholder="Select Lead"
              allLeads={allLeads}
              onChange={e => {
                selectLead(e.value, setSelectedLead, allLeads);
              }}
              style={{ width: '300px' }}
            />
          </div>
        </div>
      </div>
      <div className="page-container page-container--services-home">
        <div className="page-panel page-panel--transparent page-panel--one-thirds page-panel--auto-height page-panel--my-requests">
          <div className="page-title">
            <div className="page-title__wrapper">
              <h3 className="text-lowercase">{kapp.name} /</h3>
              <h1>Recent Requests</h1>
            </div>
          </div>

          <div className="cards__wrapper cards__wrapper--requests">
            {registrationsLoading ? (
              <div>
                <div className="loading">
                  <i className="fa fa-spinner fa-spin fa-2x fa-fw" />
                  <p className="lead m-0">Loading...</p>
                </div>
              </div>
            ) : registrations.size > 0 ? (
              registrations
                .map(submission => ({
                  submission,
                  key: submission.id,
                  path: getSubmissionPath(submission),
                  deleteCallback: fetchSubmissions,
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
      </div>
    </Fragment>
  );
};

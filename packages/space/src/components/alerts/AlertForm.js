import React from 'react';
import { CoreForm } from 'react-kinetic-core';
import { Utils, commonActions, PageTitle } from 'common';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { push } from 'connected-react-router';
import { compose, withHandlers } from 'recompose';
import { I18n } from '../../../../app/src/I18nProvider';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

const AlertFormComponent = ({
  alertsKappSlug,
  alertsFormSlug,
  submissionId,
  submissionLabel,
  match,
  handleCreateOrUpdate,
  values,
  spaceName,
  editing,
}) => (
  <div className="page-container page-container--space-alerts-form">
    <PageTitle parts={[editing ? 'Edit Alert' : 'New Alert', 'Alerts']} />

    <div className="page-panel page-panel--space-alerts-form">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="/">
              <I18n>home</I18n>
            </Link>{' '}
            /{' '}
            <Link to="/alerts">
              <I18n>alerts</I18n>
            </Link>{' '}
            /
          </h3>
          <h1>
            <I18n>{editing ? 'Edit' : 'New'} Alert</I18n>
          </h1>
        </div>
      </div>
      <I18n context={`kapps.${alertsKappSlug}.forms.${alertsFormSlug}`}>
        {editing ? (
          <div>
            <CoreForm
              submission={submissionId}
              globals={globals}
              updated={handleCreateOrUpdate}
            />
          </div>
        ) : (
          <div>
            <CoreForm
              kapp={alertsKappSlug}
              form={alertsFormSlug}
              globals={globals}
              created={handleCreateOrUpdate}
              updated={handleCreateOrUpdate}
              values={values}
            />
          </div>
        )}
      </I18n>
    </div>
  </div>
);

const mapStateToProps = (state, { match: { params } }) => ({
  spaceName: state.app.space.name,
  editing: params.id !== 'new',
  submissionId: params.id,
  alertsKappSlug: Utils.getAttributeValue(
    state.app.space,
    'Admin Kapp Slug',
    'admin',
  ),
  alertsFormSlug: Utils.getAttributeValue(
    state.app.space,
    'Alerts Form Slug',
    'alerts',
  ),
});

const handleCreateOrUpdate = props => response => {
  props.fetchAlerts();
  props.push(`/alerts`);
};

const mapDispatchToProps = {
  push,
  fetchAlerts: commonActions.fetchAlerts,
};

export const AlertForm = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withHandlers({ handleCreateOrUpdate }),
)(AlertFormComponent);

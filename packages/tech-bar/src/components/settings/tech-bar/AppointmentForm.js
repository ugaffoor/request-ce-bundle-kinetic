import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { compose, withProps } from 'recompose';
import {
  KappLink as Link,
  PageTitle,
  selectCurrentKapp,
  Utils,
  ErrorNotFound,
  selectHasRoleSchedulerAdmin,
} from 'common';
import { CoreForm } from 'react-kinetic-core';
import { I18n } from '../../../../../app/src/I18nProvider';

// Asynchronously import the global dependencies that are used in the embedded
// forms. Note that we deliberately do this as a const so that it should start
// immediately without making the application wait but it will likely be ready
// before users nagivate to the actual forms.
const globals = import('common/globals');

export const AppointmentFormComponent = ({
  match: {
    params: { apptid },
  },
  kapp,
  techBar,
}) => {
  return techBar ? (
    <Fragment>
      <PageTitle
        parts={[
          'Appointment Details',
          techBar.values['Name'],
          'Tech Bar Settings',
        ]}
      />
      <div className="page-container page-container--tech-bar-settings">
        <div className="page-panel page-panel--scrollable">
          <div className="page-title">
            <div className="page-title__wrapper">
              <h3>
                <Link to="/">
                  <I18n>tech bar</I18n>
                </Link>{' '}
                /{` `}
                <Link to="/settings">
                  <I18n>settings</I18n>
                </Link>{' '}
                /{` `}
                <Link to="/settings/general">
                  <I18n>tech bars</I18n>
                </Link>{' '}
                /{` `}
                <Link to={`/settings/general/${techBar.id}`}>
                  <I18n>{techBar.values['Name']}</I18n>
                </Link>{' '}
                /{` `}
              </h3>
              <h1>
                <I18n>Appointment Details</I18n>
              </h1>
            </div>
          </div>
          <div className="content-wrapper">
            <I18n context={`kapps.${kapp.slug}.forms.appointment`}>
              <CoreForm submission={apptid} review={true} globals={globals} />
            </I18n>
          </div>
        </div>
      </div>
    </Fragment>
  ) : (
    <ErrorNotFound />
  );
};

export const mapStateToProps = (state, props) => {
  const isSchedulerAdmin = selectHasRoleSchedulerAdmin(state);
  const techBar = state.techBar.techBarApp.schedulers.find(
    scheduler =>
      scheduler.id === props.techBarId &&
      (isSchedulerAdmin ||
        Utils.isMemberOf(
          state.app.profile,
          `Role::Scheduler::${scheduler.values['Name']}`,
        ) ||
        Utils.isMemberOf(
          state.app.profile,
          `Scheduler::${scheduler.values['Name']}`,
        )),
  );
  return {
    kapp: selectCurrentKapp(state),
    techBar,
  };
};

export const AppointmentForm = compose(
  withProps(({ match: { params: { id } } }) => ({
    techBarId: id,
  })),
  connect(mapStateToProps),
)(AppointmentFormComponent);

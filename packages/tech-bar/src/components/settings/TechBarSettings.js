import React, { Fragment } from 'react';
import { connect } from 'react-redux';
import { push } from 'connected-react-router';
import { compose, lifecycle } from 'recompose';
import {
  KappLink as Link,
  PageTitle,
  selectCurrentKapp,
  Utils,
  selectHasRoleSchedulerAdmin,
} from 'common';
import { actions } from '../../redux/modules/techBarApp';
import { I18n } from '../../../../app/src/I18nProvider';

const getStatusColor = status =>
  status === 'Inactive' ? 'status--red' : 'status--green';

export const TechBarSettingsComponent = ({ techBars }) => (
  <Fragment>
    <PageTitle parts={['Tech Bar Settings']} />
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
            </h3>
            <h1>
              <I18n>Tech Bars</I18n>
            </h1>
          </div>
        </div>
        <div className="list-wrapper">
          {techBars.size > 0 && (
            <table className="table table-sm table-striped table-schedulers table--settings">
              <thead className="header">
                <tr>
                  <th scope="col">
                    <I18n>Name</I18n>
                  </th>
                  <th scope="col">
                    <I18n>Status</I18n>
                  </th>
                  <th scope="col">
                    <I18n>Location</I18n>
                  </th>
                </tr>
              </thead>
              <tbody>
                {techBars.map(scheduler => {
                  return (
                    <tr key={scheduler.id}>
                      <td scope="row">
                        <Link to={`/settings/general/${scheduler.id}`}>
                          <I18n>{scheduler.values['Name']}</I18n>
                        </Link>
                      </td>
                      <td>
                        <span
                          className={`status ${getStatusColor(
                            scheduler.values['Status'],
                          )}`}
                        >
                          <I18n>{scheduler.values['Status']}</I18n>
                        </span>
                      </td>
                      <td>
                        <I18n>{scheduler.values['Location']}</I18n>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
          {techBars.size === 0 && (
            <div className="empty-state">
              <h5>
                <I18n>No Tech Bars Found</I18n>
              </h5>
            </div>
          )}
        </div>
      </div>
    </div>
  </Fragment>
);

export const mapStateToProps = (state, props) => {
  const techBars = selectHasRoleSchedulerAdmin(state)
    ? state.techBar.techBarApp.schedulers
    : state.techBar.techBarApp.schedulers.filter(
        s =>
          Utils.isMemberOf(
            state.app.profile,
            `Role::Scheduler::${s.values['Name']}`,
          ) ||
          Utils.isMemberOf(state.app.profile, `Scheduler::${s.values['Name']}`),
      );
  return {
    kapp: selectCurrentKapp(state),
    techBars,
  };
};

export const mapDispatchToProps = {
  push,
  fetchAppSettings: actions.fetchAppSettings,
};

export const TechBarSettings = compose(
  connect(mapStateToProps, mapDispatchToProps),
  lifecycle({
    componentDidMount() {
      // this.props.fetchAppSettings();
    },
  }),
)(TechBarSettingsComponent);

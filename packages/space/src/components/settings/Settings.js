import React, { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Route, Switch } from 'react-router-dom';
import { connect } from 'react-redux';
import { compose, lifecycle } from 'recompose';
import {
  Icon,
  PageTitle,
  Schedulers,
  selectHasRoleSchedulerAdmin,
  selectHasRoleSchedulerManager,
} from 'common';

import { SpaceSettings } from './space_settings/SpaceSettings';
import { Notifications } from './notifications/Notifications';
import { Datastore } from './datastore/Datastore';
import { RobotsWrapper } from './robots/RobotsWrapper';
import { Users } from './users/Users';
import { Profile } from './profile/Profile';
import { Teams } from './teams/Teams';
import { Translations } from './translations/Translations';
import { actions as datastoreActions } from '../../redux/modules/settingsDatastore';
import { actions as teamActions } from '../../redux/modules/teamList';
import { I18n } from '../../../../app/src/I18nProvider';

export const SettingsComponent = () => (
  <Switch>
    <Route path="/settings/profile" component={Profile} />
    <Route path="/settings/system" component={SpaceSettings} />
    <Route path="/settings/datastore" component={Datastore} />
    <Route path="/settings/robots" component={RobotsWrapper} />
    <Route path="/settings/users" component={Users} />
    <Route path="/settings/notifications" component={Notifications} />
    <Route path="/settings/teams" component={Teams} />
    <Route
      path="/settings/schedulers"
      render={props => (
        <Schedulers
          {...props}
          breadcrumbs={
            <Fragment>
              <Link to="/">home</Link> /{` `}
              <Link to="/settings">settings</Link> /{` `}
            </Fragment>
          }
        />
      )}
    />
    <Route path="/settings/translations" component={Translations} />
    <Route component={SettingsNavigation} />
  </Switch>
);

const mapDispatchToProps = {
  fetchForms: datastoreActions.fetchForms,
  fetchTeams: teamActions.fetchTeams,
};

export const Settings = compose(
  connect(null, mapDispatchToProps),
  lifecycle({
    UNSAFE_componentWillMount(prev, next) {
      this.props.fetchForms();
      this.props.fetchTeams();
    },
  }),
)(SettingsComponent);

const SettingsCard = ({ path, icon, name, description }) => (
  <Link to={path} className="card card--service">
    <h1>
      <Icon image={icon || 'fa-sticky-note-o'} background="blueSlate" />
      <I18n>{name}</I18n>
    </h1>
    <p>
      <I18n>{description}</I18n>
    </p>
  </Link>
);

const SettingsNavigationComponent = ({
  isSpaceAdmin,
  isSchedulerAdmin,
  isSchedulerManager,
}) => (
  <div className="page-container page-container--space-settings">
    <PageTitle parts={['Settings']} />
    <div className="page-panel page-panel--datastore-content">
      <div className="page-title">
        <div className="page-title__wrapper">
          <h3>
            <Link to="/">
              <I18n>home</I18n>
            </Link>{' '}
            /{` `}
          </h3>
          <h1>
            <I18n>Settings</I18n>
          </h1>
        </div>
      </div>

      <I18n
        render={translate => (
          <div className="cards__wrapper cards__wrapper--services">
            <SettingsCard
              name={translate('Edit Profile')}
              path={`/settings/profile`}
              icon="fa-user"
              description={translate('Edit your profile')}
            />
            {isSpaceAdmin && (
              <Fragment>
                <SettingsCard
                  name={translate('User Management')}
                  path={`/settings/users`}
                  icon="fa-users"
                  description={translate('Create, Edit and Import Users')}
                />

                <SettingsCard
                  name={translate('Team Management')}
                  path={`/settings/teams`}
                  icon="fa-users"
                  description={translate('Create and Edit Teams')}
                />

                <SettingsCard
                  name={translate('System Settings')}
                  path={`/settings/system`}
                  icon="fa-gear"
                  description={translate('View and Modify all System Settings')}
                />

                <SettingsCard
                  name={translate('Datastore Forms')}
                  path={`/settings/datastore`}
                  icon="fa-hdd-o"
                  description={translate(
                    'View, Create and Edit Reference Data',
                  )}
                />
                <SettingsCard
                  name={translate('Notifications')}
                  path={`/settings/notifications`}
                  icon="fa-envelope-o"
                  description={translate(
                    'View, Create and Edit Email Notifications',
                  )}
                />
                <SettingsCard
                  name={translate('Robots')}
                  path={`/settings/robots`}
                  icon="fa-tasks"
                  description={translate('View, Create and Edit Robots')}
                />
                <SettingsCard
                  name={translate('Translations')}
                  path={`/settings/translations`}
                  icon="fa-globe"
                  description={translate('View, Create and Edit Translations')}
                />
              </Fragment>
            )}
            {(isSchedulerAdmin || isSchedulerManager) && (
              <SettingsCard
                name={translate('Schedulers')}
                path={`/settings/schedulers`}
                icon="fa-calendar"
                description={translate('View, Create and Manage Schedulers')}
              />
            )}
          </div>
        )}
      />
    </div>
  </div>
);

const mapStateToProps = state => ({
  isSpaceAdmin: state.app.profile.spaceAdmin,
  isSchedulerAdmin: selectHasRoleSchedulerAdmin(state),
  isSchedulerManager: selectHasRoleSchedulerManager(state),
});

export const SettingsNavigation = compose(connect(mapStateToProps, {}))(
  SettingsNavigationComponent,
);

import { all } from 'redux-saga/effects';
import { watchApp } from './sagas/memberApp';
import { watchMembers } from './sagas/members';
import { watchErrors } from './sagas/errors';
import { watchAlerts } from './sagas/alerts';
import { watchKinops } from '../lib/react-kinops-components';
import { watchLeads } from './sagas/leads';
import { watchCampaigns } from './sagas/campaigns';
import { watchForms } from './sagas/forms';
import { watchTeams } from './sagas/teams';
import { watchSettingsDatastore } from './sagas/settingsDatastore';
import { watchMessaging } from './sagas/messaging';
import { watchReports } from './sagas/reporting';

export default function* sagas() {
  yield all([
    watchErrors(),
    watchApp(),
    watchMembers(),
    watchAlerts(),
    watchKinops(),
    watchLeads(),
    watchCampaigns(),
    watchForms(),
    watchTeams(),
    watchSettingsDatastore(),
    watchMessaging(),
    watchReports()
  ]);
}

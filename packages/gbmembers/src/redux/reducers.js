import errorsReducer from './modules/errors';
import { reducer as layout } from './modules/layout';
import { reducer as app } from './modules/memberApp';
import { reducer as members } from './modules/members';
import { reducer as alerts } from './modules/alerts';
import { reducer as modalForm } from './modules/modalForm';
import { reducer as discussions } from './modules/discussions';
import { reducer as kinops } from '../lib/react-kinops-components';
import { reducer as leads } from './modules/leads';
import { reducer as campaigns } from './modules/campaigns';
import { reducer as auth } from './modules/auth';
import formsReducer from './modules/forms';
import { reducer as teams } from './modules/teams';
import { reducer as datastore } from './modules/settingsDatastore';
import { reducer as messaging } from './modules/messaging';
import { reducer as reporting } from './modules/reporting';

export default {
  errors: errorsReducer,
  app,
  layout,
  members,
  alerts,
  modalForm,
  discussions,
  kinops,
  leads,
  campaigns,
  auth,
  forms: formsReducer,
  teams,
  datastore,
  messaging,
  reporting
};

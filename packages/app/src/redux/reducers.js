import { reducer as alerts } from './modules/alerts';
import { reducer as journeyevents } from './modules/journeyevents';
import { reducer as help } from './modules/help';
import { reducer as auth } from './modules/auth';
import { reducer as config } from './modules/config';
import { reducer as kapps } from './modules/kapps';
import { reducer as layout } from './modules/layout';
import { reducer as loading } from './modules/loading';
import { reducer as profile } from './modules/profile';
import { reducer as space } from './modules/space';

export default {
  alerts,
  journeyevents,
  help,
  auth,
  config,
  layout,
  loading,
  kapps,
  profile,
  space,
};

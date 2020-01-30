import registrationsReducer from './modules/registrations';
import registrationReducer from './modules/registration';
import registrationCountsReducer from './modules/registrationCounts';
import systemErrorReducer from './modules/systemError';
import { reducer as members } from './modules/members';

export default {
  registrations: registrationsReducer,
  registration: registrationReducer,
  registrationCounts: registrationCountsReducer,
  systemError: systemErrorReducer,
  members,
};

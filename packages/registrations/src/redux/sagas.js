import { all } from 'redux-saga/effects';

import { watchRegistrations } from './sagas/registrations';
import {
  watchRegistration,
  watchRegistrationPoller,
} from './sagas/registration';
import { watchRegistrationCounts } from './sagas/registrationCounts';
import { watchMembers } from './sagas/members';

export default function*() {
  yield all([
    watchRegistrations(),
    watchRegistration(),
    watchRegistrationPoller(),
    watchRegistrationCounts(),
    watchMembers(),
  ]);
}

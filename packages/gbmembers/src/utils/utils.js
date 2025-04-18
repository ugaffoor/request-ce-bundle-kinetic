import isarray from 'isarray';
import { all, fork } from 'redux-saga/effects';
import $ from 'jquery';
import moment from 'moment';

export const zip = (array1, array2) =>
  array1.reduce(
    (reduction, key, i) => ({ ...reduction, [key]: array2[i] }),
    {},
  );

// Parameterize this for 'kapp' in addition to category.
export const namespace = (category, action) =>
  `@kd/common/${category}/${action}`;
export const noPayload = type => () => ({ type });
export const withPayload = (type, ...names) => (...data) =>
  names.length === 0
    ? { type, payload: data[0] }
    : { type, payload: zip(names, data) };

export function combineSagas(allSagas) {
  return function* combinedSagas() {
    yield all(allSagas.map(s => fork(s)));
  };
}

/**
 * Given a model and an attribute name returns the value of that attribute.
 * Should return undefined if attributes are missing or there is no attribute
 * value for the given attrName. It supports both attribute structures (arrays
 * that are returned directly from the API and objects that are returned by the
 * helpers in react-kinetic-core).
 *
 * @param model: { attributes }
 * @param attrName
 * @param defaultValue
 */
export const getAttributeValue = ({ attributes }, attrName, defaultValue) =>
  (isarray(attributes)
    ? attributes.filter(a => a.name === attrName).map(a => a.values[0])[0]
    : attributes && attributes[attrName] && attributes[attrName][0]) ||
  defaultValue;

export const getAttributeValues = ({ attributes }, attrName, defaultValue) => {
  const valuesArray = isarray(attributes)
    ? attributes.filter(a => a.name === attrName).map(a => a.values)[0]
    : attributes && attributes[attrName] && attributes[attrName];
  return !valuesArray || valuesArray.length === 0 ? defaultValue : valuesArray;
};

export const isMemberOf = (profile, name) => {
  const matchingMembership = profile.memberships.find(
    membership => membership.team.name === name,
  );
  return matchingMembership !== undefined;
};

export const getTeams = profile => {
  const matchingMemberships = profile.memberships.filter(
    membership =>
      membership.team.name !== 'Role' &&
      !membership.team.name.startsWith('Role::'),
  );
  return matchingMemberships
    ? matchingMemberships.map(membership => membership.team)
    : [];
};

export const getRoles = profile => {
  const matchingMemberships = profile.memberships.filter(membership =>
    membership.team.name.startsWith('Role::'),
  );
  return matchingMemberships
    ? matchingMemberships.map(membership => membership.team)
    : [];
};

const getSpaceConfig = (space, name, val) => {
  if (!space) {
    throw new Error(
      'getConfig did not receive space, it must be included on ' +
        'the kapp or manually passed.',
    );
  }
  if (!space.attributes) {
    throw new Error('getConfig failed, space must include attributes.');
  }
  // If the space has a value for the desired attribute return it otherwise
  // return the default value.
  return getAttributeValue(space, name, val);
};

const getKappConfig = (kapp, space, name, val) => {
  if (!kapp) {
    throw new Error(
      'getConfig did not receive kapp, it must be included on ' +
        'the form or manually passed.',
    );
  } else if (!kapp.attributes) {
    throw new Error('getConfig failed, kapp must include attributes');
  }
  // If the kapp has a value for the desired attribute return it otherwise
  // check the space.
  return (
    getAttributeValue(kapp, name) ||
    getSpaceConfig(space || kapp.space, name, val)
  );
};

const getFormConfig = (form, kapp, space, name, val) => {
  if (!form) {
    throw new Error(
      'getConfig did not receive form, it must be included on ' +
        'the submission or manually passed.',
    );
  } else if (!form.attributes) {
    throw new Error('getConfig failed, form must include attributes');
  }
  // If the form has a value for the desired attribute return it otherwise
  // the default value.
  return (
    getAttributeValue(form, name) ||
    getKappConfig(kapp || form.kapp, space, name, val)
  );
};

const getSubmissionConfig = (submission, form, kapp, space, name, def) => {
  if (!submission.values) {
    throw new Error(
      'Cannot perform getConfig when submission does not include values.',
    );
  }
  return (
    submission.values[name] ||
    getFormConfig(form || submission.form, kapp, space, name, def)
  );
};

/**
 * Given a model (via the submission / form / kapp / space options) will look
 * the given configuration value (values on a submission and attribute values on
 * the others). If not found on the present model it will propagate upwards
 * until it is found otherwise it will return an option default or undefined.
 *
 * @param name
 * @param defaultValue
 * @param submission
 * @param form
 * @param kapp
 * @param space
 */
export const getConfig = ({
  name,
  defaultValue,
  submission,
  form,
  kapp,
  space,
}) => {
  if (submission) {
    return getSubmissionConfig(
      submission,
      form,
      kapp,
      space,
      name,
      defaultValue,
    );
  } else if (form) {
    return getFormConfig(form, kapp, space, name, defaultValue);
  } else if (kapp) {
    return getKappConfig(kapp, space, name, defaultValue);
  } else if (space) {
    return getSpaceConfig(space, name, defaultValue);
  } else {
    throw new Error(
      'getConfig must be called with at least one of: ' +
        'submission, form, kapp, space.',
    );
  }
};

export const displayableFormPredicate = form =>
  form.type === 'Service' && form.status === 'Active';

export const removeExcludedMembers = (allMembers, excluded) => {
  let members = allMembers.filter(member => {
    return !excluded.includes(member.id) && member.values['Opt-Out'] !== 'YES';
  });
  return members;
};
export const matchesMemberFilter = (space, allMembers, filters, excluded) => {
  let members = allMembers
    .filter(member => {
      let match = true;
      if (excluded !== undefined && excluded.includes(member.id)) {
        return false;
      }
      return match;
    })
    .filter(member => {
      let match = true;
      let startDate = null,
        endDate = null;

      for (var i = 0; i < filters.length; i++) {
        let keys = Object.keys(filters[i]);
        if (keys[0] === 'specificMembersFilter') {
          if ($.inArray(member.id, filters[i][keys[0]].specificMembers) < 0) {
            match = false;
          }
        } else if (keys[0] === 'joiningDateFilter') {
          startDate =
            filters[i][keys[0]].startDate !== undefined
              ? moment(filters[i][keys[0]].startDate, 'YYYY-MM-DD').startOf(
                  'day',
                )
              : undefined;
          endDate =
            filters[i][keys[0]].endDate !== undefined
              ? moment(filters[i][keys[0]].endDate, 'YYYY-MM-DD').endOf('day')
              : undefined;
          if (
            startDate !== undefined &&
            endDate === undefined &&
            !moment(member.values['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
              startDate,
            )
          ) {
            match = false;
          } else if (
            endDate !== undefined &&
            startDate === undefined &&
            !moment(member.values['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
              endDate,
            )
          ) {
            match = false;
          } else if (
            startDate !== undefined &&
            endDate !== undefined &&
            !(
              moment(member.values['Date Joined'], 'YYYY-MM-DD').isSameOrAfter(
                startDate,
              ) &&
              moment(member.values['Date Joined'], 'YYYY-MM-DD').isSameOrBefore(
                endDate,
              )
            )
          ) {
            match = false;
          }
        } else if (keys[0] === 'genderFilter') {
          if (member.values['Gender'] !== filters[i][keys[0]].gender) {
            match = false;
          }
        } else if (keys[0] === 'ageFilter') {
          let years = moment().diff(member.values['DOB'], 'years');
          if (
            filters[i][keys[0]].fromAge !== undefined &&
            filters[i][keys[0]].toAge !== ''
          ) {
            if (
              !(
                years >= filters[i][keys[0]].fromAge &&
                years <= filters[i][keys[0]].toAge
              )
            ) {
              match = false;
            }
          }
          if (
            filters[i][keys[0]].fromAge !== undefined &&
            filters[i][keys[0]].toAge === ''
          ) {
            if (!(years >= filters[i][keys[0]].fromAge)) {
              match = false;
            }
          }
          if (
            filters[i][keys[0]].fromAge === undefined &&
            filters[i][keys[0]].toAge !== ''
          ) {
            if (!(years <= filters[i][keys[0]].toAge)) {
              match = false;
            }
          }
        } else if (keys[0] === 'statusFilter') {
          if (
            $.inArray(member.values['Status'], filters[i][keys[0]].status) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'programFilter') {
          if (
            $.inArray(
              member.values['Ranking Program'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'beltFilter') {
          if (
            $.inArray(
              member.values['Ranking Belt'],
              filters[i][keys[0]].belts,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'additionalProgram1Filter') {
          if (
            $.inArray(
              member.values['Additional Program 1'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'additionalProgram2Filter') {
          if (
            $.inArray(
              member.values['Additional Program 2'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'memberTypeFilter') {
          if (member.values['Member Type'] !== filters[i][keys[0]].memberType) {
            match = false;
          }
        } else if (keys[0] === 'billingMemberFilter') {
          if (!member.values['Billing Customer Id']) {
            match = false;
          }
        } else if (keys[0] === 'nonPayingFilter') {
          if (member.values['Non Paying'] !== 'YES') {
            match = false;
          }
        } else if (keys[0] === 'waiverComplianceFilter') {
          if (
            match &&
            getAttributeValue(space, 'Member Waiver Compliance Date') !==
              undefined &&
            getAttributeValue(space, 'Member Waiver Compliance Date') !== '' &&
            getAttributeValue(space, 'Member Waiver Compliance Date') !== null
          ) {
            if (
              member.values['Waiver Complete Date'] === undefined ||
              moment(
                getAttributeValue(space, 'Member Waiver Compliance Date'),
              ).isAfter(member.values['Waiver Complete Date'])
            ) {
              match = true;
            } else {
              match = false;
            }
          } else {
            match = false;
          }
        }
      }
      return match;
    });
  return members;
};
export const removeExcludedLeads = (allLeads, excluded) => {
  let leads = allLeads.filter(lead => {
    return !excluded.includes(lead.id) && lead.values['Opt-Out'] !== 'YES';
  });
  return leads;
};
export const matchesLeadFilter = (allLeads, filters) => {
  let leads = allLeads
    .filter(lead => lead.values['Status'] !== 'Converted')
    .filter(lead => {
      let match = true;
      let startDate = null,
        endDate = null;

      for (var i = 0; i < filters.length; i++) {
        let keys = Object.keys(filters[i]);
        if (keys[0] === 'specificLeadsFilter') {
          if ($.inArray(lead.id, filters[i][keys[0]].specificLeads) < 0) {
            match = false;
          }
        } else if (keys[0] === 'createdDateFilter') {
          startDate = moment(
            filters[i][keys[0]].startDate,
            'YYYY-MM-DD',
          ).startOf('day');
          endDate = moment(filters[i][keys[0]].endDate, 'YYYY-MM-DD').endOf(
            'day',
          );

          if (
            !(
              moment(lead.createdAt).isSameOrAfter(startDate) &&
              moment(lead.createdAt).isSameOrBefore(endDate)
            )
          ) {
            match = false;
          }
        } else if (keys[0] === 'genderFilter') {
          if (lead.values['Gender'] !== filters[i][keys[0]].gender) {
            match = false;
          }
        } else if (keys[0] === 'ageFilter') {
          let years = moment().diff(lead.values['DOB'], 'years');
          if (
            !(
              years >= filters[i][keys[0]].fromAge &&
              years <= filters[i][keys[0]].toAge
            )
          ) {
            match = false;
          }
        } else if (keys[0] === 'statusFilter') {
          if (
            $.inArray(lead.values['Status'], filters[i][keys[0]].status) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'programFilter') {
          if (
            $.inArray(
              lead.values['Interest in Program'],
              filters[i][keys[0]].programs,
            ) < 0
          ) {
            match = false;
          }
        } else if (keys[0] === 'leadReferredFilter') {
          if (
            $.inArray(lead.values['Source'], filters[i][keys[0]].leadReferred) <
            0
          ) {
            match = false;
          }
        } else if (keys[0] === 'sourceReference1Filter') {
          if (
            lead.values['Source Reference 1'] !==
            filters[i][keys[0]].sourceReference1
          ) {
            match = false;
          }
        } else if (keys[0] === 'sourceReference2Filter') {
          if (
            lead.values['Source Reference 2'] !==
            filters[i][keys[0]].sourceReference2
          ) {
            match = false;
          }
        } else if (keys[0] === 'sourceReference3Filter') {
          if (
            lead.values['Source Reference 3'] !==
            filters[i][keys[0]].sourceReference3
          ) {
            match = false;
          }
        } else if (keys[0] === 'sourceReference4Filter') {
          if (
            lead.values['Source Reference 4'] !==
            filters[i][keys[0]].sourceReference4
          ) {
            match = false;
          }
        }
      }
      return match;
    });
  return leads;
};

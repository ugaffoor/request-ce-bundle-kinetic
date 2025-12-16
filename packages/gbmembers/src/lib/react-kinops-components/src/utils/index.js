import isarray from 'isarray';

export const namespace = (category, action) =>
  `@kd/kinops/queue/${category}/${action}`;
export const noPayload = type => () => ({ type });
export const withPayload = type => payload => ({ type, payload });

/**
 * Given a model and an attribute name returns the value of that attribute.
 * Should return undefined if attributes are missing or there is no attribute
 * value for the given attrName. It supports both attribute structures (arrays
 * that are returned directly from the API and objects that are returned by the
 * helpers in @kineticdata/react).
 *
 * @param model: { attributes }
 * @param attrName
 * @param defaultValue
 */
export const getAttributeValue = ({ attributes }, attrName, defaultValue) => {
  if (isarray(attributes)) {
    return attributes.filter(a => a.name === attrName).map(a => a.values[0])[0];
  } else if (attributes && attributes[attrName] && attributes[attrName][0]) {
    return attributes[attrName][0];
  } else if (defaultValue) {
    return defaultValue;
  }
  return undefined;
};

function updateSpaceAttribute(attrs, attrName, attrValue) {
  if (isarray(attrs)) {
    if (attrs.filter(a => a.name === attrName).map(a => a.values[0])) {
      let idx = attrs.findIndex(a => a.name === attrName);
      if (idx != -1) {
        attrs[idx].values[0] = attrValue;
      } else {
        attrs[attrs.length] = {
          name: attrName,
          values: [attrValue],
        };
      }
    } else {
      attrs[attrs.length] = { name: attrName, values: [attrValue] };
    }
  } else {
    if (attrs[attrName]) {
      attrs[attrName][0] = attrValue;
    } else {
      attrs[attrName] = [attrValue];
    }
  }
}
export const setAttributeValue = (
  { attributes, attributesMap },
  attrName,
  attrValue,
) => {
  if (attributesMap === undefined) {
    updateSpaceAttribute(attributes, attrName, attrValue);
  }

  if (attributesMap !== undefined) {
    updateSpaceAttribute(attributesMap, attrName, attrValue);
  }
};

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

export const getColor = string => {
  /* eslint-disable no-bitwise, operator-assignment */
  let hash = 0;
  const chars = [...(string ? string.toString() : '')];
  chars.forEach(char => {
    hash = (hash << 5) - hash + char.charCodeAt(0);
    hash = hash & hash;
  });
  const color = `000000${(0xbbbbbb & hash).toString(16)}`
    .slice(-6)
    .toUpperCase();
  return `#${color.substring(4)}${color.substring(0, 4)}`;
  /* eslint-enable no-bitwise, operator-assignment */
};

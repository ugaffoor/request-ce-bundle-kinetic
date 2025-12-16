export const zip = (array1, array2) =>
  array1.reduce(
    (reduction, key, i) => ({ ...reduction, [key]: array2[i] }),
    {},
  );

export const namespace = (category, action) =>
  `@kd/kinops/member/${category}/${action}`;
export const noPayload = type => () => ({ type });
export const withPayload = (type, ...names) => (...data) =>
  names.length === 0
    ? { type, payload: data[0] }
    : { type, payload: zip(names, data) };

export const getAttributeValue = (value, defaultValue, ...sources) => {
  const best = sources.find(
    source =>
      source !== undefined &&
      source.attributes &&
      source.attributes.findIndex(item => item['name'] === value) !== -1,
  );

  if (best) {
    return best.attributes.find(item => item['name'] === value)['values'];
  }

  return [defaultValue];
};

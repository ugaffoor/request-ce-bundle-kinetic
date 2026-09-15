/**
 * Translation that cannot take a page down.
 *
 * K.translate comes from Kinetic's head.js and needs an active Kinetic form
 * for its translation context -- it reaches into K.activeForm for it. The
 * reports keep a hidden dummy form loaded for exactly this, but the context
 * is not always usable at the moment a report builds its rows, and when it is
 * not, K.translate throws from inside the per-member loop and the whole
 * report fails to render.
 *
 * A label that cannot be translated is shown untranslated instead. That is
 * the right trade: an English "Fortnightly" on a French portal is a blemish;
 * a report that never appears is a bug.
 */

// Only successes are cached, so if the translation context becomes usable
// later, values picked up after that are translated rather than stuck on the
// fallback. The same handful of labels recur across every row, so this also
// saves a K.translate call per member.
const cache = new Map();
let warned = false;

export const translate = value => {
  if (value === undefined || value === null || value === '') {
    return value;
  }

  if (cache.has(value)) {
    return cache.get(value);
  }

  try {
    const K = window.K;
    const translated =
      K && typeof K.translate === 'function' ? K.translate(value) : value;
    cache.set(value, translated);
    return translated;
  } catch (e) {
    // Once per page load is enough -- this fires per label otherwise.
    if (!warned) {
      warned = true;
      console.warn(
        '[reports] Kinetic translation is unavailable; showing labels untranslated.',
        e,
      );
    }
    return value;
  }
};

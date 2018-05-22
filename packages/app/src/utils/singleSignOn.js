export const singleSignOn = (endpoint, dimensions, target = '_blank') =>
  new Promise((resolve, reject) => {
    const options = { ...dimensions, ...getPopupPosition(window, dimensions) };
    const popup = window.open(endpoint, target, stringifyOptions(options));

    // Create an event handler that closes the popup window if we focus the
    // parent window
    const windowFocusHandler = () => {
      popup.close();
      window.removeEventListener('focus', windowFocusHandler);
    };
    window.addEventListener('focus', windowFocusHandler);

    // Check the status of the popup window.  Was it closed, was it redirected
    // back to the same host as the parent window, othewise try again later.
    const checkPopup = () => {
      if (popup.closed) {
        reject('Single Sign-on cancelled');
      } else if (sameHost(popup, window)) {
        resolve();
      } else {
        setTimeout(checkPopup, 100);
      }
    };

    // Start the recursive checkPopup calls.
    setTimeout(checkPopup, 100);
  });

// Checks to see if the parent window and popup window have the same host, wraps
// the check in try/catch because trying to access the location of the popup
// throws an error if it is not the same host but we just want `false`.
const sameHost = (window, popup) => {
  try {
    return window.location.host === popup.location.host;
  } catch (e) {
    return false;
  }
};

// window.open takes a string of options rather than a JS object so we use this
// helper to do that conversion.
const stringifyOptions = options =>
  Object.keys(options)
    .reduce(
      (reduction, option) => [...reduction, `${option}=${options[option]}`],
      [],
    )
    .join(',');

// Given the dimensions of the popup and the parent window returns the correct
// position for the popup to be centered within the parent.
const getPopupPosition = (window, { width, height }) => ({
  top: window.screenY + window.innerHeight / 2 - height / 2,
  left: window.screenX + window.innerWidth / 2 - width / 2,
});

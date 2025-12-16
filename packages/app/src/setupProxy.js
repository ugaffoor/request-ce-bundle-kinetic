const setupProxy = require('../proxyhelper');

module.exports = function(app) {
  const configs = setupProxy.getProxyConfig(app);
  configs.forEach(config => config.proxy());
};

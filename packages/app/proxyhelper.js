const { createProxyMiddleware: proxy } = require('http-proxy-middleware');
const removeSecure = cookie => cookie.replace(/;\s*Secure/i, '');
const removeSameSiteNone = cookie => cookie.replace(/;\s*SameSite=None/i, '');

const getProxyData = request => ({
  host: request.socket._host,
  scheme: request.agent.protocol.replace(':', ''),
  method: request.method,
  path: request.path,
});

const getRequestData = request => ({
  host: request.headers.host,
  scheme: request.headers['x-forwarded-proto'],
  method: request.method,
  path: request.url,
});

const getResponseData = response => ({
  statusCode: response.statusCode,
  message: response.message,
  host: response.socket.servername,
});

const defaultProxyLogger = ({
  proxyRequest,
  originalRequest,
  proxyResponse,
}) => {
  try {
    if (proxyRequest) {
      const proxyData = getProxyData(proxyRequest);
      const originalData = getRequestData(originalRequest);
      console.log(
        `[proxy] [original] -> ${originalData.method}\t${
          originalData.scheme
        }\t${originalData.host}\t${originalData.path}`,
      );
      console.log(
        `[proxy] [proxied]  -> ${proxyData.method}\t${proxyData.scheme}\t${
          proxyData.host
        }\t${proxyData.path}`,
      );
    } else if (proxyResponse) {
      const responseData = getResponseData(proxyResponse);
      const requestData = getRequestData(originalRequest);
      console.log(
        `[proxy] [original] <- ${responseData.statusCode}\t${
          requestData.method
        }\t${requestData.scheme}\t${requestData.host} (${responseData.host})\t${
          requestData.path
        }`,
      );
    }
  } catch (e) {
    console.warn(
      '[proxy] There was a problem logging proxy request/response information',
      e,
    );
  }
};

const setupProxy = ({
  target = process.env.REACT_APP_PROXY_HOST,
  proxyLogger,
  pathRewrite,
  onlyTenant = false,
} = {}) => {
  return {
    target,
    secure: false,
    pathRewrite,
    changeOrigin: true,
    onProxyReq: (proxyRequest, originalRequest) => {
      // Browsers may send Origin headers even with same-origin
      // requests. To prevent CORS issues, we have to change
      // the Origin to match the target URL.
      if (proxyRequest.getHeader('origin')) {
        proxyRequest.setHeader('origin', target);
      }

      if (
        !onlyTenant &&
        process.env.REACT_APP_PROXY_SUBDOMAIN &&
        !proxyRequest.path.endsWith('pack') &&
        !proxyRequest.path.endsWith('favicon.ico')
      ) {
        proxyRequest.setHeader(
          'X-Kinetic-Subdomain',
          process.env.REACT_APP_PROXY_SUBDOMAIN,
        );
        proxyRequest.path =
          '/' + process.env.REACT_APP_PROXY_SUBDOMAIN + proxyRequest.path;
      }

      if (process.env.PROXY_DEBUGGING)
        (proxyLogger || defaultProxyLogger)({
          proxyRequest,
          originalRequest,
        });
    },
    onProxyRes: (proxyResponse, originalRequest) => {
      if (process.env.PROXY_DEBUGGING)
        (proxyLogger || defaultProxyLogger)({
          proxyResponse,
          originalRequest,
        });

      const setCookie = proxyResponse.headers['set-cookie'];
      if (setCookie && originalRequest.protocol === 'http') {
        proxyResponse.headers['set-cookie'] = Array.isArray(setCookie)
          ? setCookie.map(removeSecure).map(removeSameSiteNone)
          : removeSameSiteNone(removeSecure(setCookie));
      }
    },
  };
};

const getProxyConfig = (
  app,
  {
    mainTarget = process.env.REACT_APP_PROXY_HOST,
    loghubTarget = process.env.REACT_APP_LOGHUB_PROXY_HOST,
    systemCoordinatorTarget = process.env.REACT_APP_SYS_COORDINATOR_PROXY_HOST,
    integratorTarget = process.env.REACT_APP_INTEGRATOR_PROXY_HOST,
    proxyLogger,
  } = {},
) => {
  const mainPaths = [
    '**',
    '!/',
    '!/favicon.ico',
    '!/index.html',
    '!/images/**',
    '!/static/**',
    '!/sockjs-node',
    '!/manifest.json',
    '!/*.hot-update.js*',
  ];

  const finalConfigs = [
    {
      paths: mainPaths,
      options: setupProxy({ target: mainTarget, proxyLogger }),
    },
  ];

  if (loghubTarget) {
    // If we're overriding the underlying Loghub host, bypass it in the main.
    mainPaths.push('!/app/loghub/**');
    const options = setupProxy({
      target: loghubTarget,
      proxyLogger,
      pathRewrite: {
        '^/app/loghub': '/app',
      },
    });
    finalConfigs.push({ paths: ['/app/loghub/**'], options });
  }

  if (systemCoordinatorTarget) {
    // If we're overriding the underlying Loghub host, bypass it in the main.
    mainPaths.push('!/app/system-coordinator/**');
    const options = setupProxy({
      target: systemCoordinatorTarget,
      proxyLogger,
      pathRewrite: {
        '^/app/system-coordinator': '/app',
      },
    });
    finalConfigs.push({ paths: ['/app/system-coordinator/**'], options });
  }

  if (integratorTarget) {
    // If we're overriding the underlying Integrator host, bypass it in the main.
    mainPaths.push('!/app/integrator/**');
    const options = setupProxy({
      target: integratorTarget,
      proxyLogger,
      pathRewrite: {
        '^/app/integrator/': '/',
      },
      onlyTenant: true,
    });
    finalConfigs.push({ paths: ['/app/integrator/**'], options });
  }

  return finalConfigs.map(config => {
    config.proxy = ({
      paths = config.paths,
      options = config.options,
    } = {}) => {
      app.use(proxy(paths, options));
    };
    return config;
  });
};

setupProxy.getProxyConfig = getProxyConfig;

module.exports = setupProxy;
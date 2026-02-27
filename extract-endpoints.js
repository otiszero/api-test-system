const fs = require('fs');
const yaml = require('js-yaml');

const spec = yaml.load(fs.readFileSync('input/openapi.yaml', 'utf8'));
const apiConfig = JSON.parse(fs.readFileSync('config/api.config.json', 'utf8'));
const authConfig = JSON.parse(fs.readFileSync('config/auth.config.json', 'utf8'));

const paths = spec.paths || {};
const blacklist = apiConfig.endpointFilter?.blacklist || [];

// Convert wildcard patterns to regex
const blacklistRegex = blacklist.map(pattern => {
  const regexPattern = pattern.replace(/\*/g, '.*').replace(/\//g, '\\/');
  return new RegExp('^' + regexPattern + '$');
});

const endpoints = [];

for (const [path, methods] of Object.entries(paths)) {
  const isBlacklisted = blacklistRegex.some(regex => regex.test(path));

  if (isBlacklisted) continue;

  for (const method of ['get', 'post', 'put', 'patch', 'delete']) {
    if (methods[method]) {
      const op = methods[method];
      endpoints.push({
        path,
        method: method.toUpperCase(),
        operationId: op.operationId || '',
        summary: op.summary || '',
        requiresAuth: op.security ? true : false,
        tags: op.tags || [],
        parameters: op.parameters || [],
        requestBody: op.requestBody || null
      });
    }
  }
}

const userToken = authConfig.accounts?.user?.[0]?.token || '';
const hasValidToken = userToken.length > 20 && !userToken.includes('FILL_ME');

console.log(JSON.stringify({
  baseUrl: apiConfig.baseUrl,
  timeout: apiConfig.timeout,
  authType: authConfig.type,
  hasToken: hasValidToken,
  token: userToken,
  totalEndpoints: endpoints.length,
  endpoints: endpoints
}, null, 2));

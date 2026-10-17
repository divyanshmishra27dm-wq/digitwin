/**
 * Middleware: sharedKeyAuth
 * Validates access key passed via:
 * 1. Query parameter: ?key=YOUR_KEY or ?apiKey=YOUR_KEY
 * 2. Header: x-api-key: YOUR_KEY
 * 3. Header: Authorization: Bearer YOUR_KEY or ApiKey YOUR_KEY
 */
function sharedKeyAuth(req, res, next) {
  const configuredKey = (process.env.SHARED_ACCESS_KEY || 'ndt_twin_access_key_99').trim();

  // 1. Check Query parameter (?key=... or ?apiKey=...)
  let providedKey = req.query.key || req.query.apiKey;

  // 2. Check x-api-key header
  if (!providedKey && req.headers['x-api-key']) {
    providedKey = req.headers['x-api-key'];
  }

  // 3. Check Authorization header
  if (!providedKey && req.headers.authorization) {
    const authHeader = req.headers.authorization.trim();
    if (authHeader.toLowerCase().startsWith('bearer ')) {
      providedKey = authHeader.slice(7).trim();
    } else if (authHeader.toLowerCase().startsWith('apikey ')) {
      providedKey = authHeader.slice(7).trim();
    } else {
      providedKey = authHeader;
    }
  }

  if (!providedKey || providedKey.trim() !== configuredKey) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing or invalid access key. Access to all digital twins requires a valid key.',
      usageHelp: {
        method1_urlQuery: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?key=YOUR_KEY`,
        method2_header: { 'x-api-key': 'YOUR_KEY' },
        method3_authHeader: { 'Authorization': 'Bearer YOUR_KEY' },
      },
    });
  }

  next();
}

module.exports = sharedKeyAuth;

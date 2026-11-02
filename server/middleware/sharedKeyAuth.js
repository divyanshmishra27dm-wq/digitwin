const ApiKey = require('../models/ApiKey');

/**
 * Middleware: sharedKeyAuth
 * Validates access key passed via:
 * 1. Query parameter: ?key=YOUR_KEY or ?apiKey=YOUR_KEY
 * 2. Header: x-api-key: YOUR_KEY
 * 3. Header: Authorization: Bearer YOUR_KEY or ApiKey YOUR_KEY
 *
 * If the key matches an admin-created ApiKey in the DB:
 *   - Only twins allocated to that key are authorized
 *   - Tracks usage stats and checks revocation/expiration
 *
 * Fallback:
 *   - If matching master process.env.SHARED_ACCESS_KEY, grants universal access
 */
async function sharedKeyAuth(req, res, next) {
  const masterKey = (process.env.SHARED_ACCESS_KEY || 'ndt_twin_access_key_99').trim();

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

  if (!providedKey || !providedKey.trim()) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Missing API access key. Please supply a valid API key via header (x-api-key or Authorization) or query param (?key=YOUR_KEY).',
      usageHelp: {
        method1_urlQuery: `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}?key=YOUR_KEY`,
        method2_header: { 'x-api-key': 'YOUR_KEY' },
        method3_authHeader: { 'Authorization': 'Bearer YOUR_KEY' },
      },
    });
  }

  const cleanKey = providedKey.trim();

  try {
    // 1. Check if the key exists in Database (Admin-created scoped API Key)
    const dbApiKey = await ApiKey.findOne({ key: cleanKey });

    if (dbApiKey) {
      if (dbApiKey.status === 'revoked') {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: 'This API access key has been revoked by an administrator.',
        });
      }

      if (dbApiKey.expiresAt && new Date(dbApiKey.expiresAt) < new Date()) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `This API access key expired on ${new Date(dbApiKey.expiresAt).toISOString()}.`,
        });
      }

      // Record usage asynchronously
      dbApiKey.usageCount = (dbApiKey.usageCount || 0) + 1;
      dbApiKey.lastUsedAt = new Date();
      dbApiKey.save().catch((err) => console.warn('[sharedKeyAuth] Failed to update usage:', err.message));

      // Attach key metadata and allocated models
      req.apiKeyDoc = {
        keyId: dbApiKey._id,
        name: dbApiKey.name,
        key: dbApiKey.key,
        allowedTwinIds: (dbApiKey.twins || []).map((id) => id.toString()),
        isUniversal: false,
      };

      return next();
    }

    // 2. Check if key matches master universal environment key
    if (cleanKey === masterKey) {
      req.apiKeyDoc = {
        name: 'Master Shared Access Key',
        key: masterKey,
        allowedTwinIds: [],
        isUniversal: true,
      };
      return next();
    }

    // 3. Invalid Key
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: 'Invalid API access key. Key does not exist or has been removed.',
    });
  } catch (err) {
    console.error('[sharedKeyAuth] Error verifying key:', err);
    return res.status(500).json({
      success: false,
      error: 'InternalServerError',
      message: 'Could not verify API access key.',
    });
  }
}

module.exports = sharedKeyAuth;

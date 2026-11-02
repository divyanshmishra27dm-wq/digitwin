const express = require('express');
const router = express.Router();
const { authenticate, requireAdmin } = require('../middleware/auth');
const apiKeyController = require('../controllers/apiKeyController');

// All API Key management routes are strictly restricted to Administrators
router.use(authenticate, requireAdmin);

// GET /api/api-keys — List all API keys
router.get('/', apiKeyController.listApiKeys);

// POST /api/api-keys — Create new API key with model allocations
router.post('/', apiKeyController.createApiKey);

// GET /api/api-keys/:id — Get details of a single API key
router.get('/:id', apiKeyController.getApiKey);

// PUT /api/api-keys/:id — Update key or change allocated models
router.put('/:id', apiKeyController.updateApiKey);

// DELETE /api/api-keys/:id — Delete an API key
router.delete('/:id', apiKeyController.deleteApiKey);

// POST /api/api-keys/:id/regenerate — Regenerate token
router.post('/:id/regenerate', apiKeyController.regenerateKey);

module.exports = router;

const express = require('express');
const router = express.Router();
const awarenessController = require('../controllers/awarenessController');
const { authenticate, requireAdmin } = require('../middleware/auth');

// 1. Ingest manual web link (User or Admin for twins they own/manage)
router.post('/ingest-url', authenticate, awarenessController.ingestWebLink);

// 2. Trigger Aware Mode (Admin only)
router.post('/trigger-aware-mode', authenticate, requireAdmin, awarenessController.triggerAwareMode);

// 3. Awareness feed (All users can view technology awareness)
router.get('/feed', authenticate, awarenessController.getAwarenessFeed);

// 4. Awareness statistics
router.get('/stats', authenticate, awarenessController.getAwarenessStats);

// 5. Execution logs (Admin only)
router.get('/logs', authenticate, requireAdmin, awarenessController.getAwarenessLogs);

// 6. Delete awareness entry (Admin or owner)
router.delete('/entry/:id', authenticate, awarenessController.deleteAwarenessEntry);

module.exports = router;

const express = require('express');
const router = express.Router();
const sharedKeyAuth = require('../middleware/sharedKeyAuth');
const sharedTwinController = require('../controllers/sharedTwinController');

// All shared endpoints require the valid shared key
router.use(sharedKeyAuth);

// GET /api/shared/twins (or /api/twins/shared) — All digital twins across all departments
router.get('/twins', sharedTwinController.getAllSharedTwins);
router.get('/', sharedTwinController.getAllSharedTwins);

// GET /api/shared/twins/:id — Detailed view of twin and knowledge
router.get('/twins/:id', sharedTwinController.getSharedTwinById);
router.get('/:id', sharedTwinController.getSharedTwinById);

// POST /api/shared/twins/chat — Chat with any twin using the shared key
router.post('/twins/chat', sharedTwinController.chatSharedTwin);
router.post('/chat', sharedTwinController.chatSharedTwin);

module.exports = router;

const express = require('express');
const router = express.Router();
const twinController = require('../controllers/twinController');
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// CV parsing route (accessible to authenticated users)
router.post('/parse-cv', authenticate, upload.single('file'), twinController.parseCV);

// Ingest documents into Twin's RAG knowledge base
router.post('/:id/documents', authenticate, upload.array('files', 10), twinController.uploadTwinDocuments);

router.get('/', authenticate, twinController.listTwins);
router.get('/global-requests', authenticate, requireAdmin, twinController.listGlobalRequests);
router.get('/:id', authenticate, twinController.getTwin);
router.post('/', authenticate, twinController.createTwin);
router.patch('/:id', authenticate, twinController.updateTwin);
router.delete('/:id', authenticate, twinController.deleteTwin);
router.post('/:id/publish', authenticate, twinController.publishTwin);
router.post('/:id/unpublish', authenticate, twinController.unpublishTwin);
router.post('/:id/request-global', authenticate, twinController.requestGlobalAccess);
router.post('/:id/review-global', authenticate, requireAdmin, twinController.reviewGlobalAccess);

router.get('/:twinId/knowledge', authenticate, knowledgeController.listKnowledge);
router.post('/:twinId/knowledge', authenticate, knowledgeController.createKnowledge);

module.exports = router;

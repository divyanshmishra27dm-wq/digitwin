const express = require('express');
const router = express.Router();
const knowledgeController = require('../controllers/knowledgeController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.patch('/:id', authenticate, requireAdmin, knowledgeController.updateKnowledge);
router.delete('/:id', authenticate, requireAdmin, knowledgeController.deleteKnowledge);

module.exports = router;

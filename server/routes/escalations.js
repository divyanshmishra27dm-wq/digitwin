const express = require('express');
const router = express.Router();
const escalationController = require('../controllers/escalationController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.post('/', authenticate, escalationController.createEscalation);
router.get('/', authenticate, requireAdmin, escalationController.listEscalations);
router.patch('/:id', authenticate, requireAdmin, escalationController.updateEscalation);
router.post('/:id/answer', authenticate, requireAdmin, escalationController.answerEscalation);

module.exports = router;

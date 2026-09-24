const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const roundtableController = require('../controllers/roundtableController');

router.use(authenticate);

router.get('/', roundtableController.listRoundtables);
router.post('/', roundtableController.createRoundtable);
router.get('/:id', roundtableController.getRoundtable);
router.post('/:id/turn', roundtableController.triggerTurn);
router.post('/:id/user-message', roundtableController.addUserMessage);
router.post('/:id/auto-round', roundtableController.autoRound);
router.post('/:id/summon', roundtableController.summonTwins);
router.post('/:id/summarize', roundtableController.summarize);
router.delete('/:id', roundtableController.deleteRoundtable);

module.exports = router;

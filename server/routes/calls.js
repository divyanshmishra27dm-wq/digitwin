const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const callController = require('../controllers/callController');

router.use(authenticate);

router.get('/', callController.listCalls);
router.post('/', callController.createCall);
router.get('/:id', callController.getCall);
router.post('/:id/speech', callController.userSpeech);
router.post('/:id/next-speaker', callController.triggerNextSpeaker);
router.post('/:id/invite', callController.inviteTwins);
router.post('/:id/end', callController.endCall);
router.delete('/:id', callController.deleteCall);

module.exports = router;

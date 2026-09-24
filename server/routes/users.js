const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, userController.listUsers);
router.post('/', authenticate, requireAdmin, userController.createUser);
router.patch('/me', authenticate, userController.updateUser);
router.patch('/me/password', authenticate, userController.updatePassword);
router.patch('/:id', authenticate, requireAdmin, userController.updateUserById);
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser);

module.exports = router;


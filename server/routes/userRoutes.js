const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { protect, restrictTo, hasPermission } = require('../middleware/auth');
const { ROLES, PERMISSIONS } = require('../config/roles');

router.use(protect);

// Admin only routes
router.get('/stats', restrictTo(ROLES.ADMIN), userController.getUserStats);
router.get('/activity-logs', restrictTo(ROLES.ADMIN), userController.getActivityLogs);

router
  .route('/')
  .get(restrictTo(ROLES.ADMIN), userController.getAllUsers)
  .post(restrictTo(ROLES.ADMIN), userController.createUser);

router
  .route('/:id')
  .get(restrictTo(ROLES.ADMIN), userController.getUser)
  .patch(restrictTo(ROLES.ADMIN), userController.updateUser)
  .delete(restrictTo(ROLES.ADMIN), userController.deleteUser);

module.exports = router;

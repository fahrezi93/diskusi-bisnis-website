import { Router } from 'express';
import * as notificationController from '../controllers/notification.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// @route   GET /api/notifications
// @desc    Get user's notifications
// @access  Private
router.get('/', authenticateToken, notificationController.getNotifications);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', authenticateToken, notificationController.markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticateToken, notificationController.markAllAsRead);

// @route   POST /api/notifications/test
// @desc    Create test notifications (for development)
// @access  Private
router.post('/test', authenticateToken, notificationController.createTestNotifications);

export default router;

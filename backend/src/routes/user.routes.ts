import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// @route   GET /api/users
// @desc    Get all users
// @access  Public
router.get('/', userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user profile
// @access  Public
router.get('/:id', userController.getUserProfile);

// @route   PUT /api/users/:id
// @desc    Update user profile
// @access  Private (Owner only)
router.put('/:id', authenticateToken, userController.updateUserProfile);

// @route   GET /api/users/:id/questions
// @desc    Get user's questions
// @access  Public
router.get('/:id/questions', userController.getUserQuestions);

// @route   GET /api/users/:id/answers
// @desc    Get user's answers
// @access  Public
router.get('/:id/answers', userController.getUserAnswers);

// @route   POST /api/users/sample
// @desc    Create sample users for testing
// @access  Public (development only)
router.post('/sample', userController.createSampleUsers);

export default router;

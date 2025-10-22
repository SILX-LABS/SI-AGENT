/**
 * User Routes
 * 
 * User management and profile routes.
 */

import { Router } from 'express';
import { UserController } from '@/controllers/UserController';
import { authenticate, authorize } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/errorHandler';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get(
  '/profile',
  asyncHandler(userController.getProfile.bind(userController))
);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  asyncHandler(userController.updateProfile.bind(userController))
);

/**
 * @route   GET /api/users/api-usage
 * @desc    Get user's API usage statistics
 * @access  Private
 */
router.get(
  '/api-usage',
  asyncHandler(userController.getApiUsage.bind(userController))
);

/**
 * @route   DELETE /api/users/account
 * @desc    Delete user account
 * @access  Private
 */
router.delete(
  '/account',
  asyncHandler(userController.deleteAccount.bind(userController))
);

/**
 * @route   GET /api/users
 * @desc    Get all users (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/',
  authorize('admin'),
  asyncHandler(userController.getAllUsers.bind(userController))
);

export default router;

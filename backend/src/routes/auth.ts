/**
 * Authentication Routes
 * 
 * Handles Clerk-based authentication and user session management.
 * Most auth operations are handled by Clerk on the frontend,
 * these routes provide backend integration points.
 */

import { Router } from 'express';
import { ClerkAuthController } from '@/controllers/ClerkAuthController';
import { authenticate, optionalAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/errorHandler';

const router = Router();
const authController = new ClerkAuthController();

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile from Clerk
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  asyncHandler(authController.getCurrentUser.bind(authController))
);

/**
 * @route   POST /api/auth/sync-user
 * @desc    Sync user data from Clerk to local database
 * @access  Private
 */
router.post(
  '/sync-user',
  authenticate,
  asyncHandler(authController.syncUserToDatabase.bind(authController))
);

/**
 * @route   POST /api/auth/webhook
 * @desc    Handle Clerk webhooks for user events
 * @access  Public (but verified with webhook secret)
 */
router.post(
  '/webhook',
  asyncHandler(authController.handleWebhook.bind(authController))
);

/**
 * @route   GET /api/auth/session
 * @desc    Verify current session and return user info
 * @access  Private
 */
router.get(
  '/session',
  authenticate,
  asyncHandler(authController.verifySession.bind(authController))
);

/**
 * @route   DELETE /api/auth/session
 * @desc    Revoke current session
 * @access  Private
 */
router.delete(
  '/session',
  authenticate,
  asyncHandler(authController.revokeSession.bind(authController))
);

/**
 * @route   PUT /api/auth/metadata
 * @desc    Update user metadata (role, preferences, etc.)
 * @access  Private
 */
router.put(
  '/metadata',
  authenticate,
  asyncHandler(authController.updateUserMetadata.bind(authController))
);

/**
 * @route   GET /api/auth/organizations
 * @desc    Get user's organizations from Clerk
 * @access  Private
 */
router.get(
  '/organizations',
  authenticate,
  asyncHandler(authController.getUserOrganizations.bind(authController))
);

export default router;

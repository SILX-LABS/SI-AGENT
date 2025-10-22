/**
 * Generated APIs Routes
 * 
 * Handles CRUD operations for AI-generated APIs.
 * This is the core functionality of SI-AGENT.
 */

import { Router } from 'express';
import { GeneratedApiController } from '@/controllers/GeneratedApiController';
import { authenticate, authorize } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';
import { asyncHandler } from '@/middlewares/errorHandler';
import { 
  generateApiSchema, 
  updateApiSchema,
  deployApiSchema 
} from '@/utils/validationSchemas';

const router = Router();
const generatedApiController = new GeneratedApiController();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/generated-apis/generate
 * @desc    Generate new API from natural language prompt
 * @access  Private
 */
router.post(
  '/generate',
  validate(generateApiSchema),
  asyncHandler(generatedApiController.generateApi.bind(generatedApiController))
);

/**
 * @route   GET /api/generated-apis
 * @desc    Get all user's generated APIs
 * @access  Private
 */
router.get(
  '/',
  asyncHandler(generatedApiController.getUserApis.bind(generatedApiController))
);

/**
 * @route   GET /api/generated-apis/:id
 * @desc    Get specific generated API details
 * @access  Private
 */
router.get(
  '/:id',
  asyncHandler(generatedApiController.getApiById.bind(generatedApiController))
);

/**
 * @route   PUT /api/generated-apis/:id
 * @desc    Update generated API
 * @access  Private
 */
router.put(
  '/:id',
  validate(updateApiSchema),
  asyncHandler(generatedApiController.updateApi.bind(generatedApiController))
);

/**
 * @route   DELETE /api/generated-apis/:id
 * @desc    Delete generated API
 * @access  Private
 */
router.delete(
  '/:id',
  asyncHandler(generatedApiController.deleteApi.bind(generatedApiController))
);

/**
 * @route   POST /api/generated-apis/:id/deploy
 * @desc    Deploy generated API to runtime
 * @access  Private
 */
router.post(
  '/:id/deploy',
  validate(deployApiSchema),
  asyncHandler(generatedApiController.deployApi.bind(generatedApiController))
);

/**
 * @route   POST /api/generated-apis/:id/test
 * @desc    Test generated API with sample data
 * @access  Private
 */
router.post(
  '/:id/test',
  asyncHandler(generatedApiController.testApi.bind(generatedApiController))
);

/**
 * @route   GET /api/generated-apis/:id/logs
 * @desc    Get API execution logs
 * @access  Private
 */
router.get(
  '/:id/logs',
  asyncHandler(generatedApiController.getApiLogs.bind(generatedApiController))
);

/**
 * @route   GET /api/generated-apis/:id/analytics
 * @desc    Get API usage analytics
 * @access  Private
 */
router.get(
  '/:id/analytics',
  asyncHandler(generatedApiController.getApiAnalytics.bind(generatedApiController))
);

/**
 * @route   POST /api/generated-apis/:id/duplicate
 * @desc    Duplicate an existing API
 * @access  Private
 */
router.post(
  '/:id/duplicate',
  asyncHandler(generatedApiController.duplicateApi.bind(generatedApiController))
);

export default router;

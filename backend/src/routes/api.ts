/**
 * Main API Routes
 * 
 * Core API endpoints for AI-powered API generation and testing.
 */

import { Router } from 'express';
import { AIController } from '@/controllers/AIController';
import { authenticate, optionalAuth } from '@/middlewares/auth';
import { asyncHandler } from '@/middlewares/errorHandler';
import fetch from 'node-fetch';

const router = Router();
const aiController = new AIController();

/**
 * @route   POST /api/test-ai
 * @desc    Test AI service connection
 * @access  Public
 */
router.post(
  '/test-ai',
  asyncHandler(aiController.testAI.bind(aiController))
);

/**
 * @route   GET /api/test-openrouter
 * @desc    Test OpenRouter API directly
 * @access  Public
 */
router.get('/test-openrouter', asyncHandler(async (req: any, res: any) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  
  // Test a simple request to OpenRouter
  try {
    const testResponse = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });
    
    const modelsData = await testResponse.text();
    
    res.json({
      success: true,
      data: {
        apiKeySet: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
        model,
        baseUrl,
        testUrl: `${baseUrl}/chat/completions`,
        modelsEndpointTest: {
          status: testResponse.status,
          statusText: testResponse.statusText,
          response: modelsData.substring(0, 200) + '...'
        }
      }
    });
  } catch (error: any) {
    res.json({
      success: false,
      error: error.message,
      data: {
        apiKeySet: !!apiKey,
        apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'NOT_SET',
        model,
        baseUrl
      }
    });
  }
}));

/**
 * @route   POST /api/test-direct-openrouter
 * @desc    Test direct API call to OpenRouter with same parameters
 * @access  Public
 */
router.post('/test-direct-openrouter', asyncHandler(async (req: any, res: any) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL;
  const baseUrl = process.env.OPENROUTER_BASE_URL;
  
  const testMessage = req.body.message || "Hello, can you help me?";
  
  // Test with exact format from OpenRouter docs
  const requestBody = {
    model: model,
    messages: [
      {
        role: "user",
        content: testMessage
      }
    ]
  };

  try {
    console.log('=== DIRECT OPENROUTER TEST ===');
    console.log('URL:', `${baseUrl}/chat/completions`);
    console.log('API Key:', apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT_SET');
    console.log('Model:', model);
    console.log('Request Body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'SI-AGENT-TEST',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('Raw Response:', responseText);
    
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      responseData = { rawText: responseText };
    }

    res.json({
      success: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      data: responseData,
      config: {
        apiKey: apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT_SET',
        model,
        baseUrl,
        requestBody
      }
    });

  } catch (error: any) {
    console.error('Direct test error:', error);
    res.json({
      success: false,
      error: error.message,
      stack: error.stack,
      config: {
        apiKey: apiKey ? `${apiKey.substring(0, 15)}...` : 'NOT_SET',
        model,
        baseUrl
      }
    });
  }
}));

/**
 * @route   POST /api/generate-response
 * @desc    Generate AI response from prompt
 * @access  Public (temporarily for testing)
 */
router.post(
  '/generate-response',
  // authenticate, // Temporarily disabled for testing
  asyncHandler(aiController.generateResponse.bind(aiController))
);

/**
 * @route   POST /api/parse-prompt
 * @desc    Parse natural language prompt for API generation
 * @access  Private
 */
router.post(
  '/parse-prompt',
  authenticate,
  asyncHandler(aiController.parsePrompt.bind(aiController))
);

/**
 * @route   POST /api/generate-api-code
 * @desc    Generate API code from description
 * @access  Private
 */
router.post(
  '/generate-api-code',
  authenticate,
  asyncHandler(aiController.generateApiCode.bind(aiController))
);

/**
 * @route   GET /api/health
 * @desc    Health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;

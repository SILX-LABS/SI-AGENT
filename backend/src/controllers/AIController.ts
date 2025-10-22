/**
 * AI Controller
 * 
 * Handles AI-related requests for API generation and natural language processing.
 */

import { Request, Response } from 'express';
import { AIService } from '@/services/AIService';
import { createError } from '@/middlewares/errorHandler';
import { logger } from '@/config/logger';

export class AIController {
  private aiService: AIService;

  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Test AI service connection
   */
  async testAI(req: Request, res: Response): Promise<void> {
    try {
      const testResult = await this.aiService.testConnection();
      
      res.status(200).json({
        success: true,
        data: testResult,
        message: testResult.success ? 'AI service is working' : 'AI service test failed'
      });
    } catch (error) {
      logger.error('AI test error:', error);
      throw createError('Failed to test AI service', 500);
    }
  }

  /**
   * Generate AI response from prompt
   */
  async generateResponse(req: Request, res: Response): Promise<void> {
    try {
      const { prompt, context, maxTokens, temperature } = req.body;

      if (!prompt) {
        throw createError('Prompt is required', 400);
      }

      const response = await this.aiService.generateResponse({
        prompt,
        context,
        maxTokens,
        temperature
      });

      res.status(200).json({
        success: true,
        data: {
          response,
          prompt,
          userId: req.user?.id
        }
      });
    } catch (error) {
      logger.error('Generate response error:', error);
      throw error;
    }
  }

  /**
   * Parse natural language prompt for API generation
   */
  async parsePrompt(req: Request, res: Response): Promise<void> {
    try {
      const { prompt } = req.body;

      if (!prompt) {
        throw createError('Prompt is required', 400);
      }

      const analysis = await this.aiService.parseApiPrompt(prompt);

      res.status(200).json({
        success: true,
        data: {
          analysis,
          originalPrompt: prompt,
          userId: req.user?.id
        }
      });
    } catch (error) {
      logger.error('Parse prompt error:', error);
      throw error;
    }
  }

  /**
   * Generate API code from description
   */
  async generateApiCode(req: Request, res: Response): Promise<void> {
    try {
      const { description, method, inputSchema, outputSchema } = req.body;

      if (!description) {
        throw createError('API description is required', 400);
      }

      const generatedCode = await this.aiService.generateApiCode({
        description,
        method,
        inputSchema,
        outputSchema
      });

      res.status(200).json({
        success: true,
        data: {
          ...generatedCode,
          description,
          userId: req.user?.id,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      logger.error('Generate API code error:', error);
      throw error;
    }
  }
}

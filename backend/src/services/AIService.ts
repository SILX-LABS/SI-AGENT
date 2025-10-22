/**
 * AI Service - OpenRouter Integration
 * 
 * Handles AI model interactions using OpenRouter API.
 * Provides methods for generating API code, parsing prompts, and AI responses.
 */

import { logger } from '@/config/logger';
import { createError } from '@/middlewares/errorHandler';
import fetch from 'node-fetch';

interface OpenRouterResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface AIPromptRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

interface APIGenerationRequest {
  description: string;
  method?: string;
  inputSchema?: any;
  outputSchema?: any;
}

export class AIService {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3.1:free';
    this.baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';

    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is required');
    }
  }

  /**
   * Make a request to OpenRouter API
   */
  private async makeRequest(messages: any[], options: any = {}): Promise<OpenRouterResponse> {
    try {
      // Use exact OpenRouter docs format
      const requestBody = {
        model: this.model,
        messages
      };

      logger.info('Making OpenRouter API request', {
        url: `${this.baseUrl}/chat/completions`,
        model: this.model,
        baseUrl: this.baseUrl,
        messagesCount: messages.length,
        requestBody: JSON.stringify(requestBody, null, 2)
      });
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'SI-AGENT',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.text();
        logger.error('OpenRouter API error:', { status: response.status, error: errorData });
        throw createError(`AI service error: ${response.statusText}`, response.status);
      }

      const data = await response.json() as OpenRouterResponse;
      logger.info('OpenRouter API call successful', {
        model: this.model,
        tokens: data.usage?.total_tokens || 0
      });

      return data;
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timeout - OpenRouter API took too long to respond';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        errorMessage = 'Network error - Cannot reach OpenRouter API';
      }
      
      logger.error('AI service request failed:', {
        message: errorMessage,
        originalError: error.message,
        errorName: error.name,
        errorCode: error.code,
        stack: error.stack,
        apiKey: this.apiKey ? 'SET' : 'NOT_SET',
        model: this.model,
        baseUrl: this.baseUrl
      });
      throw createError(`Failed to communicate with AI service: ${errorMessage}`, 500);
    }
  }

  /**
   * Generate a simple AI response from a prompt
   */
  async generateResponse(request: AIPromptRequest): Promise<string> {
    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a helpful AI assistant for the SI-AGENT platform. Provide clear, concise, and accurate responses.'
        },
        {
          role: 'user',
          content: request.context ? `Context: ${request.context}\n\nPrompt: ${request.prompt}` : request.prompt
        }
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: request.maxTokens,
        temperature: request.temperature
      });

      return response.choices[0]?.message?.content || 'No response generated';
    } catch (error) {
      logger.error('Generate response error:', error);
      throw error;
    }
  }

  /**
   * Generate API code from natural language description
   */
  async generateApiCode(request: APIGenerationRequest): Promise<{
    endpoint: string;
    method: string;
    controllerCode: string;
    serviceCode: string;
    schema: any;
  }> {
    try {
      const systemPrompt = `You are an expert API developer. Generate Express.js API code based on user descriptions.

Return a JSON response with the following structure:
{
  "endpoint": "/api/example",
  "method": "GET|POST|PUT|DELETE",
  "controllerCode": "// Express controller code",
  "serviceCode": "// Business logic service code", 
  "schema": {
    "input": { /* JSON schema for input */ },
    "output": { /* JSON schema for output */ }
  }
}

Make the code production-ready with proper error handling, validation, and TypeScript types.`;

      const userPrompt = `Generate an API for: ${request.description}

${request.method ? `Preferred HTTP method: ${request.method}` : ''}
${request.inputSchema ? `Input schema requirements: ${JSON.stringify(request.inputSchema)}` : ''}
${request.outputSchema ? `Output schema requirements: ${JSON.stringify(request.outputSchema)}` : ''}

Please generate complete, working code that follows best practices.`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 2000,
        temperature: 0.3 // Lower temperature for more consistent code generation
      });

      const content = response.choices[0]?.message?.content || '';
      
      // Try to parse JSON response
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        logger.warn('Failed to parse AI response as JSON, returning raw content');
      }

      // Fallback: return a basic structure
      return {
        endpoint: '/api/generated',
        method: request.method || 'GET',
        controllerCode: `// Generated from: ${request.description}\n${content}`,
        serviceCode: '// Service logic would go here',
        schema: {
          input: request.inputSchema || {},
          output: request.outputSchema || {}
        }
      };
    } catch (error) {
      logger.error('Generate API code error:', error);
      throw error;
    }
  }

  /**
   * Parse and analyze a natural language API prompt
   */
  async parseApiPrompt(prompt: string): Promise<{
    intent: string;
    suggestedEndpoint: string;
    suggestedMethod: string;
    parameters: string[];
    complexity: 'simple' | 'medium' | 'complex';
  }> {
    try {
      const systemPrompt = `Analyze API requests and return structured information as JSON:
{
  "intent": "Brief description of what the API should do",
  "suggestedEndpoint": "/api/suggested-path",
  "suggestedMethod": "GET|POST|PUT|DELETE",
  "parameters": ["param1", "param2"],
  "complexity": "simple|medium|complex"
}`;

      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Analyze this API request: ${prompt}` }
      ];

      const response = await this.makeRequest(messages, {
        maxTokens: 500,
        temperature: 0.2
      });

      const content = response.choices[0]?.message?.content || '';
      
      try {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        logger.warn('Failed to parse prompt analysis as JSON');
      }

      // Fallback response
      return {
        intent: prompt.substring(0, 100),
        suggestedEndpoint: '/api/generated',
        suggestedMethod: 'GET',
        parameters: [],
        complexity: 'medium' as const
      };
    } catch (error) {
      logger.error('Parse API prompt error:', error);
      throw error;
    }
  }

  /**
   * Test the AI connection
   */
  async testConnection(): Promise<{ success: boolean; model: string; response: string }> {
    try {
      const testPrompt = 'Hello! Please respond with "AI service is working correctly" to confirm the connection.';
      
      const response = await this.generateResponse({
        prompt: testPrompt,
        maxTokens: 50,
        temperature: 0.1
      });

      return {
        success: true,
        model: this.model,
        response: response
      };
    } catch (error: any) {
      logger.error('AI connection test failed:', error);
      return {
        success: false,
        model: this.model,
        response: error.message || 'Connection test failed'
      };
    }
  }
}

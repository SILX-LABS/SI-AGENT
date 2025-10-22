# Routes

This directory contains all API route definitions for the SI-AGENT backend.

## 📁 Structure

- `auth.ts` - Authentication routes (login, register, refresh)
- `users.ts` - User management routes
- `generatedApis.ts` - Generated API management routes
- `api.ts` - Main API generation routes
- `index.ts` - Route aggregation and exports

## 🛣 Route Overview

### Authentication Routes (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /refresh` - Token refresh
- `POST /logout` - User logout
- `POST /forgot-password` - Password reset request
- `POST /reset-password` - Password reset confirmation

### User Routes (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update user profile
- `DELETE /account` - Delete user account
- `GET /api-usage` - Get API usage statistics

### Generated API Routes (`/api/generated-apis`)
- `POST /generate` - Generate new API from text prompt
- `GET /` - List user's generated APIs
- `GET /:id` - Get specific generated API details
- `PUT /:id` - Update generated API
- `DELETE /:id` - Delete generated API
- `POST /:id/deploy` - Deploy generated API
- `GET /:id/logs` - Get API execution logs

### Main API Routes (`/api`)
- `POST /parse-prompt` - Parse natural language prompt
- `POST /validate-schema` - Validate API schema
- `GET /templates` - Get API templates
- `POST /test-api` - Test generated API

## 📝 Guidelines

1. Use RESTful conventions for route naming
2. Include proper middleware for authentication and validation
3. Return consistent response formats
4. Handle errors appropriately
5. Add JSDoc comments for route documentation
6. Use TypeScript interfaces for request/response types

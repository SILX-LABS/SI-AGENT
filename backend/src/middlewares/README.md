# Middlewares

This directory contains custom Express middleware functions used throughout the SI-AGENT backend.

## 📁 Structure

- `auth.ts` - JWT authentication middleware
- `errorHandler.ts` - Global error handling middleware
- `requestLogger.ts` - HTTP request logging middleware
- `validation.ts` - Request validation middleware using Joi
- `upload.ts` - File upload handling middleware
- `rateLimiter.ts` - Custom rate limiting middleware

## 🔧 Usage

Each middleware is designed to be modular and reusable. Import and use them in your routes:

```typescript
import { authenticate } from '@/middlewares/auth';
import { validate } from '@/middlewares/validation';

router.post('/protected-route', 
  authenticate, 
  validate(schema), 
  controller
);
```

## 📝 Guidelines

1. Keep middleware functions focused on a single responsibility
2. Always call `next()` to pass control to the next middleware
3. Handle errors appropriately and pass them to the error handler
4. Add proper TypeScript types for request/response objects
5. Include JSDoc comments for better documentation

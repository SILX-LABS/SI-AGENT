/**
 * Authentication Middleware
 * 
 * Clerk-based authentication for protecting routes.
 * Validates Clerk session tokens and attaches user information to requests.
 */

import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createError } from './errorHandler';
import { logger } from '@/config/logger';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        imageUrl?: string;
        role: string;
      };
      auth?: {
        userId: string;
        sessionId: string;
      };
    }
  }
}

/**
 * Clerk Authentication middleware
 * Validates Clerk session token and attaches user info to request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get session token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError('Access token required', 401);
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify session with Clerk
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      throw createError('Clerk secret key not configured', 500);
    }
    
    const session = await clerkClient.sessions.verifySession(sessionToken, secretKey);

    if (!session || !session.userId) {
      throw createError('Invalid session', 401);
    }

    // Get user details from Clerk
    const user = await clerkClient.users.getUser(session.userId);
    
    // Attach user info to request
    const userInfo: any = {
      id: user.id,
      email: user.emailAddresses?.[0]?.emailAddress || '',
      role: (user.publicMetadata as any)?.role || 'user'
    };
    
    if (user.firstName) userInfo.firstName = user.firstName;
    if (user.lastName) userInfo.lastName = user.lastName;
    if (user.imageUrl) userInfo.imageUrl = user.imageUrl;
    
    req.user = userInfo;

    req.auth = {
      userId: session.userId,
      sessionId: session.id
    };

    logger.debug(`User authenticated via Clerk: ${req.user?.email || 'unknown'}`);
    next();
  } catch (error: any) {
    logger.error('Clerk authentication error:', error);
    
    if (error.status === 401 || error.message?.includes('session')) {
      next(createError('Invalid or expired session', 401));
    } else {
      next(createError('Authentication failed', 401));
    }
  }
};

/**
 * Role-based authorization middleware
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(createError('Authentication required', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(createError('Insufficient permissions', 403));
    }

    next();
  };
};

/**
 * Optional authentication middleware
 * Attaches user info if Clerk session token is present, but doesn't require it
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const sessionToken = authHeader.substring(7);
      
      try {
        // Verify session with Clerk
        const secretKey = process.env.CLERK_SECRET_KEY;
        if (!secretKey) {
          logger.debug('Clerk secret key not configured for optional auth');
          return next();
        }
        
        const session = await clerkClient.sessions.verifySession(sessionToken, secretKey);

        if (session && session.userId) {
          // Get user details from Clerk
          const user = await clerkClient.users.getUser(session.userId);
          
          const userInfo: any = {
            id: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || '',
            role: (user.publicMetadata as any)?.role || 'user'
          };
          
          if (user.firstName) userInfo.firstName = user.firstName;
          if (user.lastName) userInfo.lastName = user.lastName;
          if (user.imageUrl) userInfo.imageUrl = user.imageUrl;
          
          req.user = userInfo;

          req.auth = {
            userId: session.userId,
            sessionId: session.id
          };
        }
      } catch (clerkError) {
        // Silently ignore Clerk errors for optional auth
        logger.debug('Optional auth failed:', clerkError);
      }
    }
    
    next();
  } catch (error) {
    // Ignore auth errors for optional auth
    next();
  }
};

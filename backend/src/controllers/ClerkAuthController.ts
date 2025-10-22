/**
 * Clerk Authentication Controller
 * 
 * Handles Clerk-based authentication operations and user management.
 * Integrates with Clerk's backend SDK for user operations.
 */

import { Request, Response } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { createError } from '@/middlewares/errorHandler';
import { logger } from '@/config/logger';
import { prisma } from '@/config/database';

export class ClerkAuthController {
  /**
   * Get current user profile from Clerk
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      // User info is already attached by the auth middleware
      res.status(200).json({
        success: true,
        data: {
          user: req.user
        }
      });
    } catch (error) {
      logger.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Sync user data from Clerk to local database
   */
  async syncUserToDatabase(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.auth) {
        throw createError('User not authenticated', 401);
      }

      // Check if user exists in local database
      let localUser = await prisma.user.findUnique({
        where: { clerkId: req.user.id }
      });

      if (!localUser) {
        // Create new user in local database
        const createData: any = {
          clerkId: req.user.id,
          email: req.user.email,
          role: req.user.role,
        };
        
        if (req.user.firstName) createData.firstName = req.user.firstName;
        if (req.user.lastName) createData.lastName = req.user.lastName;
        if (req.user.imageUrl) createData.imageUrl = req.user.imageUrl;
        
        localUser = await prisma.user.create({
          data: createData
        });
        logger.info(`New user synced to database: ${req.user.email}`);
      } else {
        // Update existing user
        const updateData: any = {
          email: req.user.email,
          role: req.user.role,
          lastLoginAt: new Date(),
        };
        
        if (req.user.firstName) updateData.firstName = req.user.firstName;
        if (req.user.lastName) updateData.lastName = req.user.lastName;
        if (req.user.imageUrl) updateData.imageUrl = req.user.imageUrl;
        
        localUser = await prisma.user.update({
          where: { clerkId: req.user.id },
          data: updateData
        });
        logger.info(`User updated in database: ${req.user.email}`);
      }

      res.status(200).json({
        success: true,
        data: {
          user: localUser,
          message: 'User synced successfully'
        }
      });
    } catch (error) {
      logger.error('Sync user error:', error);
      throw error;
    }
  }

  /**
   * Handle Clerk webhooks for user events
   */
  async handleWebhook(req: Request, res: Response): Promise<void> {
    try {
      const { type, data } = req.body;

      switch (type) {
        case 'user.created':
          await this.handleUserCreated(data);
          break;
        case 'user.updated':
          await this.handleUserUpdated(data);
          break;
        case 'user.deleted':
          await this.handleUserDeleted(data);
          break;
        case 'session.created':
          await this.handleSessionCreated(data);
          break;
        case 'session.ended':
          await this.handleSessionEnded(data);
          break;
        default:
          logger.warn(`Unhandled webhook event: ${type}`);
      }

      res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Verify current session
   */
  async verifySession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user || !req.auth) {
        throw createError('Session not valid', 401);
      }

      res.status(200).json({
        success: true,
        data: {
          user: req.user,
          session: {
            id: req.auth.sessionId,
            userId: req.auth.userId
          }
        }
      });
    } catch (error) {
      logger.error('Session verification error:', error);
      throw error;
    }
  }

  /**
   * Revoke current session
   */
  async revokeSession(req: Request, res: Response): Promise<void> {
    try {
      if (!req.auth?.sessionId) {
        throw createError('No active session', 400);
      }

      // Revoke session in Clerk
      await clerkClient.sessions.revokeSession(req.auth.sessionId);

      res.status(200).json({
        success: true,
        message: 'Session revoked successfully'
      });
    } catch (error) {
      logger.error('Session revocation error:', error);
      throw error;
    }
  }

  /**
   * Update user metadata
   */
  async updateUserMetadata(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      const { publicMetadata, privateMetadata } = req.body;

      // Update user metadata in Clerk
      const updatedUser = await clerkClient.users.updateUser(req.user.id, {
        publicMetadata: publicMetadata || {},
        privateMetadata: privateMetadata || {}
      });

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          message: 'User metadata updated successfully'
        }
      });
    } catch (error) {
      logger.error('Update metadata error:', error);
      throw error;
    }
  }

  /**
   * Get user's organizations
   */
  async getUserOrganizations(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      // Get user's organization memberships
      const organizationMemberships = await clerkClient.users.getOrganizationMembershipList({
        userId: req.user.id
      });

      res.status(200).json({
        success: true,
        data: {
          organizations: organizationMemberships
        }
      });
    } catch (error) {
      logger.error('Get organizations error:', error);
      throw error;
    }
  }

  // Private helper methods for webhook handling
  private async handleUserCreated(userData: any): Promise<void> {
    try {
      const createData: any = {
        clerkId: userData.id,
        email: userData.email_addresses[0]?.email_address || '',
        role: userData.public_metadata?.role || 'user',
      };
      
      if (userData.first_name) createData.firstName = userData.first_name;
      if (userData.last_name) createData.lastName = userData.last_name;
      if (userData.image_url) createData.imageUrl = userData.image_url;
      
      await prisma.user.create({
        data: createData
      });
      logger.info(`User created via webhook: ${userData.email_addresses[0]?.email_address}`);
    } catch (error) {
      logger.error('Handle user created error:', error);
    }
  }

  private async handleUserUpdated(userData: any): Promise<void> {
    try {
      const updateData: any = {
        email: userData.email_addresses[0]?.email_address || '',
        role: userData.public_metadata?.role || 'user',
      };
      
      if (userData.first_name) updateData.firstName = userData.first_name;
      if (userData.last_name) updateData.lastName = userData.last_name;
      if (userData.image_url) updateData.imageUrl = userData.image_url;
      
      await prisma.user.update({
        where: { clerkId: userData.id },
        data: updateData
      });
      logger.info(`User updated via webhook: ${userData.email_addresses[0]?.email_address}`);
    } catch (error) {
      logger.error('Handle user updated error:', error);
    }
  }

  private async handleUserDeleted(userData: any): Promise<void> {
    try {
      await prisma.user.delete({
        where: { clerkId: userData.id }
      });
      logger.info(`User deleted via webhook: ${userData.id}`);
    } catch (error) {
      logger.error('Handle user deleted error:', error);
    }
  }

  private async handleSessionCreated(sessionData: any): Promise<void> {
    try {
      // Update last login time
      await prisma.user.update({
        where: { clerkId: sessionData.user_id },
        data: { lastLoginAt: new Date() }
      });
      logger.info(`Session created for user: ${sessionData.user_id}`);
    } catch (error) {
      logger.error('Handle session created error:', error);
    }
  }

  private async handleSessionEnded(sessionData: any): Promise<void> {
    try {
      logger.info(`Session ended for user: ${sessionData.user_id}`);
      // Add any cleanup logic here if needed
    } catch (error) {
      logger.error('Handle session ended error:', error);
    }
  }
}

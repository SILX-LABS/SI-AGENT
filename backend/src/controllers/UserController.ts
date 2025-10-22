/**
 * User Controller
 * 
 * Handles user profile management and statistics.
 */

import { Request, Response } from 'express';
import { prisma } from '@/config/database';
import { createError } from '@/middlewares/errorHandler';
import { logger } from '@/config/logger';

export class UserController {
  /**
   * Get user profile
   */
  async getProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      // Get user from database
      const user = await prisma.user.findUnique({
        where: { clerkId: req.user.id },
        include: {
          _count: {
            select: {
              generatedApis: true,
              apiExecutions: true
            }
          }
        }
      });

      if (!user) {
        throw createError('User not found', 404);
      }

      res.status(200).json({
        success: true,
        data: {
          user: {
            id: user.id,
            clerkId: user.clerkId,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            imageUrl: user.imageUrl,
            role: user.role,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            stats: {
              generatedApis: user._count.generatedApis,
              apiExecutions: user._count.apiExecutions
            }
          }
        }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      const { firstName, lastName } = req.body;

      const updatedUser = await prisma.user.update({
        where: { clerkId: req.user.id },
        data: {
          firstName: firstName || undefined,
          lastName: lastName || undefined,
        }
      });

      res.status(200).json({
        success: true,
        data: { user: updatedUser },
        message: 'Profile updated successfully'
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      throw error;
    }
  }

  /**
   * Get user's API usage statistics
   */
  async getApiUsage(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      // Get API usage stats
      const [totalApis, totalExecutions, recentExecutions] = await Promise.all([
        prisma.generatedApi.count({
          where: { userId: req.user.id }
        }),
        prisma.apiExecution.count({
          where: { userId: req.user.id }
        }),
        prisma.apiExecution.findMany({
          where: { userId: req.user.id },
          orderBy: { executedAt: 'desc' },
          take: 10,
          include: {
            api: {
              select: { name: true, endpoint: true }
            }
          }
        })
      ]);

      // Get usage by status
      const apisByStatus = await prisma.generatedApi.groupBy({
        by: ['status'],
        where: { userId: req.user.id },
        _count: { status: true }
      });

      res.status(200).json({
        success: true,
        data: {
          stats: {
            totalApis,
            totalExecutions,
            apisByStatus: apisByStatus.reduce((acc: Record<string, number>, item: { status: string; _count: { status: number } }) => {
              acc[item.status] = item._count.status;
              return acc;
            }, {} as Record<string, number>)
          },
          recentExecutions
        }
      });
    } catch (error) {
      logger.error('Get API usage error:', error);
      throw error;
    }
  }

  /**
   * Delete user account
   */
  async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw createError('User not authenticated', 401);
      }

      // Delete user and all related data (cascade)
      await prisma.user.delete({
        where: { clerkId: req.user.id }
      });

      res.status(200).json({
        success: true,
        message: 'Account deleted successfully'
      });
    } catch (error) {
      logger.error('Delete account error:', error);
      throw error;
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10 } = req.query;
      const skip = (Number(page) - 1) * Number(limit);

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          skip,
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
          include: {
            _count: {
              select: {
                generatedApis: true,
                apiExecutions: true
              }
            }
          }
        }),
        prisma.user.count()
      ]);

      res.status(200).json({
        success: true,
        data: {
          users,
          pagination: {
            page: Number(page),
            limit: Number(limit),
            total,
            pages: Math.ceil(total / Number(limit))
          }
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      throw error;
    }
  }
}

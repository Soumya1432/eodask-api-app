import type { Response } from 'express';
import { analyticsService } from '../services/analytics.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export const getOrganizationAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const analytics = await analyticsService.getOrganizationAnalytics(
    req.params.organizationId,
    req.user!.id
  );
  sendSuccess(res, 'Analytics retrieved', analytics);
});

export const getProjectAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
  const analytics = await analyticsService.getProjectAnalytics(
    req.params.projectId,
    req.user!.id
  );
  sendSuccess(res, 'Project analytics retrieved', analytics);
});

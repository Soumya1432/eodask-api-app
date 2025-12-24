import type { Response } from 'express';
import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export const register = asyncHandler(async (req: AuthRequest, res: Response) => {
  console.log('=== REGISTER REQUEST ===');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  console.log('invitationToken:', req.body.invitationToken);

  const result = await authService.register(req.body);

  console.log('=== REGISTER RESULT ===');
  console.log('Has organization:', !!result.organization);
  console.log('Organization:', result.organization);
  console.log('invitationAccepted:', result.invitationAccepted);

  sendSuccess(res, 'Registration successful', result, 201);
});

export const login = asyncHandler(async (req: AuthRequest, res: Response) => {
  const result = await authService.login(req.body);
  sendSuccess(res, 'Login successful', result);
});

export const refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  const result = await authService.refreshToken(refreshToken);
  sendSuccess(res, 'Token refreshed', result);
});

export const logout = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { refreshToken } = req.body;
  await authService.logout(refreshToken);
  sendSuccess(res, 'Logout successful');
});

export const logoutAll = asyncHandler(async (req: AuthRequest, res: Response) => {
  await authService.logoutAll(req.user!.id);
  sendSuccess(res, 'Logged out from all devices');
});

export const getProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.getProfile(req.user!.id);
  sendSuccess(res, 'Profile retrieved', user);
});

export const updateProfile = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await authService.updateProfile(req.user!.id, req.body);
  sendSuccess(res, 'Profile updated', user);
});

export const changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  await authService.changePassword(req.user!.id, currentPassword, newPassword);
  sendSuccess(res, 'Password changed successfully');
});

import { authService } from '../services/auth.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
export const register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    sendSuccess(res, 'Registration successful', result, 201);
});
export const login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    sendSuccess(res, 'Login successful', result);
});
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    sendSuccess(res, 'Token refreshed', result);
});
export const logout = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, 'Logout successful');
});
export const logoutAll = asyncHandler(async (req, res) => {
    await authService.logoutAll(req.user.id);
    sendSuccess(res, 'Logged out from all devices');
});
export const getProfile = asyncHandler(async (req, res) => {
    const user = await authService.getProfile(req.user.id);
    sendSuccess(res, 'Profile retrieved', user);
});
export const updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user.id, req.body);
    sendSuccess(res, 'Profile updated', user);
});
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user.id, currentPassword, newPassword);
    sendSuccess(res, 'Password changed successfully');
});
//# sourceMappingURL=auth.controller.js.map
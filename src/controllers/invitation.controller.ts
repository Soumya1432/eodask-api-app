import type { Response } from 'express';
import { invitationService } from '../services/invitation.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

export const createInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, role } = req.body;
  const invitation = await invitationService.createInvitation(
    req.params.projectId,
    req.user!.id,
    email,
    role
  );
  sendSuccess(res, 'Invitation sent', invitation, 201);
});

export const getInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invitation = await invitationService.getInvitationByToken(req.params.token);
  sendSuccess(res, 'Invitation retrieved', invitation);
});

export const acceptInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const project = await invitationService.acceptInvitation(
    req.params.token,
    req.user!.id
  );
  sendSuccess(res, 'Invitation accepted', project);
});

export const rejectInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  await invitationService.rejectInvitation(req.params.token);
  sendSuccess(res, 'Invitation rejected');
});

export const getProjectInvitations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invitations = await invitationService.getProjectInvitations(req.params.projectId);
  sendSuccess(res, 'Invitations retrieved', invitations);
});

export const cancelInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  await invitationService.cancelInvitation(req.params.invitationId, req.user!.id);
  sendSuccess(res, 'Invitation cancelled');
});

import type { Response } from 'express';
import { organizationService } from '../services/organization.service.js';
import { fileService } from '../services/file.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess, sendPaginated } from '../utils/response.js';
import type { AuthRequest } from '../types/index.js';

// Organization CRUD
export const createOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.create(req.user!.id, req.body);
  sendSuccess(res, 'Organization created', organization, 201);
});

export const getOrganizations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organizations = await organizationService.findAll(req.user!.id);
  sendSuccess(res, 'Organizations retrieved', organizations);
});

export const getOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.findById(req.params.orgId, req.user!.id);
  sendSuccess(res, 'Organization retrieved', organization);
});

export const getOrganizationBySlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.findBySlug(req.params.slug, req.user!.id);
  sendSuccess(res, 'Organization retrieved', organization);
});

export const updateOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.update(
    req.params.orgId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, 'Organization updated', organization);
});

export const updateOrganizationSlug = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.updateSlug(
    req.params.orgId,
    req.user!.id,
    req.body.slug
  );
  sendSuccess(res, 'Organization slug updated', organization);
});

export const deleteOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  await organizationService.delete(req.params.orgId, req.user!.id);
  sendSuccess(res, 'Organization deleted');
});

// Settings
export const updateSettings = asyncHandler(async (req: AuthRequest, res: Response) => {
  const settings = await organizationService.updateSettings(
    req.params.orgId,
    req.user!.id,
    req.body
  );
  sendSuccess(res, 'Settings updated', settings);
});

export const uploadLogo = asyncHandler(async (req: AuthRequest, res: Response) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  // Upload to Cloudinary
  const logoUrl = await fileService.uploadOrganizationLogo(
    {
      fieldname: file.fieldname,
      originalname: file.originalname,
      encoding: file.encoding,
      mimetype: file.mimetype,
      buffer: file.buffer,
      size: file.size,
    },
    req.params.orgId
  );

  // Get updated organization
  const organization = await organizationService.findById(req.params.orgId, req.user!.id);
  sendSuccess(res, 'Logo uploaded', { ...organization, logo: logoUrl });
});

// Members
export const getMembers = asyncHandler(async (req: AuthRequest, res: Response) => {
  const members = await organizationService.getMembers(req.params.orgId, req.user!.id);
  sendSuccess(res, 'Members retrieved', members);
});

export const addMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, role } = req.body;
  const member = await organizationService.addMember(
    req.params.orgId,
    req.user!.id,
    email,
    role
  );
  sendSuccess(res, 'Member added', member, 201);
});

export const updateMemberRole = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { role } = req.body;
  const member = await organizationService.updateMemberRole(
    req.params.orgId,
    req.user!.id,
    req.params.userId,
    role
  );
  sendSuccess(res, 'Member role updated', member);
});

export const removeMember = asyncHandler(async (req: AuthRequest, res: Response) => {
  await organizationService.removeMember(
    req.params.orgId,
    req.user!.id,
    req.params.userId
  );
  sendSuccess(res, 'Member removed');
});

export const transferOwnership = asyncHandler(async (req: AuthRequest, res: Response) => {
  await organizationService.transferOwnership(
    req.params.orgId,
    req.user!.id,
    req.body.newOwnerId
  );
  sendSuccess(res, 'Ownership transferred');
});

// Invitations
export const createInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { email, role } = req.body;
  const invitation = await organizationService.createInvitation(
    req.params.orgId,
    req.user!.id,
    email,
    role
  );
  sendSuccess(res, 'Invitation sent', invitation, 201);
});

export const getInvitations = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invitations = await organizationService.getInvitations(
    req.params.orgId,
    req.user!.id
  );
  sendSuccess(res, 'Invitations retrieved', invitations);
});

export const cancelInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  await organizationService.cancelInvitation(
    req.params.orgId,
    req.user!.id,
    req.params.invitationId
  );
  sendSuccess(res, 'Invitation cancelled');
});

export const getInvitationByToken = asyncHandler(async (req: AuthRequest, res: Response) => {
  const invitation = await organizationService.getInvitationByToken(req.params.token);
  sendSuccess(res, 'Invitation retrieved', invitation);
});

export const acceptInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  const member = await organizationService.acceptInvitation(
    req.params.token,
    req.user!.id
  );
  sendSuccess(res, 'Invitation accepted', member);
});

export const rejectInvitation = asyncHandler(async (req: AuthRequest, res: Response) => {
  await organizationService.rejectInvitation(req.params.token, req.user!.id);
  sendSuccess(res, 'Invitation rejected');
});

// Dashboard
export const getDashboardStats = asyncHandler(async (req: AuthRequest, res: Response) => {
  const stats = await organizationService.getDashboardStats(
    req.params.orgId,
    req.user!.id
  );
  sendSuccess(res, 'Dashboard stats retrieved', stats);
});

// Projects
export const getProjects = asyncHandler(async (req: AuthRequest, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const { projects, total } = await organizationService.getProjects(
    req.params.orgId,
    req.user!.id,
    page,
    limit
  );
  sendPaginated(res, 'Projects retrieved', projects, { page, limit, total });
});

// User status
export const checkNeedsOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const needsOrganization = await organizationService.userNeedsOrganization(req.user!.id);
  sendSuccess(res, 'Status checked', { needsOrganization });
});

export const switchOrganization = asyncHandler(async (req: AuthRequest, res: Response) => {
  const organization = await organizationService.switchOrganization(
    req.user!.id,
    req.body.organizationId
  );
  sendSuccess(res, 'Organization switched', organization);
});

import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { requireOrgAccess, requireMinOrgRole, requireOrgOwner } from '../middleware/orgRbac.js';
import * as orgController from '../controllers/organization.controller.js';

const router = Router();

// Configure multer for logo uploads (memory storage for Cloudinary upload)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.'));
    }
  },
});

// Validation schemas
const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens').optional(),
    description: z.string().max(500).optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    industry: z.string().max(100).optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  }),
});

const updateOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().max(500).optional(),
    website: z.string().url('Invalid URL').optional().or(z.literal('')),
    industry: z.string().max(100).optional(),
    size: z.enum(['1-10', '11-50', '51-200', '201-500', '500+']).optional(),
  }),
});

const updateSlugSchema = z.object({
  body: z.object({
    slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens'),
  }),
});

const updateSettingsSchema = z.object({
  body: z.object({
    allowMemberInvites: z.boolean().optional(),
    defaultProjectRole: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']).optional(),
    requireApprovalToJoin: z.boolean().optional(),
  }),
});

const addMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']).default('MEMBER'),
  }),
});

const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']),
  }),
});

const transferOwnershipSchema = z.object({
  body: z.object({
    newOwnerId: z.string().uuid('Invalid user ID'),
  }),
});

const createInvitationSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email'),
    role: z.enum(['ADMIN', 'MANAGER', 'MEMBER', 'GUEST']).default('MEMBER'),
  }),
});

const switchOrgSchema = z.object({
  body: z.object({
    organizationId: z.string().uuid('Invalid organization ID'),
  }),
});

// ==================== Public Routes ====================

// Get invitation by token (public - no auth required but returns limited info)
router.get('/invitations/token/:token', orgController.getInvitationByToken);

// ==================== Protected Routes ====================

// All routes below require authentication
router.use(authenticate);

// User organization status
router.get('/check-status', orgController.checkNeedsOrganization);
router.post('/switch', validate(switchOrgSchema), orgController.switchOrganization);

// Organization CRUD
router.post('/', validate(createOrgSchema), orgController.createOrganization);
router.get('/', orgController.getOrganizations);

// Get by slug (before :orgId routes to avoid conflicts)
router.get('/slug/:slug', orgController.getOrganizationBySlug);

// Invitation actions (for authenticated users)
router.post('/invitations/token/:token/accept', orgController.acceptInvitation);
router.post('/invitations/token/:token/reject', orgController.rejectInvitation);

// Organization-specific routes (require org membership)
router.get('/:orgId', requireOrgAccess, orgController.getOrganization);
router.patch('/:orgId', requireMinOrgRole('ADMIN'), validate(updateOrgSchema), orgController.updateOrganization);
router.patch('/:orgId/slug', requireOrgOwner, validate(updateSlugSchema), orgController.updateOrganizationSlug);
router.delete('/:orgId', requireOrgOwner, orgController.deleteOrganization);

// Settings
router.patch('/:orgId/settings', requireMinOrgRole('ADMIN'), validate(updateSettingsSchema), orgController.updateSettings);
router.post('/:orgId/logo', requireMinOrgRole('ADMIN'), upload.single('logo'), orgController.uploadLogo);

// Members
router.get('/:orgId/members', requireOrgAccess, orgController.getMembers);
router.post('/:orgId/members', requireMinOrgRole('ADMIN'), validate(addMemberSchema), orgController.addMember);
router.patch('/:orgId/members/:userId', requireOrgOwner, validate(updateMemberRoleSchema), orgController.updateMemberRole);
router.delete('/:orgId/members/:userId', requireMinOrgRole('ADMIN'), orgController.removeMember);
router.post('/:orgId/transfer-ownership', requireOrgOwner, validate(transferOwnershipSchema), orgController.transferOwnership);

// Invitations
router.get('/:orgId/invitations', requireMinOrgRole('MANAGER'), orgController.getInvitations);
router.post('/:orgId/invitations', requireMinOrgRole('ADMIN'), validate(createInvitationSchema), orgController.createInvitation);
router.delete('/:orgId/invitations/:invitationId', requireMinOrgRole('ADMIN'), orgController.cancelInvitation);

// Dashboard
router.get('/:orgId/dashboard', requireOrgAccess, orgController.getDashboardStats);

// Projects (list only - full project CRUD is in project routes)
router.get('/:orgId/projects', requireOrgAccess, orgController.getProjects);

export default router;

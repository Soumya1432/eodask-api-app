import type { Response, NextFunction } from 'express';
import { OrganizationRole } from '@prisma/client';
import type { AuthRequest } from '../types/index.js';
export interface OrgAuthRequest extends AuthRequest {
    organization?: {
        id: string;
        role: OrganizationRole;
    };
}
export declare const loadOrgContext: (req: OrgAuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrgRole: (...allowedRoles: OrganizationRole[]) => (req: OrgAuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireMinOrgRole: (minRole: OrganizationRole) => (req: OrgAuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrgAccess: (req: OrgAuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const requireOrgOwner: (req: OrgAuthRequest, _res: Response, next: NextFunction) => Promise<void>;
export declare const hasMinOrgRoleLevel: (userRole: OrganizationRole, minRole: OrganizationRole) => boolean;
//# sourceMappingURL=orgRbac.d.ts.map
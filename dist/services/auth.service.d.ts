interface RegisterData {
    email: string;
    password: string;
    name?: string;
    firstName?: string;
    lastName?: string;
    invitationToken?: string;
}
interface LoginData {
    email: string;
    password: string;
}
export declare class AuthService {
    register(data: RegisterData): Promise<{
        organization: {
            name: string;
            id: string;
            slug: string;
        };
        invitationAccepted: boolean;
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
            isActive: boolean;
            isVerified: boolean;
            createdAt: Date;
            currentOrganizationId: string | null;
        };
    } | {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
            isActive: boolean;
            isVerified: boolean;
            createdAt: Date;
        };
    }>;
    login(data: LoginData): Promise<{
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
            avatar: string | null;
            phone: string | null;
            isActive: boolean;
            isVerified: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
            currentOrganizationId: string | null;
        };
    }>;
    refreshToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(refreshToken: string): Promise<void>;
    logoutAll(userId: string): Promise<void>;
    private generateTokens;
    private parseExpiry;
    getProfile(userId: string): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        phone: string | null;
        isActive: boolean;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: {
        firstName?: string;
        lastName?: string;
        phone?: string;
    }): Promise<{
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        avatar: string | null;
        phone: string | null;
        isActive: boolean;
        isVerified: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void>;
}
export declare const authService: AuthService;
export {};
//# sourceMappingURL=auth.service.d.ts.map
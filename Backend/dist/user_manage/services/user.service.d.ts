export declare class UserService {
    getUserProfile(userId: number): Promise<{
        email: string;
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
        avatar: string | null;
        createdAt: Date;
    }>;
    updateProfile(userId: number, data: {
        username?: string;
        avatar?: string;
    }): Promise<{
        id: number;
        username: string;
        avatar: string | null;
    }>;
    getUserStatus(userId: number): Promise<{
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
    }>;
}
//# sourceMappingURL=user.service.d.ts.map
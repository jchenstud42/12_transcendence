export declare class AuthService {
    register(username: string, email: string, password: string): Promise<{
        email: string;
        id: number;
        username: string;
        status: import("@prisma/client").$Enums.UserStatus;
        createdAt: Date;
    }>;
    login(identifier: string, password: string): Promise<{
        id: number;
        username: string;
        email: string;
        isTwoFAEnabled: boolean;
        twoFAMethod: ("email" | "sms" | "qr") | null;
    }>;
    logout(userId: number): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.services.d.ts.map
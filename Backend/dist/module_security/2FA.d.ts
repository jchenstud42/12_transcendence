export type twoFAMethod = "email" | "sms" | "qr";
export declare class twoFAService {
    generateTOTPSecret(userId: number): Promise<{
        secret: string;
        otpauthURL: string | undefined;
        qrCode: string;
    }>;
    enableTOTP(userId: number, code: string): Promise<boolean>;
    generate2FA(userId: number, method: twoFAMethod, destination?: string): Promise<string>;
    send2FACode(userId: number): Promise<string | void>;
    verify2FACode(userId: number, code: string): Promise<boolean>;
    complete2FA(userId: number, code: string): Promise<{
        accessToken: string;
        refreshToken: string;
    } | null>;
    verifyTOTP(userId: number, code: string): Promise<boolean>;
}
//# sourceMappingURL=2FA.d.ts.map
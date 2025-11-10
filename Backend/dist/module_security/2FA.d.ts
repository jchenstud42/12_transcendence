export type twoFAMethod = "email" | "sms" | "totp";
export type twoFATokens = {
    accessToken: string;
    refreshToken: string;
};
export declare class twoFAService {
    private user2FAData;
    generate2FA(userId: number, method: twoFAMethod, destination?: string): string;
    send2FACode(userId: number): Promise<string | void>;
    verify2FACode(userId: number, code: string): boolean;
    complete2FA(userId: number, code: string): {
        accessToken: string;
        refreshToken: string;
    } | null;
}
//# sourceMappingURL=2FA.d.ts.map
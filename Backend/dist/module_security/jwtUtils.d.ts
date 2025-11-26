export type JwtPayload = {
    sub: number;
    tokenType?: string;
    twoFA?: boolean;
    [key: string]: any;
};
export declare function signAccessToken(userId: number, twoFA?: boolean): string;
export declare function signRefreshToken(userId: number): string;
export declare function verifyToken(token: string): JwtPayload | null;
//# sourceMappingURL=jwtUtils.d.ts.map
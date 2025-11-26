import prisma from "../prisma/client.js";
import { twoFAService } from "../../module_security/2FA.js";
import { verifyToken, signAccessToken } from "../../module_security/jwtUtils.js";
const twofa = new twoFAService();
export default async function twofaRoutes(fastify) {
    fastify.post("/verify-totp", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return reply.status(401).send({ error: "Invalid token" });
            const userId = payload.sub;
            const { code } = req.body;
            if (!code)
                return reply.status(400).send({ error: "QR code required" });
            const isValid = await twofa.verifyTOTP(userId, code);
            if (!isValid)
                return reply.status(400).send({ error: "Invalid QR code" });
            const accessToken = signAccessToken(userId, true);
            return reply.send({ message: "QR code verified", accessToken });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    fastify.post("/enable-totp", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return reply.status(401).send({ error: "Invalid token" });
            const userId = payload.sub;
            const { code } = req.body;
            if (!code)
                return reply.status(400).send({ error: "QR code required" });
            const ok = await twofa.enableTOTP(userId, code);
            if (!ok)
                return reply.status(400).send({ error: "Invalid QR code" });
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFAEnabled: true, twoFAMethod: "qr" }
            });
            return reply.send({ message: "QR code enabled successfully" });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    fastify.post("/disable-2fa", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return (reply.status(401).send({ error: "Invalid refresh token" }));
            const userId = payload.sub;
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFAEnabled: false, twoFAMethod: null },
            });
            return reply.send({ message: "2FA disabled successfully" });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    fastify.post("/enable-2fa", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized or missing refresh token" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return (reply.status(401).send({ error: "Invalid refresh token" }));
            const userId = payload.sub;
            const { type, destination } = req.body;
            if (!["email", "sms", "qr"].includes(type))
                return reply.status(400).send({ error: "Invalid 2FA type" });
            if (type === "qr") {
                const totpData = await twofa.generateTOTPSecret(userId);
                return reply.send({
                    message: "2FA QR code enabled",
                    method: "qr",
                    otpauthURL: totpData.otpauthURL,
                    qrCode: totpData.qrCode,
                });
            }
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFAEnabled: true, twoFAMethod: type },
            });
            if (type === "email" || type === "sms") {
                if (!destination)
                    return reply.status(400).send({ error: "Destination is required for email or sms 2FA" });
                await twofa.generate2FA(userId, type, destination);
                await twofa.send2FACode(userId);
                return reply.send({
                    message: "2FA enabled successfully",
                    method: type,
                });
            }
        }
        catch (err) {
            req.log.error(err);
            return (reply.status(500).send({ error: "Internal server error" }));
        }
    });
    fastify.post("/verify-2fa", async (req, reply) => {
        try {
            const { userId, code } = req.body;
            const tokens = await twofa.complete2FA(userId, code);
            if (!tokens)
                return (reply.status(401).send({ error: "Invalid 2FA code" }));
            await prisma.user.update({
                where: { id: userId },
                data: { status: "ONLINE" },
            });
            reply.setCookie("refreshToken", tokens.refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7
            });
            return (reply.send({
                message: "2FA successful",
                accessToken: tokens.accessToken
            }));
        }
        catch (err) {
            req.log.error(err);
            return (reply.status(500).send({ error: "Internal server error" }));
        }
    });
    fastify.post("/refresh", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Missing refresh token" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return (reply.status(401).send({ error: "Invalid refresh token" }));
            const newAccess = signAccessToken(payload.sub, true);
            return (reply.send({ accessToken: newAccess }));
        }
        catch (err) {
            req.log.error(err);
            return (reply.status(500).send({ error: "Internal server error" }));
        }
    });
}
//# sourceMappingURL=2FAJWT.routes.js.map
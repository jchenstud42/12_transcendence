import prisma from "../prisma/client.js";
import { twoFAService } from "../../module_security/2FA.js";
import { verifyToken, signAccessToken, signRefreshToken } from "../../module_security/jwtUtils.js";
import { sanitizeInput, validateEmail } from "../../security/inputSecurity.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../module_security/jwtUtils.js";
const twofa = new twoFAService();
export default async function twofaRoutes(fastify) {
    fastify.post("/verify-totp", async (req, reply) => {
        try {
            const { twoFAtoken, code } = req.body;
            if (!twoFAtoken)
                return reply.status(401).send({ error: "Missing 2FA token" });
            let payload;
            try {
                payload = jwt.verify(twoFAtoken, JWT_SECRET);
            }
            catch (e) {
                return reply.status(401).send({ error: "Invalid or expired 2FA token" });
            }
            const userId = payload.sub;
            if (!code)
                return reply.status(400).send({ error: "QR code required" });
            if (!/^\d{6}$/.test(code)) {
                return reply.status(400).send({ error: "Invalid code format" });
            }
            const isValid = await twofa.verifyTOTP(userId, code);
            if (!isValid)
                return reply.status(400).send({ error: "Invalid QR code" });
            const accessToken = signAccessToken(userId, true);
            const refreshToken = signRefreshToken(userId);
            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7
            });
            await prisma.user.update({
                where: { id: userId },
                data: { status: "ONLINE" },
            });
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
            const twoFAToken = jwt.sign({ sub: userId, twoFA: false }, JWT_SECRET, { expiresIn: "5m" });
            return reply.send({
                message: "QR code enabled successfully", method: "qr",
                twoFAToken
            });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    fastify.post("/disable-2fa", async (req, reply) => {
        try {
            console.log("disable-2FA route called");
            const refreshToken = req.cookies.refreshToken;
            req.log.info(`Refresh token: ${req.cookies.refreshToken}`);
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized" });
            const payload = verifyToken(refreshToken);
            req.log.info(`Token payload: ${JSON.stringify(payload)}`);
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
                await prisma.twoFA.upsert({
                    where: { userId },
                    update: { method: "qr", destination: null },
                    create: { userId, method: "qr", destination: null },
                });
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isTwoFAEnabled: true,
                        twoFAMethod: "qr",
                        twoFAdestination: null
                    }
                });
                const twoFAtoken = jwt.sign({ sub: userId, twoFA: false }, JWT_SECRET, { expiresIn: "5m" });
                return reply.send({
                    message: "2FA QR code enabled successfully",
                    method: type,
                    otpauthURL: totpData.otpauthURL,
                    qrCode: totpData.qrCode,
                    twoFAtoken
                });
            }
            if (!destination)
                return reply.status(400).send({ error: "Destination is required" });
            const dest = sanitizeInput(destination);
            if (type === "email")
                if (!validateEmail(dest))
                    return reply.status(400).send({ error: "invalid email address" });
            if (type === "sms") {
                const phoneRegex = /^(\+[1-9]\d{7,14}|0\d{8,9})$/;
                if (!phoneRegex.test(dest))
                    return reply.status(400).send({ error: "invalid phone number" });
            }
            await prisma.twoFA.upsert({
                where: { userId },
                update: { method: type, destination: dest },
                create: { userId, method: type, destination: dest },
            });
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isTwoFAEnabled: true,
                    twoFAMethod: type,
                    twoFAdestination: dest
                }
            });
            return reply.send({
                message: "2FA enabled successfully",
                method: type,
                destination: dest
            });
        }
        catch (err) {
            req.log.error(err);
            return (reply.status(500).send({ error: "Internal server error" }));
        }
    });
    fastify.post("/verify-2fa", async (req, reply) => {
        try {
            const { code, twoFAtoken } = req.body;
            req.log.info({ code, twoFAtoken }, "verify-2fa hit");
            if (!twoFAtoken)
                return reply.status(400).send({ error: "Missing 2FA token" });
            let payload;
            try {
                payload = jwt.verify(twoFAtoken, JWT_SECRET);
            }
            catch (e) {
                return reply.status(401).send({ error: "Invalid or expired 2FA token" });
            }
            const userId = payload.userId ?? payload.sub;
            req.log.info({ userId }, "decoded userId from token");
            if (!userId)
                return reply.status(400).send({ error: "Invalid token: no userId" });
            // Vérification du code 2FA
            const tokens = await twofa.complete2FA(userId, code);
            req.log.info({ tokens }, "tokens returned");
            if (!tokens)
                return reply.status(401).send({ error: "Invalid 2FA code" });
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
            return reply.send({
                message: "2FA successful",
                accessToken: tokens.accessToken,
                user: await prisma.user.findUnique({ where: { id: userId } })
            });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
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
import { AuthService } from "../services/auth.services.js";
import { signAccessToken, signRefreshToken } from "../../module_security/jwtUtils.js";
import { twoFAService } from "../../module_security/2FA.js";
import prisma from "../prisma/client.js";
const twofa = new twoFAService();
export function assertTwoFAMethod(method) {
    if (method === "email" || method === "sms" || method === "qr")
        return method;
    return null;
}
export default async function authRoutes(fastify) {
    const authService = new AuthService();
    fastify.post("/register", async (req, reply) => {
        try {
            const { username, email, password } = req.body;
            const user = await authService.register(username, email, password);
            return (reply.status(201).send({ user }));
        }
        catch (err) {
            return (reply.status(400).send({ error: err.message }));
        }
    });
    fastify.post("/login", async (req, reply) => {
        try {
            const { identifier, password } = req.body;
            const user = await authService.login(identifier, password);
            if (user.isTwoFAEnabled) {
                const twoFAMethod = assertTwoFAMethod(user.twoFAMethod);
                const twoFAtoken = signAccessToken(user.id, false);
                if (!twoFAMethod) {
                    return reply.status(400).send({
                        error: "2FA is enabled but no valid 2FA method is stored for this user."
                    });
                }
                if (twoFAMethod === "qr") {
                    return reply.send({
                        message: "2FA required",
                        userId: user.id,
                        twoFAtoken,
                        method: "qr"
                    });
                }
                const destination = user.twoFAdestination || user.email;
                await twofa.generate2FA(user.id, twoFAMethod, destination);
                await twofa.send2FACode(user.id);
                return (reply.status(200).send({ message: "2FA required", userId: user.id, method: twoFAMethod, twoFAtoken }));
            }
            const accessToken = signAccessToken(user.id, true);
            const refreshToken = signRefreshToken(user.id);
            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7
            });
            return reply.send({ user, accessToken });
        }
        catch (err) {
            return (reply.status(400).send({ error: err.message }));
        }
    });
    fastify.post("/logout", async (req, reply) => {
        try {
            const { userId } = req.body;
            const res = await authService.logout(userId);
            reply.clearCookie("refreshToken", {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                path: "/",
            });
            reply.setCookie("refreshToken", "", {
                httpOnly: true,
                secure: false,
                sameSite: "lax",
                expires: new Date(0),
                path: "/",
            });
            await prisma.user.update({
                where: { id: userId },
                data: { status: "OFFLINE" },
            });
            return (reply.send(res));
        }
        catch (err) {
            return (reply.status(400).send({ error: err.message }));
        }
    });
}
//# sourceMappingURL=auth.routes.js.map
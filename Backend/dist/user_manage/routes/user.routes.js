import { UserService } from "../services/user.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
import { signAccessToken, verifyToken } from "../../module_security/jwtUtils.js";
import prisma from "../prisma/client.js";
export default async function userRoutes(fastify) {
    const userService = new UserService();
    fastify.get("/me", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Not authenticated" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return reply.status(401).send({ error: "Invalid token" });
            const user = await prisma.user.findUnique({
                where: { id: payload.sub }
            });
            if (!user)
                return reply.status(404).send({ error: "User not found" });
            const accessToken = signAccessToken(user.id, true);
            return reply.send({ user, accessToken });
        }
        catch {
            return reply.status(500).send({ error: "Server error" });
        }
    });
    fastify.get("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
        const user = await userService.getUserProfile(Number(req.params.id));
        return reply.send(user);
    });
    fastify.put("/profile/:id", async (req, reply) => {
        const body = req.body;
        const updated = await userService.updateProfile(Number(req.params.id), body);
        return reply.send({ user: updated });
    });
    fastify.get("/status/:id", { preHandler: [authentizer()] }, async (req, reply) => {
        const status = await userService.getUserStatus(Number(req.params.id));
        return reply.send({ status });
    });
}
//# sourceMappingURL=user.routes.js.map
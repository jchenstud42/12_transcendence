import { UserService } from "../services/user.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
export default async function userRoutes(fastify) {
    const userService = new UserService();
    fastify.get("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
        const user = await userService.getUserProfile(Number(req.params.id));
        return reply.send(user);
    });
    fastify.put("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
        const body = req.body;
        const updated = await userService.updateProfile(Number(req.params.id), body);
        return reply.send(updated);
    });
    fastify.get("/status/:id", { preHandler: [authentizer()] }, async (req, reply) => {
        const status = await userService.getUserStatus(Number(req.params.id));
        return reply.send({ status });
    });
}
//# sourceMappingURL=user.routes.js.map
import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.js";

export default async function userRoutes(fastify: FastifyInstance) {
	const userService = new UserService();

	fastify.get("/profile/:id", async (req, reply) => {
		const user = await userService.getUserProfile(Number((req.params as any).id));
		return reply.send(user);
	});

	fastify.put("/profile/:id", async (req, reply) => {
		const body = req.body as { username?: string; avatar?: string };
		const updated = await userService.updateProfile(Number((req.params as any).id), body);
		return reply.send(updated);
	});

	fastify.get("/status/:id", async (req, reply) => {
		const status = await userService.getUserStatus(Number((req.params as any).id));
		return reply.send({ status });
	});
}

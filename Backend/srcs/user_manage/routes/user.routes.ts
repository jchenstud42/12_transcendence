import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
import { User } from "@prisma/client";

interface UserParams {
	id: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
	const userService = new UserService();

	fastify.get("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		const user = await userService.getUserProfile(Number((req.params as UserParams).id));
		return reply.send(user);
	});

	fastify.put("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		const body = req.body as { username?: string; avatar?: string };
		const updated = await userService.updateProfile(Number((req.params as UserParams).id), body);
		return reply.send(updated);
	});

	fastify.get("/status/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		const status = await userService.getUserStatus(Number((req.params as UserParams).id));
		return reply.send({ status });
	});
}

import { FastifyInstance } from "fastify";
import { UserService } from "../services/user.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
import { signAccessToken, verifyToken } from "../../module_security/jwtUtils.js";
import prisma from "../prisma/client.js"

interface UserParams {
	id: string;
}

export default async function userRoutes(fastify: FastifyInstance) {
	const userService = new UserService();

	fastify.get("/me", async (req, reply) => {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken)
				return reply.send({ user: null });

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

		} catch (err) {
			fastify.log.error(err);
			return reply.status(500).send({ error: "Server error" });
		}
	});


	fastify.get("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		const user = await userService.getUserProfile(Number((req.params as UserParams).id));
		return reply.send(user);
	});

	fastify.patch("/profile/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		console.log("TEST");
		try {
			const userId = Number((req.params as UserParams).id);

			const body = req.body as { username?: string; avatar?: string; email?: string; password?: string };
			const updated = await userService.updateProfile(userId, body);
			return reply.send({ user: updated });
		}
		catch (err: any) {
			console.error(err);
			if (err.message === "User already exists") {
				return reply.status(409).send({error: "User already exists",});}
			return reply.status(500).send({ error: "Server error" });
		}
	});

	fastify.get("/status/:id", { preHandler: [authentizer()] }, async (req, reply) => {
		const status = await userService.getUserStatus(Number((req.params as UserParams).id));
		return reply.send({ status });
	});

	fastify.get("/by-username/:username", { preHandler: [authentizer()] }, async (req, reply) => {
		const { username } = req.params as { username: string };

		const user = await prisma.user.findUnique({
			where: { username },
			select: {
				id: true,
				username: true,
				status: true
			}
		});

		if (!user)
			return (reply.status(404).send({ error: "User not found" }));

		return (reply.send(user));
	}
	);
}

import { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.services.js";

interface RegisterBody {
	userId: number;
	identifier: string;
	username: string;
	email: string;
	password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
	const authService = new AuthService();

	fastify.post("/register", async (req, reply) => {
		try {
			const { username, email, password } = req.body as RegisterBody;
			const user = await authService.register(username, email, password);
			return (reply.status(201).send({ user }));
		} catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});

	fastify.post("/login", async (req, reply) => {
		try {
			const { identifier, password } = req.body as RegisterBody;
			const user = await authService.login(identifier, password);
			return (reply.send({ user }));
		}
		catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});

	fastify.post("/logout", async (req, reply) => {
		try {
			const { userId } = req.body as RegisterBody;
			const res = await authService.logout(userId);
			return (reply.send(res));
		}
		catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});
}

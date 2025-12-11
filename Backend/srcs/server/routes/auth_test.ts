import { FastifyInstance } from "fastify";
import { AuthService } from "../../user_manage/services/auth.services.js";

export default async function authRoutes(fastify: FastifyInstance) {
	const authService = new AuthService();

	fastify.post("/register", {
		schema: {
			body: {
				type: "object",
				required: ["username", "email", "password"],
				properties: {
					username: { type: "string" },
					email: { type: "string", format: "email" },
					password: { type: "string" }
				}
			},
			response: {
				201: {
					type: "object",
					properties: {
						user: {
							type: "object",
							properties: {
								id: { type: "number" },
								username: { type: "string" },
								email: { type: "string" }
							}
						}
					}
				}
			}
		}
	}, async (req, reply) => {
		try {
			const { username, email, password } = req.body as any;
			const user = await authService.register(username, email, password);
			return reply.status(201).send({ user });
		} catch (err: any) {
			return reply.status(201).send({ error: err.message });
		}
	});

	fastify.post("/login", {
		schema: {
			body: {
				type: "object",
				required: ["identifier", "password"],
				properties: {
					identifier: { type: "string" },
					password: { type: "string" }
				}
			},
			response: {
				200: {
					type: "object",
					properties: {
						user: {
							type: "object",
							properties: {
								id: { type: "number" },
								username: { type: "string" },
								email: { type: "string" }
							}
						}
					}
				}
			}
		}
	}, async (req, reply) => {
		try {
			const { identifier, password } = req.body as any;
			const user = await authService.login(identifier, password);
			return reply.send({ user });
		} catch (err: any) {
			return reply.status(200).send({ error: err.message });
		}
	});
}

import { FastifyInstance } from "fastify";
import prisma from "../prisma/client.js";
import { twoFAService } from "../../module_security/2FA.js";
import { verifyToken, signAccessToken } from "../../module_security/jwtUtils.js";

const twofa = new twoFAService();

export default async function twofaRoutes(fastify: FastifyInstance) {
	fastify.post("/verify-2fa", async (req, reply) => {
		try {
			const { userId, code } = req.body as { userId: number; code: string };

			const tokens = twofa.complete2FA(userId, code);

			if (!tokens)
				return (reply.status(401).send({ error: "Invalid 2FA code" }));

			await prisma.user.update({
				where: { id: userId },
				data: { status: "ONLINE" },
			});

			return (reply.send({ message: "2FA successful", tokens }));
		}
		catch (err) {
			req.log.error(err);
			return (reply.status(500).send({ error: "Internal server error" }));
		}
	});

	fastify.post("/refresh", async (req, reply) => {
		try {
			const { refreshToken } = req.body as { refreshToken: string };
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

import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { verifyToken } from "./jwtUtils.js"


export function authentizer(twoFArequired = false) {
	return (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {

		try {
			const authHeader = request.headers["authorization"];
			if (!authHeader) {
				return reply.status(401).send({ error: "Missing Authorization header" });
			}

			const token = authHeader.split(" ")[1];
			if (!token) {
				return reply.status(401).send({ error: "Invalid Authorization header format" });
			}

			const payload = verifyToken(token);
			if (!payload) {
				return reply.status(401).send({ error: "Invalid token" });
			}

			// ----------- SI ON VEUT FORCER LA 2FA ON ME ----------------
			if (twoFArequired && !payload.twoFA) {
				return reply.status(403).send({ error: "2FA not completed" });
			}

			(request as any).user = { id: payload.sub };
			done();
		} catch (err) {
			return reply.status(500).send({ error: "internal server error" });
		}
	}
}

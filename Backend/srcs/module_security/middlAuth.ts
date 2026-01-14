import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { verifyToken } from "./jwtUtils.js"



/**
 * Un middleware authentizer, c'est ce qui va etre rajoute a certaines routes pour les rendre "protegees"
 * On verifie simplement si les tokens sont present, si ils ne le sont pas/pas valides alors l'acces est refuse.
 */
export function authentizer(twoFArequired = false) {
	return (request: FastifyRequest, reply: FastifyReply, done: HookHandlerDoneFunction) => {

		try {

			let token: string | undefined;

			if (request.cookies?.accessToken) {
				token = request.cookies.accessToken;
			}
			else {
				const authHeader = request.headers["authorization"];
				if (authHeader && authHeader.startsWith("Bearer "))
					token = authHeader.split(" ")[1];

			}
			if (!token) {
				return reply.status(401).send({ error: "Missing token" });
			}
			const payload = verifyToken(token);
			if (!payload) {
				return reply.status(401).send({ error: "Invalid token" });
			}

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

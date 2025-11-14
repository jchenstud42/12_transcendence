import { FastifyInstance } from "fastify";
import { MatchService } from "../services/match.service.js";
import { authentizer } from "../../module_security/middlAuth.js"

export default async function matchRoutes(fastify: FastifyInstance) {
	const matchService = new MatchService();

	fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
		const matches = await matchService.getMatchHistory(Number((req.params as any).userId));
		return (reply.send(matches));
	});

	fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
		const { player1Id, player2Id, score1, score2, winnerId } = req.body as any;
		const match = await matchService.addMatch(player1Id, player2Id, score1, score2, winnerId);
		return (reply.send(match));
	});
}

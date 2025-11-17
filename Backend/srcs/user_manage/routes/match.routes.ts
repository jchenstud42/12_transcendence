import { FastifyInstance } from "fastify";
import { MatchService } from "../services/match.service.js";
import { authentizer } from "../../module_security/middlAuth.js"

interface MatchParams {
	userId: string;
}

interface MatchBody {
	player1Id: number;
	player2Id: number;
	score1: number;
	score2: number;
	winnerId: number;
}

export default async function matchRoutes(fastify: FastifyInstance) {
	const matchService = new MatchService();

	fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
		const matches = await matchService.getMatchHistory(Number((req.params as MatchParams).userId));
		return (reply.send(matches));
	});

	fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
		const { player1Id, player2Id, score1, score2, winnerId } = req.body as MatchBody;
		const match = await matchService.addMatch(player1Id, player2Id, score1, score2, winnerId);
		return (reply.send(match));
	});
}

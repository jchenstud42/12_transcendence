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
	player1Name?: string;
	player2Name?: string;
	nbrOfBallHit?: number;
	nbrOfBallMissed?: number;
	matchTime?: number;
}

export default async function matchRoutes(fastify: FastifyInstance) {
	const matchService = new MatchService();

	fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
		const matches = await matchService.getMatchHistory(Number((req.params as MatchParams).userId));
		return reply.send(matches);
	});

	fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
		const { player1Id, player2Id, score1, score2, winnerId, player1Name, player2Name, nbrOfBallHit, nbrOfBallMissed, matchTime } = req.body as MatchBody;

		const dbPlayer1Id = (player1Id >= 100 && player1Id < 300) ? null : player1Id;
		const dbPlayer2Id = (player2Id >= 100 && player2Id < 300) ? null : player2Id;
		const dbWinnerId = (winnerId >= 100 && winnerId < 300) ? null : winnerId;
		
		const match = await matchService.addMatch(
			dbPlayer1Id, 
			dbPlayer2Id, 
			score1, 
			score2, 
			dbWinnerId,
			player1Name,
			player2Name,
			nbrOfBallHit,
			nbrOfBallMissed,
			matchTime
		);
		
		return reply.send(match);
	});
}
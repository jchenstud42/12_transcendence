import { MatchService } from "../services/match.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
export default async function matchRoutes(fastify) {
    const matchService = new MatchService();
    fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
        const matches = await matchService.getMatchHistory(Number(req.params.userId));
        return reply.send(matches);
    });
    fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
        const { player1Id, player2Id, score1, score2, winnerId, player1Name, player2Name } = req.body;
        const dbPlayer1Id = ((player1Id >= 100 && player1Id < 200) || (player1Id >= 200 && player1Id < 300)) ? null : player1Id;
        const dbPlayer2Id = (player2Id >= 200 && player2Id < 300) ? null : player2Id;
        const dbWinnerId = ((winnerId >= 100 && winnerId < 200) || (winnerId >= 200 && winnerId < 300)) ? null : winnerId;
        const match = await matchService.addMatch(dbPlayer1Id, dbPlayer2Id, score1, score2, dbWinnerId, player1Name, player2Name);
        return reply.send(match);
    });
}
//# sourceMappingURL=match.routes.js.map
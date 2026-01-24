import { StatsService } from "../services/stats_service.js";
import { authentizer } from "../../module_security/middlAuth.js";
export default async function statsRoutes(fastify) {
    const statsService = new StatsService();
    // Get stats for a specific user
    fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
        const userId = Number(req.params.userId);
        const stats = await statsService.getStats(userId);
        // If no stats exist, return default empty stats (not an error)
        if (!stats) {
            return reply.send({
                userId,
                gamesPlayed: 0,
                gamesWon: 0,
                matchTime: 0
            });
        }
        return reply.send(stats);
    });
    // Get all stats (leaderboard)
    fastify.get("/", { preHandler: [authentizer()] }, async (req, reply) => {
        const allStats = await statsService.getAllStats();
        return reply.send(allStats);
    });
    // Upsert stats (create or update)
    fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
        const { userId, gamesPlayed, gamesWon, matchTime } = req.body;
        const stats = await statsService.upsertStats(userId, gamesPlayed ?? 1, gamesWon ?? 0, matchTime ?? 0);
        return reply.send(stats);
    });
    // Reset stats for a user
    fastify.put("/reset/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
        const userId = Number(req.params.userId);
        try {
            const stats = await statsService.resetStats(userId);
            return reply.send(stats);
        }
        catch (err) {
            return reply.status(404).send({ error: "Stats not found" });
        }
    });
    // Delete stats for a user
    fastify.delete("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
        const userId = Number(req.params.userId);
        try {
            await statsService.deleteStats(userId);
            return reply.send({ message: "Stats deleted successfully" });
        }
        catch (err) {
            return reply.status(404).send({ error: "Stats not found" });
        }
    });
}
//# sourceMappingURL=stats.routes.js.map
import prisma from "../prisma/client.js";
export class StatsService {
    /**
     * Create or update stats for a user
     * If stats exist, they will be updated (incremented)
     * If not, a new stats record will be created
     */
    async upsertStats(userId, gamesPlayed = 1, gamesWon = 0, matchTime = 0) {
        // Try to find existing stats
        const existingStats = await prisma.stats.findUnique({
            where: { userId }
        });
        if (existingStats) {
            // Update existing stats by incrementing values
            return await prisma.stats.update({
                where: { userId },
                data: {
                    gamesPlayed: existingStats.gamesPlayed + gamesPlayed,
                    gamesWon: existingStats.gamesWon + gamesWon,
                    matchTime: existingStats.matchTime + matchTime
                }
            });
        }
        else {
            // Create new stats record
            return await prisma.stats.create({
                data: {
                    userId,
                    gamesPlayed,
                    gamesWon,
                    matchTime
                }
            });
        }
    }
    /**
     * Get stats for a specific user
     */
    async getStats(userId) {
        return await prisma.stats.findUnique({
            where: { userId }
        });
    }
    /**
     * Get all stats (for leaderboards, etc.)
     */
    async getAllStats() {
        return await prisma.stats.findMany({
            orderBy: { gamesWon: 'desc' }
        });
    }
    /**
     * Reset stats for a user
     */
    async resetStats(userId) {
        return await prisma.stats.update({
            where: { userId },
            data: {
                gamesPlayed: 0,
                gamesWon: 0,
                matchTime: 0
            }
        });
    }
    /**
     * Delete stats for a user
     */
    async deleteStats(userId) {
        return await prisma.stats.delete({
            where: { userId }
        });
    }
}
//# sourceMappingURL=stats_service.js.map
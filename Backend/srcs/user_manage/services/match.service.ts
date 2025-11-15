import prisma from "../prisma/client.js";

export class MatchService {
	async addMatch(player1Id: number, player2Id: number, score1: number, score2: number, winnerId: number,) {
		return (await prisma.match.create({
			data: { player1Id, player2Id, score1, score2, winnerId, },
		}));
	}

	async getMatchHistory(userId: number) {
		return (await prisma.match.findMany({
			where: {
				OR: [{ player1Id: userId }, { player2Id: userId }] },
			select: {
				id : true,
				score1 :true,
				score2 : true,
				winnerId : true,
				date : true,
				player1: { select: { username: true } },
				player2: { select: { username: true } },
			},
			orderBy: { date: "desc" },
		}));
	}
}

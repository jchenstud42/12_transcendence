import prisma from "../prisma/client.js";

export class MatchService {
	async addMatch(
			player1Id: number | null, 
			player2Id: number | null, 
			score1: number, 
			score2: number, 
			winnerId: number | null,
			player1Name?: string,
			player2Name?: string,
			nbrOfBallHit?: number,
			nbrOfBallMissed?: number,
			matchTime?: number
		) {
		const data: any = {score1, score2,};

		if (player1Id !== null) {
			data.player1Id = player1Id;
		}
		if (player2Id !== null) {
			data.player2Id = player2Id;
		}
		if (winnerId !== null) {
			data.winnerId = winnerId;
		}

		if (player1Name) {
			data.player1GuestName = player1Name;
		}
		if (player2Name) {
			data.player2GuestName = player2Name;
		}

		if (nbrOfBallHit !== undefined) {
			data.nbrOfBallHit = nbrOfBallHit;
		}
		if (nbrOfBallMissed !== undefined) {
			data.nbrOfBallMissed = nbrOfBallMissed;
		}
		if (matchTime !== undefined) {
			data.matchTime = matchTime;
		}

		return await prisma.match.create({ data });
	}

	async getMatchHistory(userId: number) {
		const matches = await prisma.match.findMany({
			where: {
				OR: [
					{ player1Id: userId }, 
					{ player2Id: userId }
				]
			},
			select: {
				id: true,
				score1: true,
				score2: true,
				winnerId: true,
				date: true,
				player1: { select: { id: true, username: true } },
				player2: { select: { id: true, username: true } },
				player1GuestName: true,
				player2GuestName: true,
				nbrOfBallHit: true,
				nbrOfBallMissed: true,
				matchTime: true
			},
			orderBy: { date: "desc" },
		});

		return matches.map(match => ({
			...match,
			player1: match.player1 || { id: null, username: match.player1GuestName || "Guest" },
			player2: match.player2 || { id: null, username: match.player2GuestName || "Guest" },
		}));
	}
}
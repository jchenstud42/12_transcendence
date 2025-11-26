export declare class MatchService {
    addMatch(player1Id: number, player2Id: number, score1: number, score2: number, winnerId: number): Promise<{
        id: number;
        date: Date;
        score1: number;
        score2: number;
        player1Id: number;
        player2Id: number;
        winnerId: number | null;
    }>;
    getMatchHistory(userId: number): Promise<{
        id: number;
        date: Date;
        score1: number;
        score2: number;
        player1: {
            username: string;
        };
        player2: {
            username: string;
        };
        winnerId: number | null;
    }[]>;
}
//# sourceMappingURL=match.service.d.ts.map
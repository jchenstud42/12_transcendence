export interface GameInfo {
    isTournament: boolean;
    playerNbr: number;
    maxPlayer: number;
    aiNbr: number;
    playerNames: [string, boolean][];
    aiNames: string[];
    nameEntered: number;
}

export const gameInfo: GameInfo = {
    isTournament: false,
    playerNbr: 2,
    maxPlayer: 2,
    aiNbr: 0,
    playerNames: [],
    aiNames: ["Nietzche", "Aurele", "Sun Tzu", "Socrate"],
    nameEntered: 0,
};

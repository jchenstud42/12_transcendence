export class Player {
    constructor(name, isAi, playerNbr, userId = null) {
        this.name = "";
        this.playerNbr = 0;
        this.paddle = null;
        this.point = 0;
        this.gameWon = 0;
        this.isAi = false;
        this.name = name;
        this.isAi = isAi;
        this.playerNbr = playerNbr;
        if (userId !== null) {
            this.userId = userId;
        }
        else {
            // Caller (Game) should assign and register guest IDs; use -1 as placeholder if missing
            this.userId = -1;
        }
    }
}

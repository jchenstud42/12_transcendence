
export class Player {
	name: string = "";
	playerNbr: number = 0;
	paddle: HTMLDivElement | null = null;
	point: number = 0;
	gameWon: number = 0;
	isAi: boolean = false;
	userId: number;

	constructor(name: string, isAi: boolean, playerNbr: number, userId: number | null = null) {
		this.name = name;
		this.isAi = isAi;
		this.playerNbr = playerNbr;

		if (userId !== null) {
			this.userId = userId;
		} else {
			// Caller (Game) should assign and register guest IDs; use -1 as placeholder if missing
			this.userId = -1;
		}

	}
}

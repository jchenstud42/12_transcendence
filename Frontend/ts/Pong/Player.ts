
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
		}
		else {
			this.userId = generateGuestId();
			guestPlayers.set(this.userId, name);
		}

	}
}


function generateLoggedUserId(): number {
	const id = loggedUserCounter;
	loggedUserCounter++;
	if (loggedUserCounter >= 200) loggedUserCounter = 100;
	return id;
}

function generateGuestId(): number {
	const id = guestIdCounter;
	guestIdCounter++;
	if (guestIdCounter >= 300) guestIdCounter = 200;
	return id;
}
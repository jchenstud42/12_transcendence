import { Player } from './Player.js';
import { showPlayerName } from './menu.js';


export class GameInfo {
	isTournament: boolean;
	playerNbr: number;
	maxPlayer: number;
	aiNbr: number = 0;
	playersName: [string, boolean][] = [];
	nameEntered: number = 0;
	currentUser: any;
	players: Player[] = [];

	loggedUserCounter = 100;
	guestIdCounter = 200;
	guestPlayers = new Map<number, string>();
	aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"];

	constructor() {
		this.isTournament = false;
		this.playerNbr = 2;
		this.maxPlayer = 2;
	}

	resetGameInfo() {
		this.isTournament = false;
		this.playerNbr = 2;
		this.maxPlayer = 2;
		this.aiNbr = 0;
		this.playersName = [];
		this.nameEntered = 0;
		this.players = [];
		this.guestPlayers.clear();
		this.loggedUserCounter = 100;
		this.guestIdCounter = 200;
	}

	public createPlayers() {
		this.players = this.playersName.map(([playerName, isAi], playerNbr) => {
			const isCurrentUser = this.currentUser && !isAi && playerName === this.currentUser.username;
			if (isCurrentUser) {
				return new Player(playerName, isAi, playerNbr, this.currentUser.id);
			} else {
				// register guest id and store mapping
				const guestId = this.registerGuest(playerName);
				return new Player(playerName, isAi, playerNbr, guestId);
			}
		});
	}

	createAiName() {
		for (let i = 0; i < this.aiNbr; i++) {
			const aiName = this.aiNames[i];
			this.playersName.push([aiName, true]);
			showPlayerName(aiName, this.nameEntered, true);
			this.nameEntered++;
		}
	}

	private registerGuest(name: string): number {
		const id = this.guestIdCounter;
		this.guestIdCounter++;
		if (this.guestIdCounter >= 300) this.guestIdCounter = 200;
		this.guestPlayers.set(id, name);
		return id;
	}

	public setCurrentUser(user: any) {
    	this.currentUser = user;
	}
};
import { shuffleArray } from "./pong_utils";

const paddle_left = document.getElementById("left-paddle") as HTMLDivElement;
const paddle_right = document.getElementById("right-paddle") as HTMLDivElement;
const ball = document.getElementById("ball") as HTMLDivElement;

const PONG_WIDTH = 600;
const PONG_HEIGHT = 400;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 10;


const pong_button 		= 	document.getElementById("pong-button")!;
/* const qmatch_button 	= 	document.getElementById("quick-match-button")!;
const tournament_button = 	document.getElementById("tournament-button")!; */

const enterPlayerNbr_text 	= 	document.getElementById("enterPlayerNbr-text")! as HTMLHeadingElement;
const playerNbr_text 	= 	document.getElementById("playerNbr-text")! as HTMLHeadingElement;
const playerIncr_button = 	document.getElementById("increasePlayer-button")!;
const playerDecr_button = 	document.getElementById("decreasePlayer-button")!;
const OK_button 		= 	document.getElementById("OK-button")!;
const play_button 		= 	document.getElementById("play-button")!;

const playerName_container	= 	document.getElementById("playerName-container")! as HTMLDivElement;
const playerName_input		= 	document.getElementById("playerName-input")! as HTMLInputElement;
const playerColors 			= 	["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
const playersList 			= 	document.getElementById("players-list") as HTMLDivElement;

class Player {
  name: string = "";
  paddle: HTMLDivElement | null = null;
  point: number = 0;
  gameWon: number = 0;
  isAi: boolean = false

  constructor(name: string, isAi: boolean) {
    this.name = name;
	this.isAi = isAi;
  }
}

class Game {
	players: Player[] = [];
  	winner: Player | null = null;

	constructor(playersName: [string, boolean][]) {
		this.players = playersName.map(name => new Player(name[0], name[1]));
		if (playersName.length > 2)
			this.createTournament();
		/* else play a normal game */
  }

	public createTournament() {
		const shuffled: Player[] = shuffleArray(this.players);
		playersList.innerHTML = "";
		shuffled.forEach(({name}, i) => {
			addPlayerNameLabel(name, i);
		});
	}
}

//////////////////////////////////////////////////
//				EVENT / LISTENER				//
/////////////////////////////////////////////////


pong_button.addEventListener("click", () => {
  	pong_button.classList.add("hidden");
	enterPlayerNbr();
});


//////////////////////////////////////////////////
//				CHANGE DISPLAY					//
/////////////////////////////////////////////////

let playerNbr = 1
let aiNbr = 0
const maxPlayer = 4;
let mode: "players" | "ai" = "players"

function enterPlayerNbr() {
	enterPlayerNbr_text.classList.remove("hidden");
	playerNbr_text.classList.remove("hidden");
	playerIncr_button.classList.remove("hidden");
	playerDecr_button.classList.remove("hidden");
	OK_button.classList.remove("hidden");
}

playerIncr_button.addEventListener("click", () => {
	if (mode === "players") {
		if (playerNbr < maxPlayer) {
			playerNbr++;
			playerNbr_text.textContent = playerNbr.toString();
		}
	} else {
		if (aiNbr + playerNbr < maxPlayer) {
			aiNbr++;
			playerNbr_text.textContent = aiNbr.toString();
		}
	}
})

playerDecr_button.addEventListener("click", () => {
	if (mode === "players") {
		if (playerNbr > 1) {
			playerNbr--;
			playerNbr_text.textContent = playerNbr.toString();
		}
	} else {
		let minAi = 0

		if (playerNbr === 1)
			minAi = 1

		if (aiNbr > minAi) {
			aiNbr--;
			playerNbr_text.textContent = aiNbr.toString();
		}
	}
})

OK_button.addEventListener("click", () => {
	if (mode == "players") {
		mode = "ai"
		enterAiNbr();
	} else
		enterPlayerName()
})

let playerNames: [string, boolean][] = [];
const aiNames = ["AI-Nietzche", "AI-Aurele", "AI-Sun Tzu"]
let nameEntered = 0;

playerName_input.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter") {
		const playerName = playerName_input.value.trim();

		const nameAlreadyUsed = playerNames.some(
			([name, _isAI]) => name === playerName
		);

		if (playerName !== "" && !nameAlreadyUsed) {
			playerName_input.value = "";
			playerNames.push([playerName, false]);
			addPlayerNameLabel(playerName, nameEntered);
			nameEntered++;
		}

		if (nameEntered === playerNbr) {
			playerName_container.classList.add("hidden")

			for (let y = 0; y < aiNbr; y++) {
				const aiName = aiNames[y]

				addPlayerNameLabel(aiName, nameEntered + y);
				playerNames.push([aiName, true]);
			}

			//const game = new Game(players);
		}
	}
})

function enterAiNbr() {
	enterPlayerNbr_text.textContent = "How Many Player (AI):";
	if (playerNbr === 1) {
		aiNbr = 1;
		playerNbr_text.textContent = playerNbr.toString();
	} else
		playerNbr_text.textContent = "0";
}

function enterPlayerName() {
	enterPlayerNbr_text.classList.add("hidden")
	playerNbr_text.classList.add("hidden")
	playerIncr_button.classList.add("hidden")
	playerDecr_button.classList.add("hidden")
	OK_button.classList.add("hidden")

	playerName_container.classList.remove("hidden")
	playersList.classList.remove("hidden")
}


function addPlayerNameLabel(name: string, index: number) {
  	const label = document.createElement("div");

  	const colorClass = playerColors[index];
  	label.className = `player-name-item text-center font-bold ${colorClass} text-2xl min-w-[120px]`;
  	label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;

	playersList.appendChild(label);
}

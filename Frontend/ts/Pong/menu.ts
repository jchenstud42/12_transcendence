import { PONG_UI } from './elements.js';
//import { gameInfo } from './game.js';
import { Game } from './Game.js';

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;

//Status of the keys used to move paddle
const keys = {
	w: false,
	s: false,
	ArrowUp: false,
	ArrowDown: false
};

const game = new Game();

///////////////////////////////////////////////////////////
/////				EVENTS LISTENER					 /////
//////////////////////////////////////////////////////////

export function initMenuEvents() {

	PONG_UI.pongButton.addEventListener("click", () => {
		showMatchSelectionMenu();
	});

	PONG_UI.qmatchButton.addEventListener("click", () => {
		hideMatchSelectionMenu();
		showPlayerNbrMenu();
	});

	PONG_UI.tournamentButton.addEventListener("click", () => {
		hideMatchSelectionMenu();
		game.isTournament = true;
		game.playerNbr = 4;
		game.maxPlayer = 4;
		PONG_UI.playerNbrText.textContent = game.playerNbr.toString();
		showPlayerNbrMenu();
	});

	PONG_UI.playerIncrButton.addEventListener("click", () => {
		if (game.playerNbr < game.maxPlayer) {
			game.playerNbr++;
			PONG_UI.playerNbrText.textContent = game.playerNbr.toString();

			game.aiNbr--;
			PONG_UI.aiNbrText.textContent = game.aiNbr.toString();
		}
	})

	PONG_UI.playerDecrButton.addEventListener("click", () => {
		if (game.playerNbr > 0) {
			game.playerNbr--;
			PONG_UI.playerNbrText.textContent = game.playerNbr.toString();

			game.aiNbr++;
			PONG_UI.aiNbrText.textContent = game.aiNbr.toString();
		}
	})

	PONG_UI.okButton.addEventListener("click", () => {
		hidePlayerNbrMenu();
		if (PONG_UI.playersArea)
			PONG_UI.playersArea.classList.remove("hidden");

		const loggedUsername = getLoggedUsername();

		if (loggedUsername) {
			game.playerNames.push([loggedUsername, false]);
			showPlayerName(loggedUsername, 0, false);
			game.nameEntered = 1;
		}

		if (game.playerNbr > game.nameEntered) {
			showPlayerNameMenu();
		} else {
			//Only two players and one of them is an AI
			showAiName();
			//game.startQuickMatch()//HERE
		}
	});

	PONG_UI.playerNameInput.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			const playerName = PONG_UI.playerNameInput.value.trim();

			const nameAlreadyUsed = game.playerNames.some(
				([name, _isAI]) => name === playerName
			);

			if (playerName !== "" && !nameAlreadyUsed) {
				PONG_UI.playerNameInput.value = "";
				game.playerNames.push([playerName, false]);
				showPlayerName(playerName, game.nameEntered, false);
				game.nameEntered++;
			}

			if (game.nameEntered === game.playerNbr) {
				PONG_UI.playerNameContainer.classList.add("hidden")

				// Reset scores display
				if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = "0";
				if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = "0";

				showAiName();
				//game.startQuickMatch()//HERE
			}
		}
	})

	//Here I think its the buttons between goals, So the game has already been created when arriving here
	PONG_UI.playButton.addEventListener("click", () => {
		//game.startMatch();
	});

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Enter" && !PONG_UI.playButton.classList.contains("hidden")) {
			//game.startMatch();
		}
	});


}

///////////////////////////////////////////////////////////
/////				SHOW/HIDE MENU					  /////
//////////////////////////////////////////////////////////

function showMatchSelectionMenu() {
	PONG_UI.pongButton.classList.add("hidden");
	PONG_UI.qmatchButton.classList.remove("hidden");
	PONG_UI.tournamentButton.classList.remove("hidden");
}

function hideMatchSelectionMenu() {
	PONG_UI.qmatchButton.classList.add("hidden");
	PONG_UI.tournamentButton.classList.add("hidden");
}

function showPlayerNbrMenu() {
	PONG_UI.enterPlayerNbrText.classList.remove("hidden");
	PONG_UI.playerNbrText.classList.remove("hidden");
	PONG_UI.playerIncrButton.classList.remove("hidden");
	PONG_UI.playerDecrButton.classList.remove("hidden");
	PONG_UI.aiCounter.classList.remove("hidden");
	PONG_UI.okButton.classList.remove("hidden");
}

function hidePlayerNbrMenu() {
	PONG_UI.enterPlayerNbrText.classList.add("hidden")
	PONG_UI.playerNbrText.classList.add("hidden")
	PONG_UI.aiCounter.classList.add("hidden");
	PONG_UI.playerIncrButton.classList.add("hidden")
	PONG_UI.playerDecrButton.classList.add("hidden")
	PONG_UI.okButton.classList.add("hidden")
}

function showPlayerNameMenu() {
	PONG_UI.playerNameContainer.classList.remove("hidden")
}

function showPlayerName(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = PONG_UI.playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
	if (!isAi)
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	PONG_UI.playersList.appendChild(label);

}

function showAiName() {
	for (let y = 0; y < game.aiNbr; y++) {
		const aiName = game.aiNames[y]

		showPlayerName(aiName, game.nameEntered + y, true);
		game.playerNames.push([aiName, true]);
	}
}

function hideMenu(...toHide: (HTMLElement | null | undefined)[]) {
	toHide.forEach(menu => menu?.classList.add("hidden"));
}

export function resetGameMenu() {

	pendingTimeouts.forEach(id => clearTimeout(id));
	pendingTimeouts = [];

	disableKeyListeners();

	keys.w = false;
	keys.s = false;
	keys.ArrowUp = false;
	keys.ArrowDown = false;

	game.ball.active = false;
	game.ball.reset();
	game.ball.initBallPos();

	if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = "0";
	if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = "0";

	hideMenu(PONG_UI.okButton, PONG_UI.leftPaddle, PONG_UI.rightPaddle, PONG_UI.readyText, PONG_UI.goText, PONG_UI.playerNameContainer, PONG_UI.increasePlayerButton,
		PONG_UI.decreasePlayerButton, PONG_UI.ball, PONG_UI.aiCounter, PONG_UI.playersArea);

	PONG_UI.enterPlayerNbrText.classList.add("hidden");
	PONG_UI.playerNbrText.classList.add("hidden");
	PONG_UI.playersList.innerHTML = "";
	PONG_UI.finalList.innerHTML = "";
	PONG_UI.finalList.classList.add("hidden");
	PONG_UI.winnerName.innerHTML = "";
	game.playerNames = [];
	game.nameEntered = 0;
	game.isTournament = false;
	game.playerNbr = 2;
	game.maxPlayer = 2;
	game.aiNbr = 0;
	PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
	PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;

	PONG_UI.playerNbrText.textContent = game.playerNbr.toString();
	PONG_UI.aiNbrText.textContent = game.aiNbr.toString();

	PONG_UI.pongButton.classList.remove("hidden");
	PONG_UI.qmatchButton.classList.add("hidden");
	PONG_UI.tournamentButton.classList.add("hidden");
	PONG_UI.playButton.classList.add("hidden");
}


///////////////////////////////////////////////////////////
/////			FETCH BACKEND DATA				 	 /////
//////////////////////////////////////////////////////////

function getLoggedUsername(): string | null {
	const userRaw = localStorage.getItem("user");
	if (!userRaw)
		return (null);

	try {
		const user = JSON.parse(userRaw);
		return (user?.username ?? null);
	}
	catch {
		return (null);
	}
}

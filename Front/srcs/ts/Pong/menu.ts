import { UI } from './elements.js';
import { gameInfo } from './state.js';
//import { Game } from './game.js';

export function initMenuEvents() {
	UI.pongButton.addEventListener("click", () => {
		UI.pongButton.classList.add("hidden");
		UI.qmatchButton.classList.remove("hidden");
		UI.tournamentButton.classList.remove("hidden");
	});

		UI.qmatchButton.addEventListener("click", () => {
		UI.qmatchButton.classList.add("hidden");
		UI.tournamentButton.classList.add("hidden");
		enterPlayerNbr();
	});

	UI.tournamentButton.addEventListener("click", () => {
		UI.qmatchButton.classList.add("hidden");
		UI.tournamentButton.classList.add("hidden");
		gameInfo.isTournament = true;
		gameInfo.playerNbr = 4;
		gameInfo.maxPlayer = 4;
		UI.playerNbrText.textContent = gameInfo.playerNbr.toString();
		enterPlayerNbr();
	});

	UI.playerIncrButton.addEventListener("click", () => {
		if (gameInfo.playerNbr < gameInfo.maxPlayer) {
			gameInfo.playerNbr++;
			UI.playerNbrText.textContent = gameInfo.playerNbr.toString();

			gameInfo.aiNbr--;
			UI.aiNbrText.textContent = gameInfo.aiNbr.toString();
		}
	})

	UI.playerDecrButton.addEventListener("click", () => {
		if (gameInfo.playerNbr > 0) {
			gameInfo.playerNbr--;
			UI.playerNbrText.textContent = gameInfo.playerNbr.toString();

			gameInfo.aiNbr++;
			UI.aiNbrText.textContent = gameInfo.aiNbr.toString();
		}
	})

	UI.okButton.addEventListener("click", () => {
		hidePlayerNbrMenu();
		if (UI.playersArea) {
			UI.playersArea.classList.remove("hidden");
		} else {
			console.warn("players-area element not found in DOM");
		}

		if (gameInfo.playerNbr > 0) {
			enterPlayerName();
		} else {
			addAiNameLabel();
			console.log("Game Creation")
			//const game = new Game(gameInfo.playerNames);
		}
	});

	UI.playerNameInput.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Enter") {
			const playerName = UI.playerNameInput.value.trim();

			const nameAlreadyUsed = gameInfo.playerNames.some(
				([name, _isAI]) => name === playerName
			);

			if (playerName !== "" && !nameAlreadyUsed) {
				UI.playerNameInput.value = "";
				gameInfo.playerNames.push([playerName, false]);
				addPlayerNameLabel(playerName, gameInfo.nameEntered, false);
				gameInfo.nameEntered++;
			}

			if (gameInfo.nameEntered === gameInfo.playerNbr) {
				UI.playerNameContainer.classList.add("hidden")

				// Reset scores display
				if (UI.scoreLeft) UI.scoreLeft.textContent = "0";
				if (UI.scoreRight) UI.scoreRight.textContent = "0";

				addAiNameLabel();
				console.log("Game Creation")
				//const game = new Game(gameInfo.playerNames);
			}
		}
	})
}

// Shared state is in `state.ts` (imported above as `gameInfo`)

function enterPlayerNbr() {
	UI.enterPlayerNbrText.classList.remove("hidden");
	UI.playerNbrText.classList.remove("hidden");
	UI.playerIncrButton.classList.remove("hidden");
	UI.playerDecrButton.classList.remove("hidden");

	UI.aiCounter.classList.remove("hidden");

	UI.okButton.classList.remove("hidden");
}


function hidePlayerNbrMenu() {
	UI.enterPlayerNbrText.classList.add("hidden")
	UI.playerNbrText.classList.add("hidden")
	UI.aiCounter.classList.add("hidden");
	UI.playerIncrButton.classList.add("hidden")
	UI.playerDecrButton.classList.add("hidden")
	UI.okButton.classList.add("hidden")
}



function enterPlayerName() {
	UI.playerNameContainer.classList.remove("hidden")
}


export function addPlayerNameLabel(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = UI.playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
	if (!isAi)
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	UI.playersList.appendChild(label);

}

export function addAiNameLabel() {
    for (let y = 0; y < gameInfo.aiNbr; y++) {
        const aiName = gameInfo.aiNames[y];

        addPlayerNameLabel(aiName, gameInfo.nameEntered + y, true);
        gameInfo.playerNames.push([aiName, true]);
    }
}
 
function showTournamentMatch() {
	//Create/show Final Boxex (holder of the results of the first match)
	for (let i = 0; i < 2; i++) {
		const label = document.createElement("div");

		label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

		UI.finalList.appendChild(label);
	}
	UI.finalList.classList.remove("hidden");

	//Create/show Winner Box (holder of the results of the second match)
	const label = document.createElement("div");

	label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
	label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

	UI.winnerName.appendChild(label);
	UI.winnerName.classList.remove("hidden");
	UI.crownImage.classList.remove("hidden");
}

function addFinalNameLabel(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = UI.playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
	if (!isAi)
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	UI.playersList.appendChild(label);
}


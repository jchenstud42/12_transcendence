export const UI = {
	//Menu Element
	get pongMenu() { return document.getElementById("pong-menu") as HTMLDivElement; },
	get pongButton() { return document.getElementById("pong-button")!; },
	get qmatchButton() { return document.getElementById("quick-match-button")!; },
	get tournamentButton() { return document.getElementById("tournament-button")!; },

	// Text & Counters
	get enterPlayerNbrText() { return document.getElementById("enterPlayerNbr-text")! as HTMLHeadingElement; },
	get playerNbrText() { return document.getElementById("playerNbr-text")! as HTMLHeadingElement; },
	get playerIncrButton() { return document.getElementById("increasePlayer-button")!; },
	get playerDecrButton() { return document.getElementById("decreasePlayer-button")!; },
	get aiCounter() { return document.getElementById("ai-counter")! as HTMLDivElement; },
	get aiNbrText() { return document.getElementById("aiNbr-text")! as HTMLDivElement; },

	// Game Controls
	get okButton() { return document.getElementById("OK-button")! as HTMLDivElement; },
	get playButton() { return document.getElementById("play-button") as HTMLButtonElement; },
	get readyText() { return document.getElementById("ready-text")!; },
	get goText() { return document.getElementById("go-text")!; },


	get leftPaddle() { return document.getElementById("left-paddle") as HTMLDivElement; },
	get rightPaddle() { return document.getElementById("right-paddle") as HTMLDivElement; },
	get ball() { return document.getElementById("ball") as HTMLDivElement; },
	
	// Game Area
	get playersArea() { return document.getElementById("players-area") as HTMLDivElement | null; },
	get aiViewCheckBox() { return document.getElementById("ai-view-label"); },
	get aiViewCheckboxInput() { return document.getElementById("ai-view-checkbox") as HTMLInputElement; },
	get scoreLeft() { return document.getElementById("score-left") as HTMLDivElement | null; },
	get scoreRight() { return document.getElementById("score-right") as HTMLDivElement | null; },

	// Player Setup
	get playerNameContainer() { return document.getElementById("playerName-container")! as HTMLDivElement; },
	get playerNameInput() { return document.getElementById("playerName-input")! as HTMLInputElement; },
	get playersList() { return document.getElementById("players-list")! as HTMLDivElement; },

	// Winner & End Game
	get finalList() { return document.getElementById("final-list")! as HTMLDivElement; },
	get winnerName() { return document.getElementById("winner-name")! as HTMLDivElement; },
	get crownImage() { return document.getElementById("crown-image")! as HTMLImageElement; },

	// Constants (Keep these as standard properties since they aren't DOM elements)
	playerColors: ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"]
};
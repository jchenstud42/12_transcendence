export const PONG_UI = {
	//Menu Element
	pongMenu: document.getElementById("pong-menu") as HTMLDivElement,
	pongButton: document.getElementById("pong-button")!,
	qmatchButton: document.getElementById("quick-match-button")!,
	tournamentButton: document.getElementById("tournament-button")!,

	// Text & Counters
	enterPlayerNbrText: document.getElementById("enterPlayerNbr-text")! as HTMLHeadingElement,
	playerNbrText: document.getElementById("playerNbr-text")! as HTMLHeadingElement,
	playerIncrButton: document.getElementById("increasePlayer-button")!,
	playerDecrButton: document.getElementById("decreasePlayer-button")!,
	aiCounter: document.getElementById("ai-counter")! as HTMLDivElement,
	aiNbrText: document.getElementById("aiNbr-text")! as HTMLDivElement,

	// Game Setup
	okButton: document.getElementById("OK-button")! as HTMLDivElement,
	playButton: document.getElementById("play-button") as HTMLButtonElement,
	readyText: document.getElementById("ready-text")!,
	goText: document.getElementById("go-text")!,
	backButton: document.getElementById("back-button")!,

	//Paddle & Ball
	leftPaddle: document.getElementById("left-paddle") as HTMLDivElement,
	rightPaddle: document.getElementById("right-paddle") as HTMLDivElement,
	ball: document.getElementById("ball") as HTMLDivElement,
	
	// Game Area
	playersArea: document.getElementById("players-area") as HTMLDivElement | null,
	aiView: document.getElementById("AIview") as HTMLDivElement,
	aiViewsCanvas: document.getElementById('canvas-AI-views') as HTMLCanvasElement,
	aiViewCheckBox: document.getElementById("ai-view-label"),
	aiViewCheckboxInput: document.getElementById("ai-view-checkbox") as HTMLInputElement,
	decreasePlayerButton: document.getElementById("decreasePlayer-button")!,
	increasePlayerButton: document.getElementById("increasePlayer-button")!,
	scoreLeft: document.getElementById("score-left") as HTMLDivElement | null,
	scoreRight: document.getElementById("score-right") as HTMLDivElement | null,

	// Player Setup
	playerNameContainer: document.getElementById("playerName-container")! as HTMLDivElement,
	playerNameInput: document.getElementById("playerName-input")! as HTMLInputElement,
	playersList: document.getElementById("players-list")! as HTMLDivElement,

	// Winner & End Game
	finalList: document.getElementById("final-list")! as HTMLDivElement,
	winnerName: document.getElementById("winner-name")! as HTMLDivElement,
	crownImage: document.getElementById("crown-image")! as HTMLImageElement,

	// Constants
	playerColors: ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"]
};
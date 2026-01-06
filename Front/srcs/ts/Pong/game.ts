
import { shuffleArray } from "../utils/utils.js";
import { Ball } from '../Pong/ball.js';
import { Ai } from '../Pong/ai.js';
import { UI } from './elements.js';
import { gameInfo } from './state.js';
import { addPlayerNameLabel } from './menu.js';

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;



export function activateGameEvents() {
	UI.playButton.addEventListener("click", startGame);

	document.addEventListener("keydown", (event: KeyboardEvent) => {
		if (event.key === "Enter" && !UI.playButton.classList.contains("hidden")) {
			startMatch();
		}
	});

	//Set true or False wether a key is press among the "keys" listtwofaForm
	document.addEventListener('keydown', (e) => {
		if (e.key in keys) {
			keys[e.key as keyof typeof keys] = true;
		}
	});
	document.addEventListener('keyup', (e) => {
		if (e.key in keys) {
			keys[e.key as keyof typeof keys] = false;
		}
	});

	// AI View checkbox event listener
	if (UI.aiViewCheckboxInput) {
		UI.aiViewCheckboxInput.addEventListener("change", (e) => {
			const isChecked = (e.target as HTMLInputElement).checked;
			console.log("AI View checkbox changed:", isChecked);
			// Add your logic here for when checkbox is checked/unchecked
			if (isChecked)
				aiPlayer.showAiPredictions();
			else
				aiPlayer.hideAiPredictions();
		});
	}
}

const gameBall = new Ball(UI.ball, UI.pongMenu, UI.leftPaddle, UI.rightPaddle, BALL_SIZE);
const aiPlayer = new Ai(gameBall, UI.rightPaddle, UI.leftPaddle, UI.rightPaddle, 3);
const aiPlayer2 = new Ai(gameBall, UI.rightPaddle, UI.leftPaddle, UI.leftPaddle, 3);

class Player {
	name: string = "";
	playerNbr: number = 0;
	paddle: HTMLDivElement | null = null;
	point: number = 0;
	gameWon: number = 0;
	isAi: boolean = false

	constructor(name: string, isAi: boolean, playerNbr: number) {
		this.name = name;
		this.isAi = isAi;
		this.playerNbr = playerNbr;
	}
};

export class Game {
	players: Player[] = [];
	winner: Player | null = null;
	pointsToWin = 5;
	isQuickMatch = false;

	constructor(playersName: [string, boolean][]) {
		activateGameEvents();
		this.players = playersName.map(([playerName, isAi], playerNbr) => new Player(playerName, isAi, playerNbr));

	this.isQuickMatch = !gameInfo.isTournament;

		gameBall.onScore = (playerSide: 'left' | 'right') => {
			this.addPoint(playerSide);
		};

		if (playersName.length > 2) {
			// Hide tournament tree during matches
			UI.finalList.classList.add("hidden");
			UI.winnerName.classList.add("hidden");
			UI.crownImage.classList.add("hidden");
			
			// Call async tournament without await in constructor
			this.createTournament();
		} else {
			UI.playButton.classList.remove("hidden");
		}
	}

	public addPoint(playerSide: 'left' | 'right') {
		const pointIndex = playerSide === 'left' ? 0 : 1;
		if (this.players[pointIndex]) {
			this.players[pointIndex].point++;
			
			// Update score display
			if (playerSide === 'left' && UI.scoreLeft) {
				UI.scoreLeft.textContent = this.players[pointIndex].point.toString();
			} else if (playerSide === 'right' && UI.scoreRight) {
				UI.scoreRight.textContent = this.players[pointIndex].point.toString();
			}

			console.log(`${this.players[pointIndex].name} scores! Points: ${this.players[pointIndex].point}`);

			// Check if player reached 10 points (quick match only)
			if (this.isQuickMatch && this.players[pointIndex].point >= this.pointsToWin) {
				this.endGame(this.players[pointIndex]);
			} else {
				// Reset ball for next point
				gameBall.reset();
				UI.ball.classList.add("hidden");
				UI.playButton.classList.remove("hidden");
			}
		}
	}

	private endGame(winner: Player) {
		this.winner = winner;
		console.log(`${winner.name} wins the match!`);
		gameBall.active = false;
		UI.ball.classList.add("hidden");
		UI.leftPaddle.classList.add("hidden");
		UI.rightPaddle.classList.add("hidden");
		UI.playButton.classList.add("hidden");

		alert(`${winner.name} wins with ${winner.point} points!`);

		// Reset everything and go back to menu
		setTimeout(() => {
			resetGameMenu();
		}, 1000);
	}


	// public createTournament() {
	// 	const shuffled: Player[] = shuffleArray(this.players);
	// 	playersList.innerHTML = "";
	// 	shuffled.forEach(({ name, playerNbr, isAi }) => {
	// 		addPlayerNameLabel(name, playerNbr, isAi);
	// 	});
	// 	showTournamentMatch();
	// }
	public async createTournament() {
		console.log("createTournament started");

		const pointsToWin = this.pointsToWin; // Capture pointsToWin
		let bracket: Player[] = shuffleArray(this.players.slice());

		UI.playersList.innerHTML = "";
		UI.finalList.innerHTML = "";
		UI.winnerName.innerHTML = "";
		UI.crownImage.classList.add("hidden");

		const showPair = (a: Player, b: Player) => {
			console.log("Showing pair:", a.name, "vs", b.name);
			UI.playersList.innerHTML = "";
			addPlayerNameLabel(a.name, a.playerNbr, a.isAi);
			addPlayerNameLabel(b.name, b.playerNbr, b.isAi);
			if (UI.playersArea) UI.playersArea.classList.remove("hidden");
		};

		const runMatch = (left: Player, right: Player): Promise<Player> => {
			return new Promise((resolve) => {
				console.log("runMatch called for", left.name, "vs", right.name);

				let leftScore = 0;
				let rightScore = 0;

				const updateScores = () => {
					if (UI.scoreLeft) UI.scoreLeft.textContent = String(leftScore);
					if (UI.scoreRight) UI.scoreRight.textContent = String(rightScore);
				};
				updateScores();

				UI.leftPaddle.classList.remove("hidden");
				UI.rightPaddle.classList.remove("hidden");
				UI.ball.classList.add("hidden");

				// Show play button for user to start
				if (UI.playButton) {
					UI.playButton.classList.remove("hidden");
					console.log("playButton displayed");
				} else {
					console.error("playButton is null!");
				}

				// Define handler BEFORE user starts
				const handler = (side: 'left' | 'right') => {
					if (side === 'left') leftScore++;
					else rightScore++;
					
					updateScores();

					if (leftScore >= pointsToWin || rightScore >= pointsToWin) {
						gameBall.onScore = null;
						gameBall.active = false;
						UI.ball.classList.add("hidden");
						UI.leftPaddle.classList.add("hidden");
						UI.rightPaddle.classList.add("hidden");
						UI.playButton.classList.add("hidden");

						const winner = leftScore > rightScore ? left : right;
						console.log("Match winner:", winner.name);
						setTimeout(() => resolve(winner), 300);
						return;
					}
					gameBall.reset();
					UI.ball.classList.add("hidden");
					UI.playButton.classList.remove("hidden");
				};
				
				gameBall.onScore = handler;
				
				// One-time listener for play button click to start countdown
				const startMatchListener = () => {
					console.log("startMatchListener triggered");
					UI.playButton.removeEventListener("click", startMatchListener);
					UI.playButton.classList.add("hidden");
					
					UI.readyText.classList.remove("hidden");
					setTimeout(() => {
						UI.readyText.classList.add("hidden");
						UI.goText.classList.remove("hidden");
						setTimeout(() => {
							UI.goText.classList.add("hidden");
							UI.ball.classList.remove("hidden");
							gameBall.reset();
							gameBall.serve();
						}, 800);
					}, 800);
				};
				
				if (UI.playButton) {
					UI.playButton.addEventListener("click", () => {
							startMatch();
						});
				} else {
					console.error("playButton not found at script load");
				}
				
				document.addEventListener("keydown", (event: KeyboardEvent) => {
					if (event.key === "Enter" && UI.playButton && !UI.playButton.classList.contains("hidden")) {
						startMatch();
					}
				});
			});
		};

		let round = 1;
		while (bracket.length > 1) {
			console.log(`Round ${round} started with ${bracket.length} players`);
			const nextRound: Player[] = [];
			
			for (let i = 0; i < bracket.length; i += 2) {
				const p1 = bracket[i];
				const p2 = bracket[i + 1];
				
				showPair(p1, p2);
				
				const winner = await runMatch(p1, p2);
				
				nextRound.push(winner);
				
				const label = document.createElement("div");
				label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
				label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Round ${round} winner</span><br>${winner.name}`;
				UI.finalList.appendChild(label);
				UI.finalList.classList.remove("hidden");
				
				await new Promise(r => setTimeout(r, 400));
			}
			
			bracket = nextRound;
			round++;
			UI.playersList.innerHTML = "";
		}
		
		const champion = bracket[0];
		if (champion) {
			UI.winnerName.innerHTML = "";
			const label = document.createElement("div");
			label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Champion</span><br>${champion.name}`;
			UI.winnerName.appendChild(label);
			UI.winnerName.classList.remove("hidden");
			UI.crownImage.classList.remove("hidden");
			alert(`${champion.name} remporte le tournoi !`);
		}
		
			if (UI.playersArea) UI.playersArea.classList.add("hidden");
			if (UI.scoreLeft) UI.scoreLeft.textContent = "0";
			if (UI.scoreRight) UI.scoreRight.textContent = "0";
			gameBall.onScore = null;

			// After tournament ends, return to menu
			setTimeout(() => {
				resetGameMenu();
			}, 1000);
	}
	


	public createQuickMatch() {
		UI.playButton.classList.remove("hidden");
	}
}


//game loop to update ball position;
let lastTime = performance.now();
function gameLoop(now = performance.now()) {
	const dt = (now - lastTime) / 1000;
	lastTime = now;

	gameBall.update(dt);
	aiPlayer.updategameElapsedTime(dt);
	aiPlayer2.updategameElapsedTime(dt);


	requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);


//keys list
const keys = {
	w: false,
	s: false,
	ArrowUp: false,
	ArrowDown: false
};

//Start count down when Pong button is pressed
function startGame() {
	UI.playButton.classList.add("hidden");
			UI.leftPaddle.classList.remove("hidden");
	UI.rightPaddle.classList.remove("hidden");
	UI.readyText.classList.remove("hidden");

	setTimeout(() => {
	UI.readyText.classList.add("hidden");
	UI.goText.classList.remove("hidden");
		setTimeout(() => {
			UI.goText.classList.add("hidden");
			UI.ball.classList.remove("hidden");
			gameBall.serve();
			//Ai Starts Playing here
			if (UI.aiViewCheckBox)
				UI.aiViewCheckBox.classList.remove("hidden");
			aiPlayer.oneSecondLoop();
			aiPlayer2.oneSecondLoop();
		}, 1000);
	}, 1000);
}


function startMatch() {
	UI.playButton?.classList.add("hidden");

	UI.readyText.classList.remove("hidden");

	setTimeout(() => {
		UI.readyText.classList.add("hidden");
		UI.goText.classList.remove("hidden");

		setTimeout(() => {
			UI.goText.classList.add("hidden");
			UI.ball.classList.remove("hidden");
			UI.leftPaddle.classList.remove("hidden");
			UI.rightPaddle.classList.remove("hidden");
			
			gameBall.active = true;
			gameBall.serve();
		}, 1000);
	}, 1000);
}


//Fonction pour bouger les paddles en fonction de la key press
function updatePaddlePositions() {
	if (keys.w && UI.leftPaddle.offsetTop > 0) {
		UI.leftPaddle.style.top = `${UI.leftPaddle.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.s && UI.leftPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		UI.leftPaddle.style.top = `${UI.leftPaddle.offsetTop + PADDLE_SPEED}px`;
	}

	if (keys.ArrowUp && UI.rightPaddle.offsetTop > 0) {
		UI.rightPaddle.style.top = `${UI.rightPaddle.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.ArrowDown && UI.rightPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		UI.rightPaddle.style.top = `${UI.rightPaddle.offsetTop + PADDLE_SPEED}px`;
	}

	requestAnimationFrame(updatePaddlePositions);
}

requestAnimationFrame(updatePaddlePositions);


function resetGameMenu() {
	if (UI.scoreLeft) UI.scoreLeft.textContent = "0";
	if (UI.scoreRight) UI.scoreRight.textContent = "0";

	if (UI.playersArea) UI.playersArea.classList.add("hidden");
	UI.playersList.innerHTML = "";
	gameInfo.playerNames = [];
	gameInfo.nameEntered = 0;
	gameInfo.isTournament = false;
	gameInfo.playerNbr = 2;
	gameInfo.maxPlayer = 2;
	gameInfo.aiNbr = 0;

	UI.pongButton.classList.remove("hidden");
	UI.qmatchButton.classList.add("hidden");
	UI.tournamentButton.classList.add("hidden");
}

import { PONG_UI } from './elements.js';
import { Player } from './Player.js';
import { Ball } from './Ball.js';
import { shuffleArray } from "../utils/utils.js";
import { resetGameMenu, showPlayerName, showPongMenu } from './menu.js';
import { showMenu, hideMenu } from './menu.js';

const PONG_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;

export class Game {
	private running = false;
	private ballLoopRafId: number | null = null;
	private paddleLoopRafId: number | null = null;
    
	currentUser: any;
	paddleLoopRunning = false;
	starting = false; // true while countdown/start sequence is running

	guestPlayers = new Map<number, string>();
	loggedUserCounter = 100;
	guestIdCounter = 200;

    isTournament: boolean;
    playerNbr: number;
    maxPlayer: number;
    aiNbr: number;
    playersName: [string, boolean][];
    aiNames: string[];
    nameEntered: number;

	ball: Ball;
	players: Player[] = []; //Should add a boolean to knwo if its ai or not
	winner: Player | null = null;
	pointsToWin = 2;
	isQuickMatch = false;

	last: number; //game loop to update ball position;

 	pendingTimeouts: number[] = []; //goes with function resetGame()

	keys = {
		w: false,
		s: false,
		ArrowUp: false,
		ArrowDown: false
	};

	handleKeyDown = (e: KeyboardEvent) => {
		if (e.key in this.keys) {
			this.keys[e.key as keyof typeof this.keys] = true;
		}
	};

	handleKeyUp = (e: KeyboardEvent) => {
		if (e.key in this.keys) {
			this.keys[e.key as keyof typeof this.keys] = false;
		}
	};

	constructor() {
    	this.isTournament = false;
    	this.playerNbr = 2;
    	this.maxPlayer = 2;
    	this.aiNbr = 0;
    	this.playersName = [];
    	this.aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"];
    	this.nameEntered = 0;
		this.ball = new Ball(PONG_UI.ball);

		this.last = performance.now();

		//Setup name depending on username logged
		const currentUserRaw = localStorage.getItem("user");
		this.currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;
	}

	///////////////////////////////////////////////////////////
	/////					SETUP						 /////
	//////////////////////////////////////////////////////////

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

	private registerGuest(name: string): number {
		const id = this.guestIdCounter;
		this.guestIdCounter++;
		if (this.guestIdCounter >= 300) this.guestIdCounter = 200;
		this.guestPlayers.set(id, name);
		return id;
	}

	///////////////////////////////////////////////////////////
	/////				GAME STATES						  /////
	//////////////////////////////////////////////////////////

	public ballLoop = (now = performance.now()) => {
		if (!this.ball.active) {
			this.ballLoopRafId = null;
			return;
		}

		const dt = (now - this.last) / 1000;
		this.last = now;
		this.ball.update(dt); //If a point is win, ball notifies game by updating onscore and reset itself
		this.ballLoopRafId = requestAnimationFrame(this.ballLoop);
	};

	public startMatch() {
		// prevent double-start if ball already active or a start is in progress
		if (this.ball.active || this.starting) return;

		this.disableKeyListeners();

		this.starting = true;

		// clear any previously scheduled timeouts from prior starts
		this.pendingTimeouts.forEach(id => clearTimeout(id));
		this.pendingTimeouts = [];

		// hide play button while starting to avoid double clicks
		hideMenu(PONG_UI.playButton);
		
		//Initiate ball onscore callback
		this.ball.onScore = (playerSide: 'left' | 'right') => {
			this.addPoint(playerSide);
		};

		//Serve + Start Loops
		this.pendingTimeouts.push(setTimeout(() => {
			showCountDown("READY");

				this.pendingTimeouts.push(setTimeout(() => {
				showCountDown("GO");

				this.pendingTimeouts.push(setTimeout(() => {
					hideCountDown();
					showGameElements();

					//Start ball Loop
					this.ball.active = true;
					this.ball.serve();
					this.last = performance.now();
					this.ballLoopRafId = requestAnimationFrame(this.ballLoop);

					//Start Paddle loop (only once)
					if (!this.paddleLoopRunning) {
						this.paddleLoopRunning = true;
						this.paddleLoopRafId = this.updatePaddlePositions();
					}

					//Enable Paddle Movements
					this.enableKeyListeners();
					this.starting = false;

				}, 600));
			}, 1000));
		}, 1000));

	}

	public addPoint(playerSide: 'left' | 'right') {
		const pointIndex = playerSide === 'left' ? 0 : 1;
		if (this.players[pointIndex]) {
			this.players[pointIndex].point++;

			// Update score display
			if (playerSide === 'left' && PONG_UI.scoreLeft) {
				PONG_UI.scoreLeft.textContent = this.players[pointIndex].point.toString();
			} else if (playerSide === 'right' && PONG_UI.scoreRight) {
				PONG_UI.scoreRight.textContent = this.players[pointIndex].point.toString();
			}

			console.log(`${this.players[pointIndex].name} scores! Points: ${this.players[pointIndex].point}`);

			// End the match if player reached pointsToWin (quick match only)
			if (this.isQuickMatch && this.players[pointIndex].point >= this.pointsToWin) {
				this.endMatch(this.players[pointIndex]);
			} else {
				this.resetMatch()
			}
		}
	}

	//Reset used between Points
	public resetMatch() {
		// Stop animation loops
		this.stopAllLoops();

		//Make sure players can't moove paddle while waiting for next match
		this.disableKeyListeners();

		this.starting = false;
		this.paddleLoopRunning = false;


		this.ball.reset();

		// clear any pending timeouts from prior start attempts
		this.pendingTimeouts.forEach(id => clearTimeout(id));
		this.pendingTimeouts = [];

		PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		hideMenu(PONG_UI.ball, PONG_UI.leftPaddle, PONG_UI.rightPaddle);
		showMenu(PONG_UI.playButton);
	}

	private async endMatch(winner: Player) {
		this.winner = winner;
		console.log(`${winner.name} wins the match!`);
		this.ball.active = false;

		// no explicit RAF cancellation here
		hideMenu(PONG_UI.ball,
				PONG_UI.leftPaddle,
				PONG_UI.rightPaddle,
				PONG_UI.playButton);

		// mark that no start is in progress
		this.starting = false;

		// ensure paddle loop flag is reset
		this.paddleLoopRunning = false;

		alert(`${winner.name} wins with ${winner.point} points!`);

		const token = localStorage.getItem("accessToken");
		const player1 = this.players[0];
		const player2 = this.players[1];

		const hasRealUser = (player1.userId >= 100 && player1.userId < 200) ||
			(player2.userId >= 200 && player2.userId < 300);

		if (!token || !hasRealUser) {
			console.log("No logged-in user");
			setTimeout(() => {
				this.resetGame();
			}, 1000);
			return;
		}

		if (this.players.length < 2) {
			console.warn("Not enough players");
			this.resetGame();
			return;
		}

		const payload = {
			player1Id: player1.userId,
			player2Id: player2.userId,
			score1: player1.point,
			score2: player2.point,
			winnerId: winner.userId,
			player1Name: player1.userId >= 200 ? player1.name : undefined,
			player2Name: player2.userId >= 200 ? player2.name : undefined,
		};

		try {
			const res = await fetch("/match", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) {
				console.error("Match save failed:", await res.text());
			} else {
				console.log("Match saved successfully!");
			}
		} catch (err) {
			console.error("Error saving match:", err);
		}

		setTimeout(() => {
			this.resetGame();
		}, 1000);
	}

	public resetGame() {
		// Stop all animation loops first
		this.stopAllLoops();

		this.pendingTimeouts.forEach(id => clearTimeout(id));
		this.pendingTimeouts = [];

		this.disableKeyListeners();

		this.keys.w = false;
		this.keys.s = false;
		this.keys.ArrowUp = false;
		this.keys.ArrowDown = false;

		this.ball.active = false;
		this.ball.reset();
		this.ball.initBallPos();
		this.ball.onScore = null; // Clear the callback

		// Clear players array
		this.players = [];
		this.playersName = [];
		this.guestPlayers.clear();
		this.winner = null;

		// Reset match state
		this.nameEntered = 0;
		this.isTournament = false;
		this.playerNbr = 2;
		this.maxPlayer = 2;
		this.aiNbr = 0;
		this.isQuickMatch = false;

		// Reset loop flags
		this.starting = false;
		this.paddleLoopRunning = false;

		resetGameMenu()
	}



	///////////////////////////////////////////////////////////
	/////				TOURNAMENT						  /////
	//////////////////////////////////////////////////////////

	/**
	 * Save a tournament match result to the backend
	 * Posts match data including scores and winner
	 */
	private async saveTournamentMatch(
		player1: Player,
		player2: Player,
		score1: number,
		score2: number,
		winner: Player
	): Promise<void> {
		const token = localStorage.getItem("accessToken");
		if (!token) return;

		const payload = {
			player1Id: player1.userId,
			player2Id: player2.userId,
			score1,
			score2,
			winnerId: winner.userId,
			player1Name: player1.userId >= 100 ? player1.name : undefined,
			player2Name: player2.userId >= 100 ? player2.name : undefined,
		};

		try {
			const res = await fetch("/match", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json",
					"Authorization": `Bearer ${token}`
				},
				body: JSON.stringify(payload)
			});

			if (!res.ok) console.error("Tournament match save failed:", await res.text());
		} catch (err) {
			console.error("Error saving tournament match:", err);
		}
	}

	public async createTournament() {
		console.log("createTournament started");

		const pointsToWin = 1;
		
		let bracket: Player[] = shuffleArray(this.players.slice());

		const BRACKETS_UI = {
			bracketDisplay: null,
			playersRow: null,
			semifinalsRow: null,
			champRow: null,
			finalDiv: null
		};

		this.initBracketsUI(BRACKETS_UI);	
		
		PONG_UI.finalList.classList.remove("hidden");

		const runMatch = (left: Player, right: Player, onPlayClick: () => void): Promise<Player> => {
			return new Promise((resolve) => {
				console.log("runMatch called for", left.name, "vs", right.name);

				let leftScore = 0;
				let rightScore = 0;

				const updateScores = () => {
					if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = String(leftScore);
					if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = String(rightScore);
				};
				updateScores();

				PONG_UI.ball.classList.add("hidden");
				PONG_UI.playButton.classList.remove("hidden");

				// Define handler BEFORE user starts
				const handler = (side: 'left' | 'right') => {
					if (side === 'left') leftScore++;
					else rightScore++;

					updateScores();

					if (leftScore >= pointsToWin || rightScore >= pointsToWin) {
						this.ball.onScore = null;
						this.ball.active = false;
						PONG_UI.ball.classList.add("hidden");
						PONG_UI.leftPaddle.classList.add("hidden");
						PONG_UI.rightPaddle.classList.add("hidden");
						PONG_UI.playButton.classList.add("hidden");

						const winner = leftScore > rightScore ? left : right;
						console.log("Match winner:", winner.name);
					this.saveTournamentMatch(left, right, leftScore, rightScore, winner);
						setTimeout(() => resolve(winner), 300);
						return;
					}
					this.ball.reset();
					PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
					PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
					PONG_UI.ball.classList.add("hidden");
					this.disableKeyListeners();
					PONG_UI.leftPaddle.classList.add("hidden");
					PONG_UI.rightPaddle.classList.add("hidden");
					PONG_UI.playButton.classList.remove("hidden");
				};

				this.ball.onScore = handler;

				// Handler pour le click du play button
				const playClickHandler = () => {
					PONG_UI.playButton.removeEventListener("click", playClickHandler);
					document.removeEventListener("keydown", keyHandler);
					onPlayClick(); // Appeler showPlayerPair
					this.startMatch();
				};

				const keyHandler = (event: KeyboardEvent) => {
					if (event.key === "Enter" && PONG_UI.playButton && !PONG_UI.playButton.classList.contains("hidden")) {
						playClickHandler();
					}
				};

				if (PONG_UI.playButton) {
					PONG_UI.playButton.addEventListener("click", playClickHandler);
				} else {
					console.error("play_button not found at script load");
				}

				document.addEventListener("keydown", keyHandler);
			});
		};

		//TOURNAMENT LOGIC STARTS HERE
		let round = 1;
		while (bracket.length > 1) {
			console.log(`Round ${round} started with ${bracket.length} players`);
			const nextRound: Player[] = [];

			for (let i = 0; i < bracket.length; i += 2) {
				const p1 = bracket[i];
				const p2 = bracket[i + 1];

				PONG_UI.playButton.classList.remove("hidden");

				const winner = await runMatch(p1, p2, () => this.showPlayerPair(p1, p2));

				nextRound.push(winner);

				this.updateBracketsUI(winner, round, i);
			}

			bracket = nextRound;
			round++;
			PONG_UI.playersList.innerHTML = "";
		}

		const champion = bracket[0];
		if (champion) {
			alert(`${champion.name} remporte le tournoi !`);
		}

		if (PONG_UI.playersArea) PONG_UI.playersArea.classList.add("hidden");
		if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = "0";
		if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = "0";
		this.ball.onScore = null;

		// Afficher le bouton retour
		PONG_UI.backButton.classList.remove("hidden");

		// Attendre que l'utilisateur clique sur le bouton retour
		await new Promise<void>((resolve) => {
			const backClickHandler = () => {
				PONG_UI.backButton.removeEventListener("click", backClickHandler);
				PONG_UI.backButton.classList.add("hidden");
				this.resetGame();
				resolve();
			};
			PONG_UI.backButton.addEventListener("click", backClickHandler);
		});
	}



	public createQuickMatch() {
		PONG_UI.playButton.classList.remove("hidden");
	}




	///////////////////////////////////////////////////////////
	/////				INPUTS HANDLER					 /////
	//////////////////////////////////////////////////////////

	//Fonction pour bouger les paddles en fonction de la key press
	public updatePaddlePositions = (): number => {
		// stop the loop when the ball is inactive (between points)
		if (!this.ball.active || !this.paddleLoopRunning) {
			this.paddleLoopRunning = false;
			this.paddleLoopRafId = null;
			return 0;
		}

		if (this.keys.w && PONG_UI.leftPaddle.offsetTop > 0) {
			PONG_UI.leftPaddle.style.top = `${PONG_UI.leftPaddle.offsetTop - PADDLE_SPEED}px`;
		}
		if (this.keys.s && PONG_UI.leftPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
			PONG_UI.leftPaddle.style.top = `${PONG_UI.leftPaddle.offsetTop + PADDLE_SPEED}px`;
		}

		if (this.keys.ArrowUp && PONG_UI.rightPaddle.offsetTop > 0) {
			PONG_UI.rightPaddle.style.top = `${PONG_UI.rightPaddle.offsetTop - PADDLE_SPEED}px`;
		}
		if (this.keys.ArrowDown && PONG_UI.rightPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
			PONG_UI.rightPaddle.style.top = `${PONG_UI.rightPaddle.offsetTop + PADDLE_SPEED}px`;
		}

		this.paddleLoopRafId = requestAnimationFrame(this.updatePaddlePositions);
		return this.paddleLoopRafId;
	}

	// Fonctions pour activer/désactiver les event listeners
	public enableKeyListeners() {
		document.addEventListener('keydown', this.handleKeyDown);
		document.addEventListener('keyup', this.handleKeyUp);
	}

	public disableKeyListeners() {
		document.removeEventListener('keydown', this.handleKeyDown);
		document.removeEventListener('keyup', this.handleKeyUp);
	}

	public stopAllLoops() {
		if (this.ballLoopRafId !== null) {
			cancelAnimationFrame(this.ballLoopRafId);
			this.ballLoopRafId = null;
		}
		if (this.paddleLoopRafId !== null) {
			cancelAnimationFrame(this.paddleLoopRafId);
			this.paddleLoopRafId = null;
		}
	}

	/**
	 * Complete cleanup and destruction of game instance
	 * Call this when the game is no longer needed (e.g., on page unload or before creating a new instance)
	 */
	public destroy() {
		// Stop all animation loops
		this.stopAllLoops();

		// Clear all timeouts
		this.pendingTimeouts.forEach(id => clearTimeout(id));
		this.pendingTimeouts = [];

		// Remove event listeners
		this.disableKeyListeners();

		// Clear all collections
		this.players = [];
		this.playersName = [];
		this.guestPlayers.clear();

		// Clear ball callbacks
		this.ball.onScore = null;

		// Reset references
		this.winner = null;
		this.currentUser = null;
	}

	private initBracketsUI(BRACKETS_UI: any) {
		PONG_UI.playersList.innerHTML = "";
		PONG_UI.finalList.innerHTML = "";
		PONG_UI.winnerName.innerHTML = "";

		// Create tournament bracket structure
		BRACKETS_UI.bracketDisplay = document.createElement("div");
		BRACKETS_UI.bracketDisplay.className = "flex flex-col gap-1 w-full h-full justify-center";
		
		// Initialize bracket with all players and placeholders
		BRACKETS_UI.playersRow = document.createElement("div");
		BRACKETS_UI.playersRow.className = "flex gap-2 justify-center";
		
		BRACKETS_UI.semifinalsRow = document.createElement("div");
		BRACKETS_UI.semifinalsRow.className = "flex gap-2 justify-center";
		
		BRACKETS_UI.champRow = document.createElement("div");
		BRACKETS_UI.champRow.className = "flex gap-1 justify-center";

		// Add final placeholder (Champion at top)
		BRACKETS_UI.finalDiv = document.createElement("div");
		BRACKETS_UI.finalDiv.id = "final-winner";
		BRACKETS_UI.finalDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
		BRACKETS_UI.finalDiv.innerHTML = `<span class="text-sm text-gray-400">Champion</span><br>?`;
		BRACKETS_UI.champRow.appendChild(BRACKETS_UI.finalDiv);

		// Add semifinals placeholders
		for (let i = 0; i < 2; i++) {
			const playerDiv = document.createElement("div");
			playerDiv.id = `semi-${i}`;
			playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			playerDiv.innerHTML = `<span class="text-sm text-gray-400">Semifinal ${i + 1}</span><br>?`;
			BRACKETS_UI.semifinalsRow.appendChild(playerDiv);
		}

		// Add initial 4 players at bottom
		for (let i = 0; i < 4; i++) {
			const playerDiv = document.createElement("div");
			playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			playerDiv.innerHTML = `<span class="text-sm text-gray-400">Player ${i + 1}</span><br>${BRACKETS_UI.bracket[i].name}`;
			BRACKETS_UI.playersRow.appendChild(playerDiv);
		}

		BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.champRow);
		BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.semifinalsRow);
		BRACKETS_UI.bracketDisplay.appendChild(BRACKETS_UI.playersRow);

		PONG_UI.finalList.appendChild(BRACKETS_UI.bracketDisplay);

	}

	private updateBracketsUI(winner: Player, round: number, i: number) {
		// Update the bracket display with the winner
		if (round === 1) {
			const semiDiv = document.getElementById(`semi-${i / 2}`);
			if (semiDiv) {
				const colorClass = PONG_UI.playerColors[winner.playerNbr];
				semiDiv.innerHTML = `<span class="text-sm text-gray-400">Semifinal ${i / 2 + 1}</span><br><span class="${colorClass}">${winner.name}</span>`;
			}
		} else if (round === 2) {
			const finalDiv = document.getElementById("final-winner");
			if (finalDiv) {
				const colorClass = PONG_UI.playerColors[winner.playerNbr];
				finalDiv.innerHTML = `<span class="text-sm text-gray-400">Champion</span><br><span class="${colorClass}">${winner.name}</span>`;
			}
		}
	}

	//This was as const in the tournament function
	private showPlayerPair = (a: Player, b: Player) => {
		console.log("Showing pair:", a.name, "vs", b.name);
		PONG_UI.playersList.innerHTML = "";
		showPlayerName(a.name, a.playerNbr, a.isAi);
		showPlayerName(b.name, b.playerNbr, b.isAi);
		if (PONG_UI.playersArea) PONG_UI.playersArea.classList.remove("hidden");
	};
		
};





///////////////////////////////////////////////////////////
/////			SHOW/HIDE GAME ELEMENTS			 	 /////
//////////////////////////////////////////////////////////

function showCountDown(text: string) {
	if (text === "READY") {
		hideMenu(PONG_UI.playButton);
		showMenu(PONG_UI.readyText);
	} else if (text === "GO") {
		hideMenu(PONG_UI.readyText);
		showMenu(PONG_UI.goText);
	}
}

function hideCountDown() {
	hideMenu(PONG_UI.goText);
}

function showGameElements() {
	showMenu(PONG_UI.ball,
			PONG_UI.leftPaddle,
			PONG_UI.rightPaddle);
}

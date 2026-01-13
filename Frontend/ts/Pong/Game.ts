
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



		/*this.isQuickMatch = !this.isTournament;

		if (playersName.length > 2) {
			PONG_UI.finalList.classList.remove("hidden");
			this.createTournament();
		} else {
			PONG_UI.playButton.classList.remove("hidden");
		} */
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

	// bound game loop so `this` is preserved when passed to requestAnimationFrame
	public gameLoop = (now = performance.now()) => {
		//if (!this.running) return;

		const dt = (now - this.last) / 1000;
		this.last = now;
		this.ball.update(dt); //If a point is win, ball notifies game by updating onscore and reset itself
		requestAnimationFrame(this.gameLoop);
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

		//Serve + Start Game Loop
		this.pendingTimeouts.push(setTimeout(() => {
			showCountDown("READY");
				this.pendingTimeouts.push(setTimeout(() => {
				showCountDown("GO");
				// Keep "GO" visible briefly so the player can see it, then hide it and show game elements
				this.pendingTimeouts.push(setTimeout(() => {
					hideCountDown();
					showGameElements();
					// Start the ball and the game loop only when the elements are visible so the ball appears immediately after GO
					this.ball.active = true;
					this.ball.serve();
					this.last = performance.now();
					requestAnimationFrame(this.gameLoop);
					this.enableKeyListeners();
					// start paddle updater loop (only once)
					if (!this.paddleLoopRunning) {
						this.paddleLoopRunning = true;
						this.updatePaddlePositions();
					}
					// starting finished
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

			// Check if player reached pointsToWin (quick match only)
			if (this.isQuickMatch && this.players[pointIndex].point >= this.pointsToWin) {
				this.endMatch(this.players[pointIndex]);
			} else {
				this.resetMatch()
			}
		}
	}

	public resetMatch() {

		// Reset ball for next point
		this.ball.reset();

		// clear any pending timeouts from prior start attempts
		this.pendingTimeouts.forEach(id => clearTimeout(id));
		this.pendingTimeouts = [];

		//Make sure players can't moove paddle while waiting for next match
		this.disableKeyListeners();

		//Reset Paddle Position
		PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		hideMenu(PONG_UI.ball, PONG_UI.leftPaddle, PONG_UI.rightPaddle);
		showMenu(PONG_UI.playButton);

		// mark that no start is in progress
		this.starting = false;

		// ensure paddle loop flag is reset
		this.paddleLoopRunning = false;

	}

	private async endMatch(winner: Player) {
		this.winner = winner;
		console.log(`${winner.name} wins the match!`);
		this.ball.active = false;

		// no explicit RAF cancellation here
		PONG_UI.ball.classList.add("hidden");
		PONG_UI.leftPaddle.classList.add("hidden");
		PONG_UI.rightPaddle.classList.add("hidden");
		PONG_UI.playButton.classList.add("hidden");

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

		this.playersName = [];
		this.nameEntered = 0;
		this.isTournament = false;
		this.playerNbr = 2;
		this.maxPlayer = 2;
		this.aiNbr = 0;

		resetGameMenu()
	}



	/* public async createTournament() {
		console.log("createTournament started");

		const pointsToWin = 1;
		let bracket: Player[] = shuffleArray(this.players.slice());

		PONG_UI.playersList.innerHTML = "";
		PONG_UI.finalList.innerHTML = "";
		PONG_UI.winnerName.innerHTML = "";

		// Create tournament bracket structure
		const bracketDisplay = document.createElement("div");
		bracketDisplay.className = "flex flex-col gap-1 w-full h-full justify-center";
		
		// Initialize bracket with all players and placeholders
		const playersRow = document.createElement("div");
		playersRow.className = "flex gap-2 justify-center";
		
		const semifinalsRow = document.createElement("div");
		semifinalsRow.className = "flex gap-2 justify-center";
		
		const champRow = document.createElement("div");
		champRow.className = "flex gap-1 justify-center";

		// Add final placeholder (Champion at top)
		const finalDiv = document.createElement("div");
		finalDiv.id = "final-winner";
		finalDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
		finalDiv.innerHTML = `<span class="text-sm text-gray-400">Champion</span><br>?`;
		champRow.appendChild(finalDiv);

		// Add semifinals placeholders
		for (let i = 0; i < 2; i++) {
			const playerDiv = document.createElement("div");
			playerDiv.id = `semi-${i}`;
			playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			playerDiv.innerHTML = `<span class="text-sm text-gray-400">Semifinal ${i + 1}</span><br>?`;
			semifinalsRow.appendChild(playerDiv);
		}

		// Add initial 4 players at bottom
		for (let i = 0; i < 4; i++) {
			const playerDiv = document.createElement("div");
			playerDiv.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			playerDiv.innerHTML = `<span class="text-sm text-gray-400">Player ${i + 1}</span><br>${bracket[i].name}`;
			playersRow.appendChild(playerDiv);
		}

		bracketDisplay.appendChild(champRow);
		bracketDisplay.appendChild(semifinalsRow);
		bracketDisplay.appendChild(playersRow);

		PONG_UI.finalList.appendChild(bracketDisplay);
		PONG_UI.finalList.classList.remove("hidden");

		const showPair = (a: Player, b: Player) => {
			console.log("Showing pair:", a.name, "vs", b.name);
			PONG_UI.playersList.innerHTML = "";
			showPlayerName(a.name, a.playerNbr, a.isAi);
			showPlayerName(b.name, b.playerNbr, b.isAi);
			if (PONG_UI.playersArea) PONG_UI.playersArea.classList.remove("hidden");
		};
		
		//TO CHECK FOR PLAYER INFOS
		const saveTournamentMatch = async (player1: Player, player2: Player, score1: number, score2: number, winner: Player) => {
			const token = localStorage.getItem("accessToken");
			if (!token)
				return;

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
		};

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
						saveTournamentMatch(left, right, leftScore, rightScore, winner);
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
					onPlayClick(); // Appeler showPair
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

		let round = 1;
		while (bracket.length > 1) {
			console.log(`Round ${round} started with ${bracket.length} players`);
			const nextRound: Player[] = [];

			for (let i = 0; i < bracket.length; i += 2) {
				const p1 = bracket[i];
				const p2 = bracket[i + 1];

				PONG_UI.playButton.classList.remove("hidden");

				const winner = await runMatch(p1, p2, () => showPair(p1, p2));

				nextRound.push(winner);

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

				// play_button.classList.remove("hidden");
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
	} */



	public createQuickMatch() {
		PONG_UI.playButton.classList.remove("hidden");
	}




	///////////////////////////////////////////////////////////
	/////				INPUTS HANDLER					 /////
	//////////////////////////////////////////////////////////

	//Fonction pour bouger les paddles en fonction de la key press
	public updatePaddlePositions = () => {
		// stop the loop when the ball is inactive (between points)
		if (!this.ball.active) {
			this.paddleLoopRunning = false;
			return;
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

		requestAnimationFrame(this.updatePaddlePositions);
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

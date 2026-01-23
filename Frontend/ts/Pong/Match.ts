//import { Game } from "./Game";
import { Player } from "./Player";
import { PONG_UI } from "./elements.js";
import { Ball } from "./Ball.js";
import { showPlayerName, showMenu, hideMenu, resetGameMenu } from './menu.js';
import { Ai } from "./Ai.js";
import { saveTournamentMatch } from "./Tournament.js"
import { t } from '../traduction/i18n.js';

const PONG_HEIGHT = 600;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;

export class Match {
	private last: number = performance.now();
	private ballLoopRafId: number | null = null;
	private paddleLoopRafId: number | null = null;

	ball: Ball;
	matchPlayer: [Player, Player] | null;
	pointsToWin: number;
	isTournament: boolean;
	winner: Player | null;
	starting: boolean;
	paddleLoopRunning: boolean;
	isMatchOver: boolean = false;
	isPointOver: boolean = false;
	aiLeft: Ai | null = null;
	aiRight: Ai | null = null;


	// Resolver and promise for the current point
	private pointEndResolver: ((winner: Player | null) => void) | null = null;
	private pointPromise: Promise<Player | null> | null = null;

	static pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

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

	constructor(isTournament: boolean, matchPlayer: [Player, Player] | null = null) {
		this.ball = new Ball(PONG_UI.ball);
		this.matchPlayer = matchPlayer;
		this.pointsToWin = 3;
		this.isTournament = isTournament;
		this.winner = null;
		this.starting = false;
		this.paddleLoopRunning = false;
		this.ballLoopRafId = null;
		if (this.matchPlayer && this.matchPlayer[0].isAi)
			this.aiLeft = new Ai(this.ball, PONG_UI.rightPaddle, PONG_UI.leftPaddle, PONG_UI.leftPaddle, 1);
		if (this.matchPlayer && this.matchPlayer[1].isAi)
			this.aiRight = new Ai(this.ball, PONG_UI.rightPaddle, PONG_UI.leftPaddle, PONG_UI.rightPaddle, 1);
	}

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

	public async playMatch(): Promise<Player | null> {

		// Allow the user to quit mid-match via the back button.
		let backClicked = false;
		const preBackClickHandler = () => {
			backClicked = true;
			this.isMatchOver = true; // Force loop to exit
			PONG_UI.backButton.removeEventListener("click", preBackClickHandler);
			if (!this.isTournament) {
				// Only hide if not in tournament (tournament manages its own button)
				PONG_UI.backButton.classList.add("hidden");
			}
			this.quitMatch();
		};

		// Only show/manage back button if not in tournament mode
		if (!this.isTournament) {
			PONG_UI.backButton.classList.remove("hidden");
		}
		PONG_UI.backButton.addEventListener("click", preBackClickHandler);

		while (!this.isMatchOver && !backClicked) {
			await this.playPoint();

			if (this.isPointOver) {
				this.nextPointReset();
				this.isPointOver = false;
			}

		}

		// Remove the pre-handler if still attached
		PONG_UI.backButton.removeEventListener("click", preBackClickHandler);

		// If match ended normally (not via back button) and not in tournament, wait for back click
		if (!backClicked && !this.isTournament) {
			await new Promise<void>((resolve) => {
				const backClickHandler = () => {
					PONG_UI.backButton.removeEventListener("click", backClickHandler);
					PONG_UI.backButton.classList.add("hidden");
					this.quitMatch();
					resolve();
				};
				PONG_UI.backButton.addEventListener("click", backClickHandler);
			});
		}

		return this.winner;
	}

	public playPoint() {
		this.showPlayerPair();

		// prevent double-start if ball already active or a start is in progress
		if (this.ball.active || this.starting) {
			// if a point is already running, return its promise; otherwise resolve immediately
			return this.pointPromise ? this.pointPromise : Promise.resolve(null);
		}

		// Create and return a Promise that will resolve when the point ends
		const promise = new Promise<Player | null>((resolve) => {
			this.pointEndResolver = resolve;
		});
		this.pointPromise = promise;

		this.disableKeyListeners();

		this.starting = true;

		// clear any previously scheduled timeouts from prior starts
		Match.pendingTimeouts.forEach(id => clearTimeout(id));
		Match.pendingTimeouts = [];

		// hide play button while starting to avoid double clicks
		hideMenu(PONG_UI.playButton);

		//Initiate ball onscore callback
		this.ball.onScore = (playerSide: 'left' | 'right') => {
			this.addPoint(playerSide);

			if (this.isMatchOver) {
				// resolve point promise with the winner, if waiting
				if (this.pointEndResolver) {
					this.pointEndResolver(this.winner);
					this.pointEndResolver = null;
					this.pointPromise = null;
				}
				// clear the score handler to avoid duplicates
				this.ball.onScore = null;
				// finalize match
				this.endMatch(this.winner!);
				if (!this.isTournament) resetGameMenu();
				return;
			}

			if (this.isPointOver) {
				// resolve point promise to indicate point end (no winner yet)
				if (this.pointEndResolver) {
					this.pointEndResolver(null);
					this.pointEndResolver = null;
					this.pointPromise = null;
				}
				// clear handler so next point re-attaches a fresh one
				this.ball.onScore = null;
				return;
			}
		};


		//Serve + Start Loops
		Match.pendingTimeouts.push(setTimeout(() => {
			showCountDown("READY");

			Match.pendingTimeouts.push(setTimeout(() => {
				showCountDown("GO");

				Match.pendingTimeouts.push(setTimeout(() => {
					hideCountDown();
					showGameElements();

					//Start ball Loop
					this.ball.active = true;
					this.ball.serve();
					if (this.aiLeft) this.aiLeft.oneSecondLoop();
					if (this.aiRight) this.aiRight.oneSecondLoop();
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
		return promise;
	}

	public addPoint(playerSide: 'left' | 'right') {
		if (this.aiLeft) this.aiLeft.reset();
		if (this.aiRight) this.aiRight.reset();
		if (!this.matchPlayer) return;

		const pointIndex = playerSide === 'left' ? 0 : 1;
		if (this.matchPlayer[pointIndex]) {
			this.matchPlayer[pointIndex].point++;

			// Update score display
			if (playerSide === 'left' && PONG_UI.scoreLeft) {
				PONG_UI.scoreLeft.textContent = this.matchPlayer[pointIndex].point.toString();
			} else if (playerSide === 'right' && PONG_UI.scoreRight) {
				PONG_UI.scoreRight.textContent = this.matchPlayer[pointIndex].point.toString();
			}


			// End the match if player reached pointsToWin (quick match only)
			if (this.matchPlayer[pointIndex].point >= this.pointsToWin) {
				this.isMatchOver = true;
				this.winner = this.matchPlayer[pointIndex];
				return;
			} else {
				this.isPointOver = true;
				return;
			}
		}

	}

	private partialReset() {
		// Stop animation loops
		this.stopAllLoops();

		//Make sure players can't moove paddle while waiting for next match
		this.disableKeyListeners();

		// Ensure no key state is left "stuck" when listeners are removed
		this.keys.w = false;
		this.keys.s = false;
		this.keys.ArrowUp = false;
		this.keys.ArrowDown = false;

		this.starting = false;
		this.paddleLoopRunning = false;

		this.ball.reset();

		// clear any pending timeouts from prior start attempts
		Match.pendingTimeouts.forEach(id => clearTimeout(id));
		Match.pendingTimeouts = [];

		PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
		hideMenu(PONG_UI.ball, PONG_UI.leftPaddle, PONG_UI.rightPaddle);
		//showMenu(PONG_UI.playButton);
	}

	//Reset used between Points
	public nextPointReset() {
		this.partialReset();
	}

	private endMatch(winner: Player) {
		console.log(`${winner.name} wins the match!`);

		this.partialReset();

		this.ball.active = false;

		alert(`${winner.name}` + t(`win_with`) + `${winner.point}` + t(`point`));

		this.matchPlayer![0].point = 0;
		this.matchPlayer![1].point = 0;

		PONG_UI.scoreLeft!.textContent = "0";
		PONG_UI.scoreRight!.textContent = "0";

		saveTournamentMatch(
			this.matchPlayer![0],
			this.matchPlayer![1],
			this.matchPlayer![0].point,
			this.matchPlayer![1].point,
			winner
		);

		this.matchPlayer = null;

		// Resolve any pending point promise if still present
		if (this.pointEndResolver) {
			this.pointEndResolver(this.winner);
			this.pointEndResolver = null;
			this.pointPromise = null;
		}

		// Reset game after short delay	if it's a quickmatch
		/* 		if (!this.isTournament) {
					setTimeout(() => {
						this.resetGame();
					}, 1000);
				} */
		return this.winner;
	}

	public quitMatch() {
		this.partialReset();
		if (this.aiLeft) this.aiLeft.reset();
		if (this.aiRight) this.aiRight.reset();

		this.ball.active = false;

		// Reset player points only if matchPlayer exists
		if (this.matchPlayer) {
			this.matchPlayer[0].point = 0;
			this.matchPlayer[1].point = 0;
		}

		PONG_UI.scoreLeft!.textContent = "0";
		PONG_UI.scoreRight!.textContent = "0";

		this.matchPlayer = null;

		// Resolve any pending point promise if still present
		if (this.pointEndResolver) {
			this.pointEndResolver(null);
			this.pointEndResolver = null;
			this.pointPromise = null;
		}
	}

	private showPlayerPair = () => {
		if (!this.matchPlayer) return;
		console.log("Showing pair:", this.matchPlayer[0].name, "vs", this.matchPlayer[1].name);
		PONG_UI.playersList.innerHTML = "";
		showPlayerName(this.matchPlayer[0].name, this.matchPlayer[0].playerNbr, this.matchPlayer[0].isAi);
		showPlayerName(this.matchPlayer[1].name, this.matchPlayer[1].playerNbr, this.matchPlayer[1].isAi);
		if (PONG_UI.playersArea) PONG_UI.playersArea.classList.remove("hidden");
	};

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
}

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

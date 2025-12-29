import { Ball } from './ball.js';

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;

const pong_menu = document.getElementById("pong-menu") as HTMLDivElement;
const AIview = document.getElementById("AIview") as HTMLDivElement;
const AIbounceView = document.getElementById("AIbounceView") as HTMLDivElement;
const AInextView = document.getElementById("AInextView") as HTMLDivElement;


const ballAiView = new Ball(AIview, pong_menu, undefined, undefined, BALL_SIZE);
const ballAiBounceView = new Ball(AIbounceView, pong_menu, undefined, undefined, BALL_SIZE);
const ballAiNextView = new Ball(AInextView, pong_menu, undefined, undefined, BALL_SIZE);

export class Ai {
	ball: Ball;
	ballPos: { x: number; y: number };
	ballPrevPos: { x: number; y: number };
	ballNextPos: { x: number; y: number };

	paddleRight: HTMLDivElement;
	paddleLeft: HTMLDivElement;
	AIpaddle: HTMLDivElement;

	paddleCenter: { x: number; y: number };
	lastTime: number = performance.now();
	gameElapsedTime: number = 1

	constructor(ball: Ball, paddleRight: HTMLDivElement, paddleLeft: HTMLDivElement, AIpaddle: HTMLDivElement) {
		if (!ball) {
			throw new Error("Ball or paddle is null");
		}
		this.ball = ball;
		ballAiView.x = ball.x;
		ballAiView.y = ball.y;
		ballAiView.render();

		ballAiNextView.x = ball.x;
		ballAiNextView.y = ball.y;
		ballAiNextView.render();
		
		this.ballPos = { x: ball.x, y: ball.y };
		this.ballPrevPos = { x: ball.x, y: ball.y };
		this.ballNextPos = { x: ball.x, y: ball.y };

		this.paddleRight = paddleRight;
		this.paddleLeft = paddleLeft;

		this.AIpaddle = AIpaddle; 
		this.paddleCenter = { x: 0, y: 0 };
		this.updatePaddleCenter();
	}

	oneSecondLoop(firstRun = true) {
		// Update ball position every second
		if (this.canCheckBallPos() || firstRun) {
			this.updateBallPos();
			// Predict ball position for the next second
			ballAiView.render();

			this.predictBallNextPos();
			ballAiNextView.render();
			firstRun = false;
		}
		
		// Every frame: check delta and press appropriate key
		const delta = this.getPadBallDelta();
		if (Math.abs(delta) > 10) { // tolerance to avoid jitter
			if (delta > 0) {
				this.pressPaddleUp(true);
				this.pressPaddleDown(false);
			} else {
				this.pressPaddleUp(false);
				this.pressPaddleDown(true);
			}
		} else {
			this.pressPaddleUp(false);
			this.pressPaddleDown(false);
		} 
		/* 		else {
			this.resetPaddle();
			return requestAnimationFrame(() => this.oneSecondLoop(false, true));
		} */
		
		requestAnimationFrame(() => this.oneSecondLoop(false));
	}


	//BALL POSITION FUNCTIONS
	canCheckBallPos() {
		const currentTime = performance.now();
		if (currentTime - this.lastTime >= 1000) {
			this.lastTime = currentTime;
			console.log("Ball Pos Checked at", currentTime);
			return true;
		}
		return false;
	}

	updateBallPos() {
		this.ballPrevPos = { x: this.ballPos.x, y: this.ballPos.y };
		this.ballPos = { x: this.ball.x, y: this.ball.y };
		console.log("Ball Pos Updated to", this.ballPos);
		ballAiView.x = this.ballPos.x;
		ballAiView.y = this.ballPos.y;
	}

	updatePaddleCenter() {
		const centerX = this.AIpaddle.offsetLeft + this.AIpaddle.offsetWidth / 2;
		const centerY = this.AIpaddle.offsetTop + this.AIpaddle.offsetHeight / 2;
		this.paddleCenter = { x: centerX, y: centerY };
	}


	//BALL PREDICTION FUNCTIONS
	getPadBallDelta() {
		this.updatePaddleCenter();
		return this.paddleCenter.y - this.ballNextPos.y;
	}

	getPrevBallDelta() {
		return { x: this.ballPos.x - this.ballPrevPos.x, y: this.ballPos.y - this.ballPrevPos.y};
	}

	predictBallNextPos() {
		//Predict Ball Position using previous/current position Delta
		const prevDelta = this.getPrevBallDelta();

		this.ballNextPos.x = this.ballPos.x + prevDelta.x;
		this.ballNextPos.y = this.ballPos.y + prevDelta.y;
		const Yratio = prevDelta.y / prevDelta.x;
		const Xratio = prevDelta.x / prevDelta.y;


		//Predict Paddle Left/Right Hit
 		if (this.IsBallGoingOutRight()) {
			this.ballNextPos.x = this.paddleRight.offsetLeft - BALL_SIZE;

			const padBallDelta = this.ballNextPos.x - this.ballPos.x;
			const Ypos = padBallDelta * Yratio;
			this.ballNextPos.y = this.ballPos.y + Ypos;

		} else if (this.IsBallGoingOutLeft()){
			this.ballNextPos.x = this.paddleLeft.offsetLeft + BALL_SIZE;

			const padBallDelta = this.ballNextPos.x - this.ballPos.x;
			const Ypos = padBallDelta * Yratio;
			this.ballNextPos.y = this.ballPos.y + Ypos;
		}

		//The ball will hit top or bottom bounds, predict bounce
		//Predict Ball Bounce on top/bottom Walls
		if (this.IsBallGoingOutDown()) {
			console.log("Predicting Bounce Down");
			// 1. Distance from current Y to the wall (0)
    		const distToWallY = PONG_HEIGHT - this.ballPos.y;
			// 2. Calculate horizontal shift to impact point
    		const xImpactOffset = distToWallY * Xratio;

    		// 3. Set impact visual (Current X + Offset)
    		ballAiBounceView.x = this.ballPos.x + xImpactOffset;
    		ballAiBounceView.y = PONG_HEIGHT - (BALL_SIZE / 2); 
    		ballAiBounceView.render();


			this.ballNextPos.y = PONG_HEIGHT - (this.ballNextPos.y - PONG_HEIGHT);
			this.ballPrevPos.y = this.ballNextPos.y;
			this.ballPrevPos.x = this.ballNextPos.x;

		} else if (this.IsBallGoingOutUp()) {
			console.log("Predicting Bounce Up");
			// 1. Distance from current Y to the wall (0)
    		const distToWallY = 0 - this.ballPos.y;
			// 2. Calculate horizontal shift to impact point
    		const xImpactOffset = distToWallY * Xratio;

    		// 3. Set impact visual (Current X + Offset)
    		ballAiBounceView.x = this.ballPos.x + xImpactOffset;
    		ballAiBounceView.y = BALL_SIZE / 2; 
    		ballAiBounceView.render();

    		// 4. Reflect the NextPos Y across the wall
    		this.ballNextPos.y = -this.ballNextPos.y;

			//5. Update previous position
			this.ballPrevPos.y = this.ballNextPos.y;
			this.ballPrevPos.x = this.ballNextPos.x;
		} else {
			ballAiBounceView.x = -100; //move out of view
			ballAiBounceView.y = -100;
			ballAiBounceView.render();
		}

		ballAiNextView.x = this.ballNextPos.x;
		ballAiNextView.y = this.ballNextPos.y;
	}

	//PADDLE MOVMENT FUNCTIONS
	pressPaddleUp(option : boolean) {
		if (option == true) {
			document.dispatchEvent(new KeyboardEvent("keydown",
				{
					key: "ArrowUp",
					code: "ArrowUp",
					keyCode: 38,
					which: 38,
					bubbles: true,
					cancelable: true }));
		} else {
			document.dispatchEvent(new KeyboardEvent("keyup",
				{
					key: "ArrowUp",
					code: "ArrowUp",
					keyCode: 38,
					which: 38,
					bubbles: true,
					cancelable: true }));
		}
	}

	pressPaddleDown(option : boolean) {
		if (option == true) {
			document.dispatchEvent(new KeyboardEvent("keydown",
				{
					key: "ArrowDown",
					code: "ArrowDown",
					keyCode: 40,
					which: 40,
					bubbles: true,
					cancelable: true }));
		} else {
			document.dispatchEvent(new KeyboardEvent("keyup",
				{
					key: "ArrowDown",
					code: "ArrowDown",
					keyCode: 40,
					which: 40,
					bubbles: true,
					cancelable: true }));
		}
	}

	resetPaddle() {
		if (this.paddleCenter.y > (PONG_HEIGHT / 2) + 10) {
			this.pressPaddleUp(true);
			this.pressPaddleDown(false);
		} else if (this.paddleCenter.y < (PONG_HEIGHT / 2) - 10) {
			this.pressPaddleUp(false);
			this.pressPaddleDown(true);
		} else {
			this.pressPaddleUp(false);
			this.pressPaddleDown(false);
		}
	}

	showballAIViews(option: boolean) {
		if (option) {
			ballAiView.el.classList.remove('hidden');
			ballAiBounceView.el.classList.remove('hidden');
			ballAiNextView.el.classList.remove('hidden');
		} else {
			ballAiView.el.classList.add('hidden');
			ballAiBounceView.el.classList.add('hidden');
			ballAiNextView.el.classList.add('hidden');
		}
	}

	updategameElapsedTime(lapse: number) {
		this.gameElapsedTime = lapse;
	}

	IsBallGoingOutRight() {
		return this.ballNextPos.x > this.paddleRight.offsetLeft;
	}

	IsBallGoingOutLeft() {
		return this.ballNextPos.x < this.paddleLeft.offsetLeft;
	}

	IsBallGoingOutUp() {
		//0 : 0 is the top left corner
		return this.ballNextPos.y < 0;
	}

	IsBallGoingOutDown() {
		return this.ballNextPos.y > PONG_HEIGHT;
	}
}
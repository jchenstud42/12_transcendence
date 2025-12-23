
export class Ai {
	ball: any;
	ballPos: { x: number; y: number };
	paddle: HTMLDivElement;
	paddleCenter: { x: number; y: number };
	lastTime: number = performance.now();

	constructor(ball: any, paddle: HTMLDivElement) {
		if (!ball) {
			throw new Error("Ball or paddle is null");
		}
		this.ball = ball;
		this.ballPos = { x: ball.x, y: ball.y };
		this.paddle = paddle;
		this.paddleCenter = { x: 0, y: 0 };
		this.updateBallPos();
		this.updatePaddleCenter();
	}

	oneSecondLoop(firstRun = true) {
		// Update ball position every second
		if (this.canCheckBallPos() || firstRun) {
			this.updateBallPos();
			firstRun = false;
		}
		
		// Every frame: check delta and press appropriate key
		const delta = this.getPadBallDelta();
		if (Math.abs(delta) > 5) { // tolerance to avoid jitter
			if (delta > 0) {
				this.pressPaddleUp(true);
				this.pressPaddleDown(false);
			} else {
				this.pressPaddleUp(false);
				this.pressPaddleDown(true);
			}
		} else {
			this.resetPaddle();
		}
		
		requestAnimationFrame(() => this.oneSecondLoop(false));
	}

	canCheckBallPos() {
		const currentTime = performance.now();
		if (currentTime - this.lastTime >= 1000) {
			this.lastTime = currentTime;
			return true;
		}
		return false;
	}

	updateBallPos() {
		this.ballPos = { x: this.ball.x, y: this.ball.y };
	}

	updatePaddleCenter() {
		const centerX = this.paddle.offsetLeft + this.paddle.offsetWidth / 2;
		const centerY = this.paddle.offsetTop + this.paddle.offsetHeight / 2;
		this.paddleCenter = { x: centerX, y: centerY };
	}

	getPadBallDelta() {
		this.updatePaddleCenter();
		return this.paddleCenter.y - this.ballPos.y;
	}

	predictBallPos() {
	}

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
		this.pressPaddleUp(false);
		this.pressPaddleDown(false);
	}
}
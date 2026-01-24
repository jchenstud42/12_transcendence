import { PONG_UI } from './elements.js';

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;

export class Ball {
	ballUI: HTMLElement;
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	speed = 300;
	active = false;
	onScore: ((playerSide: 'left' | 'right') => void) | null = null; // callback to notify game when a point is win
	ballPaddleHitR: number;
	ballPaddleHitL: number;


	constructor(ballUI: HTMLElement) {
		this.ballUI = ballUI;
		this.initBallPos();
		this.ballPaddleHitL = 0;
		this.ballPaddleHitR = 0;
	}

	initBallPos() {
		const w = PONG_UI.pongMenu.clientWidth;
		const h = PONG_UI.pongMenu.clientHeight;
		this.x = w / 2 - BALL_SIZE / 2;
		this.y = h / 2 - BALL_SIZE / 2;
		this.vx = 0;
		this.vy = 0;
		this.active = false;
		this.render();
	}

	serve(direction: 1 | -1 = (Math.random() < 0.5 ? 1 : -1)) {
		this.initBallPos();
		const maxAngle = 45 * (Math.PI / 180);
		const angle = (Math.random() * maxAngle * 2) - maxAngle;
		this.speed = 300;
		this.vx = direction * this.speed * Math.cos(angle);
		this.vy = this.speed * Math.sin(angle);
		this.active = true;
	}

	reset() {
		this.initBallPos();
		this.ballPaddleHitL = 0;
		this.ballPaddleHitR = 0;
	}

	render() {
		this.ballUI.style.removeProperty('right');
		this.ballUI.style.left = `${this.x}px`;
		this.ballUI.style.top = `${this.y}px`
	}

	rectsIntersect(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
		return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
	}

	update(dt: number) {
		if (!this.active)
			return;

		const w = PONG_UI.pongMenu.clientWidth;
		const h = PONG_UI.pongMenu.clientHeight;

		//update ball position
		this.x += this.vx * dt;
		this.y += this.vy * dt;

		//wall colision
		if (this.y <= 0) {
			this.y = 0;
			this.vy = -this.vy;
		}
		if (this.y + BALL_SIZE >= h) {
			this.y = h - BALL_SIZE;
			this.vy = -this.vy;
		}

		const plX = PONG_UI.leftPaddle.offsetLeft;
		const plY = PONG_UI.leftPaddle.offsetTop;
		if (this.rectsIntersect(this.x, this.y, BALL_SIZE, BALL_SIZE, plX, plY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx < 0) {
			const paddleCenter = plY + PADDLE_HEIGHT / 2;
			const ballCenter = this.y + BALL_SIZE / 2;
			const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
			const bounceAngle = relative * (75 * Math.PI / 180);
			this.speed = Math.min(this.speed + 20, 900);
			this.vx = Math.abs(this.speed * Math.cos(bounceAngle));
			this.vy = this.speed * Math.sin(bounceAngle);
			this.x = plX + PADDLE_WIDTH + 0.5;
			this.ballPaddleHitL += 1;
		}

		const prX = PONG_UI.rightPaddle.offsetLeft;
		const prY = PONG_UI.rightPaddle.offsetTop;
		if (this.rectsIntersect(this.x, this.y, BALL_SIZE, BALL_SIZE, prX, prY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx > 0) {
			const paddleCenter = prY + PADDLE_HEIGHT / 2;
			const ballCenter = this.y + BALL_SIZE / 2;
			const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
			const bounceAngle = relative * (75 * Math.PI / 180);
			this.speed = Math.min(this.speed + 20, 900);
			this.vx = -Math.abs(this.speed * Math.cos(bounceAngle));
			this.vy = this.speed * Math.sin(bounceAngle);
			this.x = prX - PADDLE_WIDTH - 0.5;
			this.ballPaddleHitR += 1;
		}

		if (this.x + BALL_SIZE < 0) {
			console.debug('Ball out left -> right player scores');
			if (this.onScore) this.onScore('right'); // notifier le Game
			this.reset();
		}
		if (this.x > w) {
			console.debug('Ball out right -> left player scores');
			if (this.onScore) this.onScore('left'); // notifier le Game
			this.reset();
		}
		this.render();
	}
};
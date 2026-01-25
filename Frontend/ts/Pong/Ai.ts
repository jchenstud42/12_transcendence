import { Ball } from './Ball.js';
import { drawGrid, showGrid, hideGrid } from './grid.js';
import { PONG_UI } from './elements.js';

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;
const MAX_SECONDS_PREDICTED = 60;

//Use to draw AI's Predictions
PONG_UI.aiViewsCanvas.width = PONG_WIDTH;
PONG_UI.aiViewsCanvas.height = PONG_HEIGHT;
const ctx = PONG_UI.aiViewsCanvas.getContext('2d') as CanvasRenderingContext2D;

interface PredictionBall {
    x: number;
    y: number;
    opacity: number;  // 0.0 to 1.0 for visibility
    visible: boolean;
    color: string;
    radius: number;
}

const ballAiView = new Ball(PONG_UI.aiView);

/* 
	Problem to Solve:
	- Prediction after a wall bounce is shit : OK
	- Still some problem with the prediction view with wall bounce
	- Add On/Off AI view button
	- Add Mooving timer: The AI calculates how long before impact wiht paddle to reset instantly after hit
	- Check if everything works with Left AI paddle
	- Check if everything works with two AIs playing against each other
	- Create Onion layers to show every position of prediction with different opacity / color

*/

export class Ai {
	ball: Ball;
	ballPos: { x: number; y: number };
	ballPrevPos: { x: number; y: number };

	ballPrevPred: { x: number; y: number }; 
	ballNextPred: { x: number; y: number }; 
	wallBouncePred: boolean = false;

	prevBallDelta: { x: number; y: number };

	predictionBalls: PredictionBall[] = [];

	paddleRight: HTMLDivElement;
	paddleLeft: HTMLDivElement;

	AIpaddle: HTMLDivElement;
	paddleCenter: { x: number; y: number };
	AIside: 'NONE' | 'LEFT' | 'RIGHT' = 'NONE';
	AIstate: 'RESET' | 'MOVE' = 'MOVE';
	AILevel: number = 10;
	
	lastTime: number = performance.now();
	gameElapsedTime: number = 1
	nbrSecondsPredicted: number = 0;

	animationFrameId: number | null = null;

	constructor(ball: Ball, paddleRight: HTMLDivElement, paddleLeft: HTMLDivElement, AIpaddle: HTMLDivElement) {
		if (!ball) {
			throw new Error("Ball or paddle is null");
		}
		this.ball = ball;
		ballAiView.x = ball.x;
		ballAiView.y = ball.y;
		ballAiView.render();

		this.createPredictionBalls();
		drawGrid(); // Draw the grid on the AI views canvas
		
		this.ballPos = { x: ball.x, y: ball.y };
		this.ballPrevPos = { x: ball.x, y: ball.y };

		this.ballPrevPred = { x: ball.x, y: ball.y };
		this.ballNextPred = { x: ball.x, y: ball.y };
		this.prevBallDelta = { x: 0, y: 0 };

		this.paddleRight = paddleRight;
		this.paddleLeft = paddleLeft;
		this.AIpaddle = AIpaddle;
		if (this.AIpaddle === this.paddleLeft)
			this.AIside = 'LEFT';
		else if (this.AIpaddle === this.paddleRight)
			this.AIside = 'RIGHT';

		this.paddleCenter = { x: 0, y: 0 };
		this.updatePaddleCenter();
	}

	///////////////////////////////////////////////////////////////
	////              AI MAIN LOOP							   ////
	///////////////////////////////////////////////////////////////

	oneSecondLoop(firstRun = true) {
		// Update ball position every second
		if (this.canCheckBallPos() || firstRun) {
			this.updatePaddleCenter();
			this.updateBallPos();

			if (this.isBallMovingTowardsAI())
				this.AIstate = 'MOVE';
			else
				this.AIstate = 'RESET';

			this.predictballNextPos();

			firstRun = false;
		}
		
		// Every frame: check delta and press appropriate key
		const delta = this.getPadBallDelta();
		const randomAngle = Math.floor(Math.random() * (this.AILevel - 10 + 1)) + 10; // Random angle between 10 and AILevel
		if (this.AIstate === 'MOVE' && Math.abs(delta) > this.AILevel) {
			if (delta > 0) {
				this.pressPaddleUp(true);
				this.pressPaddleDown(false);
			} else {
				this.pressPaddleUp(false);
				this.pressPaddleDown(true);
			}
		} else if (this.AIstate === 'RESET')
			this.resetPaddle();
		else {
			this.pressPaddleUp(false);
			this.pressPaddleDown(false);
		}

		this.animationFrameId = requestAnimationFrame(() => this.oneSecondLoop(false));
	}

	///////////////////////////////////////////////////////////////
	////              Ball Position Functions                  ////
	///////////////////////////////////////////////////////////////

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
		if (!this.wallBouncePred)
			this.ballPrevPos = this.ballPos; //not sure

		this.wallBouncePred = false;

		this.ballPos = { x: this.ball.x, y: this.ball.y };

		//console.log("Ball Pos Updated to", this.ballPos);
		ballAiView.x = this.ballPos.x;
		ballAiView.y = this.ballPos.y;
		ballAiView.render();
	}

	updatePaddleCenter() {
		const centerX = this.AIpaddle.offsetLeft + this.AIpaddle.offsetWidth / 2;
		const centerY = this.AIpaddle.offsetTop + this.AIpaddle.offsetHeight / 2;
		this.paddleCenter = { x: centerX, y: centerY };
	}

	isBallMovingTowardsAI() {
		this.updatePrevBallDelta();	
		if (this.AIside === 'LEFT' && this.prevBallDelta.x < 0) {
			return true;
		} else if (this.AIside === 'RIGHT' && this.prevBallDelta.x > 0) {
			return true;
		}
		return false;
	}

	getPadBallDelta() {
		this.updatePaddleCenter();
		return this.paddleCenter.y - this.ballNextPred.y;
	}

	updatePrevBallDelta(ballPos = this.ballPos, ballPrevPos = this.ballPrevPos) {
		// Apply a smoothing factor to be sure the ball will reach the predicted position
		this.prevBallDelta.x = (ballPos.x - ballPrevPos.x) * 0.9;
		this.prevBallDelta.y = (ballPos.y - ballPrevPos.y) * 0.9;
	}

	isBallGoingOut() {
		if (this.isBallGoingOutUp() || this.isBallGoingOutDown())
			return true;
		if (this.isBallGoingOutRight() || this.isBallGoingOutLeft())
			return true;
		return false;
	}

	//0 : 0 is the top left corner
	isBallGoingOutUp() {
		return this.ballNextPred.y < 0;
	}

	isBallGoingOutDown() {
		return this.ballNextPred.y > PONG_HEIGHT;
	}

	isBallGoingOutRight() {
		return this.ballNextPred.x > this.paddleRight.offsetLeft;
	}

	isBallGoingOutLeft() {
		return this.ballNextPred.x < (this.paddleLeft.offsetLeft + this.paddleLeft.offsetWidth);
	}

	isBallPaddleImpact() {
		if (this.isBallGoingOutRight())
			return true;
		else if (this.isBallGoingOutLeft())
			return true;
		return false;	
	}

	///////////////////////////////////////////////////////////////
	////              PREDICTION FUNCTIONS                     ////
	///////////////////////////////////////////////////////////////

	predictballNextPos(firstRun = true) {

		if (firstRun) {
			this.hideAllPredictionsBalls();
			this.nbrSecondsPredicted = 0;

			//Predict Ball Position using previous/current position Delta
			this.updatePrevBallDelta();
			if (this.isDeltaZero()) {
				console.log("Ball is not moving, skipping prediction");
				return;
			}

			this.ballNextPred.x = this.ballPos.x + this.prevBallDelta.x;
			this.ballNextPred.y = this.ballPos.y + this.prevBallDelta.y;

			if (!this.isBallGoingOut())
				this.updatePredictionBalls(this.ballNextPred);	
			
			this.ballPrevPred.x = this.ballPos.x;
			this.ballPrevPred.y = this.ballPos.y;

			this.nbrSecondsPredicted += 1;
		}

		if (this.isDeltaZero()) {
			//console.log("Ball is not moving, skipping prediction");
			return;
		}

		//Level of the AI dictactes how many seconds ahead it can predict until impact: TODO
		//Linear Prediction until impact with paddle or wall
		//If delta is 0, ball is not moving, skip prediction
		for (let i = 0; i < 20 && !this.isBallGoingOut(); i++) {
			this.ballPrevPred.x = this.ballNextPred.x;
			this.ballPrevPred.y = this.ballNextPred.y;

			this.ballNextPred.x += this.prevBallDelta.x;
			this.ballNextPred.y += this.prevBallDelta.y;

			if (!this.isBallGoingOut())
				this.updatePredictionBalls(this.ballNextPred);	

			this.nbrSecondsPredicted += 1;
			
			if (i === 19) {
				console.log("Max Prediction Iterations reached");
				return;
			}
		}

		const Xratio = this.prevBallDelta.x / this.prevBallDelta.y;
		
		if (this.isBallGoingOutUp()) {
			this.predictUpWallBounce(Xratio); //Updadte ballPrev == ballRebound and ballNext
			this.updatePrevBallDelta(this.ballNextPred, this.ballPrevPred);
			this.updatePredictionBalls(this.ballNextPred);	
			this.nbrSecondsPredicted += 1;
		} else if (this.isBallGoingOutDown()) {
			this.predictDownWallBounce(Xratio);
			this.updatePrevBallDelta(this.ballNextPred, this.ballPrevPred);
			this.updatePredictionBalls(this.ballNextPred);	
			this.nbrSecondsPredicted += 1;
		}

		if (!this.isBallPaddleImpact())
			this.predictballNextPos(false);
		
		const Yratio = this.prevBallDelta.y / this.prevBallDelta.x;

		//Predict Point of impact with Paddle
		if (this.isBallGoingOutRight()) {
			console.log("Predicting Right Paddle Bounce");
			this.predictRightPaddleBounce(Yratio);
			this.updatePredictionBalls(this.ballNextPred);	
			this.nbrSecondsPredicted += 1;
		}
		else if (this.isBallGoingOutLeft()) {
			console.log("Predicting Left Paddle Bounce");
			this.predictLeftPaddleBounce(Yratio);
			this.updatePredictionBalls(this.ballNextPred);	
			this.nbrSecondsPredicted += 1;
		}

		this.drawPredictionBalls(ctx);

		//console.log("Prediction complete. Next Pos:", this.ballNextPred, "in", this.nbrSecondsPredicted, "seconds");
	}

	predictUpWallBounce(Xratio: number) {
		console.log("Predicting Bounce Up");
		// 1. Distance from current Y to the wall (0)
		const distToWallY = 0 - this.ballPos.y;
		// 2. Calculate horizontal shift to impact point
		const xImpactOffset = distToWallY * Xratio;

		// 3. Set impact visual (Current X + Offset)
		const ballAiBounce: { x: number; y: number } = { x: 0, y: 0 };
		ballAiBounce.x = this.ballPos.x + xImpactOffset;
		ballAiBounce.y = BALL_SIZE / 2;

		this.updatePredictionBalls(ballAiBounce);	

		// 4. Reflect the NextPos Y across the wall
		this.ballNextPred.y = -this.ballNextPred.y;

		//5. Update previous position // PROBABLY NEED TO CHANGE BALL POS AND NOT PREV POS TO FIX BOUNCES
		this.ballPrevPred.x = ballAiBounce.x;
		this.ballPrevPred.y = ballAiBounce.y;

		if (this.nbrSecondsPredicted === 1) {
			this.ballPrevPos.x = ballAiBounce.x;
			this.ballPrevPos.y = ballAiBounce.y;
			this.wallBouncePred = true;
		}
	}

	predictDownWallBounce(Xratio: number) {
		console.log("Predicting Bounce Down");
		// 1. Distance from current Y to the wall (0)
		const distToWallY = PONG_HEIGHT - this.ballPos.y;
		// 2. Calculate horizontal shift to impact point
		const xImpactOffset = distToWallY * Xratio;

		// 3. Set impact visual (Current X + Offset)
		const ballAiBounce: { x: number; y: number } = { x: 0, y: 0 };
		ballAiBounce.x = this.ballPos.x + xImpactOffset;
		ballAiBounce.y = PONG_HEIGHT - (BALL_SIZE / 2);

		this.updatePredictionBalls(ballAiBounce);	

		this.ballNextPred.y = PONG_HEIGHT - (this.ballNextPred.y - PONG_HEIGHT);

		this.ballPrevPred.x = ballAiBounce.x;
		this.ballPrevPred.y = ballAiBounce.y;

		if (this.nbrSecondsPredicted === 1) {
			this.ballPrevPos.x = ballAiBounce.x;
			this.ballPrevPos.y = ballAiBounce.y;
			this.wallBouncePred = true;
		}
	}

	predictRightPaddleBounce(Yratio: number) {
		this.ballNextPred.x = this.paddleRight.offsetLeft - (BALL_SIZE / 2);
		//console.log("Ball going out Right detected ball.x will be placed at: ", this.ballNextPred.x);

		const padBallDelta = this.ballNextPred.x - this.ballPrevPred.x;
		const Ypos = padBallDelta * Yratio;
		this.ballNextPred.y = this.ballPrevPred.y + Ypos;

		this.ballPrevPred.x = this.ballNextPred.x;
		this.ballPrevPred.y = this.ballNextPred.y;

		if (this.nbrSecondsPredicted === 1) {
			this.ballPrevPos.x = this.ballNextPred.x;
			this.ballPrevPos.y = this.ballNextPred.y;
			this.wallBouncePred = true;
		}
	}

	predictLeftPaddleBounce(Yratio: number) {
		this.ballNextPred.x = this.paddleLeft.offsetLeft + this.paddleLeft.offsetWidth + (BALL_SIZE / 2);

		//console.log("Ball going out Left detected ball.x will be placed at: ", this.ballNextPred.x);

		const padBallDelta = this.ballNextPred.x - this.ballPrevPred.x;
		const Ypos = padBallDelta * Yratio;
		this.ballNextPred.y = this.ballPrevPred.y + Ypos;

		this.ballPrevPred.x = this.ballNextPred.x;
		this.ballPrevPred.y = this.ballNextPred.y;

		if (this.nbrSecondsPredicted === 1) {
			this.ballPrevPos.x = this.ballNextPred.x;
			this.ballPrevPos.y = this.ballNextPred.y;
			this.wallBouncePred = true;
		}
	}

	///////////////////////////////////////////////////////////////
	////              PREDICTION VIEWS FUNCTIONS               ////
	///////////////////////////////////////////////////////////////

	// Show Prediction balls Element
	showAiPredictions() {
		ballAiView.ballUI.classList.remove('hidden');
		//PONG_UI.aiViewsCanvas.classList.remove('hidden');
		//showGrid();
	}
	
	// Hide Prediction balls Element
	hideAiPredictions() {
		ballAiView.ballUI.classList.add('hidden');
		PONG_UI.aiViewsCanvas.classList.add('hidden');
		hideGrid();
	}


	createPredictionBalls() {
		// Create as many prediction layers as MAX_SECONDS_PREDICTED
		for (let i = 0; i < MAX_SECONDS_PREDICTED; i++) {
    		this.predictionBalls.push({
        		x: 0,
        		y: 0,
        		opacity: 1.0,  // Decreasing opacity
        		visible: false,
        		color: '#ff0000ff',
        		radius: BALL_SIZE / 2
    		});
		}
	}

	drawPredictionBalls(ctx: CanvasRenderingContext2D) {
		this.setPredictionBallsOpacity();

    	// Clear canvas first
    	ctx.clearRect(0, 0, PONG_UI.aiViewsCanvas.width, PONG_UI.aiViewsCanvas.height);
		
    	// Draw each visible ball
    	this.predictionBalls.forEach(ball => {
    	    if (!ball.visible) return;  // Skip invisible balls
		
    	    ctx.save();
    	    ctx.globalAlpha = ball.opacity;  // Control visibility
    	    ctx.fillStyle = ball.color;
    	    ctx.beginPath();
    	    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    	    ctx.fill();
    	    ctx.restore();
    	});
	}

	// Hide every single balls
	hideAllPredictionsBalls() {
	    this.predictionBalls.forEach(ball => ball.visible = false);
	}

	getNextHiddenBallIndex(): number {
    	return this.predictionBalls.findIndex(ball => !ball.visible);
	} 

	// Show specific Prediction ball
	showPredictionBall(index: number) {
	    this.predictionBalls[index].visible = true;
	}

	updatePredictionBalls(ballPos: {x: number, y: number}) {
		const Index = this.getNextHiddenBallIndex();
		if (Index === -1) return; // No hidden balls available

		this.predictionBalls[Index].x = ballPos.x;
		this.predictionBalls[Index].y = ballPos.y;
		this.predictionBalls[Index].visible = true;
	}

	setPredictionBallsOpacity() {
		// Get only visible balls
    	const visibleBalls = this.predictionBalls.filter(ball => ball.visible);
    	const totalVisible = visibleBalls.length;
		
    	if (totalVisible === 0) return;
		
    	// Set opacity proportionally
    	visibleBalls.forEach((ball, index) => {
    	    ball.opacity = (index + 1) / totalVisible;
    	});
	}

	///////////////////////////////////////////////////////////////
	////               PADDLE CONTROL FUNCTIONS                ////
	///////////////////////////////////////////////////////////////

	pressPaddleUp(option : boolean) {
		const paddleUpKey = this.AIside === 'LEFT' ? 'w' : 'ArrowUp';
		const paddleUpCode = this.AIside === 'LEFT' ? 87 : 38;

		if (option == true) {
			document.dispatchEvent(new KeyboardEvent("keydown",
				{
					key: paddleUpKey,
					code: paddleUpKey,
					keyCode: paddleUpCode,
					which: paddleUpCode,
					bubbles: true,
					cancelable: true }));
		} else {
			document.dispatchEvent(new KeyboardEvent("keyup",
				{
					key: paddleUpKey,
					code: paddleUpKey,
					keyCode: paddleUpCode,
					which: paddleUpCode,
					bubbles: true,
					cancelable: true }));
		}
	}

	pressPaddleDown(option : boolean) {
		const paddleDownKey = this.AIside === 'LEFT' ? 's' : 'ArrowDown';
		const paddleDownCode = this.AIside === 'LEFT' ? 83 : 40;
		if (option == true) {
			document.dispatchEvent(new KeyboardEvent("keydown",
				{
					key: paddleDownKey,
					code: paddleDownKey,
					keyCode: paddleDownCode,
					which: paddleDownCode,
					bubbles: true,
					cancelable: true }));
		} else {
			document.dispatchEvent(new KeyboardEvent("keyup",
				{
					key: paddleDownKey,
					code: paddleDownKey,
					keyCode: paddleDownCode,
					which: paddleDownCode,
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

	///////////////////////////////////////////////////////////////
	////               UTILS							       ////
	///////////////////////////////////////////////////////////////

	updategameElapsedTime(lapse: number) {
		this.gameElapsedTime = lapse;
	}

	isDeltaZero(): boolean {
		return this.prevBallDelta.x === 0 && this.prevBallDelta.y === 0;
	}

	updateAILevel() {
		if (this.AILevel < 50)
			this.AILevel += 20;
	}

	///////////////////////////////////////////////////////////////
	////               RESET AND CLEANUP                       ////
	///////////////////////////////////////////////////////////////

	reset() {
		// Cancel animation loop
		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId);
			this.animationFrameId = null;
		}

		// Release all keyboard presses
		this.pressPaddleUp(false);
		this.pressPaddleDown(false);

		// Hide prediction visuals
		this.hideAiPredictions();
		this.hideAllPredictionsBalls();

		// Clear canvas
		ctx.clearRect(0, 0, PONG_UI.aiViewsCanvas.width, PONG_UI.aiViewsCanvas.height);

		// Reset ball position states
		this.ballPos = { x: PONG_WIDTH / 2 - BALL_SIZE / 2, y: PONG_HEIGHT / 2 - BALL_SIZE / 2 };
		this.ballPrevPos = { x: PONG_WIDTH / 2 - BALL_SIZE / 2, y: PONG_HEIGHT / 2 - BALL_SIZE / 2 };
		this.ballPrevPred = { x: PONG_WIDTH / 2 - BALL_SIZE / 2, y: PONG_HEIGHT / 2 - BALL_SIZE / 2 };
		this.ballNextPred = { x: PONG_WIDTH / 2 - BALL_SIZE / 2, y: PONG_HEIGHT / 2 - BALL_SIZE / 2 };
		this.prevBallDelta = { x: 0, y: 0 };
		this.wallBouncePred = false;

		// Reset AI state
		this.AIstate = 'MOVE';
		this.lastTime = performance.now();
		this.gameElapsedTime = 1;
		this.nbrSecondsPredicted = 0;

		// Reset paddle center
		this.paddleCenter = { x: 0, y: 0 };
	}
}
import { Ball } from './ball.js';
const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;
const pong_menu = document.getElementById("pong-menu");
const AIview = document.getElementById("AIview");
const AIbounceView = document.getElementById("AIbounceView");
const AInextView = document.getElementById("AInextView");
const AIview_container = document.getElementById("AIview-container");
const ballAiView = new Ball(AIview, pong_menu, undefined, undefined, BALL_SIZE);
const ballAiBounceView = new Ball(AIbounceView, pong_menu, undefined, undefined, BALL_SIZE);
const ballAiNextView = new Ball(AInextView, pong_menu, undefined, undefined, BALL_SIZE);
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
    constructor(ball, paddleRight, paddleLeft, AIpaddle, AILevel) {
        this.AIside = 'NONE';
        this.AIstate = 'MOVE';
        this.AILevel = 1;
        this.lastTime = performance.now();
        this.gameElapsedTime = 1;
        if (!ball) {
            throw new Error("Ball or paddle is null");
        }
        this.ball = ball;
        ballAiView.x = ball.x;
        ballAiView.y = ball.y;
        ballAiView.render();
        ballAiBounceView.x = -100;
        ballAiBounceView.y = -100;
        ballAiBounceView.render();
        ballAiNextView.x = ball.x;
        ballAiNextView.y = ball.y;
        ballAiNextView.render();
        this.ballPos = { x: ball.x, y: ball.y };
        this.ballPrevPos = { x: ball.x, y: ball.y };
        this.ballNextPos = { x: ball.x, y: ball.y };
        this.paddleRight = paddleRight;
        this.paddleLeft = paddleLeft;
        this.AIpaddle = AIpaddle;
        if (this.AIpaddle === this.paddleLeft)
            this.AIside = 'LEFT';
        else if (this.AIpaddle === this.paddleRight)
            this.AIside = 'RIGHT';
        this.AILevel = AILevel;
        this.paddleCenter = { x: 0, y: 0 };
        this.updatePaddleCenter();
    }
    oneSecondLoop(firstRun = true) {
        // Update ball position every second
        if (this.canCheckBallPos() || firstRun) {
            this.updateBallPos();
            if (this.isBallMovingTowardsAI())
                this.AIstate = 'MOVE';
            else
                this.AIstate = 'RESET';
            this.predictBallNextPos();
            firstRun = false;
        }
        // Every frame: check delta and press appropriate key
        const delta = this.getPadBallDelta();
        if (this.AIstate === 'MOVE' && Math.abs(delta) > 10) { // tolerance to avoid jitter
            if (delta > 0) {
                this.pressPaddleUp(true);
                this.pressPaddleDown(false);
            }
            else {
                this.pressPaddleUp(false);
                this.pressPaddleDown(true);
            }
        }
        else if (this.AIstate === 'RESET')
            this.resetPaddle();
        else {
            this.pressPaddleUp(false);
            this.pressPaddleDown(false);
        }
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
        ballAiView.render();
    }
    updatePaddleCenter() {
        const centerX = this.AIpaddle.offsetLeft + this.AIpaddle.offsetWidth / 2;
        const centerY = this.AIpaddle.offsetTop + this.AIpaddle.offsetHeight / 2;
        this.paddleCenter = { x: centerX, y: centerY };
    }
    isBallMovingTowardsAI() {
        const prevDelta = this.getPrevBallDelta();
        if (this.AIside === 'LEFT' && prevDelta.x < 0) {
            return true;
        }
        else if (this.AIside === 'RIGHT' && prevDelta.x > 0) {
            return true;
        }
        return false;
    }
    //BALL PREDICTION FUNCTIONS
    getPadBallDelta() {
        this.updatePaddleCenter();
        return this.paddleCenter.y - this.ballNextPos.y;
    }
    getPrevBallDelta() {
        return { x: this.ballPos.x - this.ballPrevPos.x, y: this.ballPos.y - this.ballPrevPos.y };
    }
    predictBallNextPos() {
        //Predict Ball Position using previous/current position Delta
        const prevDelta = this.getPrevBallDelta();
        this.ballNextPos.x = this.ballPos.x + prevDelta.x;
        this.ballNextPos.y = this.ballPos.y + prevDelta.y;
        let i = 0;
        //Level of the AI ditactes how many seconds ahead it can predict until impact
        while (!this.isBallGoingOut() && i < 10) {
            this.ballNextPos.x += prevDelta.x;
            this.ballNextPos.y += prevDelta.y;
            i++;
        }
        const Yratio = prevDelta.y / prevDelta.x;
        const Xratio = prevDelta.x / prevDelta.y;
        //Predict Bonces Paddle (Left/Righ) or Wall (Up/Down)
        if (this.isBallGoingOutRight()) {
            ballAiBounceView.x = -100; //move wall bounce phantom out of view
            ballAiBounceView.y = -100;
            console.log("Predicting Right Paddle Bounce");
            this.predictRightPaddleBounce(Yratio);
        }
        else if (this.isBallGoingOutLeft()) {
            ballAiBounceView.x = -100; //move wall bounce phantom out of view
            ballAiBounceView.y = -100;
            console.log("Predicting Left Paddle Bounce");
            this.predictLeftPaddleBounce(Yratio);
        }
        else if (this.isBallGoingOutUp())
            this.predictUpWallBounce(Xratio);
        else if (this.isBallGoingOutDown())
            this.predictDownWallBounce(Xratio);
        ballAiBounceView.render();
        ballAiNextView.x = this.ballNextPos.x;
        ballAiNextView.y = this.ballNextPos.y;
        ballAiNextView.render();
    }
    //PADDLE MOVMENT FUNCTIONS
    pressPaddleUp(option) {
        const paddleUpKey = this.AIside === 'LEFT' ? 'w' : 'ArrowUp';
        const paddleUpCode = this.AIside === 'LEFT' ? 87 : 38;
        if (option == true) {
            document.dispatchEvent(new KeyboardEvent("keydown", {
                key: paddleUpKey,
                code: paddleUpKey,
                keyCode: paddleUpCode,
                which: paddleUpCode,
                bubbles: true,
                cancelable: true
            }));
        }
        else {
            document.dispatchEvent(new KeyboardEvent("keyup", {
                key: paddleUpKey,
                code: paddleUpKey,
                keyCode: paddleUpCode,
                which: paddleUpCode,
                bubbles: true,
                cancelable: true
            }));
        }
    }
    pressPaddleDown(option) {
        const paddleDownKey = this.AIside === 'LEFT' ? 's' : 'ArrowDown';
        const paddleDownCode = this.AIside === 'LEFT' ? 83 : 40;
        if (option == true) {
            document.dispatchEvent(new KeyboardEvent("keydown", {
                key: paddleDownKey,
                code: paddleDownKey,
                keyCode: paddleDownCode,
                which: paddleDownCode,
                bubbles: true,
                cancelable: true
            }));
        }
        else {
            document.dispatchEvent(new KeyboardEvent("keyup", {
                key: paddleDownKey,
                code: paddleDownKey,
                keyCode: paddleDownCode,
                which: paddleDownCode,
                bubbles: true,
                cancelable: true
            }));
        }
    }
    resetPaddle() {
        if (this.paddleCenter.y > (PONG_HEIGHT / 2) + 10) {
            this.pressPaddleUp(true);
            this.pressPaddleDown(false);
        }
        else if (this.paddleCenter.y < (PONG_HEIGHT / 2) - 10) {
            this.pressPaddleUp(false);
            this.pressPaddleDown(true);
        }
        else {
            this.pressPaddleUp(false);
            this.pressPaddleDown(false);
        }
    }
    showballAIViews(option) {
        if (option) {
            ballAiView.el.classList.remove('hidden');
            ballAiBounceView.el.classList.remove('hidden');
            ballAiNextView.el.classList.remove('hidden');
        }
        else {
            ballAiView.el.classList.add('hidden');
            ballAiBounceView.el.classList.add('hidden');
            ballAiNextView.el.classList.add('hidden');
        }
    }
    updategameElapsedTime(lapse) {
        this.gameElapsedTime = lapse;
    }
    isBallGoingOut() {
        if (this.isBallGoingOutUp() || this.isBallGoingOutDown())
            return true;
        if (this.AIside === 'RIGHT' && this.isBallGoingOutRight())
            return true;
        if (this.AIside === 'LEFT' && this.isBallGoingOutLeft())
            return true;
        return false;
    }
    isBallGoingOutUp() {
        //0 : 0 is the top left corner
        return this.ballNextPos.y < 0;
    }
    predictUpWallBounce(Xratio) {
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
        //5. Update previous position // PROBABLY NEED TO CHANGE BALL POS AND NOT PREV POS TO FIX BOUNCES
        this.ballPrevPos.x = ballAiBounceView.x;
        this.ballPrevPos.y = ballAiBounceView.y;
    }
    isBallGoingOutDown() {
        return this.ballNextPos.y > PONG_HEIGHT;
    }
    predictDownWallBounce(Xratio) {
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
        this.ballPrevPos.x = ballAiBounceView.x;
        this.ballPrevPos.y = ballAiBounceView.y;
    }
    isBallGoingOutRight() {
        return this.ballNextPos.x > this.paddleRight.offsetLeft;
    }
    predictRightPaddleBounce(Yratio) {
        this.ballNextPos.x = this.paddleRight.offsetLeft - BALL_SIZE;
        const padBallDelta = this.ballNextPos.x - this.ballPos.x;
        const Ypos = padBallDelta * Yratio;
        this.ballNextPos.y = this.ballPos.y + Ypos;
        this.ballPrevPos.x = this.ballNextPos.x;
        this.ballPrevPos.y = this.ballNextPos.y;
    }
    isBallGoingOutLeft() {
        return this.ballNextPos.x < this.paddleLeft.offsetLeft + this.paddleLeft.offsetWidth;
    }
    predictLeftPaddleBounce(Yratio) {
        this.ballNextPos.x = this.paddleLeft.offsetLeft + this.paddleLeft.offsetWidth;
        const padBallDelta = this.ballNextPos.x - this.ballPos.x;
        const Ypos = padBallDelta * Yratio;
        this.ballNextPos.y = this.ballPos.y + Ypos;
        this.ballPrevPos.x = this.ballNextPos.x;
        this.ballPrevPos.y = this.ballNextPos.y;
    }
}

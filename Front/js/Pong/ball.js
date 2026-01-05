const BALL_SPEED = 300;
export class Ball {
    constructor(el, container, leftPaddle, rightPaddle, size = 10) {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = BALL_SPEED;
        this.active = false;
        this.onScore = null; // callback
        this.el = el;
        this.container = container;
        this.size = size;
        this.leftPaddle = leftPaddle;
        this.rightPaddle = rightPaddle;
        this.initBallPos();
    }
    initBallPos() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.x = w / 2 - this.size / 2;
        this.y = h / 2 - this.size / 2;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
        this.render();
    }
    serve(direction = (Math.random() < 0.5 ? 1 : -1)) {
        this.initBallPos();
        const maxAngle = 45 * (Math.PI / 180);
        //Serve the ball in a random angle between -45 and 45 degrees
        const angle = (Math.random() * maxAngle * 2) - maxAngle;
        this.speed = BALL_SPEED;
        this.vx = direction * this.speed * Math.cos(angle);
        this.vy = this.speed * Math.sin(angle);
        this.active = true;
    }
    reset() {
        this.initBallPos();
    }
    render() {
        this.el.style.removeProperty('right');
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }
    rectsIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
        //Axis-aligned rectangle intersection
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }
    update(dt) {
        if (!this.active)
            return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        // update ball position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // wall collision
        if (this.y <= 0) {
            this.y = 0;
            this.vy = -this.vy;
        }
        if (this.y + this.size >= h) {
            this.y = h - this.size;
            this.vy = -this.vy;
        }
        // left paddle collision (optional)
        if (this.leftPaddle && this.vx < 0) {
            const plX = this.leftPaddle.offsetLeft;
            const plY = this.leftPaddle.offsetTop;
            const PADDLE_WIDTH = this.leftPaddle.offsetWidth;
            const PADDLE_HEIGHT = this.leftPaddle.offsetHeight;
            if (this.rectsIntersect(this.x, this.y, this.size, this.size, plX, plY, PADDLE_WIDTH, PADDLE_HEIGHT)) {
                const paddleCenter = plY + PADDLE_HEIGHT / 2;
                const ballCenter = this.y + this.size / 2;
                const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
                const bounceAngle = relative * (75 * Math.PI / 180);
                this.speed = Math.min(this.speed + 20, 900);
                this.vx = Math.abs(this.speed * Math.cos(bounceAngle));
                this.vy = this.speed * Math.sin(bounceAngle);
                this.x = plX + PADDLE_WIDTH + 0.5;
            }
        }
        // right paddle collision (optional)
        if (this.rightPaddle && this.vx > 0) {
            const prX = this.rightPaddle.offsetLeft;
            const prY = this.rightPaddle.offsetTop;
            const PADDLE_WIDTH = this.rightPaddle.offsetWidth;
            const PADDLE_HEIGHT = this.rightPaddle.offsetHeight;
            if (this.rectsIntersect(this.x, this.y, this.size, this.size, prX, prY, PADDLE_WIDTH, PADDLE_HEIGHT)) {
                const paddleCenter = prY + PADDLE_HEIGHT / 2;
                const ballCenter = this.y + this.size / 2;
                const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
                const bounceAngle = relative * (75 * Math.PI / 180);
                this.speed = Math.min(this.speed + 20, 900);
                this.vx = -Math.abs(this.speed * Math.cos(bounceAngle));
                this.vy = this.speed * Math.sin(bounceAngle);
                this.x = prX - PADDLE_WIDTH - 0.5;
            }
        }
        if (this.x + this.size < 0) {
            console.debug('Ball out left -> right player scores');
            if (this.onScore)
                this.onScore('right');
            this.reset();
            this.serve();
        }
        if (this.x > w) {
            console.debug('Ball out right -> left player scores');
            if (this.onScore)
                this.onScore('left');
            this.reset();
            this.serve();
        }
        this.render();
    }
}

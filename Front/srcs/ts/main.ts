import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { shuffleArray } from "./utils/utils.js";
const page = document.getElementById("page")!;
const register_form = document.getElementById("register-form")! as HTMLFormElement | null;
const login_form = document.getElementById("login-form")! as HTMLFormElement | null;
const register_button = document.getElementById("register-button")!;
const login_button = document.getElementById("login-button")!;

//Profile
const profile_menu		= document.getElementById("profile-menu")! as HTMLDivElement | null;
const edit_menu			= document.getElementById("edit-profile-menu")! as HTMLDivElement | null;
const friends_menu		= document.getElementById("friends-menu")! as HTMLDivElement | null;
const history_menu		= document.getElementById("history-menu")! as HTMLDivElement | null;
const profile_button	= document.getElementById("profile-button")!;
const edit_button		= document.getElementById("edit-profile-button")!;
const friends_button	= document.getElementById("friends-button")!;
const history_button	= document.getElementById("history-button")!;

const twoFA_menu		= document.getElementById("2fa-menu")! as HTMLDivElement | null;
const twoFA_profile_button		= document.getElementById("2FA-button")!;
const twofaToggleBtn	= document.getElementById("2fa-toggle-btn")!;
const twofaStatusText	= document.getElementById("2fa-status-text")!;
const twofaTypeMenu		= document.getElementById("2fa-type-menu")!;
const btnEmail			= document.getElementById("2fa-email")!;
const btnSMS			= document.getElementById("2fa-sms")!;
const btnQR				= document.getElementById("2fa-qr")!;

let is2FAEnabled = false;

//affichage des formulaires lorsque l'on clique sur un des boutons avec synchronisation pour cacher l'autre formulaire si il etait deja affiche
//et cacher le formulaire si on reclique sur le boutton a nouveau
register_button.addEventListener("click", () => {
	if (login_form && !login_form.classList.contains("hidden")) {
		login_form.classList.add("hidden");
	}
	if (register_form && register_form.classList.contains("hidden")) {
		register_form.classList.remove("hidden");
	}
	else if (register_form) {
		register_form.classList.add("hidden");
	}
});

login_button.addEventListener("click", () => {
	if (register_form && !register_form.classList.contains("hidden")) {
		register_form.classList.add("hidden");
	}
	if (login_form && login_form.classList.contains("hidden")) {
		login_form.classList.remove("hidden");
	}
	else if (login_form) {
		login_form.classList.add("hidden");
	}
});

profile_button.addEventListener("click", () => {
	if (profile_menu && profile_menu.classList.contains("hidden")) {
		profile_menu.classList.remove("hidden");
	}
	else if (profile_menu) {
		profile_menu.classList.add("hidden");
	}
});

edit_button.addEventListener("click", () => {
	if (twoFA_menu && !twoFA_menu.classList.contains("hidden")) {
		twoFA_menu.classList.add("hidden");
	}
	if (friends_menu && !friends_menu.classList.contains("hidden")) {
		friends_menu.classList.add("hidden");
	}
	if (history_menu && !history_menu.classList.contains("hidden")) {
		history_menu.classList.add("hidden");
	}
	if (edit_menu && edit_menu.classList.contains("hidden")) {
		edit_menu.classList.remove("hidden");
	}
	else if (edit_menu) {
		edit_menu.classList.add("hidden");
	}
});

friends_button.addEventListener("click", () => {
	if (twoFA_menu && !twoFA_menu.classList.contains("hidden")) {
		twoFA_menu.classList.add("hidden");
	}
	if (edit_menu && !edit_menu.classList.contains("hidden")) {
		edit_menu.classList.add("hidden");
	}
	if (history_menu && !history_menu.classList.contains("hidden")) {
		history_menu.classList.add("hidden");
	}
	if (friends_menu && friends_menu.classList.contains("hidden")) {
		friends_menu.classList.remove("hidden");
	}
	else if (friends_menu) {
		friends_menu.classList.add("hidden");
	}
});

history_button.addEventListener("click", () => {
	if (twoFA_menu && !twoFA_menu.classList.contains("hidden")) {
		twoFA_menu.classList.add("hidden");
	}
	if (friends_menu && !friends_menu.classList.contains("hidden")) {
		friends_menu.classList.add("hidden");
	}
	if (edit_menu && !edit_menu.classList.contains("hidden")) {
		edit_menu.classList.add("hidden");
	}
	if (history_menu && history_menu.classList.contains("hidden")) {
		history_menu.classList.remove("hidden");
	}
	else if (history_menu) {
		history_menu.classList.add("hidden");
	}
});

twofaToggleBtn.addEventListener("click", () => {
	is2FAEnabled = !is2FAEnabled;

	if (is2FAEnabled) {
		// 2FA activée
		twofaStatusText.textContent = "2FA est activée.";
		twofaToggleBtn.textContent = "Désactiver";
		twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
		twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		 twofaTypeMenu.classList.remove("hidden");
	}
	else {
		// 2FA désactivée
		twofaStatusText.textContent = "2FA est désactivée.";
		twofaToggleBtn.textContent = "Activer";
		twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
		twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
		 twofaTypeMenu.classList.add("hidden");
	}
});

twoFA_profile_button.addEventListener("click", () => {
	if (edit_menu && !edit_menu.classList.contains("hidden")) {
		edit_menu.classList.add("hidden");
	}
	if (friends_menu && !friends_menu.classList.contains("hidden")) {
		friends_menu.classList.add("hidden");
	}
	if (history_menu && !history_menu.classList.contains("hidden")) {
		history_menu.classList.add("hidden");
	}
	if (twoFA_menu && twoFA_menu.classList.contains("hidden")) {
		twoFA_menu.classList.remove("hidden");
	}
	else if (twoFA_menu) {
		twoFA_menu.classList.add("hidden");
	}
});

btnEmail.addEventListener("click", () => {
	alert("2FA par Email sélectionnée !");
	twofaTypeMenu.classList.add("hidden");
});

btnSMS.addEventListener("click", () => {
	alert("2FA par SMS sélectionnée !");
	twofaTypeMenu.classList.add("hidden");
});

btnQR.addEventListener("click", () => {
	alert("2FA par QR Code sélectionnée !");
	twofaTypeMenu.classList.add("hidden");
});


/*- On regarde si on arrive a recuperer le formulaire
- On ecoute si le formulaire est submit, si oui on preventDefault pour pas qu'il ne reload la page.
- On recupere les inputs de l'utilisateur qu'il a rentre dans le formulaire.
- On verifie si les inputs ne sont pas vides
- On verifie si les inputs sont valides (email avec '@' '.', mdp avec 8 char, une maj, un chiffre, username non vide et pas trop long)
- On sanitize les inputs (pour eviter les attaques XSS)
- On cree un objet avec les inputs a envoyer au backend
- On envoie l'objet au backend via fetch a la route /register en POST
- On gere les erreurs ou le succes en mettant un message et on reset le formulaire

  Bisous, Mathis
*/
if (!register_form) {
	console.warn("Register form not found");
}
else {
	register_form.addEventListener("submit", async (e) => {
		e.preventDefault();

		const inUsername = document.getElementById("username") as HTMLInputElement | null;
		const inEmail = document.getElementById("email") as HTMLInputElement | null;
		const inPassword = document.getElementById("password") as HTMLInputElement | null;

		if (!inUsername || !inEmail || !inPassword) {
			console.error("Missing elements in the form");
			return;
		}

		const username = inUsername.value;
		const email = inEmail.value;
		const password = inPassword.value;

		const errors: string[] = [];
		if (!validateEmail(email))
			errors.push("Invalid email");
		if (!validatePassword(password))
			errors.push("Password must have 8 characters, one uppercase letter and one number");
		if (!validateTextInput(username, 20))
			errors.push("Invalid username");

		if (errors.length > 0) {
			alert("Errors:\n" + errors.join("\n"));
			return;
		}

		const safeUsername = sanitizeInput(username);
		const safeEmail = sanitizeInput(email);

		const sendBack = {
			username: safeUsername,
			email: safeEmail,
			password: password
		};

		const submit = register_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
		if (submit) {
			submit.disabled = true;
			const originalTxt = submit.textContent;
			submit.textContent = "Registering...";
			try {
				// ------------------------------------- A CHANGER ICI LE PATH TO REGISTER SI BESOIN------------------------------------------------------
				const res = await fetch("http://localhost:3000/register", {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json"
					},
					body: JSON.stringify(sendBack),
				});
				if (res.ok) {
					alert("Registration successful! You can now log in.");
					register_form.reset();
				}
				else {
					const err = await res.json().catch(() => null);
					alert("Server error: " + (err?.message || res.statusText));
				}
			}
			catch (err) {
				console.error("Fetch error:", err);
				alert("Network error. Try again later.");
			}
			finally {
				if (submit) {
					submit.disabled = false;
					submit.textContent = originalTxt ?? "Register";
				}
			}
		}
	});

	/* Vraiment pareil que le cote register
	On ecoute le submit du formulaire de login, on valide les inputs, on sanitize le tout, on envoie au backend sur la bonne route
	et on gere les erreurs ou le succes
	 - Toujours bisous, Mathis
	*/
	if (!login_form)
		console.warn("Login form not found");
	else {
		login_form.addEventListener("submit", async (e) => {
			e.preventDefault();
			const inLogin = document.getElementById("login-id") as HTMLInputElement | null;
			const inPassword = document.getElementById("login-password") as HTMLInputElement | null;

			if (!inLogin || !inPassword) {
				console.error("Missing elements to login");
				return;
			}

			const loginId = inLogin.value;
			const loginPass = inPassword.value;

			const err: string[] = [];
			if (!(validateEmail(loginId) || validateTextInput(loginId, 50)))
				err.push("Invalid username or email");
			if (!validatePassword(loginPass))
				err.push("Invalid password");

			if (err.length > 0) {
				alert("Errors:\n" + err.join("\n"));
				return;
			}

			const safeLoginId = sanitizeInput(loginId);

			const sendBack = {
				identifier: safeLoginId,
				password: loginPass
			};
			const submit = login_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
			if (submit) {
				submit.disabled = true;
				const originalTxt = submit.textContent;
				submit.textContent = "Logging in...";
				try {
					const res = await fetch("http://localhost:3000/login", {
						method: "POST",
						credentials: "include",
						headers: {
							"Content-Type": "application/json"
						},
						body: JSON.stringify(sendBack),
					});
					if (res.ok) {
						alert("Login successful, have fun!");
						login_form.reset();
					}
					else {
						const err = await res.json().catch(() => null);
						alert("Server error: " + (err?.message || res.statusText));
					}
				}
				catch (err) {
					console.error("Fetch error:", err);
					alert("Network error. Try again later.");
				}
				finally {
					if (submit) {
						submit.disabled = false;
						submit.textContent = originalTxt ?? "Login";
					}
				}
			}
		});
	}
}


// POOOONNNNNNNG
const paddle_left = document.getElementById("left-paddle") as HTMLDivElement;
const paddle_right = document.getElementById("right-paddle") as HTMLDivElement;
const ball = document.getElementById("ball") as HTMLDivElement;

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;

const pong_menu = document.getElementById("pong-menu") as HTMLDivElement;
const pong_button = document.getElementById("pong-button")!;
const qmatch_button = document.getElementById("quick-match-button")!;
const tournament_button = document.getElementById("tournament-button")!;

const enterPlayerNbr_text = document.getElementById("enterPlayerNbr-text")! as HTMLHeadingElement;
const playerNbr_text = document.getElementById("playerNbr-text")! as HTMLHeadingElement;
const playerIncr_button = document.getElementById("increasePlayer-button")!;
const playerDecr_button = document.getElementById("decreasePlayer-button")!;
const aiCounter = document.getElementById("ai-counter")! as HTMLDivElement;
const aiNbr_text = document.getElementById("aiNbr-text")! as HTMLDivElement;	
const OK_button = document.getElementById("OK-button")!;
const play_button = document.getElementById("play-button")!;
const ready_text = document.getElementById("ready-text")!;
const go_text = document.getElementById("go-text")!;


const playerName_container	= 	document.getElementById("playerName-container")! as HTMLDivElement;
const playerName_input		= 	document.getElementById("playerName-input")! as HTMLInputElement;
const playerColors 			= 	["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
const playersList 			= 	document.getElementById("players-list")! as HTMLDivElement;
const finalList 			= 	document.getElementById("final-list")! as HTMLDivElement;
const winnerName			= 	document.getElementById("winner-name")! as HTMLDivElement;
const crownImage			=	document.getElementById("crown-image")! as HTMLImageElement;

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

class Ball {
	el: HTMLDivElement;
	container: HTMLElement;
	size: number;
	x = 0;
	y = 0;
	vx = 0;
	vy = 0;
	speed = 300;
	active = false;

	constructor(el: HTMLDivElement, container: HTMLElement, size = BALL_SIZE) {
		this.el = el;
		this.container = container;
		this.size = size;
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
	}

	render() {
		this.el.style.removeProperty('right');
		this.el.style.left = `${this.x}px`;
		this.el.style.top = `${this.y}px`
	}

	rectsIntersect(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number) {
		return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
	}

	update(dt: number) {
		if (!this.active)
			return;

		const w = this.container.clientWidth;
		const h = this.container.clientHeight;

		//update ball position
		this.x += this.vx * dt;
		this.y += this.vy * dt;

		//wall colision
		if (this.y <= 0) {
			this.y = 0;
			this.vy = -this.vy;
		}
		if (this.y + this.size >= h) {
			this.y = h - this.size;
			this.vy = -this.vy;
		}

		const plX = paddle_left.offsetLeft;
		const plY = paddle_left.offsetTop;
		if (this.rectsIntersect(this.x, this.y, this.size, this.size, plX, plY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx < 0) {
			const paddleCenter = plY + PADDLE_HEIGHT / 2;
			const ballCenter = this.y + this.size / 2;
			const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
			const bounceAngle = relative * (75 * Math.PI / 180);
			this.speed = Math.min(this.speed + 20, 900);
			this.vx = Math.abs(this.speed * Math.cos(bounceAngle));
			this.vy = this.speed * Math.sin(bounceAngle);
			this.x = plX + PADDLE_WIDTH + 0.5;
		}

		const prX = paddle_right.offsetLeft;
		const prY = paddle_right.offsetTop;
		if (this.rectsIntersect(this.x, this.y, this.size, this.size, prX, prY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx > 0) {
			const paddleCenter = prY + PADDLE_HEIGHT / 2;
			const ballCenter = this.y + this.size / 2;
			const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
			const bounceAngle = relative * (75 * Math.PI / 180);
			this.speed = Math.min(this.speed + 20, 900);
			this.vx = -Math.abs(this.speed * Math.cos(bounceAngle));
			this.vy = this.speed * Math.sin(bounceAngle);
			this.x = prX - PADDLE_WIDTH - 0.5;
		}

		if (this.x + this.size < 0) {
			this.reset();
		}
		if (this.x > w) {
			this.reset();
		}
		this.render();
	}
};

const gameBall = new Ball(ball, pong_menu, BALL_SIZE);

//game loop to update ball position;
let lastTime = performance.now();
function gameLoop(now = performance.now()) {
	const dt = (now - lastTime) / 1000;
	lastTime = now;

	gameBall.update(dt);

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
	// si le bouton est déjà caché, on ne relance pas le countdown
	// if (pong_button.classList.contains("hidden")) return;

	pong_button.classList.add("hidden");
	paddle_left.classList.remove("hidden");
	paddle_right.classList.remove("hidden");
	ready_text.classList.remove("hidden");

	setTimeout(() => {
		ready_text.classList.add("hidden");
		go_text.classList.remove("hidden");
		setTimeout(() => {
			go_text.classList.add("hidden");
			ball.classList.remove("hidden");
			gameBall.serve();
		}, 1000);
	}, 1000);
}

// pong_button.addEventListener("click", startGame);

// document.addEventListener("keydown", (e) => {
// 	if (e.key !== "Enter") return;
// 	const active = document.activeElement as HTMLElement | null;
// 	if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
// 	startGame();
// });

//Set true or False wether a key is press among the "keys" list
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

//Fonction pour bouger les paddles en fonction de la key press
function updatePaddlePositions() {
	if (keys.w && paddle_left.offsetTop > 0) {
		paddle_left.style.top = `${paddle_left.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.s && paddle_left.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		paddle_left.style.top = `${paddle_left.offsetTop + PADDLE_SPEED}px`;
	}

	if (keys.ArrowUp && paddle_right.offsetTop > 0) {
		paddle_right.style.top = `${paddle_right.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.ArrowDown && paddle_right.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		paddle_right.style.top = `${paddle_right.offsetTop + PADDLE_SPEED}px`;
	}

	requestAnimationFrame(updatePaddlePositions);
}

requestAnimationFrame(updatePaddlePositions);

class Game {
	players: Player[] = [];
	winner: Player | null = null;

	constructor(playersName: [string, boolean][]) {
		this.players = playersName.map(([playerName, isAi], playerNbr) => new Player(playerName, isAi, playerNbr));
		if (playersName.length > 2)
			this.createTournament();
		/* else play a normal game */
	}

	public createTournament() {
		const shuffled: Player[] = shuffleArray(this.players);
		playersList.innerHTML = "";
		shuffled.forEach(({name, playerNbr, isAi}) => {
			addPlayerNameLabel(name, playerNbr, isAi);
		});
		showTournamentMatch();
	}
}


pong_button.addEventListener("click", () => {
	pong_button.classList.add("hidden");
	qmatch_button.classList.remove("hidden");
	tournament_button.classList.remove("hidden");
});

let isTournament = false;
let playerNbr = 2; 
let maxPlayer = 2;
let aiNbr = 0;

qmatch_button.addEventListener("click", () => {
	qmatch_button.classList.add("hidden");
	tournament_button.classList.add("hidden");
	enterPlayerNbr();
});

tournament_button.addEventListener("click", () => {
	qmatch_button.classList.add("hidden");
	tournament_button.classList.add("hidden");
	isTournament = true;
	playerNbr = 4;
	maxPlayer = 4;
	playerNbr_text.textContent = playerNbr.toString();
	enterPlayerNbr();
});


function enterPlayerNbr() {
	enterPlayerNbr_text.classList.remove("hidden");
	playerNbr_text.classList.remove("hidden");
	playerIncr_button.classList.remove("hidden");
	playerDecr_button.classList.remove("hidden");

	aiCounter.classList.remove("hidden");

	OK_button.classList.remove("hidden");
}

playerIncr_button.addEventListener("click", () => {
	if (playerNbr < maxPlayer) {
		playerNbr++;
		playerNbr_text.textContent = playerNbr.toString();

		aiNbr--;
		aiNbr_text.textContent = aiNbr.toString();
	}
})

playerDecr_button.addEventListener("click", () => {
		if (playerNbr > 0) {
			playerNbr--;
			playerNbr_text.textContent = playerNbr.toString();

			aiNbr++;
			aiNbr_text.textContent = aiNbr.toString();
		}
})

OK_button.addEventListener("click", () => {
	hidePlayerNbrMenu();
	playersList.classList.remove("hidden")

	if (playerNbr > 0) {
		enterPlayerName();
	}
	else {
		addAiNameLabel();
		const game = new Game(playerNames);
	}
})

function hidePlayerNbrMenu() {
	enterPlayerNbr_text.classList.add("hidden")
	playerNbr_text.classList.add("hidden")
	aiCounter.classList.add("hidden");
	playerIncr_button.classList.add("hidden")
	playerDecr_button.classList.add("hidden")
	OK_button.classList.add("hidden")
}

let playerNames: [string, boolean][] = [];
const aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"]
let nameEntered = 0;


function enterPlayerName() {
	playerName_container.classList.remove("hidden")
}

playerName_input.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter") {
		const playerName = playerName_input.value.trim();

		const nameAlreadyUsed = playerNames.some(
			([name, _isAI]) => name === playerName
		);

		if (playerName !== "" && !nameAlreadyUsed) {
			playerName_input.value = "";
			playerNames.push([playerName, false]);
			addPlayerNameLabel(playerName, nameEntered, false);
			nameEntered++;
		}

		if (nameEntered === playerNbr) {
			playerName_container.classList.add("hidden")

			addAiNameLabel();
			const game = new Game(playerNames);
		}
	}
})

function addPlayerNameLabel(name: string, index: number, isAi: boolean) {
  	const label = document.createElement("div");

  	const colorClass = playerColors[index];
  	label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
	if (!isAi)
  		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
  		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	playersList.appendChild(label);

}

function addAiNameLabel() {
	for (let y = 0; y < aiNbr; y++) {
		const aiName = aiNames[y]
	
		addPlayerNameLabel(aiName, nameEntered + y, true);
		playerNames.push([aiName, true]);
	}
}

function showTournamentMatch() {
	//Create/show Final Boxex (holder of the results of the first match)
	for (let i = 0; i < 2; i++) {
  		const label = document.createElement("div");

  		label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

		finalList.appendChild(label);
	}
	finalList.classList.remove("hidden");

	//Create/show Winner Box (holder of the results of the second match)
	const label = document.createElement("div");

	label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
	label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

	winnerName.appendChild(label);
	winnerName.classList.remove("hidden");
	crownImage.classList.remove("hidden");
}

function addFinalNameLabel(name: string, index: number, isAi: boolean) {
  	const label = document.createElement("div");

  	const colorClass = playerColors[index];
  	label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
	if (!isAi)
  		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
  		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	playersList.appendChild(label);
}
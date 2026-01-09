import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { shuffleArray, storeToken, storeUser, getServerErrorMessage } from "./utils/utils.js";
import { t } from "./traduction/i18n.js";
import { initUIState, applyLoggedInState, initAuthState } from "./UI/UI_State.js";
import { initProfile } from "./UI/UI_events.js";
import { initUIEvents } from "./UI/UI_events.js";
import { init2FA, showTwoFAForm, setSelected2FAType } from "./2FA_Front/2FA_Auth.js";
import { toggleMenu, hideMenu } from "./UI/UI_helpers.js";
import { PONG_UI } from "./Pong/elements.js";

// CA C LE DIV DANS LE HTML
const registerContainer = document.getElementById("register-form") as HTMLDivElement | null;
const loginContainer = document.getElementById("login-form") as HTMLDivElement | null;
// CA C LE <FORM> DANS LE HTML, FAITES LA DIFFERENCE A CHAQUE FOIS MERCI
const register_form = document.getElementById("register_form") as HTMLFormElement | null;
const login_form = document.getElementById("login_form") as HTMLFormElement | null;

const register_button = document.getElementById("register-button")!;
const login_button = document.getElementById("login-button")!;

const oauth42Btn = document.getElementById("oauth-42-button");

const start_button = document.getElementById("pong-start-button");


// 2FA Elements
const twofaForm = document.getElementById("twofa-form") as HTMLFormElement;
const destinationModal = document.getElementById("destination-modal")!;
const destinationInput = document.getElementById("destination-input") as HTMLInputElement;
const destinationTitle = document.getElementById("destination-title")!;
const destinationCancel = document.getElementById("destination-cancel")!;
const destinationConfirm = document.getElementById("destination-confirm")!;
let storedUserId: number | null = null;


//Profile
const profile_menu = document.getElementById("profile-menu")! as HTMLDivElement | null;
const edit_menu = document.getElementById("edit-profile-menu")! as HTMLDivElement | null;
const friends_menu = document.getElementById("friends-menu")! as HTMLDivElement | null;
const history_menu = document.getElementById("history-menu")! as HTMLDivElement | null;
const profile_button = document.getElementById("profile-button")!;
const edit_button = document.getElementById("edit-profile-button")!;
const friends_button = document.getElementById("friends-button")!;
const history_button = document.getElementById("history-button")!;

const pong_menu = document.getElementById("pong-menu") as HTMLDivElement;
const pong_overlay = document.getElementById("pong-overlay") as HTMLDivElement;
const back_button = document.getElementById("back-button")!;

// const add_friend_button = document.getElementById("btn-add-friend")!;
// const your_friends_button = document.getElementById("btn-your-friends")!;
const language_button = document.getElementById("language-button")!;
const language_menu = document.getElementById("language-menu")!;

const twoFA_menu = document.getElementById("2fa-menu")! as HTMLDivElement | null;
const twoFA_profile_button = document.getElementById("2FA-button")!;
const twofaToggleBtn = document.getElementById("2fa-toggle-btn")!;
const twofaStatusText = document.getElementById("2fa-status-text")!;
const twofaTypeMenu = document.getElementById("2fa-type-menu")!;
const btnEmail = document.getElementById("2fa-email")!;
const btnSMS = document.getElementById("2fa-sms")!;
const btnQR = document.getElementById("2fa-qr")!;

const addFriendBtn = document.getElementById("btn-add-friend")!;
const yourFriendsBtn = document.getElementById("btn-your-friends")!;
const pendingFriendsBtn = document.getElementById("btn-pending-friends")!;

let selected2FAType: string | null = null;
let is2FAEnabled = false;


initUIState(
	{ register_button, login_button, registerContainer, loginContainer, profile_button, logout_button: document.getElementById("logout-button"), twofaForm, twofaTypeMenu },
	{ storeToken, storeUser });

init2FA(
	{
		twofaForm, destinationModal, destinationInput, destinationTitle, destinationCancel, destinationConfirm, twofaTypeMenu, twofaStatusText, twofaToggleBtn,
		btnEmail, btnSMS, btnQR, twoFA_menu, twoFA_profile_button, oauth42Btn
	},
	{ sanitizeInput, t, getServerErrorMessage, storeToken, storeUser, applyLoggedInState }, is2FAEnabled);


initUIEvents(
	{
		register_button, login_button, profile_button, edit_button, friends_button, history_button, start_button,
		language_button, registerContainer, loginContainer, profile_menu, edit_menu, friends_menu, history_menu, twoFA_menu, twofaTypeMenu, language_menu, pong_menu, back_button, pong_overlay
	});


initProfile(
	{
		// avatarInput: document.getElementById("edit-avatar") as HTMLInputElement,
		saveProfileBtn: document.getElementById("btn-save-profile")!,
		usernameInput: document.getElementById("edit-username") as HTMLInputElement,
		emailInput: document.getElementById("edit-email") as HTMLInputElement,
		passwordInput: document.getElementById("edit-password") as HTMLInputElement,
		confirmPasswordInput: document.getElementById("edit-password-confirm") as HTMLInputElement,
		menuUsername: document.getElementById("menu-username")!,
		menuEmail: document.getElementById("menu-email")!,
		profileAvatar: document.getElementById("profile-avatar") as HTMLImageElement
	},
	storedUserId
);

initAuthState();

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
		const inConfirmPassword = document.getElementById("confirm-password") as HTMLInputElement | null;

		if (!inUsername || !inEmail || !inPassword || !inConfirmPassword) {
			console.error("Missing elements in the form");
			return;
		}

		const username = inUsername.value.trim();
		const email = inEmail.value.trim();
		const password = inPassword.value;
		const confirmPassword = inConfirmPassword.value;

		const errors: string[] = [];
		if (!validateEmail(email))
			errors.push(t("invalid_email"));
		if (!validatePassword(password))
			errors.push(t("invalid_password_format"));
		if (!validateTextInput(username, 20))
			errors.push(t("invalid_username"));
		if (password !== confirmPassword)
			errors.push(t("passwords_do_not_match"));
		if (errors.length > 0) {
			alert(t("errors_prefix") + "\n" + errors.join("\n"));
			return;
		}

		const submit = register_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
		if (submit) {
			submit.disabled = true;
			const originalTxt = submit.textContent;
			submit.textContent = t("registering");
			try {
				const payload = {
					username: sanitizeInput(username),
					email: sanitizeInput(email),
					password: password
				};

				const res = await fetch("/register", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(payload),
				});

				const data = await res.json().catch(() => null);

				if (res.ok) {
					if (data?.accessToken) storeToken(data.accessToken);
					if (data?.user) {
						storeUser(data.user);
						if (typeof data.user.id === 'number')
							storedUserId = data.user.id;
					}
					alert(t("register_ok"));
					register_form.reset();
				} else {
					alert(t("server_error_prefix") + " " + (data?.error || res.statusText));
				}
			} catch (err) {
				console.error("Register fetch error:", err);
				alert(t("network_error"));
			} finally {
				if (submit) {
					submit.disabled = false;
					submit.textContent = originalTxt ?? "Register";
				}
			}
		}
	});
}

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
			err.push(t("invalid_user_or_email"));
		if (!validatePassword(loginPass))
			err.push(t("invalid_password"));

		if (err.length > 0) {
			const translatedErrors = err.map(key => t(key as any));
			alert(t("errors_prefix") + "\n" + translatedErrors.join("\n"));
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
			submit.textContent = t("logging_in");
			try {
				const res = await fetch("/login", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(sendBack),
				});

				const data = await res.json();
				if (data.twoFAtoken) {
					sessionStorage.setItem("twoFAtoken", data.twoFAtoken);
				}
				if (res.ok) {
					if (data.message === "2FA required") {
						storedUserId = data.userId;
						setSelected2FAType(data.method as any);
						showTwoFAForm(data.method as any);
					}

					else {
						storeToken(data.accessToken);
						if (data.user) {
							storeUser(data.user);
							if (typeof data.user.id === 'number')
								storedUserId = data.user.id;
						}
						applyLoggedInState(data.user || { id: 0, username: '', email: '' });
						login_form.reset();
						alert(t("login_success"));
					}
				}
				else
					alert("Server error: " + (data?.error || res.statusText));
			}
			catch (err) {
				console.error("Fetch error:", err);
				alert(t("network_error"));
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


const logoutButton = document.getElementById("logout-button") as HTMLButtonElement;

if (logoutButton) {
	logoutButton.addEventListener("click", async () => {
		try {
			let idToSend: number | null = storedUserId;
			if (!idToSend) {
				try {
					const s = localStorage.getItem('user');
					if (s) {
						const parsed = JSON.parse(s);
						if (parsed && typeof parsed.id === 'number')
							idToSend = parsed.id;
					}
				} catch (err) {
					console.warn('Failed to parse stored user for logout', err);
				}
			}

			if (!idToSend) {
				alert(t("logout_missing_user_id"));
				return;
			}

			const res = await fetch("/logout", {
				method: "POST",
				credentials: "include",
				headers: {
					"Content-Type": "application/json"
				},
				body: JSON.stringify({ userId: idToSend })
			});

			if (res.ok) {
				storedUserId = null;
				localStorage.removeItem("accessToken");
				localStorage.removeItem("user");
				sessionStorage.removeItem("twoFAtoken");
				selected2FAType = null;
				try {
					await fetch("/logout", {
						method: "POST",
						credentials: "include",
						headers: { "Content-Type": "application/json" }
					});
				} catch (_) { }
				location.reload();
			} else {
				let serverBody: any = null;
				try {
					serverBody = await res.json().catch(() => null);
				} catch (_) {
					serverBody = null;
				}

				const bodyMsg = (serverBody && (serverBody.error || serverBody.message || serverBody.msg)) || "";
				if (res.status === 404 || res.status === 400 && /user not found/i.test(String(bodyMsg))) {
					storedUserId = null;
					localStorage.removeItem("accessToken");
					localStorage.removeItem('user');
					alert(t("logout_user_not_found"));
					location.reload();
					return;
				}

				const err = serverBody || { error: res.statusText };
				alert(t("logout_error") + " " + (err?.error || err?.message || res.statusText));
			}
		} catch (err) {
			console.error(err);
			alert(t("network_error"));
		}
	});
}

// On recup la liste d'amis en envoyant un GET a la route /friend/userId, en gros pour recup les amis de cet userId precisement
// luv yu
async function fetchFriendsList(userId: number) {
	try {
		const res = await fetch(`/friend/${userId}`, {
			credentials: "include",
			headers: getAuthHeaders()
		});
		const text = await res.text();

		if (!res.ok)
			throw new Error(t("failed_fetch_friends"));

		return JSON.parse(text);
	} catch (err) {
		console.error("fetchFriendsList error:", err);
		return [];
	}
}

// Fonction pour recuperer un user par son username, on envoie une requete GEt a la route pour recup l'user
// bisougue
async function fetchUserByUsername(username: string) {
	const res = await fetch(`/user/by-username/${username}`, {
		credentials: "include",
		headers: getAuthHeaders()
	});
	const textResponse = await res.text();
	if (!res.ok)
		throw new Error(t("profile_not_found"));

	return JSON.parse(textResponse);
}

// La fonction pour supprimer un ami qui est appelee dans le listener du bouton de suppression d'ami
// On envoie une requete DELETE a la route /friend avec le userId et le friendId dans le bobodydy
// Zoubis
async function removeFriend(userId: number, friendId: number) {
	const res = await fetch("/friend", {
		method: "DELETE",
		credentials: "include",
		headers: getAuthHeaders(),
		body: JSON.stringify({ userId, friendId }),
	});
	if (!res.ok)
		throw new Error(t("failed_remove_friend"));
	return await res.json();
}

// Fonction utilitaire pour recuperer les header d'authentification avec le token, pour les routes protegees par le preHandler
// Bises
function getAuthHeaders(): HeadersInit {
	const token = localStorage.getItem("accessToken");
	return {
		"Content-Type": "application/json",
		...(token && { "Authorization": `Bearer ${token}` })
	};
}


// Le listener pour envoyer une requete d'ami, on recup l'userId du LocalStorage et on demande a l'user le username de l'ami qu'il souhaite ajouter
// On fetch sur la route backend avec le bond body (senderId = userId du localStorage, receiverId = userId de l'ami qu'on veut ajouter)
// et les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on affiche une alerte comme quou la requete est envoyee
// Bisous
addFriendBtn.addEventListener("click", async () => {
	const friendUsername = prompt(t("ask_username"));
	if (!friendUsername)
		return;
	try {
		const s = localStorage.getItem('user');

		if (!s)
			throw new Error(t("must_login"));
		const currentUser = JSON.parse(s);
		const userData = await fetchUserByUsername(friendUsername);

		const payload = { senderId: currentUser.id, receiverId: userData.id };
		const res = await fetch("/friend/request", {
			method: "POST",
			credentials: "include",
			headers: getAuthHeaders(),
			body: JSON.stringify(payload),
		});

		const responseText = await res.text();

		if (!res.ok) {
			const error = JSON.parse(responseText);
			throw new Error(getServerErrorMessage(error.error) || t(("failed_friend_request")));
		}
		alert(t("friend_request_sent"));
	}
	catch (err: any) {
		console.error("Error:", err);
		alert(getServerErrorMessage(err.message));
	}
});


const friendsMenuList = document.createElement("div");
friendsMenuList.id = "friends-list";
friends_menu!.appendChild(friendsMenuList);


// On afficher la liste d'amis dans le menu friends, on cree un element pour chaque ami avec son username et un bouton pour le supprimer
// On ajoute un listener sur le bouton pour supprimer l'ami en question si click dessus
// Puis on refetch la liste d'amis et on re-render la liste actualise
// Bisous
function renderFriends(friends: any[]) {
	friendsMenuList.innerHTML = "";
	if (friends.length === 0) {
		const div = document.createElement("div");
		div.textContent = t("no_friends_yet");
		friendsMenuList.appendChild(div);
		return;
	}
	friends.forEach(f => {
		const div = document.createElement("div");
		div.className = "friend-item";
		div.innerHTML = `
						<span>${f.username} (${f.status})</span>
						<button class="remove-friend-btn" data-friend-id="${f.id}">✕</button>
				`;
		friendsMenuList.appendChild(div);
	});
	document.querySelectorAll(".remove-friend-btn").forEach(btn => {
		btn.addEventListener("click", async (e) => {
			const friendId = Number((e.target as HTMLElement).dataset.friendId);
			try {
				const s = localStorage.getItem('user');
				if (!s)
					throw new Error(t("must_login"));
				const userId = JSON.parse(s).id;

				await removeFriend(userId, friendId);
				const friends = await fetchFriendsList(userId);
				renderFriends(friends);
			}
			catch (err: any) {
				alert(err.message);
			}
		});
	});
}

// Le listener pour afficher la liste d'amis, on recup l'userId dans le localStorage et on fetch sur la route backend
// avec les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on appelle renderFriends pour afficher la liste d'amis
// Bisous
yourFriendsBtn.addEventListener("click", async () => {
	try {
		const s = localStorage.getItem('user');
		if (!s) {
			alert(t("must_login"));
			return;
		}
		const userId = JSON.parse(s).id;
		const friends = await fetchFriendsList(userId);
		renderFriends(friends);
	} catch (err: any) {
		console.error("Error:", err);
		alert(err.message);
	}
});

// Le listener pour afficher les requetes en attente, on recuper l'userId dans le localStorage et on fetch sur la route backend
// toujours avec les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on appelle renderPendingRequests pour afficher les requests
// Bisous
pendingFriendsBtn.addEventListener("click", async () => {
	try {
		const s = localStorage.getItem('user');
		if (!s)
			throw new Error(t("must_login"));
		const userId = JSON.parse(s).id;

		const res = await fetch(`/friend/request/received/${userId}`, {
			credentials: "include",
			headers: getAuthHeaders()
		});
		if (!res.ok)
			throw new Error("Failed to fetch pending requests");

		const requests = await res.json();
		renderPendingRequests(requests, userId);
	} catch (err: any) {
		console.error(err);
		alert(err.message);
	}
});

// On affiche les request d'amis en attente et on permet d'accepter ou de rejeter la request
// en fonction du choix on va dans le bon listener et la bonne fonction accept/reject
// Bisous bisous
function renderPendingRequests(requests: any[], currentUserId: number) {
	friendsMenuList.innerHTML = "";

	if (requests.length === 0) {
		const div = document.createElement("div");
		div.textContent = t("no_pending_requests");
		friendsMenuList.appendChild(div);
		return;
	}

	requests.forEach(r => {
		const div = document.createElement("div");
		div.className = "pending-item";
		div.innerHTML = `
			<span>${r.sendBy.username}</span>
			<button class="accept-btn" data-request-id="${r.id}"> ✅ </button>
			<button class="reject-btn" data-request-id="${r.id}"> ❌ </button>
		`;
		friendsMenuList.appendChild(div);
	});

	document.querySelectorAll(".accept-btn").forEach(btn => {
		btn.addEventListener("click", async (e) => {
			const requestId = Number((e.target as HTMLElement).dataset.requestId);
			try {
				await acceptFriendRequest(requestId, currentUserId);
				alert(t("friends_request_accepted"));
				pendingFriendsBtn.click();
			} catch (err: any) {
				alert(getServerErrorMessage(err.message));
			}
		});
	});

	document.querySelectorAll(".reject-btn").forEach(btn => {
		btn.addEventListener("click", async (e) => {
			const requestId = Number((e.target as HTMLElement).dataset.requestId);
			try {
				await rejectFriendRequest(requestId, currentUserId);
				alert(t("friends_request_rejected"));
				pendingFriendsBtn.click();
			} catch (err: any) {
				alert(getServerErrorMessage(err.message));
			}
		});
	});
}

// Accepter la request d'un ami, on fetch sur la bonne route backed avec le bon body et les bons headers (token)
// Bisous
async function acceptFriendRequest(requestId: number, userId: number) {
	const res = await fetch(`/friend/request/accept/${requestId}`, {
		method: "POST",
		credentials: "include",
		headers: getAuthHeaders(),
		body: JSON.stringify({ userId }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw new Error(getServerErrorMessage(error.error) || t("failed_accept_request"));
	}
	return await res.json();
}

// Meme fonctionnement que acceptFriendRequest mais pour rejeter
// Bisous
async function rejectFriendRequest(requestId: number, userId: number) {
	const res = await fetch(`/friend/request/reject/${requestId}`, {
		method: "POST",
		credentials: "include",
		headers: getAuthHeaders(),
		body: JSON.stringify({ userId }),
	});
	if (!res.ok) {
		const error = await res.json();
		throw new Error(getServerErrorMessage(error.error) || t("failed_reject_request"));
	}
	return await res.json();
}

async function fetchMatchHistory(userId: number) {
	try {
		const res = await fetch(`/match/${userId}`, {
			credentials: "include",
			headers: getAuthHeaders()
		});

		const text = await res.text();
		console.log("Match history raw:", text);

		if (!res.ok) throw new Error(text);

		const data = JSON.parse(text);
		return Array.isArray(data) ? data : data.matches ?? [];
	} catch (err) {
		console.error("fetchMatchHistory error:", err);
		return [];
	}
}

const historyMenuList = document.createElement("div");
historyMenuList.id = "history-list";
if (history_menu) {
	history_menu.appendChild(historyMenuList);
}

function renderMatchHistory(matches: any[]) {
	historyMenuList.innerHTML = "";

	if (!matches.length) {
		historyMenuList.textContent = t("no_match_history");
		return;
	}

	matches.forEach(match => {
		const p1 = match.player1?.username ?? "Unknown";
		const p2 = match.player2?.username ?? "Unknown";
		const date = match.date ? new Date(match.date).toLocaleDateString() : "N/A";
		const winner =
			match.winnerId === match.player1?.id ? p1 :
				match.winnerId === match.player2?.id ? p2 :
					t("draw");

		const div = document.createElement("div");
		div.innerHTML = `${date} | ${p1} ${match.score1} - ${match.score2} ${p2}`;
		historyMenuList.appendChild(div);
	});
}

history_button.addEventListener("click", async () => {
	try {
		const s = localStorage.getItem('user');
		if (!s) {
			alert(t("must_login"));
			return;
		}
		const userId = JSON.parse(s).id;
		const matches = await fetchMatchHistory(userId);
		renderMatchHistory(matches);
	} catch (err: any) {
		console.error("Error:", err);
		alert(err.message);
	}
});




// POOOONNNNNNNG

const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;

import { Ball } from './Pong/ball.js';
import { Ai } from './Pong/ai.js';

const guestPlayers = new Map<number, string>();
let loggedUserCounter = 100;
let guestIdCounter = 200;

function generateLoggedUserId(): number {
	const id = loggedUserCounter;
	loggedUserCounter++;
	if (loggedUserCounter >= 200) loggedUserCounter = 100;
	return id;
}

function generateGuestId(): number {
	const id = guestIdCounter;
	guestIdCounter++;
	if (guestIdCounter >= 300) guestIdCounter = 200;
	return id;
}

class Player {
	name: string = "";
	playerNbr: number = 0;
	paddle: HTMLDivElement | null = null;
	point: number = 0;
	gameWon: number = 0;
	isAi: boolean = false;
	userId: number;

	constructor(name: string, isAi: boolean, playerNbr: number, userId: number | null = null) {
		this.name = name;
		this.isAi = isAi;
		this.playerNbr = playerNbr;

		if (userId !== null) {
			this.userId = userId;
		}
		else {
			this.userId = generateGuestId();
			guestPlayers.set(this.userId, name);
		}

	}
}

const gameBall = new Ball(PONG_UI.ball, pong_menu, BALL_SIZE);

/* const aiPlayer = new Ai(gameBall, paddle_right, paddle_left, paddle_right, 3);
const aiPlayer2 = new Ai(gameBall, paddle_right, paddle_left, paddle_left, 3);

// AI View checkbox event listener
if (aiViewCheckboxInput) {
	aiViewCheckboxInput.addEventListener("change", (e) => {
		const isChecked = (e.target as HTMLInputElement).checked;
		console.log("AI View checkbox changed:", isChecked);
		// Add your logic here for when checkbox is checked/unchecked
		if (isChecked)
			aiPlayer.showAiPredictions();
		else
			aiPlayer.hideAiPredictions();
	});
} */

//game loop to update ball position;
let lastTime = performance.now();
function gameLoop(now = performance.now()) {
	const dt = (now - lastTime) / 1000;
	lastTime = now;

	gameBall.update(dt);
/* 	aiPlayer.updategameElapsedTime(dt);
	aiPlayer2.updategameElapsedTime(dt); */

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
/* function startGame() {
	PONG_UI.playButton.classList.add("hidden");
	PONG_UI.leftPaddle.classList.remove("hidden");
	PONG_UI.rightPaddle.classList.remove("hidden");
	PONG_UI.readyText.classList.remove("hidden");

	pendingTimeouts.push(setTimeout(() => {
		PONG_UI.readyText.classList.add("hidden");
		PONG_UI.goText.classList.remove("hidden");
		pendingTimeouts.push(setTimeout(() => {
			PONG_UI.goText.classList.add("hidden");
			PONG_UI.ball.classList.remove("hidden");
			gameBall.serve();
			enableKeyListeners();
		}, 1000));
	}, 1000));
} */

PONG_UI.playButton.addEventListener("click", () => {
	startMatch();
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter" && !PONG_UI.playButton.classList.contains("hidden")) {
		startMatch();
	}
});

function startMatch() {
	PONG_UI.playButton?.classList.add("hidden");
	PONG_UI.readyText.classList.remove("hidden");
	pendingTimeouts.push(setTimeout(() => {
		PONG_UI.readyText.classList.add("hidden");
		PONG_UI.goText.classList.remove("hidden");

		pendingTimeouts.push(setTimeout(() => {
			PONG_UI.goText.classList.add("hidden");
			PONG_UI.ball.classList.remove("hidden");
			PONG_UI.leftPaddle.classList.remove("hidden");
			PONG_UI.rightPaddle.classList.remove("hidden");
			gameBall.active = true;
			gameBall.serve();
/* 			//Ai Starts Playing here
			if (PONG_UI.aiViewCheckBox)
				PONG_UI.aiViewCheckBox.classList.remove("hidden");
			aiPlayer.oneSecondLoop();
			aiPlayer2.oneSecondLoop(); */
			enableKeyListeners();
		}, 1000));
	}, 1000));
}

//Set true or False wether a key is press among the "keys" listtwofaForm
const handleKeyDown = (e: KeyboardEvent) => {
	if (e.key in keys) {
		keys[e.key as keyof typeof keys] = true;
	}
};

const handleKeyUp = (e: KeyboardEvent) => {
	if (e.key in keys) {
		keys[e.key as keyof typeof keys] = false;
	}
};

// Fonctions pour activer/désactiver les event listeners
function enableKeyListeners() {
	document.addEventListener('keydown', handleKeyDown);
	document.addEventListener('keyup', handleKeyUp);
}

function disableKeyListeners() {
	document.removeEventListener('keydown', handleKeyDown);
	document.removeEventListener('keyup', handleKeyUp);
}

disableKeyListeners();

//Fonction pour bouger les paddles en fonction de la key press
function updatePaddlePositions() {
	if (keys.w && PONG_UI.leftPaddle.offsetTop > 0) {
		PONG_UI.leftPaddle.style.top = `${PONG_UI.leftPaddle.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.s && PONG_UI.leftPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		PONG_UI.leftPaddle.style.top = `${PONG_UI.leftPaddle.offsetTop + PADDLE_SPEED}px`;
	}

	if (keys.ArrowUp && PONG_UI.rightPaddle.offsetTop > 0) {
		PONG_UI.rightPaddle.style.top = `${PONG_UI.rightPaddle.offsetTop - PADDLE_SPEED}px`;
	}
	if (keys.ArrowDown && PONG_UI.rightPaddle.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
		PONG_UI.rightPaddle.style.top = `${PONG_UI.rightPaddle.offsetTop + PADDLE_SPEED}px`;
	}

	requestAnimationFrame(updatePaddlePositions);
}

requestAnimationFrame(updatePaddlePositions);

let pendingTimeouts: number[] = [];

export function resetGameMenu() {

	pendingTimeouts.forEach(id => clearTimeout(id));
	pendingTimeouts = [];

	disableKeyListeners();

	keys.w = false;
	keys.s = false;
	keys.ArrowUp = false;
	keys.ArrowDown = false;

	gameBall.active = false;
	gameBall.reset();
	gameBall.initBallPos();

	if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = "0";
	if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = "0";

	hideMenu(PONG_UI.okButton, PONG_UI.leftPaddle, PONG_UI.rightPaddle, PONG_UI.readyText, PONG_UI.goText, PONG_UI.playerNameContainer, PONG_UI.increasePlayerButton,
		PONG_UI.decreasePlayerButton, PONG_UI.ball, PONG_UI.aiCounter, PONG_UI.playersArea

	);

	PONG_UI.enterPlayerNbrText.classList.add("hidden");
	PONG_UI.playerNbrText.classList.add("hidden");
	PONG_UI.playersList.innerHTML = "";
	PONG_UI.finalList.innerHTML = "";
	PONG_UI.finalList.classList.add("hidden");
	PONG_UI.winnerName.innerHTML = "";
	playerNames = [];
	nameEntered = 0;
	isTournament = false;
	playerNbr = 2;
	maxPlayer = 2;
	aiNbr = 0;
	PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
	PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;

	PONG_UI.playerNbrText.textContent = playerNbr.toString();
	PONG_UI.aiNbrText.textContent = aiNbr.toString();

	PONG_UI.pongButton.classList.remove("hidden");
	PONG_UI.qmatchButton.classList.add("hidden");
	PONG_UI.tournamentButton.classList.add("hidden");
	PONG_UI.playButton.classList.add("hidden");
}

class Game {
	players: Player[] = [];
	winner: Player | null = null;
	pointsToWin = 2;
	isQuickMatch = false;

	constructor(playersName: [string, boolean][]) {
		const currentUserRaw = localStorage.getItem("user");
		const currentUser = currentUserRaw ? JSON.parse(currentUserRaw) : null;

		this.players = playersName.map(([playerName, isAi], playerNbr) => {
			const isCurrentUser = currentUser && !isAi && playerName === currentUser.username;
			return new Player(playerName, isAi, playerNbr, isCurrentUser ? currentUser.id : null);
		});

		this.isQuickMatch = !isTournament;

		gameBall.onScore = (playerSide: 'left' | 'right') => {
			this.addPoint(playerSide);
		};

		if (playersName.length > 2) {
			PONG_UI.finalList.classList.remove("hidden");
			this.createTournament();
		} else {
			PONG_UI.playButton.classList.remove("hidden");
		}
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

			// Check if player reached 10 points (quick match only)
			if (this.isQuickMatch && this.players[pointIndex].point >= this.pointsToWin) {
				this.endGame(this.players[pointIndex]);
			} else {
				// Reset ball for next point
				gameBall.reset();
				PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
				PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
				PONG_UI.ball.classList.add("hidden");
				disableKeyListeners();
				PONG_UI.leftPaddle.classList.add("hidden");
				PONG_UI.rightPaddle.classList.add("hidden");
				PONG_UI.playButton.classList.remove("hidden");
			}
		}
	}

	private async endGame(winner: Player) {
		this.winner = winner;
		console.log(`${winner.name} wins the match!`);
		gameBall.active = false;
		PONG_UI.ball.classList.add("hidden");
		PONG_UI.leftPaddle.classList.add("hidden");
		PONG_UI.rightPaddle.classList.add("hidden");
		PONG_UI.playButton.classList.add("hidden");

		alert(`${winner.name} wins with ${winner.point} points!`);

		const token = localStorage.getItem("accessToken");
		const player1 = this.players[0];
		const player2 = this.players[1];

		const hasRealUser = (player1.userId >= 100 && player1.userId < 200) ||
			(player2.userId >= 200 && player2.userId < 300);

		if (!token || !hasRealUser) {
			console.log("No logged-in user");
			setTimeout(() => {
				resetGameMenu();
			}, 1000);
			return;
		}

		if (this.players.length < 2) {
			console.warn("Not enough players");
			resetGameMenu();
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
			resetGameMenu();
		}, 1000);
	}

	public async createTournament() {
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
			addPlayerNameLabel(a.name, a.playerNbr, a.isAi);
			addPlayerNameLabel(b.name, b.playerNbr, b.isAi);
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
						gameBall.onScore = null;
						gameBall.active = false;
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
					gameBall.reset();
					PONG_UI.leftPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
					PONG_UI.rightPaddle.style.top = `${PONG_HEIGHT / 2 - PADDLE_HEIGHT / 2}px`;
					PONG_UI.ball.classList.add("hidden");
					disableKeyListeners();
					PONG_UI.leftPaddle.classList.add("hidden");
					PONG_UI.rightPaddle.classList.add("hidden");
					PONG_UI.playButton.classList.remove("hidden");
				};

				gameBall.onScore = handler;

				// Handler pour le click du play button
				const playClickHandler = () => {
					PONG_UI.playButton.removeEventListener("click", playClickHandler);
					document.removeEventListener("keydown", keyHandler);
					onPlayClick(); // Appeler showPair
					startMatch();
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
		gameBall.onScore = null;

		// Afficher le bouton retour
		back_button.classList.remove("hidden");

		// Attendre que l'utilisateur clique sur le bouton retour
		await new Promise<void>((resolve) => {
			const backClickHandler = () => {
				back_button.removeEventListener("click", backClickHandler);
				back_button.classList.add("hidden");
				resetGameMenu();
				resolve();
			};
			back_button.addEventListener("click", backClickHandler);
		});
	}



	public createQuickMatch() {
		PONG_UI.playButton.classList.remove("hidden");
	}
}

PONG_UI.pongButton.addEventListener("click", () => {
	PONG_UI.pongButton.classList.add("hidden");
	PONG_UI.qmatchButton.classList.remove("hidden");
	PONG_UI.tournamentButton.classList.remove("hidden");
});

let isTournament = false;
let playerNbr = 2;
let maxPlayer = 2;
let aiNbr = 0;

PONG_UI.qmatchButton.addEventListener("click", () => {
	PONG_UI.qmatchButton.classList.add("hidden");
	PONG_UI.tournamentButton.classList.add("hidden");
	enterPlayerNbr();
});

PONG_UI.tournamentButton.addEventListener("click", () => {
	PONG_UI.qmatchButton.classList.add("hidden");
	PONG_UI.tournamentButton.classList.add("hidden");
	isTournament = true;
	playerNbr = 4;
	maxPlayer = 4;
	PONG_UI.playerNbrText.textContent = playerNbr.toString();
	enterPlayerNbr();
});


function enterPlayerNbr() {
	PONG_UI.enterPlayerNbrText.classList.remove("hidden");
	PONG_UI.playerNbrText.classList.remove("hidden");
	PONG_UI.playerIncrButton.classList.remove("hidden");
	PONG_UI.playerDecrButton.classList.remove("hidden");

	PONG_UI.aiCounter.classList.remove("hidden");

	PONG_UI.okButton.classList.remove("hidden");
}

PONG_UI.playerIncrButton.addEventListener("click", () => {
	if (playerNbr < maxPlayer) {
		playerNbr++;
		PONG_UI.playerNbrText.textContent = playerNbr.toString();

		aiNbr--;
		PONG_UI.aiNbrText.textContent = aiNbr.toString();
	}
})

PONG_UI.playerDecrButton.addEventListener("click", () => {
	if (playerNbr > 0) {
		playerNbr--;
		PONG_UI.playerNbrText.textContent = playerNbr.toString();

		aiNbr++;
		PONG_UI.aiNbrText.textContent = aiNbr.toString();
	}
})

PONG_UI.okButton.addEventListener("click", () => {
	hidePlayerNbrMenu();
	if (PONG_UI.playersArea) {
		PONG_UI.playersArea.classList.remove("hidden");
	}
	const loggedUsername = getLoggedUsername();

	if (loggedUsername) {
		playerNames.push([loggedUsername, false]);
		addPlayerNameLabel(loggedUsername, 0, false);
		nameEntered = 1;
	}
	if (playerNbr > nameEntered) {
		enterPlayerName();
	} else {
		addAiNameLabel();
		new Game(playerNames);
	}
});

function getLoggedUsername(): string | null {
	const userRaw = localStorage.getItem("user");
	if (!userRaw)
		return (null);

	try {
		const user = JSON.parse(userRaw);
		return (user?.username ?? null);
	}
	catch {
		return (null);
	}
}

function hidePlayerNbrMenu() {
	PONG_UI.enterPlayerNbrText.classList.add("hidden")
	PONG_UI.playerNbrText.classList.add("hidden")
	PONG_UI.aiCounter.classList.add("hidden");
	PONG_UI.playerIncrButton.classList.add("hidden")
	PONG_UI.playerDecrButton.classList.add("hidden")
	PONG_UI.okButton.classList.add("hidden")
}

let playerNames: [string, boolean][] = [];
const aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"]
let nameEntered = 0;

function enterPlayerName() {
	PONG_UI.playerNameContainer.classList.remove("hidden")
}

PONG_UI.playerNameInput.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter") {
		const playerName = PONG_UI.playerNameInput.value.trim();

		const nameAlreadyUsed = playerNames.some(
			([name, _isAI]) => name === playerName
		);

		if (playerName !== "" && !nameAlreadyUsed) {
			PONG_UI.playerNameInput.value = "";
			playerNames.push([playerName, false]);
			addPlayerNameLabel(playerName, nameEntered, false);
			nameEntered++;
		}

		if (nameEntered === playerNbr) {
			PONG_UI.playerNameContainer.classList.add("hidden")

			// Reset scores display
			if (PONG_UI.scoreLeft) PONG_UI.scoreLeft.textContent = "0";
			if (PONG_UI.scoreRight) PONG_UI.scoreRight.textContent = "0";

			addAiNameLabel();
			const game = new Game(playerNames);
		}
	}
})

function addPlayerNameLabel(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = PONG_UI.playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
	if (!isAi)
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	PONG_UI.playersList.appendChild(label);

}

function addAiNameLabel() {
	for (let y = 0; y < aiNbr; y++) {
		const aiName = aiNames[y]

		addPlayerNameLabel(aiName, nameEntered + y, true);
		playerNames.push([aiName, true]);
	}
}

/* function showTournamentMatch() {
	//Create/show Final Boxex (holder of the results of the first match)
	for (let i = 0; i < 2; i++) {
		const label = document.createElement("div");

		label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

		PONG_UI.finalList.appendChild(label);
	}
	PONG_UI.finalList.classList.remove("hidden");

	//Create/show Winner Box (holder of the results of the second match)
	const label = document.createElement("div");

	label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
	label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;

	PONG_UI.winnerName.appendChild(label);
	PONG_UI.winnerName.classList.remove("hidden");
}

function addFinalNameLabel(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = PONG_UI.playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
	if (!isAi)
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
	else
		label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;

	PONG_UI.playersList.appendChild(label);
} */

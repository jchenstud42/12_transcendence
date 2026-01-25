import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { shuffleArray, storeToken, storeUser, getServerErrorMessage } from "./utils/utils.js";
import { t } from "./traduction/i18n.js";
import { TranslationKey } from "./traduction/traduction.js";
import { initUIState, applyLoggedInState, initAuthState } from "./UI/UI_State.js";
import { initProfile } from "./UI/UI_events.js";
import { initUIEvents } from "./UI/UI_events.js";
import { init2FA, showTwoFAForm, setSelected2FAType } from "./2FA_Front/2FA_Auth.js";
import { toggleMenu, hideMenu } from "./UI/UI_helpers.js";
import { resetTwoFAForm } from "./UI/UI_events.js";

// Chart.js global declaration
declare const Chart: any;

const registerContainer = document.getElementById("register-form") as HTMLDivElement | null;
const loginContainer = document.getElementById("login-form") as HTMLDivElement | null;

const register_form = document.getElementById("register_form") as HTMLFormElement | null;
const login_form = document.getElementById("login_form") as HTMLFormElement | null;

const register_button = document.getElementById("register-button")!;
const login_button = document.getElementById("login-button")!;

const oauth42Btn = document.getElementById("oauth-42-button");

const start_button = document.getElementById("pong-start-button") as HTMLButtonElement;


// 2FA Elements
const twofaForm = document.getElementById("twofa-form") as HTMLFormElement;
const destinationModal = document.getElementById("destination-modal")!;
const destinationInput = document.getElementById("destination-input") as HTMLInputElement;
const destinationTitle = document.getElementById("destination-title")!;
const destinationCancel = document.getElementById("destination-cancel")!;
const destinationConfirm = document.getElementById("destination-confirm")!;
let storedUserId: number | null = null;


//Profile
const profile_menu = document.getElementById("profile-menu")! as HTMLDivElement;
const edit_menu = document.getElementById("edit-profile-menu")! as HTMLDivElement | null;
const friends_menu = document.getElementById("friends-menu")! as HTMLDivElement | null;
const history_menu = document.getElementById("history-menu")! as HTMLDivElement | null;
const global_stats_menu = document.getElementById("global-stats-menu")! as HTMLDivElement | null;
const stats_back_button = document.getElementById("stats-back-button") as HTMLButtonElement;
const buttonGlobalStats = document.getElementById("stats-button") as HTMLButtonElement;
const profile_button = document.getElementById("profile-button")!;
const edit_button = document.getElementById("edit-profile-button")!;
const friends_button = document.getElementById("friends-button")!;
const history_button = document.getElementById("history-button")!;

const pong_menu = document.getElementById("pong-menu") as HTMLDivElement;
const pong_overlay = document.getElementById("pong-overlay") as HTMLDivElement;
const back_button = document.getElementById("back-button")!;

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
const verify_qr = document.getElementById("verify-qr")!;

const addFriendBtn = document.getElementById("btn-add-friend")!;
const yourFriendsBtn = document.getElementById("btn-your-friends")!;
const pendingFriendsBtn = document.getElementById("btn-pending-friends")!;

let selected2FAType: string | null = null;
let is2FAEnabled = false;


// POOOONNNNNNNG
const pong_button = document.getElementById("pong-button")!;
const qmatch_button = document.getElementById("quick-match-button")!;
const tournament_button = document.getElementById("tournament-button")!;

const play_button = document.getElementById("play-button") as HTMLButtonElement;

initUIState(
	{ register_button, login_button, registerContainer, loginContainer, profile_button, logout_button: document.getElementById("logout-button"), twofaForm, twofaTypeMenu },
	{ storeToken, storeUser });

init2FA(
	{
		twofaForm, destinationModal, destinationInput, destinationTitle, destinationCancel, destinationConfirm, twofaTypeMenu, twofaStatusText, twofaToggleBtn,
		btnEmail, btnSMS, btnQR, twoFA_menu, twoFA_profile_button, oauth42Btn, verify_qr, profile_menu, start_button
	},
	{ sanitizeInput, t, getServerErrorMessage, storeToken, storeUser, applyLoggedInState }, is2FAEnabled);


initUIEvents(
	{
		register_button, login_button, profile_button, edit_button, friends_button, history_button, global_stats_menu, start_button, play_button, pong_button, qmatch_button, tournament_button,
		stats_back_button, buttonGlobalStats, language_button, registerContainer, loginContainer, profile_menu, edit_menu, friends_menu, history_menu, twoFA_menu, twofaTypeMenu, language_menu, pong_menu, back_button, pong_overlay
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
			alert(t("error_prefix") + "\n" + getServerErrorMessage(errors.join("\n") as TranslationKey));
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
					alert(t("server_error_prefix") + " " + getServerErrorMessage(data?.error));
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
			alert(t("error_prefix") + getServerErrorMessage(err.join("\n")));
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
					alert(t("server_error_prefix") + getServerErrorMessage(data?.error));
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
				sessionStorage.removeItem("2fa-setup-mode");
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
				alert(t("logout_error") + " " + getServerErrorMessage(err?.error || err?.data));
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
		if (f.status === "OFFLINE")
			f.status = "🔴";
		else
			f.status = "🟢";
		div.className = "friend-item";
		div.innerHTML = `
						<span>${f.status} ${f.username} </span>
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
				alert(getServerErrorMessage(err.message));
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
		alert(getServerErrorMessage(err.message));
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
		alert(getServerErrorMessage(err.message));
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
		console.log("Match history response:", text);

		if (!res.ok) throw new Error(text);

		const data = JSON.parse(text);
		console.log("Parsed match history data:", data);
		return Array.isArray(data) ? data : data.matches ?? [];
	} catch (err) {
		console.error("fetchMatchHistory error:", err);
		return [];
	}
}

async function fetchGlobalStats(userId: number) {
	try {
		const res = await fetch(`/stats/${userId}`, {
			credentials: "include",
			headers: getAuthHeaders()
		});

		const text = await res.text();
		console.log("Global Stats response:", text);

		if (!res.ok) throw new Error(text);

		const data = JSON.parse(text);
		console.log("Parsed global stats data:", data);
		// Return the stats object directly
		return data;
	} catch (err) {
		console.error("fetchGlobalStats error:", err);
		// Return default empty stats on error
		return {
			userId,
			gamesPlayed: 0,
			gamesWon: 0,
			matchTime: 0
		};
	}
}

const historyMenuList = document.createElement("div");
historyMenuList.id = "history-list";
historyMenuList.className = "max-h-[400px] overflow-y-auto pr-2 custom-scrollbar";
if (history_menu) {
	history_menu.appendChild(historyMenuList);
}

function renderMatchHistory(matches: any[], stats: any) {
	historyMenuList.innerHTML = "";

	if (!matches.length) {
		historyMenuList.textContent = t("no_match_history");
		return;
	}

	hideMenu(stats_back_button);
	showMenu(buttonGlobalStats);

	matches.forEach(match => {
		const p1 = match.player1?.username ?? "Unknown";
		const p2 = match.player2?.username ?? "Unknown";
		const date = match.date ? new Date(match.date).toLocaleDateString() : "N/A";
		const winner =
			match.winnerId === match.player1?.id ? p1 :
				match.winnerId === match.player2?.id ? p2 :
					t("draw");

		const div = document.createElement("div");
		div.className = "mb-4 pb-2 border-b border-gray-800 last:mb-0 last:border-0";
		div.innerHTML = `${date} | ${p1} ${match.score1} - ${match.score2} ${p2}`;
		renderMatchStat(matches, match, historyMenuList, stats);

		historyMenuList.appendChild(div);
	});

	renderGlobalStats(matches, stats);
}

function renderMatchStat(matches: any, match: any, div: HTMLDivElement, stats: any) {
	const buttonStats = document.createElement("button");
	buttonStats.textContent = t("view_stats");
	buttonStats.className = "ml-2 px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700";

	buttonStats.addEventListener("click", () => {
		if (global_stats_menu?.classList.contains!("hidden"))
			hideMenu(global_stats_menu);
		hideMenu(buttonGlobalStats);
		historyMenuList.innerHTML = "";

		showMenu(stats_back_button);
		stats_back_button.addEventListener("click", () => {
			return renderMatchHistory(matches, stats);
		});

		const statsList = document.createElement("div");
		statsList.id = "stats-list";
		statsList.innerHTML = "";
		historyMenuList.appendChild(statsList);
		if (statsList) {
			statsList.innerHTML = `
					<div><strong>${t("match_statistics")}</strong></div>
					<div>${t("balls_hit")}: ${match.nbrOfBallHit ?? 0}</div>
					<div>${t("balls_missed")}: ${match.nbrOfBallMissed ?? 0}</div>
					<div>${t("match_duration")}: ${(match.matchTime != null) ? (Math.floor(match.matchTime / 1000) + " " + "seconds") : "N/A"}</div>`;
		}
	});
	div.appendChild(buttonStats);
};

function renderGlobalStats(matches: any[], stats: any) {
	// Clear existing global stats content
	global_stats_menu!.innerHTML = '';

	// Add back to history button
	const backHistoryButton = document.createElement("button");
	backHistoryButton.id = "back-to-history";
	backHistoryButton.className = "mb-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded transition-colors";
	backHistoryButton.textContent = "✕ Close";
	global_stats_menu!.appendChild(backHistoryButton);

	// Title
	const title = document.createElement("h2");
	title.className = "text-2xl font-bold mb-4 text-center";
	title.textContent = t("global_stats");
	global_stats_menu!.appendChild(title);

	if (stats && stats.gamesPlayed > 0) {
		const gamesPlayed = stats.gamesPlayed ?? 0;
		const gamesWon = stats.gamesWon ?? 0;
		const gamesLost = gamesPlayed - gamesWon;
		const winRate = gamesPlayed > 0 ? ((gamesWon / gamesPlayed) * 100).toFixed(1) : "0.0";
		const averageMatchDuration = stats.matchTime && gamesPlayed > 0
			? Math.floor(stats.matchTime / gamesPlayed / 1000)
			: 0;

		// Container for charts
		const chartsContainer = document.createElement("div");
		chartsContainer.className = "space-y-6";
		global_stats_menu!.appendChild(chartsContainer);

		// Win/Loss Pie Chart
		const pieChartContainer = document.createElement("div");
		pieChartContainer.className = "bg-gray-800 p-4 rounded";
		const pieTitle = document.createElement("h3");
		pieTitle.className = "text-lg font-semibold mb-2 text-center";
		pieTitle.textContent = t("wl_ratio");
		pieChartContainer.appendChild(pieTitle);

		const pieCanvas = document.createElement("canvas");
		pieCanvas.id = "winLossChart";
		pieCanvas.width = 250;
		pieCanvas.height = 250;
		pieChartContainer.appendChild(pieCanvas);
		chartsContainer.appendChild(pieChartContainer);

		// Games Stats Bar Chart
		const barChartContainer = document.createElement("div");
		barChartContainer.className = "bg-gray-800 p-4 rounded";
		const barTitle = document.createElement("h3");
		barTitle.className = "text-lg font-semibold mb-2 text-center";
		barTitle.textContent = t("match_statistics");
		barChartContainer.appendChild(barTitle);

		const barCanvas = document.createElement("canvas");
		barCanvas.id = "gamesStatsChart";
		barCanvas.width = 400;
		barCanvas.height = 200;
		barChartContainer.appendChild(barCanvas);
		chartsContainer.appendChild(barChartContainer);

		// Stats Summary
		const summary = document.createElement("div");
		summary.className = "bg-gray-800 p-4 rounded space-y-2";
		summary.innerHTML = `
			<div class="grid grid-cols-2 gap-2 text-sm">
				<div><span class="text-gray-400">${t("games_played")}</span> <span class="font-bold">${gamesPlayed}</span></div>
				<div><span class="text-gray-400">${t("wl_ratio")}</span> <span class="font-bold text-green-400">${winRate}%</span></div>
				<div><span class="text-gray-400">${t("won")}</span> <span class="font-bold text-green-500">${gamesWon}</span></div>
				<div><span class="text-gray-400">${t("lost")}</span> <span class="font-bold text-red-500">${gamesLost}</span></div>
				<div class="col-span-2"><span class="text-gray-400">${t("avg_duration")}</span> <span class="font-bold">${averageMatchDuration}s</span></div>
			</div>`;
		chartsContainer.appendChild(summary);

		// Create charts after elements are in DOM
		setTimeout(() => {
			// Win/Loss Pie Chart
			new Chart(pieCanvas, {
				type: 'doughnut',
				data: {
					labels: [t('won'), t('lost')],
					datasets: [{
						data: [gamesWon, gamesLost],
						backgroundColor: [
							'rgba(34, 197, 94, 0.8)',  // green
							'rgba(239, 68, 68, 0.8)'   // red
						],
						borderColor: [
							'rgba(34, 197, 94, 1)',
							'rgba(239, 68, 68, 1)'
						],
						borderWidth: 2
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					plugins: {
						legend: {
							position: 'bottom',
							labels: {
								color: '#ffffff',
								font: { size: 12 }
							}
						}
					}
				}
			});

			// Games Stats Bar Chart
			new Chart(barCanvas, {
				type: 'bar',
				data: {
					labels: [t('total_games'), t('won'), t('lost')],
					datasets: [{
						label: 'Games',
						data: [gamesPlayed, gamesWon, gamesLost],
						backgroundColor: [
							'rgba(220, 60, 240, 0.6)',  // purple
							'rgba(34, 197, 94, 0.6)',   // green
							'rgba(239, 68, 68, 0.6)'    // red
						],
						borderColor: [
							'rgba(220, 60, 240, 1)',
							'rgba(34, 197, 94, 1)',
							'rgba(239, 68, 68, 1)'
						],
						borderWidth: 2
					}]
				},
				options: {
					responsive: true,
					maintainAspectRatio: true,
					plugins: {
						legend: {
							display: false
						}
					},
					scales: {
						y: {
							beginAtZero: true,
							ticks: {
								color: '#ffffff',
								stepSize: 1
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.1)'
							}
						},
						x: {
							ticks: {
								color: '#ffffff'
							},
							grid: {
								color: 'rgba(255, 255, 255, 0.1)'
							}
						}
					}
				}
			});
		}, 100);
	} else {
		const noStats = document.createElement("div");
		noStats.className = "text-center py-8 text-gray-400";
		noStats.textContent = t('no_stat');
		global_stats_menu!.appendChild(noStats);
	}

	// Remove old event listeners by cloning the button
	const oldButton = buttonGlobalStats;
	const newButton = oldButton.cloneNode(true) as HTMLButtonElement;
	oldButton.parentNode?.replaceChild(newButton, oldButton);

	// Add event listener to the new button
	newButton.addEventListener("click", () => {
		if (global_stats_menu?.classList.contains("hidden")) {
			showMenu(global_stats_menu);
		} else {
			hideMenu(global_stats_menu);
		}
	});

	// Add event listener to back button
	backHistoryButton.addEventListener("click", () => {
		hideMenu(global_stats_menu);
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
		const stats = await fetchGlobalStats(userId);
		renderMatchHistory(matches, stats);
	} catch (err: any) {
		console.error("Error:", err);
		alert(getServerErrorMessage(err.message));
	}
});


//PONG
import { initMenuEvents, showMenu } from "./Pong/menu.js";
initMenuEvents();

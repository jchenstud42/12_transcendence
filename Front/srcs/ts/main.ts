import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { shuffleArray } from "./utils/utils.js";
import { initLanguage, setLanguage, t } from "./i18n.js";
import { TranslationKey } from "./traduction.js";
const page = document.getElementById("page")!;

// CA C LE DIV DANS LE HTML
const registerContainer = document.getElementById("register-form") as HTMLDivElement | null;
const loginContainer = document.getElementById("login-form") as HTMLDivElement | null;
// CA C LE <FORM> DANS LE HTML, FAITES LA DIFFERENCE A CHAQUE FOIS MERCI
const register_form = document.getElementById("register_form") as HTMLFormElement | null;
const login_form = document.getElementById("login_form") as HTMLFormElement | null;

const register_button = document.getElementById("register-button")!;
const login_button = document.getElementById("login-button")!;

const oauth42Btn = document.getElementById("oauth-42-button");


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

const serverErrorTranslations: Record<string, string> = {
	"User not found": "user_not_found",
	"Invalid username": "invalid_username",
	"Invalid password": "invalid_password",
	"Email already in use": "email_taken",
	"Username already in use": "username_or_email_taken",
	"2FA required": "two_fa_required",
	"Invalid 2FA code": "invalid_2fa_code",
	"Missing user ID": "missing_user_id",
	"Network error": "network_error",
	"Failed to enable 2FA": "two_fa_activation_error",
	"Not Found": "profile_not_found",
	"Invalid credentials": "invalid_user_or_password",
	"User already exists": "username_or_email_taken",
};

function getServerErrorMessage(error: string | undefined) {
	if (!error)
		return t("network_error");
	const key = serverErrorTranslations[error];
	return (key ? t(key as TranslationKey) : error);
}

//affichage des formulaires lorsque l'on clique sur un des boutons avec synchronisation pour cacher l'autre formulaire si il etait deja affiche
//et cacher le formulaire si on reclique sur le boutton a nouveau
if (oauth42Btn) {
	oauth42Btn.addEventListener("click", () => {
		window.location.href = "/oauth/42";
	});
}


function openDestinationModal(type: "email" | "sms") {
	selected2FAType = type;
	destinationModal.classList.remove("hidden");

	if (type === "email") {
		destinationTitle.textContent = t("enter_email_2fa");
		destinationInput.placeholder = "exemple@gmail.com";
		destinationInput.type = "email";
	} else if (type === "sms") {
		destinationTitle.textContent = t("enter_phone_2fa");
		destinationInput.placeholder = "+33123456789";
		destinationInput.type = "sms";
	}

	destinationInput.value = "";
	destinationInput.focus();
}

destinationCancel.addEventListener("click", () => {
	destinationModal.classList.add("hidden");
});

destinationConfirm.addEventListener("click", async () => {
	const destination = sanitizeInput(destinationInput.value.trim());

	if (!destination) {
		alert(t("no_value_provided"));
		return;
	}

	const res = await fetch("enable-2fa", {
		method: "POST",
		credentials: "include",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			type: selected2FAType,
			destination
		}),
	});

	let data: any = null;
	const text = await res.text();
	if (text) {
		data = JSON.parse(text);
	}

	if (!res.ok) {
		alert("Erreur : " + getServerErrorMessage(data.error));
		return;
	}

	alert(t("two_fa_enabled_success"));
	twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
	twofaToggleBtn.textContent = t("disable");
	destinationModal.classList.add("hidden");
});

btnEmail.addEventListener("click", () => {
	twofaTypeMenu.classList.add("hidden");
	openDestinationModal("email");
});

btnSMS.addEventListener("click", () => {
	twofaTypeMenu.classList.add("hidden");
	openDestinationModal("sms");
});

function storeToken(accessToken: string) {
	localStorage.setItem("accessToken", accessToken);
}

function storeUser(user: any) {
	try {
		localStorage.setItem('user', JSON.stringify(user));
	} catch (e) {
		console.warn('Failed to store user', e);
	}
}

function reset2FAUIState() {
	if (twofaForm) twofaForm.classList.add("hidden");
	if (twofaTypeMenu) twofaTypeMenu.classList.add("hidden");

	const qrContainer = document.getElementById("qr-container");
	if (qrContainer) qrContainer.innerHTML = "";

	sessionStorage.removeItem("2fa-setup-mode");
}

function applyLoggedInState(user: { id: number; username: string; email: string; }) {

	reset2FAUIState();

	try {
		(register_button as HTMLElement).classList.add('hidden');
		(login_button as HTMLElement).classList.add('hidden');
	} catch (e) { }

	const menuUsername = document.getElementById('menu-username');
	const menuEmail = document.getElementById('menu-email');
	const profileAvatar = document.getElementById('profile-avatar') as HTMLImageElement | null;
	if (menuUsername) menuUsername.textContent = user.username || '';
	if (menuEmail) menuEmail.textContent = user.email || '';
	if (profileAvatar) {
		profileAvatar.src = profileAvatar.src || '../assets/default-avatar.png';
	}

	const profileBtn = document.getElementById('profile-button');
	if (profileBtn) profileBtn.classList.remove('hidden');

	try {
		if (registerContainer) registerContainer.classList.add('hidden');
		if (loginContainer) loginContainer.classList.add('hidden');
	} catch (e) { }

	const logoutBtn = document.getElementById('logout-button');
	if (logoutBtn) logoutBtn.classList.remove('hidden');
}

function applyLoggedOutState() {
	try {
		(register_button as HTMLElement).classList.remove('hidden');
		(login_button as HTMLElement).classList.remove('hidden');
	} catch (e) { }

	const profileBtn = document.getElementById('profile-button');
	if (profileBtn) profileBtn.classList.add('hidden');

	const logoutBtn = document.getElementById('logout-button');
	if (logoutBtn) logoutBtn.classList.add('hidden');

	storedUserId = null;
}

async function initAuthState() {
	try {
		if (window.location.hash.startsWith("#accessToken=")) {
			const accessToken = window.location.hash.split("=")[1];
			storeToken(accessToken);

			window.history.replaceState(null, "", window.location.pathname + window.location.search);
		}

		const urlParams = new URLSearchParams(window.location.search);
		const twoFAToken = urlParams.get("twoFAtoken");
		const method = urlParams.get("method");

		if (twoFAToken) {
			sessionStorage.setItem("twoFAtoken", twoFAToken);

			const payload = JSON.parse(atob(twoFAToken.split(".")[1]));
			storedUserId = payload.userId;
			selected2FAType = method as "email" | "sms" | "qr";
			twofaForm.classList.remove("hidden");
			window.history.replaceState({}, "", window.location.pathname);
			return;
		}

		const res = await fetch("/user/me", { credentials: "include" });

		if (!res.ok) {
			applyLoggedOutState();
			return;
		}

		const data = await res.json();
		storeToken(data.accessToken);
		storeUser(data.user);

		if (data.user?.is2FAEnabled && !sessionStorage.getItem("twoFAtoken")) {
			storedUserId = data.user.id;
			console.log("User id in InitAuthState:", storedUserId);
			selected2FAType = data.user.twoFAMethod;
			twofaForm.classList.remove("hidden");
			return;
		}

		storedUserId = data.user.id;
		console.log("User id in InitAuthState before applyLoggedIn:", storedUserId);
		applyLoggedInState(data.user);

	} catch (err) {
		console.error("initAuthState error:", err);
		applyLoggedOutState();
	}
}


initAuthState();


function toggleMenu(main: HTMLElement | null, ...toHide: (HTMLElement | null)[]) {
	if (!main)
		return;
	toHide.forEach(menu => menu?.classList.add("hidden"));
	main.classList.toggle("hidden");
}


register_button.addEventListener("click", () => {
	toggleMenu(
		registerContainer,
		loginContainer,
		language_menu
	);
});


login_button.addEventListener("click", () => {
	toggleMenu(
		loginContainer,
		registerContainer,
		language_menu
	);
});


profile_button.addEventListener("click", () => {
	toggleMenu(
		profile_menu,
		language_menu
	);
});


edit_button.addEventListener("click", () => {
	toggleMenu(
		edit_menu,
		twoFA_menu,
		friends_menu,
		history_menu,
		twofaTypeMenu,
		language_menu
	);
});


friends_button.addEventListener("click", () => {
	toggleMenu(
		friends_menu,
		twoFA_menu,
		edit_menu,
		history_menu,
		twofaTypeMenu,
		language_menu
	);
});

history_button.addEventListener("click", () => {
	toggleMenu(
		history_menu,
		twoFA_menu,
		friends_menu,
		edit_menu,
		twofaTypeMenu,
		language_menu
	);
});

language_button.addEventListener("click", () => {
	toggleMenu(
		language_menu,
		registerContainer,
		loginContainer,
		profile_menu
	);
});


twofaToggleBtn.addEventListener("click", async () => {
	const isInSetupMode = !twofaTypeMenu.classList.contains("hidden");

	if (isInSetupMode && !is2FAEnabled) {
		twofaStatusText.textContent = t("two_fa_is_disabled");
		twofaToggleBtn.textContent = t("enable");
		twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
		twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
		twofaTypeMenu.classList.add("hidden");
		twofaForm.classList.add("hidden");

		const qrContainer = document.getElementById("qr-container");
		if (qrContainer) qrContainer.innerHTML = "";

		sessionStorage.removeItem("2fa-setup-mode");
		return;
	}

	if (!is2FAEnabled) {
		twofaStatusText.textContent = t("two_fa_setup_in_progress");
		twofaToggleBtn.textContent = t("cancel");
		twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
		twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		twofaTypeMenu.classList.remove("hidden");
	} else {
		try {
			const res = await fetch("/disable-2fa", {
				method: "POST",
				credentials: "include"
			});

			if (res.ok) {
				is2FAEnabled = false;
				twofaStatusText.textContent = t("two_fa_is_disabled");
				twofaToggleBtn.textContent = t("enable");
				twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
				twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
				twofaTypeMenu.classList.add("hidden");
				alert("2FA disabled successfully!");
			}
		} catch (err) {
			console.error("Error disabling 2FA:", err);
		}
	}
});

twoFA_profile_button.addEventListener("click", async () => {
	if (edit_menu && !edit_menu.classList.contains("hidden")) {
		edit_menu.classList.add("hidden");
	}
	if (friends_menu && !friends_menu.classList.contains("hidden")) {
		friends_menu.classList.add("hidden");
	}
	if (history_menu && !history_menu.classList.contains("hidden")) {
		history_menu.classList.add("hidden");
	}
	if (twofaTypeMenu && !twofaTypeMenu.classList.contains("hidden")) {
		twofaTypeMenu.classList.add("hidden");
	}

	if (twoFA_menu && twoFA_menu.classList.contains("hidden")) {
		twoFA_menu.classList.remove("hidden");
		await update2FAStatus();
	} else if (twoFA_menu) {
		twoFA_menu.classList.add("hidden");
	}
});

btnQR.addEventListener("click", async () => {
	selected2FAType = "qr";
	twofaTypeMenu.classList.add("hidden");
	twofaStatusText.textContent = t("two_fa_setup_in_progress");
	twofaToggleBtn.textContent = t("cancel");

	alert("Make sure to scan the QR code with your Google Authenticator app before refreshing or navigating away from this page.");

	try {
		const res = await fetch("/enable-2fa", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: "qr" })
		});

		if (!res.ok) throw new Error("Failed to enable 2FA");

		const data = await res.json();
		if (!data.qrCode) throw new Error("Server did not return QR code");

		sessionStorage.setItem("2fa-setup-mode", "true");

		const qrContainer = document.getElementById("qr-container")!;
		qrContainer.innerHTML = `<img src="${data.qrCode}" alt="Scan QR Code" />`;

		twofaForm.classList.remove("hidden");
		twofaStatusText.textContent = "Scannez le QR code et entrez le code généré...";

	} catch (err: any) {
		alert(err.message);
		twofaStatusText.textContent = "Erreur lors de l'activation du QR Code.";
		is2FAEnabled = false;
		selected2FAType = null;
		twofaToggleBtn.textContent = t("enable");
	}
});

const saveProfileBtn = document.getElementById("btn-save-profile")!;
saveProfileBtn.addEventListener("click", async () => {

	const username = (document.getElementById("edit-username") as HTMLInputElement).value.trim();
	const email = (document.getElementById("edit-email") as HTMLInputElement).value.trim();
	const avatar = (document.getElementById("edit-avatar") as HTMLInputElement).value.trim();
	const password = (document.getElementById("edit-password") as HTMLInputElement).value;
	const confirmPass = (document.getElementById("edit-password-confirm") as HTMLInputElement).value;

	const errors: string[] = [];

	if (username && !validateTextInput(username, 20))
		errors.push("Invalid username");

	if (email && !validateEmail(email))
		errors.push("Invalid email");

	if (password && !validatePassword(password))
		errors.push("Invalid password format");

	if (password !== confirmPass)
		errors.push("Passwords do not match");

	if (errors.length > 0) {
		alert("Errors:\n" + errors.join("\n"));
		return;
	}

	const payload: Record<string, any> = {};
	if (username) payload.username = sanitizeInput(username);
	if (email) payload.email = sanitizeInput(email);
	if (avatar) payload.avatar = sanitizeInput(avatar);
	if (password) payload.password = password;

	const token = localStorage.getItem("accessToken");
	let userId = storedUserId;

	if (!userId) {
		try {
			const user = JSON.parse(localStorage.getItem('user') || '{}');
			userId = user.id;
		} catch (e) {
			alert("Error: Cannot find user ID");
			return;
		}
	}
	try {
		const res = await fetch("/user/update-profile", {
			method: "PATCH",
			credentials: "include",
			headers: {
				"Content-Type": "application/json",
				"Authorization": token ? "Bearer " + token : ""
			},
			body: JSON.stringify(payload)
		});

		const data = await res.json();
		if (!res.ok) {
			alert("Server error: " + data.error);
			return;
		}

		storeUser(data.user);

		const menuUsername = document.getElementById("menu-username");
		const menuEmail = document.getElementById("menu-email");
		const profileAvatar = document.getElementById("profile-avatar") as HTMLImageElement;

		if (data.user.username) menuUsername!.textContent = data.user.username;
		if (data.user.email) menuEmail!.textContent = data.user.email;
		if (data.user.avatar) profileAvatar.src = data.user.avatar;

		alert("Profile updated!");

	} catch (err) {
		console.error(err);
		alert("Network error");
	}
});

document.addEventListener("DOMContentLoaded", () => {
	initLanguage();

	const language_button = document.getElementById("language-button");
	const language_menu = document.getElementById("language-menu");

	if (!language_button || !language_menu) {
		console.error("Language menu elements not found in DOM.");
		return;
	}

	language_button.addEventListener("click", () => {
		language_menu.classList.toggle("show");
	});

	const enBtn = language_menu.querySelector(".en");
	const frBtn = language_menu.querySelector(".fr");
	const esBtn = language_menu.querySelector(".es");

	if (enBtn) enBtn.addEventListener("click", () => setLanguage("en"));
	if (frBtn) frBtn.addEventListener("click", () => setLanguage("fr"));
	if (esBtn) esBtn.addEventListener("click", () => setLanguage("es"));

	document.addEventListener("click", (e) => {
		const target = e.target;

		if (!(target instanceof Node))
			return;

		if (!language_button.contains(target) && !language_menu.contains(target))
			language_menu.classList.remove("show");
	});
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
		if (!validateEmail(email)) errors.push("Invalid email");
		if (!validatePassword(password)) errors.push("Password must have 8 characters, one uppercase letter and one number");
		if (!validateTextInput(username, 20)) errors.push("Invalid username");
		if (password !== confirmPassword) errors.push("Passwords do not match");

		if (errors.length > 0) {
			alert("Errors:\n" + errors.join("\n"));
			return;
		}

		const submit = register_form.querySelector('button[type="submit"]') as HTMLButtonElement | null;
		if (submit) {
			submit.disabled = true;
			const originalTxt = submit.textContent;
			submit.textContent = "Registering...";
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
						if (typeof data.user.id === 'number') storedUserId = data.user.id;
					}
					// L'alert marche pas car bloque pqr le navigateur, a voir -------------------------------------
					alert("Registration successful, you can now log in");
					register_form.reset();
				} else {
					alert("Server error: " + (data?.error || res.statusText));
				}
			} catch (err) {
				console.error("Register fetch error:", err);
				alert("Network error. Try again later.");
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
			err.push("invalid_user_or_email");
		if (!validatePassword(loginPass))
			err.push("invalid_password");

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
						selected2FAType = data.method;
						twofaForm.classList.remove("hidden");
					}
					else {
						storeToken(data.accessToken);
						if (data.user) {
							storeUser(data.user);
							if (typeof data.user.id === 'number') storedUserId = data.user.id;
						}
						applyLoggedInState(data.user || { id: 0, username: '', email: '' });
						login_form.reset();
						console.log("Hourray");
						alert("Login successful");
					}
				}
				else
					alert("Server error: " + (data?.error || res.statusText));
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

async function update2FAStatus() {
	try {
		const res = await fetch("/user/me", { credentials: "include" });
		if (!res.ok) return;

		const data = await res.json();
		const user = data.user;

		if (user?.isTwoFAEnabled) {
			is2FAEnabled = true;
			twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${user.twoFAMethod || "qr"})`;
			twofaToggleBtn.textContent = t("disable");
			twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
			twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		} else {
			is2FAEnabled = false;
			twofaStatusText.textContent = t("two_fa_is_disabled");
			twofaToggleBtn.textContent = t("enable");
			twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
			twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
		}
	} catch (err) {
		console.error("Failed to fetch 2FA status:", err);
	}
}

twofaForm.addEventListener("submit", async (e) => {
	e.preventDefault();

	const codeInput = document.getElementById("twofa-code") as HTMLInputElement;
	const code = codeInput.value.trim();

	if (!code) return alert("Enter the 2FA code");
	if (!/^\d{6}$/.test(code)) {
		alert("Le code doit contenir exactement 6 chiffres.");
		return;
	}

	const isSetupMode = sessionStorage.getItem("2fa-setup-mode") === "true";
	const twoFAtoken = sessionStorage.getItem("twoFAtoken");

	try {
		let res: Response;

		if (selected2FAType === "email" || selected2FAType === "sms") {
			if (!twoFAtoken) {
				throw new Error("Missing 2FA token");
			}
			res = await fetch("/verify-2fa", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code, twoFAtoken }),
			});
		} else if (selected2FAType === "qr") {
			const body: Record<string, string> = { code };
			if (twoFAtoken && !isSetupMode) {
				body.twoFAtoken = twoFAtoken;
			}
			res = await fetch("/verify-totp", {
				method: "POST",
				credentials: "include",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(body)
			});
		} else {
			throw new Error("2FA method not selected");
		}

		const data = await res.json();
		if (!res.ok) throw new Error(data.error || "Erreur lors de la vérification 2FA");

		sessionStorage.removeItem("2fa-setup-mode");
		sessionStorage.removeItem("twoFAtoken");

		if (isSetupMode) {
			alert("2FA enabled successfully!");
			is2FAEnabled = true;
			twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
			twofaToggleBtn.textContent = t("disable");
			twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
			twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		} else {
			storeToken(data.accessToken);
			if (data.user) storeUser(data.user);
			applyLoggedInState(data.user || { id: 0, username: '', email: '' });
			alert("Login successful with 2FA!");
		}

		twofaForm.reset();
		twofaForm.classList.add("hidden");
		twofaTypeMenu.classList.add("hidden");

		const qrContainer = document.getElementById("qr-container");
		if (qrContainer) qrContainer.innerHTML = "";

		if (!isSetupMode) {
			twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
			twofaToggleBtn.textContent = t("disable");
			twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
			twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		}

		selected2FAType = null;

	} catch (err: any) {
		console.error("2FA verification error:", err);
		alert(err.message);
	}
});





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
						if (parsed && typeof parsed.id === 'number') idToSend = parsed.id;
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
				alert(t("logout_success"));
				localStorage.removeItem('user');
				sessionStorage.removeItem("twoFAtoken");
				selected2FAType = null;
				twofaForm.classList.add("hidden");
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
					alert("Logout: user not found on server — local session cleared.");
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

async function fetchFriendsList(userId: number) {
	try {
		const res = await fetch(`/friend/${userId}`, { credentials: "include" });
		if (!res.ok) throw new Error("Failed to fetch friends");
		const data = await res.json();
		return data;
	} catch (err) {
		console.error(err);
		return [];
	}
}

addFriendBtn.addEventListener("click", async () => {
	const friendUsername = prompt("Enter the username of the friend to add:");
	if (!friendUsername) return;

	try {
		const resUser = await fetch(`/user/by-username/${friendUsername}`, { credentials: "include" });
		if (!resUser.ok) 
			throw new Error("User not found");
		const userData = await resUser.json();

		const payload = { userId: storedUserId!, friendId: userData.id };
		const res = await fetch("/friend", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(payload),
		});

		if (!res.ok) 
			throw new Error("Failed to add friend");
		alert("Friend added successfully!");
	} catch (err: any) {
		alert(err.message);
	}
});

yourFriendsBtn.addEventListener("click", async () => {
	const friends = await fetchFriendsList(storedUserId!);
	alert("Your friends: " + friends.map((f: any) => f.username).join(", "));
});

pendingFriendsBtn.addEventListener("click", async () => {
	try {
		const res = await fetch(`/friend-request/received/${storedUserId}`, { credentials: "include" });
		if (!res.ok) 
			throw new Error("Failed to fetch pending friends");
		const requests = await res.json();
		alert("Pending requests: " + requests.map((r: any) => r.sendBy.username).join(", "));
	} catch (err: any) {
		alert(err.message);
	}
});

const friendsMenuList = document.createElement("div");
friendsMenuList.id = "friends-list";
friends_menu!.appendChild(friendsMenuList);

function renderFriends(friends: any[]) {
	friendsMenuList.innerHTML = "";
	friends.forEach(f => {
		const div = document.createElement("div");
		div.textContent = `${f.username} (${f.status})`;
		friendsMenuList.appendChild(div);
	});
}

yourFriendsBtn.addEventListener("click", async () => {
	const friends = await fetchFriendsList(storedUserId!);
	renderFriends(friends);
});


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
const OK_button = document.getElementById("OK-button")! as HTMLDivElement;
const play_button = document.getElementById("play-button") as HTMLButtonElement;
const ready_text = document.getElementById("ready-text")!;
const go_text = document.getElementById("go-text")!;

const players_area = document.getElementById("players-area")! as HTMLDivElement | null;
const score_left = document.getElementById("score-left")! as HTMLDivElement | null;
const score_right = document.getElementById("score-right")! as HTMLDivElement | null;
const playerName_container = document.getElementById("playerName-container")! as HTMLDivElement;
const playerName_input = document.getElementById("playerName-input")! as HTMLInputElement;
const playerColors = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
const playersList = document.getElementById("players-list")! as HTMLDivElement;
const finalList = document.getElementById("final-list")! as HTMLDivElement;
const winnerName = document.getElementById("winner-name")! as HTMLDivElement;
const crownImage = document.getElementById("crown-image")! as HTMLImageElement;

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
	onScore: ((playerSide: 'left' | 'right') => void) | null = null; // callback


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
	play_button.classList.add("hidden");
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

play_button.addEventListener("click", () => {
	startMatch();
});

document.addEventListener("keydown", (event: KeyboardEvent) => {
	if (event.key === "Enter" && !play_button.classList.contains("hidden")) {
		startMatch();
	}
});


function startMatch() {
	play_button?.classList.add("hidden");

	ready_text.classList.remove("hidden");

	setTimeout(() => {
		ready_text.classList.add("hidden");
		go_text.classList.remove("hidden");

		setTimeout(() => {
			go_text.classList.add("hidden");
			ball.classList.remove("hidden");
			paddle_left.classList.remove("hidden");
			paddle_right.classList.remove("hidden");
			
			gameBall.active = true;
			gameBall.serve();
		}, 1000);
	}, 1000);
}

//Set true or False wether a key is press among the "keys" listtwofaForm
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

function resetGameMenu() {
	if (score_left) score_left.textContent = "0";
	if (score_right) score_right.textContent = "0";

	if (players_area) players_area.classList.add("hidden");
	playersList.innerHTML = "";
	playerNames = [];
	nameEntered = 0;
	isTournament = false;
	playerNbr = 2;
	maxPlayer = 2;
	aiNbr = 0;

	pong_button.classList.remove("hidden");
	qmatch_button.classList.add("hidden");
	tournament_button.classList.add("hidden");
}

class Game {
	players: Player[] = [];
	winner: Player | null = null;
	pointsToWin = 5;
	isQuickMatch = false;

	constructor(playersName: [string, boolean][]) {
		this.players = playersName.map(([playerName, isAi], playerNbr) => new Player(playerName, isAi, playerNbr));

		this.isQuickMatch = !isTournament;

		gameBall.onScore = (playerSide: 'left' | 'right') => {
			this.addPoint(playerSide);
		};

		if (playersName.length > 2) {
			// Hide tournament tree during matches
			finalList.classList.add("hidden");
			winnerName.classList.add("hidden");
			crownImage.classList.add("hidden");
			
			// Call async tournament without await in constructor
			this.createTournament();
		} else {
			play_button.classList.remove("hidden");
		}
	}

	public addPoint(playerSide: 'left' | 'right') {
		const pointIndex = playerSide === 'left' ? 0 : 1;
		if (this.players[pointIndex]) {
			this.players[pointIndex].point++;
			
			// Update score display
			if (playerSide === 'left' && score_left) {
				score_left.textContent = this.players[pointIndex].point.toString();
			} else if (playerSide === 'right' && score_right) {
				score_right.textContent = this.players[pointIndex].point.toString();
			}

			console.log(`${this.players[pointIndex].name} scores! Points: ${this.players[pointIndex].point}`);

			// Check if player reached 10 points (quick match only)
			if (this.isQuickMatch && this.players[pointIndex].point >= this.pointsToWin) {
				this.endGame(this.players[pointIndex]);
			} else {
				// Reset ball for next point
				gameBall.reset();
				ball.classList.add("hidden");
				play_button.classList.remove("hidden");
			}
		}
	}

	private endGame(winner: Player) {
		this.winner = winner;
		console.log(`${winner.name} wins the match!`);
		gameBall.active = false;
		ball.classList.add("hidden");
		paddle_left.classList.add("hidden");
		paddle_right.classList.add("hidden");
		play_button.classList.add("hidden");

		alert(`${winner.name} wins with ${winner.point} points!`);

		// Reset everything and go back to menu
		setTimeout(() => {
			resetGameMenu();
		}, 1000);
	}


	// public createTournament() {
	// 	const shuffled: Player[] = shuffleArray(this.players);
	// 	playersList.innerHTML = "";
	// 	shuffled.forEach(({ name, playerNbr, isAi }) => {
	// 		addPlayerNameLabel(name, playerNbr, isAi);
	// 	});
	// 	showTournamentMatch();
	// }
	public async createTournament() {
		let bracket: Player[] = shuffleArray(this.players.slice());

		playersList.innerHTML = "";
		finalList.innerHTML = "";
		winnerName.innerHTML = "";
		crownImage.classList.add("hidden");

		const showPair = (a: Player, b: Player) => {
			playersList.innerHTML = "";
			addPlayerNameLabel(a.name, a.playerNbr, a.isAi);
			addPlayerNameLabel(b.name, b.playerNbr, b.isAi);
			if (players_area) players_area.classList.remove("hidden");
		};

		const runMatch = (left: Player, right: Player): Promise<Player> => {
			return new Promise((resolve) => {
				let leftScore = 0;
				let rightScore = 0;

				const updateScores = () => {
					if (score_left) score_left.textContent = String(leftScore);
					if (score_right) score_right.textContent = String(rightScore);
				};
				updateScores();

				paddle_left.classList.remove("hidden");
				paddle_right.classList.remove("hidden");
				ball.classList.add("hidden");

				// Show play button for user to start
				play_button.classList.remove("hidden");

				// Define handler BEFORE user starts
				const handler = (side: 'left' | 'right') => {
					if (side === 'left') leftScore++;
					else rightScore++;

					updateScores();

					if (leftScore >= this.pointsToWin || rightScore >= this.pointsToWin) {
						gameBall.onScore = null;
						gameBall.active = false;
						ball.classList.add("hidden");
						paddle_left.classList.add("hidden");
						paddle_right.classList.add("hidden");
						play_button.classList.add("hidden");

						const winner = leftScore > rightScore ? left : right;
						setTimeout(() => resolve(winner), 300);
						return;
					}

					gameBall.reset();
					ball.classList.add("hidden");
					play_button.classList.remove("hidden");
				};

				gameBall.onScore = handler;

				// One-time listener for play button click to start countdown
				const startMatchListener = () => {
					play_button.removeEventListener("click", startMatchListener);
					play_button.classList.add("hidden");

					ready_text.classList.remove("hidden");
					setTimeout(() => {
						ready_text.classList.add("hidden");
						go_text.classList.remove("hidden");
						setTimeout(() => {
							go_text.classList.add("hidden");
							ball.classList.remove("hidden");
							gameBall.reset();
							gameBall.serve();
						}, 800);
					}, 800);
				};

				play_button.addEventListener("click", startMatchListener);
			});
		};

		let round = 1;
		while (bracket.length > 1) {
			const nextRound: Player[] = [];
			for (let i = 0; i < bracket.length; i += 2) {
				const p1 = bracket[i];
				const p2 = bracket[i + 1];

				showPair(p1, p2);

				const winner = await runMatch(p1, p2);

				nextRound.push(winner);

				const label = document.createElement("div");
				label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
				label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Round ${round} winner</span><br>${winner.name}`;
				finalList.appendChild(label);
				finalList.classList.remove("hidden");

				await new Promise(r => setTimeout(r, 400));
			}

			bracket = nextRound;
			round++;
			playersList.innerHTML = "";
		}

		const champion = bracket[0];
		if (champion) {
			winnerName.innerHTML = "";
			const label = document.createElement("div");
			label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
			label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Champion</span><br>${champion.name}`;
			winnerName.appendChild(label);
			winnerName.classList.remove("hidden");
			crownImage.classList.remove("hidden");
			alert(`${champion.name} remporte le tournoi !`);
		}

		if (players_area) players_area.classList.add("hidden");
		if (score_left) score_left.textContent = "0";
		if (score_right) score_right.textContent = "0";
		gameBall.onScore = null;

		// After tournament ends, return to menu
		setTimeout(() => {
			resetGameMenu();
		}, 1000);
	}


	public createQuickMatch() {
		play_button.classList.remove("hidden");
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
	if (players_area) {
		players_area.classList.remove("hidden");
	} else {
		console.warn("players-area element not found in DOM");
	}

	if (playerNbr > 0) {
		enterPlayerName();
	} else {
		addAiNameLabel();
		const game = new Game(playerNames);
	}
});

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

			// Reset scores display
			if (score_left) score_left.textContent = "0";
			if (score_right) score_right.textContent = "0";

			addAiNameLabel();
			const game = new Game(playerNames);
		}
	}
})

function addPlayerNameLabel(name: string, index: number, isAi: boolean) {
	const label = document.createElement("div");

	const colorClass = playerColors[index];
	label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
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

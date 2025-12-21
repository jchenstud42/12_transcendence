import { setSelected2FAType, showTwoFAForm } from "../2FA_Front/2FA_Auth.js";


/**
 * - On initialise le state UI avec les elements passes en parametre dans initUIState
 *
 * bises
 */
type UIElements = {
	register_button?: HTMLElement | null;
	login_button?: HTMLElement | null;
	registerContainer?: HTMLElement | null;
	loginContainer?: HTMLElement | null;
	profile_button?: HTMLElement | null;
	logout_button?: HTMLElement | null;
	twofaForm?: HTMLFormElement | null;
	twofaTypeMenu?: HTMLElement | null;
};

/**
 * - On initialise le state UI avec les functions passes en parametre dans initUIState
 *
 * xxx <3
 */
type UICallbacks = {
	storeToken: (token: string) => void;
	storeUser: (user: any) => void;
};

let elems: UIElements | null = null;
let funcs: UICallbacks | null = null;
let storedUserId: number | null = null;


/**
 * - La on recup les elements et fonctions pour gerer l'UI
 *
 * bisous
 */
export function initUIState(elements: UIElements, callbacks: UICallbacks) {
	elems = elements;
	funcs = callbacks;
}

/**
 * - On s'assure que ce soit bien initialise avant de les utiliser
 *
 * bisous bisous
 */
function ensureInit() {
	if (!elems || !funcs) {
		throw new Error("UI_State not initialized");
	}
}

/*
 - On reset l'UI 2FA (Cache le form et le menu de type, vide le QR code, supprime le mode stup)

  kisses
*/
export function reset2FAUIState() {
	ensureInit();
	if (elems!.twofaForm)
		elems!.twofaForm.classList.add("hidden");
	if (elems!.twofaTypeMenu)
		elems!.twofaTypeMenu.classList.add("hidden");

	const qrContainer = document.getElementById("qr-container");
	if (qrContainer) qrContainer.innerHTML = "";

	sessionStorage.removeItem("2fa-setup-mode");
}

/**
 *
 * - On met l'UI en etat connecte avec les bonnes infos de l'user
 * - On commence par cacher les boutons register/login car deja connecte
 * - On met a jour le menu profile avec les infos de l'user
 * - On affiche le bouton logout
 * - Si besoin on cacher aussi les containers (forms) register/login

  luv
 */
export function applyLoggedInState(user: { id: number; username: string; email: string; }) {
	ensureInit();
	reset2FAUIState();

	try {
		(elems!.register_button as HTMLElement)?.classList.add('hidden');
		(elems!.login_button as HTMLElement)?.classList.add('hidden');
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
		if (elems!.registerContainer)
			elems!.registerContainer.classList.add('hidden');
		if (elems!.loginContainer)
			elems!.loginContainer.classList.add('hidden');
	} catch (e) { }

	const logoutBtn = document.getElementById('logout-button');
	if (logoutBtn) logoutBtn.classList.remove('hidden');
}


/**
 * - Pareil mais en mode logout
 * - On affiche les boutons register/login
 * - On cache le bouton profile et logout
 * - On reset le storedUserId
 *
 * xoxo les coco
 */
export function applyLoggedOutState() {
	try {
		(elems!.register_button as HTMLElement)?.classList.remove('hidden');
		(elems!.login_button as HTMLElement)?.classList.remove('hidden');
	} catch (e) { }

	const profileBtn = document.getElementById('profile-button');
	if (profileBtn) profileBtn.classList.add('hidden');

	const logoutBtn = document.getElementById('logout-button');
	if (logoutBtn) logoutBtn.classList.add('hidden');

	storedUserId = null;
}

/**
 *
 * - On commence par check si il y a un accessToken dans l'url (apres OAuth)
 * - Si oui on le stocke et on nettoie l'url car moche pas beau
 * - Ensuite on check si il un token 2FA dans les params d'url (apres redirect 2FA)
 * - SI oui on le stock dans sessionStorage, on decode le userId du token et on affiche le form 2FA
 * - Quand pas de 2FA on fetch /user/me pour verifier si token valide et recuperer l'user
 * - Si pas bon on logout
 * - Si bon on stock token et user, puis on check si 2FA est active pour afficher le form si besoin
 * - Ou on met a jour le storedUserId et on met l'UI en etat connecte
 *
 * hugs
 */
export async function initAuthState() {
	try {
		if (window.location.hash.startsWith("#accessToken=")) {
			const accessToken = window.location.hash.split("=")[1];
			funcs!.storeToken(accessToken);

			window.history.replaceState(null, "", window.location.pathname + window.location.search);
		}

		const urlParams = new URLSearchParams(window.location.search);
		const twoFAToken = urlParams.get("twoFAtoken");
		const method = urlParams.get("method");

		if (twoFAToken) {
			sessionStorage.setItem("twoFAtoken", twoFAToken);

			const payload = JSON.parse(atob(twoFAToken.split(".")[1]));
			storedUserId = payload.userId;

			setSelected2FAType(method as any);
			showTwoFAForm(method as any);

			window.history.replaceState({}, "", window.location.pathname);
			return;
		}


		const res = await fetch("/user/me", { credentials: "include" });

		if (!res.ok) {
			applyLoggedOutState();
			return;
		}

		const data = await res.json();
		funcs!.storeToken(data.accessToken);
		funcs!.storeUser(data.user);

		if (data.user?.is2FAEnabled && !sessionStorage.getItem("twoFAtoken")) {
			storedUserId = data.user.id;
			console.log("User id in InitAuthState:", storedUserId);
			setSelected2FAType(data.user.twoFAMethod as any);
			showTwoFAForm(data.user.twoFAMethod as any);
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

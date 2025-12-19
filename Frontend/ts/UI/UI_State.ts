import { setSelected2FAType, showTwoFAForm } from "../2FA_Front/2FA_Auth.js";

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

type UICallbacks = {
	storeToken: (token: string) => void;
	storeUser: (user: any) => void;
};

let elems: UIElements | null = null;
let funcs: UICallbacks | null = null;
let storedUserId: number | null = null;

export function initUIState(elements: UIElements, callbacks: UICallbacks) {
	elems = elements;
	funcs = callbacks;
}


function ensureInit() {
	if (!elems || !funcs) {
		throw new Error("UI_State not initialized");
	}
}


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

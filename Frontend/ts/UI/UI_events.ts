import { toggleMenu } from "./UI_helpers.js";
import { initLanguage, setLanguage } from "../traduction/i18n.js";
import { storeUser } from "../utils/utils.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../utils/inputValidFront.js";

type UIEventElements = {
	register_button?: HTMLElement | null;
	login_button?: HTMLElement | null;
	profile_button?: HTMLElement | null;
	edit_button?: HTMLElement | null;
	friends_button?: HTMLElement | null;
	history_button?: HTMLElement | null;
	language_button?: HTMLElement | null;

	registerContainer?: HTMLElement | null;
	loginContainer?: HTMLElement | null;
	profile_menu?: HTMLElement | null;
	edit_menu?: HTMLElement | null;
	friends_menu?: HTMLElement | null;
	history_menu?: HTMLElement | null;
	twoFA_menu?: HTMLElement | null;
	twofaTypeMenu?: HTMLElement | null;
	language_menu?: HTMLElement | null;
};

export function initUIEvents(elems: UIEventElements) {

	elems.register_button?.addEventListener("click", () =>
		toggleMenu(elems.registerContainer, elems.loginContainer, elems.language_menu)
	);

	elems.login_button?.addEventListener("click", () =>
		toggleMenu(elems.loginContainer, elems.registerContainer, elems.language_menu)
	);

	elems.profile_button?.addEventListener("click", () =>
		toggleMenu(elems.profile_menu, elems.language_menu)
	);

	elems.edit_button?.addEventListener("click", () =>
		toggleMenu(
			elems.edit_menu,
			elems.twoFA_menu,
			elems.friends_menu,
			elems.history_menu,
			elems.twofaTypeMenu,
			elems.language_menu
		)
	);

	elems.friends_button?.addEventListener("click", () =>
		toggleMenu(
			elems.friends_menu,
			elems.twoFA_menu,
			elems.edit_menu,
			elems.history_menu,
			elems.twofaTypeMenu,
			elems.language_menu
		)
	);

	elems.history_button?.addEventListener("click", () =>
		toggleMenu(
			elems.history_menu,
			elems.twoFA_menu,
			elems.friends_menu,
			elems.edit_menu,
			elems.twofaTypeMenu,
			elems.language_menu
		)
	);

	if (elems.language_button && elems.language_menu) {
		elems.language_button.addEventListener("click", () =>
			toggleMenu(
				elems.language_menu,
				elems.registerContainer,
				elems.loginContainer,
				elems.profile_menu
			)
		);

		initLanguage();

		elems.language_menu.querySelector(".en")?.addEventListener("click", () => setLanguage("en"));
		elems.language_menu.querySelector(".fr")?.addEventListener("click", () => setLanguage("fr"));
		elems.language_menu.querySelector(".es")?.addEventListener("click", () => setLanguage("es"));
	}
}

export function initProfileAndLanguage(profileElems: {
	saveProfileBtn: HTMLElement;
	usernameInput: HTMLInputElement;
	emailInput: HTMLInputElement;
	avatarInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	confirmPasswordInput: HTMLInputElement;
	menuUsername: HTMLElement;
	menuEmail: HTMLElement;
	profileAvatar: HTMLImageElement;
}, languageElems: {
	language_button: HTMLElement;
	language_menu: HTMLElement;
}, currentUserId: number | null) {
	const { saveProfileBtn, usernameInput, emailInput, avatarInput, passwordInput, confirmPasswordInput, menuUsername, menuEmail, profileAvatar } = profileElems;
	const { language_button, language_menu } = languageElems;



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
		let userId = currentUserId;

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

	initLanguage();

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
		if (!(e.target instanceof Node)) return;
		if (!language_button.contains(e.target) && !language_menu.contains(e.target)) {
			language_menu.classList.remove("show");
		}
	});
}

import { toggleMenu } from "./UI_helpers.js";
import { initLanguage, setLanguage } from "../traduction/i18n.js";
import { storeUser, getServerErrorMessage } from "../utils/utils.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../utils/inputValidFront.js";
import { t } from "../traduction/i18n.js";


/*
  - Les elements html qu'on recupere dans le front/via les params de la function init (main.ts) pour init les events (fonction en dessous)
  - C'est utilise pour gerer les clicks et cacher/afficher les menus

  bisous baveux
*/
type UIEventElements = {
	register_button?: HTMLElement | null;
	start_button?: HTMLElement | null;
	login_button?: HTMLElement | null;
	profile_button?: HTMLElement | null;
	edit_button?: HTMLElement | null;
	friends_button?: HTMLElement | null;
	history_button?: HTMLElement | null;
	language_button?: HTMLElement | null;
	back_button?: HTMLElement | null;

	registerContainer?: HTMLElement | null;
	loginContainer?: HTMLElement | null;
	profile_menu?: HTMLElement | null;
	edit_menu?: HTMLElement | null;
	friends_menu?: HTMLElement | null;
	pong_menu?: HTMLElement | null;
	history_menu?: HTMLElement | null;
	twoFA_menu?: HTMLElement | null;
	twofaTypeMenu?: HTMLElement | null;
	language_menu?: HTMLElement | null;
};


/*
  - On initialise les events pour les differents boutons et menu (on ecoute pour savoir quand l'user clique dessus on affiche le menu et cache les autres)
  - On initialise aussi le menu de langue et on set les events pour changer de langue

  langue hehe
 */
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


	elems.back_button?.addEventListener("click", () =>
		elems.pong_menu?.classList.add("hidden")
	);

	elems.start_button?.addEventListener("click", () =>
		elems.pong_menu?.classList.remove("hidden")
	);

	elems.start_button?.addEventListener("click", () =>
		toggleMenu(
			elems.edit_menu,
			elems.twoFA_menu,
			elems.friends_menu,
			elems.history_menu,
			elems.twofaTypeMenu,
			elems.language_menu,
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
		),
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


/*
  - Meme chose on initialise les events pour le profil et le menu de langue
  - Ensuite on gere les inputs du profil pour sauvegarder les modifs
  - On sanitize et on valide les inputs avant d'envoyer la requete au back
  - On recupere le userId soit via le param ou via le localstorage si null
  - On envoie la requete PATCH au back pour update le profil
  - On met a jour le localstorage et l'UI si reussi

  love you <3
*/
export function initProfile(profileElems: {
	saveProfileBtn: HTMLElement;
	usernameInput: HTMLInputElement;
	emailInput: HTMLInputElement;
	avatarInput: HTMLInputElement;
	passwordInput: HTMLInputElement;
	confirmPasswordInput: HTMLInputElement;
	menuUsername: HTMLElement;
	menuEmail: HTMLElement;
	profileAvatar: HTMLImageElement;
}, currentUserId: number | null) {
	const { saveProfileBtn } = profileElems;



	saveProfileBtn.addEventListener("click", async () => {

		const username = (document.getElementById("edit-username") as HTMLInputElement).value.trim();
		const email = (document.getElementById("edit-email") as HTMLInputElement).value.trim();
		const avatar = (document.getElementById("edit-avatar") as HTMLInputElement).value.trim();
		const password = (document.getElementById("edit-password") as HTMLInputElement).value;
		const confirmPass = (document.getElementById("edit-password-confirm") as HTMLInputElement).value;

		const errors: string[] = [];

		if (username && !validateTextInput(username, 20))
			errors.push(t("invalid_username"));

		if (email && !validateEmail(email))
			errors.push(t("invalid_email"));

		if (password && !validatePassword(password))
			errors.push(t("invalid_password_format"));

		if (password !== confirmPass)
			errors.push(t("passwords_do_not_match"));

		if (errors.length > 0) {
			alert(t("errors_prefix") + "\n" + errors.join("\n"));
			return;
		}

		const payload: Record<string, any> = {};
		if (username)
			payload.username = sanitizeInput(username);
		if (email)
			payload.email = sanitizeInput(email);
		if (avatar)
			payload.avatar = sanitizeInput(avatar);
		if (password)
			payload.password = password;

		const token = localStorage.getItem("accessToken");
		let userId = currentUserId;

		if (!userId) {
			try {
				const user = JSON.parse(localStorage.getItem('user') || '{}');
				userId = user.id;
			} catch (e) {
				alert(t("missing_user_id"));
				return;
			}
		}
		try {
			const res = await fetch(`/user/profile/${userId}`, {
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
				alert(getServerErrorMessage(data.error));
				return;
			}

			storeUser(data.user);

			const menuUsername = document.getElementById("menu-username");
			const menuEmail = document.getElementById("menu-email");
			const profileAvatar = document.getElementById("profile-avatar") as HTMLImageElement;

			if (data.user.username)
				menuUsername!.textContent = data.user.username;
			if (data.user.email)
				menuEmail!.textContent = data.user.email;
			if (data.user.avatar)
				profileAvatar.src = data.user.avatar;

			alert(t("profile_updated"));

		} catch (err) {
			console.error(err);
			alert(t("network_error"));
		}
	});
}

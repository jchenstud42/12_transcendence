import { TranslationKey } from "../traduction/traduction.js";
import { toggleMenu } from "../UI/UI_helpers.js";


/*
	- Les elements html passes a l'initialisation de la 2fa, dans les params de la fonction dans le front (main.ts)
	- On les recupere pour gerer la 2FA dans le front

	with love,
*/
type TwoFAElements = {
	twofaForm: HTMLFormElement;
	destinationModal: HTMLElement;
	destinationInput: HTMLInputElement;
	destinationTitle: HTMLElement;
	destinationCancel: HTMLElement;
	destinationConfirm: HTMLElement;
	twofaTypeMenu: HTMLElement;
	twofaStatusText: HTMLElement;
	twofaToggleBtn: HTMLElement;
	btnEmail: HTMLElement;
	btnSMS: HTMLElement;
	btnQR: HTMLElement;
	twoFA_menu?: HTMLElement | null;
	twoFA_profile_button?: HTMLElement | null;
	oauth42Btn?: HTMLElement | null;
};

/*
 - Les fonctions passes a l'initialisation de la 2fa, dans les params de la fonction dans le front (main.ts)
 - On les recupere pour gerer la 2FA dans le front

  bises
 */
type TwoFACallbacks = {
	sanitizeInput: (s: string) => string;
	t: (key: TranslationKey) => string;
	getServerErrorMessage: (err?: string) => string;
	storeToken: (token: string) => void;
	storeUser: (user: any) => void;
	applyLoggedInState?: (user: any) => void;
};

let selected2FAType: "email" | "sms" | "qr" | null = null;
let is2FAEnabled = false;

let elems: TwoFAElements | null = null;
let funcs: TwoFACallbacks | null = null;


/*
 - On check si c'est bien initialise, si non on throw une err

  sihtam , suosib
 */
function ensureInit() {
	if (!elems || !funcs)
		throw new Error("2FA module not initialized. Call init2FA(...) first.");
}

/*
 - Ouvre le modal pour entrer la destination pour la 2fa (email ou sms)
 - On commence par cacher le menu de choix du type 2FA
 - On met a jour le titre et le placeholder selon le type de 2FA choisi
 - On vide l'input et on le focus (focus c'est pour que l'user tape directement sans avoir a cliquer dans l'input zone)

  - Mathou le fifou
*/
function openDestinationModal(type: "email" | "sms") {
	ensureInit();
	selected2FAType = type;
	const { destinationModal, destinationTitle, destinationInput } = elems!;
	const { t } = funcs!;

	destinationModal.classList.remove("hidden");

	if (type === "email") {
		destinationTitle.textContent = t("enter_email_2fa");
		destinationInput.placeholder = "exemple@gmail.com";
		destinationInput.type = "email";
	} else {
		destinationTitle.textContent = t("enter_phone_2fa");
		destinationInput.placeholder = "+33123456789";
		destinationInput.type = "tel";
	}

	destinationInput.value = "";
	destinationInput.focus();
}

/*
  - Activer la 2fa avec la destination entree dans le modal
  - On recupere la destination, on la sanitise (pour les injections XSS)
  - Ensuite on envoie la requete au back pour activer la 2FA avec le bon type et la destination
  - Si ca fonctionne on met a jour l'affichage du status de la 2FA

  Bisous, Mathis
*/
async function handleEnableDestination() {
	ensureInit();
	const { destinationInput, destinationModal, twofaStatusText, twofaToggleBtn, twofaTypeMenu } = elems!;
	const { sanitizeInput, t, getServerErrorMessage } = funcs!;

	const destination = sanitizeInput(destinationInput.value.trim());
	if (!destination) {
		alert(t("no_value_provided"));
		return;
	}

	try {
		const res = await fetch("enable-2fa", {
			method: "POST",
			credentials: "include",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ type: selected2FAType, destination }),
		});

		const text = await res.text();
		const data = text ? JSON.parse(text) : null;

		if (!res.ok) {
			alert("Erreur : " + getServerErrorMessage(data?.error));
			return;
		}

		alert(t("two_fa_enabled_success"));
		twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
		twofaToggleBtn.textContent = t("disable");
		twofaTypeMenu.classList.add("hidden");
		destinationModal.classList.add("hidden");
		is2FAEnabled = true;
	} catch (err: any) {
		console.error("enable destination error:", err);
		alert(t("network_error"));
	}
}


/*
  - Affiche le formulaire pour rentrer le code 2FA
  - On met aussi a jour le type de 2FA selectionne si donne en parametre

  Bisous, Mathis :)
*/
export function showTwoFAForm(method?: "email" | "sms" | "qr" | string | null) {
	ensureInit();
	if (method)
		selected2FAType = method as any;
	elems!.twofaForm.classList.remove("hidden");
}

/*
 - Recupere le type de 2fa que l'user a choisi
 - Si il a pas choisi on return null

  Bises, mathou
*/
export function setSelected2FAType(type: "email" | "sms" | "qr" | null) {
	selected2FAType = type;
}

/*
 - Met a jour le flag pour savoir la 2FA est active

  C'est tt, bisous :)
*/
export function setIs2FAEnabled(flag: boolean) {
	is2FAEnabled = flag;
}

/*
 - On commence par s'assurer que c'est bien initialise (les elems et funcs)
 - Puius on fetch les infos user pour savoir si la 2FA est active ou pas
 - On met a jour l'affichage selon le resultat (texte et bouton, enable/disable)

  xoxo -M
*/
export async function update2FAStatus() {

	ensureInit();

	try {
		const res = await fetch("/user/me", { credentials: "include" });
		if (!res.ok)
			return;

		const data = await res.json();
		const user = data.user;

		if (user?.isTwoFAEnabled || user?.is2FAEnabled) {
			is2FAEnabled = true;
			elems!.twofaStatusText.textContent = `${funcs!.t("two_fa_is_enabled")} (${user.twoFAMethod || "qr"})`;
			elems!.twofaToggleBtn.textContent = funcs!.t("disable");
			elems!.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
			elems!.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
		} else {
			is2FAEnabled = false;
			elems!.twofaStatusText.textContent = funcs!.t("two_fa_is_disabled");
			elems!.twofaToggleBtn.textContent = funcs!.t("enable");
			elems!.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
			elems!.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
		}
	} catch (err) {
		console.error("Failed to fetch 2FA status:", err);
	}
}

/*
 - On commence par stock les elements et fonctions passes en parametre, on s'assure que c'est bin initialise
 - On desactive le bouton toggle 2FA (celui qui permet d'activer/desactiver) le temps de l'initialisation
 - On ajoute les listeners aux differents boutons
 - Pour le bouton QR, on envoie la requete au back pour activer la 2FA en QR, on recup le QR et on l'affiche
 - Pour le bouton toggle 2FA, on gere les differents cas (activer, desactiver, annuler pendant...)
 - On gere aussi le menu 2FA dans le profil pour afficher le status a chaque ouverture (si deja enabled ou pas)
 - On gere le bouton oauth42 pour rediriger vers l'auth 42
 - On gere le form de verification 2FA (envoi du code au back, verification, maj affichage selon le resultat)

  Gros bisous
*/
export function init2FA(elements: TwoFAElements, callbacks: TwoFACallbacks, initial2FAState: boolean) {
	elems = elements;
	funcs = callbacks;
	ensureInit();

	const {
		destinationCancel,
		destinationConfirm,
		btnEmail,
		btnSMS,
		btnQR,
		twofaToggleBtn,
		twoFA_profile_button,
		oauth42Btn,
		twofaTypeMenu,
		twofaForm
	} = elems;

	(twofaToggleBtn as HTMLButtonElement).classList.remove(
		"opacity-50",
		"pointer-events-none"
	);
	(twofaToggleBtn as HTMLButtonElement).disabled = false;


	if (destinationCancel)
		destinationCancel.addEventListener("click", () => elems!.destinationModal.classList.add("hidden"));

	if (destinationConfirm)
		destinationConfirm.addEventListener("click", () => void handleEnableDestination());

	if (btnEmail)
		btnEmail.addEventListener("click", () => {
			twofaTypeMenu.classList.add("hidden");
			openDestinationModal("email");
		});

	if (btnSMS)
		btnSMS.addEventListener("click", () => {
			twofaTypeMenu.classList.add("hidden");
			openDestinationModal("sms");
		});

	if (btnQR)
		btnQR.addEventListener("click", async () => {
			selected2FAType = "qr";
			twofaTypeMenu.classList.add("hidden");
			elems!.twofaStatusText.textContent = funcs!.t("two_fa_setup_in_progress");
			elems!.twofaToggleBtn.textContent = funcs!.t("cancel");

			alert("Make sure to scan the QR code with your Google Authenticator app before refreshing or navigating away from this page.");

			try {
				const res = await fetch("/enable-2fa", {
					method: "POST",
					credentials: "include",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ type: "qr" })
				});

				if (!res.ok)
					throw new Error("Failed to enable 2FA");

				const data = await res.json();
				if (!data.qrCode)
					throw new Error("Server did not return QR code");

				sessionStorage.setItem("2fa-setup-mode", "true");

				const qrContainer = document.getElementById("qr-container")!;
				qrContainer.innerHTML = `<img src="${data.qrCode}" alt="Scan QR Code" />`;

				twofaForm.classList.remove("hidden");
				elems!.twofaStatusText.textContent = "Scannez le QR code et entrez le code généré...";
			} catch (err: any) {
				console.error("QR enable error:", err);
				alert(err.message || funcs!.t("network_error"));
				is2FAEnabled = false;
				selected2FAType = null;
				elems!.twofaToggleBtn.textContent = funcs!.t("enable");
			}
		});

	if (twofaToggleBtn)
		twofaToggleBtn.addEventListener("click", async () => {
			const isInSetupMode = !elems!.twofaTypeMenu.classList.contains("hidden");

			if (isInSetupMode && !is2FAEnabled) {
				elems!.twofaStatusText.textContent = funcs!.t("two_fa_is_disabled");
				elems!.twofaToggleBtn.textContent = funcs!.t("enable");
				elems!.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
				elems!.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
				elems!.twofaTypeMenu.classList.add("hidden");
				elems!.twofaForm.classList.add("hidden");

				const qrContainer = document.getElementById("qr-container");
				if (qrContainer)
					qrContainer.innerHTML = "";

				sessionStorage.removeItem("2fa-setup-mode");
				return;
			}

			if (!is2FAEnabled) {
				elems!.twofaStatusText.textContent = funcs!.t("two_fa_setup_in_progress");
				elems!.twofaToggleBtn.textContent = funcs!.t("cancel");
				elems!.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
				elems!.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
				elems!.twofaTypeMenu.classList.remove("hidden");
			} else {
				try {
					const res = await fetch("/disable-2fa", {
						method: "POST",
						credentials: "include"
					});

					if (res.ok) {
						is2FAEnabled = false;
						elems!.twofaStatusText.textContent = funcs!.t("two_fa_is_disabled");
						elems!.twofaToggleBtn.textContent = funcs!.t("enable");
						elems!.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
						elems!.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
						elems!.twofaTypeMenu.classList.add("hidden");
						alert("2FA disabled successfully!");
					}
				} catch (err) {
					console.error("Error disabling 2FA:", err);
				}
			}
		});

	if (twoFA_profile_button) {
		twoFA_profile_button.addEventListener("click", async () => {
			if (!elems!.twoFA_menu)
				return;

			const isHidden = elems!.twoFA_menu.classList.contains("hidden");

			if (isHidden) {
				toggleMenu(
					elems!.twoFA_menu,
					document.getElementById("edit-profile-menu"),
					document.getElementById("friends-menu"),
					document.getElementById("history-menu"),
					document.getElementById("language-menu"),
					elems!.twofaTypeMenu,
				);
				await update2FAStatus();
			} else {
				elems!.twoFA_menu.classList.add("hidden");
			}
		});
	}


	if (oauth42Btn) {
		oauth42Btn.addEventListener("click", () => {
			window.location.href = "/oauth/42";
		});
	}

	if (elems!.twofaForm) {
		elems!.twofaForm.addEventListener("submit", async (e) => {
			e.preventDefault();
			const codeInput = document.getElementById("twofa-code") as HTMLInputElement;
			const code = codeInput.value.trim();

			if (!code)
				return alert("Enter the 2FA code");
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
				if (!res.ok)
					throw new Error(data.error || "Erreur lors de la vérification 2FA");

				sessionStorage.removeItem("2fa-setup-mode");
				sessionStorage.removeItem("twoFAtoken");

				if (isSetupMode) {
					alert("2FA enabled successfully!");
					is2FAEnabled = true;
					elems!.twofaStatusText.textContent = `${funcs!.t("two_fa_is_enabled")} (${selected2FAType})`;
					elems!.twofaToggleBtn.textContent = funcs!.t("disable");
					elems!.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
					elems!.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
				} else {
					funcs!.storeToken(data.accessToken);
					if (data.user) funcs!.storeUser(data.user);
					if (funcs!.applyLoggedInState) funcs!.applyLoggedInState(data.user);
					alert("Login successful with 2FA!");
				}

				elems!.twofaForm.reset();
				elems!.twofaForm.classList.add("hidden");
				elems!.twofaTypeMenu.classList.add("hidden");

				const qrContainer = document.getElementById("qr-container");
				if (qrContainer) qrContainer.innerHTML = "";

				if (!isSetupMode) {
					elems!.twofaStatusText.textContent = `${funcs!.t("two_fa_is_enabled")} (${selected2FAType})`;
					elems!.twofaToggleBtn.textContent = funcs!.t("disable");
				}

				selected2FAType = null;
			} catch (err: any) {
				console.error("2FA verification error:", err);
				alert(err.message);
			}
		});
	}
}

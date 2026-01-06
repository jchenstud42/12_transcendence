import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { initLanguage, setLanguage, t } from "./i18n.js";
import { initMenuEvents } from "./Pong/menu.js";
const page = document.getElementById("page");
// CA C LE DIV DANS LE HTML
const registerContainer = document.getElementById("register-form");
const loginContainer = document.getElementById("login-form");
// CA C LE <FORM> DANS LE HTML, FAITES LA DIFFERENCE A CHAQUE FOIS MERCI
const register_form = document.getElementById("register_form");
const login_form = document.getElementById("login_form");
const register_button = document.getElementById("register-button");
const login_button = document.getElementById("login-button");
const oauth42Btn = document.getElementById("oauth-42-button");
// 2FA Elements
const twofaForm = document.getElementById("twofa-form");
const destinationModal = document.getElementById("destination-modal");
const destinationInput = document.getElementById("destination-input");
const destinationTitle = document.getElementById("destination-title");
const destinationCancel = document.getElementById("destination-cancel");
const destinationConfirm = document.getElementById("destination-confirm");
let storedUserId = null;
//Profile
const profile_menu = document.getElementById("profile-menu");
const edit_menu = document.getElementById("edit-profile-menu");
const friends_menu = document.getElementById("friends-menu");
const history_menu = document.getElementById("history-menu");
const profile_button = document.getElementById("profile-button");
const edit_button = document.getElementById("edit-profile-button");
const friends_button = document.getElementById("friends-button");
const history_button = document.getElementById("history-button");
// const add_friend_button = document.getElementById("btn-add-friend")!;
// const your_friends_button = document.getElementById("btn-your-friends")!;
const language_button = document.getElementById("language-button");
const language_menu = document.getElementById("language-menu");
const twoFA_menu = document.getElementById("2fa-menu");
const twoFA_profile_button = document.getElementById("2FA-button");
const twofaToggleBtn = document.getElementById("2fa-toggle-btn");
const twofaStatusText = document.getElementById("2fa-status-text");
const twofaTypeMenu = document.getElementById("2fa-type-menu");
const btnEmail = document.getElementById("2fa-email");
const btnSMS = document.getElementById("2fa-sms");
const btnQR = document.getElementById("2fa-qr");
const addFriendBtn = document.getElementById("btn-add-friend");
const yourFriendsBtn = document.getElementById("btn-your-friends");
const pendingFriendsBtn = document.getElementById("btn-pending-friends");
let selected2FAType = null;
let is2FAEnabled = false;
const serverErrorTranslations = {
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
function getServerErrorMessage(error) {
    if (!error)
        return t("network_error");
    const key = serverErrorTranslations[error];
    return (key ? t(key) : error);
}
//affichage des formulaires lorsque l'on clique sur un des boutons avec synchronisation pour cacher l'autre formulaire si il etait deja affiche
//et cacher le formulaire si on reclique sur le boutton a nouveau
if (oauth42Btn) {
    oauth42Btn.addEventListener("click", () => {
        window.location.href = "/oauth/42";
    });
}
function openDestinationModal(type) {
    selected2FAType = type;
    destinationModal.classList.remove("hidden");
    if (type === "email") {
        destinationTitle.textContent = t("enter_email_2fa");
        destinationInput.placeholder = "exemple@gmail.com";
        destinationInput.type = "email";
    }
    else if (type === "sms") {
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
    let data = null;
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
function storeToken(accessToken) {
    localStorage.setItem("accessToken", accessToken);
}
function storeUser(user) {
    try {
        localStorage.setItem('user', JSON.stringify(user));
    }
    catch (e) {
        console.warn('Failed to store user', e);
    }
}
function reset2FAUIState() {
    if (twofaForm)
        twofaForm.classList.add("hidden");
    if (twofaTypeMenu)
        twofaTypeMenu.classList.add("hidden");
    const qrContainer = document.getElementById("qr-container");
    if (qrContainer)
        qrContainer.innerHTML = "";
    sessionStorage.removeItem("2fa-setup-mode");
}
function applyLoggedInState(user) {
    reset2FAUIState();
    try {
        register_button.classList.add('hidden');
        login_button.classList.add('hidden');
    }
    catch (e) { }
    const menuUsername = document.getElementById('menu-username');
    const menuEmail = document.getElementById('menu-email');
    const profileAvatar = document.getElementById('profile-avatar');
    if (menuUsername)
        menuUsername.textContent = user.username || '';
    if (menuEmail)
        menuEmail.textContent = user.email || '';
    if (profileAvatar) {
        profileAvatar.src = profileAvatar.src || '../assets/default-avatar.png';
    }
    const profileBtn = document.getElementById('profile-button');
    if (profileBtn)
        profileBtn.classList.remove('hidden');
    try {
        if (registerContainer)
            registerContainer.classList.add('hidden');
        if (loginContainer)
            loginContainer.classList.add('hidden');
    }
    catch (e) { }
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn)
        logoutBtn.classList.remove('hidden');
}
function applyLoggedOutState() {
    try {
        register_button.classList.remove('hidden');
        login_button.classList.remove('hidden');
    }
    catch (e) { }
    const profileBtn = document.getElementById('profile-button');
    if (profileBtn)
        profileBtn.classList.add('hidden');
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn)
        logoutBtn.classList.add('hidden');
    storedUserId = null;
}
async function initAuthState() {
    var _a;
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
            selected2FAType = method;
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
        if (((_a = data.user) === null || _a === void 0 ? void 0 : _a.is2FAEnabled) && !sessionStorage.getItem("twoFAtoken")) {
            storedUserId = data.user.id;
            console.log("User id in InitAuthState:", storedUserId);
            selected2FAType = data.user.twoFAMethod;
            twofaForm.classList.remove("hidden");
            return;
        }
        storedUserId = data.user.id;
        console.log("User id in InitAuthState before applyLoggedIn:", storedUserId);
        applyLoggedInState(data.user);
    }
    catch (err) {
        console.error("initAuthState error:", err);
        applyLoggedOutState();
    }
}
initAuthState();
function toggleMenu(main, ...toHide) {
    if (!main)
        return;
    toHide.forEach(menu => menu === null || menu === void 0 ? void 0 : menu.classList.add("hidden"));
    main.classList.toggle("hidden");
}
register_button.addEventListener("click", () => {
    toggleMenu(registerContainer, loginContainer, language_menu);
});
login_button.addEventListener("click", () => {
    toggleMenu(loginContainer, registerContainer, language_menu);
});
profile_button.addEventListener("click", () => {
    toggleMenu(profile_menu, language_menu);
});
edit_button.addEventListener("click", () => {
    toggleMenu(edit_menu, twoFA_menu, friends_menu, history_menu, twofaTypeMenu, language_menu);
});
friends_button.addEventListener("click", () => {
    toggleMenu(friends_menu, twoFA_menu, edit_menu, history_menu, twofaTypeMenu, language_menu);
});
history_button.addEventListener("click", () => {
    toggleMenu(history_menu, twoFA_menu, friends_menu, edit_menu, twofaTypeMenu, language_menu);
});
language_button.addEventListener("click", () => {
    toggleMenu(language_menu, registerContainer, loginContainer, profile_menu);
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
        if (qrContainer)
            qrContainer.innerHTML = "";
        sessionStorage.removeItem("2fa-setup-mode");
        return;
    }
    if (!is2FAEnabled) {
        twofaStatusText.textContent = t("two_fa_setup_in_progress");
        twofaToggleBtn.textContent = t("cancel");
        twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
        twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        twofaTypeMenu.classList.remove("hidden");
    }
    else {
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
        }
        catch (err) {
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
    }
    else if (twoFA_menu) {
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
        if (!res.ok)
            throw new Error("Failed to enable 2FA");
        const data = await res.json();
        if (!data.qrCode)
            throw new Error("Server did not return QR code");
        sessionStorage.setItem("2fa-setup-mode", "true");
        const qrContainer = document.getElementById("qr-container");
        qrContainer.innerHTML = `<img src="${data.qrCode}" alt="Scan QR Code" />`;
        twofaForm.classList.remove("hidden");
        twofaStatusText.textContent = "Scannez le QR code et entrez le code généré...";
    }
    catch (err) {
        alert(err.message);
        twofaStatusText.textContent = "Erreur lors de l'activation du QR Code.";
        is2FAEnabled = false;
        selected2FAType = null;
        twofaToggleBtn.textContent = t("enable");
    }
});
const saveProfileBtn = document.getElementById("btn-save-profile");
saveProfileBtn.addEventListener("click", async () => {
    const username = document.getElementById("edit-username").value.trim();
    const email = document.getElementById("edit-email").value.trim();
    const avatar = document.getElementById("edit-avatar").value.trim();
    const password = document.getElementById("edit-password").value;
    const confirmPass = document.getElementById("edit-password-confirm").value;
    const errors = [];
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
    const payload = {};
    if (username)
        payload.username = sanitizeInput(username);
    if (email)
        payload.email = sanitizeInput(email);
    if (avatar)
        payload.avatar = sanitizeInput(avatar);
    if (password)
        payload.password = password;
    const token = localStorage.getItem("accessToken");
    let userId = storedUserId;
    if (!userId) {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            userId = user.id;
        }
        catch (e) {
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
        const profileAvatar = document.getElementById("profile-avatar");
        if (data.user.username)
            menuUsername.textContent = data.user.username;
        if (data.user.email)
            menuEmail.textContent = data.user.email;
        if (data.user.avatar)
            profileAvatar.src = data.user.avatar;
        alert("Profile updated!");
    }
    catch (err) {
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
    if (enBtn)
        enBtn.addEventListener("click", () => setLanguage("en"));
    if (frBtn)
        frBtn.addEventListener("click", () => setLanguage("fr"));
    if (esBtn)
        esBtn.addEventListener("click", () => setLanguage("es"));
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
        const inUsername = document.getElementById("username");
        const inEmail = document.getElementById("email");
        const inPassword = document.getElementById("password");
        const inConfirmPassword = document.getElementById("confirm-password");
        if (!inUsername || !inEmail || !inPassword || !inConfirmPassword) {
            console.error("Missing elements in the form");
            return;
        }
        const username = inUsername.value.trim();
        const email = inEmail.value.trim();
        const password = inPassword.value;
        const confirmPassword = inConfirmPassword.value;
        const errors = [];
        if (!validateEmail(email))
            errors.push("Invalid email");
        if (!validatePassword(password))
            errors.push("Password must have 8 characters, one uppercase letter and one number");
        if (!validateTextInput(username, 20))
            errors.push("Invalid username");
        if (password !== confirmPassword)
            errors.push("Passwords do not match");
        if (errors.length > 0) {
            alert("Errors:\n" + errors.join("\n"));
            return;
        }
        const submit = register_form.querySelector('button[type="submit"]');
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
                    if (data === null || data === void 0 ? void 0 : data.accessToken)
                        storeToken(data.accessToken);
                    if (data === null || data === void 0 ? void 0 : data.user) {
                        storeUser(data.user);
                        if (typeof data.user.id === 'number')
                            storedUserId = data.user.id;
                    }
                    // L'alert marche pas car bloque pqr le navigateur, a voir -------------------------------------
                    alert("Registration successful, you can now log in");
                    register_form.reset();
                }
                else {
                    alert("Server error: " + ((data === null || data === void 0 ? void 0 : data.error) || res.statusText));
                }
            }
            catch (err) {
                console.error("Register fetch error:", err);
                alert("Network error. Try again later.");
            }
            finally {
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = originalTxt !== null && originalTxt !== void 0 ? originalTxt : "Register";
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
        const inLogin = document.getElementById("login-id");
        const inPassword = document.getElementById("login-password");
        if (!inLogin || !inPassword) {
            console.error("Missing elements to login");
            return;
        }
        const loginId = inLogin.value;
        const loginPass = inPassword.value;
        const err = [];
        if (!(validateEmail(loginId) || validateTextInput(loginId, 50)))
            err.push("invalid_user_or_email");
        if (!validatePassword(loginPass))
            err.push("invalid_password");
        if (err.length > 0) {
            const translatedErrors = err.map(key => t(key));
            alert(t("errors_prefix") + "\n" + translatedErrors.join("\n"));
            return;
        }
        const safeLoginId = sanitizeInput(loginId);
        const sendBack = {
            identifier: safeLoginId,
            password: loginPass
        };
        const submit = login_form.querySelector('button[type="submit"]');
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
                            if (typeof data.user.id === 'number')
                                storedUserId = data.user.id;
                        }
                        applyLoggedInState(data.user || { id: 0, username: '', email: '' });
                        login_form.reset();
                        console.log("Hourray");
                        alert("Login successful");
                    }
                }
                else
                    alert("Server error: " + ((data === null || data === void 0 ? void 0 : data.error) || res.statusText));
            }
            catch (err) {
                console.error("Fetch error:", err);
                alert("Network error. Try again later.");
            }
            finally {
                if (submit) {
                    submit.disabled = false;
                    submit.textContent = originalTxt !== null && originalTxt !== void 0 ? originalTxt : "Login";
                }
            }
        }
    });
}
async function update2FAStatus() {
    try {
        const res = await fetch("/user/me", { credentials: "include" });
        if (!res.ok)
            return;
        const data = await res.json();
        const user = data.user;
        if (user === null || user === void 0 ? void 0 : user.isTwoFAEnabled) {
            is2FAEnabled = true;
            twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${user.twoFAMethod || "qr"})`;
            twofaToggleBtn.textContent = t("disable");
            twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        }
        else {
            is2FAEnabled = false;
            twofaStatusText.textContent = t("two_fa_is_disabled");
            twofaToggleBtn.textContent = t("enable");
            twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
            twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
        }
    }
    catch (err) {
        console.error("Failed to fetch 2FA status:", err);
    }
}
twofaForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const codeInput = document.getElementById("twofa-code");
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
        let res;
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
        }
        else if (selected2FAType === "qr") {
            const body = { code };
            if (twoFAtoken && !isSetupMode) {
                body.twoFAtoken = twoFAtoken;
            }
            res = await fetch("/verify-totp", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
        }
        else {
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
            twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
            twofaToggleBtn.textContent = t("disable");
            twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        }
        else {
            storeToken(data.accessToken);
            if (data.user)
                storeUser(data.user);
            applyLoggedInState(data.user || { id: 0, username: '', email: '' });
            alert("Login successful with 2FA!");
        }
        twofaForm.reset();
        twofaForm.classList.add("hidden");
        twofaTypeMenu.classList.add("hidden");
        const qrContainer = document.getElementById("qr-container");
        if (qrContainer)
            qrContainer.innerHTML = "";
        if (!isSetupMode) {
            twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
            twofaToggleBtn.textContent = t("disable");
            twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        }
        selected2FAType = null;
    }
    catch (err) {
        console.error("2FA verification error:", err);
        alert(err.message);
    }
});
const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
    logoutButton.addEventListener("click", async () => {
        try {
            let idToSend = storedUserId;
            if (!idToSend) {
                try {
                    const s = localStorage.getItem('user');
                    if (s) {
                        const parsed = JSON.parse(s);
                        if (parsed && typeof parsed.id === 'number')
                            idToSend = parsed.id;
                    }
                }
                catch (err) {
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
            }
            else {
                let serverBody = null;
                try {
                    serverBody = await res.json().catch(() => null);
                }
                catch (_) {
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
                alert(t("logout_error") + " " + ((err === null || err === void 0 ? void 0 : err.error) || (err === null || err === void 0 ? void 0 : err.message) || res.statusText));
            }
        }
        catch (err) {
            console.error(err);
            alert(t("network_error"));
        }
    });
}
async function fetchFriendsList(userId) {
    try {
        const res = await fetch(`/friend/${userId}`, { credentials: "include" });
        if (!res.ok)
            throw new Error("Failed to fetch friends");
        const data = await res.json();
        return data;
    }
    catch (err) {
        console.error(err);
        return [];
    }
}
addFriendBtn.addEventListener("click", async () => {
    const friendUsername = prompt("Enter the username of the friend to add:");
    if (!friendUsername)
        return;
    try {
        const resUser = await fetch(`/user/by-username/${friendUsername}`, { credentials: "include" });
        if (!resUser.ok)
            throw new Error("User not found");
        const userData = await resUser.json();
        const payload = { userId: storedUserId, friendId: userData.id };
        const res = await fetch("/friend", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        if (!res.ok)
            throw new Error("Failed to add friend");
        alert("Friend added successfully!");
    }
    catch (err) {
        alert(err.message);
    }
});
yourFriendsBtn.addEventListener("click", async () => {
    const friends = await fetchFriendsList(storedUserId);
    alert("Your friends: " + friends.map((f) => f.username).join(", "));
});
pendingFriendsBtn.addEventListener("click", async () => {
    try {
        const res = await fetch(`/friend-request/received/${storedUserId}`, { credentials: "include" });
        if (!res.ok)
            throw new Error("Failed to fetch pending friends");
        const requests = await res.json();
        alert("Pending requests: " + requests.map((r) => r.sendBy.username).join(", "));
    }
    catch (err) {
        alert(err.message);
    }
});
const friendsMenuList = document.createElement("div");
friendsMenuList.id = "friends-list";
friends_menu.appendChild(friendsMenuList);
function renderFriends(friends) {
    friendsMenuList.innerHTML = "";
    friends.forEach(f => {
        const div = document.createElement("div");
        div.textContent = `${f.username} (${f.status})`;
        friendsMenuList.appendChild(div);
    });
}
yourFriendsBtn.addEventListener("click", async () => {
    const friends = await fetchFriendsList(storedUserId);
    renderFriends(friends);
});
//PONG
initMenuEvents();

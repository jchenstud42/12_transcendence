import { setSelected2FAType, showTwoFAForm } from "../2FA_Front/2FA_Auth.js";
import { storeUser, getServerErrorMessage } from "../utils/utils.js";
import { AVATARS } from "./UI_events.js";
import { t } from "../traduction/i18n.js";
let elems = null;
let funcs = null;
let storedUserId = null;
/**
 * - La on recup les elements et fonctions pour gerer l'UI
 *
 * bisous
 */
export function initUIState(elements, callbacks) {
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
    if (elems.twofaForm)
        elems.twofaForm.classList.add("hidden");
    if (elems.twofaTypeMenu)
        elems.twofaTypeMenu.classList.add("hidden");
    const qrContainer = document.getElementById("qr-container");
    if (qrContainer)
        qrContainer.innerHTML = "";
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
export function applyLoggedInState(user) {
    var _a, _b;
    ensureInit();
    reset2FAUIState();
    try {
        (_a = elems.register_button) === null || _a === void 0 ? void 0 : _a.classList.add('hidden');
        (_b = elems.login_button) === null || _b === void 0 ? void 0 : _b.classList.add('hidden');
    }
    catch (e) { }
    const menuUsername = document.getElementById('menu-username');
    const menuEmail = document.getElementById('menu-email');
    const profileAvatar = document.getElementById('profile-avatar');
    const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (menuUsername)
        menuUsername.textContent = user.username || '';
    if (menuEmail)
        menuEmail.textContent = user.email || '';
    if (profileAvatar) {
        if (storedUser.avatar)
            profileAvatar.src = storedUser.avatar;
        else
            profileAvatar.src = "../assets/default-avatar.png";
    }
    const profileBtn = document.getElementById('profile-button');
    if (profileBtn)
        profileBtn.classList.remove('hidden');
    try {
        if (elems.registerContainer)
            elems.registerContainer.classList.add('hidden');
        if (elems.loginContainer)
            elems.loginContainer.classList.add('hidden');
    }
    catch (e) { }
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn)
        logoutBtn.classList.remove('hidden');
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
    var _a, _b;
    try {
        (_a = elems.register_button) === null || _a === void 0 ? void 0 : _a.classList.remove('hidden');
        (_b = elems.login_button) === null || _b === void 0 ? void 0 : _b.classList.remove('hidden');
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
    var _a;
    try {
        if (window.location.hash.startsWith("#accessToken=")) {
            const accessToken = window.location.hash.split("=")[1];
            funcs.storeToken(accessToken);
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        const urlParams = new URLSearchParams(window.location.search);
        const twoFAToken = urlParams.get("twoFAtoken");
        const method = urlParams.get("method");
        if (twoFAToken) {
            sessionStorage.setItem("twoFAtoken", twoFAToken);
            const payload = JSON.parse(atob(twoFAToken.split(".")[1]));
            storedUserId = payload.userId;
            setSelected2FAType(method);
            showTwoFAForm(method);
            window.history.replaceState({}, "", window.location.pathname);
            return;
        }
        const res = await fetch("/user/me", { credentials: "include" });
        if (!res.ok) {
            applyLoggedOutState();
            return;
        }
        const data = await res.json();
        funcs.storeToken(data.accessToken);
        funcs.storeUser(data.user);
        if (((_a = data.user) === null || _a === void 0 ? void 0 : _a.is2FAEnabled) && !sessionStorage.getItem("twoFAtoken")) {
            storedUserId = data.user.id;
            setSelected2FAType(data.user.twoFAMethod);
            showTwoFAForm(data.user.twoFAMethod);
            return;
        }
        storedUserId = data.user.id;
        applyLoggedInState(data.user);
    }
    catch (err) {
        console.error("initAuthState error:", err);
        applyLoggedOutState();
    }
}
async function updateAvatar(url) {
    const token = localStorage.getItem("accessToken");
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    if (!user.id) {
        alert(t("must_login"));
        return;
    }
    const res = await fetch(`/user/profile/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ avatar: url })
    });
    const data = await res.json();
    if (!res.ok) {
        alert(getServerErrorMessage(data.error) || t("failed_update_avatar"));
        return;
    }
    storeUser(data.user);
    const img = document.getElementById("profile-avatar");
    if (img)
        img.src = url;
}
const changeAvatarBtn = document.getElementById("change-avatar-btn");
const quickPicker = document.getElementById("quick-avatar-picker");
const uploadAvatarBtn = document.getElementById("upload-avatar-btn");
const avatarFileInput = document.getElementById("avatar-file-input");
if (changeAvatarBtn && quickPicker) {
    changeAvatarBtn.addEventListener("click", () => {
        quickPicker.classList.toggle("hidden");
        quickPicker.innerHTML = "";
        localStorage.removeItem("selectedAvatar");
        AVATARS.forEach((url) => {
            const img = document.createElement("img");
            img.src = url;
            img.className = "w-14 h-14 rounded-full cursor-pointer hover:ring-2 ring-purple-500";
            img.addEventListener("click", async () => {
                await updateAvatar(url);
                quickPicker.classList.add("hidden");
            });
            quickPicker.appendChild(img);
        });
    });
}
if (uploadAvatarBtn && avatarFileInput) {
    uploadAvatarBtn.addEventListener("click", () => {
        avatarFileInput.click();
    });
    localStorage.removeItem("selectedAvatar");
    avatarFileInput.addEventListener("change", async () => {
        var _a;
        const file = (_a = avatarFileInput.files) === null || _a === void 0 ? void 0 : _a[0];
        if (!file)
            return;
        if (file.type !== "image/png") {
            alert(t("only_png"));
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert(t("image_too_heavy"));
            return;
        }
        const reader = new FileReader();
        reader.onload = async () => {
            const base64Avatar = reader.result;
            await updateAvatar(base64Avatar);
            localStorage.setItem("selectedAvatar", base64Avatar);
        };
        reader.readAsDataURL(file);
    });
}

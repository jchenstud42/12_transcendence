import { toggleMenu } from "./UI_helpers.js";
import { initLanguage, setLanguage } from "../traduction/i18n.js";
import { storeUser, getServerErrorMessage } from "../utils/utils.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../utils/inputValidFront.js";
import { t } from "../traduction/i18n.js";
import { resetGameMenu } from "../Pong/menu.js";
function openPong(elems) {
    var _a;
    if (!elems.pong_overlay || !elems.pong_menu)
        return;
    elems.pong_overlay.classList.remove("hidden");
    elems.pong_menu.classList.remove("hidden");
    (_a = elems.back_button) === null || _a === void 0 ? void 0 : _a.classList.remove("hidden");
    elems.pong_overlay.offsetHeight;
    elems.pong_menu.offsetHeight;
    elems.pong_overlay.classList.remove("opacity-0", "pointer-events-none");
    elems.pong_overlay.classList.add("opacity-100");
    elems.pong_menu.classList.remove("opacity-0", "scale-95");
    elems.pong_menu.classList.add("opacity-100", "scale-100");
    document.body.classList.add("overflow-hidden");
}
function closePong(elems) {
    var _a;
    if (!elems.pong_overlay || !elems.pong_menu)
        return;
    elems.pong_overlay.classList.remove("opacity-100");
    elems.pong_overlay.classList.add("opacity-0", "pointer-events-none");
    elems.pong_menu.classList.remove("opacity-100", "scale-100");
    elems.pong_menu.classList.add("opacity-0", "scale-95");
    (_a = elems.back_button) === null || _a === void 0 ? void 0 : _a.classList.add("hidden");
    document.body.classList.remove("overflow-hidden");
    const duration = 300;
    setTimeout(() => {
        var _a, _b;
        (_a = elems.pong_overlay) === null || _a === void 0 ? void 0 : _a.classList.add("hidden");
        (_b = elems.pong_menu) === null || _b === void 0 ? void 0 : _b.classList.add("hidden");
    }, duration);
}
/*
  - On initialise les events pour les differents boutons et menu (on ecoute pour savoir quand l'user clique dessus on affiche le menu et cache les autres)
  - On initialise aussi le menu de langue et on set les events pour changer de langue

  langue hehe
 */
export function initUIEvents(elems) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
    (_a = elems.register_button) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => toggleMenu(elems.registerContainer, elems.loginContainer, elems.language_menu));
    (_b = elems.login_button) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => toggleMenu(elems.loginContainer, elems.registerContainer, elems.language_menu));
    (_c = elems.profile_button) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => toggleMenu(elems.profile_menu, elems.language_menu));
    (_d = elems.edit_button) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => toggleMenu(elems.edit_menu, elems.twoFA_menu, elems.friends_menu, elems.history_menu, elems.twofaTypeMenu, elems.language_menu));
    document.addEventListener("keydown", (event) => {
        var _a;
        if (event.key == "Escape" && !((_a = elems.back_button) === null || _a === void 0 ? void 0 : _a.classList.contains("hidden"))) {
            closePong(elems);
            resetGameMenu();
        }
    });
    (_e = elems.pong_button) === null || _e === void 0 ? void 0 : _e.addEventListener("click", () => {
        var _a, _b, _c;
        (_a = elems.pong_button) === null || _a === void 0 ? void 0 : _a.classList.add("hidden");
        (_b = elems.qmatch_button) === null || _b === void 0 ? void 0 : _b.classList.remove("hidden");
        (_c = elems.tournament_button) === null || _c === void 0 ? void 0 : _c.classList.remove("hidden");
    });
    (_f = elems.back_button) === null || _f === void 0 ? void 0 : _f.addEventListener("click", () => {
        closePong(elems);
        resetGameMenu();
    });
    (_g = elems.start_button) === null || _g === void 0 ? void 0 : _g.addEventListener("click", () => {
        var _a;
        (_a = elems.pong_menu) === null || _a === void 0 ? void 0 : _a.classList.remove("hidden");
        openPong(elems);
        toggleMenu(elems.edit_menu, elems.twoFA_menu, elems.friends_menu, elems.history_menu, elems.twofaTypeMenu, elems.language_menu, elems.registerContainer, elems.loginContainer, elems.profile_menu);
        resetGameMenu();
    });
    (_h = elems.friends_button) === null || _h === void 0 ? void 0 : _h.addEventListener("click", () => toggleMenu(elems.friends_menu, elems.twoFA_menu, elems.edit_menu, elems.history_menu, elems.twofaTypeMenu, elems.language_menu));
    (_j = elems.history_button) === null || _j === void 0 ? void 0 : _j.addEventListener("click", () => toggleMenu(elems.history_menu, elems.twoFA_menu, elems.friends_menu, elems.edit_menu, elems.twofaTypeMenu, elems.language_menu));
    if (elems.language_button && elems.language_menu) {
        elems.language_button.addEventListener("click", () => toggleMenu(elems.language_menu, elems.registerContainer, elems.loginContainer, elems.profile_menu));
        initLanguage();
        (_k = elems.language_menu.querySelector(".en")) === null || _k === void 0 ? void 0 : _k.addEventListener("click", () => setLanguage("en"));
        (_l = elems.language_menu.querySelector(".fr")) === null || _l === void 0 ? void 0 : _l.addEventListener("click", () => setLanguage("fr"));
        (_m = elems.language_menu.querySelector(".es")) === null || _m === void 0 ? void 0 : _m.addEventListener("click", () => setLanguage("es"));
    }
}
export const AVATARS = [
    "../assets/avatars/PPRomain.png",
    "../assets/avatars/Corgi.jpeg",
    "../assets/avatars/Gamer.png",
    "../assets/avatars/Journey.png"
];
/*
  - Meme chose on initialise les events pour le profil et le menu de langue
  - Ensuite on gere les inputs du profil pour sauvegarder les modifs
  - On sanitize et on valide les inputs avant d'envoyer la requete au back
  - On recupere le userId soit via le param ou via le localstorage si null
  - On envoie la requete PATCH au back pour update le profil
  - On met a jour le localstorage et l'UI si reussi

  love you <3
*/
export function initProfile(profileElems, currentUserId) {
    const { saveProfileBtn } = profileElems;
    let selectedAvatar = localStorage.getItem("selectedAvatar");
    if (selectedAvatar && profileElems.profileAvatar) {
        profileElems.profileAvatar.src = selectedAvatar;
    }
    const avatarPicker = document.getElementById("avatar-picker");
    if (avatarPicker) {
        avatarPicker.innerHTML = "";
        AVATARS.forEach((url) => {
            const img = document.createElement("img");
            img.src = url;
            img.className = "w-16 h-16 rounded-full cursor-pointer hover:ring-2 ring-purple-500";
            img.addEventListener("click", () => {
                selectedAvatar = url;
                localStorage.setItem("selectedAvatar", selectedAvatar);
                avatarPicker.querySelectorAll("img").forEach(i => i.classList.remove("ring-2"));
                img.classList.add("ring-2", "ring-purple-500");
                profileElems.profileAvatar.src = selectedAvatar;
            });
            avatarPicker.appendChild(img);
        });
    }
    saveProfileBtn.addEventListener("click", async () => {
        const username = document.getElementById("edit-username").value.trim();
        const email = document.getElementById("edit-email").value.trim();
        const password = document.getElementById("edit-password").value;
        const confirmPass = document.getElementById("edit-password-confirm").value;
        const errors = [];
        if (username && !validateTextInput(username, 20))
            errors.push(t("invalid_username"));
        if (email && !validateEmail(email))
            errors.push(t("invalid_email"));
        if (password && !validatePassword(password))
            errors.push(t("invalid_password_format"));
        if (password !== confirmPass)
            errors.push(t("passwords_do_not_match"));
        if (errors.length > 0) {
            alert(t("error_prefix") + "\n" + errors.join("\n"));
            return;
        }
        const payload = {};
        if (username)
            payload.username = sanitizeInput(username);
        if (email)
            payload.email = sanitizeInput(email);
        if (password)
            payload.password = password;
        if (selectedAvatar)
            payload.avatar = selectedAvatar;
        const token = localStorage.getItem("accessToken");
        let userId = currentUserId;
        if (!userId) {
            try {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                userId = user.id;
            }
            catch (e) {
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
            const profileAvatar = document.getElementById("profile-avatar");
            if (data.user.username)
                menuUsername.textContent = data.user.username;
            if (data.user.email)
                menuEmail.textContent = data.user.email;
            if (data.user.avatar)
                profileAvatar.src = data.user.avatar;
            alert(t("profile_updated"));
        }
        catch (err) {
            console.error(err);
            alert(t("network_error"));
        }
    });
}

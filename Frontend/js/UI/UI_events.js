import { toggleMenu } from "./UI_helpers.js";
import { initLanguage, setLanguage } from "../traduction/i18n.js";
import { storeUser } from "../utils/utils.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../utils/inputValidFront.js";
/*
 On initialise les events pour les differents boutons et menu (on ecoute pour savoir quand l'user clique dessus,
  on affiche le menu et cache les autres)
  On initialise aussi le menu de langue
 */
export function initUIEvents(elems) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    (_a = elems.register_button) === null || _a === void 0 ? void 0 : _a.addEventListener("click", () => toggleMenu(elems.registerContainer, elems.loginContainer, elems.language_menu));
    (_b = elems.login_button) === null || _b === void 0 ? void 0 : _b.addEventListener("click", () => toggleMenu(elems.loginContainer, elems.registerContainer, elems.language_menu));
    (_c = elems.profile_button) === null || _c === void 0 ? void 0 : _c.addEventListener("click", () => toggleMenu(elems.profile_menu, elems.language_menu));
    (_d = elems.edit_button) === null || _d === void 0 ? void 0 : _d.addEventListener("click", () => toggleMenu(elems.edit_menu, elems.twoFA_menu, elems.friends_menu, elems.history_menu, elems.twofaTypeMenu, elems.language_menu));
    (_e = elems.friends_button) === null || _e === void 0 ? void 0 : _e.addEventListener("click", () => toggleMenu(elems.friends_menu, elems.twoFA_menu, elems.edit_menu, elems.history_menu, elems.twofaTypeMenu, elems.language_menu));
    (_f = elems.history_button) === null || _f === void 0 ? void 0 : _f.addEventListener("click", () => toggleMenu(elems.history_menu, elems.twoFA_menu, elems.friends_menu, elems.edit_menu, elems.twofaTypeMenu, elems.language_menu));
    if (elems.language_button && elems.language_menu) {
        elems.language_button.addEventListener("click", () => toggleMenu(elems.language_menu, elems.registerContainer, elems.loginContainer, elems.profile_menu));
        initLanguage();
        (_g = elems.language_menu.querySelector(".en")) === null || _g === void 0 ? void 0 : _g.addEventListener("click", () => setLanguage("en"));
        (_h = elems.language_menu.querySelector(".fr")) === null || _h === void 0 ? void 0 : _h.addEventListener("click", () => setLanguage("fr"));
        (_j = elems.language_menu.querySelector(".es")) === null || _j === void 0 ? void 0 : _j.addEventListener("click", () => setLanguage("es"));
    }
}
/*
 Meme chose on initialise les events pour le profil et le menu de langue
  On oublie pas de gerer les inputs du profil pour les verifier et les sanitize
  On gere aussi la sauvegarde des modifications du profil
  On initialise aussi le menu de langue ici aussi car
*/
export function initProfileAndLanguage(profileElems, languageElems, currentUserId) {
    const { saveProfileBtn } = profileElems;
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
        let userId = currentUserId;
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
}

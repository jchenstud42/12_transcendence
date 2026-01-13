import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { storeToken, storeUser, getServerErrorMessage } from "./utils/utils.js";
import { t } from "./traduction/i18n.js";
import { initUIState, applyLoggedInState, initAuthState } from "./UI/UI_State.js";
import { initProfile } from "./UI/UI_events.js";
import { initUIEvents } from "./UI/UI_events.js";
import { init2FA, showTwoFAForm, setSelected2FAType } from "./2FA_Front/2FA_Auth.js";
// CA C LE DIV DANS LE HTML
const registerContainer = document.getElementById("register-form");
const loginContainer = document.getElementById("login-form");
// CA C LE <FORM> DANS LE HTML, FAITES LA DIFFERENCE A CHAQUE FOIS MERCI
const register_form = document.getElementById("register_form");
const login_form = document.getElementById("login_form");
const register_button = document.getElementById("register-button");
const login_button = document.getElementById("login-button");
const oauth42Btn = document.getElementById("oauth-42-button");
const start_button = document.getElementById("pong-start-button");
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
const pong_menu = document.getElementById("pong-menu");
const pong_overlay = document.getElementById("pong-overlay");
const back_button = document.getElementById("back-button");
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
initUIState({ register_button, login_button, registerContainer, loginContainer, profile_button, logout_button: document.getElementById("logout-button"), twofaForm, twofaTypeMenu }, { storeToken, storeUser });
init2FA({
    twofaForm, destinationModal, destinationInput, destinationTitle, destinationCancel, destinationConfirm, twofaTypeMenu, twofaStatusText, twofaToggleBtn,
    btnEmail, btnSMS, btnQR, twoFA_menu, twoFA_profile_button, oauth42Btn
}, { sanitizeInput, t, getServerErrorMessage, storeToken, storeUser, applyLoggedInState }, is2FAEnabled);
initUIEvents({
    register_button, login_button, profile_button, edit_button, friends_button, history_button, start_button,
    language_button, registerContainer, loginContainer, profile_menu, edit_menu, friends_menu, history_menu, twoFA_menu, twofaTypeMenu, language_menu, pong_menu, back_button, pong_overlay
});
initProfile({
    // avatarInput: document.getElementById("edit-avatar") as HTMLInputElement,
    saveProfileBtn: document.getElementById("btn-save-profile"),
    usernameInput: document.getElementById("edit-username"),
    emailInput: document.getElementById("edit-email"),
    passwordInput: document.getElementById("edit-password"),
    confirmPasswordInput: document.getElementById("edit-password-confirm"),
    menuUsername: document.getElementById("menu-username"),
    menuEmail: document.getElementById("menu-email"),
    profileAvatar: document.getElementById("profile-avatar")
}, storedUserId);
initAuthState();
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
            errors.push(t("invalid_email"));
        if (!validatePassword(password))
            errors.push(t("invalid_password_format"));
        if (!validateTextInput(username, 20))
            errors.push(t("invalid_username"));
        if (password !== confirmPassword)
            errors.push(t("passwords_do_not_match"));
        if (errors.length > 0) {
            alert(t("errors_prefix") + "\n" + errors.join("\n"));
            return;
        }
        const submit = register_form.querySelector('button[type="submit"]');
        if (submit) {
            submit.disabled = true;
            const originalTxt = submit.textContent;
            submit.textContent = t("registering");
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
                    alert(t("register_ok"));
                    register_form.reset();
                }
                else {
                    alert(t("server_error_prefix") + " " + ((data === null || data === void 0 ? void 0 : data.error) || res.statusText));
                }
            }
            catch (err) {
                console.error("Register fetch error:", err);
                alert(t("network_error"));
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
            err.push(t("invalid_user_or_email"));
        if (!validatePassword(loginPass))
            err.push(t("invalid_password"));
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
                        setSelected2FAType(data.method);
                        showTwoFAForm(data.method);
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
                        alert(t("login_success"));
                    }
                }
                else
                    alert("Server error: " + ((data === null || data === void 0 ? void 0 : data.error) || res.statusText));
            }
            catch (err) {
                console.error("Fetch error:", err);
                alert(t("network_error"));
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
                localStorage.removeItem("user");
                sessionStorage.removeItem("twoFAtoken");
                selected2FAType = null;
                try {
                    await fetch("/logout", {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" }
                    });
                }
                catch (_) { }
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
                    alert(t("logout_user_not_found"));
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
// On recup la liste d'amis en envoyant un GET a la route /friend/userId, en gros pour recup les amis de cet userId precisement
// luv yu
async function fetchFriendsList(userId) {
    try {
        const res = await fetch(`/friend/${userId}`, {
            credentials: "include",
            headers: getAuthHeaders()
        });
        const text = await res.text();
        if (!res.ok)
            throw new Error(t("failed_fetch_friends"));
        return JSON.parse(text);
    }
    catch (err) {
        console.error("fetchFriendsList error:", err);
        return [];
    }
}
// Fonction pour recuperer un user par son username, on envoie une requete GEt a la route pour recup l'user
// bisougue
async function fetchUserByUsername(username) {
    const res = await fetch(`/user/by-username/${username}`, {
        credentials: "include",
        headers: getAuthHeaders()
    });
    const textResponse = await res.text();
    if (!res.ok)
        throw new Error(t("profile_not_found"));
    return JSON.parse(textResponse);
}
// La fonction pour supprimer un ami qui est appelee dans le listener du bouton de suppression d'ami
// On envoie une requete DELETE a la route /friend avec le userId et le friendId dans le bobodydy
// Zoubis
async function removeFriend(userId, friendId) {
    const res = await fetch("/friend", {
        method: "DELETE",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId, friendId }),
    });
    if (!res.ok)
        throw new Error(t("failed_remove_friend"));
    return await res.json();
}
// Fonction utilitaire pour recuperer les header d'authentification avec le token, pour les routes protegees par le preHandler
// Bises
function getAuthHeaders() {
    const token = localStorage.getItem("accessToken");
    return Object.assign({ "Content-Type": "application/json" }, (token && { "Authorization": `Bearer ${token}` }));
}
// Le listener pour envoyer une requete d'ami, on recup l'userId du LocalStorage et on demande a l'user le username de l'ami qu'il souhaite ajouter
// On fetch sur la route backend avec le bond body (senderId = userId du localStorage, receiverId = userId de l'ami qu'on veut ajouter)
// et les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on affiche une alerte comme quou la requete est envoyee
// Bisous
addFriendBtn.addEventListener("click", async () => {
    const friendUsername = prompt(t("ask_username"));
    if (!friendUsername)
        return;
    try {
        const s = localStorage.getItem('user');
        if (!s)
            throw new Error(t("must_login"));
        const currentUser = JSON.parse(s);
        const userData = await fetchUserByUsername(friendUsername);
        const payload = { senderId: currentUser.id, receiverId: userData.id };
        const res = await fetch("/friend/request", {
            method: "POST",
            credentials: "include",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
        });
        const responseText = await res.text();
        if (!res.ok) {
            const error = JSON.parse(responseText);
            throw new Error(getServerErrorMessage(error.error) || t(("failed_friend_request")));
        }
        alert(t("friend_request_sent"));
    }
    catch (err) {
        console.error("Error:", err);
        alert(getServerErrorMessage(err.message));
    }
});
const friendsMenuList = document.createElement("div");
friendsMenuList.id = "friends-list";
friends_menu.appendChild(friendsMenuList);
// On afficher la liste d'amis dans le menu friends, on cree un element pour chaque ami avec son username et un bouton pour le supprimer
// On ajoute un listener sur le bouton pour supprimer l'ami en question si click dessus
// Puis on refetch la liste d'amis et on re-render la liste actualise
// Bisous
function renderFriends(friends) {
    friendsMenuList.innerHTML = "";
    if (friends.length === 0) {
        const div = document.createElement("div");
        div.textContent = t("no_friends_yet");
        friendsMenuList.appendChild(div);
        return;
    }
    friends.forEach(f => {
        const div = document.createElement("div");
        div.className = "friend-item";
        div.innerHTML = `
						<span>${f.username} (${f.status})</span>
						<button class="remove-friend-btn" data-friend-id="${f.id}">✕</button>
				`;
        friendsMenuList.appendChild(div);
    });
    document.querySelectorAll(".remove-friend-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const friendId = Number(e.target.dataset.friendId);
            try {
                const s = localStorage.getItem('user');
                if (!s)
                    throw new Error(t("must_login"));
                const userId = JSON.parse(s).id;
                await removeFriend(userId, friendId);
                const friends = await fetchFriendsList(userId);
                renderFriends(friends);
            }
            catch (err) {
                alert(err.message);
            }
        });
    });
}
// Le listener pour afficher la liste d'amis, on recup l'userId dans le localStorage et on fetch sur la route backend
// avec les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on appelle renderFriends pour afficher la liste d'amis
// Bisous
yourFriendsBtn.addEventListener("click", async () => {
    try {
        const s = localStorage.getItem('user');
        if (!s) {
            alert(t("must_login"));
            return;
        }
        const userId = JSON.parse(s).id;
        const friends = await fetchFriendsList(userId);
        renderFriends(friends);
    }
    catch (err) {
        console.error("Error:", err);
        alert(err.message);
    }
});
// Le listener pour afficher les requetes en attente, on recuper l'userId dans le localStorage et on fetch sur la route backend
// toujours avec les bons headers (token car route protegee par le preHandler authentizer)
// si tout bon on appelle renderPendingRequests pour afficher les requests
// Bisous
pendingFriendsBtn.addEventListener("click", async () => {
    try {
        const s = localStorage.getItem('user');
        if (!s)
            throw new Error(t("must_login"));
        const userId = JSON.parse(s).id;
        const res = await fetch(`/friend/request/received/${userId}`, {
            credentials: "include",
            headers: getAuthHeaders()
        });
        if (!res.ok)
            throw new Error("Failed to fetch pending requests");
        const requests = await res.json();
        renderPendingRequests(requests, userId);
    }
    catch (err) {
        console.error(err);
        alert(err.message);
    }
});
// On affiche les request d'amis en attente et on permet d'accepter ou de rejeter la request
// en fonction du choix on va dans le bon listener et la bonne fonction accept/reject
// Bisous bisous
function renderPendingRequests(requests, currentUserId) {
    friendsMenuList.innerHTML = "";
    if (requests.length === 0) {
        const div = document.createElement("div");
        div.textContent = t("no_pending_requests");
        friendsMenuList.appendChild(div);
        return;
    }
    requests.forEach(r => {
        const div = document.createElement("div");
        div.className = "pending-item";
        div.innerHTML = `
			<span>${r.sendBy.username}</span>
			<button class="accept-btn" data-request-id="${r.id}"> ✅ </button>
			<button class="reject-btn" data-request-id="${r.id}"> ❌ </button>
		`;
        friendsMenuList.appendChild(div);
    });
    document.querySelectorAll(".accept-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const requestId = Number(e.target.dataset.requestId);
            try {
                await acceptFriendRequest(requestId, currentUserId);
                alert(t("friends_request_accepted"));
                pendingFriendsBtn.click();
            }
            catch (err) {
                alert(getServerErrorMessage(err.message));
            }
        });
    });
    document.querySelectorAll(".reject-btn").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            const requestId = Number(e.target.dataset.requestId);
            try {
                await rejectFriendRequest(requestId, currentUserId);
                alert(t("friends_request_rejected"));
                pendingFriendsBtn.click();
            }
            catch (err) {
                alert(getServerErrorMessage(err.message));
            }
        });
    });
}
// Accepter la request d'un ami, on fetch sur la bonne route backed avec le bon body et les bons headers (token)
// Bisous
async function acceptFriendRequest(requestId, userId) {
    const res = await fetch(`/friend/request/accept/${requestId}`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(getServerErrorMessage(error.error) || t("failed_accept_request"));
    }
    return await res.json();
}
// Meme fonctionnement que acceptFriendRequest mais pour rejeter
// Bisous
async function rejectFriendRequest(requestId, userId) {
    const res = await fetch(`/friend/request/reject/${requestId}`, {
        method: "POST",
        credentials: "include",
        headers: getAuthHeaders(),
        body: JSON.stringify({ userId }),
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(getServerErrorMessage(error.error) || t("failed_reject_request"));
    }
    return await res.json();
}
async function fetchMatchHistory(userId) {
    var _a;
    try {
        const res = await fetch(`/match/${userId}`, {
            credentials: "include",
            headers: getAuthHeaders()
        });
        const text = await res.text();
        console.log("Match history raw:", text);
        if (!res.ok)
            throw new Error(text);
        const data = JSON.parse(text);
        return Array.isArray(data) ? data : (_a = data.matches) !== null && _a !== void 0 ? _a : [];
    }
    catch (err) {
        console.error("fetchMatchHistory error:", err);
        return [];
    }
}
const historyMenuList = document.createElement("div");
historyMenuList.id = "history-list";
if (history_menu) {
    history_menu.appendChild(historyMenuList);
}
function renderMatchHistory(matches) {
    historyMenuList.innerHTML = "";
    if (!matches.length) {
        historyMenuList.textContent = t("no_match_history");
        return;
    }
    matches.forEach(match => {
        var _a, _b, _c, _d, _e, _f;
        const p1 = (_b = (_a = match.player1) === null || _a === void 0 ? void 0 : _a.username) !== null && _b !== void 0 ? _b : "Unknown";
        const p2 = (_d = (_c = match.player2) === null || _c === void 0 ? void 0 : _c.username) !== null && _d !== void 0 ? _d : "Unknown";
        const date = match.date ? new Date(match.date).toLocaleDateString() : "N/A";
        const winner = match.winnerId === ((_e = match.player1) === null || _e === void 0 ? void 0 : _e.id) ? p1 :
            match.winnerId === ((_f = match.player2) === null || _f === void 0 ? void 0 : _f.id) ? p2 :
                t("draw");
        const div = document.createElement("div");
        div.innerHTML = `${date} | ${p1} ${match.score1} - ${match.score2} ${p2}`;
        historyMenuList.appendChild(div);
    });
}
history_button.addEventListener("click", async () => {
    try {
        const s = localStorage.getItem('user');
        if (!s) {
            alert(t("must_login"));
            return;
        }
        const userId = JSON.parse(s).id;
        const matches = await fetchMatchHistory(userId);
        renderMatchHistory(matches);
    }
    catch (err) {
        console.error("Error:", err);
        alert(err.message);
    }
});
// POOOONNNNNNNG
const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;
import { initMenuEvents } from "./Pong/menu.js";
initMenuEvents();
/* const aiPlayer = new Ai(gameBall, paddle_right, paddle_left, paddle_right, 3);
const aiPlayer2 = new Ai(gameBall, paddle_right, paddle_left, paddle_left, 3);

// AI View checkbox event listener
if (aiViewCheckboxInput) {
    aiViewCheckboxInput.addEventListener("change", (e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        console.log("AI View checkbox changed:", isChecked);
        // Add your logic here for when checkbox is checked/unchecked
        if (isChecked)
            aiPlayer.showAiPredictions();
        else
            aiPlayer.hideAiPredictions();
    });
} */

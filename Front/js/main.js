import { validateTextInput, validatePassword, sanitizeInput, validateEmail } from "./utils/inputValidFront.js";
import { shuffleArray } from "./utils/utils.js";
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
let selected2FAType = null;
let is2FAEnabled = false;
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
        destinationTitle.textContent = "Entrez votre email pour la 2FA";
        destinationInput.placeholder = "exemple@mail.com";
        destinationInput.type = "email";
    }
    else if (type === "sms") {
        destinationTitle.textContent = "Entrez votre numéro de téléphone";
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
        alert("Veuillez entrer une valeur.");
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
        alert("Erreur : " + data.error);
        return;
    }
    alert("2FA activée avec succès !");
    twofaStatusText.textContent = `2FA est activée (${selected2FAType}).`;
    twofaToggleBtn.textContent = "Désactiver";
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
function applyLoggedInState(user) {
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
        /* ========== 1) TOKEN OAUTH DANS LE HASH ========== */
        if (window.location.hash.startsWith("#accessToken=")) {
            const accessToken = window.location.hash.split("=")[1];
            storeToken(accessToken);
            // on supprime uniquement le hash
            window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }
        /* ========== 2) TOKEN 2FA DEPUIS OAUTH OU LOGIN ========== */
        const urlParams = new URLSearchParams(window.location.search);
        const twoFAToken = urlParams.get("twoFAtoken");
        const method = urlParams.get("method");
        if (twoFAToken) {
            // On stocke le token 2FA temporaire
            sessionStorage.setItem("twoFAtoken", twoFAToken);
            const payload = JSON.parse(atob(twoFAToken.split(".")[1]));
            storedUserId = payload.userId;
            selected2FAType = method;
            twofaForm.classList.remove("hidden");
            // Nettoyage URL
            window.history.replaceState({}, "", window.location.pathname);
            return;
        }
        /* ========== 3) ETAT AUTH ========== */
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
    is2FAEnabled = !is2FAEnabled;
    if (is2FAEnabled) {
        twofaStatusText.textContent = "2FA en cours de configuration...";
        twofaToggleBtn.textContent = "Annuler";
        twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
        twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        twofaTypeMenu.classList.remove("hidden");
    }
    else {
        twofaStatusText.textContent = "2FA est désactivée.";
        twofaToggleBtn.textContent = "Activer";
        twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
        twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
        twofaTypeMenu.classList.add("hidden");
        selected2FAType = null;
        await fetch("disable-2fa", {
            method: "POST",
            credentials: "include"
        });
    }
});
twoFA_profile_button.addEventListener("click", () => {
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
    }
    else if (twoFA_menu) {
        twoFA_menu.classList.add("hidden");
    }
});
btnQR.addEventListener("click", async () => {
    selected2FAType = "qr";
    twofaTypeMenu.classList.add("hidden");
    twofaStatusText.textContent = "2FA en cours de configuration (QR Code)...";
    twofaToggleBtn.textContent = "Annuler";
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
        const qrContainer = document.getElementById("qr-container");
        qrContainer.innerHTML = `<img src="${data.qrCode}" alt="Scan this QR code in your Authenticator app" />`;
        twofaForm.classList.remove("hidden");
        twofaStatusText.textContent = "Scannez le QR code et entrez le code généré.";
    }
    catch (err) {
        alert(err.message);
        twofaStatusText.textContent = "Erreur lors de l'activation du QR Code.";
        twofaToggleBtn.textContent = "Activer";
    }
});
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
            err.push("Invalid username or email");
        if (!validatePassword(loginPass))
            err.push("Invalid password");
        if (err.length > 0) {
            alert("Errors:\n" + err.join("\n"));
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
            submit.textContent = "Logging in...";
            try {
                const res = await fetch("/login", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sendBack),
                });
                const data = await res.json();
                // --- Gestion 2FA ---
                if (data.message === "2FA required") {
                    sessionStorage.setItem("twoFAtoken", data.twoFAtoken);
                    storedUserId = data.userId;
                    console.log("User id after login requiring 2FA:", storedUserId);
                    selected2FAType = data.method;
                    twofaForm.classList.remove("hidden");
                    return; // stop ici
                }
                if (res.ok) {
                    storeToken(data.accessToken);
                    if (data.user) {
                        storeUser(data.user);
                        if (typeof data.user.id === 'number')
                            storedUserId = data.user.id;
                    }
                    applyLoggedInState(data.user || { id: 0, username: '', email: '' });
                    login_form.reset();
                    alert("Login successful");
                }
                else {
                    alert("Server error: " + ((data === null || data === void 0 ? void 0 : data.error) || res.statusText));
                }
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
twofaForm.addEventListener("submit", async (e) => {
    var _a, _b, _c, _d;
    e.preventDefault();
    console.log("Token au submit:", sessionStorage.getItem("twoFAtoken"));
    const codeInput = document.getElementById("twofa-code");
    const code = codeInput.value.trim();
    if (!/^\d{6}$/.test(code)) {
        return alert("Le code doit contenir exactement 6 chiffres.");
    }
    const twoFAtoken = sessionStorage.getItem("twoFAtoken");
    if (!twoFAtoken && selected2FAType !== "qr") {
        // Si ce n'est pas du QR, le token est obligatoire
        return alert("Token 2FA introuvable. Veuillez vous reconnecter.");
    }
    function getUserIdFrom2FAToken() {
        var _a, _b;
        const token = sessionStorage.getItem("twoFAtoken");
        if (!token)
            return null;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return (_b = (_a = payload.userId) !== null && _a !== void 0 ? _a : payload.sub) !== null && _b !== void 0 ? _b : null;
        }
        catch (_c) {
            return null;
        }
    }
    const userIdToSend = storedUserId !== null && storedUserId !== void 0 ? storedUserId : getUserIdFrom2FAToken();
    if (!userIdToSend && selected2FAType !== "qr") {
        return alert("Impossible de récupérer l'ID utilisateur. Veuillez vous reconnecter.");
    }
    try {
        if (selected2FAType === "qr") {
            // Vérification TOTP (QR) sans twoFAtoken
            const res = await fetch("/verify-totp", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Erreur lors de la vérification 2FA");
            // Login réussi
            storeToken(data.accessToken);
            if (data.user)
                storeUser(data.user);
            twofaForm.classList.add("hidden");
            storedUserId = (_b = (_a = data.user) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null;
            applyLoggedInState(data.user);
            alert("Connexion réussie avec 2FA !");
        }
        else {
            // Vérification Email/SMS avec twoFAtoken
            const body = {
                code,
                twoFAtoken: sessionStorage.getItem("twoFAtoken"),
            };
            const res = await fetch("/verify-2fa", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });
            const data = await res.json();
            if (!res.ok)
                throw new Error(data.error || "Erreur lors de la vérification 2FA");
            // Login réussi
            storeToken(data.accessToken);
            if (data.user)
                storeUser(data.user);
            twofaForm.classList.add("hidden");
            sessionStorage.removeItem("twoFAtoken");
            storedUserId = (_d = (_c = data.user) === null || _c === void 0 ? void 0 : _c.id) !== null && _d !== void 0 ? _d : null;
            applyLoggedInState(data.user);
            alert("Connexion réussie avec 2FA !");
        }
    }
    catch (err) {
        console.error("2FA verify error:", err);
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
                alert('Cannot logout: missing user id. Try refreshing the page and retry.');
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
                alert("Logout successful");
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
                    sessionStorage.removeItem("twoFAtoken");
                    selected2FAType = null;
                    twofaForm.classList.add("hidden");
                    alert("Logout: user not found on server — local session cleared.");
                    location.reload();
                    return;
                }
                const err = serverBody || { error: res.statusText };
                alert("Error logging out: " + ((err === null || err === void 0 ? void 0 : err.error) || (err === null || err === void 0 ? void 0 : err.message) || res.statusText));
            }
        }
        catch (err) {
            console.error(err);
            alert("Network error. Try again later.");
        }
    });
}
// POOOONNNNNNNG
const paddle_left = document.getElementById("left-paddle");
const paddle_right = document.getElementById("right-paddle");
const ball = document.getElementById("ball");
const PONG_WIDTH = 800;
const PONG_HEIGHT = 600;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 100;
const PADDLE_SPEED = 10;
const BALL_SIZE = 10;
const pong_menu = document.getElementById("pong-menu");
const pong_button = document.getElementById("pong-button");
const qmatch_button = document.getElementById("quick-match-button");
const tournament_button = document.getElementById("tournament-button");
const enterPlayerNbr_text = document.getElementById("enterPlayerNbr-text");
const playerNbr_text = document.getElementById("playerNbr-text");
const playerIncr_button = document.getElementById("increasePlayer-button");
const playerDecr_button = document.getElementById("decreasePlayer-button");
const aiCounter = document.getElementById("ai-counter");
const aiNbr_text = document.getElementById("aiNbr-text");
const OK_button = document.getElementById("OK-button");
const play_button = document.getElementById("play-button");
const ready_text = document.getElementById("ready-text");
const go_text = document.getElementById("go-text");
const playerName_container = document.getElementById("playerName-container");
const playerName_input = document.getElementById("playerName-input");
const playerColors = ["text-red-400", "text-blue-400", "text-green-400", "text-yellow-400"];
const playersList = document.getElementById("players-list");
const finalList = document.getElementById("final-list");
const winnerName = document.getElementById("winner-name");
const crownImage = document.getElementById("crown-image");
class Player {
    constructor(name, isAi, playerNbr) {
        this.name = "";
        this.playerNbr = 0;
        this.paddle = null;
        this.point = 0;
        this.gameWon = 0;
        this.isAi = false;
        this.name = name;
        this.isAi = isAi;
        this.playerNbr = playerNbr;
    }
}
;
class Ball {
    constructor(el, container, size = BALL_SIZE) {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.speed = 300;
        this.active = false;
        this.onScore = null; // callback
        this.el = el;
        this.container = container;
        this.size = size;
        this.initBallPos();
    }
    initBallPos() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        this.x = w / 2 - this.size / 2;
        this.y = h / 2 - this.size / 2;
        this.vx = 0;
        this.vy = 0;
        this.active = false;
        this.render();
    }
    serve(direction = (Math.random() < 0.5 ? 1 : -1)) {
        this.initBallPos();
        const maxAngle = 45 * (Math.PI / 180);
        const angle = (Math.random() * maxAngle * 2) - maxAngle;
        this.speed = 300;
        this.vx = direction * this.speed * Math.cos(angle);
        this.vy = this.speed * Math.sin(angle);
        this.active = true;
    }
    reset() {
        this.initBallPos();
    }
    render() {
        this.el.style.removeProperty('right');
        this.el.style.left = `${this.x}px`;
        this.el.style.top = `${this.y}px`;
    }
    rectsIntersect(ax, ay, aw, ah, bx, by, bw, bh) {
        return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
    }
    update(dt) {
        if (!this.active)
            return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        //update ball position
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        //wall colision
        if (this.y <= 0) {
            this.y = 0;
            this.vy = -this.vy;
        }
        if (this.y + this.size >= h) {
            this.y = h - this.size;
            this.vy = -this.vy;
        }
        const plX = paddle_left.offsetLeft;
        const plY = paddle_left.offsetTop;
        if (this.rectsIntersect(this.x, this.y, this.size, this.size, plX, plY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx < 0) {
            const paddleCenter = plY + PADDLE_HEIGHT / 2;
            const ballCenter = this.y + this.size / 2;
            const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
            const bounceAngle = relative * (75 * Math.PI / 180);
            this.speed = Math.min(this.speed + 20, 900);
            this.vx = Math.abs(this.speed * Math.cos(bounceAngle));
            this.vy = this.speed * Math.sin(bounceAngle);
            this.x = plX + PADDLE_WIDTH + 0.5;
        }
        const prX = paddle_right.offsetLeft;
        const prY = paddle_right.offsetTop;
        if (this.rectsIntersect(this.x, this.y, this.size, this.size, prX, prY, PADDLE_WIDTH, PADDLE_HEIGHT) && this.vx > 0) {
            const paddleCenter = prY + PADDLE_HEIGHT / 2;
            const ballCenter = this.y + this.size / 2;
            const relative = (ballCenter - paddleCenter) / (PADDLE_HEIGHT / 2);
            const bounceAngle = relative * (75 * Math.PI / 180);
            this.speed = Math.min(this.speed + 20, 900);
            this.vx = -Math.abs(this.speed * Math.cos(bounceAngle));
            this.vy = this.speed * Math.sin(bounceAngle);
            this.x = prX - PADDLE_WIDTH - 0.5;
        }
        if (this.x + this.size < 0) {
            console.debug('Ball out left -> right player scores');
            if (this.onScore)
                this.onScore('right'); // notifier le Game
            this.reset();
        }
        if (this.x > w) {
            console.debug('Ball out right -> left player scores');
            if (this.onScore)
                this.onScore('left'); // notifier le Game
            this.reset();
        }
        this.render();
    }
}
;
const gameBall = new Ball(ball, pong_menu, BALL_SIZE);
//game loop to update ball position;
let lastTime = performance.now();
function gameLoop(now = performance.now()) {
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    gameBall.update(dt);
    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);
//keys list
const keys = {
    w: false,
    s: false,
    ArrowUp: false,
    ArrowDown: false
};
//Start count down when Pong button is pressed
function startGame() {
    play_button.classList.add("hidden");
    paddle_left.classList.remove("hidden");
    paddle_right.classList.remove("hidden");
    ready_text.classList.remove("hidden");
    setTimeout(() => {
        ready_text.classList.add("hidden");
        go_text.classList.remove("hidden");
        setTimeout(() => {
            go_text.classList.add("hidden");
            ball.classList.remove("hidden");
            gameBall.serve();
        }, 1000);
    }, 1000);
}
play_button.addEventListener("click", startGame);
// document.addEventListener("keydown", (e) => {
// 	if (e.key !== "Enter") return;twofaForm
// 	const active = document.activeElement as HTMLElement | null;
// 	if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable)) return;
// 	startGame();
// });
//Set true or False wether a key is press among the "keys" listtwofaForm
document.addEventListener('keydown', (e) => {
    if (e.key in keys) {
        keys[e.key] = true;
    }
});
document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});
//Fonction pour bouger les paddles en fonction de la key press
function updatePaddlePositions() {
    if (keys.w && paddle_left.offsetTop > 0) {
        paddle_left.style.top = `${paddle_left.offsetTop - PADDLE_SPEED}px`;
    }
    if (keys.s && paddle_left.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
        paddle_left.style.top = `${paddle_left.offsetTop + PADDLE_SPEED}px`;
    }
    if (keys.ArrowUp && paddle_right.offsetTop > 0) {
        paddle_right.style.top = `${paddle_right.offsetTop - PADDLE_SPEED}px`;
    }
    if (keys.ArrowDown && paddle_right.offsetTop < PONG_HEIGHT - PADDLE_HEIGHT) {
        paddle_right.style.top = `${paddle_right.offsetTop + PADDLE_SPEED}px`;
    }
    requestAnimationFrame(updatePaddlePositions);
}
requestAnimationFrame(updatePaddlePositions);
class Game {
    constructor(playersName) {
        this.players = [];
        this.winner = null;
        this.players = playersName.map(([playerName, isAi], playerNbr) => new Player(playerName, isAi, playerNbr));
        gameBall.onScore = (playerSide) => {
            this.addPoint(playerSide);
        };
        if (playersName.length > 2)
            this.createTournament();
        else
            play_button.classList.remove("hidden");
    }
    addPoint(playerSide) {
        // À adapter selon ta logique (2 joueurs vs tournament)
        const pointIndex = playerSide === 'left' ? 0 : 1;
        if (this.players[pointIndex]) {
            this.players[pointIndex].point++;
            console.log(`${this.players[pointIndex].name} scores! Points: ${this.players[pointIndex].point}`);
        }
    }
    createTournament() {
        const shuffled = shuffleArray(this.players);
        playersList.innerHTML = "";
        shuffled.forEach(({ name, playerNbr, isAi }) => {
            addPlayerNameLabel(name, playerNbr, isAi);
        });
        showTournamentMatch();
    }
    createQuickMatch() {
        play_button.classList.remove("hidden");
    }
}
pong_button.addEventListener("click", () => {
    pong_button.classList.add("hidden");
    qmatch_button.classList.remove("hidden");
    tournament_button.classList.remove("hidden");
});
let isTournament = false;
let playerNbr = 2;
let maxPlayer = 2;
let aiNbr = 0;
qmatch_button.addEventListener("click", () => {
    qmatch_button.classList.add("hidden");
    tournament_button.classList.add("hidden");
    enterPlayerNbr();
});
tournament_button.addEventListener("click", () => {
    qmatch_button.classList.add("hidden");
    tournament_button.classList.add("hidden");
    isTournament = true;
    playerNbr = 4;
    maxPlayer = 4;
    playerNbr_text.textContent = playerNbr.toString();
    enterPlayerNbr();
});
function enterPlayerNbr() {
    enterPlayerNbr_text.classList.remove("hidden");
    playerNbr_text.classList.remove("hidden");
    playerIncr_button.classList.remove("hidden");
    playerDecr_button.classList.remove("hidden");
    aiCounter.classList.remove("hidden");
    OK_button.classList.remove("hidden");
}
playerIncr_button.addEventListener("click", () => {
    if (playerNbr < maxPlayer) {
        playerNbr++;
        playerNbr_text.textContent = playerNbr.toString();
        aiNbr--;
        aiNbr_text.textContent = aiNbr.toString();
    }
});
playerDecr_button.addEventListener("click", () => {
    if (playerNbr > 0) {
        playerNbr--;
        playerNbr_text.textContent = playerNbr.toString();
        aiNbr++;
        aiNbr_text.textContent = aiNbr.toString();
    }
});
OK_button.addEventListener("click", () => {
    hidePlayerNbrMenu();
    playersList.classList.remove("hidden");
    if (playerNbr > 0) {
        enterPlayerName();
    }
    else {
        addAiNameLabel();
        const game = new Game(playerNames);
    }
});
function hidePlayerNbrMenu() {
    enterPlayerNbr_text.classList.add("hidden");
    playerNbr_text.classList.add("hidden");
    aiCounter.classList.add("hidden");
    playerIncr_button.classList.add("hidden");
    playerDecr_button.classList.add("hidden");
    OK_button.classList.add("hidden");
}
let playerNames = [];
const aiNames = ["Nietzche", "Aurele", "Sun Tzu", "Socrate"];
let nameEntered = 0;
function enterPlayerName() {
    playerName_container.classList.remove("hidden");
}
playerName_input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        const playerName = playerName_input.value.trim();
        const nameAlreadyUsed = playerNames.some(([name, _isAI]) => name === playerName);
        if (playerName !== "" && !nameAlreadyUsed) {
            playerName_input.value = "";
            playerNames.push([playerName, false]);
            addPlayerNameLabel(playerName, nameEntered, false);
            nameEntered++;
        }
        if (nameEntered === playerNbr) {
            playerName_container.classList.add("hidden");
            addAiNameLabel();
            const game = new Game(playerNames);
        }
    }
});
function addPlayerNameLabel(name, index, isAi) {
    const label = document.createElement("div");
    const colorClass = playerColors[index];
    label.className = `player-name-item text-center font-bold ${colorClass}/90 min-w-[120px]`;
    if (!isAi)
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
    else
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;
    playersList.appendChild(label);
}
function addAiNameLabel() {
    for (let y = 0; y < aiNbr; y++) {
        const aiName = aiNames[y];
        addPlayerNameLabel(aiName, nameEntered + y, true);
        playerNames.push([aiName, true]);
    }
}
function showTournamentMatch() {
    //Create/show Final Boxex (holder of the results of the first match)
    for (let i = 0; i < 2; i++) {
        const label = document.createElement("div");
        label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;
        finalList.appendChild(label);
    }
    finalList.classList.remove("hidden");
    //Create/show Winner Box (holder of the results of the second match)
    const label = document.createElement("div");
    label.className = `player-name-item text-center font-bold text-gray-50 min-w-[120px]`;
    label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player x</span><br>?`;
    winnerName.appendChild(label);
    winnerName.classList.remove("hidden");
    crownImage.classList.remove("hidden");
}
function addFinalNameLabel(name, index, isAi) {
    const label = document.createElement("div");
    const colorClass = playerColors[index];
    label.className = `player-name-item text-center font-bold ${colorClass} min-w-[120px]`;
    if (!isAi)
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">Player ${index + 1}</span><br>${name}`;
    else
        label.innerHTML = `<span class="text-sm text-gray-400 whitespace-nowarp">AI ${index + 1}</span><br>${name}`;
    playersList.appendChild(label);
}

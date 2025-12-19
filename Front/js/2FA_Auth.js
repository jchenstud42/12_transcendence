let selected2FAType = null;
let is2FAEnabled = false;
let elems = null;
let funcs = null;
function ensureInit() {
    if (!elems || !funcs)
        throw new Error("2FA module not initialized. Call init2FA(...) first.");
}
function openDestinationModal(type) {
    ensureInit();
    selected2FAType = type;
    const { destinationModal, destinationTitle, destinationInput } = elems;
    const { t } = funcs;
    destinationModal.classList.remove("hidden");
    if (type === "email") {
        destinationTitle.textContent = t("enter_email_2fa");
        destinationInput.placeholder = "exemple@gmail.com";
        destinationInput.type = "email";
    }
    else {
        destinationTitle.textContent = t("enter_phone_2fa");
        destinationInput.placeholder = "+33123456789";
        destinationInput.type = "tel";
    }
    destinationInput.value = "";
    destinationInput.focus();
}
async function handleEnableDestination() {
    ensureInit();
    const { destinationInput, destinationModal, twofaStatusText, twofaToggleBtn, twofaTypeMenu } = elems;
    const { sanitizeInput, t, getServerErrorMessage } = funcs;
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
            alert("Erreur : " + getServerErrorMessage(data === null || data === void 0 ? void 0 : data.error));
            return;
        }
        alert(t("two_fa_enabled_success"));
        twofaStatusText.textContent = `${t("two_fa_is_enabled")} (${selected2FAType})`;
        twofaToggleBtn.textContent = t("disable");
        twofaTypeMenu.classList.add("hidden");
        destinationModal.classList.add("hidden");
        is2FAEnabled = true;
    }
    catch (err) {
        console.error("enable destination error:", err);
        alert(t("network_error"));
    }
}
export function showTwoFAForm(method) {
    ensureInit();
    if (method)
        selected2FAType = method;
    elems.twofaForm.classList.remove("hidden");
}
export function setSelected2FAType(type) {
    selected2FAType = type;
}
export function setIs2FAEnabled(flag) {
    is2FAEnabled = flag;
}
export async function update2FAStatus() {
    ensureInit();
    try {
        const res = await fetch("/user/me", { credentials: "include" });
        if (!res.ok)
            return;
        const data = await res.json();
        const user = data.user;
        if ((user === null || user === void 0 ? void 0 : user.isTwoFAEnabled) || (user === null || user === void 0 ? void 0 : user.is2FAEnabled)) {
            is2FAEnabled = true;
            elems.twofaStatusText.textContent = `${funcs.t("two_fa_is_enabled")} (${user.twoFAMethod || "qr"})`;
            elems.twofaToggleBtn.textContent = funcs.t("disable");
            elems.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
            elems.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
        }
        else {
            is2FAEnabled = false;
            elems.twofaStatusText.textContent = funcs.t("two_fa_is_disabled");
            elems.twofaToggleBtn.textContent = funcs.t("enable");
            elems.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
            elems.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
        }
    }
    catch (err) {
        console.error("Failed to fetch 2FA status:", err);
    }
}
export function init2FA(elements, callbacks, initial2FAState) {
    elems = elements;
    funcs = callbacks;
    ensureInit();
    const { destinationCancel, destinationConfirm, btnEmail, btnSMS, btnQR, twofaToggleBtn, twoFA_profile_button, oauth42Btn, twofaTypeMenu, twofaForm } = elems;
    twofaToggleBtn.classList.remove("opacity-50", "pointer-events-none");
    twofaToggleBtn.disabled = false;
    if (destinationCancel)
        destinationCancel.addEventListener("click", () => elems.destinationModal.classList.add("hidden"));
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
            elems.twofaStatusText.textContent = funcs.t("two_fa_setup_in_progress");
            elems.twofaToggleBtn.textContent = funcs.t("cancel");
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
                elems.twofaStatusText.textContent = "Scannez le QR code et entrez le code généré...";
            }
            catch (err) {
                console.error("QR enable error:", err);
                alert(err.message || funcs.t("network_error"));
                is2FAEnabled = false;
                selected2FAType = null;
                elems.twofaToggleBtn.textContent = funcs.t("enable");
            }
        });
    console.log("twofaToggleBtn element:", twofaToggleBtn);
    if (twofaToggleBtn)
        twofaToggleBtn.addEventListener("click", async () => {
            const isInSetupMode = !elems.twofaTypeMenu.classList.contains("hidden");
            if (isInSetupMode && !is2FAEnabled) {
                elems.twofaStatusText.textContent = funcs.t("two_fa_is_disabled");
                elems.twofaToggleBtn.textContent = funcs.t("enable");
                elems.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
                elems.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
                elems.twofaTypeMenu.classList.add("hidden");
                elems.twofaForm.classList.add("hidden");
                const qrContainer = document.getElementById("qr-container");
                if (qrContainer)
                    qrContainer.innerHTML = "";
                sessionStorage.removeItem("2fa-setup-mode");
                return;
            }
            if (!is2FAEnabled) {
                elems.twofaStatusText.textContent = funcs.t("two_fa_setup_in_progress");
                elems.twofaToggleBtn.textContent = funcs.t("cancel");
                elems.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
                elems.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
                elems.twofaTypeMenu.classList.remove("hidden");
            }
            else {
                try {
                    const res = await fetch("/disable-2fa", {
                        method: "POST",
                        credentials: "include"
                    });
                    if (res.ok) {
                        is2FAEnabled = false;
                        elems.twofaStatusText.textContent = funcs.t("two_fa_is_disabled");
                        elems.twofaToggleBtn.textContent = funcs.t("enable");
                        elems.twofaToggleBtn.classList.remove("bg-red-500", "hover:bg-red-600");
                        elems.twofaToggleBtn.classList.add("bg-blue-500", "hover:bg-blue-600");
                        elems.twofaTypeMenu.classList.add("hidden");
                        alert("2FA disabled successfully!");
                    }
                }
                catch (err) {
                    console.error("Error disabling 2FA:", err);
                }
            }
        });
    if (twoFA_profile_button) {
        twoFA_profile_button.addEventListener("click", async () => {
            if (!elems.twoFA_menu)
                return;
            const isHidden = elems.twoFA_menu.classList.contains("hidden");
            if (isHidden) {
                elems.twoFA_menu.classList.remove("hidden");
                await update2FAStatus();
            }
            else {
                elems.twoFA_menu.classList.add("hidden");
            }
        });
    }
    if (oauth42Btn) {
        oauth42Btn.addEventListener("click", () => {
            window.location.href = "/oauth/42";
        });
    }
    if (elems.twofaForm) {
        elems.twofaForm.addEventListener("submit", async (e) => {
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
                    elems.twofaStatusText.textContent = `${funcs.t("two_fa_is_enabled")} (${selected2FAType})`;
                    elems.twofaToggleBtn.textContent = funcs.t("disable");
                    elems.twofaToggleBtn.classList.remove("bg-blue-500", "hover:bg-blue-600");
                    elems.twofaToggleBtn.classList.add("bg-red-500", "hover:bg-red-600");
                }
                else {
                    funcs.storeToken(data.accessToken);
                    if (data.user)
                        funcs.storeUser(data.user);
                    if (funcs.applyLoggedInState)
                        funcs.applyLoggedInState(data.user);
                    alert("Login successful with 2FA!");
                }
                elems.twofaForm.reset();
                elems.twofaForm.classList.add("hidden");
                elems.twofaTypeMenu.classList.add("hidden");
                const qrContainer = document.getElementById("qr-container");
                if (qrContainer)
                    qrContainer.innerHTML = "";
                if (!isSetupMode) {
                    elems.twofaStatusText.textContent = `${funcs.t("two_fa_is_enabled")} (${selected2FAType})`;
                    elems.twofaToggleBtn.textContent = funcs.t("disable");
                }
                selected2FAType = null;
            }
            catch (err) {
                console.error("2FA verification error:", err);
                alert(err.message);
            }
        });
    }
}

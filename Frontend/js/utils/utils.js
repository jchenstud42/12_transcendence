import { t } from "../traduction/i18n.js";
export function shuffleArray(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}
export function getServerErrorMessage(error) {
    if (!error)
        return t("network_error");
    const key = serverErrorTranslations[error];
    return (key ? t(key) : error);
}
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
    "User has no password (OAuth account)": "user_no_password",
    "You cannot send a request to yourself": "cannot_send_request_to_yourself",
    "Friend request already exists": "friend_request_already_exists",
    "Already friends": "already_friends"
};
export function storeToken(accessToken) {
    localStorage.setItem("accessToken", accessToken);
}
export function storeUser(user) {
    try {
        localStorage.setItem('user', JSON.stringify(user));
    }
    catch (e) {
        console.warn('Failed to store user', e);
    }
}

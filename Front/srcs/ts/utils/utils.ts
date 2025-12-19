import { initLanguage, setLanguage, t } from "../i18n.js";
import { TranslationKey } from "../traduction.js";


export function shuffleArray<T>(arr: T[]): T[] {
	const copy = arr.slice();
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy;
}

const serverErrorTranslations: Record<string, string> = {
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

export function getServerErrorMessage(error: string | undefined) {
	if (!error)
		return t("network_error");
	const key = serverErrorTranslations[error];
	return (key ? t(key as TranslationKey) : error);
}

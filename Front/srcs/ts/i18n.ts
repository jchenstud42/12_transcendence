import { translations, Language, TranslationKey } from "./traduction.js";

export function setLanguage(lang: Language) {
	currentLang = lang; // <- ajouter cette ligne
	localStorage.setItem("lang", lang);

	document.querySelectorAll("[data-i18n]").forEach(el => {
		const key = el.getAttribute("data-i18n") as TranslationKey;
		if (!key)
			return;

		const translation = translations[lang][key];

		if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
			el.placeholder = translation;
		else if (el instanceof HTMLLabelElement)
			el.textContent = translation;
		else
			el.textContent = translation;
	});
}

export function initLanguage() {
	const saved = localStorage.getItem("lang") as Language ?? "en";
	setLanguage(saved);
}

export let currentLang: Language = "en";

export function t(key: TranslationKey): string
{
	return translations[currentLang][key];
}
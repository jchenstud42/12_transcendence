import { translations, Language, TranslationKey } from "./traduction.js";

export function setLanguage(lang: Language) {
	localStorage.setItem("lang", lang);

	document.querySelectorAll("[data-i18n]").forEach(el => {
		const key = el.getAttribute("data-i18n") as TranslationKey;
		if (key in translations[lang]) {
			if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)
				el.placeholder = translations[lang][key];
			else
				el.textContent = translations[lang][key];
		}
		else
			console.warn(`Missing translation for key: ${key}`);
	});
}

export function initLanguage() {
	const saved = localStorage.getItem("lang") as Language ?? "en";
	setLanguage(saved);
}

import { translations } from "./traduction.js";
export function setLanguage(lang) {
    currentLang = lang; // <- ajouter cette ligne
    localStorage.setItem("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
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
    var _a;
    const saved = (_a = localStorage.getItem("lang")) !== null && _a !== void 0 ? _a : "en";
    setLanguage(saved);
}
export let currentLang = "en";
export function t(key) {
    return translations[currentLang][key];
}

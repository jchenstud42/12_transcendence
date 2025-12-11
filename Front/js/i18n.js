import { translations } from "./traduction.js";
export function setLanguage(lang) {
    localStorage.setItem("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
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
    var _a;
    const saved = (_a = localStorage.getItem("lang")) !== null && _a !== void 0 ? _a : "en";
    setLanguage(saved);
}

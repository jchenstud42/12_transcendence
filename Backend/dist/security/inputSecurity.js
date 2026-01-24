/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   inputSecurity.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/27 12:04:50 by mjameau           #+#    #+#             */
/*   Updated: 2026/01/19 17:58:47 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
// POUR EVITER LES ATTAQUES XSS -> ON REMPLACE LES CARACTERES "DANGEREUX" PAR AUTRE CHOSE
/*
    Pour comprendre pourquoi :
    - XSS est une faille qui permet d'injecter du code pas gentil dans une page web
    - En remplacant les caracteres speciaux par des entites HTML, on empeche le navigateur d'executer du code pas gentil.
    Bisous, Mathis
*/
export function sanitizeInput(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F");
}
// ON VERIFIE L'EMAIL SI Y A BIEN TOUT DE DEMANDE (@, . ETC) bises - Mathis
export function validateEmail(email) {
    return (/^[a-zA-Z0-9._%+-]+@(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$/
        .test(email));
}
/* ON VERIFIE LE MDP :
    - Au moins une majuscule
    - Au moins un chiffre
    - Au moins 8 caracteres
    bisous - Mathis
*/
export function validatePassword(password) {
    return (/^(?=.*[A-Z])(?=.*\d)\S{8,}$/.test(password));
}
/* CHECK L'INPUT DE L'UTILISATEUR
    - Si c'est pas vide
    - Si c'est pas trop long (deuxieme parametre)
    APPELER sanitizeInput() APRES CAR CETTE FONCTION NE PROTEGE PAS DU XSS
    gros bisous - Mathis
*/
export function validateTextInput(input, maxLength = 255) {
    if (!input || input.trim() === "" || input.length > maxLength)
        return (false);
    return (true);
}
//# sourceMappingURL=inputSecurity.js.map
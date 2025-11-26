/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   inputValidFront.ts                                 :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: paulmart <paulmart@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/11/05 14:27:47 by mjameau           #+#    #+#             */
/*   Updated: 2025/11/05 14:49:54 by paulmart         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
// POUR EVITER LES ATTAQUES XSS -> ON REMPLACE LES CARACTERES "DANGEREUX" PAR AUTRE CHOSE
export function sanitizeInput(input) {
    return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F");
}
// ON VERIFIE L'EMAIL SI Y A BIEN TOUT DE DEMANDE (@, . ETC)
export function validateEmail(email) {
    return (/^\S+@\S+\.\S+$/.test(email));
}
/* ON VERIFIE LE MDP :
    - Au moins une majuscule
    - Au moins un chiffre
    - Au moins 8 caracteres
*/
export function validatePassword(password) {
    return (/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password));
}
/* CHECK L'INPUT DE L'UTILISATEUR
    - Si c'est pas vide
    - Si c'est pas trop long (deuxieme parametre)
    APPELER sanitizeInput() APRES CAR CETTE FONCTION NE PROTEGE PAS DU XSS
*/
export function validateTextInput(input, maxLength = 255) {
    if (!input || input.trim() === "" || input.length > maxLength)
        return (false);
    return (true);
}

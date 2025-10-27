/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   inputSecurity.ts                                   :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/27 12:04:50 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 12:33:25 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// POUR EVITER LES ATTAQUES XSS ET TOUT
export function sanitizeInput(input: string): string {
	return input
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#x27;")
		.replace(/\//g, "&#x2F");
}

// ON VERIFIE L'EMAIL SI Y A BIEN TOUT DE DEMANDE (@ . ETC)
export function validateEmail(email: string): boolean {
	return (/^\S+@\S+\.\S+$/.test(email))
}

/* ON VERIFIE LE MDP :
	- Au moins une majuscule
	- Au moins un chiffre
	- Au moins 8 caracteres
*/
export function validatePassword(password: string): boolean {
	return (/^(?=.*[A-Z])(?=.*\d).{8,}$/.test(password));
}

/* CHECK L'INPUT DE L'UTILISATEUR
	- Si c'est pas vide
	- Si c'est pas trop long (deuxieme parametre)
	APPELER sanitizeInput() APRES CAR CETTE FONCTION NE PROTEGE PAS DU XSS
*/
export function validateTextInput(input: string, maxLength = 255): boolean {
	if (!input || input.trim() === "" || input.length > maxLength) return false;
	return (true);
}

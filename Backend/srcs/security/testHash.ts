/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   testHash.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/27 11:25:58 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 15:34:46 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// CE FICHIER EST A DETRUIRE A LA FIN C UN TEST DE CUL POUR VOIR SI L'ALGO FONCTIONNE



import { hashPassword, checkPassword } from "./passHash.js";

async function main() {
	const password = "passwordCacaBoudincul";
	console.log("MDP :", password);

	const hashed = await hashPassword(password);
	console.log("Hashed MDP :", hashed);

	const isValid = await checkPassword(password, hashed);
	console.log("Valide ?", isValid);

	const isWrong = await checkPassword("OIDHSIOHA", hashed);
	console.log("MDP doit etre faux :", isWrong);
}

main().catch(err => {
	console.error("Erreur :", err);
});

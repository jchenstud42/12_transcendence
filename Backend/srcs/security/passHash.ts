/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   passHash.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/23 13:38:44 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 15:34:30 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import bcrypt from "bcrypt";

/* SI VOUS VOULEZ UTILISER SES FONCTIONS DANS UN AUTRE FICHIER MERCI DE METTRE :
	- import { hashPassword, verifyPassword } from "./security/passHash.js";

	ON STOCK JAMAIS LES VRAIS MDP DANS LA DATABASE, APPELEZ TOUJOURS hashPassword AVANT!

	POUR LE LOGIN DE L'USER VERIFIEZ SON MDP AVEC LA VERSION HASHED DE NOTRE DATABASE AVEC checkPassword(), TRUE = OK, FALSE = PAS MEME MDP
*/

const SALT_R = 12;

export async function hashPassword(password: string): Promise<string> {
	if (!password)
		throw new Error("Password cannot be empty");
	return (bcrypt.hash(password, SALT_R));
}


export async function checkPassword(password: string, hashed: string): Promise<boolean> {
	if (!password || !hashed)
		throw new Error("Password or hash missing");
	return (bcrypt.compare(password, hashed));
}

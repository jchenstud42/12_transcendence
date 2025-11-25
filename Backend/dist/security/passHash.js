/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   passHash.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/23 13:38:44 by mjameau           #+#    #+#             */
/*   Updated: 2025/11/05 18:23:14 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
import bcrypt from "bcrypt";
/*
    ON STOCK JAMAIS LES VRAIS MDP DANS LA DATABASE, APPELEZ TOUJOURS hashPassword AVANT! MERCIIIII

    POUR LE LOGIN DE L'USER VERIFIEZ SON MDP AVEC LA VERSION HASHED DE NOTRE DATABASE AVEC checkPassword(), TRUE = OK, FALSE = PAS MEME MDP

    Pour comprendre le fonctionnement de bcrypt :
    - bcrypt genere un "salt" ici de 12 rounds, un salt c'est une chaine de caracteres aleatoire qui va etre ajoutee au mot de passe avant de le *hasher.
    - Le salt rend plus difficile les attaques par dictionnaire et les attaques par rainbow truc (g pas regarde c'etait quoi)
    - Le salt est stocke avec le hash, donc on peut toujours check le mot de passe en utilisant le meme salt (bcrypt le gere tout seul)

    - *hash c'est quoi? C'est une fonction qui transforme une entree (ici mdp + salt) en une chaine de caracteres en apparence aleatoire.
    - On peut pas retrouver le mdp original a partir du hash, c'est sens unique.
    - Donc seulement si l'utilisateur rentre le meme mdp, on obtiendra le meme hash avec le meme salt. Mais on ne peut pas retrouver le mdp a partir du hash.

    Bisous dsl au debut j'ai ecris en maj je devais pas etre content ce jour la - Mathis :)
*/
const SALT_R = 12;
export async function hashPassword(password) {
    if (!password)
        throw new Error("Password cannot be empty");
    return (bcrypt.hash(password, SALT_R));
}
export async function checkPassword(password, hashed) {
    if (!password || !hashed)
        throw new Error("Password or hash missing");
    return (bcrypt.compare(password, hashed));
}
//# sourceMappingURL=passHash.js.map
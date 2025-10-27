/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   testHash.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/27 11:25:58 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 11:32:00 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */
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
//# sourceMappingURL=testHash.js.map
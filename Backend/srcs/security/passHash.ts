/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   passHash.ts                                        :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/23 13:38:44 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 11:43:44 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

import bcrypt from "bcrypt";


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

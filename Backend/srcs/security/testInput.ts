/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   testInput.ts                                       :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: mjameau <mjameau@student.42.fr>            +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/10/27 14:19:32 by mjameau           #+#    #+#             */
/*   Updated: 2025/10/27 14:19:48 by mjameau          ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

// CE FICHIER EST A DETRUIRE A LA FIN C UN TEST DE CUL POUR VOIR SI LES VERIFS FONCTIONNENT

import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "./inputSecurity.js";

async function runTests() {
	console.log("=== TEST EMAIL ===");
	console.log("Valid email:", validateEmail("test@example.com")); // true
	console.log("Invalid email:", validateEmail("bad-email"));      // false

	console.log("\n=== TEST PASSWORD ===");
	console.log("Valid password:", validatePassword("Test1234"));   // true
	console.log("No uppercase:", validatePassword("test1234"));    // false
	console.log("No number:", validatePassword("TestTest"));       // false
	console.log("Too short:", validatePassword("T1e"));            // false

	console.log("\n=== TEST TEXT INPUT ===");
	console.log("Valid text:", validateTextInput("Hello World"));  // true
	console.log("Empty text:", validateTextInput(""));             // false
	console.log("Too long:", validateTextInput("a".repeat(300)));  // false

	console.log("\n=== TEST SANITIZE ===");
	const dirty = '<script>alert("xss")</script>/';
	console.log("Before:", dirty);
	console.log("After :", sanitizeInput(dirty));
}

runTests().catch(console.error);

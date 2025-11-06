import Fastify from "fastify";
import { hashPassword, checkPassword } from "../../security/passHash.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../../security/inputSecurity.js";

type User = { id: number, username: string, email: string, password: string };

const users = new Map<string, User>();
/* Une map pour le moment le temps que je n'ai pas de database prete - Roro

Quand la database sera prete -> Toujours utiliser des requêtes preparees / ORM (ex : Prisma),
ne jamais concatener des strings pour ecrire une requete SQL avec un input user(pour protect injection SQL) - Mathis*/

export const server = Fastify({ logger: true });
let userIdCounter = 1;

/**
 * REGISTER
 *  - Vérifie les entrées - Roro
 *  - Hash le mot de passe - Roro
 *  - Sauvegarde l’utilisateur - Roro
 *
 * - J'ai encore rien change ici bisous - Mathis
*/

server.post("/register", async (req, reply) => {
	try {
		const { username, email, password } = req.body as
			{
				username: string;
				email: string;
				password: string;
			};

		if (!validateEmail(email) || !validatePassword(password) || !validateTextInput(username))
			return (reply.status(400).send({ error: "Invalid Input" }));

		const cleanUsername = sanitizeInput(username);
		const cleanEmail = sanitizeInput(email);

		if (users.has(cleanEmail))
			return (reply.status(409).send({ error: "User already exists" }));

		const hashed = await hashPassword(password);

		const newUser: User =
		{
			id: userIdCounter++,
			username: cleanUsername,
			email: cleanEmail,
			password: hashed
		}

		users.set(cleanEmail, newUser);
		return (reply.status(201).send({ message: "User registered successfully", user: { id: newUser.id, username: newUser.username, email: newUser.email } }));
	}
	catch (err) {
		req.log.error(err);
		return (reply.status(500).send({ error: "Internal server error" }));
	}
});

/**
 * LOGIN
 *  - On verifie si le mot de passe et l'identifiant sont valides - Roro
 *  - Changement -> On ne verifie pas le mot de passe avec validatePassword car on veut juste checker si il correspond a celui enregistre, pas si il est "fort" - Mathis
 *
 *  - Vérifie l’existence de l’utilisateur - Roro (changement pour check email ou username - Mathis)
 *  - Compare le mot de passe avec celui hashe et enregistre dans la DB
 *  - Retourne un message ou un token - Roro (JWT a implementer plus tard - Mathis)
 *  -
*/

server.post("/login", async (req, reply) => {
	try {
		const { identifier, password } = req.body as
			{
				identifier: string;
				password: string;
			};
		if (!password || password.length < 8 || !validateTextInput(identifier, 50))
			return (reply.status(400).send({ error: "Invalid Input" }));

		const cleanIdentifier = sanitizeInput(identifier);

		const user = [...users.values()].find(u => u.email === cleanIdentifier || u.username === cleanIdentifier);
		if (!user)
			return (reply.status(404).send({ error: "User not found" }));

		const isValidPassword = await checkPassword(password, user.password);
		if (!isValidPassword)
			return (reply.status(401).send({ error: "User not found" }));

		return (reply.send({ message: "Login successful", user: { id: user.id, username: user.username, email: user.email } }));
	}
	catch (err) {
		req.log.error(err);
		return reply.status(500).send({ error: "Internal server error" });
	}
});

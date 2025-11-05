import Fastify from "fastify";
import { hashPassword, checkPassword } from "../../security/passHash.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../../security/inputSecurity.js";

type User = {id: number, username: string, email: string, password: string};

const users = new Map<string, User>(); // Une map pour le moment le temps que je n'ai pas de database prete
export const server = Fastify({logger: true});
let userIdCounter = 1;

/**
 * REGISTER
 *  - Vérifie les entrées
 *  - Hash le mot de passe
 *  - Sauvegarde l’utilisateur
*/

server.post("/register", async(req, reply) =>
{
	try
	{
		const { username, email, password } = req.body as
		{
			username: string;
			email: string;
			password: string;
		};

		if (!validateEmail(email) || !validatePassword(password) || !validateTextInput(username))
			return (reply.status(400).send({error: "Invalid Input"}));
		
		const cleanUsername = sanitizeInput(username);
		const cleanEmail = sanitizeInput(email);

		//Verifie que l'utilisateur n'a pas deja un email
		if (users.has(email))
			return (reply.status(409).send({ error: "User already exists" }));

		//Verifie que le password est a la norme
		const hashed = await hashPassword(password);

		//Creer l'utilisateur
		const newUser: User = 
		{
			id: userIdCounter++,
			username: cleanUsername,
			email: cleanEmail,
			password: hashed		
		}
		
		users.set(cleanEmail, newUser);
		return (reply.status(201).send({message: "User registered successfully",user: { id: newUser.id, username: newUser.username, email: newUser.email }}));
	}
	catch (err) 
	{
		req.log.error(err);
		return (reply.status(500).send({ error: "Internal server error" }));
	}
});

/**
 * LOGIN
 *  - Vérifie l’existence de l’utilisateur
 *  - Compare le mot de passe
 *  - Retourne un message ou un token
*/

server.post("/login", async(req, reply) =>
{
	try
	{
		const { email, password } = req.body as
		{
			email: string;
			password: string;
		};
		if (!validatePassword(password) || !validateTextInput(email))
			return (reply.status(400).send({error: "Invalid Input"}));

		const cleanUsername = sanitizeInput(email);

		//Verifier que le user existe dans la db
		const user = users.get(email);
		if (!user)
			return (reply.status(404).send({ error: "User not found" }));

		//Verifier que le mot de passe est le bon pour le user
		const isValidPassword = await checkPassword(password, user.password);
		if (!isValidPassword)
			return (reply.status(401).send({ error: "User not found" }));

		return (reply.send({message: "Login successful", user: { id: user.id, username: user.username, email: user.email }}));
	}
	catch (err)
	{
		req.log.error(err);
		return reply.status(500).send({ error: "Internal server error" });
	}
});
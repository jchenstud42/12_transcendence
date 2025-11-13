import Fastify from "fastify";
import { PrismaClient } from '@prisma/client';
import { hashPassword, checkPassword } from "../../security/passHash.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../../security/inputSecurity.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../../module_security/jwtUtils.js";
import { twoFAService } from "../../module_security/2FA.js";

const twofa = new twoFAService();
const prisma = new PrismaClient();
/* J'ai mis prisma meme si on a pas encore le database - Roro

Quand la database sera prete -> Toujours utiliser des requêtes preparees / ORM (ex : Prisma),
ne jamais concatener des strings pour ecrire une requete SQL avec un input user(pour protect injection SQL) - Mathis*/

export const server = Fastify({ logger: true });

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

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: cleanEmail },
					{ username: cleanUsername }
				]
			}
		});

		if (existingUser)
			return (reply.status(409).send({ error: "User already exists" }));

		const hashedPassword = await hashPassword(password);

		const newUser = await prisma.user.create({
			data:
			{
				username: cleanUsername,
				email: cleanEmail,
				password: hashedPassword,
			},
			select:
			{
				id: true,
				username: true,
				email: true,
				status: true,
				createdAt: true,
			}
		})

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

		const user = await prisma.user.findFirst({
			where: {
				OR: [
					{ email: cleanIdentifier },
					{ username: cleanIdentifier }
				]
			}
		});

		if (!user)
			return (reply.status(404).send({ error: "User not found" }));

		const isValidPassword = await checkPassword(password, user.password);
		if (!isValidPassword)
			return (reply.status(401).send({ error: "User not found" }));

		if (user.twoFAEnabled) {
			const method = user.twoFAMethod as "email" | "sms" | "totp";
			const destination = method === "email" ? user.email : undefined;

			const secretOrCode = twofa.generate2FA(user.id, method, destination);
			await twofa.send2FACode(user.id);

			return reply.send({
				message: "2FA required",
				userId: user.id,
				method,
				qrCode: method === "totp" ? secretOrCode : undefined
			});
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { status: 'ONLINE' },
		});

		const accessToken = signAccessToken(user.id, false);
		const refreshToken = signRefreshToken(user.id);

		return (reply.send(
			{
				message: "Login successful",
				user: {
					id: user.id,
					username: user.username,
					email: user.email
				},
				tokens: {
					accessToken,
					refreshToken
				},
			}));
	}
	catch (err) {
		req.log.error(err);
		return reply.status(500).send({ error: "Internal server error" });
	}
});

server.post("/verify-2fa", async (req, reply) => {
	try {
		const { userId, code } = req.body as { userId: number; code: string };

		const tokens = twofa.complete2FA(userId, code);

		if (!tokens)
			return reply.status(401).send({ error: "Invalid 2FA code" });

		await prisma.user.update({
			where: { id: userId },
			data: { status: 'ONLINE' },

		});

		return reply.send({
			message: "2FA successful",
			tokens
		});
	}
	catch (err) {
		req.log.error(err);
		return reply.status(500).send({ error: "Internal server error" });
	}
});

server.post("/refresh", async (req, reply) => {
	try {
		const { refreshToken } = req.body as { refreshToken: string; };
		const payload = verifyToken(refreshToken);

		if (!payload || payload.tokenType !== "refresh")
			return reply.status(401).send({ error: "Invalid refresh token" });

		const newAccess = signAccessToken(payload.sub, true);
		return reply.send({ accessToken: newAccess });

	} catch (err) {
		req.log.error(err);
		return reply.status(500).send({ error: "Internal server error" });
	}
});


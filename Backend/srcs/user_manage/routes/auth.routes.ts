import { FastifyInstance } from "fastify";
import { AuthService } from "../services/auth.services.js";
import { signAccessToken, signRefreshToken } from "../../module_security/jwtUtils.js";
import { twoFAService } from "../../module_security/2FA.js";

const twofa = new twoFAService();

interface RegisterBody {
	userId: number;
	identifier: string;
	username: string;
	email: string;
	password: string;
}

type TwoFAMethod = "email" | "sms" | "totp";

function assertTwoFAMethod(method: string | null): TwoFAMethod {
	if (method === "email" || method === "sms" || method === "totp") return method;
	throw new Error("Invalid 2FA method");
}

export default async function authRoutes(fastify: FastifyInstance) {
	const authService = new AuthService();

	fastify.post("/register", async (req, reply) => {
		try {
			const { username, email, password } = req.body as RegisterBody;
			const user = await authService.register(username, email, password);
			return (reply.status(201).send({ user }));
		} catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});

	fastify.post("/login", async (req, reply) => {
		try {
			const { identifier, password } = req.body as RegisterBody;
			const user = await authService.login(identifier, password);

			if (user.isTwoFAEnabled) {

				const twoFAMethod = assertTwoFAMethod(user.twoFAMethod);
				await twofa.generate2FA(user.id, twoFAMethod, user.email);
				await twofa.send2FACode(user.id);

				return (reply.status(200).send({ message: "2FA required", userId: user.id }));
			}

			const accessToken = signAccessToken(user.id, true);
			const refreshToken = signRefreshToken(user.id);

			reply.setCookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 7
			});

			return reply.send({ user, accessToken });
		}
		catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});

	fastify.post("/logout", async (req, reply) => {
		try {
			const { userId } = req.body as RegisterBody;
			const res = await authService.logout(userId);
			return (reply.send(res));
		}
		catch (err: any) {
			return (reply.status(400).send({ error: err.message }));
		}
	});
}

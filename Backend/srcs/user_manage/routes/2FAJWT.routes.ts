import { FastifyInstance } from "fastify";
import prisma from "../prisma/client.js";
import { twoFAService } from "../../module_security/2FA.js";
import { verifyToken, signAccessToken, signRefreshToken } from "../../module_security/jwtUtils.js";

const twofa = new twoFAService();


export default async function twofaRoutes(fastify: FastifyInstance) {

	fastify.post("/verify-totp", async (req, reply) => {
		try {
			const { twoFAToken, code } = req.body as { twoFAToken: string; code: string };

			if (!twoFAToken)
				return reply.status(401).send({ error: "Missing 2FA token" });

			const payload = verifyToken(twoFAToken);
			if (!payload || payload.twoFA !== false)
				return reply.status(401).send({ error: "Invalid token" });

			const userId = payload.sub;
			if (!code) return reply.status(400).send({ error: "QR code required" });

			const isValid = await twofa.verifyTOTP(userId, code);
			if (!isValid) return reply.status(400).send({ error: "Invalid QR code" });

			const accessToken = signAccessToken(userId, true);
			const refreshToken = signRefreshToken(userId);

			reply.setCookie("refreshToken", refreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 7
			});
			await prisma.user.update({
				where: { id: userId },
				data: { status: "ONLINE" },
			});

			return reply.send({ message: "QR code verified", accessToken });
		} catch (err) {
			req.log.error(err);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});


	fastify.post("/enable-totp", async (req, reply) => {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken)
				return reply.status(401).send({ error: "Unauthorized" });

			const payload = verifyToken(refreshToken);
			if (!payload || payload.tokenType !== "refresh")
				return reply.status(401).send({ error: "Invalid token" });

			const userId = payload.sub;
			const { code } = req.body as { code: string };

			if (!code)
				return reply.status(400).send({ error: "QR code required" });

			const ok = await twofa.enableTOTP(userId, code);

			if (!ok)
				return reply.status(400).send({ error: "Invalid QR code" });

			await prisma.user.update({
				where: { id: userId },
				data: { isTwoFAEnabled: true, twoFAMethod: "qr" }
			});

			return reply.send({ message: "QR code enabled successfully" });
		}
		catch (err) {
			req.log.error(err);
			return reply.status(500).send({ error: "Internal server error" });
		}
	});


	fastify.post("/disable-2fa", async (req, reply) => {
		try {
			console.log("disable-2FA route called");

			const refreshToken = req.cookies.refreshToken;
			req.log.info(`Refresh token: ${req.cookies.refreshToken}`);

			if (!refreshToken)
				return reply.status(401).send({ error: "Unauthorized" });

			const payload = verifyToken(refreshToken);
			req.log.info(`Token payload: ${JSON.stringify(payload)}`);

			if (!payload || payload.tokenType !== "refresh")
				return (reply.status(401).send({ error: "Invalid refresh token" }));

			const userId = payload.sub;
			await prisma.user.update({
				where: { id: userId },
				data: { isTwoFAEnabled: false, twoFAMethod: null },
			});
			return reply.send({ message: "2FA disabled successfully" });
		} catch (err) {
			req.log.error(err);
			return reply.status(500).send({ error: "Internal server error" });
		}
	})

	fastify.post("/enable-2fa", async (req, reply) => {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken)
				return reply.status(401).send({ error: "Unauthorized or missing refresh token" });

			const payload = verifyToken(refreshToken);

			if (!payload || payload.tokenType !== "refresh")
				return (reply.status(401).send({ error: "Invalid refresh token" }));

			const userId = payload.sub;
			const { type, destination } = req.body as { type: "email" | "sms" | "qr", destination?: string };

			if (!["email", "sms", "qr"].includes(type))
				return reply.status(400).send({ error: "Invalid 2FA type" });

			if (type === "qr") {
				const totpData = await twofa.generateTOTPSecret(userId);

				await prisma.twoFA.upsert({
					where: { userId },
					update: { method: "qr", destination: null },
					create: { userId, method: "qr", destination: null },
				});

				await prisma.user.update({
					where: { id: userId },
					data: {
						isTwoFAEnabled: true,
						twoFAMethod: "qr",
						twoFAdestination: null
					}
				});

				return reply.send({
					message: "2FA QR code enabled successfully",
					method: type,
					otpauthURL: totpData.otpauthURL,
					qrCode: totpData.qrCode
				});
			}
			if (!destination)
				return reply.status(400).send({ error: "Destination is required" });

			await prisma.twoFA.upsert({
				where: { userId },
				update: { method: type, destination },
				create: { userId, method: type, destination },
			});

			await prisma.user.update({
				where: { id: userId },
				data: {
					isTwoFAEnabled: true,
					twoFAMethod: type,
					twoFAdestination: destination
				}
			});
		} catch (err) {
			req.log.error(err);
			return (reply.status(500).send({ error: "Internal server error" }));
		}
	})
	fastify.post("/verify-2fa", async (req, reply) => {
		try {
			const { userId, code } = req.body as { userId: number; code: string };

			const tokens = await twofa.complete2FA(userId, code);

			if (!tokens)
				return (reply.status(401).send({ error: "Invalid 2FA code" }));

			await prisma.user.update({
				where: { id: userId },
				data: { status: "ONLINE" },
			});

			reply.setCookie("refreshToken", tokens.refreshToken, {
				httpOnly: true,
				secure: true,
				sameSite: "lax",
				path: "/",
				maxAge: 60 * 60 * 24 * 7
			});

			return (reply.send({
				message: "2FA successful",
				accessToken: tokens.accessToken
			}));
		}
		catch (err) {
			req.log.error(err);
			return (reply.status(500).send({ error: "Internal server error" }));
		}
	});

	fastify.post("/refresh", async (req, reply) => {
		try {
			const refreshToken = req.cookies.refreshToken;
			if (!refreshToken)
				return reply.status(401).send({ error: "Missing refresh token" });

			const payload = verifyToken(refreshToken);

			if (!payload || payload.tokenType !== "refresh")
				return (reply.status(401).send({ error: "Invalid refresh token" }));

			const newAccess = signAccessToken(payload.sub, true);
			return (reply.send({ accessToken: newAccess }));
		}
		catch (err) {
			req.log.error(err);
			return (reply.status(500).send({ error: "Internal server error" }));
		}
	});
}

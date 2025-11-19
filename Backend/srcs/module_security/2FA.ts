import speakeasy from "speakeasy";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { signAccessToken, signRefreshToken } from "./jwtUtils.js";
import prisma from "../user_manage/prisma/client.js";

export type twoFAMethod = "email" | "sms" | "totp";

export class twoFAService {

	async generate2FA(userId: number, method: twoFAMethod, destination?: string): Promise<string> {

		let secret: string | undefined = undefined;
		let code: string | undefined = undefined;
		let expiresAt: Date | undefined = undefined;

		if (method === "totp") {
			const totpSecret = speakeasy.generateSecret({ length: 20 });
			secret = totpSecret.base32;
		}
		else {
			code = Math.floor(100000 + Math.random() * 900000).toString();
			expiresAt = new Date(Date.now() + 5 * 60 * 1000);
		}

		await prisma.twoFA.upsert({
			where: { userId },
			update: {
				method,
				secret: secret ?? null,
				code: code ?? null,
				expiresAt: expiresAt ?? null,
				destination: destination ?? null
			},
			create: {
				userId,
				method,
				secret: secret ?? null,
				code: code ?? null,
				expiresAt: expiresAt ?? null,
				destination: destination ?? null
			}
		});


		return secret ?? code!;
	}

	async send2FACode(userId: number): Promise<string | void> {
		const data = await prisma.twoFA.findUnique({ where: { userId } });
		if (!data)
			throw new Error("2FA data not found");

		if (data.method === "email") {
			const transporter = nodemailer.createTransport({
				service: "gmail",
				auth: {
					user: process.env.APP_EMAIL,
					pass: process.env.APP_PASSWORD,
				},
			});
			const mailOptions = {
				from: `"Transcendence" <${process.env.APP_EMAIL}>`,
				to: data.destination ?? "",
				subject: "Transcendence - Your 2FA Code",
				text: `Your 2FA code is: ${data.code}. It will expire in 5 minutes.`,
			};
			await transporter.sendMail(mailOptions);
			console.log('[2FA Email] Code sent to', data.destination);
		}

		else if (data.method === "sms") {
			console.log('[2FA SMS] Code sent to', data.destination, ':', data.code);
		}

		else if (data.method === "totp") {
			const otpUrl = speakeasy.otpauthURL({
				secret: data.secret as string,
				label: data.destination || "Transcendence",
				issuer: "Transcendence",
				encoding: "base32",
			});
			const qrCodeURL = await QRCode.toDataURL(otpUrl);
			return qrCodeURL;
		}
	}

	async verify2FACode(userId: number, code: string): Promise<boolean> {
		const data = await prisma.twoFA.findUnique({ where: { userId } });
		if (!data)
			return false;

		if (data.method === "totp" && data.secret) {
			const verified = speakeasy.totp.verify(
				{
					secret: data.secret,
					encoding: "base32",
					token: code,
					window: 1
				});
			return Boolean(verified);
		}
		else if ((data.method === "email" || data.method === "sms") && data.code && data.expiresAt) {
			return data.code === code && new Date() <= data.expiresAt;
		}

		return false;
	}

	async complete2FA(userId: number, code: string) {
		const verified = this.verify2FACode(userId, code);
		if (!verified)
			return null;

		const accessToken = signAccessToken(userId, true);
		const refreshToken = signRefreshToken(userId);

		await prisma.twoFA.delete({ where: { userId } });

		return { accessToken, refreshToken };
	}
}

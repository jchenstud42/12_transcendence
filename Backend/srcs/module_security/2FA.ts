import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { signAccessToken, signRefreshToken } from "./jwtUtils.js";

export type twoFAMethod = "email" | "sms" | "totp";

interface User2FA {
	method: twoFAMethod;
	secret?: string;
	code?: string;
	expiresAt?: Date;
	destination?: string | undefined;
}

export type twoFATokens = {
	accessToken: string;
	refreshToken: string;
}

/*En attendant la DB on fait la map*/
export class twoFAService {
	private user2FAData: Map<number, User2FA> = new Map();

	generate2FA(userId: number, method: twoFAMethod, destination?: string): string {
		if (method === "totp") {
			const secret = speakeasy.generateSecret({ length: 20 });
			this.user2FAData.set(userId, { method, secret: secret.base32 });
			return secret.base32;
		}
		else {
			const code = Math.floor(100000 + Math.random() * 900000).toString();
			const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
			this.user2FAData.set(userId, { method, code, expiresAt, destination });
			return code;
		}
	}

	async send2FACode(userId: number): Promise<string | void> {
		const data = this.user2FAData.get(userId);
		if (!data)
			throw new Error("2FA data not found");
		if (data.method === "email") {
			await ??? ();
		}
		else if (data.method === "sms") {
			await ??? (); // TWILIO MAIS PAYANT SINN ON SIMULE JUSTE L"ENVOI
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

	verify2FACode(userId: number, code: string): boolean {
		const data = this.user2FAData.get(userId);
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

}

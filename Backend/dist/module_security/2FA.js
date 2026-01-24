import speakeasy from "speakeasy";
import QRCode from "qrcode";
import nodemailer from "nodemailer";
import { signAccessToken, signRefreshToken } from "./jwtUtils.js";
import prisma from "../user_manage/prisma/client.js";
export class twoFAService {
    // On genere un secret unique ainsi que son URL pour le transformer en QR code grace a speakeasy,
    // on met a jour l'user avec ce secret, puis une fois fait on le transforme en QR code grace a la librairie qrcode
    // On return le secret, le qr et le lien URL cree par speakeasy, tout ca pour pouvoir l'utiliser dans la route enable 2fa!
    async generateTOTPSecret(userId) {
        const totpSecret = speakeasy.generateSecret({ name: "Transcendence", length: 20 });
        await prisma.twoFA.upsert({
            where: { userId },
            update: {
                method: "qr",
                secret: totpSecret.base32,
                code: null,
                expiresAt: null,
                destination: null
            },
            create: {
                userId,
                method: "qr",
                secret: totpSecret.base32,
                code: null,
                expiresAt: null,
                destination: null
            }
        });
        const qrCode = await QRCode.toDataURL(totpSecret.otpauth_url);
        return {
            secret: totpSecret.base32,
            otpauthURL: totpSecret.otpauth_url,
            qrCode,
        };
    }
    // On genere le code avec un random number, on dit que le code expire dans 5minutes, on met a jour l'user avec ces informations!
    async generate2FA(userId, method, destination) {
        let secret = undefined;
        let code = undefined;
        let expiresAt = undefined;
        code = Math.floor(100000 + Math.random() * 900000).toString();
        expiresAt = new Date(Date.now() + 5 * 60 * 1000);
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
        return secret ?? code;
    }
    /*
    Ici on regarde le type de 2FA utilise par l'user (sms, mail, qr), et on envoie le code selon le type de methode choisi.

    Si mail on utilise la librairie nodemailer : ca nous permet d'envoyer des mails de maniere secure et sans dependences requises,
    Premierement on creer le transporter (l'email qui envoie), donc notre mail et on a besoin du password de l'app
    (un token genere par gmail ici, pas le vrai mdp du mail), on rempli le mail avec le sujet le body etc et on l'envoie!

    Si sms on simule l'envoi car les services pour envoyer de vrais sms sont payants, donc on verifie juste avec la console si le sms est envoye
    au bon numero (destination), on pourrait facilement implementer twilio, un service d'envoi de sms qui genere egalement un numero de telephone
    pour ne pas avoir a envoyer les sms via son telephone perso, il s'implement assez facilement de ce que j'ai vu a la maniere de nodemailer

    Si qr code choisi on refait un URL pour qrcode grace a speakeasy, et on creer le qrcode grace a cet URL, on retourne le QR
    apres bah l'user a juste a scan et ca lui affiche son code sur son appli d'authentification
    */
    async send2FACode(userId) {
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
            // ==========================================================================================================================================
            // TWILIO POUR VRAI SMS ICI, MAIS C PAYANT DONC ON SIMULE, LAISSEZ LE CODE PLS POUR MONTRER QU'ON PEUT IMPLEMENTER LE VRAI SERVICE QD MEME
            // ==========================================================================================================================================
            // Evidemment faut installer le package npm install twilio et changer les env
            /*
                import Twilio from "twilio";

                const client = Twilio(
                    process.env.TWILIO_SID,
                    process.env.TWILIO_TOKEN
                );

                await client.messages.create({
                    to: data.destination ?? "",
                    from: process.env.TWILIO_PHONE,
                    body: `Your Transcendence 2FA code is: ${data.code}.`
                });

                console.log('[2FA SMS - Twilio] Real SMS sent to', data.destination);
            */
        }
        else if (data.method === "qr") {
            const otpUrl = speakeasy.otpauthURL({
                secret: data.secret,
                label: "Transcendence",
                issuer: "Transcendence",
                encoding: "base32",
            });
            const qrCodeURL = await QRCode.toDataURL(otpUrl);
            return qrCodeURL;
        }
    }
    /**
     * Fonction juste pour verifier si le code rentre est le bon code.
     * - On cherche l'user avec son Id, si qr code on verifie avec la fonction speakeasy verify si le secret est bien le meme
     * - Pour sms et mail on check si c'est strictement le meme code et si il n'a pas expire
     */
    async verify2FACode(userId, code) {
        const data = await prisma.twoFA.findUnique({ where: { userId } });
        if (!data)
            return false;
        if (data.method === "qr" && data.secret) {
            return speakeasy.totp.verify({
                secret: data.secret,
                encoding: "base32",
                token: code,
                window: 1
            });
        }
        else if ((data.method === "email" || data.method === "sms") && data.code && data.expiresAt) {
            return data.code === code && new Date() <= data.expiresAt;
        }
        return false;
    }
    /**
     * Une fois le code rentre et qu'il est bien verifie comme etant le meme, on peut signer les tokens JWT pour cet user.
     * On supprime les infos du twofa pour cet user (le code, le secret etc car ca sera pas le meme au prochain login)
     * On return les tokens pour que l'user puisse se connecter
     */
    async complete2FA(userId, code) {
        const verified = await this.verify2FACode(userId, code);
        if (!verified)
            return null;
        const accessToken = signAccessToken(userId, true);
        const refreshToken = signRefreshToken(userId);
        await prisma.twoFA.delete({ where: { userId } });
        return { accessToken, refreshToken };
    }
}
//# sourceMappingURL=2FA.js.map
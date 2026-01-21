import prisma from "../prisma/client.js";
import { twoFAService } from "../../module_security/2FA.js";
import { verifyToken, signAccessToken, signRefreshToken } from "../../module_security/jwtUtils.js";
import { sanitizeInput, validateEmail } from "../../security/inputSecurity.js";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../../module_security/jwtUtils.js";
const twofa = new twoFAService();
export default async function twofaRoutes(fastify) {
    /**  La rouuute pour verifier le QR code lors de l'activation du 2FA et lors du login !
     *  On verifie si l'utilisateur a bien ses tokens valide pour pouvoir activer la 2FA (si il est bien co, pas expire...)
     *	Si tout est bon on peut verifier le code rentre par l'user avec verify2FACode, on met a jour le status de l'user dans prisma
        (que sa 2FA est active...)
     * Si l'user avait deja active la 2FA et qu'on verifie lors du login, alors on lui donne ses JWT token et on lui met le status ONLINE
    */
    fastify.post("/verify-totp", async (req, reply) => {
        try {
            const { twoFAtoken, code } = req.body;
            if (!code)
                return reply.status(400).send({ error: "Code required" });
            if (!/^\d{6}$/.test(code)) {
                return reply.status(400).send({ error: "Invalid code format" });
            }
            let userId;
            let isSetupMode = false;
            if (twoFAtoken) {
                let payload;
                try {
                    payload = jwt.verify(twoFAtoken, JWT_SECRET);
                }
                catch (e) {
                    return reply.status(401).send({ error: "Invalid or expired 2FA token" });
                }
                userId = payload.sub;
            }
            else {
                try {
                    const refreshToken = req.cookies.refreshToken;
                    if (!refreshToken) {
                        return reply.status(401).send({ error: "Missing authentication" });
                    }
                    const payload = jwt.verify(refreshToken, JWT_SECRET);
                    userId = payload.sub;
                    isSetupMode = true;
                }
                catch (e) {
                    return reply.status(401).send({ error: "Invalid session" });
                }
            }
            const isValid = await twofa.verify2FACode(userId, code);
            if (!isValid)
                return reply.status(400).send({ error: "Invalid QR code" });
            if (isSetupMode) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        isTwoFAEnabled: true,
                        twoFAMethod: "qr"
                    },
                });
                return reply.send({
                    message: "2FA enabled successfully",
                    success: true
                });
            }
            else {
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
                const user = await prisma.user.findUnique({
                    where: { id: userId },
                    select: { id: true, username: true, email: true, avatar: true }
                });
                return reply.send({
                    message: "QR code verified",
                    accessToken,
                    user
                });
            }
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    /**
     * La route pour desactiver la 2FA :
     * On verifie si l'user a bien son token de valide, si oui on peut changer la table SQL et mettre sses status 2FA a false/null
     * indiquant qu'il n'y a pas de 2FA active sur son compte.
    */
    fastify.post("/disable-2fa", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return (reply.status(401).send({ error: "Invalid refresh token" }));
            const userId = payload.sub;
            await prisma.user.update({
                where: { id: userId },
                data: { isTwoFAEnabled: false, twoFAMethod: null },
            });
            return reply.send({ message: "2FA disabled successfully" });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    /**
     * La route pour activer la 2FA, on verifie le token voir si il est valide
     * Si oui on regarde quel type de 2FA a choisi l'utilisateur (sms, mail 2fa)
     * Si l'utilisateur a choisi le QR code alors il faut generer le QR code pour que l'utilisateur le scan une premiere fois
     * pour stocker le code dans son application d'authentification et puisse se connecter pour les prochaines visites.
     *
     * Si l'utilisateur a choisi sms ou email il sera demande d'entre le numero de tel ou le mail, on verifie l'input de l'utilisateur
     * pour des mesures de securite (attaques XSS)
     * si tout est bon on met a jour la ligne user et la ligne 2fa dans la database, avec le type de 2fa choisi, la destination et les boolean en true
    */
    fastify.post("/enable-2fa", async (req, reply) => {
        try {
            const refreshToken = req.cookies.refreshToken;
            if (!refreshToken)
                return reply.status(401).send({ error: "Unauthorized or missing refresh token" });
            const payload = verifyToken(refreshToken);
            if (!payload || payload.tokenType !== "refresh")
                return reply.status(401).send({ error: "Invalid refresh token" });
            const userId = payload.sub;
            const { type, destination } = req.body;
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
                        twoFAMethod: "qr",
                        twoFAdestination: null
                    }
                });
                return reply.send({
                    message: "Scan the QR code and enter the verification code",
                    method: type,
                    otpauthURL: totpData.otpauthURL,
                    qrCode: totpData.qrCode
                });
            }
            if (!destination)
                return reply.status(400).send({ error: "Destination is required" });
            const dest = sanitizeInput(destination);
            if (type === "email")
                if (!validateEmail(dest))
                    return reply.status(400).send({ error: "Invalid email address" });
            if (type === "sms") {
                const phoneRegex = /^(\+[1-9]\d{7,14}|0\d{8,9})$/;
                if (!phoneRegex.test(dest))
                    return reply.status(400).send({ error: "Invalid phone number" });
            }
            await prisma.twoFA.upsert({
                where: { userId },
                update: { method: type, destination: dest },
                create: { userId, method: type, destination: dest },
            });
            await prisma.user.update({
                where: { id: userId },
                data: {
                    isTwoFAEnabled: true,
                    twoFAMethod: type,
                    twoFAdestination: dest
                }
            });
            return reply.send({
                message: "2FA enabled successfully",
                method: type,
                destination: dest
            });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    /**
     * La route pour verifier le 2fa lors du login, on verifie si le twofatoken (un token temporaire creer juste le temps que lq personne finisse de se log in
     * via le 2FA) est valide, si oui on envoie vers la fonction complete2FA qui verifiera le code entree et signera les vrais tokens JWT.
    */
    fastify.post("/verify-2fa", async (req, reply) => {
        try {
            const { code, twoFAtoken } = req.body;
            if (!twoFAtoken)
                return reply.status(400).send({ error: "Missing 2FA token" });
            let payload;
            try {
                payload = jwt.verify(twoFAtoken, JWT_SECRET);
            }
            catch (e) {
                return reply.status(401).send({ error: "Invalid or expired 2FA token" });
            }
            const userId = payload.userId ?? payload.sub;
            if (!userId)
                return reply.status(400).send({ error: "Invalid token: no userId" });
            const tokens = await twofa.complete2FA(userId, code);
            if (!tokens)
                return reply.status(401).send({ error: "Invalid 2FA code" });
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
            return reply.send({
                message: "2FA successful",
                accessToken: tokens.accessToken,
                user: await prisma.user.findUnique({ where: { id: userId } })
            });
        }
        catch (err) {
            req.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    /**
     * Route refreshh, ici c'est pour que le refreshtoken (qui dure 7jours si on se delog pas) puisse recreer
     * des accesstoken, c'est ce qui permet a l'utilisateur de rester connecter etc!
     *
     * On regarde si le refresh est valide -> si oui on signe un nouveau JWT access.
    */
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
//# sourceMappingURL=2FAJWT.routes.js.map
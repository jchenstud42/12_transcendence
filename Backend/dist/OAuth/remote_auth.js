import prisma from "../user_manage/prisma/client.js";
import { signAccessToken, signRefreshToken } from "../module_security/jwtUtils.js";
import { twoFAService } from "../module_security/2FA.js";
import crypto from "crypto";
const twofa = new twoFAService();
const INTRA_AUTHORIZE = "https://api.intra.42.fr/oauth/authorize";
const INTRA_TOKEN = "https://api.intra.42.fr/oauth/token";
const INTRA_ME = "https://api.intra.42.fr/v2/me";
export default async function remoteAuthRoutes(fastify) {
    const clientId = process.env.INTRA_CLIENT_ID || "";
    const clientSecret = process.env.INTRA_CLIENT_SECRET || "";
    const redirectUri = process.env.INTRA_REDIRECT_URI || "https://localhost:8443/oauth/42/callback";
    const frontendUrl = process.env.FRONTEND_URL || "https://localhost:8443";
    if (!clientId || !clientSecret) {
        fastify.log.warn("INTRA_CLIENT_ID or INTRA_CLIENT_SECRET not set. OAuth will fail until configured.");
    }
    fastify.get("/oauth/42", async (req, reply) => {
        if (!clientId)
            return reply.status(500).send({ error: "OAuth not configured (INTRA_CLIENT_ID missing)" });
        const state = crypto.randomBytes(24).toString("hex");
        reply.setCookie("oauth_state", state, {
            httpOnly: true,
            secure: true,
            sameSite: "lax",
            path: "/",
            maxAge: 5 * 60,
        });
        const params = new URLSearchParams();
        params.set("client_id", clientId);
        params.set("redirect_uri", redirectUri);
        params.set("response_type", "code");
        params.set("scope", "public");
        params.set("state", state);
        fastify.log.info("redirecting to 42 authorize (state=%s)", state);
        return reply.redirect(INTRA_AUTHORIZE + "?" + params.toString());
    });
    fastify.get("/oauth/42/callback", async (req, reply) => {
        const code = req.query.code;
        const returnedState = req.query.state;
        const cookieState = req.cookies?.oauth_state;
        if (!code)
            return reply.status(400).send({ error: "Missing code" });
        if (!returnedState || !cookieState || returnedState !== cookieState) {
            fastify.log.warn("OAuth state mismatch. returned=%s cookie=%s", returnedState, cookieState);
            return reply.status(403).send({ error: "Invalid OAuth state" });
        }
        reply.clearCookie("oauth_state", { path: "/" });
        try {
            const tokenParams = new URLSearchParams();
            tokenParams.set("grant_type", "authorization_code");
            tokenParams.set("client_id", clientId);
            tokenParams.set("client_secret", clientSecret);
            tokenParams.set("code", code);
            tokenParams.set("redirect_uri", redirectUri);
            fastify.log.info("callback hit");
            const tokenHeaders = {
                "Content-Type": "application/x-www-form-urlencoded",
            };
            if (clientId && clientSecret) {
                try {
                    tokenHeaders["Authorization"] = "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64");
                }
                catch (e) {
                    fastify.log.warn("Failed to create Basic auth header for token exchange: %s", String(e));
                }
            }
            const tokenRes = await fetch(INTRA_TOKEN, {
                method: "POST",
                headers: tokenHeaders,
                body: tokenParams.toString(),
            });
            if (!tokenRes.ok) {
                const text = await tokenRes.text();
                fastify.log.error("42 token exchange failed (status %s): %s", String(tokenRes.status), text);
                return reply.status(502).send({ error: "Token exchange failed", detail: text });
            }
            const tokenJson = await tokenRes.json();
            const access_token = tokenJson.access_token;
            if (!access_token)
                return reply.status(502).send({ error: "No access token" });
            const profileRes = await fetch(INTRA_ME, {
                headers: { Authorization: "Bearer " + access_token },
            });
            if (!profileRes.ok) {
                const text = await profileRes.text();
                fastify.log.error("42 profile fetch failed: " + text);
                return reply.status(502).send({ error: "Failed fetching profile" });
            }
            const profile = await profileRes.json();
            const email = profile.email;
            const username = profile.login ||
                profile.usual_full_name ||
                "intra_" + profile.id;
            if (!email)
                return reply.status(400).send({ error: "No email from provider" });
            let user = await prisma.user.findUnique({
                where: { oauth42Id: profile.id.toString() },
            });
            if (!user) {
                user = await prisma.user.findUnique({ where: { email } });
            }
            if (!user) {
                user = await prisma.user.create({
                    data: {
                        username: username,
                        email: email,
                        password: null,
                        oauth42Id: profile.id.toString(),
                        status: "ONLINE",
                    },
                });
            }
            else {
                if (!user.oauth42Id) {
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { oauth42Id: profile.id.toString() },
                    });
                }
                await prisma.user.update({
                    where: { id: user.id },
                    data: { status: "ONLINE" },
                });
            }
            if (user.isTwoFAEnabled) {
                const twoFAtoken = signAccessToken(user.id, false);
                if (user.twoFAMethod === "email" || user.twoFAMethod === "sms") {
                    await twofa.generate2FA(user.id, user.twoFAMethod, user.twoFAdestination ?? undefined);
                    await twofa.send2FACode(user.id);
                }
                const params = new URLSearchParams();
                params.set("userId", String(user.id));
                params.set("twoFAtoken", twoFAtoken);
                params.set("method", user.twoFAMethod || "qr");
                return reply.redirect(`${frontendUrl}/?${params.toString()}`);
            }
            const accessToken = signAccessToken(user.id, true);
            const refreshToken = signRefreshToken(user.id);
            reply.setCookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: true,
                sameSite: "lax",
                path: "/",
                maxAge: 60 * 60 * 24 * 7,
            });
            return reply.redirect(frontendUrl + "/#accessToken=" + accessToken);
        }
        catch (err) {
            fastify.log.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
}
//# sourceMappingURL=remote_auth.js.map
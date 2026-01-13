import { verifyToken } from "./jwtUtils.js";
export function authentizer(twoFArequired = false) {
    return (request, reply, done) => {
        try {
            let token;
            if (request.cookies?.accessToken) {
                token = request.cookies.accessToken;
            }
            else {
                const authHeader = request.headers["authorization"];
                if (authHeader && authHeader.startsWith("Bearer "))
                    token = authHeader.split(" ")[1];
            }
            if (!token) {
                return reply.status(401).send({ error: "Missing token" });
            }
            const payload = verifyToken(token);
            if (!payload) {
                return reply.status(401).send({ error: "Invalid token" });
            }
            if (twoFArequired && !payload.twoFA) {
                return reply.status(403).send({ error: "2FA not completed" });
            }
            request.user = { id: payload.sub };
            done();
        }
        catch (err) {
            return reply.status(500).send({ error: "internal server error" });
        }
    };
}
//# sourceMappingURL=middlAuth.js.map
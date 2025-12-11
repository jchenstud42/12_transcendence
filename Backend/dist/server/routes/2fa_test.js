import { twoFAService } from "../../module_security/2FA.js";
const twofa = new twoFAService();
export default async function twofaTestRoutes(fastify) {
    fastify.post('/generate-2fa-test/:userId', async (request, reply) => {
        try {
            const userId = Number(request.params.userId);
            if (!userId)
                return reply.status(400).send({ error: "Missing userId" });
            const code = twofa.generate2FA(userId, "email", "test@example.com");
            console.log(`[TEST 2FA] userId=${userId}, code=${code}`);
            await twofa.send2FACode(userId);
            return reply.send({ message: "2FA code generated", code });
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
    // MARCHE PAS CAR PAS DE BODY MAIS NORMAL
    fastify.post('/verify-2fa/:userId', async (request, reply) => {
        try {
            const userId = Number(request.params.userId);
            const { code } = request.body;
            if (!userId || !code)
                return reply.status(400).send({ error: "Missing parameters" });
            const result = twofa.complete2FA(userId, code);
            if (!result)
                return reply.status(401).send({ error: "Invalid 2FA code" });
            return reply.send(result);
        }
        catch (err) {
            console.error(err);
            return reply.status(500).send({ error: "Internal server error" });
        }
    });
}
//# sourceMappingURL=2fa_test.js.map
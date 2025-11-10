import Fastify from 'fastify';
// Creation de l'instance du serv Fastify
// logger : active les logs console, pratique pour debugger
const fastify = Fastify({ logger: true });
const PORT = 3000;
// Route simple (.get, .post, .put, ...)
fastify.get('/', async (request, reply) => {
    return { message: 'Fastify fonctionne, transcendence incoming!' };
});
// Démarrage du server
const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Serveur démarré sur http://localhost:${PORT}`);
    }
    catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=main.js.map
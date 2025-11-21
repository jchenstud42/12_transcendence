import { buildServer } from './server/buildServer.js';

const PORT = 3000;

// Démarrage du server
const start = async (): Promise<void> => {
	try {
		const fastify = await buildServer();
		await fastify.listen({ port: PORT, host: '0.0.0.0' });
		console.log(`Serveur démarré sur http://localhost:${PORT}`);
	} catch (err) {
		console.log(err);
		process.exit(1);
	}
};

start();

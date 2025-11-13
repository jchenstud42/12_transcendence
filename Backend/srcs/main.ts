import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import itemsRoutes from './tests/routes/items.js';


// Creation de l'instance du serv Fastify
// logger : active les logs console, pratique pour debugger
const fastify: FastifyInstance = Fastify({ logger: true });
const PORT = 3000;

// Swagger : Plugin Fastify permettant de documenter, visualiser
// tester et standardiser son API
await fastify.register(swagger, {
	openapi: {
		info: {
			title: 'Transcendence',
			description: 'Tests tests',
			version: '1.0.0',
		},
	},
});

await fastify.register(swaggerUI, {
	routePrefix: '/docs',
});

// Route simple (.get, .post, .put, ...)
fastify.get('/', async (request, reply) => {
	return { message: 'Fastify fonctionne, transcendence incoming!' };
});

// Integrez vos routes ici
fastify.register(itemsRoutes, { prefix: '/items' });

// Démarrage du server
const start = async (): Promise<void> => {
	try {
		await fastify.listen({ port: PORT, host: '0.0.0.0' });
		console.log(`Serveur démarré sur http://localhost:${PORT}`);
	} catch (err) {
		fastify.log.error(err);
		process.exit(1);
	}
};

start();

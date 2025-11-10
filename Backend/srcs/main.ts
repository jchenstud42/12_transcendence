import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { items } from './tests/items.js';

// Creation de l'instance du serv Fastify
// logger : active les logs console, pratique pour debugger
const fastify: FastifyInstance = Fastify({ logger: true });
const PORT = 3000;

// Route simple (.get, .post, .put, ...)
fastify.get('/', async (request, reply) => {
	return { message: 'Fastify fonctionne, transcendence incoming!' };
});

// Route simple renvoyant des objets
fastify.get('/items', async (request, reply) => {
	reply.send(items);
});

fastify.get('/items/:id', async (request, reply) => {
	const { id } = request.params;
	const item = items.find((item) => item.id === id);
	reply.send(item);
});

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

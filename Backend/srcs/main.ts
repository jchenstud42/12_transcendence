import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import itemsRoutes from './tests/routes/items.js';
import twofaRoutes from './user_manage/routes/2FAJWT.routes.js';
import twofaTestRoutes from './tests/routes/2fa_test.js';
import authRoutes from './user_manage/routes/auth.routes.js';
import fastifyCookie from "@fastify/cookie";
import userRoutes from './user_manage/routes/user.routes.js';
import friendRoutes from './user_manage/routes/friend.routes.js';
import matchRoutes from './user_manage/routes/match.routes.js';


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

// if (!process.env.COOKIE_SECRET)
// 	throw new Error("Missing COOKIE_SECRET in environment variables");
// await fastify.register(fastifyCookie, {
// 	secret: process.env.COOKIE_SECRET,
// });

// Route simple (.get, .post, .put, ...)
fastify.get('/', async (request, reply) => {
	return { message: 'Fastify fonctionne, transcendence incoming!' };
});

// Integrez vos routes ici
fastify.register(itemsRoutes, { prefix: '/items' });

// fastify.register(twofaTestRoutes);

fastify.register(authRoutes);

fastify.register(userRoutes, { prefix: '/user' });
fastify.register(friendRoutes, { prefix: '/friend' });
fastify.register(matchRoutes, { prefix: '/match' });

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

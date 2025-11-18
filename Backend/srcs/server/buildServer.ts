import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fastifyBetterSqlite3 from '@punkish/fastify-better-sqlite3';

// Importation des routes
import twofaRoutes from '../user_manage/routes/2FAJWT.routes.js';
import twofaTestRoutes from './routes/2fa_test.js';
import authRoutes from '../user_manage/routes/auth.routes.js';
import fastifyCookie from "@fastify/cookie";
import userRoutes from '../user_manage/routes/user.routes.js';
import friendRoutes from '../user_manage/routes/friend.routes.js';
import matchRoutes from '../user_manage/routes/match.routes.js';
import testsRoutes from './routes/tests.js';



export async function buildServer() {
	const fastify = Fastify({ logger: true });

	// Plugins ---------------------------------------------------------------------------------
	await fastify.register(fastifyBetterSqlite3, {
		pathToDb: "/app/database/database.sqlite",
		betterSqlite3Options: {
			verbose: console.log,
		},
	});

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


	// Creation des tables pour la database ----------------------------------------------------
	fastify.after(() => {
		fastify.betterSqlite3.exec(`
	  CREATE TABLE IF NOT EXISTS users (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		name TEXT NOT NULL
	  );
	`);
	});


	// Routes ----------------------------------------------------------------------------------
	fastify.get('/', async () => { return { message: 'Transcendence!' } });
	fastify.register(testsRoutes)	// test, a retirer
	fastify.register(authRoutes);
	fastify.register(userRoutes, { prefix: '/user' });
	fastify.register(friendRoutes, { prefix: '/friend' });
	fastify.register(matchRoutes, { prefix: '/match' });
	// fastify.register(twofaTestRoutes);


	return (fastify);
}



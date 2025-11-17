import { Database } from "better-sqlite3";

declare module "fastify" {
	interface FastifyInstance {
		betterSqlite3: Database;
	}
}

import { items } from "../data/items.js";
export default async function testsRoutes(fastify) {
    // TESTS ITEM ---------------------------------------------------------------------
    fastify.get('/items/', async (_, reply) => {
        reply.send(items);
    });
    fastify.get('/items/:id', async (request, reply) => {
        const id = Number(request.params.id);
        const item = items.find((item) => item.id === id);
        if (!item) {
            return (reply.code(404).send({ error: 'Item not found' }));
        }
        return (reply.send(item));
    });
    // TESTS USER ----------------------------------------------------------------------
    fastify.get("/test_add-users", async () => {
        const db = fastify.betterSqlite3;
        const testUsers = [{ name: "Mathou Pitchou" }, { name: "Romaingue le p'tit loup" },
            { name: "Palulu is delulu" }, { name: "Dragon de metal aux yeux bleus" }];
        const stmt = db.prepare("INSERT INTO users (name) VALUES (?)");
        testUsers.forEach(user => stmt.run(user.name));
        return { message: "Users insérés" };
    });
    fastify.get("/test_show-users", async () => {
        const db = fastify.betterSqlite3;
        const users = db.prepare("SELECT * FROM users").all();
        return users;
    });
    fastify.get("/test_wipe-users", async () => {
        const db = fastify.betterSqlite3;
        db.prepare("DELETE FROM users").run();
        db.prepare("DELETE FROM sqlite_sequence WHERE name='users'").run();
        return { message: "Tous les utilisateurs ont été supprimés" };
    });
}
//# sourceMappingURL=tests.js.map
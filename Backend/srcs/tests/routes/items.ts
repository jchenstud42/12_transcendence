import { FastifyInstance } from "fastify";
import { Item } from "../types/item.js";
import { items } from "../data/items.js";

export default async function itemsRoutes(fastify: FastifyInstance) {

	// _ : parametre non utilise (ici request)
	fastify.get('/', async (_, reply) => {
		reply.send(items);
	})

	fastify.get<{
		Params: { id: number },
		Reply: Item | { error: string }
	}>('/:id', async (request, reply) => {
		const id = Number(request.params.id);
		const item = items.find((item) => item.id === id);

		if (!item) {
			return (reply.code(404).send({ error: 'Item not found' }));
		}

		return (reply.send(item));
	})
}

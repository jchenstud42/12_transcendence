import { FastifyInstance } from "fastify";
import { FriendService } from "../services/friend.service.js";
import { authentizer } from "../../module_security/middlAuth.js";

interface FriendParams {
	userId: string;
}

interface FriendBody {
	userId: number;
	friendId: number;
}

export default async function friendRoutes(fastify: FastifyInstance) {
	const friendService = new FriendService();

	fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
		const { userId, friendId } = req.body as FriendBody;
		const f = await friendService.addFriend(userId, friendId);
		return (reply.send(f));
	});

	fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
		const friends = await friendService.getFriendsList(Number((req.params as FriendParams).userId));
		return (reply.send(friends));
	});

	fastify.delete("/", { preHandler: [authentizer()] }, async (req, reply) => {
		const { userId, friendId } = req.body as FriendBody;
		const res = await friendService.removeFriend(userId, friendId);
		return (reply.send(res));
	});
}

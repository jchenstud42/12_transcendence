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


	// La route pour envoyer une request d'ami
	fastify.post("/request", { preHandler: [authentizer()] }, async (req, reply) => {
		const { senderId, receiverId } = req.body as { senderId: number; receiverId: number };
		try {
			const request = await friendService.sendFriendRequest(senderId, receiverId);
			return reply.send(request);
		} catch (err: any) {
			return reply.status(400).send({ error: err.message });
		}
	});

	// La route pour recup les demandes d'amis recues par l'userId
	fastify.get("/request/received/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
		const requests = await friendService.getReceivedRequests(Number((req.params as FriendParams).userId));
		return reply.send(requests);
	});

	// La route pour accepter une request d'ami
	fastify.post("/request/accept/:requestId", { preHandler: [authentizer()] }, async (req, reply) => {
		const { userId } = req.body as { userId: number };
		const requestId = Number((req.params as { requestId: string }).requestId);
		try {
			const result = await friendService.acceptFriendRequest(requestId, userId);
			return reply.send({ message: "Friend request accepted", result });
		} catch (err: any) {
			return reply.status(400).send({ error: err.message });
		}
	});

	// La route pour rejeter une request d'ami
	fastify.post("/request/reject/:requestId", { preHandler: [authentizer()] }, async (req, reply) => {
		const { userId } = req.body as { userId: number };
		const requestId = Number((req.params as { requestId: string }).requestId);
		try {
			const result = await friendService.rejectFriendRequest(requestId, userId);
			return reply.send({ message: "Friend request rejected", result });
		} catch (err: any) {
			return reply.status(400).send({ error: err.message });
		}
	});
}

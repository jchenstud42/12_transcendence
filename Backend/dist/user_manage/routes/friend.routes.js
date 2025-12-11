import { FriendService } from "../services/friend.service.js";
import { authentizer } from "../../module_security/middlAuth.js";
export default async function friendRoutes(fastify) {
    const friendService = new FriendService();
    fastify.post("/", { preHandler: [authentizer()] }, async (req, reply) => {
        const { userId, friendId } = req.body;
        const f = await friendService.addFriend(userId, friendId);
        return (reply.send(f));
    });
    fastify.get("/:userId", { preHandler: [authentizer()] }, async (req, reply) => {
        const friends = await friendService.getFriendsList(Number(req.params.userId));
        return (reply.send(friends));
    });
    fastify.delete("/", { preHandler: [authentizer()] }, async (req, reply) => {
        const { userId, friendId } = req.body;
        const res = await friendService.removeFriend(userId, friendId);
        return (reply.send(res));
    });
}
//# sourceMappingURL=friend.routes.js.map
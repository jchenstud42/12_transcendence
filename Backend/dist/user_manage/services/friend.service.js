import prisma from "../prisma/client.js";
export class FriendService {
    async addFriend(userId, friendId) {
        if (userId == friendId)
            throw new Error("You cannot add yourself as a friend");
        const existing = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId }
                ]
            }
        });
        if (existing)
            throw new Error("Already friends");
        //prisma.$transaction permet de faire plusieurs actions en meme temps, et si l'une echoue, ca rollback et rien n'est accepte
        return (await prisma.$transaction([
            prisma.friend.create({ data: { userId, friendId } }),
            prisma.friend.create({ data: { userId: friendId, friendId: userId } }),
        ]));
    }
    async removeFriend(userId, friendId) {
        await prisma.friend.deleteMany({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });
        return ({ message: "Friend removed successfully" });
    }
    async getFriendsList(userId) {
        const friends = await prisma.friend.findMany({
            where: { userId },
            include: {
                friend: { select: { id: true, username: true, status: true } },
            },
        });
        return (friends.map((f) => f.friend));
    }
}
//# sourceMappingURL=friend.service.js.map
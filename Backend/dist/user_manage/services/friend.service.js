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
    /**
     * On enleve l'ami mais on enleve aussi la request d'ami, sinon on peut pas renvoyer une request (already exist)
     */
    async removeFriend(userId, friendId) {
        await prisma.friend.deleteMany({
            where: {
                OR: [
                    { userId, friendId },
                    { userId: friendId, friendId: userId },
                ],
            },
        });
        await prisma.friendRequest.deleteMany({
            where: {
                OR: [
                    { senderById: userId, receiverById: friendId },
                    { senderById: friendId, receiverById: userId },
                ],
            },
        });
        return ({ message: "Friend removed successfully" });
    }
    // Bon je pense que le nom dit tout, on recup la liste d'amis de l'user
    async getFriendsList(userId) {
        const friends = await prisma.friend.findMany({
            where: { userId },
            include: {
                friend: { select: { id: true, username: true, status: true } },
            },
        });
        return (friends.map((f) => f.friend));
    }
    /**
     * On envoie une request d'ami de la part de senderById a receiverById (mjameau a jchen)
     */
    async sendFriendRequest(senderById, receiverById) {
        if (senderById === receiverById)
            throw new Error("You cannot send a request to yourself");
        const alreadyFriends = await prisma.friend.findFirst({
            where: {
                OR: [
                    { userId: senderById, friendId: receiverById },
                    { userId: receiverById, friendId: senderById }
                ]
            }
        });
        if (alreadyFriends)
            throw new Error("Already friends");
        const existingRequest = await prisma.friendRequest.findFirst({
            where: {
                OR: [
                    { senderById, receiverById },
                    { senderById: receiverById, receiverById: senderById }
                ]
            }
        });
        if (existingRequest)
            throw new Error("Friend request already exists");
        return await prisma.friendRequest.create({
            data: { senderById, receiverById }
        });
    }
    /**
     * On recupere les requests recues sur l'user ID (si moi mathis mon userid c'est 1, je recup les requests que les autres ont envoye a 1)
    */
    async getReceivedRequests(userId) {
        return await prisma.friendRequest.findMany({
            where: {
                receiverById: userId,
                status: "pending"
            },
            include: {
                sendBy: { select: { id: true, username: true, status: true } }
            }
        });
    }
    /**
     * On accepte la request d'ami, on cree les 2 entrees dans la table friend et on met a jour le status de la request -> accepted
     */
    async acceptFriendRequest(requestId, userId) {
        const request = await prisma.friendRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new Error("Request not found");
        if (request.receiverById !== userId)
            throw new Error("Not authorized");
        if (request.status !== "pending")
            throw new Error("Request already processed");
        return await prisma.$transaction([
            prisma.friendRequest.update({
                where: { id: requestId },
                data: { status: "accepted" }
            }),
            prisma.friend.create({ data: { userId: request.senderById, friendId: request.receiverById } }),
            prisma.friend.create({ data: { userId: request.receiverById, friendId: request.senderById } }),
        ]);
    }
    /**
     * Pour rejeter une demande d'ami, on met a jour le status de la request -> rejected
     */
    async rejectFriendRequest(requestId, userId) {
        const request = await prisma.friendRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new Error("Request not found");
        if (request.receiverById !== userId)
            throw new Error("Not authorized");
        return await prisma.friendRequest.update({
            where: { id: requestId },
            data: { status: "rejected" }
        });
    }
}
//# sourceMappingURL=friend.service.js.map
import prisma from "../prisma/client.js";
export class UserService {
    async getUserProfile(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                avatar: true,
                status: true,
                createdAt: true,
            },
        });
        if (!user)
            throw new Error("User not found");
        return (user);
    }
    async updateProfile(userId, data) {
        const updated = await prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, username: true, avatar: true },
        });
        return (updated);
    }
    //Je sais pas si on garde, pas forcement utile sauf si on fait une page d'amis et on peut voir les gens ONLINE / OFFLINE (mais tout le monde en OFFLINE car pas de multijoueur)	
    async getUserStatus(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, username: true, status: true },
        });
        if (!user)
            throw new Error("User not found");
        return (user);
    }
}
//# sourceMappingURL=user.service.js.map
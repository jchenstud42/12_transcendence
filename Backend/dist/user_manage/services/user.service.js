import { hashPassword } from "../../security/passHash.js";
import prisma from "../prisma/client.js";
import { sanitizeInput } from "../../security/inputSecurity.js";
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
        const updateData = {};
        const cleanUsername = sanitizeInput(data.username || "");
        const cleanEmail = sanitizeInput(data.email || "");
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: cleanEmail }, { username: cleanUsername }]
            },
        });
        if (existingUser)
            throw new Error("User already exists");
        if (data.username)
            updateData.username = data.username;
        if (data.avatar)
            updateData.avatar = data.avatar;
        if (data.email)
            updateData.email = data.email;
        if (data.password) {
            updateData.password = await hashPassword(data.password);
        }
        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, username: true, email: true, avatar: true },
        });
        return (updated);
    }
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
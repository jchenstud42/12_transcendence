import prisma from "../prisma/client.js";
import { hashPassword, checkPassword } from "../../security/passHash.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../../security/inputSecurity.js";
import { assertTwoFAMethod } from "../routes/auth.routes.js";
export class AuthService {
    async register(username, email, password) {
        if (!validateEmail(email) || !validatePassword(password) || !validateTextInput(username))
            throw new Error("Invalid input");
        const cleanUsername = sanitizeInput(username);
        const cleanEmail = sanitizeInput(email);
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [{ email: cleanEmail }, { username: cleanUsername }]
            },
        });
        if (existingUser)
            throw new Error("User already exists");
        const hashedPassword = await hashPassword(password);
        return (await prisma.user.create({
            data: { username: cleanUsername, email: cleanEmail, password: hashedPassword },
            select: { id: true, username: true, email: true, status: true, createdAt: true },
        }));
    }
    async login(identifier, password) {
        const cleanIdentifier = sanitizeInput(identifier);
        const user = await prisma.user.findFirst({
            where: {
                OR: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
            },
            select: {
                id: true,
                username: true,
                email: true,
                password: true,
                isTwoFAEnabled: true,
                twoFAMethod: true,
                twoFAdestination: true
            },
        });
        if (!user)
            throw new Error("User not found");
        if (user.password === null)
            throw new Error("User has no password (OAuth account)");
        const valid = await checkPassword(password, user.password);
        if (!valid)
            throw new Error("Invalid credentials");
        await prisma.user.update({ where: { id: user.id }, data: { status: "ONLINE" } });
        const twoFAMethod = assertTwoFAMethod(user.twoFAMethod);
        const destination = user.twoFAdestination || user.email;
        return ({ id: user.id, username: user.username, email: user.email, isTwoFAEnabled: user.isTwoFAEnabled, twoFAMethod, twoFAdestination: destination });
    }
    async logout(userId) {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new Error("User not found");
        await prisma.user.update({ where: { id: userId }, data: { status: "OFFLINE" } });
        return ({ message: "User logged out successfully" });
    }
}
//# sourceMappingURL=auth.services.js.map
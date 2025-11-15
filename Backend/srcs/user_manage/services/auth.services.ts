import prisma from "../prisma/client.js";
import { hashPassword, checkPassword } from "../../security/passHash.js";
import { sanitizeInput, validateEmail, validatePassword, validateTextInput } from "../../security/inputSecurity.js";

export class AuthService {
	async register(username: string, email: string, password: string) {
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

	async login(identifier: string, password: string) {
		const cleanIdentifier = sanitizeInput(identifier);
		const user = await prisma.user.findFirst({
			where: {
				OR: [{ email: cleanIdentifier }, { username: cleanIdentifier }]
			},
		});
		if (!user)
			throw new Error("User not found");

		const valid = await checkPassword(password, user.password);
		if (!valid)
			throw new Error("Invalid credentials");

		await prisma.user.update({ where: { id: user.id }, data: { status: "ONLINE" } });
		return ({ id: user.id, username: user.username, email: user.email });
	}

	async logout(userId: number) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user)
			throw new Error("User not found");

		await prisma.user.update({ where: { id: userId }, data: { status: "OFFLINE" } });
		return ({ message: "User logged out successfully" });
	}
}

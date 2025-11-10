import { hashPassword } from "../../security/passHash.js";
import { validateEmail, validateTextInput, sanitizeInput } from "../../security/inputSecurity.js";

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
	async getUserProfile(userId: string) {
		return (await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				email: true,
				status: true,
				avatar: true,
				createdAt: true,
			},
		}));
	}

	async updateProfile(userId: string, updateData: any) {
		return (await prisma.user.update({
			where: { id: userId },
			data: updateData,
			select: {
				id: true,
				username: true,
				email: true,
				status: true,
				avatar: true,
			},
		}));
	}

	async addFriend(userId: string, friendId: string) {
		return (await prisma.friend.create({
			data: {
				userId,
				friendId,
				status: 'pending',
			},
		}));
	}

	async getFriendsList(userId: string) {
		return (await prisma.friend.findMany({
			where: {
				OR: [
					{ userId },
					{ friendId: userId },
				],
			},
			include: {
				user: true,
				friend: true,
			},
		}));
	}

	async removeFriend(userId: string, friendId: string) {
		return (await prisma.friend.deleteMany({
			where: {
				OR: [
					{ userId, friendId },
					{ userId: friendId, friendId: userId },
				],
			},
		}));
	}

	async getMatchHistory(userId: string) {
		return (await prisma.match.findMany({
			where: {
				OR: [
					{ player1Id: userId },
					{ player2Id: userId },
				],
			},
			include: {
				player1: true,
				player2: true,
			},
		}));
	}

	async addMatch(matchData: any) {
		return (await prisma.match.create({
			data: matchData,
		}));
	}

	async getUserStatus(userId: string) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { status: true },
		});
		return (user?.status);
	}

	async login(username: string, password: string) {
		const user = await prisma.user.findUnique({
			where: { username },
		});

		if (!user || !await bcrypt.compare(password, user.password)) {
			throw new Error('Invalid credentials');
		}

		await prisma.user.update({
			where: { id: user.id },
			data: { status: 'online' },
		});

		return ({ user: { id: user.id, username: user.username } });
	}

	async logout(userId: string) {
		return (await prisma.user.update({
			where: { id: userId },
			data: { status: 'offline' },
		}));
	}

	async register(userData: { username: string; email: string; password: string }) {
		const { username, email, password } = userData;

		const existingUser = await prisma.user.findFirst({
			where: {
				OR: [
					{ email },
					{ username }
				]
			}
		});

		if (existingUser) {
			throw new Error("User already exists");
		}
		const newUser = await prisma.user.create({
			data: {
				username,
				email,
				password,
			},
			select: {
				id: true,
				username: true,
				email: true,
				status: true,
				createdAt: true,
			}
		});

		return newUser;
	}


}
import prisma from "../prisma/client.js";

export class UserService {
	async getUserProfile(userId: number) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				username: true,
				email: true,
				avatarUrl: true,
				bio: true,
				status: true,
				createdAt: true,
			},
		});
		if (!user)
			throw new Error("User not found");
		return (user);
	}

	async updateProfile(userId: number, data: { username?: string; bio?: string; avatarUrl?: string }) {
		const updated = await prisma.user.update({
			where: { id: userId },
			data,
			select: { id: true, username: true, bio: true, avatarUrl: true, updatedAt: true },
		});
		return (updated);
	}

	async getUserStatus(userId: number) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: { id: true, username: true, status: true },
		});
		if (!user)
			throw new Error("User not found");
		return (user);
	}
}

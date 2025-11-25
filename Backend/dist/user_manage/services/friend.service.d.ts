export declare class FriendService {
    addFriend(userId: number, friendId: number): Promise<[{
        userId: number;
        id: number;
        createdAt: Date;
        friendId: number;
    }, {
        userId: number;
        id: number;
        createdAt: Date;
        friendId: number;
    }]>;
    removeFriend(userId: number, friendId: number): Promise<{
        message: string;
    }>;
    getFriendsList(userId: number): Promise<{
        id: number;
        username: string;
        status: string;
    }[]>;
}
//# sourceMappingURL=friend.service.d.ts.map
export declare class UserService {
    getUserProfile(userId: string): Promise<any>;
    updateProfile(userId: string, updateData: any): Promise<any>;
    addFriend(userId: string, friendId: string): Promise<any>;
    getFriendsList(userId: string): Promise<any>;
    removeFriend(userId: string, friendId: string): Promise<any>;
    getMatchHistory(userId: string): Promise<any>;
    addMatch(matchData: any): Promise<any>;
    getUserStatus(userId: string): Promise<any>;
    login(username: string, password: string): Promise<{
        user: {
            id: any;
            username: any;
        };
    }>;
    logout(userId: string): Promise<any>;
    register(userData: {
        username: string;
        email: string;
        password: string;
    }): Promise<any>;
}
//# sourceMappingURL=user.service.d.ts.map
export declare class ChatService {
    private messages;
    addMessage(user: string, message: string): {
        user: string;
        message: string;
        timestamp: Date;
    };
    getMessages(): {
        user: string;
        message: string;
        timestamp: Date;
    }[];
}

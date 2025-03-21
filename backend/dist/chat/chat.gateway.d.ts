import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
export declare class ChatGateway {
    private chatService;
    server: Server;
    constructor(chatService: ChatService);
    handleMessage(data: {
        user: string;
        message: string;
    }, client: Socket): {
        user: string;
        message: string;
        timestamp: Date;
    };
    handleRequestMessages(): {
        user: string;
        message: string;
        timestamp: Date;
    }[];
}

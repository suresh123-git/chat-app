import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers = new Map<string, Socket>();

  constructor(
    private chatService: ChatService,
    private jwtService: JwtService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const userId = payload.sub;
      client.data.userId = userId;
      
      // Join user's room
      client.join(userId);
      this.connectedUsers.set(userId, client);
      
      // Update user status to online
      await this.chatService.updateUserStatus(userId, true);
      
      // Broadcast updated online users list
      const onlineUsers = await this.chatService.getOnlineUsers();
      this.server.emit('onlineUsers', onlineUsers);
    } catch (error) {
      console.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: Socket) {
    if (client.data.userId) {
      // Remove from connected users
      this.connectedUsers.delete(client.data.userId);
      
      // Update user status to offline
      await this.chatService.updateUserStatus(client.data.userId, false);
      
      // Broadcast updated online users list
      const onlineUsers = await this.chatService.getOnlineUsers();
      this.server.emit('onlineUsers', onlineUsers);
    }
  }

  @SubscribeMessage('message')
  async handleMessage(client: Socket, payload: { content: string; receiverId: string }) {
    try {
      const senderId = client.data.userId;
      console.log('Handling message:', { senderId, receiverId: payload.receiverId, content: payload.content });
      
      const message = await this.chatService.saveMessage(senderId, payload.receiverId, payload.content);
      console.log('Saved message:', message);
      
      // Emit to both sender's and receiver's rooms
      this.server.to(senderId).to(payload.receiverId).emit('message', message);
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('error', { message: 'Failed to send message' });
    }
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, payload: { userId: string }) {
    try {
      // Join the user's room
      client.join(payload.userId);
      console.log(`User ${payload.userId} joined their room`);
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  @SubscribeMessage('markRead')
  async handleMarkRead(client: Socket, payload: { senderId: string }) {
    try {
      const receiverId = client.data.userId;
      await this.chatService.markMessagesAsRead(payload.senderId, receiverId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }
} 
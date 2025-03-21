import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';
import { io, Socket } from 'socket.io-client';
import { AuthService } from './auth.service';
import { User } from '../types/user.types';
import { map } from 'rxjs/operators';

export interface Message {
  _id: string;
  sender: User;
  receiver: User;
  content: string;
  timestamp: Date;
  read: boolean;
}

export interface ChatRoom {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  unreadCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService implements OnDestroy {
  private socket!: Socket;
  private messagesSubject = new BehaviorSubject<Message[]>([]);
  private roomsSubject = new BehaviorSubject<ChatRoom[]>([]);
  private onlineUsersSubject = new BehaviorSubject<User[]>([]);
  private currentRoomSubject = new BehaviorSubject<ChatRoom | null>(null);
  private destroy$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private initializeSocket() {
    const token = this.authService.getToken();
    if (!token) return;

    // Connect to the chat namespace
    this.socket = io(`${environment.apiUrl}/chat`, {
      auth: { token },
      transports: ['websocket'],
      path: '/socket.io'
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      const userId = this.authService.currentUserSubject.value?._id;
      if (userId) {
        // Join user's room
        this.socket.emit('join', { userId });
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });

    this.socket.on('message', (message: Message) => {
      console.log('Received message:', message);
      const currentMessages = this.messagesSubject.value;
      const messageExists = currentMessages.some(m => m._id === message._id);
      if (!messageExists) {
        const updatedMessages = [...currentMessages, message].sort((a, b) => 
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        this.messagesSubject.next(updatedMessages);
      }
    });

    this.socket.on('onlineUsers', (users: User[]) => {
      console.log('Received online users:', users);
      this.onlineUsersSubject.next(users);
    });

    this.socket.on('roomUpdate', (room: ChatRoom) => {
      const currentRooms = this.roomsSubject.value;
      const updatedRooms = currentRooms.map(r => 
        r._id === room._id ? room : r
      );
      this.roomsSubject.next(updatedRooms);
    });
  }

  connect() {
    if (!this.socket?.connected) {
      this.initializeSocket();
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }

  sendMessage(receiverId: string, content: string) {
    const senderId = this.authService.currentUserSubject.value?._id;
    if (senderId && this.socket?.connected) {
      console.log('Sending message:', { content, receiverId });
      this.socket.emit('message', { content, receiverId });
    } else {
      console.error('Socket not connected or sender ID missing');
    }
  }

  getMessages(userId: string): Observable<Message[]> {
    return this.http.get<Message[]>(`${environment.apiUrl}/chat/messages/${userId}`)
      .pipe(
        map(messages => {
          console.log('Fetched messages:', messages);
          const sortedMessages = messages.sort((a, b) => 
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          );
          this.messagesSubject.next(sortedMessages);
          return sortedMessages;
        })
      );
  }

  getOnlineUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${environment.apiUrl}/chat/online-users`)
      .pipe(
        map(users => {
          this.onlineUsersSubject.next(users);
          return users;
        })
      );
  }

  markMessagesAsRead(senderId: string) {
    if (this.socket?.connected) {
      this.socket.emit('markRead', { senderId });
    }
  }

  getMessages$(): Observable<Message[]> {
    return this.messagesSubject.asObservable();
  }

  getOnlineUsers$(): Observable<User[]> {
    return this.onlineUsersSubject.asObservable();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
} 
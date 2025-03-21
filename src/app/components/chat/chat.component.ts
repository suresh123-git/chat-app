import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { ChatService, Message } from '../../services/chat.service';
import { User } from '../../types/user.types';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { DatePipe, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatToolbarModule,
    MatMenuModule,
    MatSidenavModule
  ],
  template: `
    <div class="chat-container">
      <mat-toolbar color="primary" class="chat-toolbar">
        <button mat-icon-button (click)="toggleSidenav()">
          <mat-icon>menu</mat-icon>
        </button>
        <span>Chat Application</span>
        <span class="toolbar-spacer"></span>
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item (click)="logout()">
            <mat-icon>exit_to_app</mat-icon>
            <span>Logout</span>
          </button>
        </mat-menu>
      </mat-toolbar>

      <mat-sidenav-container class="chat-sidenav-container">
        <mat-sidenav #sidenav mode="side" [opened]="true" class="chat-sidenav">
          <div class="users-list">
            <h3>Online Users</h3>
            <mat-nav-list>
              <mat-list-item *ngFor="let user of onlineUsers" 
                            (click)="selectUser(user)"
                            [class.selected]="selectedUser?._id === user._id">
                <span matListItemTitle>{{ user.username }}</span>
                <span matListItemLine [class.online]="user.isOnline">●</span>
              </mat-list-item>
            </mat-nav-list>
          </div>
        </mat-sidenav>

        <mat-sidenav-content class="chat-content">
          <div class="chat-messages" #messagesContainer>
            <div *ngIf="selectedUser" class="chat-header">
              <h3>{{ selectedUser.username }}</h3>
            </div>
            
            <div class="messages-list">
              <ng-container *ngIf="messages && messages.length > 0; else noMessages">
                <div *ngFor="let message of messages" 
                     [class.sent]="isSentByCurrentUser(message)"
                     class="message">
                  <div class="message-content">
                    <div class="message-sender" *ngIf="!isSentByCurrentUser(message)">
                      {{ getSenderName(message) }}
                    </div>
                    <div class="message-text">
                      {{ message.content }}
                    </div>
                  </div>
                  <div class="message-time">
                    {{ formatDate(message.timestamp) }}
                  </div>
                </div>
              </ng-container>
              <ng-template #noMessages>
                <div class="no-messages" *ngIf="selectedUser">
                  No messages yet. Start the conversation!
                </div>
              </ng-template>
            </div>
            
            <div class="message-input" *ngIf="selectedUser">
              <mat-form-field appearance="outline" class="message-field">
                <input matInput [(ngModel)]="newMessage" 
                       (keyup.enter)="sendMessage()"
                       placeholder="Type a message...">
              </mat-form-field>
              <button mat-raised-button color="primary" (click)="sendMessage()">
                <mat-icon>send</mat-icon>
              </button>
            </div>
          </div>
        </mat-sidenav-content>
      </mat-sidenav-container>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      background: #f5f5f5;
    }

    .chat-toolbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 2;
    }

    .toolbar-spacer {
      flex: 1 1 auto;
    }

    .chat-sidenav-container {
      flex: 1;
      margin-top: 64px;
    }

    .chat-sidenav {
      width: 250px;
      background: white;
    }

    .chat-content {
      background: white;
      height: calc(100vh - 64px);
    }

    .users-list {
      padding: 16px;
    }

    .users-list h3 {
      margin-bottom: 16px;
      color: #666;
    }

    .selected {
      background-color: #e3f2fd;
    }

    .online {
      color: #4caf50;
    }

    .chat-messages {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .chat-header {
      padding: 16px;
      border-bottom: 1px solid #ddd;
      background: #f5f5f5;
    }

    .messages-list {
      flex: 1;
      padding: 16px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .no-messages {
      text-align: center;
      color: #666;
      margin-top: 20px;
    }

    .message {
      margin-bottom: 16px;
      max-width: 70%;
      display: flex;
      flex-direction: column;
    }

    .message.sent {
      margin-left: auto;
      align-items: flex-end;
    }

    .message-sender {
      font-size: 12px;
      color: #666;
      margin-bottom: 4px;
    }

    .message-text {
      word-break: break-word;
    }

    .message.sent .message-content {
      background: #e3f2fd;
      color: #000;
    }

    .message-content {
      padding: 12px;
      border-radius: 12px;
      background: #f0f0f0;
    }

    .message-time {
      font-size: 12px;
      color: #999;
      margin-top: 4px;
    }

    .message-input {
      padding: 16px;
      border-top: 1px solid #ddd;
      display: flex;
      gap: 8px;
      background: #f5f5f5;
    }

    .message-field {
      flex: 1;
    }

    :host-context(.dark-theme) {
      .chat-container {
        background: #121212;
      }

      .chat-sidenav {
        background: #1e1e1e;
      }

      .chat-content {
        background: #1e1e1e;
      }

      .users-list h3 {
        color: #bbb;
      }

      .chat-header {
        background: #2d2d2d;
        border-bottom-color: #404040;
      }

      .message-content {
        background: #2d2d2d;
        color: #fff;
      }

      .message.sent .message-content {
        background: #1a237e;
      }

      .message-input {
        background: #2d2d2d;
        border-top-color: #404040;
      }

      .no-messages {
        color: #bbb;
      }
    }
  `],
  providers: [DatePipe]
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('messagesContainer') private messagesContainer!: ElementRef;
  @ViewChild('sidenav') sidenav!: any;
  
  currentUser: User | null = null;
  selectedUser: User | null = null;
  onlineUsers: User[] = [];
  messages: Message[] = [];
  newMessage: string = '';
  private subscriptions: Subscription[] = [];

  constructor(
    private chatService: ChatService,
    private authService: AuthService,
    private router: Router,
    private datePipe: DatePipe
  ) {
    this.currentUser = this.authService.currentUserSubject.value;
  }

  ngOnInit() {
    if (!this.currentUser) {
      this.router.navigate(['/login']);
      return;
    }

    // Connect to WebSocket
    this.chatService.connect();

    // Subscribe to online users
    this.subscriptions.push(
      this.chatService.getOnlineUsers$().subscribe(users => {
        console.log('Online users updated:', users);
        this.onlineUsers = users.filter(user => user._id !== this.currentUser?._id);
      })
    );

    // Subscribe to messages
    this.subscriptions.push(
      this.chatService.getMessages$().subscribe(messages => {
        console.log('Messages updated:', messages);
        if (this.selectedUser) {
          // Filter messages for the selected user
          this.messages = messages.filter(msg => {
            const senderId = msg.sender?._id || msg.sender;
            const receiverId = msg.receiver?._id || msg.receiver;
            return (senderId === this.currentUser?._id && receiverId === this.selectedUser?._id) ||
                   (senderId === this.selectedUser?._id && receiverId === this.currentUser?._id);
          });
          console.log('Filtered messages:', this.messages);
          this.scrollToBottom();
        }
      })
    );

    // Fetch initial online users
    this.chatService.getOnlineUsers().subscribe({
      next: (users) => {
        console.log('Initial online users:', users);
        this.onlineUsers = users.filter(user => user._id !== this.currentUser?._id);
      },
      error: (error) => {
        console.error('Error fetching online users:', error);
      }
    });
  }

  selectUser(user: User) {
    console.log('Selecting user:', user);
    this.selectedUser = user;
    if (this.currentUser) {
      this.chatService.getMessages(user._id).subscribe({
        next: (messages) => {
          console.log('Messages loaded:', messages);
          // Filter messages for the selected user
          this.messages = messages.filter(msg => {
            const senderId = msg.sender?._id || msg.sender;
            const receiverId = msg.receiver?._id || msg.receiver;
            const isValidMessage = (senderId === this.currentUser?._id && receiverId === user._id) ||
                                 (senderId === user._id && receiverId === this.currentUser?._id);
            
            // Log message details for debugging
            console.log('Message details:', {
              messageId: msg._id,
              senderId,
              receiverId,
              senderObject: msg.sender,
              receiverObject: msg.receiver,
              isValid: isValidMessage
            });
            
            return isValidMessage;
          });
          console.log('Filtered messages:', this.messages);
          this.scrollToBottom();
        },
        error: (error) => {
          console.error('Error loading messages:', error);
        }
      });
    }
  }

  sendMessage() {
    if (this.newMessage.trim() && this.selectedUser && this.currentUser) {
      console.log('Sending message to:', this.selectedUser.username);
      this.chatService.sendMessage(this.selectedUser._id, this.newMessage.trim());
      this.newMessage = '';
    }
  }

  formatDate(date: Date): string {
    return this.datePipe.transform(date, 'shortTime') || '';
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        const element = this.messagesContainer.nativeElement;
        element.scrollTop = element.scrollHeight;
      }, 100);
    } catch (err) {
      console.error('Error scrolling to bottom:', err);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleSidenav() {
    this.sidenav.toggle();
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  isSentByCurrentUser(message: any): boolean {
    const senderId = message.sender?._id || message.sender;
    const currentUserId = this.currentUser?._id;
    console.log('Checking if sent by current user:', {
      senderId,
      currentUserId,
      isSent: senderId === currentUserId
    });
    return senderId === currentUserId;
  }

  getSenderName(message: any): string {
    // Get the actual sender ID from the message
    console.log(message, 'afksdjfsjhjfhj');
    
    const senderId = message.sender?._id || message.receiver;
    console.log(this.onlineUsers,'askjjfsjfhsdjj', senderId);
    
    
    // Find the sender in our online users list
    const senderUser = this.onlineUsers.find(user => user._id === senderId);
    console.log(senderUser,'sdjgsdgfsjdhj');
    
    if (senderUser) {
      return senderUser.username;
    }
    
    // If not found in online users, check if it's the selected user
    if (this.selectedUser && this.selectedUser._id === senderId) {
      return this.selectedUser.username;
    }
    
    // If not found in online users or selected user, check if it's the current user
    if (this.currentUser && this.currentUser._id === senderId) {
      return this.currentUser.username;
    }
    
    // If we still can't find the sender, return Unknown User
    return 'Unknown User';
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.chatService.disconnect();
  }
} 
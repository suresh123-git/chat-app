import { Controller, Get, UseGuards, Req, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { Request } from 'express';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('messages/:userId')
  async getMessages(@Req() req: any, @Param('userId') userId: string) {
    return this.chatService.getMessages(req.user.userId, userId);
  }

  @Get('online-users')
  async getOnlineUsers() {
    return this.chatService.getOnlineUsers();
  }
} 
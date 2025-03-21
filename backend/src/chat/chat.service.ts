import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Message, MessageDocument } from './schemas/message.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
  ) {}

  async createUser(username: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
    });
    return user.save();
  }

  async findUserByUsername(username: string): Promise<User> {
    return this.userModel.findOne({ username }).exec();
  }

  async findUserById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async updateUserStatus(userId: string, isOnline: boolean): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(
        userId,
        { isOnline, lastSeen: new Date() },
        { new: true }
      )
      .exec();
  }

  async createMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const message = new this.messageModel({
      sender: senderId,
      receiver: receiverId,
      content,
    });
    return message.save();
  }

  async getMessagesBetweenUsers(user1Id: string, user2Id: string): Promise<Message[]> {
    return this.messageModel
      .find({
        $or: [
          { sender: user1Id, receiver: user2Id },
          { sender: user2Id, receiver: user1Id },
        ],
      })
      .sort({ timestamp: 1 })
      .exec();
  }

  async getOnlineUsers(): Promise<User[]> {
    return this.userModel.find({}, { password: 0 }).exec();
  }

  async getMessages(senderId: string, receiverId: string) {
    return this.messageModel.find({
      $or: [
        { sender: senderId, receiver: receiverId },
        { sender: receiverId, receiver: senderId }
      ]
    }).sort({ timestamp: 1 }).exec();
  }

  async saveMessage(senderId: string, receiverId: string, content: string) {
    const message = new this.messageModel({
      sender: senderId,
      receiver: receiverId,
      content,
      timestamp: new Date(),
      read: false
    });
    return message.save();
  }

  async markMessagesAsRead(senderId: string, receiverId: string): Promise<void> {
    await this.messageModel
      .updateMany(
        {
          sender: senderId,
          receiver: receiverId,
          isRead: false,
        },
        { isRead: true }
      )
      .exec();
  }
} 
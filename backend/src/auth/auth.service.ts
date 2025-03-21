import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../chat/schemas/user.schema';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ username }).exec();
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.username, 
      sub: user._id,
      email: user.email
    };
    
    const token = this.jwtService.sign(payload);
    
    return {
      access_token: token,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        isOnline: true,
        lastSeen: new Date()
      },
    };
  }

  async register(username: string, email: string, password: string) {
    const existingUser = await this.userModel.findOne({ 
      $or: [{ username }, { email }] 
    }).exec();

    if (existingUser) {
      throw new UnauthorizedException('Username or email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new this.userModel({
      username,
      email,
      password: hashedPassword,
      isOnline: true,
      lastSeen: new Date()
    });

    await user.save();
    const { password: _, ...result } = user.toObject();
    
    // Generate token for the new user
    const payload = { 
      username: user.username, 
      sub: user._id,
      email: user.email
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: result
    };
  }
} 
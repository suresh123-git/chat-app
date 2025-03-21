import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  email: string;

  @Prop({ default: false })
  isOnline: boolean;

  @Prop({ default: Date.now })
  lastSeen: Date;
}

export const UserSchema = SchemaFactory.createForClass(User); 
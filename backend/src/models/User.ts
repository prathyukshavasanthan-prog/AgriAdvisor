import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  name: string;
  phone_number: string;
  password_hash: string;
  preferred_language: string;
  latitude?: number;
  longitude?: number;
  created_at: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    phone_number: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
      index: true,
    },
    password_hash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    preferred_language: {
      type: String,
      default: 'en',
      trim: true,
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

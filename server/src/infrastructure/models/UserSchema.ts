import mongoose, { Schema, Document } from 'mongoose';

// Extend the Document interface to include User fields
export interface IUserDocument extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
}

// Define the Schema
const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true, // Enforces the unique index
    trim: true,
    lowercase: true 
  },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
  created_at: { type: Date, default: Date.now }
});

export default mongoose.model<IUserDocument>('User', UserSchema);
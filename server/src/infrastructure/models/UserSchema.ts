import mongoose, { Schema, Document } from 'mongoose';
import { businessRules } from '../../constants/businessRules';

// Extend the Document interface to include User fields
export interface IUserDocument extends Document {
  name: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'user';
  created_at: Date;
  updated_at: Date;
}

// Define the Schema
const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    trim: true,
    lowercase: true,
    maxLength: businessRules.MAX_EMAIL_LENGTH 
  },
  password_hash: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['admin', 'user'], 
    default: 'user' 
  },
}, {
  timestamps: {
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  }
}
);

export default mongoose.model<IUserDocument>('User', UserSchema);
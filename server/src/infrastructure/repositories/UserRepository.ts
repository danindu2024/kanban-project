import User, { IUserDocument } from '../models/UserSchema';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { User as UserEntity } from '../../domain/entities/User';

export class UserRepository implements IUserRepository {
  
  async findByEmail(email: string): Promise<UserEntity | null> {
    const userDoc = await User.findOne({ email });
    if (!userDoc) return null;
    
    return this.mapToEntity(userDoc);
  }

  async findById(id: string): Promise<UserEntity | null> {
    const userDoc = await User.findById(id);
    if (!userDoc) return null;
    
    return this.mapToEntity(userDoc);
  }

  async create(userData: {
    name: string;
    email: string;
    password_hash: string;
    role?: 'admin' | 'user';
  }): Promise<UserEntity> {
    const newUser = new User(userData);
    const savedUser = await newUser.save();
    
    return this.mapToEntity(savedUser);
  }

  // Add mapper method
  private mapToEntity(doc: IUserDocument): UserEntity {
    return {
      id: doc._id.toString(),
      name: doc.name,
      email: doc.email,
      password_hash: doc.password_hash,
      role: doc.role,
      created_at: doc.created_at
    };
  }
}
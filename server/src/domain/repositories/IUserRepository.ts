import { User } from '../entities/User';

export interface IUserRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(userData: {
    name: string;
    email: string;
    password_hash: string;
    role?: 'admin' | 'user';
  }): Promise<User>;
}
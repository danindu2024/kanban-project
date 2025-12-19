import User, { IUserDocument } from '../infrastructure/models/UserSchema';

export class UserRepository {
  
  // Find a user by email (for login/registration checks)
  async findByEmail(email: string): Promise<IUserDocument | null> {
    return await User.findOne({ email });
  }

  // Create a new user
  async create(user: Partial<IUserDocument>): Promise<IUserDocument> {
    const newUser = new User(user);
    return await newUser.save();
  }
  
  // Find by ID (for "Get Me" route)
  async findById(id: string): Promise<IUserDocument | null> {
    return await User.findById(id).select('-password_hash'); // Exclude password
  }
}
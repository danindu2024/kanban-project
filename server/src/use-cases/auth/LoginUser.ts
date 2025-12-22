import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';

interface LoginRequest {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  private userRepository: IUserRepository;

  // Inject the interface via constructor
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }: LoginRequest) {
    // Check if user exists
    const user = await this.userRepository.findByEmail(email);
    
    // Note: It's good practice to return generic errors for security, which you already did.
    if (!user) {
      throw new Error('Invalid credentials'); 
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate Token
    // FIX: Use 'user.id' (Domain Entity), not 'user._id' (Database Model)
    const token = generateToken(user.id);
    
    return {
      id: user.id, // Return 'id' to be consistent with your API
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };
  }
}
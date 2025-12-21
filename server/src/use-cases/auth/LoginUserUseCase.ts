import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/UserRepository';
import generateToken from '../../utils/generateToken';

interface LoginRequest {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute({ email, password }: LoginRequest) {
    // Check if user exists
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials'); // Generic error for security
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate Token
    const token = generateToken(user._id.toString());
    
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };
  }
}
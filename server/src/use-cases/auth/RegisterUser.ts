import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

interface RegisterResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export class RegisterUserUseCase {
  private userRepository: IUserRepository;

  // Use Constructor Injection
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ name, email, password }: RegisterRequest): Promise<RegisterResponse> {
    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new Error('User already exists');
    }

    // Validate password length
    if (password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }

    //length checks to prevent resource exhaustion attacks
    if (name.length > 100) {
      throw new Error('Name must not exceed 100 characters');
    }

    if (email.length > 255) {
      throw new Error('Email must not exceed 255 characters');
    }

    if (password.length > 128) {
      throw new Error('Password must not exceed 128 characters');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await this.userRepository.create({
      name,
      email,
      password_hash: passwordHash,
      role: 'user',
    });

    // generate token
    const token = generateToken(newUser.id); 

    return {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    };
  }
}
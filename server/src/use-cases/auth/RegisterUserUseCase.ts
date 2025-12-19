import bcrypt from 'bcryptjs';
import { UserRepository } from '../../repositories/UserRepository';
import generateToken from '../../utils/generateToken';

interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export class RegisterUserUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute({ name, email, password }: RegisterRequest) {
    // Check if user exists
    const userExists = await this.userRepository.findByEmail(email);
    if (userExists) {
      throw new Error('User already exists');
    }

    // Hash password (Salt rounds: 10)
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user via Repository
    const newUser = await this.userRepository.create({
      name,
      email,
      password_hash: passwordHash,
      role: 'user', // Default role
    });

    // Generate Token
    const token = generateToken(newUser._id.toString());

    // Return success data (exclude password!)
    return {
      _id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      token,
    };
  }
}
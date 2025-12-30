import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';

interface LoginRequestDTO {
  email: string;
  password: string;
}

interface LoginResponseDTO{
  id: string
  name: string
  email: string
  role: string
  token: string
}

export class LoginUserUseCase {
  private userRepository: IUserRepository;

  // Inject the interface via constructor
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
  }

  async execute({ email, password }: LoginRequestDTO): Promise<LoginResponseDTO> {
    // Check if user exists
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new Error('Invalid credentials'); 
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new Error('Invalid credentials');
    }

    // Generate Token
    const token = generateToken(user.id);
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      token,
    };
  }
}
import bcrypt from 'bcryptjs';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { generateToken } from '../../utils/jwt';
import { AppError } from '../../utils/AppError';
import { ErrorCodes } from '../../constants/errorCodes';

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

    // Basic presence validation
    if (!email || !password) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Missing email or password', 401);
    }

    // Validate email format
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid email or password', 401);
    }

    // Check if user exists
    const user = await this.userRepository.findByEmail(email);
    
    if (!user) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials', 401); 
    }

    // Check if password matches
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError(ErrorCodes.INVALID_CREDENTIALS, 'Invalid credentials', 401);
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